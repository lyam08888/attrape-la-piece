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
    AMETHYST: 31,
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
        // Génération de terrain avec plusieurs octaves pour plus de réalisme
        const continentalNoise = Perlin.get(x * 0.005, 0) * 40;    // Forme continentale
        const mountainNoise = Perlin.get(x * 0.02, 0) * 20;        // Montagnes
        const hillNoise = Perlin.get(x * 0.05, 0) * 8;             // Collines
        const detailNoise = Perlin.get(x * 0.1, 0) * 3;            // Détails
        
        const groundY = Math.max(skyLevel + 5, 
            surfaceLevel + Math.floor(continentalNoise + mountainNoise + hillNoise + detailNoise));
        
        // Déterminer le biome basé sur la hauteur et la position
        const biomeNoise = Perlin.get(x * 0.01, 0);
        const isDesert = biomeNoise > 0.3 && groundY > surfaceLevel + 10;
        const isSnowy = groundY > surfaceLevel + 25;
        const isSwamp = biomeNoise < -0.3 && groundY < surfaceLevel - 5;
        
        for (let y = 0; y < worldHeightInTiles; y++) {
            if (y < skyLevel) {
                // PARADIS - Ciel éthéré avec structures célestes
                const celestialNoise = Perlin.get(x * 0.03, y * 0.03);
                if (celestialNoise > 0.6) {
                    game.tileMap[y][x] = TILE.CLOUD; // Nuages célestes
                } else if (celestialNoise > 0.4) {
                    game.tileMap[y][x] = TILE.SNOW; // Cristaux de glace céleste
                } else {
                    game.tileMap[y][x] = TILE.AIR;
                }
            } else if (y < cloudLevel) {
                // COUCHE NUAGEUSE
                const cloudNoise = Perlin.get(x * 0.02, y * 0.02);
                if (cloudNoise > 0.2) {
                    game.tileMap[y][x] = TILE.CLOUD;
                } else {
                    game.tileMap[y][x] = TILE.AIR;
                }
            } else if (y < groundY) {
                // ATMOSPHÈRE - Air avec quelques nuages
                if (y > groundY - 10 && Perlin.get(x * 0.05, y * 0.05) > 0.5) {
                    game.tileMap[y][x] = TILE.CLOUD;
                } else {
                    game.tileMap[y][x] = TILE.AIR;
                }
            } else if (y === groundY) {
                // SURFACE - Biomes variés
                if (isSnowy) {
                    game.tileMap[y][x] = TILE.SNOW;
                } else if (isDesert) {
                    game.tileMap[y][x] = TILE.SAND;
                } else if (isSwamp) {
                    game.tileMap[y][x] = TILE.DIRT; // Terre marécageuse
                } else {
                    game.tileMap[y][x] = TILE.GRASS;
                }
            } else if (y < groundY + (isDesert ? 8 : 5)) {
                // COUCHE SUPERFICIELLE
                if (isDesert) {
                    game.tileMap[y][x] = TILE.SAND;
                } else {
                    game.tileMap[y][x] = TILE.DIRT;
                }
            } else if (y < undergroundLevel) {
                // COUCHE ROCHEUSE avec minerais communs
                const oreChance = SeededRandom.random();
                if (oreChance < 0.015) {
                    game.tileMap[y][x] = TILE.COAL;
                } else if (oreChance < 0.025) {
                    game.tileMap[y][x] = TILE.IRON;
                } else {
                    const stoneVariant = SeededRandom.random();
                    if (stoneVariant < 0.1) game.tileMap[y][x] = TILE.GRANITE;
                    else if (stoneVariant < 0.2) game.tileMap[y][x] = TILE.DIORITE;
                    else game.tileMap[y][x] = TILE.STONE;
                }
            } else if (y < deepLevel) {
                // PROFONDEURS avec minerais précieux
                const deepOreChance = SeededRandom.random();
                if (deepOreChance < 0.008) {
                    game.tileMap[y][x] = TILE.DIAMOND;
                } else if (deepOreChance < 0.015) {
                    game.tileMap[y][x] = TILE.GOLD;
                } else if (deepOreChance < 0.025) {
                    game.tileMap[y][x] = TILE.LAPIS;
                } else if (deepOreChance < 0.035) {
                    game.tileMap[y][x] = TILE.AMETHYST;
                } else {
                    const deepNoise = Perlin.get(x * 0.05, y * 0.05);
                    if (deepNoise > 0.3) {
                        game.tileMap[y][x] = TILE.OBSIDIAN;
                    } else {
                        game.tileMap[y][x] = TILE.STONE;
                    }
                }
            } else if (y < hellLevel) {
                // COUCHES PRÉ-INFERNALES
                const preHellNoise = Perlin.get(x * 0.08, y * 0.08);
                if (preHellNoise > 0.4) {
                    game.tileMap[y][x] = TILE.OBSIDIAN;
                } else if (preHellNoise > 0.1) {
                    game.tileMap[y][x] = TILE.SCORCHED_STONE;
                } else {
                    game.tileMap[y][x] = TILE.STONE;
                }
            } else if (y < worldHeightInTiles - 1) {
                // ENFER - Lave et pierres infernales
                const hellNoise = Perlin.get(x * 0.1, y * 0.1);
                const hellDetail = Perlin.get(x * 0.2, y * 0.2);
                
                if (hellNoise > 0.3 && hellDetail > 0.2) {
                    game.tileMap[y][x] = TILE.LAVA;
                } else if (hellNoise > 0.1) {
                    game.tileMap[y][x] = TILE.HELLSTONE;
                } else if (hellNoise > -0.2) {
                    game.tileMap[y][x] = TILE.SOUL_SAND;
                } else {
                    game.tileMap[y][x] = TILE.OBSIDIAN;
                }
            } else {
                // BEDROCK - Fond indestructible
                game.tileMap[y][x] = TILE.BEDROCK;
            }
        }
        
        // Génération d'eau dans les zones basses
        if (groundY < surfaceLevel - 3) {
            for (let y = groundY + 1; y < surfaceLevel; y++) {
                if (game.tileMap[y][x] === TILE.AIR) {
                    game.tileMap[y][x] = TILE.WATER;
                }
            }
        }

        // Génération d'arbres simplifiée
        if (SeededRandom.random() < 0.03) {
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
