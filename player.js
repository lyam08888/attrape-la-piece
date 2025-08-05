import { TILE } from './world.js';
import { getItemIcon } from './itemIcons.js';

export class Player {
    constructor(x, y, config, soundManager) {
        // --- Core Properties ---
        this.x = x;
        this.y = y;
        this.w = config.player.width;
        this.h = config.player.height;
        this.config = config;
        this.sound = soundManager;

        // --- Physics & Movement ---
        this.vx = 0;
        this.vy = 0;
        this.speed = config.physics.playerSpeed;
        this.isGrounded = false;
        this.isOnWall = 0; // -1 for left, 1 for right, 0 for none
        this.canDoubleJump = true;
        this.isGliding = false;
        this.isCrouching = false;

        // --- RPG Stats ---
        this.baseMaxHealth = 100;
        this.baseMaxMana = 50;
        this.baseMaxStamina = 80;
        this.maxHealth = this.baseMaxHealth;
        this.health = this.maxHealth;
        this.maxMana = this.baseMaxMana;
        this.mana = this.maxMana;
        this.maxStamina = this.baseMaxStamina;
        this.stamina = this.maxStamina;
        this.stats = {
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            strength: 10,
            defense: 5,
            agility: 10,
            intelligence: 5,
            luck: 7,
            speed: 10,
        };
        
        // Bonus d'équipement
        this.equipmentBonuses = {
            health: 0, mana: 0, stamina: 0,
            strength: 0, defense: 0, agility: 0, intelligence: 0,
            attack: 0, magicAttack: 0, criticalChance: 0,
            speed: 0, magicResistance: 0, holyDamage: 0
        };
        
        // Stats calculées
        this.totalAttack = 0;
        this.totalDefense = 0;
        this.totalSpeed = 0;
        
        // Classe de personnage (sera définie plus tard)
        this.characterClass = null;
        
        // Effets visuels
        this.damageFlash = 0;

        // --- Tools & Inventory ---
        this.tools = ['tool_pickaxe', 'tool_axe', 'tool_shovel'];
        this.selectedToolIndex = 0;
        this.toolDurability = { tool_pickaxe: 100, tool_axe: 100, tool_shovel: 100 };
        this.durability = { ...this.toolDurability };
        this.inventory = {}; // itemType -> count

        // --- Animation ---
        this.facing = 1; // 1 for right, -1 for left
        this.currentAnimation = 'idle';
        this.frame = 0;
        this.frameTimer = 0;
    }

    update(keys, game, delta) {
        if (!game || !game.tileMap) return;

        const physics = this.config.physics;

        // --- Mouvements ---
        this.handleMovement(keys, physics);

        // --- Actions du joueur ---
        this.handleActions(keys, game, delta);
        
        // --- Gravité et Collisions ---
        this.applyGravity(physics);
        this.handleCollisions(game);
        
        // --- Systèmes de survie ---
        this.updateSurvivalStats(delta, game.foodSystem);

        // --- Régénération des stats RPG ---
        this.regenerateStats(delta);
        
        // Mettre à jour les effets visuels
        if (this.damageFlash > 0) {
            this.damageFlash -= delta;
        }
    }

    handleMovement(keys, physics) {
        let targetSpeed = 0;
        if (keys.left) {
            targetSpeed = -this.speed;
            this.facing = -1;
        }
        if (keys.right) {
            targetSpeed = this.speed;
            this.facing = 1;
        }
        
        const accel = this.isGrounded ? (physics.groundAcceleration || 0.4) : (physics.airAcceleration || 0.2);
        this.vx += (targetSpeed - this.vx) * accel;

        const friction = this.isGrounded ? (physics.friction || 0.85) : (physics.airResistance || 0.98);
        this.vx *= friction;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;

        if (keys.jump && (this.isGrounded || this.canDoubleJump)) {
            if (this.isGrounded) {
                this.vy = -physics.jumpForce;
                this.isGrounded = false;
                this.canDoubleJump = true;
            } else if (this.canDoubleJump) {
                this.vy = -physics.jumpForce * 0.8;
                this.canDoubleJump = false;
            }
        }
    }

    applyGravity(physics) {
        this.vy += physics.gravity;
        if (this.vy > physics.maxFallSpeed) {
            this.vy = physics.maxFallSpeed;
        }
    }

    handleActions(keys, game, delta) {
        // --- Utilisation d'objets avec les touches numériques ---
        if (keys['1'] || keys['2'] || keys['3'] || keys['4']) {
            const slotNumber = keys['1'] ? 1 : keys['2'] ? 2 : keys['3'] ? 3 : 4;
            this.useQuickSlot(slotNumber, game);
        }
        
        // --- Minage et Construction ---
        if (game.mouse?.left || keys.action) {
            this.handleMining(game, delta);
        } else {
            // Réinitialiser le minage si le bouton est relâché
            this.miningTarget = null;
            this.miningProgress = 0;
            if (game.miningEffect) game.miningEffect = null;
        }

        if (game.mouse?.right) {
            this.handleBuilding(game);
        }

        // --- Combat ---
        if (keys.attack) { // Supposons une touche "attack"
             this.handleCombat(game);
        }
        
        // --- Compétences de classe ---
        if (keys['q'] && this.characterClass) {
            this.useClassSkill(0, game); // Première compétence
        }
        if (keys['w'] && this.characterClass) {
            this.useClassSkill(1, game); // Deuxième compétence
        }
    }
    
    handleMining(game, delta) {
        const { tileSize } = this.config;
        const mouseX = game.mouse.x / this.config.zoom + game.camera.x;
        const mouseY = game.mouse.y / this.config.zoom + game.camera.y;
        
        const tileX = Math.floor(mouseX / tileSize);
        const tileY = Math.floor(mouseY / tileSize);

        const dist = Math.hypot(this.x - mouseX, this.y - mouseY);
        if (dist > tileSize * 3) { // Portée de minage
            this.miningTarget = null;
            return;
        }
        
        const blockType = game.tileMap[tileY]?.[tileX];
        if (!blockType || blockType === TILE.AIR) return;

        if (!this.miningTarget || this.miningTarget.x !== tileX || this.miningTarget.y !== tileY) {
            this.miningTarget = { x: tileX, y: tileY, type: blockType };
            this.miningProgress = 0;
            if(game.logger) game.logger.log(`Début du minage du bloc ${blockType} à (${tileX},${tileY})`, 'action');
        }
        
        if (game.miningEngine && typeof game.miningEngine.updateMining === 'function') {
            // Le moteur de minage a besoin de `delta` en secondes
            game.miningEngine.updateMining(game, keys, game.mouse, delta * 1000);
        }
    }
    
    handleBuilding(game) {
        const { tileSize } = this.config;
        const mouseX = game.mouse.x / this.config.zoom + game.camera.x;
        const mouseY = game.mouse.y / this.config.zoom + game.camera.y;

        const tileX = Math.floor(mouseX / tileSize);
        const tileY = Math.floor(mouseY / tileSize);

        // Vérifier si le joueur a le bloc dans son inventaire
        const blockToPlace = TILE.DIRT; // Exemple: toujours placer de la terre
        if (this.inventory[blockToPlace] > 0) {
            if (game.tileMap[tileY]?.[tileX] === TILE.AIR) {
                game.tileMap[tileY][tileX] = blockToPlace;
                this.inventory[blockToPlace]--;
                if(game.logger) game.logger.log(`Bloc ${blockToPlace} placé à (${tileX},${tileY})`, 'action');
            }
        }
    }
    
    handleCombat(game) {
        if (!game.enemies || game.enemies.length === 0) return;
        
        const attackRange = 40; // Portée d'attaque du joueur
        let targetEnemy = null;
        let closestDistance = attackRange;
        
        // Trouver l'ennemi le plus proche dans la portée
        game.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
            if (dist < closestDistance) {
                targetEnemy = enemy;
                closestDistance = dist;
            }
        });
        
        if (targetEnemy) {
            this.attackEnemy(targetEnemy, game);
        }
    }
    
    attackEnemy(enemy, game) {
        // Calculer les dégâts
        const baseDamage = this.totalAttack || this.stats.strength;
        const critChance = (this.tempCritBonus || 0) + (this.equipmentBonuses?.criticalChance || 0);
        const isCritical = Math.random() * 100 < critChance;
        
        let damage = baseDamage + Math.floor(Math.random() * 5); // Variation aléatoire
        if (isCritical) {
            damage *= 2;
        }
        
        // Appliquer les dégâts
        enemy.takeDamage(damage, this);
        
        // Effets visuels et sonores
        game.ambianceSystem?.playSound('attack');
        game.ambianceSystem?.particleSystem?.createExplosion(
            enemy.x + enemy.w/2, 
            enemy.y + enemy.h/2, 
            isCritical ? '#FFD700' : '#FF6B6B'
        );
        
        // Notification de dégâts
        const damageText = isCritical ? `CRITIQUE! ${damage}` : `${damage}`;
        game.modularInterface?.showNotification(damageText, isCritical ? 'success' : 'info', 1000);
        
        // Consommer de l'endurance
        this.stamina = Math.max(0, this.stamina - 5);
    }

    updateSurvivalStats(delta, foodSystem) {
        // Logique de faim
        this.hunger = (this.hunger || 100) - (5 * delta); // Perd 5 de faim par seconde
        if (this.hunger < 0) this.hunger = 0;
        
        if (this.hunger === 0) {
            this.takeDamage(1 * delta); // Perd 1 de vie par seconde si affamé
        }
        
        // Logique de consommation de nourriture
        // (Pourrait être déclenché par une touche ou un clic sur l'inventaire)
    }

    regenerateStats(delta) {
        // Regenerate Mana and Stamina over time
        if (this.mana < this.maxMana) {
            this.mana += 5 * delta; // 5 mana per second
            if (this.mana > this.maxMana) this.mana = this.maxMana;
        }
        if (this.stamina < this.maxStamina) {
            this.stamina += 10 * delta; // 10 stamina per second
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
        }
    }

    takeDamage(amount) {
        const damageTaken = Math.max(0, amount - this.stats.defense);
        this.health -= damageTaken;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        if(window.game.logger) window.game.logger.error("Le joueur est mort !");
        // In a real game, you would trigger a respawn sequence here.
        // For now, we'll just reset health.
        this.health = this.maxHealth;
        // Move to spawn point (if it exists on the game object)
        if (window.game && window.game.spawnPoint) {
            this.x = window.game.spawnPoint.x;
            this.y = window.game.spawnPoint.y;
            this.vx = 0;
            this.vy = 0;
        }
    }
    
    handleCollisions(game) {
        // --- X-Axis Collision ---
        this.x += this.vx;
        const hitboxX = { x: this.x, y: this.y, w: this.w, h: this.h };
        this.isOnWall = 0;
        
        // Prevent falling out of the world from the left
        if (this.x < 0) {
            this.takeDamage(this.maxHealth); // Kill player if they fall out
            return;
        }

        // Check left collision
        if (game.tileMap[this.y]?.[this.x - 1] === TILE.WALL) {
            this.x = this.x - this.w;
            this.isOnWall = -1;
        }
        // Check right collision
        if (game.tileMap[this.y]?.[this.x + 1] === TILE.WALL) {
            this.x = this.x + this.w;
            this.isOnWall = 1;
        }

        // --- Y-Axis Collision ---
        this.y += this.vy;
        const hitboxY = { x: this.x, y: this.y, w: this.w, h: this.h };
        this.isGrounded = false;
        
        // Prevent falling out of the world from the bottom
        if (this.y > game.config.worldHeight) {
            this.takeDamage(this.maxHealth); // Kill player if they fall out
            return;
        }

        // Check down collision
        if (game.tileMap[this.y + 1]?.[this.x] === TILE.WALL) {
            this.y = this.y - this.h;
            this.isGrounded = true;
        }
    }

    // Utilise un slot rapide
    useQuickSlot(slotNumber, game) {
        if (!game.equipmentManager) return;
        
        // Pour l'instant, utiliser des potions de vie dans les slots
        const itemMap = {
            1: 'health_potion',
            2: 'mana_potion',
            3: 'stamina_potion',
            4: 'health_potion'
        };
        
        const itemId = itemMap[slotNumber];
        if (itemId) {
            const result = game.equipmentManager.useConsumable(itemId);
            if (result.success) {
                game.ambianceSystem?.playSound('heal');
                game.modularInterface?.showNotification(result.message, 'success');
            } else {
                game.modularInterface?.showNotification(result.message, 'error');
            }
        }
    }

    // Utilise une compétence de classe
    useClassSkill(skillIndex, game) {
        if (!this.characterClass) return;
        
        const availableSkills = this.characterClass.getAvailableSkills(this.stats.level);
        const skill = availableSkills[skillIndex];
        
        if (!skill) return;
        
        // Vérifier le coût en mana (exemple)
        const manaCost = 10 + (skillIndex * 5);
        if (this.mana < manaCost) {
            game.modularInterface?.showNotification("Pas assez de mana !", 'error');
            return;
        }
        
        this.mana -= manaCost;
        
        // Appliquer l'effet de la compétence
        this.applySkillEffect(skill, game);
        
        game.ambianceSystem?.playSound('attack');
        game.modularInterface?.showNotification(`${skill.name} utilisé !`, 'success');
    }

    applySkillEffect(skill, game) {
        switch (skill.name) {
            case 'Charge':
                // Augmenter temporairement l'attaque
                this.tempAttackBonus = (this.tempAttackBonus || 0) + 10;
                setTimeout(() => {
                    this.tempAttackBonus = Math.max(0, (this.tempAttackBonus || 0) - 10);
                }, 5000);
                break;
                
            case 'Soin':
                this.health = Math.min(this.health + 50, this.maxHealth);
                game.ambianceSystem?.playSound('heal');
                break;
                
            case 'Boule de Feu':
                // Créer un projectile magique
                this.createMagicProjectile(game, 'fireball');
                break;
                
            case 'Attaque Sournoise':
                // Augmenter les dégâts critiques temporairement
                this.tempCritBonus = (this.tempCritBonus || 0) + 25;
                setTimeout(() => {
                    this.tempCritBonus = Math.max(0, (this.tempCritBonus || 0) - 25);
                }, 3000);
                break;
                
            case 'Téléportation':
                if (game.mouse) {
                    const mouseX = game.mouse.x / game.config.zoom + game.camera.x;
                    const mouseY = game.mouse.y / game.config.zoom + game.camera.y;
                    this.x = mouseX - this.w / 2;
                    this.y = mouseY - this.h / 2;
                    game.ambianceSystem?.particleSystem?.createExplosion(this.x, this.y, '#3F51B5');
                }
                break;
        }
    }

    createMagicProjectile(game, type) {
        // Créer un effet visuel de projectile magique
        if (game.ambianceSystem?.particleSystem) {
            const targetX = game.mouse ? game.mouse.x / game.config.zoom + game.camera.x : this.x + 50;
            const targetY = game.mouse ? game.mouse.y / game.config.zoom + game.camera.y : this.y;
            
            // Animation de projectile simple avec des particules
            const steps = 20;
            const deltaX = (targetX - this.x) / steps;
            const deltaY = (targetY - this.y) / steps;
            
            for (let i = 0; i < steps; i++) {
                setTimeout(() => {
                    const x = this.x + deltaX * i;
                    const y = this.y + deltaY * i;
                    game.ambianceSystem.particleSystem.addParticle(x, y, 'circle', {
                        speed: 1,
                        life: 0.3,
                        size: 4,
                        color: type === 'fireball' ? '#FF4444' : '#4444FF'
                    });
                }, i * 50);
            }
        }
    }

    // Prendre des dégâts
    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - (this.totalDefense || this.stats.defense));
        this.health = Math.max(0, this.health - actualDamage);
        
        // Effet visuel de dégâts
        this.damageFlash = 0.3;
        
        // Vérifier la mort
        if (this.health <= 0) {
            this.die();
        }
        
        return actualDamage;
    }
    
    // Mourir
    die() {
        console.log('💀 Le joueur est mort !');
        // Pour l'instant, restaurer la santé et téléporter au spawn
        this.health = this.maxHealth;
        this.x = window.game?.spawnPoint?.x || 100;
        this.y = window.game?.spawnPoint?.y || 100;
        
        window.game?.modularInterface?.showNotification('Vous êtes mort ! Respawn au point de départ.', 'error', 4000);
        window.game?.ambianceSystem?.playSound('damage');
    }

    // Gagner de l'expérience
    gainXP(amount, game) {
        this.stats.xp += amount;
        
        while (this.stats.xp >= this.stats.xpToNextLevel) {
            this.levelUp(game);
        }
    }

    levelUp(game) {
        this.stats.xp -= this.stats.xpToNextLevel;
        this.stats.level++;
        this.stats.xpToNextLevel = Math.floor(this.stats.xpToNextLevel * 1.2);
        
        // Augmenter les stats selon la classe
        if (this.characterClass) {
            const growth = this.characterClass.data.statGrowth;
            this.baseMaxHealth += growth.health;
            this.baseMaxMana += growth.mana;
            this.baseMaxStamina += growth.stamina;
            this.stats.strength += growth.strength;
            this.stats.defense += growth.defense;
            this.stats.agility += growth.agility;
            this.stats.intelligence += growth.intelligence;
            this.stats.luck += growth.luck;
            
            // Restaurer la santé complète au niveau supérieur
            this.health = this.maxHealth;
            this.mana = this.maxMana;
            this.stamina = this.maxStamina;
        }
        
        // Effets visuels et sonores
        game.ambianceSystem?.playSound('levelup');
        game.ambianceSystem?.particleSystem?.createLevelUpEffect(this.x + this.w/2, this.y + this.h/2);
        game.modularInterface?.showNotification(`Niveau ${this.stats.level} atteint !`, 'success', 4000);
    }

    draw(ctx, assets) {
        // Effet de flash de dégâts
        if (this.damageFlash > 0) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x - 2, this.y - 2, this.w + 4, this.h + 4);
            ctx.restore();
        }
        
        // Couleur basée sur la classe
        let playerColor = '#FF6B6B';
        if (this.characterClass) {
            playerColor = this.characterClass.data.color;
        }
        
        ctx.fillStyle = playerColor;
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Icône de classe au-dessus du joueur
        if (this.characterClass) {
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.strokeText(this.characterClass.data.icon, this.x + this.w/2, this.y - 5);
            ctx.fillText(this.characterClass.data.icon, this.x + this.w/2, this.y - 5);
        }

        // Health bar above player
        const barWidth = this.w;
        const barHeight = 4;
        const barX = this.x;
        const barY = this.y - 15;
        
        // Barre de vie
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.2 ? '#FFC107' : '#F44336';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Barre de mana
        if (this.maxMana > 0) {
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY + 5, barWidth, barHeight);
            const manaPercent = this.mana / this.maxMana;
            ctx.fillStyle = '#3498db';
            ctx.fillRect(barX, barY + 5, barWidth * manaPercent, barHeight);
        }
    }
}