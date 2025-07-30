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
        const speed = physics.playerSpeed * (game.settings.difficulty === 'Easy' ? 1.2 : 1);
        
        // Mouvement horizontal
        if (keys.left) { this.vx = -speed; this.dir = -1; }
        else if (keys.right) { this.vx = speed; this.dir = 1; }
        else { this.vx *= this.inWater ? physics.waterFriction : physics.friction; }

        // Mouvement vertical (saut)
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

        // Appliquer la gravité
        this.vy += this.inWater ? physics.gravity * 0.4 : physics.gravity;
        if (this.inWater) this.vy = Math.min(this.vy, 2);
        
        // Gérer les collisions
        this.x += this.vx;
        this.handleCollision('x', game);
        this.y += this.vy;
        this.grounded = false;
        this.handleCollision('y', game);

        // Gérer les collisions avec les ennemis (NOUVEAU)
        this.checkEnemyCollisions(game);

        this.inWater = game.water.some(w => this.rectCollide(w));
        if (this.y > game.level.worldHeight + 100) game.loseLife();
        if (this.invulnerable > 0) this.invulnerable--;
        
        // Gérer l'animation du joueur
        if (!this.grounded) { this.frame = 1; } 
        else if (Math.abs(this.vx) > 0.1) { this.frame = (this.frame + 0.2) % 4; } 
        else { this.frame = 0; }
    }

    handleCollision(axis, game) {
        // Collision avec les plateformes
        game.platforms.forEach(plat => {
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

        // Collision avec les pièces et bonus
        game.coins.forEach((coin, index) => {
            if (this.rectCollide(coin)) {
                game.coins.splice(index, 1);
                game.score += 10;
                game.playSound('coin');
                game.createParticles(coin.x + coin.w / 2, coin.y + coin.h / 2, 10, '#f1c40f');
            }
        });
        game.bonuses.forEach((bonus, index) => {
            if (this.rectCollide(bonus)) {
                game.bonuses.splice(index, 1);
                game.score += 50;
                if(game.lives < this.config.player.maxLives) game.lives++;
                game.playSound('powerup');
                game.createParticles(bonus.x + bonus.w / 2, bonus.y + bonus.h / 2, 20, '#e67e22');
            }
        });
    }

    checkEnemyCollisions(game) {
        game.enemies.forEach(enemy => {
            if (this.rectCollide(enemy) && !enemy.isDying) {
                // Si le joueur saute sur l'ennemi
                if (this.vy > 0 && (this.y + this.h) < (enemy.y + enemy.h * 0.5)) {
                    enemy.takeDamage(game);
                    this.vy = -this.config.physics.jumpForce * 0.6; // Rebond
                    game.playSound('stomp');
                } 
                // Sinon, le joueur prend des dégâts
                else if (this.invulnerable === 0) {
                    game.loseLife();
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
        
        // L'invulnérabilité fait clignoter le joueur
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (assets[skinKey]) {
            ctx.drawImage(assets[skinKey], -this.w / 2, -this.h / 2, this.w, this.h);
        }
        ctx.restore();
    }
}
