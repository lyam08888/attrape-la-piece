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

        // --- Horizontal Movement ---
        let targetSpeed = 0;
        if (keys.left) {
            targetSpeed = -this.speed;
            this.facing = -1;
        }
        if (keys.right) {
            targetSpeed = this.speed;
            this.facing = 1;
        }
        
        // Apply acceleration
        const accel = this.isGrounded ? physics.groundAcceleration : physics.airAcceleration;
        this.vx += (targetSpeed - this.vx) * accel;

        // Apply friction
        const friction = this.isGrounded ? physics.friction : physics.airResistance;
        this.vx *= friction;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;


        // --- Vertical Movement (Jumping) ---
        if (keys.jump && this.isGrounded) {
            this.vy = -physics.jumpForce;
            this.isGrounded = false;
            this.canDoubleJump = true;
        } else if (keys.jump && !this.isGrounded && this.canDoubleJump) {
            this.vy = -physics.jumpForce * 0.8; // Double jump is slightly weaker
            this.canDoubleJump = false;
        }

        // Apply Gravity
        this.vy += physics.gravity;
        if (this.vy > physics.maxFallSpeed) {
            this.vy = physics.maxFallSpeed;
        }
        
        // --- Collision Detection ---
        this.handleCollisions(game);
        
        // --- Update other systems ---
        this.regenerateStats(delta);
    }
    
    handleCollisions(game) {
        const { tileSize } = this.config;
        const map = game.tileMap;

        // --- X-Axis Collision ---
        this.x += this.vx;
        const hitboxX = { x: this.x, y: this.y, w: this.w, h: this.h };

        // Check right collision
        if (this.vx > 0) {
            const tx = Math.floor((hitboxX.x + hitboxX.w) / tileSize);
            const ty1 = Math.floor(hitboxX.y / tileSize);
            const ty2 = Math.floor((hitboxX.y + hitboxX.h - 1) / tileSize);
            if ((map[ty1]?.[tx] > TILE.AIR) || (map[ty2]?.[tx] > TILE.AIR)) {
                this.x = tx * tileSize - hitboxX.w;
                this.vx = 0;
            }
        }
        // Check left collision
        else if (this.vx < 0) {
            const tx = Math.floor(hitboxX.x / tileSize);
            const ty1 = Math.floor(hitboxX.y / tileSize);
            const ty2 = Math.floor((hitboxX.y + hitboxX.h - 1) / tileSize);
             if ((map[ty1]?.[tx] > TILE.AIR) || (map[ty2]?.[tx] > TILE.AIR)) {
                this.x = (tx + 1) * tileSize;
                this.vx = 0;
            }
        }

        // --- Y-Axis Collision ---
        this.y += this.vy;
        const hitboxY = { x: this.x, y: this.y, w: this.w, h: this.h };
        this.isGrounded = false;

        // Check down collision
        if (this.vy > 0) {
            const ty = Math.floor((hitboxY.y + hitboxY.h) / tileSize);
            const tx1 = Math.floor(hitboxY.x / tileSize);
            const tx2 = Math.floor((hitboxY.x + hitboxY.w - 1) / tileSize);
            if ((map[ty]?.[tx1] > TILE.AIR) || (map[ty]?.[tx2] > TILE.AIR)) {
                this.y = ty * tileSize - hitboxY.h;
                this.vy = 0;
                this.isGrounded = true;
                this.canDoubleJump = true; // Reset double jump on landing
            }
        }
        // Check up collision
        else if (this.vy < 0) {
            const ty = Math.floor(hitboxY.y / tileSize);
            const tx1 = Math.floor(hitboxY.x / tileSize);
            const tx2 = Math.floor((hitboxY.x + hitboxY.w - 1) / tileSize);
            if ((map[ty]?.[tx1] > TILE.AIR) || (map[ty]?.[tx2] > TILE.AIR)) {
                this.y = (ty + 1) * tileSize;
                this.vy = 0;
            }
        }
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
        console.log("Player has died.");
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