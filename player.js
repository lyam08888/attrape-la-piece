import { TILE } from './world.js';

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
        // Inventaire simple
        this.inventory = { [TILE.DIRT]: 0, [TILE.STONE]: 0, [TILE.WOOD]: 0 };
        this.equippedItem = TILE.DIRT; // Par défaut, on peut poser de la terre
        this.isMining = false;
        this.miningTimer = 0;
    }

    update(keys, mouse, game) {
        const { physics } = this.config;
        
        // Mouvement horizontal
        if (keys.left) { this.vx = -physics.playerSpeed; this.dir = -1; }
        else if (keys.right) { this.vx = physics.playerSpeed; this.dir = 1; }
        else { this.vx *= physics.friction; }

        // Saut
        if (keys.jump) {
            if (this.grounded) { this.vy = -physics.jumpForce; this.canDoubleJump = true; }
            else if (this.canDoubleJump) { this.vy = -physics.jumpForce * 0.8; this.canDoubleJump = false; }
            keys.jump = false;
        }

        this.vy += physics.gravity;
        
        this.handleMiningAndPlacing(mouse, game);

        this.handleTileCollisions(game);
        this.checkEnemyCollisions(game);

        if (this.invulnerable > 0) this.invulnerable--;
    }

    handleMiningAndPlacing(mouse, game) {
        const { tileSize, player } = this.config;
        const worldMouseX = mouse.x + game.camera.x;
        const worldMouseY = mouse.y + game.camera.y;
        const tileX = Math.floor(worldMouseX / tileSize);
        const tileY = Math.floor(worldMouseY / tileSize);

        const playerCenterX = this.x + this.w / 2;
        const playerCenterY = this.y + this.h / 2;
        const dist = Math.sqrt(Math.pow(playerCenterX - worldMouseX, 2) + Math.pow(playerCenterY - worldMouseY, 2));

        if (dist > player.reach * tileSize) return;

        // Minage (clic gauche)
        if (mouse.left) {
            const tile = game.tileMap[tileY]?.[tileX];
            if (tile > 0) {
                game.tileMap[tileY][tileX] = TILE.AIR;
                if (this.inventory[tile] !== undefined) {
                    this.inventory[tile]++;
                }
                game.createParticles(tileX * tileSize + tileSize / 2, tileY * tileSize + tileSize / 2, 5, '#fff');
            }
        }
        // Placement (clic droit)
        else if (mouse.right) {
            if (game.tileMap[tileY]?.[tileX] === TILE.AIR && this.inventory[this.equippedItem] > 0) {
                game.tileMap[tileY][tileX] = this.equippedItem;
                this.inventory[this.equippedItem]--;
            }
        }
    }

    handleTileCollisions(game) {
        const { tileSize } = this.config;
        this.x += this.vx;
        this.checkCollisionAxis('x', game, tileSize);
        this.y += this.vy;
        this.grounded = false;
        this.checkCollisionAxis('y', game, tileSize);
    }

    checkCollisionAxis(axis, game, tileSize) {
        const isX = axis === 'x';
        const velocity = isX ? 'vx' : 'vy';
        const pos = isX ? 'x' : 'y';
        const dim = isX ? 'w' : 'h';

        const start = Math.floor(this[pos] / tileSize);
        const end = Math.floor((this[pos] + this[dim]) / tileSize);
        const otherStart = Math.floor(this[isX ? 'y' : 'x'] / tileSize);
        const otherEnd = Math.floor((this[isX ? 'y' : 'x'] + this[isX ? 'h' : 'w']) / tileSize);

        for (let i = start; i <= end; i++) {
            for (let j = otherStart; j <= otherEnd; j++) {
                const tileX = isX ? i : j;
                const tileY = isX ? j : i;
                if (game.tileMap[tileY]?.[tileX] > 0) {
                    if (this[velocity] > 0) {
                        this[pos] = i * tileSize - this[dim];
                    } else if (this[velocity] < 0) {
                        this[pos] = (i + 1) * tileSize;
                    }
                    if (!isX) {
                        if (this.vy > 0) {
                            this.grounded = true;
                            this.canDoubleJump = true;
                        }
                    }
                    this[velocity] = 0;
                }
            }
        }
    }

    checkEnemyCollisions(game) {
        game.enemies.forEach(enemy => {
            if (this.rectCollide(enemy) && !enemy.isDying) {
                if (this.vy > 0 && (this.y + this.h) < (enemy.y + enemy.h * 0.5)) {
                    enemy.takeDamage(game);
                    this.vy = -this.config.physics.jumpForce * 0.6;
                } 
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
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        // CORRECTION: Si le sprite de base regarde vers la gauche,
        // on le retourne quand le joueur va à droite (dir === 1).
        // Si votre sprite de base regarde à droite, changez la condition en (this.dir === -1).
        if (this.dir === 1) {
            ctx.scale(-1, 1);
        }

        const skinAsset = assets[skinKey];
        if (skinAsset) {
            // CORRECTION: On dessine le sprite du joueur, et non plus un rectangle.
            ctx.drawImage(skinAsset, -this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            // Fallback si l'image n'est pas chargée
            ctx.fillStyle = isGodMode ? 'gold' : '#ea4335';
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        }
        
        ctx.restore();
    }
}
