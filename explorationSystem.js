// explorationSystem.js - Système d'exploration avancé avec outils intelligents
import { TILE } from './world.js';
import { SeededRandom } from './seededRandom.js';

class ExplorationSystem {
    constructor(config) {
        this.config = config;
        this.discoveredAreas = new Map();
        this.landmarks = new Map();
        this.secrets = new Map();
        this.explorationRewards = new Map();
        this.playerProgress = {
            totalDistance: 0,
            biomesDiscovered: new Set(),
            landmarksFound: new Set(),
            secretsUnlocked: new Set(),
            depthReached: 0,
            heightReached: 0
        };
        this.tools = this.initializeAdvancedTools();
        this.constructionBlueprints = this.initializeBlueprints();
    }

    initializeAdvancedTools() {
        return {
            // === OUTILS DE MINAGE AVANCÉS ===
            QUANTUM_PICKAXE: {
                name: 'Pioche Quantique',
                type: 'mining',
                tier: 'legendary',
                durability: 10000,
                efficiency: 50,
                specialAbilities: ['phase_through', 'quantum_tunnel', 'ore_detection'],
                energyCost: 10,
                craftingRecipe: {
                    'diamond': 5,
                    'crystal': 10,
                    'energy_core': 1
                },
                description: 'Peut miner à travers plusieurs blocs simultanément'
            },

            MOLECULAR_DRILL: {
                name: 'Foreuse Moléculaire',
                type: 'mining',
                tier: 'epic',
                durability: 5000,
                efficiency: 30,
                specialAbilities: ['precision_mining', 'material_analysis', 'auto_collect'],
                energyCost: 8,
                craftingRecipe: {
                    'iron': 20,
                    'gold': 10,
                    'crystal': 5
                },
                description: 'Analyse et extrait automatiquement les minerais'
            },

            TERRAFORMING_DEVICE: {
                name: 'Dispositif de Terraformation',
                type: 'construction',
                tier: 'legendary',
                durability: 8000,
                efficiency: 25,
                specialAbilities: ['biome_change', 'mass_construction', 'environmental_control'],
                energyCost: 15,
                craftingRecipe: {
                    'platinum': 10,
                    'crystal': 15,
                    'energy_core': 2
                },
                description: 'Peut modifier des biomes entiers'
            },

            GRAVITY_MANIPULATOR: {
                name: 'Manipulateur de Gravité',
                type: 'utility',
                tier: 'epic',
                durability: 6000,
                efficiency: 20,
                specialAbilities: ['gravity_control', 'levitation', 'mass_movement'],
                energyCost: 12,
                craftingRecipe: {
                    'moon_rock': 8,
                    'crystal': 12,
                    'energy_core': 1
                },
                description: 'Contrôle la gravité dans une zone'
            },

            DIMENSIONAL_PORTAL: {
                name: 'Portail Dimensionnel',
                type: 'transport',
                tier: 'legendary',
                durability: 3000,
                efficiency: 100,
                specialAbilities: ['instant_travel', 'dimension_hop', 'space_fold'],
                energyCost: 25,
                craftingRecipe: {
                    'obsidian': 20,
                    'crystal': 25,
                    'energy_core': 3
                },
                description: 'Permet de voyager instantanément'
            },

            ECOSYSTEM_ANALYZER: {
                name: 'Analyseur d\'Écosystème',
                type: 'analysis',
                tier: 'rare',
                durability: 4000,
                efficiency: 15,
                specialAbilities: ['biome_analysis', 'animal_tracking', 'resource_detection'],
                energyCost: 5,
                craftingRecipe: {
                    'gold': 15,
                    'crystal': 8,
                    'circuit': 5
                },
                description: 'Analyse les écosystèmes et détecte les ressources'
            },

            WEATHER_CONTROLLER: {
                name: 'Contrôleur Météorologique',
                type: 'environmental',
                tier: 'epic',
                durability: 7000,
                efficiency: 40,
                specialAbilities: ['weather_control', 'climate_change', 'storm_creation'],
                energyCost: 20,
                craftingRecipe: {
                    'cloud_essence': 10,
                    'crystal': 15,
                    'energy_core': 1
                },
                description: 'Contrôle la météo dans une large zone'
            },

            LIFE_SEED_CANNON: {
                name: 'Canon à Graines de Vie',
                type: 'biological',
                tier: 'rare',
                durability: 5000,
                efficiency: 35,
                specialAbilities: ['instant_growth', 'ecosystem_creation', 'species_introduction'],
                energyCost: 8,
                craftingRecipe: {
                    'wood': 30,
                    'seeds': 50,
                    'life_essence': 5
                },
                description: 'Fait pousser instantanément des écosystèmes'
            }
        };
    }

    initializeBlueprints() {
        return {
            // === STRUCTURES ARCHITECTURALES ===
            FLOATING_CASTLE: {
                name: 'Château Flottant',
                category: 'architecture',
                size: { width: 50, height: 80 },
                materials: {
                    'heavenly_stone': 200,
                    'cloud': 100,
                    'crystal': 50,
                    'gold': 30
                },
                specialFeatures: ['anti_gravity', 'weather_shield', 'teleportation_hub'],
                buildTime: 3600, // 1 heure
                description: 'Un château majestueux qui flotte dans les airs'
            },

            UNDERGROUND_CITY: {
                name: 'Cité Souterraine',
                category: 'settlement',
                size: { width: 100, height: 60 },
                materials: {
                    'stone': 500,
                    'iron': 200,
                    'crystal': 100,
                    'glow_mushroom': 50
                },
                specialFeatures: ['artificial_lighting', 'ventilation_system', 'mining_network'],
                buildTime: 7200, // 2 heures
                description: 'Une ville complète creusée dans la roche'
            },

            CRYSTAL_OBSERVATORY: {
                name: 'Observatoire Cristallin',
                category: 'science',
                size: { width: 30, height: 40 },
                materials: {
                    'crystal': 150,
                    'glass': 80,
                    'gold': 40,
                    'energy_core': 5
                },
                specialFeatures: ['star_mapping', 'dimensional_viewing', 'future_prediction'],
                buildTime: 1800, // 30 minutes
                description: 'Observe les étoiles et prédit l\'avenir'
            },

            BIODOME_SANCTUARY: {
                name: 'Sanctuaire Biodôme',
                category: 'biological',
                size: { width: 60, height: 40 },
                materials: {
                    'glass': 200,
                    'steel': 100,
                    'life_essence': 20,
                    'seeds': 100
                },
                specialFeatures: ['climate_control', 'species_preservation', 'accelerated_growth'],
                buildTime: 2400, // 40 minutes
                description: 'Préserve et cultive toutes les formes de vie'
            },

            PORTAL_NETWORK_HUB: {
                name: 'Hub de Réseau de Portails',
                category: 'transport',
                size: { width: 40, height: 30 },
                materials: {
                    'obsidian': 100,
                    'crystal': 80,
                    'energy_core': 10,
                    'dimensional_fabric': 20
                },
                specialFeatures: ['multi_destination', 'instant_travel', 'dimension_bridge'],
                buildTime: 5400, // 1.5 heure
                description: 'Centre de transport interdimensionnel'
            },

            ELEMENTAL_FORGE: {
                name: 'Forge Élémentaire',
                category: 'crafting',
                size: { width: 25, height: 20 },
                materials: {
                    'hellstone': 80,
                    'ice_crystal': 40,
                    'wind_essence': 30,
                    'earth_core': 20
                },
                specialFeatures: ['elemental_fusion', 'legendary_crafting', 'enchantment_boost'],
                buildTime: 3000, // 50 minutes
                description: 'Forge utilisant le pouvoir des éléments'
            }
        };
    }

    // === SYSTÈME DE DÉCOUVERTE ===

    updateExploration(game, player, delta) {
        const currentPos = { x: player.x, y: player.y };
        const currentBiome = game.biomeSystem?.getBiomeAt(game, player.x, player.y);
        
        // Mettre à jour la distance parcourue
        if (this.lastPlayerPos) {
            const distance = Math.hypot(
                currentPos.x - this.lastPlayerPos.x,
                currentPos.y - this.lastPlayerPos.y
            );
            this.playerProgress.totalDistance += distance;
        }
        this.lastPlayerPos = currentPos;

        // Découvrir de nouveaux biomes
        if (currentBiome && !this.playerProgress.biomesDiscovered.has(currentBiome)) {
            this.discoverBiome(game, currentBiome, currentPos);
        }

        // Mettre à jour les records de profondeur/hauteur
        this.updateDepthHeightRecords(player);

        // Chercher des landmarks et secrets
        this.searchForLandmarks(game, currentPos);
        this.searchForSecrets(game, currentPos);

        // Générer des récompenses d'exploration
        this.generateExplorationRewards(game, currentPos);
    }

    discoverBiome(game, biome, position) {
        this.playerProgress.biomesDiscovered.add(biome);
        
        // Récompense de découverte
        const reward = this.getBiomeDiscoveryReward(biome);
        this.grantReward(game, reward);
        
        // Log de découverte
        if (game.logger) {
            game.logger.log(`🗺️ Nouveau biome découvert: ${biome}`);
        }
        
        // Créer des effets visuels
        game.createParticles(position.x, position.y, 20, '#FFD700', { speed: 5 });
        
        // Déclencher un événement
        document.dispatchEvent(new CustomEvent('biome-discovered', {
            detail: { biome, position, reward }
        }));
    }

    getBiomeDiscoveryReward(biome) {
        const rewards = {
            'PARADISE_MEADOW': { xp: 100, items: { 'healing_potion': 3 } },
            'CRYSTAL_CAVES': { xp: 150, items: { 'crystal': 5, 'energy_core': 1 } },
            'FLOATING_ISLANDS': { xp: 200, items: { 'cloud_essence': 3, 'wind_crystal': 2 } },
            'TROPICAL_JUNGLE': { xp: 120, items: { 'exotic_fruit': 5, 'medicinal_herb': 3 } },
            'ARID_DESERT': { xp: 130, items: { 'desert_gem': 3, 'cactus_fruit': 5 } },
            'FROZEN_TUNDRA': { xp: 140, items: { 'ice_crystal': 4, 'arctic_fur': 2 } },
            'VOLCANIC_WASTELAND': { xp: 180, items: { 'hellstone': 3, 'fire_essence': 2 } },
            'DEEP_CAVERNS': { xp: 160, items: { 'rare_mineral': 4, 'cave_crystal': 3 } },
            'INFERNAL_DEPTHS': { xp: 250, items: { 'demon_essence': 2, 'hellfire_crystal': 1 } },
            'CORAL_REEF': { xp: 110, items: { 'pearl': 3, 'sea_crystal': 2 } },
            'ABYSSAL_DEPTHS': { xp: 220, items: { 'deep_pearl': 2, 'pressure_crystal': 1 } }
        };
        
        return rewards[biome] || { xp: 50, items: {} };
    }

    updateDepthHeightRecords(player) {
        const depth = Math.max(0, this.config.worldHeight - player.y);
        const height = Math.max(0, player.y);
        
        if (depth > this.playerProgress.depthReached) {
            this.playerProgress.depthReached = depth;
            this.triggerDepthMilestone(depth);
        }
        
        if (height > this.playerProgress.heightReached) {
            this.playerProgress.heightReached = height;
            this.triggerHeightMilestone(height);
        }
    }

    triggerDepthMilestone(depth) {
        const milestones = [100, 500, 1000, 2000, 5000, 10000];
        const milestone = milestones.find(m => depth >= m && this.playerProgress.depthReached < m);
        
        if (milestone) {
            document.dispatchEvent(new CustomEvent('depth-milestone', {
                detail: { depth: milestone, reward: this.getDepthReward(milestone) }
            }));
        }
    }

    triggerHeightMilestone(height) {
        const milestones = [100, 300, 500, 1000, 2000];
        const milestone = milestones.find(m => height >= m && this.playerProgress.heightReached < m);
        
        if (milestone) {
            document.dispatchEvent(new CustomEvent('height-milestone', {
                detail: { height: milestone, reward: this.getHeightReward(milestone) }
            }));
        }
    }

    searchForLandmarks(game, position) {
        // Générer des landmarks procéduraux
        if (Math.random() < 0.001) { // 0.1% de chance par frame
            this.generateLandmark(game, position);
        }
    }

    generateLandmark(game, position) {
        const landmarkTypes = [
            'ancient_ruins', 'crystal_formation', 'giant_tree', 'mysterious_portal',
            'floating_island', 'underground_lake', 'volcanic_crater', 'ice_cavern',
            'golden_statue', 'energy_nexus', 'time_rift', 'dimensional_gate'
        ];
        
        const type = landmarkTypes[Math.floor(Math.random() * landmarkTypes.length)];
        const landmark = {
            id: `landmark_${Date.now()}_${Math.random()}`,
            type: type,
            position: { ...position },
            discovered: false,
            rewards: this.generateLandmarkRewards(type),
            description: this.getLandmarkDescription(type),
            interactionRadius: 50
        };
        
        this.landmarks.set(landmark.id, landmark);
        this.createLandmarkStructure(game, landmark);
    }

    createLandmarkStructure(game, landmark) {
        const { x, y } = landmark.position;
        const tileX = Math.floor(x / this.config.tileSize);
        const tileY = Math.floor(y / this.config.tileSize);
        
        switch (landmark.type) {
            case 'crystal_formation':
                this.buildCrystalFormation(game, tileX, tileY);
                break;
            case 'ancient_ruins':
                this.buildAncientRuins(game, tileX, tileY);
                break;
            case 'giant_tree':
                this.buildGiantTree(game, tileX, tileY);
                break;
            case 'mysterious_portal':
                this.buildMysteriousPortal(game, tileX, tileY);
                break;
            // Ajouter d'autres types selon les besoins
        }
    }

    buildCrystalFormation(game, centerX, centerY) {
        const crystalTypes = [TILE.CRYSTAL, TILE.AMETHYST, TILE.DIAMOND];
        const height = 8 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < height; i++) {
            const width = Math.max(1, height - i);
            for (let dx = -Math.floor(width/2); dx <= Math.floor(width/2); dx++) {
                const x = centerX + dx;
                const y = centerY - i;
                
                if (game.tileMap[y]?.[x] !== undefined) {
                    const crystalType = crystalTypes[Math.floor(Math.random() * crystalTypes.length)];
                    game.tileMap[y][x] = crystalType;
                }
            }
        }
    }

    buildAncientRuins(game, centerX, centerY) {
        const width = 12;
        const height = 8;
        
        // Base des ruines
        for (let dx = -width/2; dx <= width/2; dx++) {
            for (let dy = 0; dy < 2; dy++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (game.tileMap[y]?.[x] !== undefined) {
                    game.tileMap[y][x] = TILE.STONE;
                }
            }
        }
        
        // Colonnes partiellement détruites
        for (let i = 0; i < 4; i++) {
            const colX = centerX - width/2 + (i * width/3);
            const colHeight = 3 + Math.floor(Math.random() * 4);
            
            for (let dy = 0; dy < colHeight; dy++) {
                const y = centerY - 2 - dy;
                if (game.tileMap[y]?.[colX] !== undefined) {
                    game.tileMap[y][colX] = TILE.STONE;
                }
            }
        }
    }

    buildGiantTree(game, centerX, centerY) {
        const trunkHeight = 15 + Math.floor(Math.random() * 10);
        const trunkWidth = 3;
        
        // Tronc
        for (let dy = 0; dy < trunkHeight; dy++) {
            for (let dx = -trunkWidth/2; dx <= trunkWidth/2; dx++) {
                const x = centerX + dx;
                const y = centerY - dy;
                if (game.tileMap[y]?.[x] !== undefined) {
                    game.tileMap[y][x] = TILE.OAK_WOOD;
                }
            }
        }
        
        // Couronne massive
        const crownRadius = 8;
        const crownY = centerY - trunkHeight;
        for (let dy = -crownRadius; dy <= crownRadius/2; dy++) {
            for (let dx = -crownRadius; dx <= crownRadius; dx++) {
                const distance = Math.hypot(dx, dy);
                if (distance <= crownRadius && Math.random() < 0.8) {
                    const x = centerX + dx;
                    const y = crownY + dy;
                    if (game.tileMap[y]?.[x] === TILE.AIR) {
                        game.tileMap[y][x] = TILE.OAK_LEAVES;
                    }
                }
            }
        }
    }

    buildMysteriousPortal(game, centerX, centerY) {
        const portalRadius = 4;
        
        // Cadre du portail
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const x = centerX + Math.floor(Math.cos(angle) * portalRadius);
            const y = centerY + Math.floor(Math.sin(angle) * portalRadius);
            
            if (game.tileMap[y]?.[x] !== undefined) {
                game.tileMap[y][x] = TILE.OBSIDIAN;
            }
        }
        
        // Centre énergétique
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (Math.hypot(dx, dy) <= 2) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    if (game.tileMap[y]?.[x] !== undefined) {
                        game.tileMap[y][x] = TILE.CRYSTAL;
                    }
                }
            }
        }
    }

    searchForSecrets(game, position) {
        // Chercher des secrets cachés
        if (Math.random() < 0.0005) { // 0.05% de chance
            this.generateSecret(game, position);
        }
    }

    generateSecret(game, position) {
        const secretTypes = [
            'hidden_treasure', 'ancient_knowledge', 'power_source', 'dimensional_key',
            'legendary_artifact', 'time_capsule', 'energy_well', 'spirit_shrine'
        ];
        
        const type = secretTypes[Math.floor(Math.random() * secretTypes.length)];
        const secret = {
            id: `secret_${Date.now()}_${Math.random()}`,
            type: type,
            position: { ...position },
            discovered: false,
            rewards: this.generateSecretRewards(type),
            description: this.getSecretDescription(type),
            unlockCondition: this.getSecretUnlockCondition(type)
        };
        
        this.secrets.set(secret.id, secret);
    }

    generateSecretRewards(type) {
        const rewards = {
            'hidden_treasure': {
                xp: 500,
                items: { 'gold': 50, 'diamond': 10, 'rare_artifact': 1 }
            },
            'ancient_knowledge': {
                xp: 1000,
                blueprints: ['ancient_technology'],
                abilities: ['ancient_wisdom']
            },
            'power_source': {
                xp: 300,
                items: { 'energy_core': 5, 'power_crystal': 3 }
            },
            'dimensional_key': {
                xp: 800,
                items: { 'dimensional_key': 1 },
                abilities: ['dimensional_travel']
            },
            'legendary_artifact': {
                xp: 1500,
                items: { 'legendary_artifact': 1 },
                abilities: ['artifact_power']
            }
        };
        
        return rewards[type] || { xp: 100, items: {} };
    }

    // === SYSTÈME D'OUTILS AVANCÉS ===

    useAdvancedTool(game, player, toolName, targetX, targetY, action = 'primary') {
        const tool = this.tools[toolName];
        if (!tool) return false;

        // Vérifier l'énergie
        if (player.energy < tool.energyCost) {
            if (game.logger) {
                game.logger.log('⚡ Pas assez d\'énergie !');
            }
            return false;
        }

        // Consommer l'énergie
        player.energy -= tool.energyCost;

        // Exécuter l'action selon le type d'outil
        switch (tool.type) {
            case 'mining':
                return this.executeAdvancedMining(game, player, tool, targetX, targetY, action);
            case 'construction':
                return this.executeAdvancedConstruction(game, player, tool, targetX, targetY, action);
            case 'utility':
                return this.executeUtilityAction(game, player, tool, targetX, targetY, action);
            case 'transport':
                return this.executeTransportAction(game, player, tool, targetX, targetY, action);
            case 'analysis':
                return this.executeAnalysisAction(game, player, tool, targetX, targetY, action);
            case 'environmental':
                return this.executeEnvironmentalAction(game, player, tool, targetX, targetY, action);
            case 'biological':
                return this.executeBiologicalAction(game, player, tool, targetX, targetY, action);
        }

        return false;
    }

    executeAdvancedMining(game, player, tool, targetX, targetY, action) {
        const tileX = Math.floor(targetX / this.config.tileSize);
        const tileY = Math.floor(targetY / this.config.tileSize);

        if (tool.specialAbilities.includes('quantum_tunnel')) {
            // Miner en ligne droite
            const direction = this.getDirectionToTarget(player, targetX, targetY);
            this.quantumTunnel(game, player, direction, tool.efficiency);
        } else if (tool.specialAbilities.includes('precision_mining')) {
            // Minage de précision avec analyse
            this.precisionMine(game, tileX, tileY, tool);
        } else if (tool.specialAbilities.includes('phase_through')) {
            // Miner à travers plusieurs couches
            this.phaseThrough(game, tileX, tileY, tool.efficiency);
        }

        return true;
    }

    quantumTunnel(game, player, direction, length) {
        const startX = Math.floor(player.x / this.config.tileSize);
        const startY = Math.floor(player.y / this.config.tileSize);

        for (let i = 1; i <= length; i++) {
            const x = startX + Math.floor(direction.x * i);
            const y = startY + Math.floor(direction.y * i);

            if (game.tileMap[y]?.[x] && game.tileMap[y][x] !== TILE.BEDROCK) {
                const originalTile = game.tileMap[y][x];
                game.tileMap[y][x] = TILE.AIR;

                // Créer des collectibles
                if (originalTile > TILE.AIR) {
                    game.collectibles.push({
                        x: x * this.config.tileSize,
                        y: y * this.config.tileSize,
                        w: this.config.tileSize / 2,
                        h: this.config.tileSize / 2,
                        vx: (Math.random() - 0.5) * 4,
                        vy: -Math.random() * 3,
                        tileType: originalTile
                    });
                }
            }
        }

        // Effets visuels
        game.createParticles(player.x, player.y, 30, '#00FFFF', { speed: 10 });
    }

    precisionMine(game, tileX, tileY, tool) {
        const tile = game.tileMap[tileY]?.[tileX];
        if (!tile || tile === TILE.AIR) return;

        // Analyser le minerai
        const analysis = this.analyzeMaterial(tile);
        
        // Extraction optimisée
        const extractionMultiplier = tool.specialAbilities.includes('auto_collect') ? 2 : 1;
        const quantity = Math.floor(analysis.baseYield * extractionMultiplier);

        // Créer les collectibles
        for (let i = 0; i < quantity; i++) {
            game.collectibles.push({
                x: tileX * this.config.tileSize + Math.random() * this.config.tileSize,
                y: tileY * this.config.tileSize + Math.random() * this.config.tileSize,
                w: this.config.tileSize / 3,
                h: this.config.tileSize / 3,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2,
                tileType: tile
            });
        }

        game.tileMap[tileY][tileX] = TILE.AIR;

        // Afficher l'analyse
        if (game.logger) {
            game.logger.log(`🔬 Analyse: ${analysis.name} - Pureté: ${analysis.purity}%`);
        }
    }

    analyzeMaterial(tile) {
        const materials = {
            [TILE.COAL]: { name: 'Charbon', purity: 70, baseYield: 1 },
            [TILE.IRON]: { name: 'Fer', purity: 80, baseYield: 1 },
            [TILE.GOLD]: { name: 'Or', purity: 90, baseYield: 2 },
            [TILE.DIAMOND]: { name: 'Diamant', purity: 95, baseYield: 3 },
            [TILE.CRYSTAL]: { name: 'Cristal', purity: 85, baseYield: 2 }
        };

        return materials[tile] || { name: 'Matériau Inconnu', purity: 50, baseYield: 1 };
    }

    executeAdvancedConstruction(game, player, tool, targetX, targetY, action) {
        if (tool.specialAbilities.includes('mass_construction')) {
            return this.massConstruction(game, player, targetX, targetY, tool);
        } else if (tool.specialAbilities.includes('biome_change')) {
            return this.changeBiome(game, targetX, targetY, tool);
        }

        return false;
    }

    massConstruction(game, player, targetX, targetY, tool) {
        const blueprint = player.selectedBlueprint;
        if (!blueprint) return false;

        const blueprintData = this.constructionBlueprints[blueprint];
        if (!blueprintData) return false;

        // Vérifier les matériaux
        if (!this.hasRequiredMaterials(player, blueprintData.materials)) {
            if (game.logger) {
                game.logger.log('🏗️ Matériaux insuffisants !');
            }
            return false;
        }

        // Consommer les matériaux
        this.consumeMaterials(player, blueprintData.materials);

        // Construire la structure
        this.buildStructure(game, targetX, targetY, blueprintData);

        if (game.logger) {
            game.logger.log(`🏗️ ${blueprintData.name} construit !`);
        }

        return true;
    }

    buildStructure(game, centerX, centerY, blueprint) {
        const tileX = Math.floor(centerX / this.config.tileSize);
        const tileY = Math.floor(centerY / this.config.tileSize);
        
        // Construction selon le type de structure
        switch (blueprint.name) {
            case 'Château Flottant':
                this.buildFloatingCastle(game, tileX, tileY);
                break;
            case 'Cité Souterraine':
                this.buildUndergroundCity(game, tileX, tileY);
                break;
            case 'Observatoire Cristallin':
                this.buildCrystalObservatory(game, tileX, tileY);
                break;
            default:
                this.buildGenericStructure(game, tileX, tileY, blueprint);
        }
    }

    buildFloatingCastle(game, centerX, centerY) {
        const width = 25;
        const height = 40;
        
        // Base flottante
        for (let dx = -width/2; dx <= width/2; dx++) {
            for (let dy = 0; dy < 5; dy++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (game.tileMap[y]?.[x] !== undefined) {
                    game.tileMap[y][x] = TILE.CLOUD;
                }
            }
        }
        
        // Tours du château
        const towers = [
            { x: centerX - width/3, y: centerY - height/2 },
            { x: centerX + width/3, y: centerY - height/2 },
            { x: centerX, y: centerY - height/3 }
        ];
        
        towers.forEach(tower => {
            const towerHeight = 15 + Math.floor(Math.random() * 10);
            for (let dy = 0; dy < towerHeight; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const x = tower.x + dx;
                    const y = tower.y - dy;
                    if (game.tileMap[y]?.[x] !== undefined) {
                        game.tileMap[y][x] = TILE.HEAVENLY_STONE;
                    }
                }
            }
        });
    }

    buildUndergroundCity(game, centerX, centerY) {
        const width = 50;
        const height = 30;
        
        // Creuser l'espace principal
        for (let dx = -width/2; dx <= width/2; dx++) {
            for (let dy = 0; dy < height; dy++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (game.tileMap[y]?.[x] !== undefined) {
                    game.tileMap[y][x] = TILE.AIR;
                }
            }
        }
        
        // Murs de soutènement
        for (let dy = 0; dy < height; dy++) {
            const leftX = centerX - width/2;
            const rightX = centerX + width/2;
            if (game.tileMap[centerY + dy]?.[leftX] !== undefined) {
                game.tileMap[centerY + dy][leftX] = TILE.STONE;
            }
            if (game.tileMap[centerY + dy]?.[rightX] !== undefined) {
                game.tileMap[centerY + dy][rightX] = TILE.STONE;
            }
        }
        
        // Plafond
        for (let dx = -width/2; dx <= width/2; dx++) {
            const x = centerX + dx;
            const y = centerY - 1;
            if (game.tileMap[y]?.[x] !== undefined) {
                game.tileMap[y][x] = TILE.STONE;
            }
        }
        
        // Éclairage avec champignons lumineux
        for (let i = 0; i < 10; i++) {
            const x = centerX - width/2 + Math.floor(Math.random() * width);
            const y = centerY + Math.floor(Math.random() * height);
            if (game.tileMap[y]?.[x] === TILE.AIR) {
                game.tileMap[y][x] = TILE.GLOW_MUSHROOM;
            }
        }
    }

    buildCrystalObservatory(game, centerX, centerY) {
        const radius = 8;
        const height = 20;
        
        // Base circulaire
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
            const x = centerX + Math.floor(Math.cos(angle) * radius);
            const y = centerY + Math.floor(Math.sin(angle) * radius);
            
            if (game.tileMap[y]?.[x] !== undefined) {
                game.tileMap[y][x] = TILE.CRYSTAL;
            }
        }
        
        // Tour centrale
        for (let dy = 0; dy < height; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const x = centerX + dx;
                const y = centerY - dy;
                if (game.tileMap[y]?.[x] !== undefined && Math.abs(dx) <= 1) {
                    game.tileMap[y][x] = TILE.CRYSTAL;
                }
            }
        }
        
        // Dôme d'observation
        const domeY = centerY - height;
        for (let dx = -4; dx <= 4; dx++) {
            for (let dy = -4; dy <= 0; dy++) {
                if (Math.hypot(dx, dy) <= 4) {
                    const x = centerX + dx;
                    const y = domeY + dy;
                    if (game.tileMap[y]?.[x] !== undefined) {
                        game.tileMap[y][x] = TILE.CRYSTAL;
                    }
                }
            }
        }
    }

    hasRequiredMaterials(player, materials) {
        for (const [material, quantity] of Object.entries(materials)) {
            if ((player.inventory[material] || 0) < quantity) {
                return false;
            }
        }
        return true;
    }

    consumeMaterials(player, materials) {
        for (const [material, quantity] of Object.entries(materials)) {
            player.inventory[material] = (player.inventory[material] || 0) - quantity;
        }
    }

    changeBiome(game, targetX, targetY, tool) {
        const radius = 100; // Rayon d'effet en pixels
        const tileRadius = Math.floor(radius / this.config.tileSize);
        const centerTileX = Math.floor(targetX / this.config.tileSize);
        const centerTileY = Math.floor(targetY / this.config.tileSize);
        
        // Changer les tiles dans la zone
        for (let dy = -tileRadius; dy <= tileRadius; dy++) {
            for (let dx = -tileRadius; dx <= tileRadius; dx++) {
                if (Math.hypot(dx, dy) <= tileRadius) {
                    const x = centerTileX + dx;
                    const y = centerTileY + dy;
                    
                    if (game.tileMap[y]?.[x] !== undefined) {
                        // Transformer selon le biome cible
                        const newTile = this.getTransformedTile(game.tileMap[y][x], 'paradise');
                        game.tileMap[y][x] = newTile;
                    }
                }
            }
        }
        
        // Effets visuels
        game.createParticles(targetX, targetY, 50, '#90EE90', { speed: 8 });
        
        if (game.logger) {
            game.logger.log('🌍 Biome transformé !');
        }
        
        return true;
    }

    getTransformedTile(originalTile, targetBiome) {
        const transformations = {
            'paradise': {
                [TILE.DIRT]: TILE.GRASS,
                [TILE.STONE]: TILE.HEAVENLY_STONE,
                [TILE.SAND]: TILE.GRASS,
                [TILE.LAVA]: TILE.WATER,
                [TILE.HELLSTONE]: TILE.CRYSTAL
            },
            'desert': {
                [TILE.GRASS]: TILE.SAND,
                [TILE.DIRT]: TILE.SAND,
                [TILE.WATER]: TILE.SAND,
                [TILE.OAK_LEAVES]: TILE.AIR
            },
            'frozen': {
                [TILE.WATER]: TILE.ICE,
                [TILE.GRASS]: TILE.SNOW,
                [TILE.DIRT]: TILE.SNOW,
                [TILE.LAVA]: TILE.OBSIDIAN
            }
        };
        
        return transformations[targetBiome]?.[originalTile] || originalTile;
    }

    // === MÉTHODES UTILITAIRES ===

    getDirectionToTarget(player, targetX, targetY) {
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const length = Math.hypot(dx, dy);
        
        return {
            x: dx / length,
            y: dy / length
        };
    }

    grantReward(game, reward) {
        if (reward.xp && game.player.stats) {
            game.player.stats.addXP(reward.xp);
        }
        
        if (reward.items) {
            for (const [item, quantity] of Object.entries(reward.items)) {
                game.player.inventory[item] = (game.player.inventory[item] || 0) + quantity;
            }
        }
        
        if (reward.blueprints) {
            reward.blueprints.forEach(blueprint => {
                game.player.unlockedBlueprints = game.player.unlockedBlueprints || new Set();
                game.player.unlockedBlueprints.add(blueprint);
            });
        }
        
        if (reward.abilities) {
            reward.abilities.forEach(ability => {
                game.player.abilities = game.player.abilities || new Set();
                game.player.abilities.add(ability);
            });
        }
    }

    getDepthReward(depth) {
        const rewards = {
            100: { xp: 50, items: { 'torch': 10 } },
            500: { xp: 150, items: { 'mining_helmet': 1 } },
            1000: { xp: 300, items: { 'deep_crystal': 3 } },
            2000: { xp: 500, items: { 'pressure_suit': 1 } },
            5000: { xp: 1000, items: { 'core_fragment': 1 } },
            10000: { xp: 2000, items: { 'legendary_pickaxe': 1 } }
        };
        
        return rewards[depth] || { xp: 100, items: {} };
    }

    getHeightReward(height) {
        const rewards = {
            100: { xp: 50, items: { 'feather': 5 } },
            300: { xp: 100, items: { 'wind_crystal': 2 } },
            500: { xp: 200, items: { 'cloud_boots': 1 } },
            1000: { xp: 400, items: { 'sky_gem': 3 } },
            2000: { xp: 800, items: { 'wings_of_flight': 1 } }
        };
        
        return rewards[height] || { xp: 50, items: {} };
    }

    getLandmarkDescription(type) {
        const descriptions = {
            'ancient_ruins': 'Des ruines mystérieuses d\'une civilisation perdue',
            'crystal_formation': 'Une formation cristalline naturelle aux propriétés magiques',
            'giant_tree': 'Un arbre gigantesque, témoin des âges passés',
            'mysterious_portal': 'Un portail énigmatique vers des dimensions inconnues',
            'floating_island': 'Une île qui défie les lois de la gravité',
            'underground_lake': 'Un lac souterrain aux eaux cristallines',
            'volcanic_crater': 'Un cratère volcanique encore actif',
            'ice_cavern': 'Une caverne de glace aux formations spectaculaires',
            'golden_statue': 'Une statue dorée d\'origine inconnue',
            'energy_nexus': 'Un nexus d\'énergie pure et concentrée',
            'time_rift': 'Une faille temporelle instable',
            'dimensional_gate': 'Une porte vers d\'autres dimensions'
        };
        
        return descriptions[type] || 'Un lieu mystérieux et inexploré';
    }

    getSecretDescription(type) {
        const descriptions = {
            'hidden_treasure': 'Un trésor caché par d\'anciens explorateurs',
            'ancient_knowledge': 'Des connaissances perdues d\'une civilisation avancée',
            'power_source': 'Une source d\'énergie pure et inépuisable',
            'dimensional_key': 'Une clé ouvrant les portes entre les dimensions',
            'legendary_artifact': 'Un artefact légendaire aux pouvoirs immenses',
            'time_capsule': 'Une capsule temporelle du futur',
            'energy_well': 'Un puits d\'énergie cosmique',
            'spirit_shrine': 'Un sanctuaire dédié aux esprits anciens'
        };
        
        return descriptions[type] || 'Un secret bien gardé';
    }

    getSecretUnlockCondition(type) {
        const conditions = {
            'hidden_treasure': { type: 'tool', requirement: 'advanced_scanner' },
            'ancient_knowledge': { type: 'stat', requirement: { intelligence: 50 } },
            'power_source': { type: 'item', requirement: { 'energy_detector': 1 } },
            'dimensional_key': { type: 'quest', requirement: 'dimensional_research' },
            'legendary_artifact': { type: 'achievement', requirement: 'master_explorer' }
        };
        
        return conditions[type] || { type: 'proximity', requirement: 10 };
    }

    generateExplorationRewards(game, position) {
        // Générer des récompenses basées sur l'exploration
        if (this.playerProgress.totalDistance > 0 &&
            this.playerProgress.totalDistance % 1000 < 10) { // Tous les 1000 pixels
            
            const reward = {
                xp: 25,
                items: { 'exploration_token': 1 }
            };
            
            this.grantReward(game, reward);
            
            if (game.logger) {
                game.logger.log('🗺️ Récompense d\'exploration !');
            }
        }
    }

    // === INTERFACE PUBLIQUE ===

    getExplorationProgress() {
        return {
            ...this.playerProgress,
            biomesDiscovered: Array.from(this.playerProgress.biomesDiscovered),
            landmarksFound: Array.from(this.playerProgress.landmarksFound),
            secretsUnlocked: Array.from(this.playerProgress.secretsUnlocked)
        };
    }

    getAvailableTools() {
        return Object.keys(this.tools);
    }

    getToolInfo(toolName) {
        return this.tools[toolName];
    }

    getAvailableBlueprints() {
        return Object.keys(this.constructionBlueprints);
    }

    getBlueprintInfo(blueprintName) {
        return this.constructionBlueprints[blueprintName];
    }

    getDiscoveredLandmarks() {
        return Array.from(this.landmarks.values()).filter(l => l.discovered);
    }

    getUnlockedSecrets() {
        return Array.from(this.secrets.values()).filter(s => s.discovered);
    }
}

export default ExplorationSystem;
