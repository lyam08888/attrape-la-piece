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
         // Tool list (axe reintroduced for tree cutting)
         this.tools = ['pickaxe', 'shovel', 'axe', 'sword', 'bow', 'fishing_rod'];
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

         if (keys.left) { this.vx = -speed; this.dir = -1; }
         else if (keys.right) { this.vx = speed; this.dir = 1; }
         else { this.vx *= physics.friction; }
 
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
             const target = this.getTargetTile(mouse, game);
             if (target) {
                 if (!this.miningTarget || this.miningTarget.x !== target.x || this.miningTarget.y !== target.y) {
                     this.miningTarget = { x: target.x, y: target.y, type: target.type };
                     this.miningProgress = 0;
                 }
 
         });
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
