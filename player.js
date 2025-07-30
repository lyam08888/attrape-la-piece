import { TILE } from './world.js';

// NOUVEAU: Dureté des blocs pour le minage
const TILE_HARDNESS = {
    [TILE.GRASS]: 1, [TILE.DIRT]: 1,
    [TILE.LEAVES]: 0.5, [TILE.WOOD]: 2,
    [TILE.STONE]: 3, [TILE.COAL]: 3.5, [TILE.IRON]: 4
};

// NOUVEAU: Outils efficaces contre certains types de blocs
const TOOL_EFFECTIVENESS = {
    'shovel': [TILE.GRASS, TILE.DIRT],
    'axe': [TILE.WOOD, TILE.LEAVES],
    'pickaxe': [TILE.STONE, TILE.COAL, TILE.IRON]
};

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
        this.tools = ['pickaxe', 'shovel', 'sword', 'bow', 'fishing_rod', 'knife'];
        this.selectedToolIndex = 0;
        // NOUVEAU: Système de minage
        this.miningTarget = null;
        this.miningProgress = 0;
    }

    update(keys, mouse, game) {
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
        
        this.handleActions(keys, mouse, game);
        this.handleTileCollisions(game);
        this.checkEnemyCollisions(game);

        if (this.invulnerable > 0) this.invulnerable--;
        if (this.swingTimer > 0) this.swingTimer--;
    }

    handleActions(keys, mouse, game) {
        const isActionPressed = keys.action || mouse.left;
        const selectedTool = this.tools[this.selectedToolIndex];

        if (isActionPressed) {
            this.swingTimer = 15;
            
            const target = this.getTargetTile(game);
            if (target) {
                // Si on change de cible, on réinitialise la progression
                if (!this.miningTarget || this.miningTarget.x !== target.x || this.miningTarget.y !== target.y) {
                    this.miningTarget = { x: target.x, y: target.y, type: target.type };
                    this.miningProgress = 0;
                }
                
                const toolMultiplier = TOOL_EFFECTIVENESS[selectedTool]?.includes(target.type) ? 2 : 1;
                this.miningProgress += 0.05 * toolMultiplier; // Vitesse de minage

                game.miningEffect = { x: target.x, y: target.y, progress: this.miningProgress / TILE_HARDNESS[target.type] };

                if (this.miningProgress >= TILE_HARDNESS[target.type]) {
                    this.mineBlock(target.x, target.y, target.type, game);
                    this.miningTarget = null;
                    this.miningProgress = 0;
                    game.miningEffect = null;
                }
            } else {
                this.resetMining(game);
            }
        } else {
            this.resetMining(game);
        }

        // Consomme l'action pour éviter les répétitions
        if (keys.action) keys.action = false;
    }

    resetMining(game) {
        this.miningTarget = null;
        this.miningProgress = 0;
        game.miningEffect = null;
    }

    getTargetTile(game) {
        const { tileSize, player } = this.config;
        const checkX = this.x + this.w / 2 + (this.dir * (this.w / 2 + 8));
        const checkY = this.y + this.h / 2;
        const tileX = Math.floor(checkX / tileSize);
        const tileY = Math.floor(checkY / tileSize);
        const tile = game.tileMap[tileY]?.[tileX];

        if (tile > 0) {
            return { x: tileX, y: tileY, type: tile };
        }
        return null;
    }

    mineBlock(tileX, tileY, tile, game) {
        game.tileMap[tileY][tileX] = TILE.AIR;
        game.createParticles(tileX * game.config.tileSize + game.config.tileSize / 2, tileY * game.config.tileSize + game.config.tileSize / 2, 10, '#fff');
        
        if (tile === TILE.WOOD) {
            const neighbors = [[tileX, tileY - 1], [tileX - 1, tileY], [tileX + 1, tileY]];
            for (const [nx, ny] of neighbors) {
                game.propagateTreeCollapse(nx, ny);
            }
        }
    }

    handleTileCollisions(game) { /* ... (code de collision inchangé) ... */ }
    checkEnemyCollisions(game) { /* ... (code de collision inchangé) ... */ }
    rectCollide(other) { /* ... (code de collision inchangé) ... */ }

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
        
        this.drawTool(ctx, assets);
        ctx.restore();
    }
}
