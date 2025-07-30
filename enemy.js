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

    update(platforms, worldWidth) {
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

        if (this.onGround) {
            const groundAhead = platforms.some(p => 
                this.y + this.h >= p.y && this.y < p.y + p.h &&
                this.x + (this.vx > 0 ? this.w + 2 : -2) > p.x &&
                this.x + (this.vx > 0 ? this.w + 2 : -2) < p.x + p.w
            );

            if (!groundAhead || this.x < 0 || this.x + this.w > worldWidth) {
                this.vx *= -1;
                this.dir *= -1;
            }
        }
    }
    
    rectCollide(other) {
        return this.x < other.x + other.w && this.x + this.w > other.x &&
               this.y < other.y + other.h && this.y + this.h > other.y;
    }

    draw(ctx, assets) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        if (this.vx > 0) { ctx.scale(-1, 1); }
        ctx.drawImage(assets[`enemy_${this.type}`], -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
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

    update(platforms, worldWidth) {
        super.update(platforms, worldWidth);
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
