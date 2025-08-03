import { TILE } from './world.js';

// Constantes pour le système de minage
const BLOCK_BREAK_TIME = {
    [TILE.DIRT]: 0.5,
    [TILE.GRASS]: 0.5,
    [TILE.SAND]: 0.3,
    [TILE.STONE]: 2.0,
    [TILE.COAL]: 1.5,
    [TILE.IRON]: 3.0,
    [TILE.GOLD]: 4.0,
    [TILE.DIAMOND]: 8.0,
    [TILE.WOOD]: 1.0,
    [TILE.OAK_WOOD]: 1.0,
    [TILE.LEAVES]: 0.2,
    [TILE.OAK_LEAVES]: 0.2,
    [TILE.OBSIDIAN]: 15.0,
    [TILE.BEDROCK]: 999999
};

const TOOL_EFFICIENCY = {
    'pickaxe': {
        [TILE.STONE]: 5.0,
        [TILE.COAL]: 6.0,
        [TILE.IRON]: 4.0,
        [TILE.GOLD]: 3.0,
        [TILE.DIAMOND]: 2.0,
        [TILE.OBSIDIAN]: 1.5
    },
    'shovel': {
        [TILE.DIRT]: 5.0,
        [TILE.GRASS]: 5.0,
        [TILE.SAND]: 6.0
    },
    'axe': {
        [TILE.WOOD]: 8.0,
        [TILE.OAK_WOOD]: 8.0,
        [TILE.LEAVES]: 10.0,
        [TILE.OAK_LEAVES]: 10.0
    },
    'hand': {
        [TILE.DIRT]: 1.0,
        [TILE.GRASS]: 1.0,
        [TILE.SAND]: 1.2,
        [TILE.LEAVES]: 2.0,
        [TILE.OAK_LEAVES]: 2.0
    }
};

export class Player {
    constructor(x, y, config, sound) {
        this.x = x; this.y = y;
        this.vx = 0; this.vy = 0;
        this.w = config.player.width;
        this.h = config.player.height;
        this.hitbox = {
            offsetX: config.player.hitbox.offsetX,
            offsetY: config.player.hitbox.offsetY,
            width: config.player.hitbox.width,
            height: config.player.hitbox.height
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
        
        // Outils disponibles
        this.tools = ['hand', 'pickaxe', 'shovel', 'axe', 'sword'];
        this.selectedToolIndex = 0;
    }

    update(keys, mouse, game, delta) {
        // Gestion des entrées
        this.handleInput(keys, mouse, game);
        
        // Physique
        this.applyGravity();
        this.updatePosition();
        this.handleCollisions(game);
        
        if (this.grounded && !this.isFlying) this.jumpCount = 0;

        this.checkCollectibleCollisions(game);
        this.updateMiningTarget(mouse, game);
        this.updateMining(mouse, game, delta);
        this.updateFruitHarvesting(mouse, game);
        this.updateStateAndAnimation();
        this.updateHunger(delta);

        if (this.swingTimer > 0) this.swingTimer--;
        if (mouse.left && this.swingTimer <= 0) this.swingTimer = 20;
        
        this.updateCombat(game, delta);
    }

    handleInput(keys, mouse, game) {
        const speed = this.config.player.speed;
        
        // Mouvement horizontal
        if (keys.left || keys.a) {
            this.vx = Math.max(this.vx - speed, -speed);
        }
        if (keys.right || keys.d) {
            this.vx = Math.min(this.vx + speed, speed);
        }
        
        // Saut
        if ((keys.up || keys.w || keys.space) && (this.grounded || this.jumpCount < 2)) {
            this.vy = -this.config.player.jumpPower;
            this.grounded = false;
            this.jumpCount++;
        }
        
        // Changement d'outil
        if (keys.digit1) this.selectedToolIndex = 0;
        if (keys.digit2) this.selectedToolIndex = 1;
        if (keys.digit3) this.selectedToolIndex = 2;
        if (keys.digit4) this.selectedToolIndex = 3;
        if (keys.digit5) this.selectedToolIndex = 4;
    }

    applyGravity() {
        if (!this.grounded) {
            this.vy += this.config.player.gravity;
            if (this.vy > this.config.player.maxFallSpeed) {
                this.vy = this.config.player.maxFallSpeed;
            }
        }
    }

    updatePosition() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Friction
        this.vx *= 0.8;
    }

    updateMiningTarget(mouse, game) {
        if (!mouse.left) return;
        
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
        
        if (tileType && tileType !== TILE.AIR) {
            this.miningTarget = { x: tileX, y: tileY, type: tileType };
        } else {
            this.miningTarget = null;
        }
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
        } else if (this.isProne) {
            this.state = Math.abs(this.vx) > 0.1 ? 'proneWalking' : 'prone';
        } else if (this.isCrouching) {
            this.state = Math.abs(this.vx) > 0.1 ? 'crouchWalking' : 'crouching';
        } else if (!this.grounded) {
            this.state = this.jumpCount === 2 ? 'doubleJump' : 'jumping';
        } else if (Math.abs(this.vx) > 2) {
            this.state = 'running';
        } else if (Math.abs(this.vx) > 0.1) {
            this.state = 'walking';
        } else {
            this.state = 'idle';
        }
    }

    updateCombat(game, delta) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
    }

    rectCollide(other) {
        return this.x < other.x + other.w &&
               this.x + this.w > other.x &&
               this.y < other.y + other.h &&
               this.y + this.h > other.y;
    }

    handleCollisions(game) {
        const { tileSize } = this.config;
        const map = game.tileMap;
        
        // Collisions horizontales
        const hitbox = this.getHitbox();
        if (this.vx > 0) {
            const tx = Math.floor((hitbox.x + hitbox.w) / tileSize);
            const ty1 = Math.floor(hitbox.y / tileSize);
            const ty2 = Math.floor((hitbox.y + hitbox.h - 1) / tileSize);
            
            if ((map[ty1]?.[tx] > TILE.AIR && map[ty1]?.[tx] !== TILE.WATER) ||
                (map[ty2]?.[tx] > TILE.AIR && map[ty2]?.[tx] !== TILE.WATER)) {
                this.x = tx * tileSize - this.w;
                this.vx = 0;
            }
        } else if (this.vx < 0) {
            const tx = Math.floor(hitbox.x / tileSize);
            const ty1 = Math.floor(hitbox.y / tileSize);
            const ty2 = Math.floor((hitbox.y + hitbox.h - 1) / tileSize);
            
            if ((map[ty1]?.[tx] > TILE.AIR && map[ty1]?.[tx] !== TILE.WATER) ||
                (map[ty2]?.[tx] > TILE.AIR && map[ty2]?.[tx] !== TILE.WATER)) {
                this.x = (tx + 1) * tileSize;
                this.vx = 0;
            }
        }
        
        // Collisions verticales
        this.grounded = false;
        const hitboxAfterY = this.getHitbox();
        
        if (this.vy > 0) {
            const ty = Math.floor((hitboxAfterY.y + hitboxAfterY.h) / tileSize);
            const tx1 = Math.floor(hitboxAfterY.x / tileSize);
            const tx2 = Math.floor((hitboxAfterY.x + hitboxAfterY.w - 1) / tileSize);
            
            if ((map[ty]?.[tx1] > TILE.AIR && map[ty]?.[tx1] !== TILE.WATER) ||
                (map[ty]?.[tx2] > TILE.AIR && map[ty]?.[tx2] !== TILE.WATER)) {
                this.y = ty * tileSize - this.h;
                this.vy = 0;
                this.grounded = true;
            }
        } else if (this.vy < 0) {
            const ty = Math.floor(hitboxAfterY.y / tileSize);
            const tx1 = Math.floor(hitboxAfterY.x / tileSize);
            const tx2 = Math.floor((hitboxAfterY.x + hitboxAfterY.w - 1) / tileSize);
            
            if ((map[ty]?.[tx1] > TILE.AIR && map[ty]?.[tx1] !== TILE.WATER) ||
                (map[ty]?.[tx2] > TILE.AIR && map[ty]?.[tx2] !== TILE.WATER)) {
                this.y = (ty + 1) * tileSize;
                this.vy = 0;
            }
        }
    }

    getHitbox() {
        return {
            x: this.x + this.hitbox.offsetX,
            y: this.y + this.hitbox.offsetY,
            w: this.hitbox.width,
            h: this.hitbox.height
        };
    }

    updateMining(mouse, game, delta) {
        if (!this.miningTarget || !mouse.left) {
            this.miningProgress = 0;
            return;
        }

        const tool = this.tools[this.selectedToolIndex];
        const blockType = this.miningTarget.type;
        
        // Calculer le temps de minage basé sur l'outil et le bloc
        let miningTime = BLOCK_BREAK_TIME[blockType] || 1;
        
        // Ajuster selon l'efficacité de l'outil
        const toolEfficiency = TOOL_EFFICIENCY[this.tools[this.selectedToolIndex]]?.[blockType] || 1;
        miningTime /= toolEfficiency;
        
        // Appliquer l'effet des enchantements
        if (this.toolEnchantments[this.tools[this.selectedToolIndex]]?.includes('efficiency')) {
            miningTime *= 0.8; // 20% plus rapide avec l'efficacité
        }
        
        this.miningProgress += delta / miningTime;
        
        if (this.miningProgress >= 1) {
            this.breakBlock(game);
            this.miningProgress = 0;
            
            // Dégrader l'outil
            this.durability[this.tools[this.selectedToolIndex]] -= 1;
            
            // Si l'outil est cassé
            if (this.durability[this.tools[this.selectedToolIndex]] <= 0) {
                this.tools[this.selectedToolIndex] = 'hand'; // Régression à la main
                this.durability[this.tools[this.selectedToolIndex]] = 0;
                game.logger.log("Votre outil est cassé !");
            }
            
            // Gagner de l'expérience
            this.experience.mining += 1;
            
            if (this.experience.mining >= 100) {
                this.experience.mining = 0;
                this.experience.level++;
                game.logger.log(`Niveau de minage monté à ${this.experience.level} !`);
            }
        }
    }

    breakBlock(game) {
        if (!this.miningTarget) return;
        
        const { x, y, type } = this.miningTarget;
        const { tileSize } = this.config;
        
        // Supprimer le bloc de la carte
        game.tileMap[y][x] = TILE.AIR;
        
        // Créer des particules de destruction
        this.createBreakParticles(game, x * tileSize, y * tileSize, type);
        
        // Ajouter l'objet à l'inventaire
        if (!game.collectibles) game.collectibles = [];
        
        game.collectibles.push({
            x: x * tileSize + tileSize/4,
            y: y * tileSize + tileSize/4,
            w: tileSize/2,
            h: tileSize/2,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3,
            tileType: type,
            life: 300 // 5 secondes
        });
        
        // Réinitialiser la cible de minage
        this.miningTarget = null;
        this.miningProgress = 0;
        
        // Son de cassure (si disponible)
        if (this.sound && this.sound.playBreak) {
            this.sound.playBreak(type);
        }
    }
    
    createBreakParticles(game, x, y, blockType) {
        if (!game.particles) game.particles = [];
        
        // Couleurs selon le type de bloc
        const blockColors = {
            [TILE.DIRT]: '#8B4513',
            [TILE.GRASS]: '#228B22',
            [TILE.STONE]: '#696969',
            [TILE.WOOD]: '#DEB887',
            [TILE.OAK_WOOD]: '#CD853F',
            [TILE.LEAVES]: '#32CD32',
            [TILE.OAK_LEAVES]: '#228B22',
            [TILE.COAL]: '#2F4F4F',
            [TILE.IRON]: '#B0C4DE',
            [TILE.GOLD]: '#FFD700',
            [TILE.DIAMOND]: '#00CED1',
            [TILE.SAND]: '#F4A460'
        };
        
        const color = blockColors[blockType] || '#888888';
        
        // Créer 8-12 particules
        const particleCount = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < particleCount; i++) {
            game.particles.push({
                x: x + Math.random() * this.config.tileSize,
                y: y + Math.random() * this.config.tileSize,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4 - 1,
                size: 2 + Math.random() * 3,
                color: color,
                life: 30 + Math.random() * 20,
                maxLife: 50
            });
        }
    }
}
