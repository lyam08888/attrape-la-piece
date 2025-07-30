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
        // NOUVEAU: État pour l'animation de la hache
        this.isSwinging = false;
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

        // Logique de collision stable
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

        // Si le curseur est hors de portée, on arrête l'animation
        if (dist > player.reach * tileSize) {
            this.isSwinging = false;
            return;
        }

        // Minage (clic gauche)
        if (mouse.left) {
            this.isSwinging = true; // Active l'animation de la hache
            const tile = game.tileMap[tileY]?.[tileX];
            if (tile > 0) {
                game.tileMap[tileY][tileX] = TILE.AIR;
                if (this.inventory[tile] !== undefined) {
                    this.inventory[tile]++;
                }
                game.createParticles(tileX * tileSize + tileSize / 2, tileY * tileSize + tileSize / 2, 5, '#fff');
            }
        } else {
            this.isSwinging = false; // Arrête l'animation si le clic est relâché
        }
        // Placement (clic droit)
        if (mouse.right) {
            if (game.tileMap[tileY]?.[tileX] === TILE.AIR && this.inventory[this.equippedItem] > 0) {
                game.tileMap[tileY][tileX] = this.equippedItem;
                this.inventory[this.equippedItem]--;
            }
        }
    }

    handleTileCollisions(game) {
        const { tileSize } = this.config;

        // Appliquer le mouvement sur l'axe X
        this.x += this.vx;
        
        // Vérifier les collisions sur l'axe X
        if (this.vx > 0) { // Droite
            let top = Math.floor(this.y / tileSize);
            let bottom = Math.floor((this.y + this.h - 1) / tileSize);
            let right = Math.floor((this.x + this.w) / tileSize);
            for (let tileY = top; tileY <= bottom; tileY++) {
                if (game.tileMap[tileY]?.[right] > 0) {
                    this.x = right * tileSize - this.w - 0.01;
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
                    this.x = (left + 1) * tileSize + 0.01;
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
            let left = Math.floor((this.x + 1) / tileSize);
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

    // NOUVEAU: Fonction pour dessiner la hache
    drawAxe(ctx) {
        ctx.save();
        // Position de la hache dans la main du personnage
        ctx.translate(this.w * 0.1, this.h * 0.1);

        // Animation de balancement si le joueur est en train de miner
        if (this.isSwinging) {
            const swingAngle = Math.sin(Date.now() / 80) * 1.2; // Angle en radians
            ctx.rotate(swingAngle);
        }

        // Dessiner la hache (simple représentation)
        // Manche
        ctx.fillStyle = '#8B4513'; // Marron
        ctx.fillRect(-2, -12, 4, 20);

        // Tête de la hache
        ctx.fillStyle = '#C0C0C0'; // Argent
        ctx.beginPath();
        ctx.moveTo(-8, -18);
        ctx.lineTo(8, -18);
        ctx.lineTo(4, -10);
        ctx.lineTo(-4, -10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
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
        
        // On dessine la hache par-dessus le personnage
        this.drawAxe(ctx);

        ctx.restore();
    }
}
