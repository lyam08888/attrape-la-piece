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
        this.inventory = { [TILE.DIRT]: 10, [TILE.STONE]: 10, [TILE.WOOD]: 10 }; // Commence avec quelques blocs
        this.equippedItem = TILE.DIRT;
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

        // CORRECTION: Nouvelle logique de collision plus stable
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

    // CORRECTION: Logique de collision entièrement réécrite pour être plus précise
    handleTileCollisions(game) {
        const { tileSize } = this.config;

        // Appliquer le mouvement sur l'axe X
        this.x += this.vx;
        
        // Vérifier les collisions sur l'axe X
        if (this.vx > 0) { // Droite
            let top = Math.floor(this.y / tileSize);
            let bottom = Math.floor((this.y + this.h - 1) / tileSize); // -1 pour éviter de s'accrocher au sol
            let right = Math.floor((this.x + this.w) / tileSize);
            for (let tileY = top; tileY <= bottom; tileY++) {
                if (game.tileMap[tileY]?.[right] > 0) {
                    this.x = right * tileSize - this.w - 0.01; // -0.01 pour éviter de rester coincé
                    this.vx = 0;
                    break;
                }
            }
        } else if (this.vx < 0) { // Gauche
            let top = Math.floor(this.y / tileSize);
            let bottom = Math.floor((this.y + this.h - 1) / tileSize);
            let left = Math.floor(this.x / tileSize);
            for (let tileY = top; tileY <= bottom; tileY++) {
                if (game.tileMap[tileY]?.[left] > 0) {
                    this.x = (left + 1) * tileSize + 0.01; // +0.01 pour éviter de rester coincé
                    this.vx = 0;
                    break;
                }
            }
        }

        // Appliquer le mouvement sur l'axe Y
        this.y += this.vy;
        this.grounded = false;
        
        // Vérifier les collisions sur l'axe Y
        if (this.vy > 0) { // Bas
            let left = Math.floor((this.x + 1) / tileSize); // +1 et -1 pour éviter de s'accrocher aux murs
            let right = Math.floor((this.x + this.w - 1) / tileSize);
            let bottom = Math.floor((this.y + this.h) / tileSize);
            for (let tileX = left; tileX <= right; tileX++) {
                if (game.tileMap[bottom]?.[tileX] > 0) {
                    this.y = bottom * tileSize - this.h;
                    this.vy = 0;
                    this.grounded = true;
                    this.canDoubleJump = true;
                    break;
                }
            }
        } else if (this.vy < 0) { // Haut
            let left = Math.floor((this.x + 1) / tileSize);
            let right = Math.floor((this.x + this.w - 1) / tileSize);
            let top = Math.floor(this.y / tileSize);
            for (let tileX = left; tileX <= right; tileX++) {
                if (game.tileMap[top]?.[tileX] > 0) {
                    this.y = (top + 1) * tileSize;
                    this.vy = 0;
                    break;
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

        if (this.dir === 1) {
            ctx.scale(-1, 1);
        }

        const skinAsset = assets[skinKey];
        if (skinAsset) {
            ctx.drawImage(skinAsset, -this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            ctx.fillStyle = isGodMode ? 'gold' : '#ea4335';
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        }
        
        ctx.restore();
    }
}
