import { TILE } from './world.js';

export class Player {
    constructor(x, y, config, sound) {
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        // Use the player dimensions directly from the configuration
        this.w = config.player.width;
        this.h = config.player.height;
        this.hitbox = {
            offsetX: config.player.hitbox.offsetX,
            offsetY: config.player.hitbox.offsetY,
            width:   config.player.hitbox.width,
            height:  config.player.hitbox.height
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
        this.attackCooldown = 0;
        this.attackRange = 40;

        this.state = 'idle';
        this.animTimer = 0;
        this.animFrame = 0;
        this.isCrouching = false;
        this.isProne = false;
        this.isFlying = false;
        this.jumpCount = 0;
        this.prevJump = false;
        this.inWater = false;
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
        const { physics, tileSize } = this.config;
        this.isFlying = keys.fly;
        
        // Debug: vérifier les touches (désactivé)
        // if (keys.left || keys.right || keys.jump) {
        //     console.log(`Touches détectées: left=${keys.left}, right=${keys.right}, jump=${keys.jump}, vx=${this.vx}, vy=${this.vy}`);
        // }

        const centerX = Math.floor((this.x + this.w / 2) / tileSize);
        const centerY = Math.floor((this.y + this.h / 2) / tileSize);
        this.inWater = game.tileMap[centerY]?.[centerX] === TILE.WATER;

        // Crouch / prone handling
        if (this.grounded && keys.down && !this.isFlying) {
            this.isProne = keys.run;
            this.isCrouching = !keys.run;
        } else {
            this.isCrouching = false;
            this.isProne = false;
        }

        let speed = physics.playerSpeed;
        if (keys.run && !this.isCrouching && !this.isProne && !this.isFlying) speed *= 1.5;
        if (this.isCrouching) speed *= 0.5;
        if (this.isProne) speed *= 0.3;

        if (this.isFlying) {
            this.vx = keys.left ? -speed : keys.right ? speed : 0;
            this.vy = keys.jump ? -speed : keys.down ? speed : 0;
            this.grounded = false;
        } else if (this.inWater) {
            const swimSpeed = physics.playerSpeed * 0.5;
            this.vx = keys.left ? -swimSpeed : keys.right ? swimSpeed : this.vx * 0.9;
            if (keys.jump) {
                this.vy = -swimSpeed;
            } else if (keys.down) {
                this.vy = swimSpeed;
            } else {
                this.vy *= 0.9;
                this.vy += physics.gravity * 0.2;
            }
            this.grounded = false;
        } else {
            const accel = this.grounded ? physics.groundAcceleration : physics.airAcceleration;
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

            if (keys.jump && !this.prevJump) {
                if (this.grounded) {
                    this.vy = -physics.jumpForce;
                    this.sound?.play('jump');
                    this.jumpCount = 1;
                } else if (this.jumpCount < 2) {
                    this.vy = -physics.jumpForce;
                    this.sound?.play('jump');
                    this.jumpCount = 2;
                }
            }

            this.vy += physics.gravity;
            if (this.vy > physics.maxFallSpeed) this.vy = physics.maxFallSpeed;
        }

        this.prevJump = keys.jump;

        // Collisions réactivées avec améliorations
        this.handleCollisions(game);
        
        if (this.grounded && !this.isFlying) this.jumpCount = 0;

        this.checkCollectibleCollisions(game);
        this.updateMiningTarget(mouse, game);
        this.updateStateAndAnimation();

        if (this.swingTimer > 0) this.swingTimer--;
        if (mouse.left && this.swingTimer <= 0) this.swingTimer = 20;
        
        this.updateCombat(game, delta);
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
        if (this.isFlying) {
            this.state = 'flying';
        } else if (this.inWater) {
            this.state = 'swimming';
        } else if (this.isProne) {
            this.state = Math.abs(this.vx) > 0.1 ? 'proneWalking' : 'prone';
        } else if (this.isCrouching) {
            this.state = Math.abs(this.vx) > 0.1 ? 'crouchWalking' : 'crouching';
        } else if (!this.grounded) {
            this.state = this.jumpCount === 2 ? 'doubleJump' : 'jumping';
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
        if (!game.camera || !mouse) {
            // console.log("updateMiningTarget: camera ou mouse manquant");
            return;
        }
        
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
        if (!map || map.length === 0) {
            console.warn("Pas de tileMap pour les collisions");
            return;
        }
        
        // Debug: vérifier la position du joueur et empêcher la chute infinie
        if (this.y > 2000) { // Si le joueur tombe trop bas
            console.log(`Joueur tombe: y=${this.y}, vy=${this.vy}`);
            console.log(`TileMap dimensions: ${map.length} x ${map[0]?.length}`);
            const playerTileX = Math.floor(this.x / tileSize);
            const playerTileY = Math.floor(this.y / tileSize);
            console.log(`Position tile: (${playerTileX}, ${playerTileY})`);
            if (map[playerTileY]) {
                console.log(`Tile sous le joueur: ${map[playerTileY][playerTileX]}`);
            }
            
            // Téléporter le joueur à la surface si il tombe trop bas
            if (this.y > map.length * tileSize - 100) {
                console.log("Téléportation du joueur à la surface");
                // Trouver la surface
                for (let y = 0; y < map.length; y++) {
                    if (map[y] && map[y][playerTileX] > TILE.AIR) {
                        this.y = (y - 2) * tileSize;
                        this.vy = 0;
                        console.log(`Joueur téléporté à y=${this.y}`);
                        break;
                    }
                }
            }
        }

        // Collision X
        const oldX = this.x;
        this.x += this.vx;
        let hb = this.getHitbox();
        
        // Debug collisions (désactivé)
        // if (this.vx !== 0) {
        //     console.log(`Collision X: oldX=${oldX}, newX=${this.x}, vx=${this.vx}, hitbox=`, hb);
        // }
        if (this.vx > 0) {
            const tx = Math.floor((hb.x + hb.w) / tileSize);
            const ty1 = Math.floor(hb.y / tileSize);
            const ty2 = Math.floor((hb.y + hb.h - 1) / tileSize);
            
            // Vérifications de limites
            if (tx >= 0 && tx < map[0]?.length && ty1 >= 0 && ty1 < map.length && ty2 >= 0 && ty2 < map.length) {
                if (((map[ty1]?.[tx] > TILE.AIR) && map[ty1]?.[tx] !== TILE.WATER) ||
                    ((map[ty2]?.[tx] > TILE.AIR) && map[ty2]?.[tx] !== TILE.WATER)) {
                    this.x = tx * tileSize - this.hitbox.width - this.hitbox.offsetX;
                    this.vx = 0;
                    // console.log(`Collision droite détectée à tx=${tx}, ty1=${ty1}, ty2=${ty2}`);
                }
            }
        } else if (this.vx < 0) {
            const tx = Math.floor(hb.x / tileSize);
            const ty1 = Math.floor(hb.y / tileSize);
            const ty2 = Math.floor((hb.y + hb.h - 1) / tileSize);
            
            // Vérifications de limites
            if (tx >= 0 && tx < map[0]?.length && ty1 >= 0 && ty1 < map.length && ty2 >= 0 && ty2 < map.length) {
                if (((map[ty1]?.[tx] > TILE.AIR) && map[ty1]?.[tx] !== TILE.WATER) ||
                    ((map[ty2]?.[tx] > TILE.AIR) && map[ty2]?.[tx] !== TILE.WATER)) {
                    this.x = (tx + 1) * tileSize - this.hitbox.offsetX;
                    this.vx = 0;
                    // console.log(`Collision gauche détectée à tx=${tx}, ty1=${ty1}, ty2=${ty2}`);
                }
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
            if (((map[ty]?.[tx1] > TILE.AIR) && map[ty]?.[tx1] !== TILE.WATER) ||
                ((map[ty]?.[tx2] > TILE.AIR) && map[ty]?.[tx2] !== TILE.WATER)) {
                this.y = ty * tileSize - this.hitbox.height - this.hitbox.offsetY;
                this.vy = 0;
                this.grounded = true;
            }
        } else if (this.vy < 0) {
            const ty = Math.floor(hb.y / tileSize);
            const tx1 = Math.floor(hb.x / tileSize);
            const tx2 = Math.floor((hb.x + hb.w - 1) / tileSize);
            if (((map[ty]?.[tx1] > TILE.AIR) && map[ty]?.[tx1] !== TILE.WATER) ||
                ((map[ty]?.[tx2] > TILE.AIR) && map[ty]?.[tx2] !== TILE.WATER)) {
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
                // Taille de l'outil réduite (environ 60% de la taille du joueur)
                const toolSize = this.w * 0.6;
                const handOffsetX = this.dir === 1 ? this.w * 0.8 : this.w * 0.2;
                const handOffsetY = this.h * 0.6;
                const pivotX = this.x + handOffsetX;
                const pivotY = this.y + handOffsetY;
                ctx.translate(pivotX, pivotY);
                
                // Animation de swing
                if (this.swingTimer > 0) {
                    const progress = (20 - this.swingTimer) / 20;
                    const angle = Math.sin(progress * Math.PI) * -this.dir * 0.8; // Angle réduit
                    ctx.rotate(angle);
                }
                
                // Dessiner l'outil avec une taille appropriée
                ctx.drawImage(toolAsset, -toolSize / 2, -toolSize / 2, toolSize, toolSize);
                ctx.restore();
            }
        }
    }

    updateCombat(game, delta) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
    }

    attack(game) {
        if (this.attackCooldown > 0) return false;
        
        const currentTool = this.tools[this.selectedToolIndex];
        const weapon = { name: currentTool };
        
        // Zone d'attaque devant le joueur
        const attackX = this.x + (this.dir === 1 ? this.w : -this.attackRange);
        const attackY = this.y;
        const attackZone = {
            x: attackX,
            y: attackY,
            w: this.attackRange,
            h: this.h
        };
        
        let hitSomething = false;
        
        // Attaquer les ennemis
        game.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            if (this.isInAttackZone(enemy, attackZone)) {
                const damage = game.combatSystem.attack(this, enemy, weapon);
                if (enemy.health <= 0) {
                    enemy.isDead = true;
                    enemy.deathTime = Date.now();
                    
                    // Récompenses
                    if (this.stats) {
                        this.stats.addEnemyKilled();
                        this.stats.addXP(enemy.xpReward || 10);
                    }
                    
                    // Mettre à jour les quêtes
                    if (game.questSystem) {
                        game.questSystem.updateQuestProgress('kill_enemies', { amount: 1 });
                    }
                    
                    game.createParticles(enemy.x + enemy.w/2, enemy.y + enemy.h/2, 15, '#ff0000');
                    game.logger.log(`${enemy.name || 'Ennemi'} éliminé !`);
                }
                hitSomething = true;
            }
        });
        
        if (hitSomething) {
            this.attackCooldown = this.getAttackCooldown(currentTool);
            this.swingTimer = 20;
            game.triggerCameraShake(2, 10);
            return true;
        }
        
        return false;
    }

    isInAttackZone(target, attackZone) {
        return (
            target.x < attackZone.x + attackZone.w &&
            target.x + target.w > attackZone.x &&
            target.y < attackZone.y + attackZone.h &&
            target.y + target.h > attackZone.y
        );
    }

    getAttackCooldown(toolName) {
        const cooldowns = {
            'sword': 500,    // 0.5 seconde
            'knife': 300,    // 0.3 seconde
            'axe': 800,      // 0.8 seconde
            'pickaxe': 600,  // 0.6 seconde
            'shovel': 700,   // 0.7 seconde
            'bow': 1000,     // 1 seconde
            'fishing_rod': 400 // 0.4 seconde
        };
        
        return cooldowns[toolName] || 500;
    }

    takeDamage(amount, source) {
        if (this.stats) {
            return this.stats.takeDamage(amount, source);
        }
        return 0;
    }
}
