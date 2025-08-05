// faunaSystem.js - Système de faune pour utiliser tous les assets d'animaux

export class FaunaSystem {
    constructor(config) {
        this.config = config;
        this.animals = [];
        this.animalTypes = this.initializeAnimalTypes();
        this.spawnTimer = 0;
        this.maxAnimals = 50;
    }

    initializeAnimalTypes() {
        return {
            // Animaux terrestres
            terrestrial: [
                { name: 'rabbit', asset: 'animal_rabbit', biome: 'surface', rarity: 0.3, speed: 2, health: 20 },
                { name: 'deer', asset: 'animal_deer', biome: 'surface', rarity: 0.2, speed: 1.5, health: 40 },
                { name: 'fox', asset: 'animal_fox', biome: 'surface', rarity: 0.15, speed: 2.5, health: 30 },
                { name: 'bear', asset: 'animal_brown_bear', biome: 'surface', rarity: 0.05, speed: 1, health: 100 },
                { name: 'wolf', asset: 'animal_dog', biome: 'surface', rarity: 0.1, speed: 3, health: 60 },
                { name: 'squirrel', asset: 'animal_mouse', biome: 'surface', rarity: 0.4, speed: 3, health: 10 },
                { name: 'boar', asset: 'animal_boar', biome: 'surface', rarity: 0.1, speed: 1.5, health: 80 },
            ],
            // Animaux volants
            flying: [
                { name: 'bird', asset: 'animal_robin', biome: 'sky', rarity: 0.3, speed: 4, health: 15 },
                { name: 'eagle', asset: 'animal_eagle', biome: 'sky', rarity: 0.1, speed: 5, health: 50 },
                { name: 'owl', asset: 'animal_owl', biome: 'sky', rarity: 0.15, speed: 3, health: 25 },
                { name: 'bat', asset: 'animal_bat', biome: 'underground', rarity: 0.2, speed: 4, health: 12 },
                { name: 'butterfly', asset: 'animal_butterfly', biome: 'surface', rarity: 0.5, speed: 2, health: 5 },
            ],
            // Animaux aquatiques
            aquatic: [
                { name: 'fish', asset: 'animal_carp', biome: 'water', rarity: 0.4, speed: 2, health: 15 },
                { name: 'salmon', asset: 'animal_salmon', biome: 'water', rarity: 0.2, speed: 3, health: 25 },
                { name: 'shark', asset: 'animal_great_white_shark', biome: 'water', rarity: 0.05, speed: 4, health: 120 },
                { name: 'dolphin', asset: 'animal_dolphin', biome: 'water', rarity: 0.1, speed: 5, health: 80 },
            ],
            // Animaux souterrains
            underground: [
                { name: 'mole', asset: 'animal_mole', biome: 'underground', rarity: 0.2, speed: 1, health: 20 },
                { name: 'spider', asset: 'animal_beetle', biome: 'underground', rarity: 0.3, speed: 2, health: 15 },
                { name: 'worm', asset: 'animal_earthworm', biome: 'underground', rarity: 0.4, speed: 0.5, health: 8 },
            ]
        };
    }

    update(game, delta) {
        // Mettre à jour tous les animaux
        this.animals.forEach(animal => {
            this.updateAnimal(animal, game, delta);
        });

        // Supprimer les animaux morts ou trop éloignés
        this.animals = this.animals.filter(animal => {
            const distanceFromPlayer = Math.hypot(
                animal.x - game.player.x,
                animal.y - game.player.y
            );
            return animal.health > 0 && distanceFromPlayer < 1000;
        });

        // Faire apparaître de nouveaux animaux
        this.spawnTimer += delta;
        if (this.spawnTimer > 5 && this.animals.length < this.maxAnimals) {
            this.spawnAnimal(game);
            this.spawnTimer = 0;
        }
    }

    updateAnimal(animal, game, delta) {
        // IA simple pour les animaux
        const player = game.player;
        const distanceToPlayer = Math.hypot(animal.x - player.x, animal.y - player.y);

        // Comportement basé sur le type d'animal
        if (animal.type.name === 'bear' || animal.type.name === 'wolf') {
            // Animaux agressifs
            if (distanceToPlayer < 100) {
                // Attaquer le joueur
                const dx = player.x - animal.x;
                const dy = player.y - animal.y;
                const distance = Math.hypot(dx, dy);
                
                if (distance > 0) {
                    animal.vx = (dx / distance) * animal.type.speed;
                    animal.vy = (dy / distance) * animal.type.speed;
                }
            } else {
                // Mouvement aléatoire
                this.randomMovement(animal, delta);
            }
        } else {
            // Animaux pacifiques - fuient le joueur
            if (distanceToPlayer < 80) {
                const dx = animal.x - player.x;
                const dy = animal.y - player.y;
                const distance = Math.hypot(dx, dy);
                
                if (distance > 0) {
                    animal.vx = (dx / distance) * animal.type.speed * 1.5;
                    animal.vy = (dy / distance) * animal.type.speed * 1.5;
                }
            } else {
                // Mouvement aléatoire paisible
                this.randomMovement(animal, delta);
            }
        }

        // Appliquer le mouvement
        animal.x += animal.vx * delta * 60;
        animal.y += animal.vy * delta * 60;

        // Friction
        animal.vx *= 0.9;
        animal.vy *= 0.9;

        // Gravité pour les animaux terrestres
        if (animal.category === 'terrestrial' || animal.category === 'underground') {
            animal.vy += 0.5; // Gravité
            
            // Collision avec le sol
            const tileX = Math.floor(animal.x / game.config.tileSize);
            const tileY = Math.floor((animal.y + 16) / game.config.tileSize);
            
            if (game.tileMap[tileY] && game.tileMap[tileY][tileX] > 0) {
                animal.y = tileY * game.config.tileSize - 16;
                animal.vy = 0;
                animal.onGround = true;
            } else {
                animal.onGround = false;
            }
        }

        // Limites du monde
        animal.x = Math.max(0, Math.min(animal.x, game.config.worldWidth - 16));
        animal.y = Math.max(0, Math.min(animal.y, game.config.worldHeight - 16));

        // Animation
        animal.animationTimer += delta;
        if (animal.animationTimer > 0.2) {
            animal.frame = (animal.frame + 1) % 4;
            animal.animationTimer = 0;
        }
    }

    randomMovement(animal, delta) {
        // Changer de direction occasionnellement
        animal.directionTimer = (animal.directionTimer || 0) + delta;
        
        if (animal.directionTimer > 2 + Math.random() * 3) {
            animal.targetVx = (Math.random() - 0.5) * animal.type.speed;
            animal.targetVy = (Math.random() - 0.5) * animal.type.speed;
            animal.directionTimer = 0;
        }

        // Interpoler vers la direction cible
        animal.vx += (animal.targetVx - animal.vx) * 0.1;
        animal.vy += (animal.targetVy - animal.vy) * 0.1;
    }

    spawnAnimal(game) {
        const player = game.player;
        
        // Choisir un type d'animal basé sur le biome et la position
        const playerTileX = Math.floor(player.x / game.config.tileSize);
        const playerTileY = Math.floor(player.y / game.config.tileSize);
        const playerY = player.y / game.config.worldHeight;
        
        let availableTypes = [];

        // Déterminer les types d'animaux disponibles selon la profondeur
        if (playerY < 0.3) {
            // Surface - animaux terrestres et volants
            availableTypes = [...this.animalTypes.terrestrial, ...this.animalTypes.flying];
        } else if (playerY < 0.8) {
            // Souterrain - animaux souterrains et quelques volants
            availableTypes = [...this.animalTypes.underground, ...this.animalTypes.flying.slice(0, 2)];
        } else {
            // Profondeur - seulement animaux souterrains
            availableTypes = this.animalTypes.underground;
        }

        // Ajouter des animaux aquatiques près de l'eau (zones avec beaucoup d'air = eau)
        if (this.isNearWater(game, playerTileX, playerTileY)) {
            availableTypes = [...availableTypes, ...this.animalTypes.aquatic];
        }

        if (availableTypes.length === 0) return;

        // Sélectionner un animal basé sur la rareté
        const totalRarity = availableTypes.reduce((sum, type) => sum + type.rarity, 0);
        let random = Math.random() * totalRarity;
        
        let selectedType = availableTypes[0];
        for (const type of availableTypes) {
            random -= type.rarity;
            if (random <= 0) {
                selectedType = type;
                break;
            }
        }

        // Position de spawn (près du joueur mais pas trop proche)
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 300;
        const spawnX = player.x + Math.cos(angle) * distance;
        const spawnY = player.y + Math.sin(angle) * distance;

        // Créer l'animal
        const animal = {
            x: Math.max(0, Math.min(spawnX, game.config.worldWidth - 16)),
            y: Math.max(0, Math.min(spawnY, game.config.worldHeight - 16)),
            vx: 0,
            vy: 0,
            targetVx: 0,
            targetVy: 0,
            type: selectedType,
            category: this.getCategoryForType(selectedType),
            health: selectedType.health,
            maxHealth: selectedType.health,
            frame: 0,
            animationTimer: 0,
            directionTimer: 0,
            onGround: false
        };

        this.animals.push(animal);
    }

    getCategoryForType(type) {
        for (const [category, types] of Object.entries(this.animalTypes)) {
            if (types.includes(type)) {
                return category;
            }
        }
        return 'terrestrial';
    }

    draw(ctx, assets, camera) {
        this.animals.forEach(animal => {
            const screenX = animal.x - camera.x;
            const screenY = animal.y - camera.y;

            // Ne dessiner que si visible
            if (screenX > -32 && screenX < ctx.canvas.width + 32 &&
                screenY > -32 && screenY < ctx.canvas.height + 32) {
                
                const asset = assets[animal.type.asset];
                if (asset) {
                    // Flip horizontal basé sur la direction
                    if (animal.vx < 0) {
                        ctx.save();
                        ctx.scale(-1, 1);
                        ctx.drawImage(asset, -screenX - 16, screenY, 16, 16);
                        ctx.restore();
                    } else {
                        ctx.drawImage(asset, screenX, screenY, 16, 16);
                    }

                    // Barre de vie pour les animaux blessés
                    if (animal.health < animal.maxHealth) {
                        const healthRatio = animal.health / animal.maxHealth;
                        ctx.fillStyle = 'red';
                        ctx.fillRect(screenX, screenY - 8, 16, 2);
                        ctx.fillStyle = 'green';
                        ctx.fillRect(screenX, screenY - 8, 16 * healthRatio, 2);
                    }
                }
            }
        });
    }

    getAnimalsNearPlayer(player, radius = 50) {
        return this.animals.filter(animal => {
            const distance = Math.hypot(animal.x - player.x, animal.y - player.y);
            return distance <= radius;
        });
    }

    damageAnimal(animal, damage) {
        animal.health -= damage;
        if (animal.health <= 0) {
            // L'animal meurt - peut donner des ressources
            return true;
        }
        return false;
    }

    isNearWater(game, x, y) {
        // Vérifier s'il y a beaucoup d'air autour (simulation d'eau)
        let airCount = 0;
        const checkRadius = 5;
        
        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                const checkY = y + dy;
                const checkX = x + dx;
                
                if (game.tileMap[checkY] && game.tileMap[checkY][checkX] !== undefined) {
                    if (game.tileMap[checkY][checkX] === 0) {
                        airCount++;
                    }
                }
            }
        }
        
        const totalChecked = (checkRadius * 2 + 1) * (checkRadius * 2 + 1);
        return (airCount / totalChecked) > 0.6; // Plus de 60% d'air = zone aquatique
    }
}