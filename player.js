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
    }

    update(keys, game) {
        const speed = this.config.physics.playerSpeed * (game.settings.difficulty === 'Easy' ? 0.8 : 1);
        
        if (keys.left) { this.vx = -speed; this.dir = -1; }
        else if (keys.right) { this.vx = speed; this.dir = 1; }
        else { this.vx *= this.inWater ? this.config.physics.waterFriction : this.config.physics.friction; }

        if (keys.jump) {
            if (this.grounded || this.inWater) { this.vy = -this.config.physics.jumpForce; this.canDoubleJump = true; }
            else if (this.canDoubleJump) { this.vy = -this.config.physics.jumpForce * 0.8; this.canDoubleJump = false; }
            keys.jump = false;
        }

        this.vy += this.inWater ? this.config.physics.gravity * 0.4 : this.config.physics.gravity;
        if (this.inWater) this.vy = Math.max(this.vy, -4);
        
        this.x += this.vx;
        this.handleCollision('x', game.platforms);
        this.y += this.vy;
        this.grounded = false;
        this.handleCollision('y', game.platforms);

        this.inWater = false;
        game.water.forEach(w => { if(this.rectCollide(w)) this.inWater = true; });

        if (this.y > game.level.worldHeight) game.loseLife();
        if (this.invulnerable > 0) this.invulnerable--;
    }

    handleCollision(axis, platforms) {
        platforms.forEach(plat => {
            if (this.rectCollide(plat)) {
                if (axis === 'x') {
                    if (this.vx > 0) this.x = plat.x - this.w;
                    else if (this.vx < 0) this.x = plat.x + plat.w;
                } else {
                    if (this.vy > 0) { this.y = plat.y - this.h; this.vy = 0; this.grounded = true; }
                    else if (this.vy < 0) { this.y = plat.y + plat.h; this.vy = 0; }
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
        if (isGodMode) { ctx.shadowColor = 'gold'; ctx.shadowBlur = 15; }
        if (this.invulnerable > 0 && this.invulnerable % 10 < 5) ctx.globalAlpha = 0.5;
        
        ctx.drawImage(assets[skinKey], -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}
