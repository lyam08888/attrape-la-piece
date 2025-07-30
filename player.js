export class Player {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = config.player.width;
        this.h = config.player.height;
        this.config = config;
        this.grounded = false;
        this.canDoubleJump = true;
        this.dir = 1;
        this.invulnerable = 0;
        this.frame = 0;
    }

    update(keys, game) {
        const { physics } = this.config;
        
        // Mouvement horizontal
        if (keys.left) { this.vx = -physics.playerSpeed; this.dir = -1; }
        else if (keys.right) { this.vx = physics.playerSpeed; this.dir = 1; }
        else { this.vx *= physics.friction; }

        // Mouvement vertical (saut)
        if (keys.jump) {
            if (this.grounded) { 
                this.vy = -physics.jumpForce; 
                this.canDoubleJump = true; 
                game.playSound('jump');
            }
            else if (this.canDoubleJump) { 
                this.vy = -physics.jumpForce * 0.8; 
                this.canDoubleJump = false; 
                game.playSound('jump');
            }
            keys.jump = false;
        }

        // Appliquer la gravité
        this.vy += physics.gravity;
        
        // Gérer les collisions avec le monde en tuiles
        this.handleTileCollisions(game);

        // Gérer les collisions avec les ennemis
        this.checkEnemyCollisions(game);

        if (this.invulnerable > 0) this.invulnerable--;
    }

    handleTileCollisions(game) {
        const { tileSize } = this.config;

        // Collision sur l'axe X
        this.x += this.vx;
        let startX = Math.floor(this.x / tileSize);
        let endX = Math.floor((this.x + this.w) / tileSize);
        let startY = Math.floor(this.y / tileSize);
        let endY = Math.floor((this.y + this.h) / tileSize);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (game.tileMap[y] && game.tileMap[y][x] > 0) {
                    if (this.vx > 0) {
                        this.x = x * tileSize - this.w;
                    } else if (this.vx < 0) {
                        this.x = (x + 1) * tileSize;
                    }
                    this.vx = 0;
                }
            }
        }

        // Collision sur l'axe Y
        this.y += this.vy;
        this.grounded = false;
        startX = Math.floor(this.x / tileSize);
        endX = Math.floor((this.x + this.w) / tileSize);
        startY = Math.floor(this.y / tileSize);
        endY = Math.floor((this.y + this.h) / tileSize);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                if (game.tileMap[y] && game.tileMap[y][x] > 0) {
                    if (this.vy > 0) {
                        this.y = y * tileSize - this.h;
                        this.grounded = true;
                        this.canDoubleJump = true;
                    } else if (this.vy < 0) {
                        this.y = (y + 1) * tileSize;
                    }
                    this.vy = 0;
                }
            }
        }
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
        
        // L'invulnérabilité fait clignoter le joueur
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.fillStyle = isGodMode ? 'gold' : '#ea4335';
        ctx.translate(this.x, this.y);
        if (this.dir === -1) {
            ctx.scale(-1, 1);
            ctx.translate(-this.w, 0);
        }
        
        // On dessine une simple boîte pour le joueur pour l'instant
        // Vous pouvez remplacer ceci par votre sprite
        ctx.fillRect(0, 0, this.w, this.h);
        
        ctx.restore();
    }
}
