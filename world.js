import { SeededRandom } from './seededRandom.js';
import { Perlin } from './perlin.js';
import { Slime, Frog, Golem } from './enemy.js';
import { PNJ } from './PNJ.js';
import { generatePNJ } from './generateurPNJ.js';
import { SeedMap } from './seedMap.js';

// --- LISTE DE BLOCS ---
export const TILE = {
    AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5, COAL: 6, IRON: 7,
    BEDROCK: 8, WATER: 9, CRYSTAL: 10, GLOW_MUSHROOM: 11, CLOUD: 12, HELLSTONE: 13, LAVA: 14,
    SAND: 15, OAK_WOOD: 16, OAK_LEAVES: 17, FLOWER_RED: 18, FLOWER_YELLOW: 19,
    GOLD: 20, DIAMOND: 21, LAPIS: 22, GRANITE: 23, DIORITE: 24, ANDESITE: 25,
    HEAVENLY_STONE: 26, MOON_ROCK: 27,
    SOUL_SAND: 28, SCORCHED_STONE: 29, OBSIDIAN: 30,
    AMETHYST: 31, COPPER: 32, SILVER: 33, PLATINUM: 34, EMERALD: 35, RUBY: 36,
    SAPPHIRE: 37, TOPAZ: 38, GARNET: 39, JADE: 40, OPAL: 41,
    MARBLE: 42, LIMESTONE: 43, SANDSTONE: 44, BASALT: 45, SLATE: 46,
    QUARTZ: 47, FLUORITE: 48, MALACHITE: 49, HEMATITE: 50, PYRITE: 51,
    SNOW: 52, ICE: 53, CACTUS: 54, PINE_WOOD: 55, PINE_LEAVES: 56,
    CORAL: 57, SEAWEED: 58, PEARL: 59, TREASURE_CHEST: 60, RARE_PEARL: 61,
    DEEP_STONE: 62, BIOLUMINESCENT: 63, PRESSURE_CRYSTAL: 64, DEEP_CORAL: 65, ABYSSAL_PEARL: 66, DEEP_TREASURE: 67,
    HELLFIRE_CRYSTAL: 68, DEMON_GOLD: 69, GRAVEL: 70,
    
    // === TUILES RPG AVANCÉES ===
    // Paradis
    DIVINE_STONE: 71, BLESSED_EARTH: 72, CELESTIAL_CRYSTAL: 73, HOLY_WATER: 74, ANGEL_FEATHER: 75,
    DIVINE_GOLD: 76, PARADISE_FLOWER: 77, LIGHT_CRYSTAL: 78, SACRED_TREE: 79, HEAVENLY_CLOUD: 80,
    
    // Forêt Enchantée
    ENCHANTED_WOOD: 81, MAGIC_LEAVES: 82, FAIRY_DUST: 83, MOONSTONE: 84, ELVEN_CRYSTAL: 85,
    MYSTIC_FLOWER: 86, ANCIENT_ROOT: 87, SPIRIT_MOSS: 88, ENCHANTED_VINE: 89, DRUID_STONE: 90,
    
    // Cristaux
    CRYSTAL_FORMATION: 91, PURE_CRYSTAL: 92, RESONANT_CRYSTAL: 93, POWER_CRYSTAL: 94, VOID_CRYSTAL: 95,
    CRYSTAL_CLUSTER: 96, PRISMATIC_CRYSTAL: 97, ENERGY_CRYSTAL: 98, TIME_CRYSTAL: 99, SPACE_CRYSTAL: 100,
    
    // Enfer
    INFERNAL_STONE: 101, LAVA_ROCK: 102, BRIMSTONE: 103, DEMON_CRYSTAL: 104, HELLFIRE: 105,
    MOLTEN_GOLD: 106, DEVIL_HORN: 107, SULFUR: 108, MAGMA_CRYSTAL: 109, INFERNAL_IRON: 110,
    
    // Abysse
    VOID_STONE: 111, SHADOW_CRYSTAL: 112, DARK_MATTER: 113, ABYSSAL_STONE: 114, NIGHTMARE_CRYSTAL: 115,
    VOID_ESSENCE: 116, SHADOW_ORE: 117, DARK_ENERGY: 118, CHAOS_CRYSTAL: 119, ETERNAL_DARKNESS: 120
};

const seedMap = new SeedMap();

function generateColumns(game, config, startX, width) {
    const worldHeightInTiles = game.tileMap.length;
    const { tileSize } = config;

    // Définition des couches du monde (du paradis à l'enfer)
    const skyLevel = Math.floor(worldHeightInTiles * 0.05);        // Ciel/Paradis (5%)
    const cloudLevel = Math.floor(worldHeightInTiles * 0.15);      // Nuages (15%)
    const surfaceLevel = Math.floor(worldHeightInTiles * 0.35);    // Surface (35%)
    const undergroundLevel = Math.floor(worldHeightInTiles * 0.55); // Souterrain (55%)
    const deepLevel = Math.floor(worldHeightInTiles * 0.75);       // Profondeurs (75%)
    const hellLevel = Math.floor(worldHeightInTiles * 0.90);       // Enfer (90%)

    for (let x = startX; x < startX + width; x++) {
        // === GÉNÉRATION DE TERRAIN ULTRA-COMPLEXE ET VARIÉ ===

        // Seed unique par chunk basé sur la seed globale
        const chunkX = Math.floor(x / (config.chunkSize || 16));
        const worldSeed = seedMap.getSeed(chunkX);
        SeededRandom.setSeed(worldSeed);
        
        // Bruit continental avec variations extrêmes
        const continentalNoise = Perlin.get(x * 0.0008, worldSeed * 0.001) * 300;
        const continentalVariation = Perlin.get(x * 0.0015, worldSeed * 0.002) * 150;
        
        // Système de chaînes de montagnes multi-couches
        const majorMountainNoise = Perlin.get(x * 0.003, worldSeed * 0.1) * 200;
        const mountainRidgeNoise = Perlin.get(x * 0.006, worldSeed * 0.2) * 120;
        const mountainDetailNoise = Perlin.get(x * 0.015, worldSeed * 0.3) * 80;
        const mountainPeakNoise = Perlin.get(x * 0.025, worldSeed * 0.4) * 50;
        
        // Système de collines et vallées complexe
        const majorHillNoise = Perlin.get(x * 0.018, worldSeed * 0.5) * 90;
        const hillNoise = Perlin.get(x * 0.035, worldSeed * 0.6) * 60;
        const valleyNoise = Perlin.get(x * 0.028, worldSeed * 0.7) * 70;
        const deepValleyNoise = Perlin.get(x * 0.012, worldSeed * 0.8) * 100;
        
        // Détails fins multi-fréquences
        const detailNoise = Perlin.get(x * 0.08, worldSeed * 0.9) * 30;
        const microNoise = Perlin.get(x * 0.15, worldSeed * 1.0) * 15;
        const nanoNoise = Perlin.get(x * 0.25, worldSeed * 1.1) * 8;
        
        // Formations géologiques spéciales
        const canyonNoise = Math.abs(Perlin.get(x * 0.007, worldSeed + 500));
        const mesaNoise = Perlin.get(x * 0.004, worldSeed + 1000);
        const plateauNoise = Perlin.get(x * 0.002, worldSeed + 1500);
        const ridgeNoise = Math.abs(Perlin.get(x * 0.02, worldSeed + 2000));
        
        // Combinaison intelligente avec anti-platitude
        let terrainHeight = continentalNoise + continentalVariation;
        terrainHeight += majorMountainNoise + mountainRidgeNoise + mountainDetailNoise + mountainPeakNoise;
        terrainHeight += majorHillNoise + hillNoise;
        terrainHeight -= Math.abs(valleyNoise) * 1.5; // Vallées profondes
        terrainHeight -= Math.abs(deepValleyNoise) * 0.8; // Vallées très profondes
        terrainHeight += detailNoise + microNoise + nanoNoise;
        
        // Formations spéciales dramatiques
        if (canyonNoise < 0.08) {
            terrainHeight -= 150 + SeededRandom.random() * 100; // Canyons très profonds
        }
        
        if (mesaNoise > 0.7) {
            terrainHeight += 120 + SeededRandom.random() * 80; // Mesas élevées
        }
        
        if (plateauNoise > 0.65) {
            terrainHeight += 100 + SeededRandom.random() * 60; // Plateaux variés
        }
        
        if (ridgeNoise < 0.1) {
            terrainHeight += 80 + Math.sin(x * 0.05) * 40; // Crêtes ondulantes
        }
        
        // Anti-platitude : forcer la variation
        const flatnessDetection = Math.abs(Perlin.get(x * 0.001, worldSeed + 3000));
        if (flatnessDetection < 0.3) {
            // Zone potentiellement plate, ajouter de la variation forcée
            const antiFlat = Math.sin(x * 0.03) * 60 + Math.cos(x * 0.07) * 40;
            terrainHeight += antiFlat;
        }
        
        // Terrain final avec seed correction avancée
        let groundY = surfaceLevel + Math.floor(terrainHeight);
        
        // Limites flexibles avec variation
        const minY = skyLevel + 5 + SeededRandom.random() * 20;
        const maxY = worldHeightInTiles - 30 - SeededRandom.random() * 40;
        groundY = Math.max(minY, Math.min(maxY, groundY));
        
        // Correction de seed multi-couches pour éviter TOUTE platitude
        const seedCorrection1 = Math.sin(x * 0.008) * 20;
        const seedCorrection2 = Math.cos(x * 0.015) * 15;
        const seedCorrection3 = Math.sin(x * 0.03) * 10;
        const randomCorrection = (SeededRandom.random() - 0.5) * 25;
        
        groundY += Math.floor(seedCorrection1 + seedCorrection2 + seedCorrection3 + randomCorrection);
        // Ensure the ground level stays within valid world bounds after corrections
        groundY = Math.max(minY, Math.min(maxY, groundY));
        
        // === SYSTÈME DE BIOMES ULTRA-COMPLEXE ET VARIÉ ===

        // Facteurs climatiques avancés avec seed variation
        const temperatureNoise = Perlin.get(x * 0.008, worldSeed * 0.01);
        const humidityNoise = Perlin.get(x * 0.011, worldSeed * 0.02);
        const windNoise = Perlin.get(x * 0.015, worldSeed * 0.03);
        const magicNoise = Perlin.get(x * 0.006, worldSeed * 0.04); // Facteur magique pour biomes spéciaux
        
        const elevationFactor = (groundY - surfaceLevel) / 40.0;
        const extremeElevation = Math.abs(elevationFactor) > 1.5;
        
        // Classification climatique complexe
        const temperature = temperatureNoise + elevationFactor * -0.4 + windNoise * 0.2;
        const humidity = humidityNoise + elevationFactor * 0.1 - Math.abs(windNoise) * 0.3;
        const magic = magicNoise + Math.sin(x * 0.001) * 0.3;
        
        // Détection de formations géologiques spéciales
        // canyonNoise is already calculated earlier for terrain generation
        const riverNoise = Math.abs(Perlin.get(x * 0.025, worldSeed + 1000));
        const caveNoise = Perlin.get(x * 0.04, worldSeed + 1500);
        const crystalNoise = Perlin.get(x * 0.03, worldSeed + 2000);
        const volcanicNoise = Perlin.get(x * 0.005, worldSeed + 2500);
        
        // Classification de biomes ultra-variée
        let biome = 'plains';
        
        // Biomes extrêmes d'altitude
        if (extremeElevation && elevationFactor > 2) {
            if (temperature < -0.3) biome = 'frozen_peaks';
            else if (magic > 0.4) biome = 'sky_islands';
            else biome = 'mountain_peaks';
        }
        else if (extremeElevation && elevationFactor < -2) {
            if (humidity > 0.3) biome = 'deep_caverns';
            else if (magic > 0.5) biome = 'crystal_caves';
            else biome = 'underground_lakes';
        }
        // Biomes magiques
        else if (magic > 0.6) {
            if (temperature > 0.2) biome = 'enchanted_forest';
            else if (humidity < -0.2) biome = 'crystal_desert';
            else biome = 'mystic_meadows';
        }
        // Biomes volcaniques
        else if (volcanicNoise > 0.5) {
            if (temperature > 0.4) biome = 'volcanic_wasteland';
            else biome = 'geothermal_springs';
        }
        // Biomes aquatiques
        else if (groundY < surfaceLevel - 15) {
            if (temperature < -0.2) biome = 'frozen_ocean';
            else if (humidity > 0.4) biome = 'coral_reef';
            else biome = 'deep_ocean';
        }
        else if (riverNoise < 0.08 && groundY > surfaceLevel - 20) {
            biome = 'river_valley';
        }
        // Biomes de canyon
        else if (canyonNoise < 0.06) {
            if (temperature > 0.3) biome = 'red_canyon';
            else biome = 'stone_canyon';
        }
        // Biomes climatiques classiques mais variés
        else if (temperature < -0.5) {
            if (humidity > 0.2) biome = 'snowy_forest';
            else biome = 'frozen_tundra';
        }
        else if (temperature < -0.2 && elevationFactor > 0.4) {
            biome = 'snowy_mountains';
        }
        else if (temperature > 0.5 && humidity < -0.3) {
            if (crystalNoise > 0.3) biome = 'crystal_desert';
            else biome = 'arid_desert';
        }
        else if (temperature > 0.3 && humidity > 0.4) {
            if (elevationFactor < -0.5) biome = 'tropical_swamp';
            else biome = 'tropical_jungle';
        }
        else if (humidity > 0.5 && groundY < surfaceLevel + 10) {
            biome = 'marshland';
        }
        else if (elevationFactor > 0.8) {
            if (temperature > 0) biome = 'highland_plateau';
            else biome = 'rocky_mountains';
        }
        else if (humidity < -0.1 && temperature > 0.1) {
            biome = 'dry_savanna';
        }
        else if (caveNoise > 0.4) {
            biome = 'cave_entrance';
        }
        else {
            // Variantes de plaines pour éviter la monotonie
            const plainsVariant = SeededRandom.random();
            if (plainsVariant < 0.2) biome = 'flower_meadows';
            else if (plainsVariant < 0.4) biome = 'rolling_hills';
            else if (plainsVariant < 0.6) biome = 'grasslands';
            else if (plainsVariant < 0.8) biome = 'mixed_forest';
            else biome = 'plains';
        }
        
        // Détection de formations spéciales
        const isRiver = riverNoise < 0.08 && groundY > surfaceLevel - 25;
        const isCanyon = canyonNoise < 0.06 && elevationFactor > 0.3;
        const isCrystalFormation = crystalNoise > 0.6;
        const isVolcanicVent = volcanicNoise > 0.7 && temperature > 0.3;
        
        // === GÉNÉRATION DES COUCHES SELON LE BIOME ===
        for (let y = 0; y < worldHeightInTiles; y++) {
            if (y < skyLevel) {
                // === PARADIS - Structures célestes flottantes ===
                const celestialNoise = Perlin.get(x * 0.03, y * 0.03);
                const floatingIslandNoise = Perlin.get(x * 0.02, y * 0.02);
                
                if (floatingIslandNoise > 0.7) {
                    game.tileMap[y][x] = TILE.CLOUD; // Îles flottantes
                } else if (celestialNoise > 0.6) {
                    game.tileMap[y][x] = TILE.HEAVENLY_STONE; // Cristaux célestes
                } else if (celestialNoise > 0.4) {
                    game.tileMap[y][x] = TILE.CLOUD; // Nuages éthérés
                } else {
                    game.tileMap[y][x] = TILE.AIR;
                }
            } else if (y < cloudLevel) {
                // === COUCHE NUAGEUSE DYNAMIQUE ===
                const cloudDensity = Perlin.get(x * 0.02, y * 0.02);
                const cloudFlow = Perlin.get(x * 0.04, y * 0.01);
                
                if (cloudDensity + cloudFlow * 0.3 > 0.3) {
                    game.tileMap[y][x] = TILE.CLOUD;
                } else {
                    game.tileMap[y][x] = TILE.AIR;
                }
            } else if (y < groundY) {
                // === ATMOSPHÈRE ===
                // Rivières aériennes et formations nuageuses
                if (isRiver && y > groundY - 15) {
                    const riverCloudNoise = Perlin.get(x * 0.1, y * 0.1);
                    if (riverCloudNoise > 0.3) {
                        game.tileMap[y][x] = TILE.CLOUD;
                    } else {
                        game.tileMap[y][x] = TILE.AIR;
                    }
                } else {
                    game.tileMap[y][x] = TILE.AIR;
                }
            } else if (y === groundY) {
                // === SURFACE SELON LE BIOME ===
                switch (biome) {
                    case 'tundra':
                    case 'snowy_mountains':
                        game.tileMap[y][x] = TILE.SNOW;
                        break;
                    case 'desert':
                        game.tileMap[y][x] = TILE.SAND;
                        break;
                    case 'jungle':
                        game.tileMap[y][x] = TILE.GRASS; // Herbe luxuriante
                        break;
                    case 'swamp':
                        game.tileMap[y][x] = TILE.DIRT; // Terre marécageuse
                        break;
                    case 'savanna':
                        const savannaVariation = SeededRandom.random();
                        game.tileMap[y][x] = savannaVariation < 0.7 ? TILE.GRASS : TILE.DIRT;
                        break;
                    case 'ocean':
                        game.tileMap[y][x] = TILE.SAND; // Fond océanique
                        break;
                    case 'mountains':
                        const mountainSurface = SeededRandom.random();
                        if (mountainSurface < 0.3) game.tileMap[y][x] = TILE.STONE;
                        else if (mountainSurface < 0.6) game.tileMap[y][x] = TILE.DIRT;
                        else game.tileMap[y][x] = TILE.GRASS;
                        break;
                    default: // plains
                        game.tileMap[y][x] = TILE.GRASS;
                }
            } else if (y < groundY + getBiomeDepth(biome)) {
                // === COUCHE SUPERFICIELLE SELON LE BIOME ===
                switch (biome) {
                    case 'desert':
                        game.tileMap[y][x] = TILE.SAND;
                        break;
                    case 'swamp':
                        const swampDepth = y - groundY;
                        if (swampDepth < 2) game.tileMap[y][x] = TILE.DIRT;
                        else game.tileMap[y][x] = TILE.STONE;
                        break;
                    case 'tundra':
                        if (y === groundY + 1) game.tileMap[y][x] = TILE.DIRT;
                        else game.tileMap[y][x] = TILE.STONE;
                        break;
                    case 'jungle':
                        if (y < groundY + 3) game.tileMap[y][x] = TILE.DIRT;
                        else game.tileMap[y][x] = TILE.STONE;
                        break;
                    default:
                        if (y < groundY + 4) game.tileMap[y][x] = TILE.DIRT;
                        else game.tileMap[y][x] = TILE.STONE;
                }
            } else if (y < undergroundLevel) {
                // === COUCHE ROCHEUSE AVEC MINERAIS SELON LE BIOME ===
                const oreChance = SeededRandom.random();
                const biomeOreModifier = getBiomeOreModifier(biome);
                
                if (oreChance < 0.005 * biomeOreModifier.copper) {
                    game.tileMap[y][x] = TILE.COPPER;
                } else if (oreChance < 0.01 * biomeOreModifier.coal) {
                    game.tileMap[y][x] = TILE.COAL;
                } else if (oreChance < 0.02 * biomeOreModifier.iron) {
                    game.tileMap[y][x] = TILE.IRON;
                } else {
                    // Variantes de pierre selon le biome
                    const stoneType = getBiomeStoneType(biome);
                    game.tileMap[y][x] = stoneType;
                }
            } else if (y < deepLevel) {
                // === PROFONDEURS AVEC MINERAUX RARES ===
                const deepOreChance = SeededRandom.random();
                if (deepOreChance < 0.002) {
                    game.tileMap[y][x] = TILE.PLATINUM;
                } else if (deepOreChance < 0.005) {
                    game.tileMap[y][x] = TILE.SILVER;
                } else if (deepOreChance < 0.008) {
                    game.tileMap[y][x] = TILE.DIAMOND;
                } else if (deepOreChance < 0.015) {
                    game.tileMap[y][x] = TILE.GOLD;
                } else if (deepOreChance < 0.025) {
                    game.tileMap[y][x] = TILE.LAPIS;
                } else if (deepOreChance < 0.035) {
                    game.tileMap[y][x] = TILE.AMETHYST;
                } else if (deepOreChance < 0.045) {
                    game.tileMap[y][x] = TILE.EMERALD;
                } else if (deepOreChance < 0.055) {
                    game.tileMap[y][x] = TILE.RUBY;
                } else if (deepOreChance < 0.065) {
                    game.tileMap[y][x] = TILE.SAPPHIRE;
                } else {
                    const deepNoise = Perlin.get(x * 0.05, y * 0.05);
                    if (deepNoise > 0.3) {
                        game.tileMap[y][x] = TILE.OBSIDIAN;
                    } else {
                        game.tileMap[y][x] = TILE.STONE;
                    }
                }
            } else if (y < hellLevel) {
                // === COUCHES PRÉ-INFERNALES ===
                const preHellNoise = Perlin.get(x * 0.08, y * 0.08);
                if (preHellNoise > 0.4) {
                    game.tileMap[y][x] = TILE.OBSIDIAN;
                } else if (preHellNoise > 0.1) {
                    game.tileMap[y][x] = TILE.SCORCHED_STONE;
                } else {
                    game.tileMap[y][x] = TILE.STONE;
                }
            } else if (y < worldHeightInTiles - 1) {
                // === ENFER - Paysage infernal complexe ===
                const hellNoise = Perlin.get(x * 0.1, y * 0.1);
                const hellDetail = Perlin.get(x * 0.2, y * 0.2);
                const hellCaves = Perlin.get(x * 0.15, y * 0.15);
                
                if (hellCaves > 0.6) {
                    game.tileMap[y][x] = TILE.AIR; // Cavernes infernales
                } else if (hellNoise > 0.3 && hellDetail > 0.2) {
                    game.tileMap[y][x] = TILE.LAVA;
                } else if (hellNoise > 0.1) {
                    game.tileMap[y][x] = TILE.HELLSTONE;
                } else if (hellNoise > -0.2) {
                    game.tileMap[y][x] = TILE.SOUL_SAND;
                } else {
                    game.tileMap[y][x] = TILE.OBSIDIAN;
                }
            } else {
                // === BEDROCK - Fond indestructible ===
                game.tileMap[y][x] = TILE.BEDROCK;
            }
        }
        
        // === GÉNÉRATION D'EAU ET DE LAVE ===

        // Océans et lacs
        if (biome === 'ocean' || (groundY < surfaceLevel - 5)) {
            const waterMaxY = Math.min(worldHeightInTiles, Math.max(surfaceLevel, groundY + 10));
            const startY = Math.max(0, groundY + 1);
            // Ensure each targeted row exists before accessing it to avoid
            // "Cannot read properties of undefined" errors when the world
            // height hasn't been fully initialised. This can happen during
            // early world generation when additional rows are generated on the
            // fly. If a row is missing we create an empty one so the water can
            // be placed safely.
            for (let y = startY; y < waterMaxY; y++) {
                if (!game.tileMap[y]) {
                    game.tileMap[y] = [];
                }
                if (game.tileMap[y][x] === TILE.AIR || game.tileMap[y][x] === undefined) {
                    game.tileMap[y][x] = TILE.WATER;
                }
            }
        }
        
        // Rivières
        if (isRiver && biome !== 'desert') {
            const riverDepth = 3;
            const startY = Math.max(0, groundY - riverDepth);
            const endY = Math.min(worldHeightInTiles - 1, groundY);
            for (let y = startY; y <= endY; y++) {
                if (!game.tileMap[y]) {
                    game.tileMap[y] = [];
                }
                game.tileMap[y][x] = y === startY ? TILE.WATER : TILE.AIR;
            }
        }
        
        // Canyons
        if (isCanyon) {
            const canyonDepth = 15 + Math.floor(SeededRandom.random() * 10);
            const startY = Math.max(0, groundY - canyonDepth);
            const endY = Math.min(worldHeightInTiles - 1, groundY - 1);
            for (let y = startY; y <= endY; y++) {
                if (!game.tileMap[y]) {
                    game.tileMap[y] = [];
                }
                game.tileMap[y][x] = TILE.AIR;
            }
        }

        // === GÉNÉRATION DE STRUCTURES COMPLEXES ===

        // Arbres selon le biome
        const treeChance = getTreeChance(biome);
        if (SeededRandom.random() < treeChance) {
            generateBiomeTree(game, x, groundY, biome, worldHeightInTiles);
        }
        
        // Végétation et fleurs
        if (SeededRandom.random() < getVegetationChance(biome)) {
            generateVegetation(game, x, groundY, biome);
        }
        
        // Formations rocheuses spéciales
        if (biome === 'mountains' && SeededRandom.random() < 0.08) {
            generateRockFormation(game, x, groundY, worldHeightInTiles);
        }
        
        // Structures de biome spéciales
        if (SeededRandom.random() < 0.005) {
            generateBiomeStructure(game, x, groundY, biome, worldHeightInTiles);
        }
        
        // Génération d'arbres basique (fallback)
        if (SeededRandom.random() < 0.01) {
            for (let y = 10; y < worldHeightInTiles; y++) {
                if (
                    game.tileMap[y]?.[x] === TILE.GRASS &&
                    (game.tileMap[y - 1]?.[x] === TILE.AIR || game.tileMap[y - 1]?.[x] === undefined)
                ) {
                    const treeHeight = 5 + Math.floor(SeededRandom.random() * 5);
                    for (let j = 0; j < treeHeight; j++) {
                        if (y - 1 - j > 0) game.tileMap[y - 1 - j][x] = TILE.OAK_WOOD;
                    }
                    const leafRadius = 3;
                    const leafCenterY = y - treeHeight;
                    for (let ly = -leafRadius; ly <= leafRadius; ly++) {
                        for (let lx = -leafRadius; lx <= leafRadius; lx++) {
                            if (Math.hypot(lx, ly) < leafRadius + 0.5) {
                                const currentX = x + lx;
                                const currentY = leafCenterY + ly;
                                if (game.tileMap[currentY]?.[currentX] === TILE.AIR || game.tileMap[currentY]?.[currentX] === undefined) {
                                    game.tileMap[currentY][currentX] = TILE.OAK_LEAVES;
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }

        // Spawn d'ennemis sur la surface (sera géré par enemySpawner.js)
        if (SeededRandom.random() < 0.01) {
            for (let y = 0; y < worldHeightInTiles; y++) {
                if (game.tileMap[y]?.[x] > TILE.AIR && 
                    game.tileMap[y - 1]?.[x] === TILE.AIR && 
                    game.tileMap[y - 2]?.[x] === TILE.AIR) {
                    // Marquer cette position comme point de spawn potentiel
                    if (!game.spawnPoints) game.spawnPoints = [];
                    game.spawnPoints.push({
                        x: x * tileSize,
                        y: (y - 2) * tileSize,
                        biome: y < surfaceLevel ? 'sky' : y < undergroundLevel ? 'surface' : 'underground'
                    });
                    break;
                }
            }
        }

        if (SeededRandom.random() < 0.005) {
            for (let y = 0; y < worldHeightInTiles; y++) {
                if (game.tileMap[y]?.[x] > TILE.AIR && game.tileMap[y - 1]?.[x] === TILE.AIR) {
                    game.pnjs.push(new PNJ(x * tileSize, (y - 2) * tileSize, game.config, generatePNJ()));
                    break;
                }
            }
        }
    }
}

export function generateLevel(worldWidthInTiles, worldHeightInTiles, seed = null) {
    console.log(`🌍 Génération du monde: ${worldWidthInTiles}x${worldHeightInTiles}`);
    
    // Initialize seeded random
    const worldSeed = seed || Date.now();
    SeededRandom.setSeed(worldSeed);
    Perlin.seed();
    
    // Create the tile map
    const tileMap = [];
    for (let y = 0; y < worldHeightInTiles; y++) {
        tileMap[y] = new Array(worldWidthInTiles).fill(TILE.AIR);
    }
    
    // Create a mock game object for generation
    const mockGame = {
        tileMap: tileMap,
        config: {
            tileSize: 16,
            chunkSize: 16,
            seed: worldSeed
        },
        enemies: [],
        pnjs: [],
        spawnPoints: []
    };
    
    // Generate the world using the existing generation system
    generateColumns(mockGame, mockGame.config, 0, worldWidthInTiles);
    
    console.log(`✅ Monde généré avec succès: ${worldWidthInTiles}x${worldHeightInTiles}`);
    return tileMap;
}

// === FONCTIONS UTILITAIRES POUR LES BIOMES ===

function getBiomeDepth(biome) {
    switch (biome) {
        // Biomes aquatiques
        case 'deep_ocean': return 25;
        case 'frozen_ocean': return 20;
        case 'coral_reef': return 18;
        case 'river_valley': return 8;
        case 'tropical_swamp': return 12;
        case 'marshland': return 10;
        
        // Biomes désertiques
        case 'arid_desert': return 15;
        case 'crystal_desert': return 12;
        case 'dry_savanna': return 8;
        
        // Biomes forestiers
        case 'tropical_jungle': return 10;
        case 'enchanted_forest': return 8;
        case 'snowy_forest': return 6;
        case 'mixed_forest': return 7;
        
        // Biomes montagneux
        case 'rocky_mountains': return 3;
        case 'snowy_mountains': return 4;
        case 'mountain_peaks': return 2;
        case 'frozen_peaks': return 2;
        case 'highland_plateau': return 5;
        
        // Biomes souterrains
        case 'deep_caverns': return 20;
        case 'crystal_caves': return 15;
        case 'underground_lakes': return 18;
        case 'cave_entrance': return 12;
        
        // Biomes spéciaux
        case 'volcanic_wasteland': return 8;
        case 'geothermal_springs': return 10;
        case 'sky_islands': return 3;
        case 'mystic_meadows': return 6;
        case 'red_canyon': return 4;
        case 'stone_canyon': return 5;
        case 'frozen_tundra': return 4;
        
        // Biomes de plaines variées
        case 'flower_meadows': return 6;
        case 'rolling_hills': return 5;
        case 'grasslands': return 5;
        
        // Anciens biomes
        case 'desert': return 12;
        case 'jungle': return 8;
        case 'swamp': return 6;
        case 'tundra': return 4;
        case 'mountains': return 3;
        case 'ocean': return 15;
        
        default: return 5;
    }
}

function getBiomeOreModifier(biome) {
    switch (biome) {
        case 'mountains':
            return { copper: 2.0, coal: 2.0, iron: 1.8 }; // Plus de minerais en montagne
        case 'desert':
            return { copper: 0.5, coal: 0.5, iron: 1.2 }; // Moins de charbon, plus de fer
        case 'jungle':
            return { copper: 1.5, coal: 1.5, iron: 0.8 }; // Plus de charbon organique
        case 'tundra':
            return { copper: 0.3, coal: 0.3, iron: 2.0 }; // Beaucoup de fer, peu de charbon
        default:
            return { copper: 1.0, coal: 1.0, iron: 1.0 };
    }
}

function getBiomeStoneType(biome) {
    const rand = SeededRandom.random();
    switch (biome) {
        case 'mountains':
            if (rand < 0.4) return TILE.GRANITE;
            else if (rand < 0.7) return TILE.DIORITE;
            else return TILE.STONE;
        case 'desert':
            if (rand < 0.6) return TILE.SANDSTONE;
            else if (rand < 0.8) return TILE.GRANITE;
            else return TILE.DIORITE;
        case 'jungle':
            if (rand < 0.8) return TILE.STONE;
            else return TILE.ANDESITE;
        case 'tundra':
            if (rand < 0.5) return TILE.STONE;
            else if (rand < 0.8) return TILE.ANDESITE;
            else return TILE.DIORITE;
        default:
            if (rand < 0.7) return TILE.STONE;
            else if (rand < 0.85) return TILE.GRANITE;
            else return TILE.DIORITE;
    }
}

// === FONCTIONS DE GÉNÉRATION DE STRUCTURES ===

function getTreeChance(biome) {
    switch (biome) {
        case 'jungle': return 0.15;      // Forêt dense
        case 'plains': return 0.08;      // Quelques arbres
        case 'savanna': return 0.04;     // Arbres épars
        case 'swamp': return 0.12;       // Arbres marécageux
        case 'tundra': return 0.02;      // Très peu d'arbres
        case 'mountains': return 0.06;   // Arbres de montagne
        case 'desert': return 0.001;     // Presque pas d'arbres
        case 'snowy_mountains': return 0.03; // Conifères
        default: return 0.05;
    }
}

function getVegetationChance(biome) {
    switch (biome) {
        case 'jungle': return 0.25;
        case 'plains': return 0.15;
        case 'swamp': return 0.20;
        case 'savanna': return 0.10;
        case 'desert': return 0.02;
        case 'tundra': return 0.01;
        default: return 0.08;
    }
}

function generateBiomeTree(game, x, groundY, biome, worldHeight) {
    const tileSize = game.config?.tileSize || 32;
    
    switch (biome) {
        case 'jungle':
            generateJungleTree(game, x, groundY, worldHeight);
            break;
        case 'desert':
            generateCactus(game, x, groundY, worldHeight);
            break;
        case 'swamp':
            generateSwampTree(game, x, groundY, worldHeight);
            break;
        case 'tundra':
        case 'snowy_mountains':
            generatePineTree(game, x, groundY, worldHeight);
            break;
        case 'savanna':
            generateAcaciaTree(game, x, groundY, worldHeight);
            break;
        default:
            generateOakTree(game, x, groundY, worldHeight);
    }
}

function generateJungleTree(game, x, groundY, worldHeight) {
    if (game.tileMap[groundY]?.[x] !== TILE.GRASS) return;
    
    const treeHeight = 8 + Math.floor(SeededRandom.random() * 6);
    const trunkWidth = 1 + Math.floor(SeededRandom.random() * 2);
    
    // Tronc épais
    for (let dy = 0; dy < treeHeight; dy++) {
        for (let dx = 0; dx < trunkWidth; dx++) {
            const treeY = groundY - 1 - dy;
            const treeX = x + dx;
            if (treeY > 0 && treeX >= 0) {
                game.tileMap[treeY][treeX] = TILE.OAK_WOOD;
            }
        }
    }
    
    // Feuillage dense
    const leafRadius = 4;
    const leafCenterY = groundY - treeHeight;
    for (let ly = -leafRadius; ly <= leafRadius; ly++) {
        for (let lx = -leafRadius; lx <= leafRadius; lx++) {
            const distance = Math.hypot(lx, ly);
            if (distance < leafRadius + SeededRandom.random() * 2) {
                const currentX = x + lx;
                const currentY = leafCenterY + ly;
                if (currentY >= 0 && currentY < worldHeight && currentX >= 0 && 
                    game.tileMap[currentY]?.[currentX] === TILE.AIR) {
                    game.tileMap[currentY][currentX] = TILE.OAK_LEAVES;
                }
            }
        }
    }
}

function generateCactus(game, x, groundY, worldHeight) {
    if (game.tileMap[groundY]?.[x] !== TILE.SAND) return;
    
    const cactusHeight = 3 + Math.floor(SeededRandom.random() * 4);
    
    // Tronc principal
    for (let dy = 0; dy < cactusHeight; dy++) {
        const cactusY = groundY - 1 - dy;
        if (cactusY > 0) {
            game.tileMap[cactusY][x] = TILE.CACTUS;
        }
    }
    
    // Branches latérales
    if (cactusHeight > 4 && SeededRandom.random() < 0.7) {
        const branchY = groundY - 2 - Math.floor(cactusHeight / 2);
        const branchSide = SeededRandom.random() < 0.5 ? -1 : 1;
        const branchLength = 2 + Math.floor(SeededRandom.random() * 2);
        
        for (let i = 1; i <= branchLength; i++) {
            const branchX = x + (branchSide * i);
            if (branchX >= 0 && branchY > 0) {
                game.tileMap[branchY][branchX] = TILE.CACTUS;
                if (i === branchLength) {
                    // Bout de branche vers le haut
                    game.tileMap[branchY - 1][branchX] = TILE.CACTUS;
                }
            }
        }
    }
}

function generateSwampTree(game, x, groundY, worldHeight) {
    if (game.tileMap[groundY]?.[x] !== TILE.DIRT) return;
    
    const treeHeight = 6 + Math.floor(SeededRandom.random() * 4);
    
    // Tronc tordu
    let currentX = x;
    for (let dy = 0; dy < treeHeight; dy++) {
        const treeY = groundY - 1 - dy;
        if (treeY > 0) {
            game.tileMap[treeY][currentX] = TILE.OAK_WOOD;
            
            // Tordre le tronc
            if (dy > 2 && SeededRandom.random() < 0.3) {
                currentX += SeededRandom.random() < 0.5 ? -1 : 1;
                currentX = Math.max(0, currentX);
            }
        }
    }
    
    // Feuillage clairsemé
    const leafRadius = 3;
    const leafCenterY = groundY - treeHeight;
    for (let ly = -leafRadius; ly <= leafRadius; ly++) {
        for (let lx = -leafRadius; lx <= leafRadius; lx++) {
            if (Math.hypot(lx, ly) < leafRadius && SeededRandom.random() < 0.6) {
                const leafX = currentX + lx;
                const leafY = leafCenterY + ly;
                if (leafY >= 0 && leafY < worldHeight && leafX >= 0 && 
                    game.tileMap[leafY]?.[leafX] === TILE.AIR) {
                    game.tileMap[leafY][leafX] = TILE.OAK_LEAVES;
                }
            }
        }
    }
}

function generatePineTree(game, x, groundY, worldHeight) {
    if (game.tileMap[groundY]?.[x] !== TILE.SNOW && game.tileMap[groundY]?.[x] !== TILE.GRASS) return;
    
    const treeHeight = 10 + Math.floor(SeededRandom.random() * 6);
    
    // Tronc
    for (let dy = 0; dy < treeHeight; dy++) {
        const treeY = groundY - 1 - dy;
        if (treeY > 0) {
            game.tileMap[treeY][x] = TILE.PINE_WOOD;
        }
    }
    
    // Feuillage conique
    for (let layer = 0; layer < 4; layer++) {
        const layerY = groundY - treeHeight + layer * 2;
        const layerRadius = 4 - layer;
        
        for (let lx = -layerRadius; lx <= layerRadius; lx++) {
            for (let ly = -1; ly <= 1; ly++) {
                const leafX = x + lx;
                const leafY = layerY + ly;
                if (leafY >= 0 && leafY < worldHeight && leafX >= 0 && 
                    game.tileMap[leafY]?.[leafX] === TILE.AIR) {
                    // Vérifier si le point est dans le cône
                    const distance = Math.abs(lx) + Math.abs(ly);
                    if (distance <= layerRadius) {
                        game.tileMap[leafY][leafX] = TILE.PINE_LEAVES;
                    }
                }
            }
        }
    }
}

function generateAcaciaTree(game, x, groundY, worldHeight) {
    if (game.tileMap[groundY]?.[x] !== TILE.GRASS && game.tileMap[groundY]?.[x] !== TILE.DIRT) return;
    
    const trunkHeight = 4 + Math.floor(SeededRandom.random() * 3);
    
    // Tronc
    for (let dy = 0; dy < trunkHeight; dy++) {
        const treeY = groundY - 1 - dy;
        if (treeY > 0) {
            game.tileMap[treeY][x] = TILE.OAK_WOOD;
        }
    }
    
    // Couronne plate caractéristique
    const crownY = groundY - trunkHeight;
    const crownRadius = 5;
    for (let lx = -crownRadius; lx <= crownRadius; lx++) {
        for (let ly = -2; ly <= 1; ly++) {
            if (Math.abs(lx) + Math.abs(ly) < crownRadius) {
                const leafX = x + lx;
                const leafY = crownY + ly;
                if (leafY >= 0 && leafY < worldHeight && leafX >= 0 && 
                    game.tileMap[leafY]?.[leafX] === TILE.AIR) {
                    game.tileMap[leafY][leafX] = TILE.OAK_LEAVES;
                }
            }
        }
    }
}

function generateOakTree(game, x, groundY, worldHeight) {
    if (game.tileMap[groundY]?.[x] !== TILE.GRASS) return;
    
    const treeHeight = 5 + Math.floor(SeededRandom.random() * 5);
    
    // Tronc
    for (let dy = 0; dy < treeHeight; dy++) {
        const treeY = groundY - 1 - dy;
        if (treeY > 0) {
            game.tileMap[treeY][x] = TILE.OAK_WOOD;
        }
    }
    
    // Feuillage rond
    const leafRadius = 3;
    const leafCenterY = groundY - treeHeight;
    for (let ly = -leafRadius; ly <= leafRadius; ly++) {
        for (let lx = -leafRadius; lx <= leafRadius; lx++) {
            if (Math.hypot(lx, ly) < leafRadius + 0.5) {
                const leafX = x + lx;
                const leafY = leafCenterY + ly;
                if (leafY >= 0 && leafY < worldHeight && leafX >= 0 && 
                    game.tileMap[leafY]?.[leafX] === TILE.AIR) {
                    game.tileMap[leafY][leafX] = TILE.OAK_LEAVES;
                }
            }
        }
    }
}

function generateVegetation(game, x, groundY, biome) {
    const surfaceTile = game.tileMap[groundY]?.[x];
    const aboveTile = game.tileMap[groundY - 1]?.[x];
    
    if (aboveTile !== TILE.AIR) return;
    
    switch (biome) {
        case 'jungle':
        case 'plains':
            if (surfaceTile === TILE.GRASS && SeededRandom.random() < 0.5) {
                game.tileMap[groundY - 1][x] = SeededRandom.random() < 0.5 ? TILE.FLOWER_RED : TILE.FLOWER_YELLOW;
            }
            break;
        case 'desert':
            // Petites plantes désertiques (utiliser des fleurs pour représenter)
            if (surfaceTile === TILE.SAND && SeededRandom.random() < 0.3) {
                game.tileMap[groundY - 1][x] = TILE.FLOWER_YELLOW;
            }
            break;
        case 'swamp':
            // Champignons
            if (surfaceTile === TILE.DIRT && SeededRandom.random() < 0.4) {
                game.tileMap[groundY - 1][x] = TILE.GLOW_MUSHROOM;
            }
            break;
    }
}

function generateRockFormation(game, x, groundY, worldHeight) {
    const formationHeight = 3 + Math.floor(SeededRandom.random() * 5);
    const formationWidth = 2 + Math.floor(SeededRandom.random() * 3);
    
    for (let dy = 0; dy < formationHeight; dy++) {
        for (let dx = 0; dx < formationWidth; dx++) {
            const rockY = groundY - dy;
            const rockX = x + dx;
            if (rockY >= 0 && rockY < worldHeight && rockX >= 0) {
                if (game.tileMap[rockY]?.[rockX] === TILE.AIR) {
                    const stoneType = SeededRandom.random() < 0.7 ? TILE.STONE : TILE.GRANITE;
                    game.tileMap[rockY][rockX] = stoneType;
                }
            }
        }
    }
}

function generateBiomeStructure(game, x, groundY, biome, worldHeight) {
    switch (biome) {
        case 'desert':
            generateOasis(game, x, groundY, worldHeight);
            break;
        case 'mountains':
            generateCave(game, x, groundY, worldHeight);
            break;
        case 'jungle':
            generateTempleRuins(game, x, groundY, worldHeight);
            break;
        case 'swamp':
            generateSwampHut(game, x, groundY, worldHeight);
            break;
    }
}

function generateOasis(game, x, groundY, worldHeight) {
    const oasisRadius = 4;
    
    // Créer un petit lac
    for (let dx = -oasisRadius; dx <= oasisRadius; dx++) {
        for (let dy = -2; dy <= 0; dy++) {
            if (Math.hypot(dx, dy) < oasisRadius) {
                const oasisX = x + dx;
                const oasisY = groundY + dy;
                if (oasisX >= 0 && oasisY >= 0 && oasisY < worldHeight) {
                    if (dy === 0) {
                        game.tileMap[oasisY][oasisX] = TILE.WATER;
                    } else {
                        game.tileMap[oasisY][oasisX] = TILE.DIRT;
                    }
                }
            }
        }
    }
    
    // Ajouter quelques palmiers (arbres spéciaux)
    for (let i = 0; i < 3; i++) {
        const palmX = x + (SeededRandom.random() - 0.5) * oasisRadius * 2;
        const palmY = groundY;
        if (palmX >= 0 && game.tileMap[palmY]?.[Math.floor(palmX)] === TILE.DIRT) {
            generateOakTree(game, Math.floor(palmX), palmY, worldHeight);
        }
    }
}

function generateCave(game, x, groundY, worldHeight) {
    const caveDepth = 8 + Math.floor(SeededRandom.random() * 6);
    const caveWidth = 4 + Math.floor(SeededRandom.random() * 4);
    
    for (let dy = 0; dy < caveDepth; dy++) {
        for (let dx = -Math.floor(caveWidth/2); dx <= Math.floor(caveWidth/2); dx++) {
            const caveX = x + dx;
            const caveY = groundY + dy;
            if (caveX >= 0 && caveY >= 0 && caveY < worldHeight) {
                if (Math.hypot(dx, dy * 0.5) < caveWidth / 2) {
                    game.tileMap[caveY][caveX] = TILE.AIR;
                }
            }
        }
    }
}

function generateTempleRuins(game, x, groundY, worldHeight) {
    const ruinHeight = 6;
    const ruinWidth = 8;
    
    // Base du temple
    for (let dx = 0; dx < ruinWidth; dx++) {
        for (let dy = 0; dy < 2; dy++) {
            const ruinX = x + dx;
            const ruinY = groundY - dy;
            if (ruinX >= 0 && ruinY >= 0 && ruinY < worldHeight) {
                game.tileMap[ruinY][ruinX] = TILE.STONE;
            }
        }
    }
    
    // Colonnes partiellement détruites
    for (let col = 1; col < ruinWidth; col += 2) {
        const columnHeight = 2 + Math.floor(SeededRandom.random() * 4);
        for (let dy = 0; dy < columnHeight; dy++) {
            const ruinX = x + col;
            const ruinY = groundY - 2 - dy;
            if (ruinX >= 0 && ruinY >= 0 && ruinY < worldHeight) {
                game.tileMap[ruinY][ruinX] = TILE.STONE;
            }
        }
    }
}

function generateSwampHut(game, x, groundY, worldHeight) {
    const hutWidth = 5;
    const hutHeight = 4;
    
    // Base de la hutte
    for (let dx = 0; dx < hutWidth; dx++) {
        const hutX = x + dx;
        const hutY = groundY - 1;
        if (hutX >= 0 && hutY >= 0 && hutY < worldHeight) {
            game.tileMap[hutY][hutX] = TILE.OAK_WOOD;
        }
    }
    
    // Murs
    for (let dy = 1; dy < hutHeight; dy++) {
        // Mur gauche
        const leftX = x;
        const leftY = groundY - 1 - dy;
        if (leftX >= 0 && leftY >= 0 && leftY < worldHeight) {
            game.tileMap[leftY][leftX] = TILE.OAK_WOOD;
        }
        
        // Mur droit
        const rightX = x + hutWidth - 1;
        const rightY = groundY - 1 - dy;
        if (rightX >= 0 && rightY >= 0 && rightY < worldHeight) {
            game.tileMap[rightY][rightX] = TILE.OAK_WOOD;
        }
    }
    
    // Toit
    for (let dx = 0; dx < hutWidth; dx++) {
        const roofX = x + dx;
        const roofY = groundY - hutHeight;
        if (roofX >= 0 && roofY >= 0 && roofY < worldHeight) {
            game.tileMap[roofY][roofX] = TILE.OAK_LEAVES;
        }
    }
}

export function ensureWorldColumns(game, config, fromX, toX) {
    const start = Math.max(0, Math.floor(fromX));
    const end = Math.max(start, Math.floor(toX));
    const worldHeightInTiles = game.tileMap.length;
    const currentWidth = game.tileMap[0]?.length || 0;

    console.log(`ensureWorldColumns: ${start} à ${end}, largeur actuelle: ${currentWidth}`);

    // Étendre le tableau vers la droite si nécessaire
    if (end >= currentWidth) {
        const newWidth = Math.max(end + 50, currentWidth * 2); // Ajouter une marge
        console.log(`Extension du monde vers la droite: nouvelle largeur ${newWidth}`);
        
        for (let y = 0; y < worldHeightInTiles; y++) {
            // Étendre chaque ligne
            const currentRowLength = game.tileMap[y].length;
            const columnsToAdd = newWidth - currentRowLength;
            if (columnsToAdd > 0) {
                const newColumns = Array(columnsToAdd).fill(TILE.AIR);
                game.tileMap[y] = game.tileMap[y].concat(newColumns);
            }
        }
        
        // Générer le contenu pour les nouvelles colonnes
        const startGeneration = Math.max(game.generatedRange.max, currentWidth);
        const widthToGenerate = newWidth - startGeneration;
        if (widthToGenerate > 0) {
            generateColumns(game, config, startGeneration, widthToGenerate);
            game.generatedRange.max = newWidth;
        }
    }

    // Étendre le tableau vers la gauche si nécessaire (plus complexe)
    if (start < game.generatedRange.min) {
        const columnsToAdd = game.generatedRange.min - start;
        console.log(`Extension du monde vers la gauche: ${columnsToAdd} colonnes`);
        
        for (let y = 0; y < worldHeightInTiles; y++) {
            const newColumns = Array(columnsToAdd).fill(TILE.AIR);
            game.tileMap[y] = newColumns.concat(game.tileMap[y]);
        }
        generateColumns(game, config, start, columnsToAdd);
        game.generatedRange.min = start;
    }

    config.worldWidth = (game.generatedRange.max - game.generatedRange.min) * config.tileSize;
}