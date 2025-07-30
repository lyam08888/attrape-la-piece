export class Player {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = 32;
        this.h = 32;
        this.config = config;
        this.grounded = false;
        this.canDoubleJump = true;
        this.dir = 1;
        this.invulnerable = 0;
        this.inWater = false;
        this.frame = 0;
    }

    update(keys, game) {
        const { physics } = this.config;
        const speed = physics.playerSpeed * (game.settings.difficulty === 'Easy' ? 0.8 : 1);
        
        // Mouvement horizontal
        if (keys.left) { this.vx = -speed; this.dir = -1; }
        else if (keys.right) { this.vx = speed; this.dir = 1; }
        else { this.vx *= this.inWater ? physics.waterFriction : physics.friction; }

        // Saut
        if (keys.jump) {
            if (this.grounded || this.inWater) { 
                this.vy = -physics.jumpForce; 
                this.canDoubleJump = true; 
                game.playSound('jump');
                game.createParticles(this.x + this.w / 2, this.y + this.h, 10, '#8B7355');
            }
            else if (this.canDoubleJump) { 
                this.vy = -physics.jumpForce * 0.8; 
                this.canDoubleJump = false; 
                game.playSound('jump');
                game.createParticles(this.x + this.w / 2, this.y + this.h / 2, 15, '#87CEEB');
            }
            keys.jump = false;
        }

        // Gravité
        this.vy += this.inWater ? physics.gravity * 0.4 : physics.gravity;
        if (this.inWater) this.vy = Math.min(this.vy, 2); // Vitesse de chute max dans l'eau
        
        // Application du mouvement et collisions
        this.x += this.vx;
        this.handleCollision('x', game.platforms);
        this.y += this.vy;
        this.grounded = false;
        this.handleCollision('y', game.platforms);

        // Vérification de l'état (eau, chute)
        this.inWater = game.water.some(w => this.rectCollide(w));
        if (this.y > game.level.worldHeight + 100) game.loseLife();
        if (this.invulnerable > 0) this.invulnerable--;
        
        // Animation
        if (!this.grounded) {
            this.frame = 1; // Frame de saut
        } else if (Math.abs(this.vx) > 0.1) {
            this.frame = (this.frame + 0.2) % 4; // Frames de marche
        } else {
            this.frame = 0; // Frame statique
        }
    }

    handleCollision(axis, platforms) {
        platforms.forEach(plat => {
            if (this.rectCollide(plat)) {
                if (axis === 'x') {
                    if (this.vx > 0) this.x = plat.x - this.w;
                    else if (this.vx < 0) this.x = plat.x + plat.w;
                    this.vx = 0;
                } else { // axis === 'y'
                    if (this.vy > 0) { 
                        this.y = plat.y - this.h; 
                        this.vy = 0; 
                        this.grounded = true; 
                        this.canDoubleJump = true;
                    }
                    else if (this.vy < 0) { 
                        this.y = plat.y + plat.h; 
                        this.vy = 0; 
                    }
                }
            }
        });
    }
    
    rectCollide(other) {
        return this.x < other.x + other.w && this.x + this.w > other.x &&
               this.y < other.y + other.h && this.y + this.h > other.y;
    }

    draw(ctx, assets, skinKey, isGodMode) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        if (this.dir === -1) { ctx.scale(-1, 1); }
        
        if (isGodMode) {
            ctx.shadowColor = 'gold';
            ctx.shadowBlur = 15;
        }
        
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.drawImage(assets[skinKey], -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}
