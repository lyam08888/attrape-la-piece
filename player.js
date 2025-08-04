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
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.maxMana = 50;
        this.mana = this.maxMana;
        this.maxStamina = 80;
        this.stamina = this.maxStamina;
        this.stats = {
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            strength: 10,
            defense: 5,
            speed: 10,
        };

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
        // --- Minage et Construction ---
        if (game.mouse.left || keys.action) {
            this.handleMining(game, delta);
        } else {
            // Réinitialiser le minage si le bouton est relâché
            this.miningTarget = null;
            this.miningProgress = 0;
            if (game.miningEffect) game.miningEffect = null;
        }

        if (game.mouse.right) {
            this.handleBuilding(game);
        }

        // --- Combat ---
        if (keys.attack) { // Supposons une touche "attack"
             this.handleCombat(game);
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
        if (!game.combatSystem) return;
        
        game.enemies.forEach(enemy => {
            const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
            if (dist < this.w * 2) { // Portée d'attaque
                game.combatSystem.attack(this, enemy);
            }
        });
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

    draw(ctx, assets) {
        // Simple rectangle for now, animation can be added later
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(this.x, this.y, this.w, this.h);

        // Health bar above player
        const barWidth = this.w;
        const barHeight = 5;
        const barX = this.x;
        const barY = this.y - 10;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.2 ? '#FFC107' : '#F44336';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}