import { TILE } from './world.js';
import { updateMining } from './miningEngine.js';
import { PlayerStats, CombatSystem, BiomeSystem } from './combatSystem.js';

export class Player {
    constructor(x, y, config, sound) {
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        this.w = config.player.width;
        this.h = config.player.height;
        // Allow a custom hitbox that's smaller than the sprite
        const hb = config.player.hitbox || {};
        this.hitbox = {
            offsetX: hb.offsetX ?? 0,
            offsetY: hb.offsetY ?? 0,
            width: hb.width ?? this.w,
            height: hb.height ?? this.h
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
        
        // Nouveau système d'outils avec durabilité et enchantements
        this.toolDurability = {
            pickaxe: 100,
            shovel: 80,
            axe: 90,
            sword: 70,
            knife: 60,
            bow: 50,
            fishing_rod: 40
        };
        
        this.toolEnchantments = {
            pickaxe: ['efficiency', 'unbreaking'],
            shovel: ['efficiency'],
            axe: ['efficiency', 'fire_aspect'],
            sword: ['sharpness', 'fire_aspect'],
            knife: ['sharpness'],
            bow: ['power', 'infinity'],
            fishing_rod: ['luck_of_the_sea']
        };
        
        this.durability = {
            pickaxe: 100,
            shovel: 80,
            axe: 90,
            sword: 70,
            knife: 60,
            bow: 50,
            fishing_rod: 40
        };
        
        this.experience = {
            mining: 0,
            level: 1
        };
        
        this.hunger = 100;
        this.maxHunger = 100;
        this.hungerTimer = 0;
        this.foodInventory = {};
        this.attackCooldown = 0;
        this.attackRange = 40;
        
        // Initialize combat system components
        this.stats = new PlayerStats();
        this.combatSystem = new CombatSystem();
        this.biomeSystem = new BiomeSystem();
        
        // Initialize health from stats
        this.health = this.stats.health;
        this.maxHealth = this.stats.maxHealth;

        this.state = 'idle';
        this.animTimer = 0;
        this.animFrame = 0;
        this.isCrouching = false;
        this.isProne = false;
        this.isFlying = false;
        this.isGliding = false;
        this.isWallSliding = false;
        this.wallSlideDirection = 0; // -1 for left wall, 1 for right wall
        this.jumpCount = 0;
        this.prevJump = false;
        this.inWater = false;
        this.wallJumpCooldown = 0;
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
        
        // Update cooldowns
        if (this.wallJumpCooldown > 0) this.wallJumpCooldown--;
        
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

        // Gliding handling
        this.isGliding = !this.grounded && keys.down && !this.isFlying && this.vy > 0;
        
        let speed = physics.playerSpeed;
        if (keys.run && !this.isCrouching && !this.isProne && !this.isFlying) speed *= 1.5;
        if (this.isCrouching) speed *= 0.5;
        if (this.isProne) speed *= 0.3;

        if (this.isFlying) {
            this.vx = keys.left ? -speed : keys.right ? speed : 0;
            this.vy = keys.up ? -speed : keys.down ? speed : 0;
            this.grounded = false;
            this.isWallSliding = false;
        } else if (this.inWater) {
            const swimSpeed = physics.playerSpeed * 0.5;
            this.vx = keys.left ? -swimSpeed : keys.right ? swimSpeed : this.vx * 0.9;
            if (keys.up || keys.jump) {
                this.vy = -swimSpeed;
            } else if (keys.down) {
                this.vy = swimSpeed;
            } else {
                this.vy *= 0.9;
                this.vy += physics.gravity * 0.2;
            }
            this.grounded = false;
            this.isWallSliding = false;
        } else {
            // Wall sliding detection
            this.checkWallSliding(game);
            
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

            // Apply gravity
            if (this.isGliding) {
                this.vy += physics.glideGravity;
                if (this.vy > physics.glideFallSpeed) this.vy = physics.glideFallSpeed;
            } else if (this.isWallSliding) {
                this.vy = Math.min(this.vy + physics.gravity * 0.5, physics.wallSlideSpeed);
            } else {
                this.vy += physics.gravity;
            }
            
            if (this.vy > physics.maxFallSpeed) this.vy = physics.maxFallSpeed;

            // Jumping logic
            if (keys.jump && !this.prevJump) {
                if (this.grounded) {
                    this.vy = -physics.jumpForce;
                    this.sound?.play('jump');
                    this.jumpCount = 1;
                    this.isWallSliding = false;
                } else if (this.isWallSliding && this.wallJumpCooldown <= 0) {
                    // Wall jump
                    this.vy = -physics.jumpForce;
                    this.vx = -physics.wallJumpForce * this.wallSlideDirection;
                    this.sound?.play('jump');
                    this.jumpCount = 1;
                    this.isWallSliding = false;
                    this.wallJumpCooldown = 10; // Prevent immediate wall sticking after wall jump
                } else if (this.jumpCount < 2) {
                    this.vy = -physics.jumpForce;
                    this.sound?.play('jump');
                    this.jumpCount = 2;
                }
            }
        }

        this.prevJump = keys.jump;

        // Collisions réactivées avec améliorations
        this.handleCollisions(game);
        
        if (this.grounded && !this.isFlying) {
            this.jumpCount = 0;
            this.isWallSliding = false;
        }

        this.checkCollectibleCollisions(game);
        this.updateMiningTarget(keys, mouse, game);
        updateMining(game, keys, mouse, delta); // Utiliser le système de minage avancé
        this.updateFruitHarvesting(mouse, game);
        this.updateStateAndAnimation();
        this.updateHunger(delta);
        this.updateToolRepair(keys, game);

        if (this.swingTimer > 0) this.swingTimer--;
        if (mouse.left && this.swingTimer <= 0) this.swingTimer = 20;
        
        this.updateCombat(game, delta);
    }
    
    checkCollectibleCollisions(game) {
        if (!game.collectibles) return;
        for (let i = game.collectibles.length - 1; i >= 0; i--) {
            const item = game.collectibles[i];
            if (this.rectCollide(item)) {
                // Gérer les aliments
                if (item.foodType) {
                    if (!this.foodInventory) this.foodInventory = {};
                    this.foodInventory[item.foodType] = (this.foodInventory[item.foodType] || 0) + 1;
                    
                    // Consommer automatiquement si la faim est basse
                    if (this.hunger < 50 && game.foodSystem) {
                        game.foodSystem.consumeFood(this, item.foodType);
                        if (game.logger) game.logger.log(`Consommé: ${item.foodType.replace('food_', '').replace('_', ' ')}`);
                    } else {
                        if (game.logger) game.logger.log(`+1 ${item.foodType.replace('food_', '').replace('_', ' ')}`);
                    }
                } else {
                    // Gérer les blocs normaux
                    const key = item.tileType;
                    this.inventory[key] = (this.inventory[key] || 0) + 1;
                    const tileName = Object.keys(TILE).find(k=>TILE[k]===key) || "Objet";
                    if (game.logger) game.logger.log(`+1 ${tileName}`);
                }
                
                game.collectibles.splice(i, 1);
            }
        }
    }

    updateStateAndAnimation() {
        if (this.isFlying) {
            this.state = 'flying';
        } else if (this.inWater) {
            this.state = 'swimming';
        } else if (this.isGliding) {
            this.state = 'gliding';
        } else if (this.isWallSliding) {
            this.state = 'wallSliding';
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

    updateMiningTarget(keys, mouse, game) {
        // Vérification de base
        if (!game.camera) {
            return;
        }

        const { tileSize, zoom } = game.config;
        const reach = (this.config.player.reach || 4) * tileSize;
        const playerCenterX = this.x + this.w / 2;
        const playerCenterY = this.y + this.h / 2;

        // Priorité au ciblage à la souris
        if (mouse) {
            const mouseWorldX = game.camera.x + mouse.x / zoom;
            const mouseWorldY = game.camera.y + mouse.y / zoom;
            const distance = Math.hypot(mouseWorldX - playerCenterX, mouseWorldY - playerCenterY);

            if (distance <= reach) {
                const tileX = Math.floor(mouseWorldX / tileSize);
                const tileY = Math.floor(mouseWorldY / tileSize);

                if (tileY >= 0 && tileY < game.tileMap.length && tileX >= 0 && game.tileMap[tileY]) {
                    const tileType = game.tileMap[tileY][tileX];
                    if (tileType > TILE.AIR && tileType !== TILE.BEDROCK) {
                        if (!this.miningTarget || this.miningTarget.x !== tileX || this.miningTarget.y !== tileY) {
                            this.miningTarget = { x: tileX, y: tileY, type: tileType };
                            this.miningProgress = 0;
                        }
                        return;
                    }
                }
            }
        }

        // Sinon, cibler le bloc juste devant le joueur si l'action est activée
        if (keys && keys.action) {
            const frontX = Math.floor((playerCenterX + this.dir * tileSize) / tileSize);
            const frontY = Math.floor(playerCenterY / tileSize);

            if (frontY >= 0 && frontY < game.tileMap.length && frontX >= 0 && game.tileMap[frontY]) {
                const tileType = game.tileMap[frontY][frontX];
                if (tileType > TILE.AIR && tileType !== TILE.BEDROCK) {
                    if (!this.miningTarget || this.miningTarget.x !== frontX || this.miningTarget.y !== frontY) {
                        this.miningTarget = { x: frontX, y: frontY, type: tileType };
                        this.miningProgress = 0;
                    }
                    return;
                }
            }
        }

        // Aucun bloc ciblé
        this.miningTarget = null;
    }

    updateFruitHarvesting(mouse, game) {
        if (!mouse.right || !game.foodSystem) return; // Clic droit pour récolter
        
        const { tileSize, zoom } = game.config;
        const reach = (this.config.player.reach || 4) * tileSize;
        const mouseWorldX = game.camera.x + mouse.x / zoom;
        const mouseWorldY = game.camera.y + mouse.y / zoom;
        
        if (Math.hypot(mouseWorldX - (this.x + this.w / 2), mouseWorldY - (this.y + this.h / 2)) > reach) {
            return;
        }
        
        // Essayer de récolter un fruit
        if (game.foodSystem.harvestFruit(game, mouseWorldX, mouseWorldY)) {
            if (game.logger) game.logger.log("Fruit récolté !");
        }
    }

    updateHunger(delta) {
        this.hungerTimer += delta;
        
        // Perdre de la faim toutes les 5 secondes
        if (this.hungerTimer > 300) { // 5 secondes à 60 FPS
            this.hunger = Math.max(0, this.hunger - 1);
            this.hungerTimer = 0;
            
            // Effets de la faim
            if (this.hunger <= 0) {
                // Perdre de la santé si affamé
                this.health = Math.max(1, this.health - 1);
            } else if (this.hunger < 20) {
                // Mouvement ralenti si très affamé
                this.vx *= 0.8;
            }
        }
    }
    
    updateToolRepair(keys, game) {
        // Réparation automatique lente des outils au fil du temps
        if (!this.repairTimer) this.repairTimer = 0;
        this.repairTimer += 1;
        
        // Réparer un peu tous les outils toutes les 10 secondes
        if (this.repairTimer > 600) { // 10 secondes à 60 FPS
            this.repairTimer = 0;
            
            this.tools.forEach(toolName => {
                const maxDurability = this.toolDurability[toolName] || 100;
                const currentDurability = this.durability[toolName] || 0;
                
                // Réparation lente automatique (1 point toutes les 10 secondes)
                if (currentDurability < maxDurability && currentDurability > 0) {
                    this.durability[toolName] = Math.min(maxDurability, currentDurability + 1);
                }
            });
            
            // Mettre à jour la barre d'outils
            if (game.updateToolbar) game.updateToolbar();
        }
        
        // Réparation rapide avec la touche R si on a des matériaux
        if (keys.repair && !this.prevRepair) {
            const currentTool = this.tools[this.selectedToolIndex];
            if (currentTool && this.durability[currentTool] < this.toolDurability[currentTool]) {
                // Vérifier si on a des matériaux pour réparer
                const repairMaterial = this.getRepairMaterial(currentTool);
                if (this.inventory[repairMaterial] > 0) {
                    this.inventory[repairMaterial]--;
                    this.durability[currentTool] = this.toolDurability[currentTool];
                    if (game.logger) game.logger.log(`${currentTool} réparé !`);
                    if (game.updateToolbar) game.updateToolbar();
                }
            }
        }
        this.prevRepair = keys.repair;
    }
    
    getRepairMaterial(toolName) {
        // Matériaux nécessaires pour réparer chaque outil
        const repairMaterials = {
            pickaxe: TILE.IRON,
            shovel: TILE.IRON,
            axe: TILE.IRON,
            sword: TILE.IRON,
            knife: TILE.IRON,
            bow: TILE.WOOD,
            fishing_rod: TILE.WOOD
        };
        return repairMaterials[toolName] || TILE.WOOD;
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

        // Collision Y
        this.y += this.vy;
        let hb = this.getHitbox();
        this.grounded = false;
        if (this.vy > 0) {
            const ty = Math.floor((hb.y + hb.h) / tileSize);
            const tx1 = Math.floor(hb.x / tileSize);
            const tx2 = Math.floor((hb.x + hb.w - 1) / tileSize);
            const tx3 = Math.floor((hb.x + hb.w / 2) / tileSize); // Check middle as well
            if (((map[ty]?.[tx1] > TILE.AIR) && map[ty]?.[tx1] !== TILE.WATER) ||
                ((map[ty]?.[tx2] > TILE.AIR) && map[ty]?.[tx2] !== TILE.WATER) ||
                ((map[ty]?.[tx3] > TILE.AIR) && map[ty]?.[tx3] !== TILE.WATER)) {
                this.y = ty * tileSize - this.hitbox.height - this.hitbox.offsetY;
                this.vy = 0;
                this.grounded = true;
            }
        } else if (this.vy < 0) {
            const ty = Math.floor(hb.y / tileSize);
            const tx1 = Math.floor(hb.x / tileSize);
            const tx2 = Math.floor((hb.x + hb.w - 1) / tileSize);
            const tx3 = Math.floor((hb.x + hb.w / 2) / tileSize); // Check middle as well
            
            // Vérifications de limites pour collision vers le haut
            if (ty >= 0 && ty < map.length && tx1 >= 0 && tx1 < map[0]?.length && tx2 >= 0 && tx2 < map[0]?.length) {
                if (((map[ty]?.[tx1] > TILE.AIR) && map[ty]?.[tx1] !== TILE.WATER) ||
                    ((map[ty]?.[tx2] > TILE.AIR) && map[ty]?.[tx2] !== TILE.WATER) ||
                    ((map[ty]?.[tx3] > TILE.AIR) && map[ty]?.[tx3] !== TILE.WATER)) {
                    this.y = (ty + 1) * tileSize - this.hitbox.offsetY;
                    this.vy = 0;
                }
            }
        }

        // Collision X
        this.x += this.vx;
        hb = this.getHitbox();
        
        // Debug collisions (désactivé)
        // if (this.vx !== 0) {
        //     console.log(`Collision X: oldX=${oldX}, newX=${this.x}, vx=${this.vx}, hitbox=`, hb);
        // }
        if (this.vx > 0) {
            const tx = Math.floor((hb.x + hb.w) / tileSize);
            const ty1 = Math.floor(hb.y / tileSize);
            const ty2 = Math.floor((hb.y + hb.h - 1) / tileSize);
            const ty3 = Math.floor((hb.y + hb.h / 2) / tileSize); // Check middle as well
            
            // Vérifications de limites
            if (tx >= 0 && tx < map[0]?.length && ty1 >= 0 && ty1 < map.length && ty2 >= 0 && ty2 < map.length) {
                if (((map[ty1]?.[tx] > TILE.AIR) && map[ty1]?.[tx] !== TILE.WATER) ||
                    ((map[ty2]?.[tx] > TILE.AIR) && map[ty2]?.[tx] !== TILE.WATER) ||
                    ((map[ty3]?.[tx] > TILE.AIR) && map[ty3]?.[tx] !== TILE.WATER)) {
                    this.x = tx * tileSize - this.hitbox.width - this.hitbox.offsetX;
                    this.vx = 0;
                    // console.log(`Collision droite détectée à tx=${tx}, ty1=${ty1}, ty2=${ty2}`);
                }
            }
        } else if (this.vx < 0) {
            const tx = Math.floor(hb.x / tileSize);
            const ty1 = Math.floor(hb.y / tileSize);
            const ty2 = Math.floor((hb.y + hb.h - 1) / tileSize);
            const ty3 = Math.floor((hb.y + hb.h / 2) / tileSize); // Check middle as well
            
            // Vérifications de limites
            if (tx >= 0 && tx < map[0]?.length && ty1 >= 0 && ty1 < map.length && ty2 >= 0 && ty2 < map.length) {
                if (((map[ty1]?.[tx] > TILE.AIR) && map[ty1]?.[tx] !== TILE.WATER) ||
                    ((map[ty2]?.[tx] > TILE.AIR) && map[ty2]?.[tx] !== TILE.WATER) ||
                    ((map[ty3]?.[tx] > TILE.AIR) && map[ty3]?.[tx] !== TILE.WATER)) {
                    this.x = (tx + 1) * tileSize - this.hitbox.offsetX;
                    this.vx = 0;
                    // console.log(`Collision gauche détectée à tx=${tx}, ty1=${ty1}, ty2=${ty2}`);
                }
            }
        }
    }

    updateCombat(game, delta) {
        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
        
        // Update player stats effects
        if (this.stats) {
            this.stats.updateEffects(delta);
            this.stats.updatePlayTime(delta);
        }
        
        // Update biome effects
        if (this.biomeSystem) {
            this.biomeSystem.updatePlayerBiome(this, game);
        }
        
        // Update combat system damage numbers
        if (this.combatSystem) {
            this.combatSystem.updateDamageNumbers();
        }
        
        // Handle combat with enemies
        if (game.enemies && this.attackCooldown <= 0) {
            for (let i = 0; i < game.enemies.length; i++) {
                const enemy = game.enemies[i];
                if (this.rectCollide(enemy)) {
                    // Player attacks enemy
                    if (this.swingTimer > 0) {
                        const currentTool = this.tools[this.selectedToolIndex];
                        const weapon = { name: currentTool };
                        
                        if (this.combatSystem) {
                            const damage = this.combatSystem.attack(this, enemy, weapon);
                            
                            // Add XP for combat
                            if (this.stats && enemy.health <= 0) {
                                this.stats.addXP(enemy.xpReward || 10);
                                this.stats.addEnemyKilled();
                            }
                        }
                        
                        this.attackCooldown = 30; // 0.5 seconds at 60fps
                    }
                    
                    // Enemy attacks player
                    if (enemy.attackCooldown <= 0) {
                        if (this.stats) {
                            this.stats.takeDamage(enemy.damage || 10, enemy.name || 'Enemy');
                            this.health = this.stats.health; // Sync health
                        }
                        enemy.attackCooldown = 60; // 1 second at 60fps
                    }
                }
            }
        }
        
        // Sync health with stats
        if (this.stats) {
            this.health = this.stats.health;
            this.maxHealth = this.stats.maxHealth;
        }
    }

    draw(ctx, assets, playerAnimations) {
        if (!ctx || !assets) return;
        const animations = playerAnimations || this.config.playerAnimations || {};
        const anim = animations[this.state] || animations['idle'] || [];
        const frameKey = anim[this.animFrame % (anim.length || 1)] || 'player_idle1';
        const img = assets[frameKey];

        if (img) {
            ctx.save();
            if (this.dir === -1) {
                ctx.scale(-1, 1);
                ctx.drawImage(img, -this.x - this.w, this.y, this.w, this.h);
            } else {
                ctx.drawImage(img, this.x, this.y, this.w, this.h);
            }
            ctx.restore();
        }

        const toolName = this.tools[this.selectedToolIndex];
        if (toolName) {
            const toolAsset = assets[`tool_${toolName}`];
            if (toolAsset) {
                const toolSize = this.w * 0.45; // Shrink tool relative to player size
                const handOffsetX = this.dir === 1 ? this.w * 0.7 : this.w * 0.3;
                const handOffsetY = this.h * 0.5;
                const pivotX = this.x + handOffsetX;
                const pivotY = this.y + handOffsetY;

                ctx.save();
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

    // Method to get current weapon
    getCurrentWeapon() {
        return {
            name: this.tools[this.selectedToolIndex],
            durability: this.durability[this.tools[this.selectedToolIndex]],
            enchantments: this.toolEnchantments[this.tools[this.selectedToolIndex]]
        };
    }

    // Wall sliding detection method
    checkWallSliding(game) {
        if (this.grounded || this.isFlying || this.inWater) {
            this.isWallSliding = false;
            return;
        }
        
        const { tileSize } = this.config;
        const map = game.tileMap;
        
        // Get player hitbox
        const hb = this.getHitbox();
        
        // Check for wall on the left
        if (this.vx < 0) {
            const leftTileX = Math.floor(hb.x / tileSize);
            const leftTileY1 = Math.floor((hb.y + 5) / tileSize); // Check slightly below top
            const leftTileY2 = Math.floor((hb.y + hb.h - 5) / tileSize); // Check slightly above bottom
            
            // Check if there's a solid block to the left
            if (leftTileX >= 0 && leftTileY1 >= 0 && leftTileY2 < map.length &&
                ((map[leftTileY1]?.[leftTileX] > TILE.AIR) && map[leftTileY1]?.[leftTileX] !== TILE.WATER) &&
                ((map[leftTileY2]?.[leftTileX] > TILE.AIR) && map[leftTileY2]?.[leftTileX] !== TILE.WATER)) {
                this.isWallSliding = true;
                this.wallSlideDirection = -1; // Sliding on left wall
                return;
            }
        }
        
        // Check for wall on the right
        if (this.vx > 0) {
            const rightTileX = Math.floor((hb.x + hb.w) / tileSize);
            const rightTileY1 = Math.floor((hb.y + 5) / tileSize); // Check slightly below top
            const rightTileY2 = Math.floor((hb.y + hb.h - 5) / tileSize); // Check slightly above bottom
            
            // Check if there's a solid block to the right
            if (rightTileX >= 0 && rightTileY1 >= 0 && rightTileY2 < map.length &&
                ((map[rightTileY1]?.[rightTileX] > TILE.AIR) && map[rightTileY1]?.[rightTileX] !== TILE.WATER) &&
                ((map[rightTileY2]?.[rightTileX] > TILE.AIR) && map[rightTileY2]?.[rightTileX] !== TILE.WATER)) {
                this.isWallSliding = true;
                this.wallSlideDirection = 1; // Sliding on right wall
                return;
            }
        }
        
        // Not sliding on a wall
        this.isWallSliding = false;
    }

    // Method to take damage (used by combat system)
    takeDamage(amount, source = 'unknown') {
        if (this.stats) {
            return this.stats.takeDamage(amount, source);
        } else {
            // Fallback if stats not initialized
            const actualDamage = Math.max(1, amount);
            this.health = Math.max(0, this.health - actualDamage);
            return actualDamage;
        }
    }

    // Method to heal
    heal(amount) {
        if (this.stats) {
            return this.stats.heal(amount);
        } else {
            // Fallback if stats not initialized
            const oldHealth = this.health;
            this.health = Math.min(this.maxHealth, this.health + amount);
            return this.health - oldHealth;
        }
    }

    // Method to add XP
    addXP(amount) {
        if (this.stats) {
            return this.stats.addXP(amount);
        }
        return 0;
    }
}
