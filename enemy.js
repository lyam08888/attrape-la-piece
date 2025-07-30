// La classe de base pour tous les ennemis
class Enemy {
    constructor(x, y, type, config) {
        this.x = x;
        this.y = y;
        this.w = 32;
        this.h = 32;
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
            return; // Arrête toute autre logique si l'ennemi est en train de mourir
        }

        // Logique de base (gravité, collision avec plateformes)
        this.vy += this.config.physics.gravity;
        this.x += this.vx;
        this.y += this.vy;
        
        this.onGround = false;
        game.platforms.forEach(plat => {
            if (this.rectCollide(plat) && this.vy >= 0 && this.y + this.h - this.vy <= plat.y) {
                this.y = plat.y - this.h;
                this.vy = 0;
                this.onGround = true;
            }
        });

        // Fait demi-tour au bord d'une plateforme
        if (this.onGround) {
            const groundAhead = game.platforms.some(p => 
                this.y + this.h > p.y && this.y < p.y + p.h &&
                this.x + (this.vx > 0 ? this.w + 2 : -2) >= p.x &&
                this.x + (this.vx > 0 ? this.w + 2 : -2) <= p.x + p.w
            );

            if (!groundAhead) {
                this.vx *= -1;
                this.dir *= -1;
            }
        }
    }

    takeDamage(game) {
        this.health--;
        if (this.health <= 0 && !this.isDying) {
            this.isDying = true;
            this.vx = 0; // Arrête le mouvement
            game.score += 100;
            // Crée une explosion de particules
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
            // Animation de mort : rétrécit et devient transparent
            const scale = this.deathTimer / 30;
            ctx.scale(scale, scale);
            ctx.globalAlpha = scale;
            ctx.rotate(this.deathTimer * 0.5);
        } else if (this.dir === 1) { 
            ctx.scale(-1, 1); 
        }

        const assetKey = `enemy_${this.type}`;
        if (assets[assetKey]) {
            ctx.drawImage(assets[assetKey], -this.w / 2, -this.h / 2, this.w, this.h);
        }
        ctx.restore();
    }
}

// Classes spécifiques pour chaque ennemi, exportées pour être utilisées dans game.js
export class Slime extends Enemy {
    constructor(x, y, config) {
        super(x, y, 'slime', config);
    }
    // Le Slime garde le comportement de base
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
                // Saute vers le joueur s'il est assez proche
                if (Math.abs(dx) < 300) {
                    this.vx = Math.sign(dx) * 2;
                    this.dir = Math.sign(this.vx);
                }
                this.vy = -6;
                this.jumpTimer = 120 + Math.random() * 60;
            }
        } else {
            // En l'air, il ne peut pas changer de direction
        }
    }
}

export class Golem extends Enemy {
    constructor(x, y, config) {
        super(x, y, 'golem', config);
        this.health = 3;
        this.vx = -0.3;
        this.state = 'patrolling'; // patrolling, preparing, charging
        this.chargeTimer = 180;
    }

    update(game) {
        super.update(game);
        if (this.isDying) return;

        const player = game.player;
        const dx = player.x - this.x;
        const dy = Math.abs(player.y - this.y);

        if (this.state === 'patrolling' && Math.abs(dx) < 250 && dy < 50) {
            this.state = 'preparing';
            this.chargeTimer = 60; // Temps de préparation
            this.vx = 0;
        }

        if (this.state === 'preparing') {
            this.chargeTimer--;
            if (this.chargeTimer <= 0) {
                this.state = 'charging';
                this.dir = Math.sign(dx);
                this.vx = this.dir * 5; // Charge rapide
                this.chargeTimer = 90; // Durée de la charge
            }
        }

        if (this.state === 'charging') {
            this.chargeTimer--;
            if (this.chargeTimer <= 0) {
                this.state = 'patrolling';
                this.vx = this.dir * -0.3; // Retourne à sa vitesse de patrouille
            }
        }
    }

    draw(ctx, assets) {
        // Le golem devient rouge quand il prépare sa charge
        if (this.state === 'preparing' && Math.floor(this.chargeTimer / 10) % 2) {
            ctx.filter = 'sepia(1) saturate(10) hue-rotate(-50deg)';
        }
        super.draw(ctx, assets);
        ctx.filter = 'none';
    }
}
