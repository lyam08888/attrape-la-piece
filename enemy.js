// enemy.js - Définit les classes et le comportement des ennemis
import { TILE } from './world.js';
import { SeededRandom } from './seededRandom.js';

export class Enemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.w = config?.player?.width || 16; // Utilise la taille du joueur pour la cohérence
        this.h = config?.player?.height || 16;
        this.vx = (SeededRandom.random() - 0.5) * 1;
        this.vy = 0;
        this.config = config;
        this.isDead = false;
        this.grounded = false;
        this.health = 20;
        this.maxHealth = 20;
        this.attackDamage = 5;
        this.lastAttackTime = 0;
        this.attackCooldown = 1000; // 1 seconde
    }

    update(game) {
        if (this.isDead) return;
        
        this.vy += this.config.physics.gravity;
        if (this.vy > this.config.physics.maxFallSpeed) {
            this.vy = this.config.physics.maxFallSpeed;
        }

        this.handleCollisions(game);
        
        // Comportement de base: patrouille
        if (this.grounded && Math.abs(this.vx) < 0.1) {
            this.vx = (SeededRandom.random() > 0.5 ? 1 : -1) * 0.5;
        }
    }
    
    handleCollisions(game) {
        const { tileSize } = this.config;
        const map = game.tileMap;
        
        // Collision X
        this.x += this.vx;
        let hb = {x: this.x, y: this.y, w: this.w, h: this.h};
        if (this.vx > 0) {
            const tx = Math.floor((hb.x + hb.w) / tileSize);
            const ty1 = Math.floor(hb.y / tileSize);
            const ty2 = Math.floor((hb.y + hb.h - 1) / tileSize);
            if ((map[ty1]?.[tx] > TILE.AIR) || (map[ty2]?.[tx] > TILE.AIR)) {
                this.x = tx * tileSize - hb.w;
                this.vx *= -1; // Change de direction
            }
        } else if (this.vx < 0) {
            const tx = Math.floor(hb.x / tileSize);
            const ty1 = Math.floor(hb.y / tileSize);
            const ty2 = Math.floor((hb.y + hb.h - 1) / tileSize);
             if ((map[ty1]?.[tx] > TILE.AIR) || (map[ty2]?.[tx] > TILE.AIR)) {
                this.x = (tx + 1) * tileSize;
                this.vx *= -1; // Change de direction
            }
        }

        // Collision Y
        this.y += this.vy;
        hb = {x: this.x, y: this.y, w: this.w, h: this.h};
        this.grounded = false;
        if (this.vy > 0) {
            const ty = Math.floor((hb.y + hb.h) / tileSize);
            const tx1 = Math.floor(hb.x / tileSize);
            const tx2 = Math.floor((hb.x + hb.w - 1) / tileSize);
            if ((map[ty]?.[tx1] > TILE.AIR) || (map[ty]?.[tx2] > TILE.AIR)) {
                this.y = ty * tileSize - hb.h;
                this.vy = 0;
                this.grounded = true;
            }
        } else if (this.vy < 0) {
            const ty = Math.floor(hb.y / tileSize);
            const tx1 = Math.floor(hb.x / tileSize);
            const tx2 = Math.floor((hb.x + hb.w - 1) / tileSize);
            if ((map[ty]?.[tx1] > TILE.AIR) || (map[ty]?.[tx2] > TILE.AIR)) {
                this.y = (ty + 1) * tileSize;
                this.vy = 0;
            }
        }
    }

    draw(ctx, assets, assetKey) {
        const img = assets[assetKey];
        if (img) {
            ctx.drawImage(img, this.x, this.y, this.w, this.h);
        } else {
            // Fallback si l'asset n'est pas trouvé
            ctx.fillStyle = this.isDead ? '#666666' : '#8B008B';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            
            // Barre de vie
            if (!this.isDead && this.health < this.maxHealth) {
                const barWidth = this.w;
                const barHeight = 4;
                const healthPercent = this.health / this.maxHealth;
                
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(this.x, this.y - 8, barWidth * healthPercent, barHeight);
            }
        }
    }
    
    rectCollide(other) {
        return this.x < other.x + other.w &&
               this.x + this.w > other.x &&
               this.y < other.y + other.h &&
               this.y + this.h > other.y;
    }
    
    takeDamage(damage) {
        if (this.isDead) return false;
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
        return true;
    }
}

// Exporter la classe de base et les classes spécifiques
export { Enemy };

export class Slime extends Enemy {
    draw(ctx, assets) { super.draw(ctx, assets, 'enemy_slime'); }
}
export class Frog extends Enemy {
    draw(ctx, assets) { super.draw(ctx, assets, 'enemy_frog'); }
}
export class Golem extends Enemy {
    constructor(x,y,c) { super(x,y,c); this.h *= 1.5; } // Le Golem est plus grand
    draw(ctx, assets) { super.draw(ctx, assets, 'enemy_golem'); }
}
