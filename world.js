import { randomChestType } from './chestGenerator.js';
import { SeededRandom } from './seededRandom.js'; // Import du générateur

// Perlin Noise Generator (maintenant déterministe)
const Perlin = {
    rand_vect: function(){ let theta = SeededRandom.random()*2*Math.PI; return {x:Math.cos(theta), y:Math.sin(theta)}; },
    dot_prod_grid: function(x, y, vx, vy){
        let g_vect; let d_vect = {x:x-vx, y:y-vy};
        if (this.gradients[[vx,vy]]){ g_vect = this.gradients[[vx,vy]]; }
        else { g_vect = this.rand_vect(); this.gradients[[vx,vy]] = g_vect; }
        return d_vect.x*g_vect.x + d_vect.y*g_vect.y;
    },
    smootherstep: (x) => 6*x**5 - 15*x**4 + 10*x**3,
    interp: function(x, a, b){ return a + this.smootherstep(x)*(b-a); },
    seed: function(){ this.gradients = {}; this.memory = {}; },
    get: function(x, y) {
        if (this.memory.hasOwnProperty([x,y])) return this.memory[[x,y]];
        let xf = Math.floor(x); let yf = Math.floor(y);
        let tl = this.dot_prod_grid(x, y, xf,   yf); let tr = this.dot_prod_grid(x, y, xf+1, yf);
        let bl = this.dot_prod_grid(x, y, xf,   yf+1); let br = this.dot_prod_grid(x, y, xf+1, yf+1);
        let xt = this.interp(x-xf, tl, tr); let xb = this.interp(x-xf, bl, br);
        let v = this.interp(y-yf, xt, xb); this.memory[[x,y]] = v;
        return v;
    }
};

// --- LISTE DE BLOCS BEAUCOUP PLUS COMPLÈTE ---
export const TILE = { 
    AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5, COAL: 6, IRON: 7,
    BEDROCK: 8, WATER: 9, CRYSTAL: 10, GLOW_MUSHROOM: 11, CLOUD: 12, HELLSTONE: 13, LAVA: 14,
    SAND: 15, OAK_WOOD: 16, OAK_LEAVES: 17, FLOWER_RED: 18, FLOWER_YELLOW: 19,
    GOLD: 20, DIAMOND: 21, LAPIS: 22, GRANITE: 23, DIORITE: 24, ANDESITE: 25,
    HEAVENLY_STONE: 26, MOON_ROCK: 27,
    SOUL_SAND: 28, SCORCHED_STONE: 29, OBSIDIAN: 30,
    AMETHYST: 31,
};

export const WORLD_LAYERS = {};

export function generateLevel(game, levelConfig, gameSettings) {
    SeededRandom.setSeed(12345); // Réinitialise la graine pour la cohérence
    Perlin.seed();
    
    const { worldWidth, worldHeight, tileSize, generation } = levelConfig;
    const worldWidthInTiles = Math.floor(worldWidth / tileSize);
    const worldHeightInTiles = Math.floor(worldHeight / tileSize);

    WORLD_LAYERS.PARADISE_LEVEL = Math.floor(worldHeightInTiles * 0.1);
    WORLD_LAYERS.SPACE_LEVEL = Math.floor(worldHeightInTiles * 0.2);
    WORLD_LAYERS.SURFACE_LEVEL = Math.floor(worldHeightInTiles * 0.3);
    WORLD_LAYERS.UNDERGROUND_START_Y = WORLD_LAYERS.SURFACE_LEVEL + 20;
    WORLD_LAYERS.CORE_START_Y = Math.floor(worldHeightInTiles * 0.6);
    WORLD_LAYERS.NUCLEUS_START_Y = Math.floor(worldHeightInTiles * 0.8);
    WORLD_LAYERS.HELL_START_Y = Math.floor(worldHeightInTiles * 0.9);

    game.decorations = []; game.coins = []; game.bonuses = []; game.chests = [];
    game.checkpoints = []; game.enemies = []; game.fallingBlocks = []; game.collectibles = [];
    game.tileMap = Array(worldHeightInTiles).fill(0).map(() => Array(worldWidthInTiles).fill(TILE.AIR));
    
    // === 1. PARADIS ===
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = WORLD_LAYERS.PARADISE_LEVEL; y < WORLD_LAYERS.SPACE_LEVEL; y++) {
            const noise = Perlin.get(x * 0.08, y * 0.1);
            if (noise > 0.4) {
                game.tileMap[y][x] = TILE.CLOUD;
                if (Perlin.get(x * 0.2, y * 0.2) > 0.5) {
                    game.tileMap[y-1][x] = TILE.HEAVENLY_STONE;
                }
            }
        }
    }

    // === 2. ESPACE ===
    for (let i = 0; i < 50; i++) {
        const clusterX = SeededRandom.random() * worldWidthInTiles;
        const clusterY = WORLD_LAYERS.SPACE_LEVEL + SeededRandom.random() * (WORLD_LAYERS.SURFACE_LEVEL - WORLD_LAYERS.SPACE_LEVEL);
        for (let j = 0; j < 15; j++) {
            const asteroidX = Math.floor(clusterX + (SeededRandom.random() - 0.5) * 10);
            const asteroidY = Math.floor(clusterY + (SeededRandom.random() - 0.5) * 10);
            if (game.tileMap[asteroidY]?.[asteroidX] === TILE.AIR) {
                game.tileMap[asteroidY][asteroidX] = TILE.MOON_ROCK;
            }
        }
    }

    // === 3. SURFACE ===
    const waterLevel = WORLD_LAYERS.SURFACE_LEVEL + 15;
    for (let x = 0; x < worldWidthInTiles; x++) {
        const height = Math.floor(Perlin.get(x * 0.05, 0) * 10);
        const ySurface = WORLD_LAYERS.SURFACE_LEVEL + height;
        for (let y = ySurface; y < WORLD_LAYERS.CORE_START_Y; y++) {
            if (y < waterLevel && game.tileMap[y][x] === TILE.AIR) {
                game.tileMap[y][x] = TILE.WATER;
            } else {
                if (y === ySurface) {
                    if (game.tileMap[y][x-1] === TILE.WATER || game.tileMap[y][x+1] === TILE.WATER) {
                        game.tileMap[y][x] = TILE.SAND;
                    } else {
                        game.tileMap[y][x] = TILE.GRASS;
                    }
                }
                else if (y < ySurface + 6) game.tileMap[y][x] = TILE.DIRT;
                else game.tileMap[y][x] = TILE.STONE;
            }
        }
    }

    // === 4. SOUTERRAINS (ROCHES VARIÉES & MINERAIS) ===
    const caveNoiseScale = 0.07;
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = WORLD_LAYERS.UNDERGROUND_START_Y; y < WORLD_LAYERS.NUCLEUS_START_Y; y++) {
            if (game.tileMap[y][x] === TILE.STONE) {
                const noise1 = Perlin.get(x * caveNoiseScale, y * caveNoiseScale);
                if (noise1 > 0.35) game.tileMap[y][x] = TILE.AIR;
                else {
                    const rockNoise = Perlin.get(x * 0.1, y * 0.1);
                    if (rockNoise > 0.4) game.tileMap[y][x] = TILE.GRANITE;
                    else if (rockNoise < -0.4) game.tileMap[y][x] = TILE.DIORITE;
                    
                    if (SeededRandom.random() < 0.05) game.tileMap[y][x] = TILE.COAL;
                    else if (SeededRandom.random() < 0.03) game.tileMap[y][x] = TILE.IRON;
                    else if (y > WORLD_LAYERS.CORE_START_Y * 0.8 && SeededRandom.random() < 0.02) game.tileMap[y][x] = TILE.GOLD;
                    else if (y > WORLD_LAYERS.CORE_START_Y * 0.9 && SeededRandom.random() < 0.01) game.tileMap[y][x] = TILE.DIAMOND;
                    else if (SeededRandom.random() < 0.015) game.tileMap[y][x] = TILE.LAPIS;
                }
            }
        }
    }

    // === 5. CŒUR DU MONDE ===
    const coreRadius = (WORLD_LAYERS.NUCLEUS_START_Y - WORLD_LAYERS.CORE_START_Y) / 2;
    const coreCenterX = worldWidthInTiles / 2;
    const coreCenterY = WORLD_LAYERS.CORE_START_Y + coreRadius;
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = WORLD_LAYERS.CORE_START_Y; y < WORLD_LAYERS.NUCLEUS_START_Y; y++) {
            const dist = Math.hypot(x - coreCenterX, y - coreCenterY);
            const noise = Perlin.get(x * 0.02, y * 0.02) * coreRadius * 0.5;
            if (dist < coreRadius + noise) {
                 if (game.tileMap[y][x] !== TILE.AIR) {
                     game.tileMap[y][x] = (Perlin.get(x*0.3, y*0.3) > 0.3) ? TILE.AMETHYST : TILE.CRYSTAL;
                 }
                 if (game.tileMap[y+1]?.[x] >= TILE.CRYSTAL && game.tileMap[y][x] === TILE.AIR && SeededRandom.random() < 0.1) {
                    game.tileMap[y][x] = TILE.GLOW_MUSHROOM;
                 }
            }
        }
    }
    
    // === 6. NOYAU OCÉANIQUE ===
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = WORLD_LAYERS.NUCLEUS_START_Y; y < WORLD_LAYERS.HELL_START_Y; y++) {
            game.tileMap[y][x] = TILE.WATER;
        }
    }

    // === 7. ENFER ===
    for (let x = 0; x < worldWidthInTiles; x++) {
        const height = Math.floor(Perlin.get(x * 0.06, 0.5) * 8);
        const yHellSurface = WORLD_LAYERS.HELL_START_Y + height;
        for (let y = yHellSurface; y < worldHeightInTiles; y++) {
            const hellNoise = Perlin.get(x * 0.15, y * 0.15);
            if (hellNoise > 0.4) game.tileMap[y][x] = TILE.SOUL_SAND;
            else if (hellNoise < -0.3) game.tileMap[y][x] = TILE.SCORCHED_STONE;
            else game.tileMap[y][x] = TILE.HELLSTONE;
        }
    }
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = WORLD_LAYERS.HELL_START_Y; y < worldHeightInTiles; y++) {
            if (game.tileMap[y][x] !== TILE.AIR) {
                if (Perlin.get(x * 0.08, y * 0.08) > 0.4) game.tileMap[y][x] = TILE.LAVA;
            }
        }
    }

    // === 8. BEDROCK & OBSIDIENNE ===
    for (let x = 0; x < worldWidthInTiles; x++) {
        game.tileMap[worldHeightInTiles - 1][x] = TILE.BEDROCK;
        game.tileMap[0][x] = TILE.BEDROCK;
        if (Perlin.get(x * 0.2, 0) > 0.3) {
             game.tileMap[WORLD_LAYERS.HELL_START_Y - 1][x] = TILE.BEDROCK;
        }
        if(game.tileMap[WORLD_LAYERS.HELL_START_Y - 2][x] === TILE.WATER) {
            game.tileMap[WORLD_LAYERS.HELL_START_Y - 2][x] = TILE.OBSIDIAN;
        }
    }

    // === 9. DÉCORS DE SURFACE (ARBRES & FLEURS) ===
    for (let i = 0; i < generation.treeCount; i++) {
        const x = Math.floor(SeededRandom.random() * (worldWidthInTiles - 20)) + 10;
        for (let y = WORLD_LAYERS.SPACE_LEVEL; y < WORLD_LAYERS.UNDERGROUND_START_Y; y++) {
            if (game.tileMap[y][x] === TILE.GRASS && game.tileMap[y - 1][x] === TILE.AIR) {
                const treeHeight = 5 + Math.floor(SeededRandom.random() * 5);
                for (let j = 1; j <= treeHeight; j++) {
                    if (y - j > 0) game.tileMap[y - j][x] = TILE.OAK_WOOD;
                }
                const canopySize = 2;
                for (let ly = -canopySize; ly <= canopySize; ly++) {
                    for (let lx = -canopySize; lx <= canopySize; lx++) {
                        if (lx === 0 && ly < 0) continue;
                        if (SeededRandom.random() > 0.4) {
                            const leafY = y - treeHeight + ly;
                            const leafX = x + lx;
                            if (game.tileMap[leafY]?.[leafX] === TILE.AIR) {
                                game.tileMap[leafY][leafX] = TILE.OAK_LEAVES;
                            }
                        }
                    }
                }
                if (game.tileMap[y][x-1] === TILE.GRASS) game.tileMap[y-1][x-1] = TILE.FLOWER_RED;
                if (game.tileMap[y][x+1] === TILE.GRASS) game.tileMap[y-1][x+1] = TILE.FLOWER_YELLOW;
                break;
            }
        }
    }

    // === 10. PLACEMENT DES COFFRES ET AUTRES OBJETS (RÉINTÉGRÉ) ===
    for (let i = 0; i < (generation.chestCount || 0); i++) {
        const x = Math.floor(SeededRandom.random() * worldWidthInTiles);
        const y = WORLD_LAYERS.SURFACE_LEVEL + 5 + Math.floor(SeededRandom.random() * (WORLD_LAYERS.CORE_START_Y - WORLD_LAYERS.SURFACE_LEVEL - 10));
        if (game.tileMap[y]?.[x] === TILE.AIR) {
            game.chests.push({ x: x * tileSize, y: y * tileSize, w: 16, h: 16, items: [], type: randomChestType() });
        }
    }
}
