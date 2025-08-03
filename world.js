import { SeededRandom } from './seededRandom.js';
import { Perlin } from './perlin.js';
import { Slime, Frog, Golem } from './enemy.js';
import { PNJ } from './PNJ.js';
import { generatePNJ } from './generateurPNJ.js';

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
    HELLFIRE_CRYSTAL: 68, DEMON_GOLD: 69
};

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
        // === GÉNÉRATION DE TERRAIN COMPLEXE ===
        
        // Bruit continental (forme générale des continents) - TRÈS AMPLIFIÉE
        const continentalNoise = Perlin.get(x * 0.001, 0) * 200;
        
        // Chaînes de montagnes - EXTRÊMEMENT DRAMATIQUES
        const mountainRidgeNoise = Perlin.get(x * 0.004, 0) * 150;
        const mountainDetailNoise = Perlin.get(x * 0.012, 0) * 80;
        
        // Collines et vallées - TRÈS PRONONCÉES
        const hillNoise = Perlin.get(x * 0.02, 0) * 60;
        const valleyNoise = Perlin.get(x * 0.035, 0) * 40;
        
        // Détails fins du terrain - TRÈS VARIÉS
        const detailNoise = Perlin.get(x * 0.06, 0) * 20;
        const microNoise = Perlin.get(x * 0.12, 0) * 10;
        
        // Combinaison intelligente des bruits avec énormément de variation
        let terrainHeight = continentalNoise + mountainRidgeNoise + mountainDetailNoise;
        terrainHeight += hillNoise - Math.abs(valleyNoise) * 1.2; // Vallées beaucoup plus profondes
        terrainHeight += detailNoise + microNoise;
        
        // Ajouter des formations spéciales
        const canyonNoise = Math.abs(Perlin.get(x * 0.008, 500));
        if (canyonNoise < 0.1) {
            terrainHeight -= 100; // Canyons profonds
        }
        
        const plateauNoise = Perlin.get(x * 0.003, 1000);
        if (plateauNoise > 0.6) {
            terrainHeight += 80; // Plateaux élevés
        }
        
        // Terrain EXTRÊMEMENT varié
        const groundY = Math.max(skyLevel + 5, 
            Math.min(surfaceLevel + 250, surfaceLevel + Math.floor(terrainHeight)));
        
        // === SYSTÈME DE BIOMES INTELLIGENT ===
        
        // Facteurs climatiques
        const temperatureNoise = Perlin.get(x * 0.01, 0);
        const humidityNoise = Perlin.get(x * 0.012, 1000);
        const elevationFactor = (groundY - surfaceLevel) / 50.0;
        
        // Classification des biomes
        const temperature = temperatureNoise + elevationFactor * -0.3; // Plus froid en altitude
        const humidity = humidityNoise;
        
        let biome = 'plains';
        if (temperature < -0.4) biome = 'tundra';
        else if (temperature < -0.2 && elevationFactor > 0.3) biome = 'snowy_mountains';
        else if (temperature > 0.4 && humidity < -0.2) biome = 'desert';
        else if (temperature > 0.2 && humidity > 0.3) biome = 'jungle';
        else if (humidity > 0.4 && groundY < surfaceLevel) biome = 'swamp';
        else if (elevationFactor > 0.5) biome = 'mountains';
        else if (humidity < 0 && temperature > 0) biome = 'savanna';
        else if (groundY < surfaceLevel - 10) biome = 'ocean';
        
        // Biomes spéciaux basés sur des formations géologiques
        const caveNoise = Perlin.get(x * 0.05, 0);
        const riverNoise = Math.abs(Perlin.get(x * 0.03, 500));
        const isRiver = riverNoise < 0.1 && groundY > surfaceLevel - 20;
        const isCanyon = Math.abs(Perlin.get(x * 0.02, 2000)) < 0.15 && elevationFactor > 0.2;
        
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
            for (let y = groundY + 1; y < Math.max(surfaceLevel, groundY + 10); y++) {
                if (game.tileMap[y][x] === TILE.AIR) {
                    game.tileMap[y][x] = TILE.WATER;
                }
            }
        }
        
        // Rivières
        if (isRiver && biome !== 'desert') {
            const riverDepth = 3;
            for (let y = groundY - riverDepth; y <= groundY; y++) {
                if (y >= 0 && y < worldHeightInTiles) {
                    game.tileMap[y][x] = y === groundY - riverDepth ? TILE.WATER : TILE.AIR;
                }
            }
        }
        
        // Canyons
        if (isCanyon) {
            const canyonDepth = 15 + Math.floor(SeededRandom.random() * 10);
            for (let y = groundY - canyonDepth; y < groundY; y++) {
                if (y >= 0) {
                    game.tileMap[y][x] = TILE.AIR;
                }
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
                    game.pnjs.push(new PNJ(x * tileSize, (y - 2) * tileSize, config, generatePNJ()));
                    break;
                }
            }
        }
    }
}

export function generateLevel(game, config) {
    SeededRandom.setSeed(config.seed || Date.now());
    Perlin.seed();

    const { worldWidth = 4096, worldHeight, tileSize } = config;
    const worldHeightInTiles = Math.floor(worldHeight / tileSize);

    // Initialiser le tileMap avec la bonne largeur
    const initialWidth = Math.floor(worldWidth / tileSize) || 512; // Plus large par défaut
    game.tileMap = [];
    
    // Créer chaque ligne individuellement pour éviter les références partagées
    for (let y = 0; y < worldHeightInTiles; y++) {
        game.tileMap[y] = new Array(initialWidth).fill(TILE.AIR);
    }
    
    game.generatedRange = { min: 0, max: initialWidth };

    console.log(`Initialisation tileMap: ${worldHeightInTiles} x ${initialWidth}`);
    
    // Génération complète du monde
    generateColumns(game, config, 0, initialWidth);
    
    // Vérifier que le monde a été généré
    let solidTiles = 0;
    for (let y = 0; y < worldHeightInTiles; y++) {
        for (let x = 0; x < initialWidth; x++) {
            if (game.tileMap[y][x] > TILE.AIR) {
                solidTiles++;
            }
        }
    }
    console.log(`Monde généré: ${solidTiles} blocs solides sur ${worldHeightInTiles * initialWidth} total`);
    config.worldWidth = initialWidth * tileSize;
}

// === FONCTIONS UTILITAIRES POUR LES BIOMES ===

function getBiomeDepth(biome) {
    switch (biome) {
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
