import { randomChestType } from './chestGenerator.js';
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

export function generateLevel(game, config) {
    SeededRandom.setSeed(config.seed || Date.now());
    Perlin.seed();
    
    const { worldWidth, worldHeight, tileSize, generation } = config;
    const worldWidthInTiles = Math.floor(worldWidth / tileSize);
    const worldHeightInTiles = Math.floor(worldHeight / tileSize);

    game.tileMap = Array(worldHeightInTiles).fill(0).map(() => Array(worldWidthInTiles).fill(TILE.AIR));
    
    const surfaceLevel = Math.floor(worldHeightInTiles * 0.4);

    // 1. Génération du terrain de base
    for (let x = 0; x < worldWidthInTiles; x++) {
        const groundY = surfaceLevel + Math.floor(Perlin.get(x * 0.05, 0) * 10);
        for (let y = groundY; y < worldHeightInTiles; y++) {
            if (y === groundY) game.tileMap[y][x] = TILE.GRASS;
            else if (y < groundY + 5) game.tileMap[y][x] = TILE.DIRT;
            else game.tileMap[y][x] = TILE.STONE;
        }
    }

    // 2. Génération des arbres
    for (let i = 0; i < (generation.treeCount || 20); i++) {
        const x = Math.floor(SeededRandom.random() * (worldWidthInTiles - 10)) + 5;
        for (let y = 10; y < worldHeightInTiles; y++) {
            if (game.tileMap[y]?.[x] === TILE.GRASS && game.tileMap[y - 1]?.[x] === TILE.AIR) {
                const treeHeight = 5 + Math.floor(SeededRandom.random() * 5);
                for (let j = 0; j < treeHeight; j++) {
                    if (y - 1 - j > 0) game.tileMap[y - 1 - j][x] = TILE.OAK_WOOD;
                }
                const leafRadius = 3;
                const leafCenterY = y - treeHeight;
                for(let ly = -leafRadius; ly <= leafRadius; ly++) {
                    for(let lx = -leafRadius; lx <= leafRadius; lx++) {
                        if(Math.hypot(lx, ly) < leafRadius + 0.5) {
                            const currentX = x + lx;
                            const currentY = leafCenterY + ly;
                            if(game.tileMap[currentY]?.[currentX] === TILE.AIR) {
                                game.tileMap[currentY][currentX] = TILE.OAK_LEAVES;
                            }
                        }
                    }
                }
                break;
            }
        }
    }

    // 3. Génération des ennemis
    const enemyTypes = [Slime, Frog, Golem];
    for (let i = 0; i < (generation.enemyCount || 15); i++) {
        const x = Math.floor(SeededRandom.random() * worldWidthInTiles);
        for (let y = 0; y < worldHeightInTiles; y++) {
            if (game.tileMap[y]?.[x] > TILE.AIR && game.tileMap[y-1]?.[x] === TILE.AIR) {
                const EnemyType = enemyTypes[Math.floor(SeededRandom.random() * enemyTypes.length)];
                game.enemies.push(new EnemyType(x * tileSize, (y-2) * tileSize, config));
                break;
            }
        }
    }

    // 4. Génération des PNJ
    for (let i = 0; i < (generation.pnjCount || 5); i++) {
        const x = Math.floor(worldWidthInTiles / 4 + SeededRandom.random() * (worldWidthInTiles / 2));
         for (let y = 0; y < worldHeightInTiles; y++) {
            if (game.tileMap[y]?.[x] > TILE.AIR && game.tileMap[y-1]?.[x] === TILE.AIR) {
                game.pnjs.push(new PNJ(x * tileSize, (y - 2) * tileSize, config, generatePNJ()));
                break;
            }
        }
    }
}
