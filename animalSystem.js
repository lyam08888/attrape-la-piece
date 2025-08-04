import { SeededRandom } from './seededRandom.js';
import { TILE } from './world.js';

// === SYSTÈME D'ANIMAUX VIVANTS ===

export class Animal {
    constructor(x, y, type, config) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.config = config;
        
        // Propriétés physiques
        this.w = 24;
        this.h = 24;
        this.vx = 0;
        this.vy = 0;
        this.grounded = false;
        
        // Propriétés comportementales
        this.health = 100;
        this.maxHealth = 100;
        this.direction = SeededRandom.random() < 0.5 ? -1 : 1;
        this.state = 'idle';
        this.stateTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        
        // Propriétés spécifiques au type
        this.setupAnimalType();
        
        // IA
        this.aiTimer = 0;
        this.targetX = x;
        this.fearTimer = 0;
        this.lastPlayerDistance = Infinity;
    }
    
    setupAnimalType() {
        const types = {
            'cow': {
                speed: 0.5,
                jumpPower: 3,
                fearDistance: 80,
                wanderDistance: 100,
                color: '#8B4513',
                drops: ['food_milk_carton', 'food_steak'],
                sounds: ['moo1', 'moo2']
            },
            'pig': {
                speed: 0.8,
                jumpPower: 4,
                fearDistance: 60,
                wanderDistance: 120,
                color: '#FFC0CB',
                drops: ['food_ham', 'food_sausage'],
                sounds: ['oink1', 'oink2']
            },
            'chicken': {
                speed: 1.2,
                jumpPower: 2,
                fearDistance: 50,
                wanderDistance: 80,
                color: '#FFFFFF',
                drops: ['food_fried_egg', 'food_roast_chicken'],
                sounds: ['cluck1', 'cluck2']
            },
            'sheep': {
                speed: 0.7,
                jumpPower: 3,
                fearDistance: 70,
                wanderDistance: 90,
                color: '#F5F5DC',
                drops: ['food_cheese', 'food_milk_carton'],
                sounds: ['baa1', 'baa2']
            },
            'rabbit': {
                speed: 2.0,
                jumpPower: 6,
                fearDistance: 100,
                wanderDistance: 150,
                color: '#D2B48C',
                drops: ['food_carrot'],
                sounds: ['squeak1']
            },
            'fish': {
                speed: 1.5,
                jumpPower: 0,
                fearDistance: 40,
                wanderDistance: 60,
                color: '#4169E1',
                drops: ['food_fish', 'food_salmon'],
                sounds: ['splash1'],
                aquatic: true
            }
        };
        
        const typeData = types[this.type] || types['cow'];
        Object.assign(this, typeData);
    }
    
    update(game, delta) {
        this.aiTimer++;
        this.animTimer++;
        this.stateTimer++;
        
        // Animation
        if (this.animTimer > 30) {
            this.animFrame = (this.animFrame + 1) % 4;
            this.animTimer = 0;
        }
        
        // IA comportementale
        this.updateAI(game);
        
        // Physique
        this.updatePhysics(game);
        
        // Vérifier la santé
        if (this.health <= 0) {
            this.die(game);
        }
    }
    
    updateAI(game) {
        const player = game.player;
        if (!player) return;
        
        const distanceToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
        
        // Peur du joueur
        if (distanceToPlayer < this.fearDistance) {
            this.state = 'fleeing';
            this.fearTimer = 120; // 2 secondes de peur
            
            // Fuir dans la direction opposée au joueur
            if (player.x < this.x) {
                this.direction = 1;
                this.targetX = this.x + this.wanderDistance;
            } else {
                this.direction = -1;
                this.targetX = this.x - this.wanderDistance;
            }
        } else if (this.fearTimer > 0) {
            this.fearTimer--;
            this.state = 'fleeing';
        } else {
            // Comportement normal
            if (this.aiTimer % 180 === 0) { // Changer de comportement toutes les 3 secondes
                const rand = SeededRandom.random();
                if (rand < 0.3) {
                    this.state = 'idle';
                } else if (rand < 0.7) {
                    this.state = 'wandering';
                    this.targetX = this.x + (SeededRandom.random() - 0.5) * this.wanderDistance * 2;
                } else {
                    this.state = 'grazing';
                }
            }
        }
        
        // Exécuter le comportement
        switch (this.state) {
            case 'idle':
                this.vx *= 0.8; // Ralentir
                break;
                
            case 'wandering':
            case 'fleeing':
                const targetDirection = this.targetX > this.x ? 1 : -1;
                this.direction = targetDirection;
                this.vx += targetDirection * this.speed * 0.1;
                
                // Arrivé à destination
                if (Math.abs(this.x - this.targetX) < 20) {
                    this.state = 'idle';
                }
                break;
                
            case 'grazing':
                this.vx *= 0.9;
                // Animation de broutage
                break;
        }
        
        // Limiter la vitesse
        this.vx = Math.max(-this.speed, Math.min(this.speed, this.vx));
    }
    
    updatePhysics(game) {
        const { tileSize } = game.config;
        const map = game.tileMap;
        
        // Gravité (sauf pour les poissons dans l'eau)
        if (!this.aquatic || !this.isInWater(game)) {
            this.vy += 0.3;
            if (this.vy > 8) this.vy = 8;
        } else {
            // Poissons dans l'eau
            this.vy *= 0.9;
            if (SeededRandom.random() < 0.01) {
                this.vy += (SeededRandom.random() - 0.5) * 2;
            }
        }
        
        // Mouvement horizontal
        this.x += this.vx;
        
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
                this.direction *= -1; // Changer de direction
            }
        } else if (this.vx < 0) {
            const tx = Math.floor(hitbox.x / tileSize);
            const ty1 = Math.floor(hitbox.y / tileSize);
            const ty2 = Math.floor((hitbox.y + hitbox.h - 1) / tileSize);
            
            if ((map[ty1]?.[tx] > TILE.AIR && map[ty1]?.[tx] !== TILE.WATER) ||
                (map[ty2]?.[tx] > TILE.AIR && map[ty2]?.[tx] !== TILE.WATER)) {
                this.x = (tx + 1) * tileSize;
                this.vx = 0;
                this.direction *= -1;
            }
        }
        
        // Mouvement vertical
        this.y += this.vy;
        
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
        
        // Saut automatique pour éviter les obstacles
        if (this.grounded && Math.abs(this.vx) > 0.1 && SeededRandom.random() < 0.02) {
            this.vy = -this.jumpPower;
        }
    }
    
    isInWater(game) {
        const { tileSize } = game.config;
        const centerX = Math.floor((this.x + this.w / 2) / tileSize);
        const centerY = Math.floor((this.y + this.h / 2) / tileSize);
        return game.tileMap[centerY]?.[centerX] === TILE.WATER;
    }
    
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h
        };
    }
    
    takeDamage(damage) {
        this.health -= damage;
        this.fearTimer = 180; // 3 secondes de peur après dégâts
        this.state = 'fleeing';
    }
    
    die(game) {
        // Créer des drops
        if (!game.collectibles) game.collectibles = [];
        
        this.drops.forEach(dropType => {
            if (SeededRandom.random() < 0.7) { // 70% de chance de drop
                game.collectibles.push({
                    x: this.x + SeededRandom.random() * this.w,
                    y: this.y + SeededRandom.random() * this.h,
                    w: 12,
                    h: 12,
                    vx: (SeededRandom.random() - 0.5) * 3,
                    vy: -SeededRandom.random() * 4,
                    foodType: dropType,
                    life: 600 // 10 secondes
                });
            }
        });
        
        // Marquer pour suppression
        this.isDead = true;
    }
    
    draw(ctx, assets) {
        ctx.save();
        
        // Flip horizontal selon la direction
        if (this.direction === -1) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.w, 0);
        } else {
            ctx.translate(this.x, 0);
        }
        
        // Couleur de base (si pas d'asset)
        ctx.fillStyle = this.color;
        ctx.fillRect(0, this.y, this.w, this.h);
        
        // Yeux simples
        ctx.fillStyle = '#000000';
        const eyeY = this.y + this.h * 0.3;
        const eyeSize = 3;
        ctx.fillRect(this.w * 0.2, eyeY, eyeSize, eyeSize);
        ctx.fillRect(this.w * 0.7, eyeY, eyeSize, eyeSize);
        
        // Indicateur de santé si blessé
        if (this.health < this.maxHealth) {
            const barWidth = this.w;
            const barHeight = 3;
            const barY = this.y - 8;
            
            // Fond rouge
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, barY, barWidth, barHeight);
            
            // Santé verte
            ctx.fillStyle = '#00ff00';
            const healthPercent = this.health / this.maxHealth;
            ctx.fillRect(0, barY, barWidth * healthPercent, barHeight);
        }
        
        ctx.restore();
    }
}

// === GESTIONNAIRE D'ANIMAUX ===

export class AnimalManager {
    constructor() {
        this.animals = [];
        this.spawnTimer = 0;
        this.maxAnimals = 50;
    }

    update(game, delta) {
        const isNight = game.timeSystem?.getStage() === 'nuit';

        if (!isNight) {
            this.spawnTimer++;

            // Spawn de nouveaux animaux uniquement le jour
            if (this.spawnTimer > 300 && this.animals.length < this.maxAnimals) { // Toutes les 5 secondes
                this.trySpawnAnimal(game);
                this.spawnTimer = 0;
            }
        } else {
            // Réinitialiser le timer la nuit pour éviter un spawn immédiat au lever du soleil
            this.spawnTimer = 0;
        }

        // Mettre à jour les animaux existants
        for (let i = this.animals.length - 1; i >= 0; i--) {
            const animal = this.animals[i];
            animal.update(game, delta);
            
            // Supprimer les animaux morts ou trop loin
            const distanceToPlayer = game.player ? 
                Math.hypot(game.player.x - animal.x, game.player.y - animal.y) : 0;
            
            if (animal.isDead || distanceToPlayer > 2000) {
                this.animals.splice(i, 1);
            }
        }
    }
    
    trySpawnAnimal(game) {
        if (!game.player) return;
        
        const { tileSize } = game.config;
        const spawnDistance = 300 + SeededRandom.random() * 200;
        const angle = SeededRandom.random() * Math.PI * 2;
        
        const spawnX = game.player.x + Math.cos(angle) * spawnDistance;
        const spawnY = game.player.y + Math.sin(angle) * spawnDistance;
        
        // Trouver le sol
        const tileX = Math.floor(spawnX / tileSize);
        let groundY = -1;
        
        for (let y = 0; y < game.tileMap.length - 1; y++) {
            const tile = game.tileMap[y]?.[tileX];
            const tileBelow = game.tileMap[y + 1]?.[tileX];
            
            if (tile === TILE.AIR && tileBelow > TILE.AIR) {
                groundY = y * tileSize;
                break;
            }
        }
        
        if (groundY === -1) return;
        
        // Déterminer le type d'animal selon le biome
        const biome = this.getBiomeAt(game, tileX, Math.floor(groundY / tileSize));
        const animalType = this.getAnimalTypeForBiome(biome);
        
        if (animalType) {
            const animal = new Animal(spawnX, groundY - 24, animalType, game.config);
            this.animals.push(animal);
        }
    }

    spawnAnimal(game, type = 'cow', x = null, y = null) {
        if (!game || !game.config) return null;

        const { tileSize } = game.config;
        let spawnX = x;
        let spawnY = y;

        // Si aucune position n'est fournie, générer l'animal près du joueur
        if (spawnX == null || spawnY == null) {
            if (!game.player) return null;
            const spawnDistance = 50;
            const angle = SeededRandom.random() * Math.PI * 2;
            spawnX = game.player.x + Math.cos(angle) * spawnDistance;
            spawnY = game.player.y + Math.sin(angle) * spawnDistance;

            const tileX = Math.floor(spawnX / tileSize);
            let groundY = -1;
            for (let yy = 0; yy < game.tileMap.length - 1; yy++) {
                const tile = game.tileMap[yy]?.[tileX];
                const tileBelow = game.tileMap[yy + 1]?.[tileX];
                if (tile === TILE.AIR && tileBelow > TILE.AIR) {
                    groundY = yy * tileSize;
                    break;
                }
            }
            if (groundY === -1) return null;
            spawnY = groundY - 24;
        }

        const animal = new Animal(spawnX, spawnY, type, game.config);
        this.animals.push(animal);
        return animal;
    }
    
    getBiomeAt(game, tileX, tileY) {
        // Logique simplifiée de détection de biome
        const surfaceTile = game.tileMap[tileY]?.[tileX];
        
        if (surfaceTile === TILE.SAND) return 'desert';
        if (surfaceTile === TILE.SNOW) return 'tundra';
        if (surfaceTile === TILE.WATER) return 'ocean';
        if (surfaceTile === TILE.DIRT) return 'swamp';
        return 'plains';
    }
    
    getAnimalTypeForBiome(biome) {
        const biomeAnimals = {
            'plains': ['cow', 'pig', 'chicken', 'sheep', 'rabbit'],
            'desert': ['rabbit'],
            'tundra': ['rabbit'],
            'jungle': ['pig', 'chicken', 'rabbit'],
            'swamp': ['pig', 'rabbit'],
            'ocean': ['fish'],
            'mountains': ['sheep', 'rabbit']
        };
        
        const availableAnimals = biomeAnimals[biome] || biomeAnimals['plains'];
        return availableAnimals[Math.floor(SeededRandom.random() * availableAnimals.length)];
    }
    
    draw(ctx, assets) {
        this.animals.forEach(animal => {
            animal.draw(ctx, assets);
        });
    }
    
    getAnimalsNear(x, y, radius) {
        return this.animals.filter(animal => {
            const distance = Math.hypot(animal.x - x, animal.y - y);
            return distance <= radius && !animal.isDead;
        });
    }
}