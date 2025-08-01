import { TILE } from './world.js';

export class Player {
    constructor(x, y, config, sound) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = config.player.width;
        this.h = config.player.height;
        this.margin = config.player.collisionMargin || 0;
        
        const hitboxWidth = 14;
        this.hitbox = {
            offsetX: (this.w - hitboxWidth) / 2,
            offsetY: config.player.hitbox?.offsetY || 3,
            width: hitboxWidth,
            height: config.player.hitbox?.height || 18
        };

        this.config = config;
        this.sound = sound;
        this.stepTimer = 0;
        this.grounded = false;
        this.canDoubleJump = true;
        this.dir = 1;
        this.invulnerable = 0;
        this.swingTimer = 0;
        this.state = 'idle';
        this.animTimer = 0;
        this.animFrame = 0;
        
        // --- CORRECTION: Utiliser des noms d'outils valides ---
        // Les noms doivent correspondre aux clés d'asset et aux outils
        // utilisés dans miningEngine.js. Les préfixes "stone_" empêchaient
        // de charger les bonnes icônes et rendait le minage moins efficace.
        this.tools = ['pickaxe', 'shovel', 'axe', 'knife', 'sword', 'bow', 'fishing_rod'];
        this.selectedToolIndex = 0;
        this.inventory = {};
        this.quests = [];
        this.isSwimming = false;

        this.level = 1;
        this.xp = 0;
        this.xpToNext = 100;
        this.skillPoints = 0;
        this.attributes = { strength: 0, agility: 0, vitality: 0 };

        this.posture = 'standing';
        this.doubleJumped = false;
        this.animations = config.playerAnimations || {};
        this.flying = false;
    }

    getHitbox() {
        return {
            x: this.x + this.hitbox.offsetX,
            y: this.y + this.hitbox.offsetY,
            w: this.hitbox.width,
            h: this.hitbox.height
        };
    }

    update(keys, mouse, game) {
        const { physics } = this.config;
        const baseSpeed = physics.playerSpeed * (1 + this.attributes.agility * 0.05);
        const runSpeed = baseSpeed * 1.5;
        const jumpForce = physics.jumpForce * (1 + this.attributes.agility * 0.03);

        if (keys.fly) {
            this.flying = !this.flying;
            if (this.flying) {
                this.vy = 0;
            }
            keys.fly = false;
        }

        if (this.posture !== 'standing' && keys.jump) {
            this.setPosture('standing');
            keys.jump = false;
        }
        if (keys.doubleDown && this.grounded) {
            this.setPosture('prone');
            keys.doubleDown = false;
        } else if (keys.down && this.posture === 'standing' && this.grounded) {
            this.setPosture('crouching');
        } else if (!keys.down && this.posture === 'crouching') {
            this.setPosture('standing');
        }

        let speed = baseSpeed;
        if (keys.run && this.posture === 'standing') speed = runSpeed;
        if (this.posture === 'crouching') speed *= 0.5;
        if (this.posture === 'prone') speed *= 0.3;

        const accel = this.grounded ? (physics.groundAcceleration || 0.4) : (physics.airAcceleration || 0.2);

        if (this.isSwimming) {
            this.vy *= 0.9;
            this.vx *= 0.9;
            if (keys.jump) this.vy -= 0.4;
            if (keys.down) this.vy += 0.2;

            if (keys.left) { this.vx = Math.max(this.vx - accel * 0.5, -speed * 0.7); this.dir = -1; } 
            else if (keys.right) { this.vx = Math.min(this.vx + accel * 0.5, speed * 0.7); this.dir = 1; }

        } else if (this.flying) {
            if (keys.left) { this.vx = -speed; this.dir = -1; }
            else if (keys.right) { this.vx = speed; this.dir = 1; }
            else { this.vx = 0; }

            if (keys.jump) this.vy = -speed;
            else if (keys.down) this.vy = speed;
            else this.vy = 0;
        } else {
            if (keys.left) {
                this.vx = Math.max(this.vx - accel, -speed);
                this.dir = -1;
            } else if (keys.right) {
                this.vx = Math.min(this.vx + accel, speed);
                this.dir = 1;
            } else {
                const drag = this.grounded ? physics.friction : physics.airResistance;
                this.vx *= drag;
                if (Math.abs(this.vx) < 0.01) this.vx = 0;
            }

            if (keys.jump && this.posture === 'standing') {
                if (this.grounded) {
                    this.vy = -jumpForce;
                    this.sound?.play('jump');
                    this.canDoubleJump = true;
                    this.doubleJumped = false;
                } else if (this.canDoubleJump) {
                    this.vy = -jumpForce * 0.8;
                    this.sound?.play('jump');
                    this.canDoubleJump = false;
                    this.doubleJumped = true;
                }
                keys.jump = false;
            }

            this.vy += physics.gravity;
            if (this.vy > physics.maxFallSpeed) this.vy = physics.maxFallSpeed;
        }

        this.handleActions(keys, mouse, game);
        this.handleTileCollisions(game);
        if (this.flying) this.grounded = false;
        this.checkCollectibleCollisions(game);
        this.updateStateAndAnimation();
        
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.swingTimer > 0) this.swingTimer--;
        keys.doubleDown = false;
    }
    
    updateStateAndAnimation() {
        if (this.isSwimming) {
            this.state = 'swimming';
        } else if (this.flying) {
            this.state = 'flying';
        } else if (!this.grounded) {
            this.state = this.doubleJumped ? 'doubleJump' : 'jumping';
        } else if (this.posture === 'prone') {
            this.state = Math.abs(this.vx) > 0.1 ? 'proneWalking' : 'prone';
        } else if (this.posture === 'crouching') {
            this.state = Math.abs(this.vx) > 0.1 ? 'crouchWalking' : 'crouching';
        } else if (Math.abs(this.vx) > (this.config.physics.playerSpeed * 1.1)) {
            this.state = 'running';
        } else if (Math.abs(this.vx) > 0.1) {
            this.state = 'walking';
        } else {
            this.state = 'idle';
        }
        
        const frames = this.animations[this.state] || [];
        if (frames.length > 1) {
            this.animTimer++;
            if (this.animTimer > 10) {
                this.animFrame = (this.animFrame + 1) % frames.length;
                this.animTimer = 0;
            }
        } else {
            this.animTimer = 0;
            this.animFrame = 0;
        }
    }

    handleActions(keys, mouse, game) {
        if (keys.action) {
            for (const pnj of game.pnjs) {
                if (this.rectCollide(pnj)) {
                    game.startDialogue(pnj);
                    return; 
                }
            }
            for (const chest of game.chests) {
                if (this.rectCollide(chest)) {
                    if (game.openChest) game.openChest(chest);
                    return;
                }
            }
        }

        // Les noms doivent rester cohérents avec this.tools
        const attackTools = ['sword', 'knife', 'axe', 'pickaxe'];
        const selectedTool = this.tools[this.selectedToolIndex];
        if (mouse.left && attackTools.some(t => selectedTool.includes(t)) && this.swingTimer <= 0) {
            this.swingTimer = 30;
            this.attackNearbyEnemies(game);
        }
    }

    attackNearbyEnemies(game) {
        const range = this.config.player.attackRange || this.config.tileSize;
        const hb = this.getHitbox();
        const attackBox = {
            x: this.dir === 1 ? hb.x + hb.w : hb.x - range,
            y: hb.y,
            w: range,
            h: hb.h
        };

        for (const enemy of game.enemies) {
            if (!enemy || enemy.isDead || enemy.isDying) continue;
            if (typeof enemy.rectCollide === 'function' && enemy.rectCollide(attackBox)) {
                if (typeof enemy.takeDamage === 'function') {
                    enemy.takeDamage(game, this.getDamage());
                }
            }
        }
    }

    addXP(amount, game) {
        this.xp += amount;
        game.createParticles(this.x + this.w / 2, this.y, 5, '#ffff66');
        while (this.xp >= this.xpToNext && this.level < 999) {
            this.xp -= this.xpToNext;
            this.level++;
            this.skillPoints++;
            this.xpToNext = Math.floor(this.xpToNext * 1.1 + 50);
            game.showLevelPopup(this.level);
        }
    }

    getDamage() {
        const tool = this.tools[this.selectedToolIndex];
        let baseDamage = 1;
        if (tool.includes('sword')) baseDamage = 10;
        if (tool.includes('knife')) baseDamage = 5;
        return baseDamage + this.attributes.strength * 2;
    }

    setPosture(p) {
        if (this.posture === p) return;
        const oldH = this.h;
        const baseHeight = this.config.player.height;
        const baseHitboxHeight = this.config.player.hitbox.height;
        const bottomMargin = baseHeight - (this.config.player.hitbox.offsetY + baseHitboxHeight);

        if (p === 'crouching') {
            this.h = Math.floor(baseHeight * 0.6);
            this.hitbox.height = Math.floor(baseHitboxHeight * 0.6);
        } else if (p === 'prone') {
            this.h = Math.floor(baseHeight * 0.3);
            this.hitbox.height = Math.floor(baseHitboxHeight * 0.3);
        } else {
            this.h = baseHeight;
            this.hitbox.height = baseHitboxHeight;
        }

        this.hitbox.offsetY = this.h - this.hitbox.height - bottomMargin;
        this.y += oldH - this.h;
        this.posture = p;
    }

    rectCollide(other) {
        const box = this.getHitbox();
        return (
            box.x < other.x + other.w &&
            box.x + box.w > other.x &&
            box.y < other.y + other.h &&
            box.y + box.h > other.y
        );
    }

    handleTileCollisions(game) {
        const { tileSize } = this.config;
        const map = game.tileMap;
        const worldH = map.length;
        const worldW = map[0].length;
        const m = this.margin;

        this.x += this.vx;
        let hbX = this.x + this.hitbox.offsetX;
        let hbY = this.y + this.hitbox.offsetY;
        let startY = Math.max(0, Math.floor((hbY + m) / tileSize));
        let endY = Math.min(worldH - 1, Math.floor((hbY + this.hitbox.height - m - 1) / tileSize));
        if (this.vx !== 0) {
            const dir = Math.sign(this.vx);
            const checkX = dir > 0 ? Math.min(worldW - 1, Math.floor((hbX + this.hitbox.width - m) / tileSize))
                                     : Math.max(0, Math.floor((hbX + m) / tileSize));
            for (let y = startY; y <= endY; y++) {
                if (map[y]?.[checkX] > 0) {
                    if (dir > 0) this.x = checkX * tileSize - this.hitbox.width - this.hitbox.offsetX;
                    else this.x = (checkX + 1) * tileSize - this.hitbox.offsetX;
                    this.vx = 0;
                    hbX = this.x + this.hitbox.offsetX;
                    break;
                }
            }
        }

        this.y += this.vy;
        this.grounded = false;
        hbX = this.x + this.hitbox.offsetX;
        hbY = this.y + this.hitbox.offsetY;
        let startX = Math.max(0, Math.floor((hbX + m) / tileSize));
        let endX = Math.min(worldW - 1, Math.floor((hbX + this.hitbox.width - m - 1) / tileSize));

        if (this.vy > 0) {
            const checkY = Math.min(worldH - 1, Math.floor((hbY + this.hitbox.height) / tileSize));
            for (let x = startX; x <= endX; x++) {
                if (map[checkY]?.[x] > 0) {
                    this.y = checkY * tileSize - this.hitbox.height - this.hitbox.offsetY;
                    this.vy = 0;
                    this.grounded = true;
                    this.doubleJumped = false;
                    hbY = this.y + this.hitbox.offsetY;
                    break;
                }
            }
        } else if (this.vy < 0) {
            const checkY = Math.max(0, Math.floor(hbY / tileSize));
            for (let x = startX; x <= endX; x++) {
                if (map[checkY]?.[x] > 0) {
                    this.y = (checkY + 1) * tileSize - this.hitbox.offsetY;
                    this.vy = 0;
                    hbY = this.y + this.hitbox.offsetY;
                    break;
                }
            }
        }

        if (this.x + this.hitbox.offsetX < 0) { this.x = -this.hitbox.offsetX; this.vx = 0; }
        if (this.x + this.hitbox.offsetX + this.hitbox.width > worldW * tileSize) {
            this.x = worldW * tileSize - this.hitbox.width - this.hitbox.offsetX;
            this.vx = 0;
        }
    }

    checkCollectibleCollisions(game) {
        const collect = (arr, cb) => {
            for (let i = arr.length - 1; i >= 0; i--) {
                if (this.rectCollide(arr[i])) {
                    cb(arr[i]);
                    arr.splice(i, 1);
                }
            }
        };
        collect(game.coins, () => game.addXP(5));
        collect(game.bonuses, () => {
            if (game.lives < game.config.player.maxLives) game.lives++;
        });
        collect(game.collectibles, item => {
            const key = item.tileType;
            this.inventory[key] = (this.inventory[key] || 0) + 1;
        });
    }

    draw(ctx, assets, skinKey) {
        ctx.save();
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        const frames = this.animations[this.state] || [];
        const frameKey = frames[this.animFrame] || skinKey || 'player1';
        const img = assets[frameKey];
        
        ctx.save();
        if (this.dir === -1) {
            ctx.scale(-1, 1);
            if (img) ctx.drawImage(img, -this.x - this.w, this.y, this.w, this.h);
        } else {
            if (img) ctx.drawImage(img, this.x, this.y, this.w, this.h);
        }
        ctx.restore();

        const selectedToolName = this.tools[this.selectedToolIndex];
        if (selectedToolName && this.state !== 'swimming') {
            const toolAsset = assets[`tool_${selectedToolName}`];
            if (toolAsset) {
                ctx.save();
                
                // --- CORRECTION: Rétablir une taille d'outil visible ---
                const toolSize = this.w * 0.8;
                const handOffsetX = this.dir === 1 ? this.w * 0.7 : this.w * 0.3;
                const handOffsetY = this.h * 0.6;
                const pivotX = this.x + handOffsetX;
                const pivotY = this.y + handOffsetY;
                
                ctx.translate(pivotX, pivotY);

                if (this.swingTimer > 0) {
                    const progress = (30 - this.swingTimer) / 30;
                    const angle = Math.sin(progress * Math.PI) * -this.dir * 1.5;
                    ctx.rotate(angle);
                } else {
                    ctx.rotate(this.dir * 0.5);
                }

                ctx.drawImage(toolAsset, -toolSize / 2, -toolSize / 2, toolSize, toolSize);
                ctx.restore();
            }
        }
        ctx.restore();
    }
}
