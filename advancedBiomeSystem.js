// advancedBiomeSystem.js - Système de biomes avancé avec écosystèmes intelligents
import { TILE } from './world.js';
import { SeededRandom } from './seededRandom.js';
import { Perlin } from './perlin.js';

export class AdvancedBiomeSystem {
    constructor(config) {
        this.config = config;
        this.biomes = this.initializeBiomes();
        this.transitionZones = new Map();
        this.ecosystems = new Map();
        this.animalDistribution = this.initializeAnimalDistribution();
        this.biomeEffects = new Map();
        this.seasonalChanges = new Map();
    }

    initializeBiomes() {
        return {
            // === BIOMES TERRESTRES ===
            PARADISE_MEADOW: {
                name: 'Prairie Paradisiaque',
                layer: 'PARADISE',
                temperature: 25,
                humidity: 0.7,
                fertility: 1.0,
                dangerLevel: 0,
                primaryTiles: [TILE.GRASS, TILE.FLOWER_RED, TILE.FLOWER_YELLOW],
                secondaryTiles: [TILE.OAK_WOOD, TILE.OAK_LEAVES],
                rareTiles: [TILE.CRYSTAL, TILE.GOLD],
                skyColor: ['#FFE4B5', '#87CEEB'],
                ambientSound: 'paradise_birds',
                weatherPatterns: ['sunny', 'light_rain', 'rainbow'],
                animals: ['rabbit', 'deer', 'butterfly', 'bee', 'dove', 'sheep'],
                plantLife: ['oak_tree', 'flower_field', 'berry_bush'],
                resources: ['honey', 'berries', 'healing_herbs']
            },

            CRYSTAL_CAVES: {
                name: 'Grottes de Cristal',
                layer: 'PARADISE',
                temperature: 15,
                humidity: 0.8,
                fertility: 0.3,
                dangerLevel: 1,
                primaryTiles: [TILE.CRYSTAL, TILE.AMETHYST, TILE.STONE],
                secondaryTiles: [TILE.GLOW_MUSHROOM, TILE.WATER],
                rareTiles: [TILE.DIAMOND, TILE.EMERALD],
                skyColor: ['#E1BEE7', '#DDA0DD'],
                ambientSound: 'crystal_resonance',
                weatherPatterns: ['crystal_rain', 'aurora'],
                animals: ['bat', 'crystal_spider', 'glow_worm'],
                plantLife: ['glow_mushroom', 'crystal_flower'],
                resources: ['crystal_shards', 'pure_water', 'light_essence']
            },

            FLOATING_ISLANDS: {
                name: 'Îles Flottantes',
                layer: 'SKY',
                temperature: 10,
                humidity: 0.9,
                fertility: 0.8,
                dangerLevel: 2,
                primaryTiles: [TILE.CLOUD, TILE.HEAVENLY_STONE, TILE.GRASS],
                secondaryTiles: [TILE.OAK_WOOD, TILE.WATER],
                rareTiles: [TILE.MOON_ROCK, TILE.PLATINUM],
                skyColor: ['#87CEEB', '#B0E0E6'],
                ambientSound: 'wind_whispers',
                weatherPatterns: ['floating_mist', 'wind_storm', 'cloud_burst'],
                animals: ['eagle', 'falcon', 'cloud_sheep', 'wind_sprite'],
                plantLife: ['sky_tree', 'cloud_berry', 'wind_flower'],
                resources: ['wind_essence', 'cloud_cotton', 'sky_metal']
            },

            TEMPERATE_FOREST: {
                name: 'Forêt Tempérée',
                layer: 'SURFACE',
                temperature: 18,
                humidity: 0.6,
                fertility: 0.9,
                dangerLevel: 1,
                primaryTiles: [TILE.GRASS, TILE.DIRT, TILE.OAK_WOOD],
                secondaryTiles: [TILE.OAK_LEAVES, TILE.STONE, TILE.WATER],
                rareTiles: [TILE.IRON, TILE.COAL],
                skyColor: ['#87CEEB', '#228B22'],
                ambientSound: 'forest_ambience',
                weatherPatterns: ['sunny', 'rain', 'fog', 'snow'],
                animals: ['deer', 'rabbit', 'squirrel', 'bear', 'wolf', 'owl', 'fox'],
                plantLife: ['oak_tree', 'pine_tree', 'fern', 'mushroom'],
                resources: ['wood', 'berries', 'herbs', 'game_meat']
            },

            TROPICAL_JUNGLE: {
                name: 'Jungle Tropicale',
                layer: 'SURFACE',
                temperature: 30,
                humidity: 0.9,
                fertility: 1.0,
                dangerLevel: 3,
                primaryTiles: [TILE.GRASS, TILE.DIRT, TILE.OAK_WOOD],
                secondaryTiles: [TILE.OAK_LEAVES, TILE.WATER, TILE.FLOWER_RED],
                rareTiles: [TILE.EMERALD, TILE.GOLD],
                skyColor: ['#228B22', '#006400'],
                ambientSound: 'jungle_sounds',
                weatherPatterns: ['humid', 'tropical_rain', 'thunderstorm'],
                animals: ['monkey', 'parrot', 'jaguar', 'snake', 'frog', 'butterfly', 'toucan'],
                plantLife: ['jungle_tree', 'vine', 'exotic_flower', 'fruit_tree'],
                resources: ['exotic_fruits', 'medicinal_plants', 'rare_wood']
            },

            ARID_DESERT: {
                name: 'Désert Aride',
                layer: 'SURFACE',
                temperature: 40,
                humidity: 0.1,
                fertility: 0.2,
                dangerLevel: 4,
                primaryTiles: [TILE.SAND, TILE.SANDSTONE, TILE.STONE],
                secondaryTiles: [TILE.CACTUS, TILE.GOLD],
                rareTiles: [TILE.DIAMOND, TILE.RUBY],
                skyColor: ['#F4A460', '#DEB887'],
                ambientSound: 'desert_wind',
                weatherPatterns: ['scorching_sun', 'sandstorm', 'rare_oasis'],
                animals: ['camel', 'lizard', 'scorpion', 'vulture', 'fennec_fox'],
                plantLife: ['cactus', 'desert_flower', 'palm_tree'],
                resources: ['cactus_fruit', 'desert_gems', 'sand_glass']
            },

            FROZEN_TUNDRA: {
                name: 'Toundra Gelée',
                layer: 'SURFACE',
                temperature: -10,
                humidity: 0.3,
                fertility: 0.3,
                dangerLevel: 3,
                primaryTiles: [TILE.SNOW, TILE.ICE, TILE.STONE],
                secondaryTiles: [TILE.PINE_WOOD, TILE.WATER],
                rareTiles: [TILE.SAPPHIRE, TILE.PLATINUM],
                skyColor: ['#B0E0E6', '#F0F8FF'],
                ambientSound: 'arctic_wind',
                weatherPatterns: ['blizzard', 'aurora', 'ice_storm'],
                animals: ['polar_bear', 'seal', 'penguin', 'arctic_fox', 'whale'],
                plantLife: ['pine_tree', 'ice_flower', 'moss'],
                resources: ['ice_crystals', 'seal_oil', 'arctic_herbs']
            },

            VOLCANIC_WASTELAND: {
                name: 'Terres Volcaniques',
                layer: 'SURFACE',
                temperature: 50,
                humidity: 0.2,
                fertility: 0.4,
                dangerLevel: 5,
                primaryTiles: [TILE.LAVA, TILE.OBSIDIAN, TILE.SCORCHED_STONE],
                secondaryTiles: [TILE.HELLSTONE, TILE.BASALT],
                rareTiles: [TILE.RUBY, TILE.GARNET],
                skyColor: ['#FF4500', '#8B0000'],
                ambientSound: 'volcanic_rumble',
                weatherPatterns: ['ash_rain', 'lava_flow', 'volcanic_eruption'],
                animals: ['fire_salamander', 'lava_lizard', 'phoenix'],
                plantLife: ['fire_flower', 'volcanic_moss'],
                resources: ['obsidian', 'volcanic_glass', 'fire_essence']
            },

            DEEP_CAVERNS: {
                name: 'Cavernes Profondes',
                layer: 'UNDERGROUND',
                temperature: 12,
                humidity: 0.8,
                fertility: 0.2,
                dangerLevel: 4,
                primaryTiles: [TILE.STONE, TILE.GRANITE, TILE.COAL],
                secondaryTiles: [TILE.IRON, TILE.WATER, TILE.GLOW_MUSHROOM],
                rareTiles: [TILE.GOLD, TILE.DIAMOND, TILE.LAPIS],
                skyColor: ['#2F2F2F', '#1C1C1C'],
                ambientSound: 'cave_drips',
                weatherPatterns: ['cave_in', 'underground_river', 'gas_leak'],
                animals: ['bat', 'cave_spider', 'blind_fish', 'mole'],
                plantLife: ['mushroom', 'cave_moss', 'root_system'],
                resources: ['minerals', 'cave_water', 'mushrooms']
            },

            CRYSTAL_CORE: {
                name: 'Noyau Cristallin',
                layer: 'DEEP_CORE',
                temperature: 5,
                humidity: 0.5,
                fertility: 0.1,
                dangerLevel: 3,
                primaryTiles: [TILE.CRYSTAL, TILE.AMETHYST, TILE.QUARTZ],
                secondaryTiles: [TILE.DIAMOND, TILE.EMERALD, TILE.SAPPHIRE],
                rareTiles: [TILE.OPAL, TILE.TOPAZ],
                skyColor: ['#E1BEE7', '#9370DB'],
                ambientSound: 'crystal_hum',
                weatherPatterns: ['crystal_growth', 'energy_surge', 'resonance'],
                animals: ['crystal_golem', 'energy_wisp', 'gem_beetle'],
                plantLife: ['crystal_tree', 'gem_flower'],
                resources: ['pure_crystals', 'energy_cores', 'gem_dust']
            },

            INFERNAL_DEPTHS: {
                name: 'Profondeurs Infernales',
                layer: 'HELL',
                temperature: 80,
                humidity: 0.1,
                fertility: 0.1,
                dangerLevel: 6,
                primaryTiles: [TILE.LAVA, TILE.HELLSTONE, TILE.SOUL_SAND],
                secondaryTiles: [TILE.OBSIDIAN, TILE.SCORCHED_STONE],
                rareTiles: [TILE.HELLFIRE_CRYSTAL, TILE.DEMON_GOLD],
                skyColor: ['#8B0000', '#FF0000'],
                ambientSound: 'hellish_screams',
                weatherPatterns: ['hellfire', 'soul_storm', 'demon_wind'],
                animals: ['demon', 'hellhound', 'fire_imp', 'lava_worm'],
                plantLife: ['hellish_vine', 'soul_flower', 'demon_tree'],
                resources: ['hellstone', 'soul_essence', 'demon_blood']
            },

            // === BIOMES AQUATIQUES ===
            CORAL_REEF: {
                name: 'Récif de Corail',
                layer: 'SURFACE',
                temperature: 25,
                humidity: 1.0,
                fertility: 0.9,
                dangerLevel: 2,
                primaryTiles: [TILE.WATER, TILE.CORAL, TILE.SAND],
                secondaryTiles: [TILE.SEAWEED, TILE.PEARL],
                rareTiles: [TILE.TREASURE_CHEST, TILE.RARE_PEARL],
                skyColor: ['#4169E1', '#00CED1'],
                ambientSound: 'ocean_waves',
                weatherPatterns: ['calm_seas', 'underwater_current', 'tidal_wave'],
                animals: ['fish', 'shark', 'dolphin', 'octopus', 'sea_turtle', 'crab'],
                plantLife: ['coral', 'seaweed', 'sea_anemone'],
                resources: ['fish', 'pearls', 'seaweed', 'coral']
            },

            ABYSSAL_DEPTHS: {
                name: 'Abysses Océaniques',
                layer: 'DEEP_CORE',
                temperature: 2,
                humidity: 1.0,
                fertility: 0.3,
                dangerLevel: 5,
                primaryTiles: [TILE.WATER, TILE.DEEP_STONE, TILE.BIOLUMINESCENT],
                secondaryTiles: [TILE.PRESSURE_CRYSTAL, TILE.DEEP_CORAL],
                rareTiles: [TILE.ABYSSAL_PEARL, TILE.DEEP_TREASURE],
                skyColor: ['#000080', '#191970'],
                ambientSound: 'deep_ocean',
                weatherPatterns: ['pressure_wave', 'deep_current', 'bioluminescence'],
                animals: ['anglerfish', 'giant_squid', 'deep_whale', 'pressure_crab'],
                plantLife: ['deep_kelp', 'bioluminescent_coral', 'pressure_plant'],
                resources: ['deep_pearls', 'pressure_crystals', 'rare_fish']
            }
        };
    }

    initializeAnimalDistribution() {
        // Distribution intelligente des animaux selon les biomes et assets disponibles
        const animalAssets = [
            'animal_albatross', 'animal_alligator', 'animal_alpaca', 'animal_anaconda',
            'animal_angelfish', 'animal_ant', 'animal_anteater', 'animal_antelope',
            'animal_armadillo', 'animal_axolotl', 'animal_baboon', 'animal_badger',
            'animal_bat', 'animal_beaver', 'animal_bee', 'animal_beetle',
            'animal_beluga', 'animal_bison', 'animal_blackbird', 'animal_blue_whale',
            'animal_boa', 'animal_boar', 'animal_brown_bear', 'animal_buffalo',
            'animal_bull', 'animal_bumblebee', 'animal_butterfly', 'animal_butterflyfish',
            'animal_buzzard', 'animal_caiman', 'animal_camel', 'animal_canary',
            'animal_carp', 'animal_cassowary', 'animal_cat', 'animal_catfish',
            'animal_chameleon', 'animal_cheetah', 'animal_chicken', 'animal_chimpanzee',
            'animal_cicada', 'animal_clownfish', 'animal_cobra', 'animal_cockatoo',
            'animal_cockchafer', 'animal_condor', 'animal_coral', 'animal_cow',
            'animal_coyote', 'animal_crabe', 'animal_crane', 'animal_crevette',
            'animal_cricket', 'animal_crocodile', 'animal_crow', 'animal_cuttlefish',
            'animal_damselfly', 'animal_deer', 'animal_dog', 'animal_dolphin',
            'animal_donkey', 'animal_dove', 'animal_dragonfly', 'animal_dromedary',
            'animal_duck', 'animal_dugong', 'animal_eagle', 'animal_earthworm',
            'animal_echidna', 'animal_eel', 'animal_elephant', 'animal_emu',
            'animal_ermine', 'animal_falcon', 'animal_finch', 'animal_firebug',
            'animal_flamingo', 'animal_fly', 'animal_fox', 'animal_frog',
            'animal_gazelle', 'animal_gecko', 'animal_gerbil', 'animal_gharial',
            'animal_giraffe', 'animal_goat', 'animal_goose', 'animal_gorilla',
            'animal_grasshopper', 'animal_great_white_shark', 'animal_grizzly', 'animal_grouper',
            'animal_guinea_pig', 'animal_gull', 'animal_hammerhead_shark', 'animal_hamster',
            'animal_hare', 'animal_hedgehog', 'animal_hermit_crab', 'animal_heron',
            'animal_hippopotamus', 'animal_hornet', 'animal_horse', 'animal_horsefly',
            'animal_hummingbird', 'animal_hyena', 'animal_iguana', 'animal_jackal',
            'animal_jaguar', 'animal_jay', 'animal_jellyfish', 'animal_kangaroo',
            'animal_kingfisher', 'animal_kiwi_bird', 'animal_koala', 'animal_ladybug',
            'animal_leopard', 'animal_lion', 'animal_lizard', 'animal_llama',
            'animal_lobster', 'animal_locust', 'animal_lynx', 'animal_macaw',
            'animal_magpie', 'animal_manatee', 'animal_marmot', 'animal_millipede',
            'animal_mole', 'animal_monitor_lizard', 'animal_monkey', 'animal_moose',
            'animal_moray_eel', 'animal_mosquito', 'animal_moth', 'animal_mouse',
            'animal_narwhal', 'animal_nautilus', 'animal_newt', 'animal_otter',
            'animal_owl', 'animal_panda', 'animal_panther', 'animal_parakeet',
            'animal_pigeon', 'animal_pike', 'animal_platypus', 'animal_polar_bear',
            'animal_polecat', 'animal_porcupine', 'animal_praying_mantis', 'animal_pufferfish',
            'animal_puma', 'animal_python', 'animal_quail', 'animal_rabbit'
        ];

        return {
            PARADISE_MEADOW: {
                common: ['animal_rabbit', 'animal_deer', 'animal_butterfly', 'animal_bee', 'animal_dove'],
                uncommon: ['animal_sheep', 'animal_horse', 'animal_cow'],
                rare: ['animal_unicorn', 'animal_pegasus'],
                legendary: ['animal_phoenix']
            },
            CRYSTAL_CAVES: {
                common: ['animal_bat', 'animal_spider', 'animal_glow_worm'],
                uncommon: ['animal_crystal_golem', 'animal_gem_beetle'],
                rare: ['animal_crystal_dragon'],
                legendary: ['animal_diamond_spirit']
            },
            FLOATING_ISLANDS: {
                common: ['animal_eagle', 'animal_falcon', 'animal_albatross'],
                uncommon: ['animal_condor', 'animal_buzzard'],
                rare: ['animal_cloud_sheep', 'animal_wind_sprite'],
                legendary: ['animal_sky_whale']
            },
            TEMPERATE_FOREST: {
                common: ['animal_deer', 'animal_rabbit', 'animal_squirrel', 'animal_owl'],
                uncommon: ['animal_bear', 'animal_wolf', 'animal_fox'],
                rare: ['animal_elk', 'animal_lynx'],
                legendary: ['animal_forest_guardian']
            },
            TROPICAL_JUNGLE: {
                common: ['animal_monkey', 'animal_parrot', 'animal_frog', 'animal_butterfly'],
                uncommon: ['animal_jaguar', 'animal_snake', 'animal_toucan'],
                rare: ['animal_gorilla', 'animal_chimpanzee'],
                legendary: ['animal_jungle_spirit']
            },
            ARID_DESERT: {
                common: ['animal_camel', 'animal_lizard', 'animal_scorpion'],
                uncommon: ['animal_vulture', 'animal_fennec_fox'],
                rare: ['animal_desert_cat', 'animal_sand_worm'],
                legendary: ['animal_desert_phoenix']
            },
            FROZEN_TUNDRA: {
                common: ['animal_polar_bear', 'animal_seal', 'animal_penguin'],
                uncommon: ['animal_arctic_fox', 'animal_walrus'],
                rare: ['animal_snow_leopard', 'animal_mammoth'],
                legendary: ['animal_ice_dragon']
            },
            VOLCANIC_WASTELAND: {
                common: ['animal_fire_salamander', 'animal_lava_lizard'],
                uncommon: ['animal_fire_bird', 'animal_magma_crab'],
                rare: ['animal_fire_elemental'],
                legendary: ['animal_phoenix', 'animal_fire_dragon']
            },
            DEEP_CAVERNS: {
                common: ['animal_bat', 'animal_cave_spider', 'animal_mole'],
                uncommon: ['animal_blind_fish', 'animal_cave_bear'],
                rare: ['animal_crystal_bat', 'animal_underground_worm'],
                legendary: ['animal_cave_dragon']
            },
            CRYSTAL_CORE: {
                common: ['animal_crystal_golem', 'animal_energy_wisp'],
                uncommon: ['animal_gem_beetle', 'animal_crystal_spider'],
                rare: ['animal_living_crystal'],
                legendary: ['animal_crystal_phoenix']
            },
            INFERNAL_DEPTHS: {
                common: ['animal_demon', 'animal_hellhound', 'animal_fire_imp'],
                uncommon: ['animal_lava_worm', 'animal_hell_bat'],
                rare: ['animal_demon_lord', 'animal_hell_dragon'],
                legendary: ['animal_satan', 'animal_infernal_phoenix']
            },
            CORAL_REEF: {
                common: ['animal_fish', 'animal_crab', 'animal_sea_turtle'],
                uncommon: ['animal_dolphin', 'animal_octopus', 'animal_shark'],
                rare: ['animal_whale', 'animal_manta_ray'],
                legendary: ['animal_sea_dragon', 'animal_kraken']
            },
            ABYSSAL_DEPTHS: {
                common: ['animal_anglerfish', 'animal_deep_fish'],
                uncommon: ['animal_giant_squid', 'animal_pressure_crab'],
                rare: ['animal_deep_whale', 'animal_abyssal_horror'],
                legendary: ['animal_leviathan', 'animal_deep_god']
            }
        };
    }

    // === DÉTECTION ET CLASSIFICATION DE BIOMES ===
    
    getBiomeAt(game, x, y) {
        const tileX = Math.floor(x / this.config.tileSize);
        const tileY = Math.floor(y / this.config.tileSize);
        const worldHeight = game.tileMap.length;
        
        // Déterminer la couche verticale
        const relativeY = tileY / worldHeight;
        let layer = 'SURFACE';
        
        if (relativeY < 0.05) layer = 'SPACE';
        else if (relativeY < 0.20) layer = 'PARADISE';
        else if (relativeY < 0.35) layer = 'SKY';
        else if (relativeY < 0.55) layer = 'SURFACE';
        else if (relativeY < 0.75) layer = 'UNDERGROUND';
        else if (relativeY < 0.90) layer = 'DEEP_CORE';
        else layer = 'HELL';
        
        // Analyser les tiles environnantes
        const localTiles = this.analyzeSurroundingTiles(game, tileX, tileY);
        
        // Déterminer le biome selon la couche et les tiles
        return this.classifyBiome(layer, localTiles, tileX, tileY);
    }

    analyzeSurroundingTiles(game, centerX, centerY) {
        const analysis = {
            dominant: new Map(),
            total: 0,
            water: 0,
            solid: 0,
            organic: 0,
            mineral: 0,
            magical: 0
        };
        
        const radius = 5;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const tile = game.tileMap[centerY + dy]?.[centerX + dx];
                if (tile !== undefined) {
                    analysis.total++;
                    analysis.dominant.set(tile, (analysis.dominant.get(tile) || 0) + 1);
                    
                    // Catégoriser les tiles
                    if (tile === TILE.WATER || tile === TILE.LAVA) analysis.water++;
                    else if (tile > TILE.AIR) analysis.solid++;
                    
                    if ([TILE.GRASS, TILE.DIRT, TILE.OAK_WOOD, TILE.OAK_LEAVES, TILE.SNOW, TILE.ICE, TILE.CACTUS, TILE.PINE_WOOD, TILE.PINE_LEAVES, TILE.SEAWEED].includes(tile)) {
                        analysis.organic++;
                    }
                    if ([TILE.STONE, TILE.IRON, TILE.GOLD, TILE.DIAMOND, TILE.GRANITE, TILE.DIORITE, TILE.ANDESITE, TILE.SAND, TILE.SANDSTONE, TILE.CLAY, TILE.COAL, TILE.COPPER, TILE.SILVER, TILE.PLATINUM, TILE.EMERALD, TILE.RUBY, TILE.SAPPHIRE, TILE.TOPAZ, TILE.GARNET, TILE.JADE, TILE.OPAL, TILE.MARBLE, TILE.LIMESTONE, TILE.BASALT, TILE.SLATE, TILE.QUARTZ, TILE.FLUORITE, TILE.MALACHITE, TILE.HEMATITE, TILE.PYRITE, TILE.DEEP_STONE, TILE.PRESSURE_CRYSTAL].includes(tile)) {
                        analysis.mineral++;
                    }
                    if ([TILE.CRYSTAL, TILE.AMETHYST, TILE.GLOW_MUSHROOM, TILE.HEAVENLY_STONE, TILE.MOON_ROCK, TILE.BIOLUMINESCENT, TILE.CORAL, TILE.PEARL, TILE.RARE_PEARL, TILE.ABYSSAL_PEARL, TILE.TREASURE_CHEST, TILE.DEEP_TREASURE, TILE.HELLFIRE_CRYSTAL, TILE.DEMON_GOLD].includes(tile)) {
                        analysis.magical++;
                    }
                }
            }
        }
        
        return analysis;
    }

    classifyBiome(layer, tileAnalysis, x, y) {
        const dominantTile = [...tileAnalysis.dominant.entries()]
            .sort((a, b) => b[1] - a[1])[0]?.[0];
        
        // Classification selon la couche et les tiles dominantes
        switch (layer) {
            case 'PARADISE':
                if (tileAnalysis.magical > tileAnalysis.total * 0.3) return 'CRYSTAL_CAVES';
                return 'PARADISE_MEADOW';
                
            case 'SKY':
                return 'FLOATING_ISLANDS';
                
            case 'SURFACE':
                if (dominantTile === TILE.SAND) return 'ARID_DESERT';
                if (dominantTile === TILE.SNOW) return 'FROZEN_TUNDRA';
                if (dominantTile === TILE.WATER) return 'CORAL_REEF';
                if (dominantTile === TILE.LAVA) return 'VOLCANIC_WASTELAND';
                if (tileAnalysis.organic > tileAnalysis.total * 0.6) {
                    // Déterminer entre forêt tempérée et jungle
                    const temperature = this.getTemperatureAt(x, y);
                    return temperature > 25 ? 'TROPICAL_JUNGLE' : 'TEMPERATE_FOREST';
                }
                return 'TEMPERATE_FOREST';
                
            case 'UNDERGROUND':
                return 'DEEP_CAVERNS';
                
            case 'DEEP_CORE':
                if (dominantTile === TILE.WATER) return 'ABYSSAL_DEPTHS';
                if (tileAnalysis.magical > tileAnalysis.total * 0.4) return 'CRYSTAL_CORE';
                return 'DEEP_CAVERNS';
                
            case 'HELL':
                return 'INFERNAL_DEPTHS';
                
            default:
                return 'TEMPERATE_FOREST';
        }
    }

    getTemperatureAt(x, y) {
        // Température basée sur la position et le bruit de Perlin
        const latitudeEffect = Math.abs(y - this.config.worldHeight / 2) / (this.config.worldHeight / 2);
        const noiseEffect = Perlin.get(x * 0.01, y * 0.01) * 10;
        const baseTemp = 20 - (latitudeEffect * 30) + noiseEffect;
        
        return baseTemp;
    }

    // === GÉNÉRATION D'ANIMAUX INTELLIGENTE ===
    
    spawnAnimalsInBiome(game, biome, x, y, count = 1) {
        const biomeData = this.biomes[biome];
        const animalDistrib = this.animalDistribution[biome];
        
        if (!biomeData || !animalDistrib) return [];
        
        const spawnedAnimals = [];
        
        for (let i = 0; i < count; i++) {
            const rarity = this.determineAnimalRarity();
            const animalPool = animalDistrib[rarity] || animalDistrib.common;
            
            if (animalPool && animalPool.length > 0) {
                const animalType = animalPool[Math.floor(Math.random() * animalPool.length)];
                const animal = this.createIntelligentAnimal(animalType, x, y, biome);
                spawnedAnimals.push(animal);
            }
        }
        
        return spawnedAnimals;
    }

    determineAnimalRarity() {
        const rand = Math.random();
        if (rand < 0.01) return 'legendary';    // 1%
        if (rand < 0.05) return 'rare';         // 4%
        if (rand < 0.20) return 'uncommon';     // 15%
        return 'common';                        // 80%
    }

    createIntelligentAnimal(animalType, x, y, biome) {
        const biomeData = this.biomes[biome];
        
        return {
            type: animalType,
            x: x,
            y: y,
            w: 24,
            h: 24,
            vx: 0,
            vy: 0,
            health: 100,
            maxHealth: 100,
            biome: biome,
            
            // Comportements intelligents
            behavior: {
                territorial: Math.random() < 0.3,
                social: Math.random() < 0.6,
                nocturnal: Math.random() < 0.2,
                migratory: Math.random() < 0.1,
                predator: this.isPredator(animalType),
                prey: this.isPrey(animalType)
            },
            
            // Adaptations au biome
            adaptations: {
                temperature: biomeData.temperature,
                humidity: biomeData.humidity,
                dangerLevel: biomeData.dangerLevel,
                preferredTiles: biomeData.primaryTiles,
                avoidedTiles: this.getAvoidedTiles(biome)
            },
            
            // IA avancée
            ai: {
                state: 'idle',
                stateTimer: 0,
                targetX: x,
                targetY: y,
                fearLevel: 0,
                hungerLevel: 50,
                socialNeed: Math.random() * 100,
                territoryCenter: { x, y },
                territoryRadius: 50 + Math.random() * 100
            },
            
            // Statistiques
            stats: {
                speed: this.getAnimalSpeed(animalType),
                strength: this.getAnimalStrength(animalType),
                intelligence: this.getAnimalIntelligence(animalType),
                stealth: this.getAnimalStealth(animalType),
                endurance: this.getAnimalEndurance(animalType)
            },
            
            // Reproduction
            reproduction: {
                maturityAge: this.getMaturityAge(animalType),
                breedingSeason: this.getBreedingSeason(animalType),
                gestationTime: this.getGestationTime(animalType),
                litterSize: this.getLitterSize(animalType)
            }
        };
    }

    isPredator(animalType) {
        const predators = [
            'animal_lion', 'animal_tiger', 'animal_wolf', 'animal_bear',
            'animal_shark', 'animal_eagle', 'animal_hawk', 'animal_snake',
            'animal_crocodile', 'animal_jaguar', 'animal_leopard'
        ];
        return predators.includes(animalType);
    }

    isPrey(animalType) {
        const prey = [
            'animal_rabbit', 'animal_deer', 'animal_mouse', 'animal_fish',
            'animal_sheep', 'animal_goat', 'animal_chicken', 'animal_duck'
        ];
        return prey.includes(animalType);
    }

    getAvoidedTiles(biome) {
        switch (biome) {
            case 'ARID_DESERT':
                return [TILE.WATER, TILE.SNOW, TILE.ICE];
            case 'FROZEN_TUNDRA':
                return [TILE.LAVA, TILE.SAND, TILE.HELLSTONE];
            case 'CORAL_REEF':
                return [TILE.LAVA, TILE.SAND, TILE.STONE];
            case 'INFERNAL_DEPTHS':
                return [TILE.WATER, TILE.ICE, TILE.SNOW];
            default:
                return [TILE.LAVA, TILE.HELLSTONE];
        }
    }

    getAnimalSpeed(animalType) {
        const speedMap = {
            'animal_cheetah': 10, 'animal_rabbit': 8, 'animal_deer': 7,
            'animal_horse': 9, 'animal_wolf': 6, 'animal_bear': 4,
            'animal_turtle': 1, 'animal_sloth': 0.5
        };
        return speedMap[animalType] || 3;
    }

    getAnimalStrength(animalType) {
        const strengthMap = {
            'animal_elephant': 10, 'animal_bear': 9, 'animal_lion': 8,
            'animal_tiger': 8, 'animal_gorilla': 7, 'animal_wolf': 6,
            'animal_rabbit': 2, 'animal_mouse': 1
        };
        return strengthMap[animalType] || 5;
    }

    getAnimalIntelligence(animalType) {
        const intelligenceMap = {
            'animal_dolphin': 10, 'animal_chimpanzee': 9, 'animal_elephant': 8,
            'animal_crow': 7, 'animal_octopus': 7, 'animal_dog': 6,
            'animal_fish': 2, 'animal_worm': 1
        };
        return intelligenceMap[animalType] || 4;
    }

    getAnimalStealth(animalType) {
        const stealthMap = {
            'animal_cat': 9, 'animal_snake': 8, 'animal_owl': 8,
            'animal_fox': 7, 'animal_mouse': 7, 'animal_elephant': 1,
            'animal_rhinoceros': 1
        };
        return stealthMap[animalType] || 5;
    }

    getAnimalEndurance(animalType) {
        const enduranceMap = {
            'animal_camel': 10, 'animal_horse': 9, 'animal_wolf': 8,
            'animal_deer': 7, 'animal_elephant': 6, 'animal_cheetah': 3,
            'animal_hummingbird': 2
        };
        return enduranceMap[animalType] || 5;
    }

    getMaturityAge(animalType) {
        // En jours de jeu
        const maturityMap = {
            'animal_mouse': 30, 'animal_rabbit': 60, 'animal_cat': 120,
            'animal_dog': 180, 'animal_horse': 365, 'animal_elephant': 1095
        };
        return maturityMap[animalType] || 180;
    }

    getBreedingSeason(animalType) {
        const seasonMap = {
            'animal_deer': 'autumn', 'animal_rabbit': 'spring',
            'animal_bear': 'summer', 'animal_bird': 'spring'
        };
        return seasonMap[animalType] || 'spring';
    }

    getGestationTime(animalType) {
        // En jours de jeu
        const gestationMap = {
            'animal_mouse': 20, 'animal_rabbit': 30, 'animal_cat': 65,
            'animal_dog': 63, 'animal_horse': 340, 'animal_elephant': 660
        };
        return gestationMap[animalType] || 90;
    }

    getLitterSize(animalType) {
        const litterMap = {
            'animal_mouse': [4, 8], 'animal_rabbit': [3, 6], 'animal_cat': [2, 5],
            'animal_dog': [3, 8], 'animal_horse': [1, 1], 'animal_elephant': [1, 1]
        };
        const range = litterMap[animalType] || [1, 3];
        return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    }

    // === EFFETS DE BIOMES SUR LE JOUEUR ===
    
    applyBiomeEffects(game, player, biome) {
        const biomeData = this.biomes[biome];
        if (!biomeData) return;

        // Effets de température
        if (biomeData.temperature > 35) {
            player.stats?.addEffect('heat_exhaustion', 5000, { speed: -2, health: -0.1 });
        } else if (biomeData.temperature < 0) {
            player.stats?.addEffect('hypothermia', 5000, { speed: -1, health: -0.05 });
        }

        // Effets d'humidité
        if (biomeData.humidity > 0.8) {
            player.stats?.addEffect('high_humidity', 3000, { endurance: -1 });
        } else if (biomeData.humidity < 0.2) {
            player.stats?.addEffect('dehydration', 8000, { health: -0.2 });
        }

        // Effets de danger
        if (biomeData.dangerLevel > 3) {
            player.stats?.addEffect('danger_stress', 2000, { luck: -2 });
        }

        // Effets spéciaux par biome
        this.applySpecialBiomeEffects(game, player, biome, biomeData);
    }

    applySpecialBiomeEffects(game, player, biome, biomeData) {
        switch (biome) {
            case 'PARADISE_MEADOW':
                player.stats?.addEffect('paradise_blessing', 10000, {
                    health: 1, luck: 5, speed: 1
                });
                break;

            case 'CRYSTAL_CAVES':
                player.stats?.addEffect('crystal_resonance', 15000, {
                    mining: 3, magic: 2
                });
                break;

            case 'VOLCANIC_WASTELAND':
                player.stats?.addEffect('volcanic_heat', 5000, {
                    health: -2, fire_resistance: 3
                });
                break;

            case 'INFERNAL_DEPTHS':
                player.stats?.addEffect('hellish_corruption', 3000, {
                    health: -5, strength: 2, fear: 10
                });
                break;

            case 'CORAL_REEF':
                if (player.inWater) {
                    player.stats?.addEffect('underwater_breathing', 30000, {
                        oxygen: 100, swimming_speed: 3
                    });
                }
                break;

            case 'FROZEN_TUNDRA':
                player.stats?.addEffect('arctic_adaptation', 20000, {
                    cold_resistance: 5, ice_walking: true
                });
                break;
        }
    }

    // === TRANSITIONS DE BIOMES ===
    
    createBiomeTransition(game, fromBiome, toBiome, x, y, width, height) {
        const transitionId = `${fromBiome}_to_${toBiome}_${x}_${y}`;
        
        const transition = {
            id: transitionId,
            from: fromBiome,
            to: toBiome,
            x, y, width, height,
            blendFactor: 0.5,
            transitionTiles: this.generateTransitionTiles(fromBiome, toBiome),
            effects: this.generateTransitionEffects(fromBiome, toBiome)
        };

        this.transitionZones.set(transitionId, transition);
        return transition;
    }

    generateTransitionTiles(fromBiome, toBiome) {
        const fromTiles = this.biomes[fromBiome]?.primaryTiles || [];
        const toTiles = this.biomes[toBiome]?.primaryTiles || [];
        
        // Mélanger les tiles des deux biomes
        return [...fromTiles, ...toTiles];
    }

    generateTransitionEffects(fromBiome, toBiome) {
        return {
            particles: this.getTransitionParticles(fromBiome, toBiome),
            sounds: this.getTransitionSounds(fromBiome, toBiome),
            weather: this.getTransitionWeather(fromBiome, toBiome)
        };
    }

    getTransitionParticles(fromBiome, toBiome) {
        const particleMap = {
            'PARADISE_MEADOW_to_CRYSTAL_CAVES': 'sparkles',
            'TEMPERATE_FOREST_to_ARID_DESERT': 'dust',
            'CORAL_REEF_to_ABYSSAL_DEPTHS': 'bubbles',
            'SURFACE_to_INFERNAL_DEPTHS': 'smoke'
        };
        
        const key = `${fromBiome}_to_${toBiome}`;
        return particleMap[key] || 'generic_transition';
    }

    getTransitionSounds(fromBiome, toBiome) {
        return ['wind_change', 'ambient_shift', 'biome_transition'];
    }

    getTransitionWeather(fromBiome, toBiome) {
        return 'transition_mist';
    }

    // === MISE À JOUR DU SYSTÈME ===
    
    update(game, delta) {
        this.updateBiomeEffects(game, delta);
        this.updateSeasonalChanges(game, delta);
        this.updateEcosystemBalance(game, delta);
        this.updateTransitionZones(game, delta);
    }

    updateBiomeEffects(game, delta) {
        if (!game.player) return;

        const currentBiome = this.getBiomeAt(game, game.player.x, game.player.y);
        this.applyBiomeEffects(game, game.player, currentBiome);
    }

    updateSeasonalChanges(game, delta) {
        if (!game.timeSystem) return;

        const season = game.timeSystem.getSeason?.() || 'spring';
        
        // Appliquer les changements saisonniers aux biomes
        Object.keys(this.biomes).forEach(biomeKey => {
            const biome = this.biomes[biomeKey];
            this.applySeasonalEffects(biome, season);
        });
    }

    applySeasonalEffects(biome, season) {
        const seasonalModifiers = {
            spring: { fertility: 1.2, temperature: 0, animalActivity: 1.3 },
            summer: { fertility: 1.0, temperature: 5, animalActivity: 1.0 },
            autumn: { fertility: 0.8, temperature: -2, animalActivity: 1.1 },
            winter: { fertility: 0.5, temperature: -8, animalActivity: 0.7 }
        };

        const modifier = seasonalModifiers[season];
        if (modifier) {
            biome.currentFertility = biome.fertility * modifier.fertility;
            biome.currentTemperature = biome.temperature + modifier.temperature;
            biome.currentAnimalActivity = modifier.animalActivity;
        }
    }

    updateEcosystemBalance(game, delta) {
        // Maintenir l'équilibre écologique entre les biomes
        this.balancePredatorPreyRelations(game);
        this.manageResourceRegeneration(game);
        this.handleMigrations(game);
    }

    balancePredatorPreyRelations(game) {
        if (!game.animals) return;

        const predators = game.animals.filter(a => a.behavior?.predator);
        const prey = game.animals.filter(a => a.behavior?.prey);

        // Si trop de prédateurs, réduire leur nombre
        if (predators.length > prey.length * 0.3) {
            const excess = predators.length - Math.floor(prey.length * 0.3);
            for (let i = 0; i < excess; i++) {
                const predator = predators[Math.floor(Math.random() * predators.length)];
                predator.health = 0; // Mortalité naturelle
            }
        }

        // Si pas assez de proies, en faire spawner
        if (prey.length < predators.length * 2) {
            this.spawnMorePrey(game);
        }
    }

    spawnMorePrey(game) {
        const spawnCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < spawnCount; i++) {
            const x = game.player.x + (Math.random() - 0.5) * 500;
            const y = game.player.y + (Math.random() - 0.5) * 300;
            const biome = this.getBiomeAt(game, x, y);
            
            const preyAnimals = this.spawnAnimalsInBiome(game, biome, x, y, 1)
                .filter(a => a.behavior?.prey);
            
            if (preyAnimals.length > 0) {
                game.animals.push(...preyAnimals);
            }
        }
    }

    manageResourceRegeneration(game) {
        // Régénération des ressources selon la fertilité des biomes
        if (Math.random() < 0.01) { // 1% de chance par frame
            this.regenerateResources(game);
        }
    }

    regenerateResources(game) {
        const x = Math.floor(Math.random() * (game.tileMap[0]?.length || 100));
        const y = Math.floor(Math.random() * game.tileMap.length);
        const biome = this.getBiomeAt(game, x * this.config.tileSize, y * this.config.tileSize);
        const biomeData = this.biomes[biome];

        if (biomeData && biomeData.currentFertility > 0.5) {
            // Faire pousser de la végétation
            if (game.tileMap[y]?.[x] === TILE.DIRT && Math.random() < biomeData.currentFertility) {
                game.tileMap[y][x] = TILE.GRASS;
            }
            
            // Faire pousser des arbres
            if (game.tileMap[y]?.[x] === TILE.GRASS && Math.random() < biomeData.currentFertility * 0.1) {
                this.growTree(game, x, y, biome);
            }
        }
    }

    growTree(game, x, y, biome) {
        const biomeData = this.biomes[biome];
        const treeTypes = biomeData.plantLife || ['oak_tree'];
        const treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
        
        // Déterminer le type de bois et de feuilles selon le biome
        let woodType = TILE.OAK_WOOD;
        let leafType = TILE.OAK_LEAVES;
        
        switch (biome) {
            case 'FROZEN_TUNDRA':
                woodType = TILE.PINE_WOOD;
                leafType = TILE.PINE_LEAVES;
                break;
            case 'ARID_DESERT':
                woodType = TILE.CACTUS;
                leafType = TILE.AIR; // Les cactus n'ont pas de feuilles
                break;
            case 'TROPICAL_JUNGLE':
                woodType = TILE.OAK_WOOD;
                leafType = TILE.OAK_LEAVES;
                break;
            default:
                // Utiliser les valeurs par défaut
                break;
        }
        
        // Générer un arbre simple
        const treeHeight = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < treeHeight; i++) {
            if (game.tileMap[y - 1 - i]?.[x] === TILE.AIR) {
                game.tileMap[y - 1 - i][x] = woodType;
            }
        }
        
        // Ajouter des feuilles (sauf pour les cactus)
        if (leafType !== TILE.AIR) {
            const leafY = y - treeHeight;
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (Math.hypot(dx, dy) <= 2 && game.tileMap[leafY + dy]?.[x + dx] === TILE.AIR) {
                        game.tileMap[leafY + dy][x + dx] = leafType;
                    }
                }
            }
        }
    }

    handleMigrations(game) {
        if (!game.animals) return;

        game.animals.forEach(animal => {
            if (animal.behavior?.migratory && Math.random() < 0.001) {
                this.triggerAnimalMigration(animal, game);
            }
        });
    }

    triggerAnimalMigration(animal, game) {
        const currentBiome = this.getBiomeAt(game, animal.x, animal.y);
        const availableBiomes = Object.keys(this.biomes).filter(b => b !== currentBiome);
        const targetBiome = availableBiomes[Math.floor(Math.random() * availableBiomes.length)];
        
        // Trouver une position dans le biome cible
        const migrationDistance = 300 + Math.random() * 500;
        const angle = Math.random() * Math.PI * 2;
        
        animal.migrationTarget = {
            x: animal.x + Math.cos(angle) * migrationDistance,
            y: animal.y + Math.sin(angle) * migrationDistance,
            biome: targetBiome
        };
        
        animal.ai.state = 'migrating';
    }

    updateTransitionZones(game, delta) {
        this.transitionZones.forEach(transition => {
            // Créer des effets visuels dans les zones de transition
            if (Math.random() < 0.1) {
                const x = transition.x + Math.random() * transition.width;
                const y = transition.y + Math.random() * transition.height;
                
                game.createParticles(x, y, 3, this.getTransitionParticleColor(transition.effects.particles));
            }
        });
    }

    getTransitionParticleColor(particleType) {
        const colorMap = {
            'sparkles': '#FFD700',
            'dust': '#D2B48C',
            'bubbles': '#87CEEB',
            'smoke': '#696969',
            'generic_transition': '#FFFFFF'
        };
        return colorMap[particleType] || '#FFFFFF';
    }

    // === MÉTHODES UTILITAIRES ===
    
    getBiomeData(biome) {
        return this.biomes[biome];
    }

    getAllBiomes() {
        return Object.keys(this.biomes);
    }

    getBiomesByLayer(layer) {
        return Object.entries(this.biomes)
            .filter(([_, data]) => data.layer === layer)
            .map(([name, _]) => name);
    }

    getCompatibleAnimals(biome) {
        return this.animalDistribution[biome] || { common: [], uncommon: [], rare: [], legendary: [] };
    }
}

export { AdvancedBiomeSystem };