export class Player {
    constructor(x, y, config, sound) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = config.player.width;
         this.h = config.player.height;
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
        // Tool list including the basic weapons that can be used for mining
        // Tools correspond to the icons located in assets/tool_*.png
        this.tools = ['pickaxe', 'shovel', 'axe', 'knife', 'sword', 'bow', 'fishing_rod'];
         this.selectedToolIndex = 0;
         this.inventory = {};
         this.miningTarget = null;
         this.miningProgress = 0;
 
         this.level = 1;
         this.xp = 0;
         this.xpToNext = 100;
         this.skillPoints = 0;
         this.attributes = { strength: 0, agility: 0, vitality: 0 };

        this.posture = 'standing';
        this.doubleJumped = false;
        this.animations = config.playerAnimations || {};
     }
 
     update(keys, mouse, game) {
         const { physics } = this.config;
        const baseSpeed = physics.playerSpeed * (1 + this.attributes.agility * 0.05);
        const runSpeed = baseSpeed * 1.5;
         const jumpForce = physics.jumpForce * (1 + this.attributes.agility * 0.03);
 
        // posture management
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

        if (physics.realistic) {
            const accel = this.grounded ? (physics.groundAcceleration || 0.4) : (physics.airAcceleration || 0.2);
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
        } else {
            if (keys.left) { this.vx = -speed; this.dir = -1; }
            else if (keys.right) { this.vx = speed; this.dir = 1; }
            else { this.vx *= physics.friction; }
        }
 
         if (this.grounded && Math.abs(this.vx) > 0.1) {
             if (this.stepTimer <= 0) {
                 this.sound?.playStep();
                 this.stepTimer = 10;
             } else {
                 this.stepTimer--;
             }
         } else {
             this.stepTimer = 0;
         }
 
        if (keys.jump && this.posture === 'standing') {
             if (this.grounded) {
                 this.vy = -jumpForce;
                 this.sound?.playJump();
                 this.canDoubleJump = true;
                this.doubleJumped = false;
             } else if (this.canDoubleJump) {
                 this.vy = -jumpForce * 0.8;
                 this.sound?.playJump();
                 this.canDoubleJump = false;
                this.doubleJumped = true;
             }
             keys.jump = false;
         }
 
        if (keys.fly) {
            this.vy = -physics.jumpForce * 0.3;
        }

        this.vy += physics.gravity;
if (physics.realistic) {
    if (this.vy > physics.maxFallSpeed) {
        this.vy = physics.maxFallSpeed;
    }
    this.vy *= physics.airResistance;
}

 
        this.handleActions(keys, mouse, game);
        this.handleTileCollisions(game);
        this.checkEnemyCollisions(game);
        this.checkCollectibleCollisions(game);
        this.checkObjectCollisions(game);
 
        // state selection for animations
         if (keys.fly) this.state = 'flying';
        else if (!this.grounded) this.state = this.doubleJumped ? 'doubleJump' : 'jumping';
        else if (this.posture === 'prone') this.state = Math.abs(this.vx) > 0.1 ? 'proneWalking' : 'prone';
        else if (this.posture === 'crouching') this.state = Math.abs(this.vx) > 0.1 ? 'crouchWalking' : 'crouching';
        else if (Math.abs(this.vx) > baseSpeed + 0.1) this.state = 'running';
        else if (Math.abs(this.vx) > 0.1) this.state = 'walking';
         else this.state = 'idle';
 
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
 
         if (this.invulnerable > 0) this.invulnerable--;
         if (this.swingTimer > 0) this.swingTimer--;
        keys.doubleDown = false;
     }
 
     handleActions(keys, mouse, game) {
         const isAction = keys.action || mouse.left || mouse.right;
         const selectedTool = this.tools[this.selectedToolIndex];
 
         if (keys.action) {
             for (const chest of game.chests) {
                 if (this.rectCollide(chest)) {
                     if (game.openChest) game.openChest(chest);
                     keys.action = false;
                     return;
                 }
             }
         }
 
        if (isAction) {
            this.swingTimer = 15;
            this.attackNearbyEnemies(game);
            const target = this.getTargetTile(mouse, game);
            if (target) {
                if (!this.miningTarget || this.miningTarget.x !== target.x || this.miningTarget.y !== target.y) {
                    this.miningTarget = { x: target.x, y: target.y, type: target.type };
                    this.miningProgress = 0;
                }
            }
        }
        game.checkpoints.forEach(cp => {
            if (!cp.activated && this.rectCollide(cp)) {
                cp.activated = true;
                game.lastCheckpoint = { x: cp.x, y: cp.y };
            }
        });
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
         return 1 + this.attributes.strength * 0.2;
     }
 
    setPosture(p) {
        if (this.posture === p) return;
        const oldH = this.h;
        if (p === 'crouching') {
            this.h = Math.floor(this.config.player.height * 0.6);
        } else if (p === 'prone') {
            this.h = Math.floor(this.config.player.height * 0.3);
        } else {
            this.h = this.config.player.height;
        }
        this.y += oldH - this.h;
        this.posture = p;
    }

    rectCollide(other) {
        return (
            this.x < other.x + other.w &&
            this.x + this.w > other.x &&
            this.y < other.y + other.h &&
            this.y + this.h > other.y
        );
    }

    handleTileCollisions(game) {
        const { tileSize } = this.config;
        const map = game.tileMap;
        const worldH = map.length;
        const worldW = map[0].length;

        this.x += this.vx;
        let startY = Math.max(0, Math.floor(this.y / tileSize));
        let endY = Math.min(worldH - 1, Math.floor((this.y + this.h - 1) / tileSize));
        if (this.vx !== 0) {
            const dir = Math.sign(this.vx);
            const checkX = dir > 0 ? Math.min(worldW - 1, Math.floor((this.x + this.w) / tileSize))
                                   : Math.max(0, Math.floor(this.x / tileSize));
            for (let y = startY; y <= endY; y++) {
                if (map[y]?.[checkX] > 0) {
                    if (dir > 0) this.x = checkX * tileSize - this.w;
                    else this.x = (checkX + 1) * tileSize;
                    this.vx = 0;
                    break;
                }
            }
        }

        this.y += this.vy;
        this.grounded = false;
        let startX = Math.max(0, Math.floor(this.x / tileSize));
        let endX = Math.min(worldW - 1, Math.floor((this.x + this.w - 1) / tileSize));

        if (this.vy > 0) {
            const checkY = Math.min(worldH - 1, Math.floor((this.y + this.h) / tileSize));
            for (let x = startX; x <= endX; x++) {
                if (map[checkY]?.[x] > 0) {
                    this.y = checkY * tileSize - this.h;
                    this.vy = 0;
                    this.grounded = true;
                    break;
                }
            }
        } else if (this.vy < 0) {
            const checkY = Math.max(0, Math.floor(this.y / tileSize));
            for (let x = startX; x <= endX; x++) {
                if (map[checkY]?.[x] > 0) {
                    this.y = (checkY + 1) * tileSize;
                    this.vy = 0;
                    break;
                }
            }
        }

        // Keep player within world bounds
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.x + this.w > worldW * tileSize) {
            this.x = worldW * tileSize - this.w;
            this.vx = 0;
        }
        if (this.y + this.h > worldH * tileSize) {
            this.y = worldH * tileSize - this.h;
            this.vy = 0;
            this.grounded = true;
        }
    }

    checkEnemyCollisions(game) {
        for (const enemy of game.enemies) {
            if (enemy.isDead) continue;
            if (this.rectCollide(enemy)) {
                if (this.vy > 0 && this.y + this.h - enemy.y < this.h * 0.5) {
                    enemy.takeDamage(game);
                    this.vy = -this.config.physics.jumpForce * 0.5;
                    this.grounded = false;
                } else {
                    game.loseLife();
                }
            }
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

        collect(game.coins, () => {
            game.addXP(5);
        });

        collect(game.bonuses, () => {
            if (game.lives < game.config.player.maxLives) {
                game.lives++;
            }
        });

        collect(game.collectibles, item => {
            const key = item.tileType;
            this.inventory[key] = (this.inventory[key] || 0) + 1;
        });
    }

    checkObjectCollisions(game) {
        const tileSize = this.config.tileSize || this.config.player.width;
        for (const block of game.fallingBlocks) {
            if (this.rectCollide({ x: block.x, y: block.y, w: tileSize, h: tileSize })) {
                game.loseLife();
            }
        }

        if (game.flag && this.rectCollide(game.flag)) {
            if (game.addXP) game.addXP(50);
        }
    }

    attackNearbyEnemies(game) {
        const range = this.config.player.attackRange || this.config.tileSize;
        const attackBox = {
            x: this.dir === 1 ? this.x + this.w : this.x - range,
            y: this.y,
            w: range,
            h: this.h
        };
        for (const enemy of game.enemies) {
            if (enemy.isDead || enemy.isDying) continue;
            if (enemy.rectCollide(attackBox)) {
                enemy.takeDamage(game, this.getDamage());
            }
        }
    }

    getTargetTile(mouse, game) {
        const { tileSize, player } = this.config;
        const worldX = mouse.x / game.settings.zoom + game.camera.x;
        const worldY = mouse.y / game.settings.zoom + game.camera.y;
        const tileX = Math.floor(worldX / tileSize);
        const tileY = Math.floor(worldY / tileSize);
        const dx = tileX * tileSize + tileSize / 2 - (this.x + this.w / 2);
        const dy = tileY * tileSize + tileSize / 2 - (this.y + this.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= player.reach * tileSize) {
            const type = game.tileMap[tileY]?.[tileX];
            if (type !== undefined) return { x: tileX, y: tileY, type };
        }
        return null;
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
             ctx.drawImage(toolAsset, -6, -6, 12, 12);
         }
         ctx.restore();
     }
 
     draw(ctx, assets, skinKey) {
         ctx.save();
         if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
             ctx.globalAlpha = 0.5;
         }
 
         ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
         if (this.dir === -1) ctx.scale(-1, 1);
 
         let rotation = 0;
        if (this.state === 'jumping') rotation = -this.dir * 0.2;
        if (this.state === 'flying') rotation = -this.dir * Math.PI / 2;
         ctx.rotate(rotation);
 
        const frames = this.animations[this.state] || [];
        const frameKey = frames[this.animFrame] || skinKey;
        const img = assets[frameKey];
 
        if (img) {
            ctx.drawImage(img, -this.w / 2, -this.h / 2, this.w, this.h);
         } else {
             ctx.fillStyle = '#ea4335';
             ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
         }
 
         this.drawTool(ctx, assets);
         ctx.restore();
     }
 }
