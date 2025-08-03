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
    const skyLevel = Math.floor(worldHeightInTiles * 0.1);
    const surfaceLevel = Math.floor(worldHeightInTiles * 0.4);
    const waterLevel = surfaceLevel + 3;
    const undergroundLevel = Math.floor(worldHeightInTiles * 0.6);
    const deepLevel = Math.floor(worldHeightInTiles * 0.8);
    const hellLevel = Math.floor(worldHeightInTiles * 0.95);
    const { tileSize } = config;

    for (let x = startX; x < startX + width; x++) {
        // Génération de terrain avec plusieurs octaves de bruit
        const mainTerrain = Perlin.get(x * 0.01, 0) * 30;
        const detailTerrain = Perlin.get(x * 0.05, 0) * 10;
        const microTerrain = Perlin.get(x * 0.1, 0) * 3;
        const groundY = surfaceLevel + Math.floor(mainTerrain + detailTerrain + microTerrain);
        
        // Génération des nuages dans le ciel
        for (let y = 0; y < skyLevel; y++) {
            const cloudNoise = Perlin.get(x * 0.02, y * 0.02);
            if (cloudNoise > 0.3) {
                game.tileMap[y][x] = TILE.CLOUD;
            }
        }
        
        // Génération du terrain principal
        if (groundY > waterLevel + 3) {
            // Zone désertique/plage
            for (let y = groundY; y < worldHeightInTiles; y++) {
                if (y === groundY) {
                    game.tileMap[y][x] = TILE.SAND;
                } else if (y < groundY + 3) {
                    game.tileMap[y][x] = TILE.SAND;
                } else if (y < groundY + 8) {
                    game.tileMap[y][x] = TILE.DIRT;
                } else if (y < undergroundLevel) {
                    game.tileMap[y][x] = TILE.STONE;
                } else if (y < deepLevel) {
                    // Couche souterraine avec minerais
                    const oreChance = SeededRandom.random();
                    if (oreChance < 0.02) game.tileMap[y][x] = TILE.COAL;
                    else if (oreChance < 0.035) game.tileMap[y][x] = TILE.IRON;
                    else if (oreChance < 0.045) game.tileMap[y][x] = TILE.GOLD;
                    else if (oreChance < 0.05) game.tileMap[y][x] = TILE.DIAMOND;
                    else game.tileMap[y][x] = TILE.STONE;
                } else if (y < hellLevel) {
                    // Couches profondes
                    game.tileMap[y][x] = TILE.OBSIDIAN;
                } else {
                    // Enfer
                    const hellNoise = Perlin.get(x * 0.1, y * 0.1);
                    if (hellNoise > 0.2) game.tileMap[y][x] = TILE.LAVA;
                    else game.tileMap[y][x] = TILE.HELLSTONE;
                }
            }
            // Eau entre le niveau d'eau et le sol
            for (let y = waterLevel; y < groundY; y++) {
                game.tileMap[y][x] = TILE.WATER;
            }
            continue;
        }

        // Terrain normal (herbe)
        for (let y = groundY; y < worldHeightInTiles; y++) {
            if (y === groundY) {
                game.tileMap[y][x] = TILE.GRASS;
            } else if (y < groundY + 5) {
                game.tileMap[y][x] = TILE.DIRT;
            } else if (y < undergroundLevel) {
                game.tileMap[y][x] = TILE.STONE;
            } else if (y < deepLevel) {
                // Couche souterraine avec minerais variés
                const oreChance = SeededRandom.random();
                if (oreChance < 0.015) game.tileMap[y][x] = TILE.COAL;
                else if (oreChance < 0.025) game.tileMap[y][x] = TILE.IRON;
                else if (oreChance < 0.032) game.tileMap[y][x] = TILE.GOLD;
                else if (oreChance < 0.036) game.tileMap[y][x] = TILE.LAPIS;
                else if (oreChance < 0.038) game.tileMap[y][x] = TILE.DIAMOND;
                else if (oreChance < 0.04) game.tileMap[y][x] = TILE.AMETHYST;
                else {
                    const stoneVariant = SeededRandom.random();
                    if (stoneVariant < 0.1) game.tileMap[y][x] = TILE.GRANITE;
                    else if (stoneVariant < 0.2) game.tileMap[y][x] = TILE.DIORITE;
                    else if (stoneVariant < 0.3) game.tileMap[y][x] = TILE.ANDESITE;
                    else game.tileMap[y][x] = TILE.STONE;
                }
            } else if (y < hellLevel) {
                // Couches profondes
                const deepNoise = Perlin.get(x * 0.05, y * 0.05);
                if (deepNoise > 0.3) game.tileMap[y][x] = TILE.OBSIDIAN;
                else game.tileMap[y][x] = TILE.SCORCHED_STONE;
            } else {
                // Enfer avec lave et hellstone
                const hellNoise = Perlin.get(x * 0.1, y * 0.1);
                if (hellNoise > 0.4) game.tileMap[y][x] = TILE.LAVA;
                else if (hellNoise > 0.1) game.tileMap[y][x] = TILE.HELLSTONE;
                else game.tileMap[y][x] = TILE.SOUL_SAND;
            }
        }

        if (SeededRandom.random() < 0.05) {
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

        if (SeededRandom.random() < 0.02) {
            const enemyTypes = [Slime, Frog, Golem];
            for (let y = 0; y < worldHeightInTiles; y++) {
                if (game.tileMap[y]?.[x] > TILE.AIR && game.tileMap[y - 1]?.[x] === TILE.AIR) {
                    const EnemyType = enemyTypes[Math.floor(SeededRandom.random() * enemyTypes.length)];
                    game.enemies.push(new EnemyType(x * tileSize, (y - 2) * tileSize, config));
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

    game.tileMap = Array(worldHeightInTiles).fill(0).map(() => []);
    game.generatedRange = { min: 0, max: 0 };

    const initialWidth = Math.floor(worldWidth / tileSize) || 256;
    generateColumns(game, config, 0, initialWidth);
    game.generatedRange.max = initialWidth;
    config.worldWidth = initialWidth * tileSize;
}

export function ensureWorldColumns(game, config, fromX, toX) {
    const start = Math.max(0, Math.floor(fromX));
    const end = Math.max(start, Math.floor(toX));

    if (start < game.generatedRange.min) {
        generateColumns(game, config, start, game.generatedRange.min - start);
        game.generatedRange.min = start;
    }

    if (end > game.generatedRange.max) {
        generateColumns(game, config, game.generatedRange.max, end - game.generatedRange.max);
        game.generatedRange.max = end;
    }

    config.worldWidth = (game.generatedRange.max - game.generatedRange.min) * config.tileSize;
}
