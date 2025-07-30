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
        this.swingTimer = 0;
        // NOUVEAU: Inventaire des outils
        this.tools = ['pickaxe', 'shovel', 'sword', 'bow', 'fishing_rod', 'knife'];
        this.selectedToolIndex = 0;
    }

    update(keys, game) {
        const { physics } = this.config;
        
        if (keys.left) { this.vx = -physics.playerSpeed; this.dir = -1; }
        else if (keys.right) { this.vx = physics.playerSpeed; this.dir = 1; }
        else { this.vx *= physics.friction; }

        if (keys.jump) {
            if (this.grounded) { this.vy = -physics.jumpForce; this.canDoubleJump = true; }
            else if (this.canDoubleJump) { this.vy = -physics.jumpForce * 0.8; this.canDoubleJump = false; }
            keys.jump = false;
        }

        this.vy += physics.gravity;
        
        this.handleActionKey(keys, game);
        this.handleTileCollisions(game);
        this.checkEnemyCollisions(game);

        if (this.invulnerable > 0) this.invulnerable--;
        if (this.swingTimer > 0) this.swingTimer--;
    }

    handleActionKey(keys, game) {
        if (keys.action) {
            const selectedTool = this.tools[this.selectedToolIndex];
            this.swingTimer = 15; // Démarre l'animation pour tous les outils

            switch(selectedTool) {
                case 'pickaxe':
                case 'shovel': // La pelle et la pioche ont la même fonction pour l'instant
                    this.mineBlock(game);
                    break;
                case 'sword':
                    // Logique d'attaque à ajouter ici
                    break;
                // ... autres cas pour les autres outils
            }
            
            keys.action = false;
        }
    }

    mineBlock(game) {
        const { tileSize } = this.config;
        const checkX = this.x + this.w / 2 + (this.dir * (this.w / 2 + 8));
        const checkY = this.y + this.h / 2;
        const tileX = Math.floor(checkX / tileSize);
        const tileY = Math.floor(checkY / tileSize);

        const tile = game.tileMap[tileY]?.[tileX];
        if (tile > 0) {
            game.tileMap[tileY][tileX] = TILE.AIR;
            game.createParticles(tileX * tileSize + tileSize / 2, tileY * tileSize + tileSize / 2, 5, '#fff');
            
            if (tile === TILE.WOOD) {
                const neighbors = [[tileX, tileY - 1], [tileX - 1, tileY], [tileX + 1, tileY]];
                for (const [nx, ny] of neighbors) {
                    game.propagateTreeCollapse(nx, ny);
                }
            }
        }
    }

    handleTileCollisions(game) { /* ... (code inchangé) ... */ }
    checkEnemyCollisions(game) { /* ... (code inchangé) ... */ }
    rectCollide(other) { /* ... (code inchangé) ... */ }

    drawTool(ctx, assets) {
        ctx.save();
        const selectedTool = this.tools[this.selectedToolIndex];
        const toolAsset = assets[`tool_${selectedTool}`];

        if (toolAsset) {
            ctx.translate(this.w * 0.2, this.h * 0.3);

            if (this.swingTimer > 0) {
                const swingProgress = (15 - this.swingTimer) / 15;
                const swingAngle = Math.sin(swingProgress * Math.PI) * 1.5;
                ctx.rotate(swingAngle);
            }
            // Ajuste la taille de l'outil pour qu'il soit bien proportionné
            ctx.drawImage(toolAsset, -12, -12, 24, 24);
        }
        ctx.restore();
    }

    draw(ctx, assets, skinKey) {
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
            ctx.fillStyle = '#ea4335';
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        }
        
        // On dessine l'outil sélectionné
        this.drawTool(ctx, assets);
        ctx.restore();
    }
}
