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
    }

    update(platforms) {
        this.vy += this.config.physics.gravity;
        this.x += this.vx;
        this.y += this.vy;
        
        this.onGround = false;
        platforms.forEach(plat => {
            if (this.rectCollide(plat) && this.vy >= 0) {
                this.y = plat.y - this.h;
                this.vy = 0;
                this.onGround = true;
            }
        });

        // Simple IA to turn at edges
        const groundAhead = platforms.some(p => 
            p.y === this.y + this.h && 
            p.x < this.x + (this.vx > 0 ? this.w : 0) && 
            p.x + p.w > this.x + (this.vx > 0 ? this.w : 0)
        );
        if(!this.onGround) {
            // A simple check to avoid turning in mid-air
        } else if (this.x < 0 || this.x > 4800) { // World bounds
             this.vx *= -1;
        }
    }
    
    rectCollide(other) {
        return this.x < other.x + other.w && this.x + this.w > other.x &&
               this.y < other.y + other.h && this.y + this.h > other.y;
    }

    draw(ctx, assets) {
        ctx.drawImage(assets[`enemy_${this.type}`], this.x, this.y, this.w, this.h);
    }
}

export class Slime extends Enemy {
    constructor(x, y, config) {
        super(x, y, 'slime', config);
    }
}

export class Frog extends Enemy {
    constructor(x, y, config) {
        super(x, y, 'frog', config);
        this.jumpTimer = Math.random() * 120;
    }

    update(platforms) {
        super.update(platforms);
        if (this.onGround) {
            this.jumpTimer--;
            if (this.jumpTimer <= 0) {
                this.vy = -6;
                this.jumpTimer = 120 + Math.random() * 60;
            }
        }
    }
}

export class Golem extends Enemy {
    constructor(x, y, config) {
        super(x, y, 'golem', config);
        this.health = 2;
        this.vx = -0.3;
    }
}
