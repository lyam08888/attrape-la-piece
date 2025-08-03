// worldIntegrationSystem.js - Système d'intégration du monde complexe
import { ComplexWorldSystem } from './worldComplexSystem.js';
import { AdvancedBiomeSystem } from './advancedBiomeSystem.js';
import { ExplorationSystem } from './explorationSystem.js';
import { TILE } from './world.js';

export class WorldIntegrationSystem {
    constructor(config) {
        this.config = config;
        this.complexWorldSystem = new ComplexWorldSystem(config);
        this.biomeSystem = new AdvancedBiomeSystem(config);
        this.explorationSystem = new ExplorationSystem(config);
        
        this.initialized = false;
        this.updateTimer = 0;
        this.eventQueue = [];
        this.activeEffects = new Map();
        
        // Statistiques du monde
        this.worldStats = {
            totalDestructions: 0,
            biomesGenerated: 0,
            structuresBuilt: 0,
            animalsSpawned: 0,
            secretsDiscovered: 0,
            playTime: 0
        };
    }

    // === INITIALISATION ===
    
    initialize(game) {
        if (this.initialized) return;
        
        console.log('🌍 Initialisation du système de monde complexe...');
        
        // Intégrer les systèmes au jeu
        game.worldComplexSystem = this.complexWorldSystem;
        game.biomeSystem = this.biomeSystem;
        game.explorationSystem = this.explorationSystem;
        
        // Initialiser les systèmes d'animaux intelligents
        this.initializeIntelligentAnimals(game);
        
        // Configurer les événements
        this.setupEventListeners(game);
        
        // Générer le contenu initial
        this.generateInitialContent(game);
        
        // Marquer comme initialisé
        this.initialized = true;
        
        console.log('✅ Système de monde complexe initialisé !');
        
        if (game.logger) {
            game.logger.log('🌍 Monde complexe activé !');
        }
    }

    initializeIntelligentAnimals(game) {
        if (!game.animals) game.animals = [];
        
        // Remplacer les animaux existants par des versions intelligentes
        const existingAnimals = [...game.animals];
        game.animals = [];
        
        existingAnimals.forEach(animal => {
            const biome = this.biomeSystem.getBiomeAt(game, animal.x, animal.y);
            const intelligentAnimals = this.biomeSystem.spawnAnimalsInBiome(game, biome, animal.x, animal.y, 1);
            
            if (intelligentAnimals.length > 0) {
                game.animals.push(...intelligentAnimals);
                this.worldStats.animalsSpawned += intelligentAnimals.length;
            }
        });
        
        // Si aucun animal existant, générer quelques animaux de test
        if (game.animals.length === 0 && game.player) {
            const biome = this.biomeSystem.getBiomeAt(game, game.player.x, game.player.y);
            const testAnimals = this.biomeSystem.spawnAnimalsInBiome(game, biome, game.player.x, game.player.y, 5);
            game.animals.push(...testAnimals);
            this.worldStats.animalsSpawned += testAnimals.length;
        }
        
        console.log(`🐾 ${game.animals.length} animaux intelligents initialisés`);
    }

    setupEventListeners(game) {
        // Événements de destruction
        document.addEventListener('environmental-destruction', (event) => {
            this.handleEnvironmentalDestruction(game, event.detail);
        });
        
        // Événements de découverte
        document.addEventListener('biome-discovered', (event) => {
            this.handleBiomeDiscovery(game, event.detail);
        });
        
        // Événements de construction
        document.addEventListener('structure-built', (event) => {
            this.handleStructureBuilt(game, event.detail);
        });
        
        // Événements d'exploration
        document.addEventListener('landmark-discovered', (event) => {
            this.handleLandmarkDiscovery(game, event.detail);
        });
        
        // Événements de quêtes
        document.addEventListener('quest-completed', (event) => {
            this.handleQuestCompletion(game, event.detail);
        });
    }

    generateInitialContent(game) {
        // Générer des landmarks initiaux
        this.generateInitialLandmarks(game);
        
        // Placer des animaux intelligents dans chaque biome
        this.populateBiomesWithAnimals(game);
        
        // Créer des zones de transition entre biomes
        this.createBiomeTransitions(game);
        
        // Générer des secrets cachés
        this.generateHiddenSecrets(game);
    }

    generateInitialLandmarks(game) {
        const landmarkCount = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < landmarkCount; i++) {
            const x = Math.random() * this.config.worldWidth;
            const y = Math.random() * this.config.worldHeight;
            
            // Éviter de placer trop près du joueur
            if (Math.hypot(x - game.player.x, y - game.player.y) > 200) {
                this.explorationSystem.generateLandmark(game, { x, y });
            }
        }
        
        console.log(`🏛️ ${landmarkCount} landmarks générés`);
    }

    populateBiomesWithAnimals(game) {
        const biomes = this.biomeSystem.getAllBiomes();
        
        biomes.forEach(biome => {
            const biomeData = this.biomeSystem.getBiomeData(biome);
            if (!biomeData) return;
            
            // Générer des animaux pour ce biome
            const animalCount = 3 + Math.floor(Math.random() * 5);
            
            for (let i = 0; i < animalCount; i++) {
                const x = Math.random() * this.config.worldWidth;
                const y = this.findSuitableSpawnY(game, x, biome);
                
                if (y !== -1) {
                    const animals = this.biomeSystem.spawnAnimalsInBiome(game, biome, x, y, 1);
                    if (animals.length > 0) {
                        game.animals.push(...animals);
                        this.worldStats.animalsSpawned += animals.length;
                    }
                }
            }
        });
        
        console.log(`🐾 Biomes peuplés avec ${game.animals.length} animaux`);
    }

    findSuitableSpawnY(game, x, biome) {
        const tileX = Math.floor(x / this.config.tileSize);
        
        // Chercher une surface appropriée
        for (let y = 0; y < game.tileMap.length - 1; y++) {
            const currentTile = game.tileMap[y]?.[tileX];
            const belowTile = game.tileMap[y + 1]?.[tileX];
            
            if (currentTile === TILE.AIR && belowTile > TILE.AIR) {
                const worldY = y * this.config.tileSize;
                const detectedBiome = this.biomeSystem.getBiomeAt(game, x, worldY);
                
                if (detectedBiome === biome) {
                    return worldY;
                }
            }
        }
        
        return -1;
    }

    createBiomeTransitions(game) {
        // Créer des zones de transition fluides entre biomes
        const transitionCount = 8 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < transitionCount; i++) {
            const x = Math.random() * this.config.worldWidth;
            const y = Math.random() * this.config.worldHeight;
            
            const biome1 = this.biomeSystem.getBiomeAt(game, x - 100, y);
            const biome2 = this.biomeSystem.getBiomeAt(game, x + 100, y);
            
            if (biome1 !== biome2) {
                this.biomeSystem.createBiomeTransition(game, biome1, biome2, x, y, 200, 100);
            }
        }
        
        console.log(`🌈 ${transitionCount} zones de transition créées`);
    }

    generateHiddenSecrets(game) {
        const secretCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < secretCount; i++) {
            const x = Math.random() * this.config.worldWidth;
            const y = Math.random() * this.config.worldHeight;
            
            this.explorationSystem.generateSecret(game, { x, y });
        }
        
        console.log(`🔍 ${secretCount} secrets cachés générés`);
    }

    // === MISE À JOUR PRINCIPALE ===
    
    update(game, delta) {
        if (!this.initialized) return;
        
        this.updateTimer += delta;
        this.worldStats.playTime += delta;
        
        // Mise à jour des systèmes principaux
        this.complexWorldSystem.updateEcosystem(game, delta);
        this.biomeSystem.update(game, delta);
        this.explorationSystem.updateExploration(game, game.player, delta);
        
        // Mise à jour des animaux intelligents
        this.updateIntelligentAnimals(game, delta);
        
        // Gestion des événements naturels
        this.updateNaturalEvents(game, delta);
        
        // Mise à jour des effets actifs
        this.updateActiveEffects(game, delta);
        
        // Traitement de la queue d'événements
        this.processEventQueue(game);
        
        // Optimisation périodique
        if (this.updateTimer > 5000) { // Toutes les 5 secondes
            this.performOptimization(game);
            this.updateTimer = 0;
        }
    }

    updateIntelligentAnimals(game, delta) {
        if (!game.animals) return;
        
        for (let i = game.animals.length - 1; i >= 0; i--) {
            const animal = game.animals[i];
            
            // Mise à jour de l'IA avancée
            this.updateAnimalAI(game, animal, delta);
            
            // Mise à jour des comportements
            this.updateAnimalBehavior(game, animal, delta);
            
            // Vérifier la survie
            if (animal.health <= 0 || animal.isDead) {
                this.handleAnimalDeath(game, animal, i);
            }
        }
    }

    updateAnimalAI(game, animal, delta) {
        if (!animal.ai) return;
        
        animal.ai.stateTimer += delta;
        
        // Mise à jour selon l'état
        switch (animal.ai.state) {
            case 'idle':
                this.updateIdleState(animal, delta);
                break;
            case 'wandering':
                this.updateWanderingState(animal, delta);
                break;
            case 'fleeing':
                this.updateFleeingState(game, animal, delta);
                break;
            case 'hunting':
                this.updateHuntingState(game, animal, delta);
                break;
            case 'migrating':
                this.updateMigratingState(game, animal, delta);
                break;
            case 'socializing':
                this.updateSocializingState(game, animal, delta);
                break;
        }
        
        // Besoins physiologiques
        this.updateAnimalNeeds(animal, delta);
    }

    updateIdleState(animal, delta) {
        if (animal.ai.stateTimer > 2000 + Math.random() * 3000) {
            // Changer d'état après 2-5 secondes
            const nextStates = ['wandering', 'socializing'];
            if (animal.behavior.social) nextStates.push('socializing');
            
            animal.ai.state = nextStates[Math.floor(Math.random() * nextStates.length)];
            animal.ai.stateTimer = 0;
        }
    }

    updateWanderingState(animal, delta) {
        // Mouvement vers la cible
        const dx = animal.ai.targetX - animal.x;
        const dy = animal.ai.targetY - animal.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 10) {
            animal.vx += (dx / distance) * animal.stats.speed * 0.1;
            animal.vy += (dy / distance) * animal.stats.speed * 0.1;
        } else {
            // Nouvelle cible
            animal.ai.targetX = animal.x + (Math.random() - 0.5) * 200;
            animal.ai.targetY = animal.y + (Math.random() - 0.5) * 100;
        }
        
        // Retour à l'idle après un moment
        if (animal.ai.stateTimer > 5000) {
            animal.ai.state = 'idle';
            animal.ai.stateTimer = 0;
        }
    }

    updateFleeingState(game, animal, delta) {
        // Fuir le joueur ou les prédateurs
        const player = game.player;
        if (player) {
            const dx = animal.x - player.x;
            const dy = animal.y - player.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance > 0) {
                animal.vx += (dx / distance) * animal.stats.speed * 0.2;
                animal.vy += (dy / distance) * animal.stats.speed * 0.2;
            }
        }
        
        // Arrêter de fuir après un moment
        if (animal.ai.stateTimer > 3000) {
            animal.ai.state = 'idle';
            animal.ai.stateTimer = 0;
            animal.ai.fearLevel = Math.max(0, animal.ai.fearLevel - 10);
        }
    }

    updateHuntingState(game, animal, delta) {
        if (!animal.huntTarget || animal.huntTarget.isDead) {
            animal.ai.state = 'wandering';
            animal.huntTarget = null;
            return;
        }
        
        // Poursuivre la proie
        const target = animal.huntTarget;
        const dx = target.x - animal.x;
        const dy = target.y - animal.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 20) {
            animal.vx += (dx / distance) * animal.stats.speed * 0.15;
            animal.vy += (dy / distance) * animal.stats.speed * 0.15;
        } else {
            // Attaquer
            if (Math.random() < 0.1) {
                target.health -= animal.stats.strength;
                if (target.health <= 0) {
                    animal.ai.hungerLevel = Math.min(100, animal.ai.hungerLevel + 30);
                    animal.huntTarget = null;
                    animal.ai.state = 'idle';
                }
            }
        }
    }

    updateMigratingState(game, animal, delta) {
        if (!animal.migrationTarget) {
            animal.ai.state = 'wandering';
            return;
        }
        
        const target = animal.migrationTarget;
        const dx = target.x - animal.x;
        const dy = target.y - animal.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 50) {
            animal.vx += (dx / distance) * animal.stats.speed * 0.1;
            animal.vy += (dy / distance) * animal.stats.speed * 0.1;
        } else {
            // Migration terminée
            animal.migrationTarget = null;
            animal.ai.state = 'idle';
            animal.biome = target.biome || animal.biome;
        }
    }

    updateSocializingState(game, animal, delta) {
        // Chercher d'autres animaux de la même espèce
        const nearbyAnimals = game.animals.filter(other => 
            other !== animal && 
            other.type === animal.type &&
            Math.hypot(other.x - animal.x, other.y - animal.y) < 100
        );
        
        if (nearbyAnimals.length > 0) {
            const target = nearbyAnimals[0];
            const dx = target.x - animal.x;
            const dy = target.y - animal.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance > 30) {
                animal.vx += (dx / distance) * animal.stats.speed * 0.05;
                animal.vy += (dy / distance) * animal.stats.speed * 0.05;
            }
            
            animal.ai.socialNeed = Math.max(0, animal.ai.socialNeed - 1);
        } else {
            animal.ai.state = 'wandering';
        }
        
        if (animal.ai.stateTimer > 4000) {
            animal.ai.state = 'idle';
            animal.ai.stateTimer = 0;
        }
    }

    updateAnimalNeeds(animal, delta) {
        // Faim
        animal.ai.hungerLevel = Math.max(0, animal.ai.hungerLevel - delta * 0.01);
        
        // Besoin social
        if (animal.behavior.social) {
            animal.ai.socialNeed = Math.min(100, animal.ai.socialNeed + delta * 0.005);
        }
        
        // Peur diminue avec le temps
        animal.ai.fearLevel = Math.max(0, animal.ai.fearLevel - delta * 0.02);
        
        // Changements d'état basés sur les besoins
        if (animal.ai.hungerLevel < 20 && animal.behavior.predator) {
            animal.ai.state = 'hunting';
        } else if (animal.ai.socialNeed > 80 && animal.behavior.social) {
            animal.ai.state = 'socializing';
        } else if (animal.ai.fearLevel > 50) {
            animal.ai.state = 'fleeing';
        }
    }

    updateAnimalBehavior(game, animal, delta) {
        // Comportements spéciaux selon le type d'animal
        if (animal.behavior.nocturnal && game.timeSystem) {
            const time = game.timeSystem.getTime();
            const isNight = time.hour < 6 || time.hour > 20;
            
            if (isNight) {
                animal.stats.speed *= 1.2; // Plus actif la nuit
            } else {
                animal.stats.speed *= 0.8; // Moins actif le jour
            }
        }
        
        // Adaptation au biome
        const currentBiome = this.biomeSystem.getBiomeAt(game, animal.x, animal.y);
        if (currentBiome !== animal.biome) {
            this.adaptAnimalToBiome(animal, currentBiome);
        }
        
        // Reproduction
        this.updateAnimalReproduction(game, animal, delta);
    }

    adaptAnimalToBiome(animal, newBiome) {
        const biomeData = this.biomeSystem.getBiomeData(newBiome);
        if (!biomeData) return;
        
        // Adaptation à la température
        if (biomeData.temperature < 0 && !animal.adaptations.coldResistance) {
            animal.health -= 0.1; // Dégâts de froid
        } else if (biomeData.temperature > 35 && !animal.adaptations.heatResistance) {
            animal.health -= 0.1; // Dégâts de chaleur
        }
        
        // Adaptation à l'humidité
        if (biomeData.humidity < 0.2 && animal.type.includes('fish')) {
            animal.health -= 0.5; // Les poissons souffrent dans les zones sèches
        }
        
        animal.biome = newBiome;
    }

    updateAnimalReproduction(game, animal, delta) {
        if (!animal.reproduction || animal.health < animal.maxHealth * 0.8) return;
        
        animal.reproduction.maturityAge -= delta;
        
        if (animal.reproduction.maturityAge <= 0 && !animal.isMature) {
            animal.isMature = true;
            animal.maxHealth *= 1.2;
            animal.health = animal.maxHealth;
        }
        
        if (animal.isMature && Math.random() < 0.0001) { // Très rare
            this.triggerAnimalReproduction(game, animal);
        }
    }

    triggerAnimalReproduction(game, animal) {
        // Chercher un partenaire
        const potentialMates = game.animals.filter(other =>
            other !== animal &&
            other.type === animal.type &&
            other.isMature &&
            Math.hypot(other.x - animal.x, other.y - animal.y) < 50
        );
        
        if (potentialMates.length > 0) {
            const litterSize = animal.reproduction.litterSize || 1;
            
            for (let i = 0; i < litterSize; i++) {
                const baby = this.createBabyAnimal(animal);
                game.animals.push(baby);
                this.worldStats.animalsSpawned++;
            }
            
            if (game.logger) {
                game.logger.log(`🐾 Naissance de ${litterSize} ${animal.type}(s) !`);
            }
        }
    }

    createBabyAnimal(parent) {
        const baby = JSON.parse(JSON.stringify(parent)); // Deep copy
        
        // Modifications pour un bébé
        baby.x += (Math.random() - 0.5) * 20;
        baby.y += (Math.random() - 0.5) * 20;
        baby.w *= 0.5;
        baby.h *= 0.5;
        baby.health = parent.maxHealth * 0.3;
        baby.maxHealth = parent.maxHealth * 0.3;
        baby.isMature = false;
        baby.reproduction.maturityAge = parent.reproduction.maturityAge;
        
        // Statistiques réduites
        Object.keys(baby.stats).forEach(stat => {
            baby.stats[stat] *= 0.4;
        });
        
        return baby;
    }

    handleAnimalDeath(game, animal, index) {
        // Créer des drops
        if (animal.drops) {
            animal.drops.forEach(dropType => {
                if (Math.random() < 0.6) {
                    game.collectibles.push({
                        x: animal.x + Math.random() * animal.w,
                        y: animal.y + Math.random() * animal.h,
                        w: 12,
                        h: 12,
                        vx: (Math.random() - 0.5) * 3,
                        vy: -Math.random() * 4,
                        foodType: dropType,
                        life: 600
                    });
                }
            });
        }
        
        // Supprimer l'animal
        game.animals.splice(index, 1);
        
        // Effets écologiques
        this.handleEcologicalImpact(game, animal);
    }

    handleEcologicalImpact(game, deadAnimal) {
        // Impact sur l'écosystème
        if (deadAnimal.behavior.predator) {
            // Mort d'un prédateur -> augmentation des proies
            const nearbyPrey = game.animals.filter(animal =>
                animal.behavior.prey &&
                Math.hypot(animal.x - deadAnimal.x, animal.y - deadAnimal.y) < 200
            );
            
            nearbyPrey.forEach(prey => {
                prey.ai.fearLevel = Math.max(0, prey.ai.fearLevel - 20);
                prey.reproduction.breedingUrge = (prey.reproduction.breedingUrge || 0) + 0.1;
            });
        }
    }

    updateNaturalEvents(game, delta) {
        // Événements naturels aléatoires
        if (Math.random() < 0.0001) { // Très rare
            this.complexWorldSystem.triggerRandomNaturalEvent(game);
            this.worldStats.totalDestructions++;
        }
        
        // Événements saisonniers
        if (game.timeSystem) {
            const season = game.timeSystem.getSeason?.();
            if (season) {
                this.triggerSeasonalEvents(game, season);
            }
        }
    }

    triggerSeasonalEvents(game, season) {
        switch (season) {
            case 'spring':
                if (Math.random() < 0.001) {
                    this.triggerSpringBloom(game);
                }
                break;
            case 'summer':
                if (Math.random() < 0.0005) {
                    this.triggerSummerStorm(game);
                }
                break;
            case 'autumn':
                if (Math.random() < 0.0008) {
                    this.triggerAutumnMigration(game);
                }
                break;
            case 'winter':
                if (Math.random() < 0.0003) {
                    this.triggerWinterFreeze(game);
                }
                break;
        }
    }

    triggerSpringBloom(game) {
        // Faire pousser des fleurs partout
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * (game.tileMap[0]?.length || 100));
            const y = Math.floor(Math.random() * game.tileMap.length);
            
            if (game.tileMap[y]?.[x] === TILE.GRASS) {
                const flowerType = Math.random() < 0.5 ? TILE.FLOWER_RED : TILE.FLOWER_YELLOW;
                if (game.tileMap[y - 1]?.[x] === TILE.AIR) {
                    game.tileMap[y - 1][x] = flowerType;
                }
            }
        }
        
        if (game.logger) {
            game.logger.log('🌸 Floraison printanière !');
        }
    }

    triggerSummerStorm(game) {
        const x = game.player.x + (Math.random() - 0.5) * 500;
        const y = game.player.y + (Math.random() - 0.5) * 300;
        
        this.complexWorldSystem.triggerEnvironmentalDestruction(game, 'lightning_strike', x, y, 1);
        
        if (game.logger) {
            game.logger.log('⚡ Orage d\'été !');
        }
    }

    triggerAutumnMigration(game) {
        // Déclencher la migration de tous les animaux migrateurs
        game.animals.forEach(animal => {
            if (animal.behavior.migratory) {
                this.biomeSystem.triggerAnimalMigration(animal, game);
            }
        });
        
        if (game.logger) {
            game.logger.log('🦅 Grande migration d\'automne !');
        }
    }

    triggerWinterFreeze(game) {
        // Geler l'eau en glace
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * (game.tileMap[0]?.length || 100));
            const y = Math.floor(Math.random() * game.tileMap.length);
            
            if (game.tileMap[y]?.[x] === TILE.WATER) {
                game.tileMap[y][x] = TILE.ICE;
            }
        }
        
        if (game.logger) {
            game.logger.log('❄️ Gel hivernal !');
        }
    }

    updateActiveEffects(game, delta) {
        this.activeEffects.forEach((effect, id) => {
            effect.duration -= delta;
            
            if (effect.duration <= 0) {
                this.activeEffects.delete(id);
            } else {
                // Appliquer l'effet
                this.applyEffect(game, effect);
            }
        });
    }

    applyEffect(game, effect) {
        switch (effect.type) {
            case 'weather_change':
                // Effet météorologique continu
                break;
            case 'biome_transformation':
                // Transformation progressive du biome
                break;
            case 'ecosystem_boost':
                // Boost de l'écosystème
                break;
        }
    }

    processEventQueue(game) {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.handleQueuedEvent(game, event);
        }
    }

    handleQueuedEvent(game, event) {
        switch (event.type) {
            case 'spawn_animals':
                this.handleSpawnAnimalsEvent(game, event);
                break;
            case 'create_structure':
                this.handleCreateStructureEvent(game, event);
                break;
            case 'trigger_disaster':
                this.handleTriggerDisasterEvent(game, event);
                break;
        }
    }

    performOptimization(game) {
        // Nettoyer les animaux trop loin
        if (game.animals) {
            const maxDistance = 1000;
            game.animals = game.animals.filter(animal => {
                const distance = Math.hypot(animal.x - game.player.x, animal.y - game.player.y);
                return distance <= maxDistance;
            });
        }
        
        // Nettoyer les collectibles expirés
        if (game.collectibles) {
            game.collectibles = game.collectibles.filter(item => {
                if (item.life !== undefined) {
                    item.life -= 5000; // 5 secondes
                    return item.life > 0;
                }
                return true;
            });
        }
        
        // Nettoyer les effets expirés
        this.activeEffects.forEach((effect, id) => {
            if (effect.duration <= 0) {
                this.activeEffects.delete(id);
            }
        });
    }

    // === GESTIONNAIRES D'ÉVÉNEMENTS ===

    handleEnvironmentalDestruction(game, detail) {
        this.worldStats.totalDestructions++;
        
        // Réactions des animaux à la destruction
        game.animals.forEach(animal => {
            const distance = Math.hypot(animal.x - detail.x, animal.y - detail.y);
            if (distance < detail.radius * 2) {
                animal.ai.fearLevel = Math.min(100, animal.ai.fearLevel + 50);
                animal.ai.state = 'fleeing';
            }
        });
    }

    handleBiomeDiscovery(game, detail) {
        this.worldStats.biomesGenerated++;
        
        // Récompenser la découverte
        if (game.player.stats) {
            game.player.stats.addXP(detail.reward.xp);
        }
        
        // Ajouter les items
        if (detail.reward.items) {
            Object.entries(detail.reward.items).forEach(([item, quantity]) => {
                game.player.inventory[item] = (game.player.inventory[item] || 0) + quantity;
            });
        }
    }

    handleStructureBuilt(game, detail) {
        this.worldStats.structuresBuilt++;
        
        // Effets sur l'écosystème local
        const nearbyAnimals = game.animals.filter(animal =>
            Math.hypot(animal.x - detail.x, animal.y - detail.y) < 200
        );
        
        nearbyAnimals.forEach(animal => {
            if (detail.structure.category === 'biological') {
                // Les structures biologiques attirent les animaux
                animal.ai.targetX = detail.x;
                animal.ai.targetY = detail.y;
                animal.ai.state = 'wandering';
            } else {
                // Les autres structures peuvent effrayer
                animal.ai.fearLevel += 10;
            }
        });
    }

    handleLandmarkDiscovery(game, detail) {
        // Marquer le landmark comme découvert
        const landmark = this.explorationSystem.landmarks.get(detail.landmarkId);
        if (landmark) {
            landmark.discovered = true;
            this.explorationSystem.playerProgress.landmarksFound.add(detail.landmarkId);
            
            // Récompenser la découverte
            this.explorationSystem.grantReward(game, landmark.rewards);
        }
    }

    handleQuestCompletion(game, detail) {
        // Récompenses spéciales pour certaines quêtes
        if (detail.questId === 'master_explorer') {
            this.unlockMasterExplorerRewards(game);
        } else if (detail.questId === 'ecosystem_guardian') {
            this.unlockEcosystemGuardianRewards(game);
        }
    }

    unlockMasterExplorerRewards(game) {
        // Débloquer des outils avancés
        game.player.unlockedTools = game.player.unlockedTools || new Set();
        game.player.unlockedTools.add('QUANTUM_PICKAXE');
        game.player.unlockedTools.add('DIMENSIONAL_PORTAL');
        
        if (game.logger) {
            game.logger.log('🏆 Outils de Maître Explorateur débloqués !');
        }
    }

    unlockEcosystemGuardianRewards(game) {
        // Débloquer des capacités écologiques
        game.player.abilities = game.player.abilities || new Set();
        game.player.abilities.add('animal_communication');
        game.player.abilities.add('ecosystem_restoration');
        
        if (game.logger) {
            game.logger.log('🌿 Capacités de Gardien de l\'Écosystème débloquées !');
        }
    }

    // === INTERFACE PUBLIQUE ===

    getWorldStats() {
        return { ...this.worldStats };
    }

    getActiveEffects() {
        return Array.from(this.activeEffects.values());
    }

    triggerCustomEvent(game, eventType, parameters) {
        this.eventQueue.push({
            type: eventType,
            parameters: parameters,
            timestamp: Date.now()
        });
    }

    addActiveEffect(id, effect) {
        this.activeEffects.set(id, effect);
    }

    removeActiveEffect(id) {
        this.activeEffects.delete(id);
    }

    // === MÉTHODES DE DÉBOGAGE ===

    getSystemStatus() {
        return {
            initialized: this.initialized,
            activeEffectsCount: this.activeEffects.size,
            eventQueueLength: this.eventQueue.length,
            worldStats: this.worldStats,
            updateTimer: this.updateTimer
        };
    }

    forceNaturalEvent(game, eventType) {
        this.complexWorldSystem.triggerEnvironmentalDestruction(game, eventType,
            game.player.x, game.player.y, 1);
    }

    spawnTestAnimals(game, count = 5) {
        const biome = this.biomeSystem.getBiomeAt(game, game.player.x, game.player.y);
        const animals = this.biomeSystem.spawnAnimalsInBiome(game, biome,
            game.player.x, game.player.y, count);
        
        if (animals.length > 0) {
            game.animals.push(...animals);
            this.worldStats.animalsSpawned += animals.length;
        }
        
        return animals.length;
    }

    generateTestLandmark(game) {
        this.explorationSystem.generateLandmark(game, {
            x: game.player.x + 100,
            y: game.player.y
        });
    }

    // === SAUVEGARDE ET CHARGEMENT ===

    serialize() {
        return {
            worldStats: this.worldStats,
            playerProgress: this.explorationSystem.getExplorationProgress(),
            activeEffects: Array.from(this.activeEffects.entries()),
            initialized: this.initialized
        };
    }

    deserialize(data) {
        if (data.worldStats) {
            this.worldStats = { ...this.worldStats, ...data.worldStats };
        }
        
        if (data.playerProgress) {
            Object.assign(this.explorationSystem.playerProgress, data.playerProgress);
        }
        
        if (data.activeEffects) {
            this.activeEffects = new Map(data.activeEffects);
        }
        
        this.initialized = data.initialized || false;
    }
}

