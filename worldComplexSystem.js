// worldComplexSystem.js - Système de monde complexe et destructible avancé
import { TILE } from './world.js';
import { SeededRandom } from './seededRandom.js';
import { Perlin } from './perlin.js';

export class ComplexWorldSystem {
    constructor(config) {
        this.config = config;
        this.destructionEvents = [];
        this.worldLayers = this.initializeWorldLayers();
        this.biomeTransitions = new Map();
        this.structureRegistry = new Map();
        this.ecosystemManager = new EcosystemManager();
        this.weatherSystem = new AdvancedWeatherSystem();
        this.geologicalSystem = new GeologicalSystem();
    }

    initializeWorldLayers() {
        return {
            // Couches verticales du monde (0% = haut, 100% = bas)
            SPACE: { start: 0, end: 0.05, name: 'Espace', gravity: 0.1 },
            PARADISE: { start: 0.05, end: 0.20, name: 'Paradis', gravity: 0.2 },
            SKY: { start: 0.20, end: 0.35, name: 'Ciel', gravity: 0.3 },
            SURFACE: { start: 0.35, end: 0.55, name: 'Surface', gravity: 0.35 },
            UNDERGROUND: { start: 0.55, end: 0.75, name: 'Souterrain', gravity: 0.4 },
            DEEP_CORE: { start: 0.75, end: 0.90, name: 'Noyau', gravity: 0.5 },
            HELL: { start: 0.90, end: 1.0, name: 'Enfer', gravity: 0.6 }
        };
    }

    // === SYSTÈME DE DESTRUCTION ENVIRONNEMENTALE ===
    
    triggerEnvironmentalDestruction(game, type, x, y, intensity = 1) {
        const destructionEvent = {
            type,
            x, y,
            intensity,
            radius: this.getDestructionRadius(type, intensity),
            duration: this.getDestructionDuration(type),
            startTime: Date.now(),
            effects: this.getDestructionEffects(type)
        };

        this.destructionEvents.push(destructionEvent);
        this.executeDestruction(game, destructionEvent);
        
        return destructionEvent;
    }

    getDestructionRadius(type, intensity) {
        const baseRadius = {
            'explosion': 50,
            'earthquake': 200,
            'meteor': 80,
            'volcanic_eruption': 150,
            'flood': 300,
            'tornado': 100,
            'lightning_strike': 30,
            'avalanche': 120,
            'sinkhole': 60,
            'crystal_growth': 40
        };
        return (baseRadius[type] || 50) * intensity;
    }

    getDestructionDuration(type) {
        return {
            'explosion': 1000,      // 1 seconde
            'earthquake': 10000,    // 10 secondes
            'meteor': 2000,         // 2 secondes
            'volcanic_eruption': 30000, // 30 secondes
            'flood': 60000,         // 1 minute
            'tornado': 15000,       // 15 secondes
            'lightning_strike': 500, // 0.5 seconde
            'avalanche': 8000,      // 8 secondes
            'sinkhole': 5000,       // 5 secondes
            'crystal_growth': 20000 // 20 secondes
        }[type] || 5000;
    }

    getDestructionEffects(type) {
        return {
            'explosion': {
                destroyBlocks: true,
                createFire: true,
                shakeCamera: 10,
                particles: 'explosion',
                sound: 'explosion'
            },
            'earthquake': {
                destroyBlocks: true,
                createCracks: true,
                shakeCamera: 15,
                particles: 'dust',
                sound: 'earthquake',
                affectStructures: true
            },
            'meteor': {
                destroyBlocks: true,
                createCrater: true,
                createFire: true,
                shakeCamera: 12,
                particles: 'meteor',
                sound: 'meteor_impact'
            },
            'volcanic_eruption': {
                createLava: true,
                destroyBlocks: true,
                createFire: true,
                shakeCamera: 8,
                particles: 'lava',
                sound: 'volcano',
                changeWeather: 'ash_rain'
            },
            'flood': {
                createWater: true,
                erodeBlocks: true,
                particles: 'water',
                sound: 'flood',
                affectAnimals: true
            },
            'tornado': {
                destroyBlocks: true,
                liftObjects: true,
                shakeCamera: 20,
                particles: 'wind',
                sound: 'tornado',
                affectAnimals: true
            },
            'lightning_strike': {
                destroyBlocks: false,
                createFire: true,
                electrify: true,
                shakeCamera: 5,
                particles: 'lightning',
                sound: 'thunder'
            },
            'avalanche': {
                destroyBlocks: true,
                createSnow: true,
                particles: 'snow',
                sound: 'avalanche',
                affectAnimals: true
            },
            'sinkhole': {
                createHole: true,
                destroyBlocks: true,
                particles: 'dust',
                sound: 'collapse'
            },
            'crystal_growth': {
                createCrystals: true,
                transformBlocks: true,
                particles: 'crystal',
                sound: 'crystal_growth'
            }
        }[type] || {};
    }

    executeDestruction(game, event) {
        const { type, x, y, radius, effects } = event;
        const { tileSize } = this.config;
        
        // Calculer la zone d'effet
        const startX = Math.floor((x - radius) / tileSize);
        const endX = Math.floor((x + radius) / tileSize);
        const startY = Math.floor((y - radius) / tileSize);
        const endY = Math.floor((y + radius) / tileSize);

        for (let tileY = startY; tileY <= endY; tileY++) {
            for (let tileX = startX; tileX <= endX; tileX++) {
                const distance = Math.hypot(
                    (tileX * tileSize) - x,
                    (tileY * tileSize) - y
                );
                
                if (distance <= radius) {
                    const intensity = 1 - (distance / radius);
                    this.applyDestructionToTile(game, tileX, tileY, effects, intensity);
                }
            }
        }

        // Effets globaux
        if (effects.shakeCamera) {
            game.triggerCameraShake(effects.shakeCamera, 60);
        }

        if (effects.particles) {
            game.createParticles(x, y, 50, this.getParticleColor(effects.particles), {
                speed: 8,
                spread: radius
            });
        }

        if (effects.sound) {
            game.sound?.play(effects.sound);
        }

        if (effects.changeWeather) {
            this.weatherSystem.changeWeather(effects.changeWeather, 30000);
        }
    }

    applyDestructionToTile(game, x, y, effects, intensity) {
        if (!game.tileMap[y] || x < 0 || x >= game.tileMap[y].length) return;
        
        const currentTile = game.tileMap[y][x];
        if (currentTile === TILE.AIR || currentTile === TILE.BEDROCK) return;

        // Destruction de blocs
        if (effects.destroyBlocks && Math.random() < intensity * 0.8) {
            this.destroyTileWithEffects(game, x, y, currentTile);
        }

        // Création de lave
        if (effects.createLava && Math.random() < intensity * 0.3) {
            game.tileMap[y][x] = TILE.LAVA;
        }

        // Création d'eau
        if (effects.createWater && Math.random() < intensity * 0.4) {
            game.tileMap[y][x] = TILE.WATER;
        }

        // Création de cristaux
        if (effects.createCrystals && Math.random() < intensity * 0.2) {
            const crystalTypes = [TILE.CRYSTAL, TILE.AMETHYST, TILE.DIAMOND];
            game.tileMap[y][x] = crystalTypes[Math.floor(Math.random() * crystalTypes.length)];
        }

        // Création de cratère
        if (effects.createCrater && intensity > 0.7) {
            game.tileMap[y][x] = TILE.AIR;
            // Créer un cratère circulaire
            const craterRadius = Math.floor(intensity * 5);
            for (let dy = -craterRadius; dy <= craterRadius; dy++) {
                for (let dx = -craterRadius; dx <= craterRadius; dx++) {
                    if (Math.hypot(dx, dy) <= craterRadius) {
                        const craterX = x + dx;
                        const craterY = y + dy;
                        if (game.tileMap[craterY]?.[craterX] && game.tileMap[craterY][craterX] !== TILE.BEDROCK) {
                            game.tileMap[craterY][craterX] = TILE.AIR;
                        }
                    }
                }
            }
        }
    }

    destroyTileWithEffects(game, x, y, tileType) {
        game.tileMap[y][x] = TILE.AIR;
        
        // Créer des débris
        const debrisCount = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < debrisCount; i++) {
            game.collectibles.push({
                x: x * this.config.tileSize + Math.random() * this.config.tileSize,
                y: y * this.config.tileSize + Math.random() * this.config.tileSize,
                w: this.config.tileSize / 3,
                h: this.config.tileSize / 3,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 6,
                tileType: tileType,
                life: 300 + Math.random() * 300
            });
        }
    }

    getParticleColor(particleType) {
        return {
            'explosion': '#FF4500',
            'dust': '#8B7355',
            'meteor': '#FF6347',
            'lava': '#FF5722',
            'water': '#4169E1',
            'wind': '#87CEEB',
            'lightning': '#FFFF00',
            'snow': '#FFFFFF',
            'crystal': '#E1BEE7'
        }[particleType] || '#FFFFFF';
    }

    // === SYSTÈME D'ÉCOSYSTÈME INTELLIGENT ===
    
    updateEcosystem(game, delta) {
        this.ecosystemManager.update(game, delta);
        this.weatherSystem.update(game, delta);
        this.geologicalSystem.update(game, delta);
        this.updateDestructionEvents(game, delta);
    }

    updateDestructionEvents(game, delta) {
        const currentTime = Date.now();
        
        for (let i = this.destructionEvents.length - 1; i >= 0; i--) {
            const event = this.destructionEvents[i];
            const elapsed = currentTime - event.startTime;
            
            if (elapsed >= event.duration) {
                this.destructionEvents.splice(i, 1);
            } else {
                // Continuer les effets de destruction
                this.continueDestructionEffects(game, event, elapsed / event.duration);
            }
        }
    }

    continueDestructionEffects(game, event, progress) {
        // Effets continus selon le type de destruction
        switch (event.type) {
            case 'volcanic_eruption':
                if (Math.random() < 0.1) {
                    const lavaX = event.x + (Math.random() - 0.5) * event.radius;
                    const lavaY = event.y + (Math.random() - 0.5) * event.radius;
                    this.createLavaFlow(game, lavaX, lavaY);
                }
                break;
                
            case 'flood':
                this.spreadWater(game, event.x, event.y, event.radius * progress);
                break;
                
            case 'crystal_growth':
                if (Math.random() < 0.05) {
                    this.growCrystals(game, event.x, event.y, event.radius);
                }
                break;
        }
    }

    createLavaFlow(game, x, y) {
        const tileX = Math.floor(x / this.config.tileSize);
        const tileY = Math.floor(y / this.config.tileSize);
        
        if (game.tileMap[tileY]?.[tileX] === TILE.AIR) {
            game.tileMap[tileY][tileX] = TILE.LAVA;
            game.createParticles(x, y, 5, '#FF5722');
        }
    }

    spreadWater(game, centerX, centerY, radius) {
        const tileX = Math.floor(centerX / this.config.tileSize);
        const tileY = Math.floor(centerY / this.config.tileSize);
        const tileRadius = Math.floor(radius / this.config.tileSize);
        
        for (let dy = -tileRadius; dy <= tileRadius; dy++) {
            for (let dx = -tileRadius; dx <= tileRadius; dx++) {
                const x = tileX + dx;
                const y = tileY + dy;
                
                if (Math.hypot(dx, dy) <= tileRadius && 
                    game.tileMap[y]?.[x] === TILE.AIR) {
                    game.tileMap[y][x] = TILE.WATER;
                }
            }
        }
    }

    growCrystals(game, centerX, centerY, radius) {
        const tileX = Math.floor(centerX / this.config.tileSize);
        const tileY = Math.floor(centerY / this.config.tileSize);
        
        // Croissance cristalline organique
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [1, -1], [-1, 1], [1, 1]
        ];
        
        directions.forEach(([dx, dy]) => {
            const x = tileX + dx;
            const y = tileY + dy;
            
            if (game.tileMap[y]?.[x] === TILE.STONE && Math.random() < 0.3) {
                game.tileMap[y][x] = TILE.CRYSTAL;
                game.createParticles(
                    x * this.config.tileSize + this.config.tileSize / 2,
                    y * this.config.tileSize + this.config.tileSize / 2,
                    3, '#E1BEE7'
                );
            }
        });
    }

    // === ÉVÉNEMENTS NATURELS ALÉATOIRES ===
    
    triggerRandomNaturalEvent(game) {
        const events = [
            { type: 'earthquake', weight: 10 },
            { type: 'meteor', weight: 5 },
            { type: 'volcanic_eruption', weight: 3 },
            { type: 'tornado', weight: 7 },
            { type: 'lightning_strike', weight: 15 },
            { type: 'avalanche', weight: 8 },
            { type: 'sinkhole', weight: 6 },
            { type: 'crystal_growth', weight: 4 }
        ];
        
        const totalWeight = events.reduce((sum, event) => sum + event.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const event of events) {
            random -= event.weight;
            if (random <= 0) {
                const x = game.player.x + (Math.random() - 0.5) * 1000;
                const y = game.player.y + (Math.random() - 0.5) * 500;
                const intensity = 0.5 + Math.random() * 0.5;
                
                this.triggerEnvironmentalDestruction(game, event.type, x, y, intensity);
                
                if (game.logger) {
                    game.logger.log(`🌍 Événement naturel: ${event.type}`);
                }
                break;
            }
        }
    }
}

// === GESTIONNAIRE D'ÉCOSYSTÈME ===

class EcosystemManager {
    constructor() {
        this.foodChains = new Map();
        this.populationLimits = new Map();
        this.migrationPatterns = new Map();
    }

    update(game, delta) {
        this.updatePopulations(game);
        this.updateMigrations(game);
        this.updateFoodChains(game);
    }

    updatePopulations(game) {
        // Contrôler les populations d'animaux selon l'écosystème
        if (!game.animals) return;
        
        const biomePopulations = new Map();
        
        game.animals.forEach(animal => {
            const biome = this.getBiomeAt(game, animal.x, animal.y);
            biomePopulations.set(biome, (biomePopulations.get(biome) || 0) + 1);
        });
        
        // Ajuster les populations si nécessaire
        biomePopulations.forEach((count, biome) => {
            const limit = this.getPopulationLimit(biome);
            if (count > limit) {
                this.reducePopulation(game, biome, count - limit);
            } else if (count < limit * 0.5) {
                this.increasePopulation(game, biome);
            }
        });
    }

    getBiomeAt(game, x, y) {
        const tileX = Math.floor(x / game.config.tileSize);
        const tileY = Math.floor(y / game.config.tileSize);
        const tile = game.tileMap[tileY]?.[tileX];
        
        // Détection de biome simplifiée
        if (tile === TILE.SAND) return 'desert';
        if (tile === TILE.WATER) return 'ocean';
        if (tile === TILE.SNOW) return 'tundra';
        if (y < game.config.worldHeight * 0.3) return 'sky';
        if (y > game.config.worldHeight * 0.7) return 'underground';
        return 'surface';
    }

    getPopulationLimit(biome) {
        return {
            'surface': 20,
            'desert': 5,
            'ocean': 15,
            'tundra': 8,
            'sky': 10,
            'underground': 3
        }[biome] || 10;
    }

    updateMigrations(game) {
        // Migrations saisonnières et événementielles
        if (!game.animals || !game.timeSystem) return;
        
        const season = game.timeSystem.getSeason?.() || 'spring';
        const migrationChance = {
            'spring': 0.02,
            'summer': 0.01,
            'autumn': 0.03,
            'winter': 0.04
        }[season] || 0.02;
        
        game.animals.forEach(animal => {
            if (Math.random() < migrationChance) {
                this.triggerMigration(animal, season);
            }
        });
    }

    triggerMigration(animal, season) {
        // Définir une destination de migration
        const migrationDistance = 200 + Math.random() * 300;
        const angle = Math.random() * Math.PI * 2;
        
        animal.migrationTarget = {
            x: animal.x + Math.cos(angle) * migrationDistance,
            y: animal.y + Math.sin(angle) * migrationDistance,
            season: season
        };
        
        animal.state = 'migrating';
    }

    updateFoodChains(game) {
        // Simulation des chaînes alimentaires
        if (!game.animals) return;
        
        const predators = game.animals.filter(a => a.type === 'wolf' || a.type === 'bear');
        const prey = game.animals.filter(a => a.type === 'rabbit' || a.type === 'deer');
        
        predators.forEach(predator => {
            const nearbyPrey = prey.filter(p => 
                Math.hypot(p.x - predator.x, p.y - predator.y) < 100
            );
            
            if (nearbyPrey.length > 0 && Math.random() < 0.01) {
                const target = nearbyPrey[Math.floor(Math.random() * nearbyPrey.length)];
                predator.huntTarget = target;
                predator.state = 'hunting';
            }
        });
    }

    reducePopulation(game, biome, excess) {
        // Réduire la population par migration ou mortalité naturelle
        const animalsInBiome = game.animals.filter(a => 
            this.getBiomeAt(game, a.x, a.y) === biome
        );
        
        for (let i = 0; i < excess && i < animalsInBiome.length; i++) {
            const animal = animalsInBiome[i];
            if (Math.random() < 0.5) {
                // Migration
                this.triggerMigration(animal, 'overpopulation');
            } else {
                // Mortalité naturelle
                animal.health = 0;
            }
        }
    }

    increasePopulation(game, biome) {
        // Augmenter la population par reproduction
        if (Math.random() < 0.1) {
            // Déclencher la reproduction d'animaux existants
            const animalsInBiome = game.animals.filter(a => 
                this.getBiomeAt(game, a.x, a.y) === biome
            );
            
            animalsInBiome.forEach(animal => {
                if (animal.health > animal.maxHealth * 0.8) {
                    animal.reproductionUrge = (animal.reproductionUrge || 0) + 0.1;
                }
            });
        }
    }
}

// === SYSTÈME MÉTÉOROLOGIQUE AVANCÉ ===

class AdvancedWeatherSystem {
    constructor() {
        this.currentWeather = 'clear';
        this.weatherDuration = 0;
        this.weatherEffects = new Map();
    }

    update(game, delta) {
        this.weatherDuration -= delta;
        
        if (this.weatherDuration <= 0) {
            this.changeWeather(this.getRandomWeather(), 30000 + Math.random() * 60000);
        }
        
        this.applyWeatherEffects(game);
    }

    getRandomWeather() {
        const weathers = [
            'clear', 'rain', 'storm', 'snow', 'fog', 
            'sandstorm', 'aurora', 'meteor_shower', 'ash_rain'
        ];
        return weathers[Math.floor(Math.random() * weathers.length)];
    }

    changeWeather(weather, duration) {
        this.currentWeather = weather;
        this.weatherDuration = duration;
        
        // Définir les effets météorologiques
        this.weatherEffects.clear();
        
        switch (weather) {
            case 'rain':
                this.weatherEffects.set('visibility', 0.8);
                this.weatherEffects.set('waterLevel', 0.1);
                break;
            case 'storm':
                this.weatherEffects.set('visibility', 0.6);
                this.weatherEffects.set('lightning', 0.05);
                this.weatherEffects.set('wind', 2);
                break;
            case 'snow':
                this.weatherEffects.set('visibility', 0.7);
                this.weatherEffects.set('temperature', -10);
                break;
            case 'sandstorm':
                this.weatherEffects.set('visibility', 0.3);
                this.weatherEffects.set('erosion', 0.02);
                break;
            case 'fog':
                this.weatherEffects.set('visibility', 0.4);
                break;
            case 'meteor_shower':
                this.weatherEffects.set('meteorChance', 0.01);
                break;
        }
    }

    applyWeatherEffects(game) {
        // Appliquer les effets météorologiques
        if (this.weatherEffects.has('lightning') && Math.random() < this.weatherEffects.get('lightning')) {
            const x = game.player.x + (Math.random() - 0.5) * 500;
            const y = game.player.y + (Math.random() - 0.5) * 300;
            game.worldComplexSystem?.triggerEnvironmentalDestruction(game, 'lightning_strike', x, y, 1);
        }
        
        if (this.weatherEffects.has('meteorChance') && Math.random() < this.weatherEffects.get('meteorChance')) {
            const x = game.player.x + (Math.random() - 0.5) * 800;
            const y = game.player.y - 200 - Math.random() * 300;
            game.worldComplexSystem?.triggerEnvironmentalDestruction(game, 'meteor', x, y, 0.8);
        }
    }
}

// === SYSTÈME GÉOLOGIQUE ===

class GeologicalSystem {
    constructor() {
        this.tectonicActivity = 0;
        this.volcanicActivity = 0;
        this.erosionRate = 0.001;
    }

    update(game, delta) {
        this.updateTectonicActivity(game);
        this.updateVolcanicActivity(game);
        this.updateErosion(game);
    }

    updateTectonicActivity(game) {
        this.tectonicActivity += (Math.random() - 0.5) * 0.01;
        this.tectonicActivity = Math.max(0, Math.min(1, this.tectonicActivity));
        
        if (this.tectonicActivity > 0.8 && Math.random() < 0.001) {
            // Déclencher un tremblement de terre
            const x = game.player.x + (Math.random() - 0.5) * 1000;
            const y = game.player.y + (Math.random() - 0.5) * 500;
            game.worldComplexSystem?.triggerEnvironmentalDestruction(game, 'earthquake', x, y, this.tectonicActivity);
        }
    }

    updateVolcanicActivity(game) {
        this.volcanicActivity += (Math.random() - 0.5) * 0.005;
        this.volcanicActivity = Math.max(0, Math.min(1, this.volcanicActivity));
        
        if (this.volcanicActivity > 0.9 && Math.random() < 0.0005) {
            // Déclencher une éruption volcanique
            const x = game.player.x + (Math.random() - 0.5) * 800;
            const y = game.player.y + 200 + Math.random() * 300; // Plus profond
            game.worldComplexSystem?.triggerEnvironmentalDestruction(game, 'volcanic_eruption', x, y, this.volcanicActivity);
        }
    }

    updateErosion(game) {
        // Érosion lente et naturelle
        if (Math.random() < this.erosionRate) {
            const x = Math.floor(Math.random() * (game.tileMap[0]?.length || 100));
            const y = Math.floor(Math.random() * game.tileMap.length);
            
            if (game.tileMap[y]?.[x] === TILE.DIRT || game.tileMap[y]?.[x] === TILE.SAND) {
                // Vérifier s'il y a de l'eau à proximité
                const hasWaterNearby = this.checkWaterNearby(game, x, y);
                if (hasWaterNearby && Math.random() < 0.1) {
                    game.tileMap[y][x] = TILE.AIR;
                }
            }
        }
    }

    checkWaterNearby(game, x, y) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (game.tileMap[y + dy]?.[x + dx] === TILE.WATER) {
                    return true;
                }
            }
        }
        return false;
    }
}

export { ComplexWorldSystem };