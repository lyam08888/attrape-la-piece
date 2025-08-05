// Utilisation du système avancé : définition TILE compatible
const TILE = {
  AIR: 0,
  STONE: 1,
  GRASS: 2,
  DIRT: 3,
  // Ajoute d'autres blocs si besoin
};
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
        this.isFlying = false;
        this.isProne = false; // Position allongée

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
        this.tools = [
            'tool_pickaxe',
            'tool_axe',
            'tool_shovel',
            'tool_sword',
            'tool_bow',
            'tool_fishing_rod'
        ];
        this.selectedToolIndex = 0;
        this.toolDurability = {
            tool_pickaxe: 100,
            tool_axe: 100,
            tool_shovel: 100,
            tool_sword: 100,
            tool_bow: 100,
            tool_fishing_rod: 100
        };
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

        // Conserver l'état des touches pour l'animation
        this.keys = keys;

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
        // Gestion du vol : le vol est activé si la touche correspondante est active
        this.isFlying = !!keys.fly;
        
        // Gestion de l'accroupissement et position allongée
        if (keys.down && this.isGrounded) {
            if (keys.down && this.isCrouching) {
                // Double appui sur bas = position allongée
                this.isProne = true;
                this.isCrouching = false;
            } else {
                this.isCrouching = true;
                this.isProne = false;
            }
        } else {
            this.isCrouching = false;
            this.isProne = false;
        }
        
        let targetSpeed = 0;
        let speedMultiplier = 1;
        
        // Ajuster la vitesse selon la posture
        if (this.isProne) {
            speedMultiplier = 0.3; // Très lent en position allongée
        } else if (this.isCrouching) {
            speedMultiplier = 0.6; // Lent accroupi
        } else if (this.isFlying) {
            speedMultiplier = 1.2; // Plus rapide en vol
        }
        
        if (keys.left) {
            targetSpeed = -this.speed * speedMultiplier;
            this.facing = -1;
        }
        if (keys.right) {
            targetSpeed = this.speed * speedMultiplier;
            this.facing = 1;
        }
        
        const accel = this.isGrounded ? (physics.groundAcceleration || 0.4) : (physics.airAcceleration || 0.2);
        this.vx += (targetSpeed - this.vx) * accel;

        const friction = this.isGrounded ? (physics.friction || 0.85) : (physics.airResistance || 0.98);
        this.vx *= friction;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;

        // Logique de saut et vol
        if (this.isFlying) {
            // En mode vol
            if (keys.jump || keys.up) {
                this.vy = -this.speed * 0.8; // Voler vers le haut
            } else if (keys.down) {
                this.vy = this.speed * 0.8; // Voler vers le bas
            } else {
                this.vy *= 0.9; // Ralentir verticalement
            }
        } else {
            // Mode normal
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
    }

    applyGravity(physics) {
        // Ne pas appliquer la gravité en mode vol
        if (!this.isFlying) {
            this.vy += physics.gravity;
            if (this.vy > physics.maxFallSpeed) {
                this.vy = physics.maxFallSpeed;
            }
        }
    }

    handleActions(keys, game, delta) {
        // --- Sélection d'outils avec les touches numériques ---
        if (keys['1'] || keys['2'] || keys['3'] || keys['4'] || keys['5'] || keys['6']) {
            const index = keys['1'] ? 0 :
                          keys['2'] ? 1 :
                          keys['3'] ? 2 :
                          keys['4'] ? 3 :
                          keys['5'] ? 4 : 5;
            if (game.modularInterface) {
                game.modularInterface.selectTool(index);
            } else {
                this.selectedToolIndex = index;
            }
        }
        
        // --- Minage et Construction ---
        if (game.mouse?.left || keys.action) {
            this.handleMining(game, delta);
        } else {
            // Réinitialiser le minage si le bouton est relâché
            this.miningTarget = null;
            this.miningProgress = 0;
            this.miningStartTime = null;
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
        
        // Système de minage simplifié intégré
        const currentTime = Date.now();
        const miningSpeed = this.getMiningSpeed();
        const requiredTime = this.getBlockBreakTime(blockType) * 1000 / miningSpeed;
        
        if (!this.miningStartTime) {
            this.miningStartTime = currentTime;
        }
        
        this.miningProgress = Math.min(1, (currentTime - this.miningStartTime) / requiredTime);
        
        // Créer un effet visuel de minage
        if (game.ambianceSystem?.particleSystem) {
            const centerX = tileX * tileSize + tileSize / 2;
            const centerY = tileY * tileSize + tileSize / 2;
            game.ambianceSystem.particleSystem.addParticle(centerX, centerY, 'square', {
                speed: 0.5,
                life: 0.1,
                size: 2,
                color: '#FFFF00'
            });
        }
        
        // Bloc cassé
        if (this.miningProgress >= 1) {
            this.breakBlock(game, tileX, tileY, blockType);
            this.miningTarget = null;
            this.miningProgress = 0;
            this.miningStartTime = null;
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
        const tileSize = this.config.tileSize;
        
        // --- X-Axis Collision ---
        this.x += this.vx;
        this.isOnWall = 0;
        
        // Prevent falling out of the world from the left
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }
        
        // Prevent falling out of the world from the right
        if (this.x + this.w > this.config.worldWidth) {
            this.x = this.config.worldWidth - this.w;
            this.vx = 0;
        }

        // Convert pixel coordinates to tile coordinates for collision detection
        const leftTile = Math.floor(this.x / tileSize);
        const rightTile = Math.floor((this.x + this.w) / tileSize);
        const topTile = Math.floor(this.y / tileSize);
        const bottomTile = Math.floor((this.y + this.h) / tileSize);

        // Check horizontal collisions
        for (let ty = topTile; ty <= bottomTile; ty++) {
            // Left collision
            if (this.vx < 0 && game.tileMap[ty]?.[leftTile] > TILE.AIR) {
                this.x = (leftTile + 1) * tileSize;
                this.vx = 0;
                this.isOnWall = -1;
                break;
            }
            // Right collision
            if (this.vx > 0 && game.tileMap[ty]?.[rightTile] > TILE.AIR) {
                this.x = rightTile * tileSize - this.w;
                this.vx = 0;
                this.isOnWall = 1;
                break;
            }
        }

        // --- Y-Axis Collision ---
        this.y += this.vy;
        this.isGrounded = false;
        
        // Prevent falling out of the world from the bottom
        if (this.y > this.config.worldHeight) {
            this.y = this.config.worldHeight - this.h;
            this.vy = 0;
            this.isGrounded = true;
        }

        // Recalculate tile positions after Y movement
        const newTopTile = Math.floor(this.y / tileSize);
        const newBottomTile = Math.floor((this.y + this.h) / tileSize);
        const newLeftTile = Math.floor(this.x / tileSize);
        const newRightTile = Math.floor((this.x + this.w) / tileSize);

        // Check vertical collisions
        for (let tx = newLeftTile; tx <= newRightTile; tx++) {
            // Top collision
            if (this.vy < 0 && game.tileMap[newTopTile]?.[tx] > TILE.AIR) {
                this.y = (newTopTile + 1) * tileSize;
                this.vy = 0;
                break;
            }
            // Bottom collision (ground)
            if (this.vy >= 0 && game.tileMap[newBottomTile]?.[tx] > TILE.AIR) {
                this.y = newBottomTile * tileSize - this.h;
                this.vy = 0;
                this.isGrounded = true;
                this.canDoubleJump = true;
                break;
            }
        }
        
        // Log occasionnel des collisions
        if (Math.random() < 0.01) {
            const px = Math.floor(this.x / tileSize);
            const py = Math.floor(this.y / tileSize);
            const groundTile = game.tileMap[py + Math.ceil(this.h / tileSize)]?.[px];
            console.log(`Player collision: pos(${px}, ${py}), grounded=${this.isGrounded}, groundTile=${groundTile}, vy=${this.vy.toFixed(2)}`);
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
        
        // Déterminer l'animation actuelle
        this.updateAnimation();
        const currentFrame = this.getCurrentFrame();
        
        // Essayer d'utiliser le sprite, sinon fallback vers un rectangle coloré
        const sprite = assets[currentFrame];
        if (sprite && sprite.complete) {
            ctx.save();
            
            // Retourner le sprite si le joueur regarde à gauche
            if (this.facing === -1) {
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, -this.x - this.w, this.y, this.w, this.h);
            } else {
                ctx.drawImage(sprite, this.x, this.y, this.w, this.h);
            }
            
            ctx.restore();
        } else {
            // Fallback amélioré avec un design plus propre
            this.drawFallbackPlayer(ctx);
        }

        // Afficher l'outil actuellement sélectionné dans la main du joueur
        const currentToolKey = this.tools[this.selectedToolIndex];
        const toolSprite = assets[currentToolKey];
        if (toolSprite && toolSprite.complete) {
            const toolW = toolSprite.width;
            const toolH = toolSprite.height;
            const offsetX = this.facing === -1 ? -toolW + 8 : this.w - 8;
            const drawX = this.x + offsetX;
            const drawY = this.y + this.h / 2 - toolH / 2;
            if (this.facing === -1) {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(toolSprite, -drawX - toolW, drawY, toolW, toolH);
                ctx.restore();
            } else {
                ctx.drawImage(toolSprite, drawX, drawY, toolW, toolH);
            }
        }

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

    updateAnimation() {
        // Mettre à jour le timer d'animation
        this.frameTimer += 0.016; // Approximation de 60 FPS
        
        // Déterminer l'animation basée sur l'état du joueur
        if (this.isFlying) {
            this.currentAnimation = 'flying';
        } else if (this.isProne) {
            if (Math.abs(this.vx) > 0.1) {
                this.currentAnimation = 'proneWalking';
            } else {
                this.currentAnimation = 'prone';
            }
        } else if (this.isCrouching) {
            if (Math.abs(this.vx) > 0.1) {
                this.currentAnimation = 'crouchWalking';
            } else {
                this.currentAnimation = 'crouching';
            }
        } else if (!this.isGrounded) {
            if (this.canDoubleJump === false) {
                this.currentAnimation = 'doubleJump';
            } else {
                this.currentAnimation = 'jumping';
            }
        } else if (Math.abs(this.vx) > 0.1) {
            if (this.keys?.run) {
                this.currentAnimation = 'running';
            } else {
                this.currentAnimation = 'walking';
            }
        } else {
            this.currentAnimation = 'idle';
        }
        
        // Changer de frame toutes les 0.2 secondes
        if (this.frameTimer >= 0.2) {
            this.frameTimer = 0;
            this.frame++;
        }
    }

    getCurrentFrame() {
        const animations = {
            idle: ['player_idle1', 'player_idle2'],
            walking: ['player_walk1', 'player_walk2'],
            running: ['player_run1', 'player_run2'],
            jumping: ['player_jump'],
            doubleJump: ['player_double_jump1', 'player_double_jump2'],
            flying: ['player_fly1', 'player_fly2'],
            crouching: ['player_crouch'],
            crouchWalking: ['player_crouch_walk1', 'player_crouch_walk2'],
            prone: ['player_prone'],
            proneWalking: ['player_prone_walk1', 'player_prone_walk2']
        };
        
        const currentFrames = animations[this.currentAnimation] || animations.idle;
        const frameIndex = this.frame % currentFrames.length;
        return currentFrames[frameIndex];
    }

    drawFallbackPlayer(ctx) {
        // Fallback amélioré avec un design de personnage pixelisé
        ctx.save();
        
        // Corps principal
        let playerColor = '#4A90E2'; // Bleu par défaut
        if (this.characterClass) {
            playerColor = this.characterClass.data.color;
        }
        
        // Corps
        ctx.fillStyle = playerColor;
        ctx.fillRect(this.x + 2, this.y + 8, this.w - 4, this.h - 12);
        
        // Tête
        ctx.fillStyle = '#FFDBAC'; // Couleur peau
        ctx.fillRect(this.x + 4, this.y + 2, this.w - 8, 8);
        
        // Yeux
        ctx.fillStyle = '#000';
        const eyeY = this.y + 4;
        if (this.facing === 1) {
            ctx.fillRect(this.x + 6, eyeY, 1, 1);
            ctx.fillRect(this.x + 9, eyeY, 1, 1);
        } else {
            ctx.fillRect(this.x + 6, eyeY, 1, 1);
            ctx.fillRect(this.x + 9, eyeY, 1, 1);
        }
        
        // Pieds
        ctx.fillStyle = '#8B4513'; // Marron pour les chaussures
        ctx.fillRect(this.x + 2, this.y + this.h - 4, 4, 4);
        ctx.fillRect(this.x + this.w - 6, this.y + this.h - 4, 4, 4);
        
        // Bras (animation simple)
        ctx.fillStyle = '#FFDBAC';
        if (Math.abs(this.vx) > 0.1) {
            // Bras en mouvement
            const armOffset = Math.sin(Date.now() * 0.01) * 2;
            ctx.fillRect(this.x, this.y + 10 + armOffset, 2, 6);
            ctx.fillRect(this.x + this.w - 2, this.y + 10 - armOffset, 2, 6);
        } else {
            // Bras au repos
            ctx.fillRect(this.x, this.y + 10, 2, 6);
            ctx.fillRect(this.x + this.w - 2, this.y + 10, 2, 6);
        }
        
        ctx.restore();
    }

    getMiningSpeed() {
        // Vitesse de base + bonus d'équipement + bonus de stats
        let speed = 1.0;
        
        // Bonus d'outil
        const currentTool = this.tools[this.selectedToolIndex];
        if (currentTool === 'tool_pickaxe') speed *= 1.5;
        else if (currentTool === 'tool_axe') speed *= 1.3;
        else if (currentTool === 'tool_shovel') speed *= 1.2;
        
        // Bonus de stats
        speed *= (1 + this.stats.strength * 0.02);
        
        return speed;
    }

    getBlockBreakTime(blockType) {
        const breakTimes = {
            0: 0,     // AIR
            1: 2.0,   // STONE
            2: 0.5,   // GRASS
            3: 0.5,   // DIRT
            100: 4.5, // DIVINE_STONE
            103: 0.5, // autre grass
            106: 0.1, // CLOUD
            112: 1.8, // CRYSTAL
            121: 0.4, // SAND
            130: 4.0  // HELLSTONE
        };
        
        return breakTimes[blockType] || 1.0;
    }

    breakBlock(game, tileX, tileY, blockType) {
        // Casser le bloc
        game.tileMap[tileY][tileX] = TILE.AIR;
        
        // Ajouter l'objet à l'inventaire
        const itemType = this.getItemFromBlock(blockType);
        this.inventory[itemType] = (this.inventory[itemType] || 0) + 1;
        
        // Effets visuels et sonores
        if (game.ambianceSystem) {
            game.ambianceSystem.playSound('break');
            if (game.ambianceSystem.particleSystem) {
                const centerX = tileX * this.config.tileSize + this.config.tileSize / 2;
                const centerY = tileY * this.config.tileSize + this.config.tileSize / 2;
                game.ambianceSystem.particleSystem.createExplosion(centerX, centerY, '#8B4513');
            }
        }
        
        // Notification
        if (game.modularInterface) {
            game.modularInterface.showNotification(`+1 ${itemType}`, 'success', 1500);
        }
        
        // Gagner de l'XP
        this.gainXP(Math.floor(this.getBlockBreakTime(blockType)), game);
        
        if(game.logger) game.logger.log(`Bloc ${blockType} cassé à (${tileX},${tileY})`, 'success');
    }

    getItemFromBlock(blockType) {
        const itemMap = {
            1: 'stone',
            2: 'grass',
            3: 'dirt',
            100: 'divine_stone',
            103: 'grass',
            106: 'cloud',
            112: 'crystal',
            121: 'sand',
            130: 'hellstone'
        };
        
        return itemMap[blockType] || 'unknown';
    }
}