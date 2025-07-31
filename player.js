import { TILE } from './world.js';

// Hardness of blocks for mining
const TILE_HARDNESS = {
    [TILE.GRASS]: 1,
    [TILE.DIRT]: 1,
    [TILE.LEAVES]: 0.5,
    [TILE.WOOD]: 2,
    [TILE.STONE]: 3,
    [TILE.COAL]: 3.5,
    [TILE.IRON]: 4
};

// Tools effective against certain block types
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
        // Tool list (axe reintroduced for tree cutting)
        this.tools = ['pickaxe', 'shovel', 'axe', 'sword', 'bow', 'fishing_rod'];
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
            if (this.grounded) {
                this.vy = -physics.jumpForce;
                this.canDoubleJump = true;
            } else if (this.canDoubleJump) {
                this.vy = -physics.jumpForce * 0.8;
                this.canDoubleJump = false;
            }
            keys.jump = false;
        }

        this.vy += physics.gravity;

        this.handleActions(keys, mouse, game);
        this.handleTileCollisions(game);
        this.checkEnemyCollisions(game);
        this.checkCollectibleCollisions(game);
        this.checkObjectCollisions(game);

        if (this.invulnerable > 0) this.invulnerable--;
        if (this.swingTimer > 0) this.swingTimer--;
    }

    handleActions(keys, mouse, game) {
        const isAction = keys.action || mouse.left;
        const selectedTool = this.tools[this.selectedToolIndex];

        if (isAction) {
            this.swingTimer = 15;
            const target = this.getTargetTile(mouse, game);
            if (target) {
                if (!this.miningTarget || this.miningTarget.x !== target.x || this.miningTarget.y !== target.y) {
                    this.miningTarget = { x: target.x, y: target.y, type: target.type };
                    this.miningProgress = 0;
                }

                const effective = TOOL_EFFECTIVENESS[selectedTool]?.includes(target.type);
                const speed = effective ? 0.1 : 0.03;
                this.miningProgress += speed;
                game.miningEffect = {
                    x: target.x,
                    y: target.y,
                    progress: this.miningProgress / TILE_HARDNESS[target.type]
                };

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

// Use mouse if pressed, otherwise check blocks around/in front of the player

        if (mouse.left) {
            const worldMouseX = mouse.x / game.settings.zoom + game.camera.x;
            const worldMouseY = mouse.y / game.settings.zoom + game.camera.y;
            tileX = Math.floor(worldMouseX / tileSize);
            tileY = Math.floor(worldMouseY / tileSize);

            const px = this.x + this.w / 2;
            const py = this.y + this.h / 2;
            const dist = Math.hypot(px - worldMouseX, py - worldMouseY);
            if (dist > this.config.player.reach * tileSize) return null;
        } else {
const offsets = [
    [this.dir, 0],      // front
    [0, -1],            // above
    [0, 1],             // below
    [-this.dir, 0]      // behind
];
for (const [ox, oy] of offsets) {
    const checkX = this.x + this.w / 2 + ox * (this.w / 2 + 8);
    const checkY = this.y + this.h / 2 + oy * (this.h / 2);
    const cx = Math.floor(checkX / tileSize);
    const cy = Math.floor(checkY / tileSize);
    const tile = game.tileMap[cy]?.[cx];
    if (tile > 0) {
        return { x: cx, y: cy, type: tile };
    }
}
return null;

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
            x: tileX * this.config.tileSize,
            y: tileY * this.config.tileSize,
            w: this.config.tileSize,
            h: this.config.tileSize,
            vy: -2,
            tileType: tile
        });

        game.createParticles(
            tileX * this.config.tileSize + this.config.tileSize / 2,
            tileY * this.config.tileSize + this.config.tileSize / 2,
            10,
            '#fff'
        );

        if (tile === TILE.WOOD || tile === TILE.LEAVES) {
            const neighbors = [[tileX, tileY - 1], [tileX - 1, tileY], [tileX + 1, tileY]];
            for (const [nx, ny] of neighbors) {
                game.propagateTreeCollapse(nx, ny);
            }
        }
    }

    handleTileCollisions(game) {
        const { tileSize } = this.config;

        // Horizontal movement
        this.x += this.vx;
        if (this.vx > 0) {
            let top = Math.floor(this.y / tileSize);
            let bottom = Math.floor((this.y + this.h - 1) / tileSize);
            let right = Math.floor((this.x + this.w) / tileSize);
            for (let ty = top; ty <= bottom; ty++) {
                if (game.tileMap[ty]?.[right] > 0) {
                    this.x = right * tileSize - this.w - 0.01;
                    this.vx = 0;
                    break;
                }
            }
        } else if (this.vx < 0) {
            let top = Math.floor(this.y / tileSize);
            let bottom = Math.floor((this.y + this.h - 1) / tileSize);
            let left = Math.floor(this.x / tileSize);
            for (let ty = top; ty <= bottom; ty++) {
                if (game.tileMap[ty]?.[left] > 0) {
                    this.x = (left + 1) * tileSize + 0.01;
                    this.vx = 0;
                    break;
                }
            }
        }

        // Vertical movement
        this.y += this.vy;
        this.grounded = false;
        if (this.vy > 0) {
            let left = Math.floor((this.x + 1) / tileSize);
            let right = Math.floor((this.x + this.w - 1) / tileSize);
            let bottom = Math.floor((this.y + this.h) / tileSize);
            for (let tx = left; tx <= right; tx++) {
                if (game.tileMap[bottom]?.[tx] > 0) {
                    this.y = bottom * tileSize - this.h;
                    this.vy = 0;
                    this.grounded = true;
                    this.canDoubleJump = true;
                    break;
                }
            }
        } else if (this.vy < 0) {
            let left = Math.floor((this.x + 1) / tileSize);
            let right = Math.floor((this.x + this.w - 1) / tileSize);
            let top = Math.floor(this.y / tileSize);
            for (let tx = left; tx <= right; tx++) {
                if (game.tileMap[top]?.[tx] > 0) {
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
                } else if (this.invulnerable === 0) {
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

    checkObjectCollisions(game) {
        game.coins.forEach((coin, index) => {
            if (this.rectCollide(coin)) {
                game.score += 10;
                game.coins.splice(index, 1);
            }
        });
        game.bonuses.forEach((bonus, index) => {
            if (this.rectCollide(bonus)) {
                game.score += 100;
                game.bonuses.splice(index, 1);
            }
        });
        game.checkpoints.forEach(cp => {
            if (!cp.activated && this.rectCollide(cp)) {
                cp.activated = true;
                game.lastCheckpoint = { x: cp.x, y: cp.y };
            }
        });
    }

    rectCollide(other) {
        return (
            this.x < other.x + other.w &&
            this.x + this.w > other.x &&
            this.y < other.y + other.h &&
            this.y + this.h > other.y
        );
    }

    drawTool(ctx, assets) {
        ctx.save();
        const selectedTool = this.tools[this.selectedToolIndex];
        const toolAsset = assets[`tool_${selectedTool}`];

        if (toolAsset) {
            ctx.translate(this.w * 0.2, this.h * 0.3);
            if (this.swingTimer > 0) {
                const progress = (15 - this.swingTimer) / 15;
                const angle = Math.sin(progress * Math.PI) * 1.5;
                ctx.rotate(angle);
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
        if (this.dir === 1) ctx.scale(-1, 1);

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
