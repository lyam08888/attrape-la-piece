import { TILE } from './world.js';

// Dureté des blocs pour le minage
const TILE_HARDNESS = {
    [TILE.GRASS]: 1, [TILE.DIRT]: 1,
    [TILE.LEAVES]: 0.5, [TILE.WOOD]: 2,
    [TILE.STONE]: 3, [TILE.COAL]: 3.5, [TILE.IRON]: 4
};

// Outils efficaces contre certains types de blocs
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
        // La hache a été retirée pour correspondre à vos assets
        this.tools = ['pickaxe', 'shovel', 'sword', 'bow', 'fishing_rod', 'knife'];
        this.selectedToolIndex = 0;
        this.inventory = {};
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
        this.checkCollectibleCollisions(game);

        if (this.invulnerable > 0) this.invulnerable--;
        if (this.swingTimer > 0) this.swingTimer--;
    }

    handleActions(keys, mouse, game) {
        const isActionPressed = keys.action || mouse.left;
        const selectedTool = this.tools[this.selectedToolIndex];

        if (isActionPressed) {
            this.swingTimer = 15;
            
            const target = this.getTargetTile(mouse, game);
            if (target) {
                if (!this.miningTarget || this.miningTarget.x !== target.x || this.miningTarget.y !== target.y) {
                    this.miningTarget = { x: target.x, y: target.y, type: target.type };
                    this.miningProgress = 0;
                }
                
                const toolMultiplier = TOOL_EFFECTIVENESS[selectedTool]?.includes(target.type) ? 3 : 0.5;
                this.miningProgress += 0.05 * toolMultiplier;

                game.miningEffect = { x: target.x, y: target.y, progress: this.miningProgress / TILE_HARDNESS[target.type] };

                if (this.miningProgress >= TILE_HARDNESS[target.type]) {
                    this.mineBlock(target.x, target.y, target.type, game);
                    this.resetMining(game);
                }
            } else {
                this.resetMining(game);
            }
        } else {
            this.resetMining(game);
        }
    }

    resetMining(game) {
        this.miningTarget = null;
        this.miningProgress = 0;
        game.miningEffect = null;
    }

    getTargetTile(mouse, game) {
        const { tileSize } = this.config;
        let tileX, tileY;

        // On utilise la souris si le clic gauche est utilisé, sinon la direction du personnage
        if (mouse.left) {
            const worldMouseX = mouse.x / game.settings.zoom + game.camera.x;
            const worldMouseY = mouse.y / game.settings.zoom + game.camera.y;
            tileX = Math.floor(worldMouseX / tileSize);
            tileY = Math.floor(worldMouseY / tileSize);

            const playerCenterX = this.x + this.w / 2;
            const playerCenterY = this.y + this.h / 2;
            const dist = Math.sqrt(Math.pow(playerCenterX - worldMouseX, 2) + Math.pow(playerCenterY - worldMouseY, 2));
            if (dist > this.config.player.reach * tileSize) return null;

        } else {
            const checkX = this.x + this.w / 2 + (this.dir * (this.w / 2 + 8));
            const checkY = this.y + this.h / 2;
            tileX = Math.floor(checkX / tileSize);
            tileY = Math.floor(checkY / tileSize);
        }
        
        const tile = game.tileMap[tileY]?.[tileX];

        if (tile > 0) {
            return { x: tileX, y: tileY, type: tile };
        }
        return null;
    }

    mineBlock(tileX, tileY, tile, game) {
        game.tileMap[tileY][tileX] = TILE.AIR;
        
        game.collectibles.push({
            x: tileX * game.config.tileSize,
            y: tileY * game.config.tileSize,
            vy: -2,
            tileType: tile
        });
        
        if (tile === TILE.WOOD) {
            const neighbors = [[tileX, tileY - 1], [tileX - 1, tileY], [tileX + 1, tileY]];
            for (const [nx, ny] of neighbors) {
                game.propagateTreeCollapse(nx, ny);
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

    checkCollectibleCollisions(game) {
        game.collectibles.forEach((item, index) => {
            if (this.rectCollide(item)) {
                if (!this.inventory[item.tileType]) {
                    this.inventory[item.tileType] = 0;
                }
                this.inventory[item.tileType]++;
                game.collectibles.splice(index, 1);
            }
        });
    }
    
    rectCollide(other) {
        return this.x < other.x + other.w && this.x + this.w > other.x &&
               this.y < other.y + other.h && this.y + this.h > other.y;
    }

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
