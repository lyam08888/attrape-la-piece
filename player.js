import { TILE } from './world.js';

export class Player {
    constructor(x, y, config, sound) {
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        // Increase the player size by a factor of 10 while keeping
        // the original proportions defined in config.json
        this.w = config.player.width * 3;
        this.h = config.player.height * 3;
        this.hitbox = {
            offsetX: config.player.hitbox.offsetX * 3,
            offsetY: config.player.hitbox.offsetY * 3,
            width:   config.player.hitbox.width * 3,
            height:  config.player.hitbox.height * 3
        };
        this.config = config;
        this.sound = sound;
        this.grounded = false;
        this.dir = 1;
        this.swingTimer = 0;
        this.tools = ['pickaxe', 'shovel', 'axe', 'sword', 'knife', 'bow', 'fishing_rod'];
        this.selectedToolIndex = 0;
        this.inventory = {};
        this.miningTarget = null;
        this.miningProgress = 0;

        this.state = 'idle';
        this.animTimer = 0;
        this.animFrame = 0;
    }

    getHitbox() {
        return { x: this.x + this.hitbox.offsetX, y: this.y + this.hitbox.offsetY, w: this.hitbox.width, h: this.hitbox.height };
    }

    rectCollide(other) {
        if (!other) return false;
        const box = this.getHitbox();
        return (
            box.x < other.x + other.w &&
            box.x + box.w > other.x &&
            box.y < other.y + other.h &&
            box.y + box.h > other.y
        );
    }

    update(keys, mouse, game, delta) {
        const { physics } = this.config;
        const accel = this.grounded ? physics.groundAcceleration : physics.airAcceleration;
        const speed = keys.run ? physics.playerSpeed * 1.5 : physics.playerSpeed;

        if (keys.left) {
            this.vx = Math.max(this.vx - accel, -speed);
            this.dir = -1;
        } else if (keys.right) {
            this.vx = Math.min(this.vx + accel, speed);
            this.dir = 1;
        } else {
            this.vx *= this.grounded ? physics.friction : physics.airResistance;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        if (keys.jump && this.grounded) {
            this.vy = -physics.jumpForce;
            this.sound?.play('jump');
        }

        this.vy += physics.gravity;
        if (this.vy > physics.maxFallSpeed) this.vy = physics.maxFallSpeed;

        this.handleCollisions(game);
        this.checkCollectibleCollisions(game);
        this.updateMiningTarget(mouse, game);
        this.updateStateAndAnimation();
        
        if (this.swingTimer > 0) this.swingTimer--;
        if (mouse.left && this.swingTimer <= 0) this.swingTimer = 20;
    }
    
    checkCollectibleCollisions(game) {
        if (!game.collectibles) return;
        for (let i = game.collectibles.length - 1; i >= 0; i--) {
            const item = game.collectibles[i];
            if (this.rectCollide(item)) {
                const key = item.tileType;
                this.inventory[key] = (this.inventory[key] || 0) + 1;
                const tileName = Object.keys(TILE).find(k=>TILE[k]===key) || "Objet";
                if (game.logger) game.logger.log(`+1 ${tileName}`);
                game.collectibles.splice(i, 1);
            }
        }
    }

    updateStateAndAnimation() {
        if (!this.grounded) {
            this.state = 'jumping';
        } else if (Math.abs(this.vx) > this.config.physics.playerSpeed) {
            this.state = 'running';
        } else if (Math.abs(this.vx) > 0.1) {
            this.state = 'walking';
        } else {
            this.state = 'idle';
        }
        
        const anim = this.config.playerAnimations[this.state];
        if (anim && anim.length > 0) {
            this.animTimer++;
            const frameDuration = this.state === 'running' ? 5 : 8;
            if (this.animTimer > frameDuration) {
                this.animFrame = (this.animFrame + 1) % anim.length;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 0;
        }
    }

    updateMiningTarget(mouse, game) {
        // CORRECTION : Ajout d'une vérification pour éviter le crash si la souris ou la caméra n'est pas prête.
        if (!game.camera || !mouse) return;
        
        const { tileSize, zoom } = game.config;
        const reach = (this.config.player.reach || 4) * tileSize;
        const mouseWorldX = game.camera.x + mouse.x / zoom;
        const mouseWorldY = game.camera.y + mouse.y / zoom;
        
        if (Math.hypot(mouseWorldX - (this.x + this.w / 2), mouseWorldY - (this.y + this.h / 2)) > reach) {
            this.miningTarget = null;
            return;
        }

        const tileX = Math.floor(mouseWorldX / tileSize);
        const tileY = Math.floor(mouseWorldY / tileSize);
        const tileType = game.tileMap[tileY]?.[tileX];

        if (tileType > TILE.AIR) {
            if (!this.miningTarget || this.miningTarget.x !== tileX || this.miningTarget.y !== tileY) {
                this.miningTarget = { x: tileX, y: tileY, type: tileType };
                this.miningProgress = 0;
            }
        } else {
            this.miningTarget = null;
        }
    }
    
    handleCollisions(game) {
        const { tileSize } = this.config;
        const map = game.tileMap;
        if (!map || map.length === 0) return;

        // Collision X
        this.x += this.vx;
        let hb = this.getHitbox();
        if (this.vx > 0) {
            const tx = Math.floor((hb.x + hb.w) / tileSize);
            const ty1 = Math.floor(hb.y / tileSize);
            const ty2 = Math.floor((hb.y + hb.h - 1) / tileSize);
            if ((map[ty1]?.[tx] > TILE.AIR) || (map[ty2]?.[tx] > TILE.AIR)) {
                this.x = tx * tileSize - this.hitbox.width - this.hitbox.offsetX;
                this.vx = 0;
            }
        } else if (this.vx < 0) {
            const tx = Math.floor(hb.x / tileSize);
            const ty1 = Math.floor(hb.y / tileSize);
            const ty2 = Math.floor((hb.y + hb.h - 1) / tileSize);
             if ((map[ty1]?.[tx] > TILE.AIR) || (map[ty2]?.[tx] > TILE.AIR)) {
                this.x = (tx + 1) * tileSize - this.hitbox.offsetX;
                this.vx = 0;
            }
        }

        // Collision Y
        this.y += this.vy;
        hb = this.getHitbox();
        this.grounded = false;
        if (this.vy > 0) {
            const ty = Math.floor((hb.y + hb.h) / tileSize);
            const tx1 = Math.floor(hb.x / tileSize);
            const tx2 = Math.floor((hb.x + hb.w - 1) / tileSize);
            if ((map[ty]?.[tx1] > TILE.AIR) || (map[ty]?.[tx2] > TILE.AIR)) {
                this.y = ty * tileSize - this.hitbox.height - this.hitbox.offsetY;
                this.vy = 0;
                this.grounded = true;
            }
        } else if (this.vy < 0) {
            const ty = Math.floor(hb.y / tileSize);
            const tx1 = Math.floor(hb.x / tileSize);
            const tx2 = Math.floor((hb.x + hb.w - 1) / tileSize);
            if ((map[ty]?.[tx1] > TILE.AIR) || (map[ty]?.[tx2] > TILE.AIR)) {
                this.y = (ty + 1) * tileSize - this.hitbox.offsetY;
                this.vy = 0;
            }
        }
    }

    draw(ctx, assets, playerAnimations) {
        if (!playerAnimations) return;
        const anim = playerAnimations[this.state] || playerAnimations['idle'];
        if (!anim) return;
        const frameKey = anim[this.animFrame % anim.length];
        const img = assets[frameKey];
        
        if (!img) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            return;
        }

        ctx.save();
        if (this.dir === -1) {
            ctx.scale(-1, 1);
            ctx.drawImage(img, -this.x - this.w, this.y, this.w, this.h);
        } else {
            ctx.drawImage(img, this.x, this.y, this.w, this.h);
        }
        ctx.restore();

        const selectedToolName = this.tools[this.selectedToolIndex];
        if (selectedToolName) {
            const toolAsset = assets[`tool_${selectedToolName}`];
            if (toolAsset) {
                ctx.save();
                const toolSize = this.w;
                const handOffsetX = this.dir === 1 ? this.w * 0.7 : this.w * 0.3;
                const handOffsetY = this.h * 0.5;
                const pivotX = this.x + handOffsetX;
                const pivotY = this.y + handOffsetY;
                ctx.translate(pivotX, pivotY);
                if (this.swingTimer > 0) {
                    const progress = (20 - this.swingTimer) / 20;
                    const angle = Math.sin(progress * Math.PI) * -this.dir;
                    ctx.rotate(angle);
                }
                ctx.drawImage(toolAsset, -toolSize / 2, -toolSize / 2, toolSize, toolSize);
                ctx.restore();
            }
        }
    }
}
