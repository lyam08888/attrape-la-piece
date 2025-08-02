// enemy.js - Définit les classes et le comportement des ennemis
import { TILE } from './world.js';
import { SeededRandom } from './seededRandom.js';

export class Enemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.w = config.player.width; // Utilise la taille du joueur pour la cohérence
        this.h = config.player.height;
        this.vx = (SeededRandom.random() - 0.5) * 1;
        this.vy = 0;
        this.config = config;
        this.isDead = false;
        this.grounded = false;
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
            ctx.fillStyle = 'purple';
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
    }
}

// Exporter les classes spécifiques
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
