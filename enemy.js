// La classe de base pour tous les ennemis
class Enemy {
    constructor(x, y, type, config) {
        this.x = x;
        this.y = y;
        this.w = 16;
        this.h = 16;
        this.vx = -0.5;
        this.vy = 0;
        this.dir = -1;
        this.type = type;
        this.config = config;
        this.health = 1;
        this.onGround = false;
        this.isDying = false;
        this.isDead = false;
        this.deathTimer = 30; // Durée de l'animation de mort
    }

    update(game) {
        if (this.isDying) {
            this.deathTimer--;
            if (this.deathTimer <= 0) {
                this.isDead = true;
            }
            return;
        }

        this.vy += this.config.physics.gravity;
        
        this.handleTileCollisions(game);
    }

    handleTileCollisions(game) {
        const { tileSize } = this.config;

        this.x += this.vx;
        let nextTileX = this.vx > 0 ? Math.floor((this.x + this.w) / tileSize) : Math.floor(this.x / tileSize);
        let currentTileY = Math.floor((this.y + this.h) / tileSize);
        // CORRECTION: Ajout d'une vérification (optional chaining) pour éviter les erreurs
        if (game.tileMap[currentTileY]?.[nextTileX] > 0) {
            this.vx *= -1;
            this.dir *= -1;
        }

        this.y += this.vy;
        this.onGround = false;
        let startX = Math.floor(this.x / tileSize);
        let endX = Math.floor((this.x + this.w) / tileSize);
        let yTile = Math.floor((this.y + this.h) / tileSize);

        for (let x = startX; x <= endX; x++) {
            if (game.tileMap[yTile]?.[x] > 0) {
                if (this.vy > 0) {
                    this.y = yTile * tileSize - this.h;
                    this.onGround = true;
                }
                this.vy = 0;
            }
        }
        
        let frontFootX = this.vx > 0 ? this.x + this.w : this.x;
        let tileBelowX = Math.floor(frontFootX / tileSize);
        let tileBelowY = Math.floor((this.y + this.h + 1) / tileSize);
        // CORRECTION: Ajout d'une vérification pour éviter les erreurs
        if (this.onGround && game.tileMap[tileBelowY]?.[tileBelowX] === 0) {
            this.vx *= -1;
            this.dir *= -1;
        }
    }

    takeDamage(game) {
        game.sound?.playHit();
        this.health--;
        if (this.health <= 0 && !this.isDying) {
            this.isDying = true;
            this.vx = 0;
            game.score += 100;
            game.createParticles(this.x + this.w / 2, this.y + this.h / 2, 20, '#95a5a6', { speed: 5 });
        }
    }
    
    rectCollide(other) {
        return this.x < other.x + other.w && this.x + this.w > other.x &&
               this.y < other.y + other.h && this.y + this.h > other.y;
    }

    draw(ctx, assets) {
        if (this.isDead) return;

        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        
        if (this.isDying) {
            const scale = this.deathTimer / 30;
            ctx.scale(scale, scale);
            ctx.globalAlpha = scale;
            ctx.rotate(this.deathTimer * 0.5);
        } else if (this.dir === -1) { 
            ctx.scale(-1, 1); 
        }

        const assetKey = `enemy_${this.type}`;
        if (assets[assetKey]) {
            ctx.drawImage(assets[assetKey], -this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
        }
        ctx.restore();
    }
}

export class Slime extends Enemy {
    constructor(x, y, config) {
        super(x, y, 'slime', config);
        this.h = 12;
    }
}

export class Frog extends Enemy {
    constructor(x, y, config) {
        super(x, y, 'frog', config);
        this.jumpTimer = Math.random() * 120 + 60;
    }

    update(game) {
        super.update(game);
        if (this.isDying) return;

        if (this.onGround) {
            this.jumpTimer--;
            if (this.jumpTimer <= 0) {
                const player = game.player;
                const dx = player.x - this.x;
                if (Math.abs(dx) < 200) {
                    this.vx = Math.sign(dx) * 1.5;
                    this.dir = Math.sign(this.vx);
                }
                this.vy = -4;
                this.jumpTimer = 120 + Math.random() * 60;
            }
        }
    }
}

export class Golem extends Enemy {
    constructor(x, y, config) {
        super(x, y, 'golem', config);
        this.health = 3;
        this.w = 24;
        this.h = 24;
        this.vx = -0.3;
        this.state = 'patrolling';
        this.chargeTimer = 180;
    }

    update(game) {
        super.update(game);
        if (this.isDying) return;

        const player = game.player;
        const dx = player.x - this.x;
        const dy = Math.abs(player.y - this.y);

        if (this.state === 'patrolling' && Math.abs(dx) < 200 && dy < 50) {
            this.state = 'preparing';
            this.chargeTimer = 60;
            this.vx = 0;
        }

        if (this.state === 'preparing') {
            this.chargeTimer--;
            if (this.chargeTimer <= 0) {
                this.state = 'charging';
                this.dir = Math.sign(dx);
                this.vx = this.dir * 4;
                this.chargeTimer = 90;
            }
        }

        if (this.state === 'charging') {
            this.chargeTimer--;
            if (this.chargeTimer <= 0) {
                this.state = 'patrolling';
                this.vx = this.dir * -0.3;
            }
        }
    }

    draw(ctx, assets) {
        if (this.state === 'preparing' && Math.floor(this.chargeTimer / 10) % 2) {
            ctx.filter = 'sepia(1) saturate(10) hue-rotate(-50deg)';
        }
        super.draw(ctx, assets);
        ctx.filter = 'none';
    }
}
