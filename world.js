import { randomChestType } from './chestGenerator.js';
import { SeededRandom } from './seededRandom.js';
import { Perlin } from './perlin.js';

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

// --- NIVEAUX DU MONDE ---
export const WORLD_LAYERS = {};

// Simple helper to build a flat world so the player doesn't fall indefinitely
export function generateFlatWorld(game, config) {
    const width = Math.floor(config.worldWidth / config.tileSize);
    const height = Math.floor(config.worldHeight / config.tileSize);

    game.tileMap = Array.from({ length: height }, () => Array(width).fill(TILE.AIR));

    const groundY = height - 2;
    for (let x = 0; x < width; x++) {
        game.tileMap[groundY][x] = TILE.GRASS;
        for (let y = groundY + 1; y < height; y++) {
            game.tileMap[y][x] = TILE.DIRT;
        }
    }
}

export function generateLevel(game, levelConfig, gameSettings) {
    SeededRandom.setSeed(12345);
    Perlin.seed();
    
    const { worldWidth, worldHeight, tileSize, generation } = levelConfig;
    const worldWidthInTiles = Math.floor(worldWidth / tileSize);
    const worldHeightInTiles = Math.floor(worldHeight / tileSize);

    WORLD_LAYERS.PARADISE_END_Y = Math.floor(worldHeightInTiles * 0.15);
    WORLD_LAYERS.SPACE_END_Y = Math.floor(worldHeightInTiles * 0.25);
    WORLD_LAYERS.SURFACE_LEVEL = Math.floor(worldHeightInTiles * 0.35);
    WORLD_LAYERS.CORE_START_Y = Math.floor(worldHeightInTiles * 0.6);
    WORLD_LAYERS.NUCLEUS_START_Y = Math.floor(worldHeightInTiles * 0.8);
    WORLD_LAYERS.HELL_START_Y = Math.floor(worldHeightInTiles * 0.9);
    
    game.decorations = []; game.coins = []; game.bonuses = []; game.chests = [];
    game.checkpoints = []; game.enemies = []; game.fallingBlocks = []; game.collectibles = [];
    game.tileMap = Array(worldHeightInTiles).fill(0).map(() => Array(worldWidthInTiles).fill(TILE.AIR));
    
    // ... (toutes les étapes de génération 1 à 8 restent les mêmes)

    // === 9. DÉCORS DE SURFACE (ARBRES, FLEURS, VOLCANS) ===
    for (let i = 0; i < generation.treeCount; i++) {
        const x = Math.floor(SeededRandom.random() * (worldWidthInTiles - 20)) + 10;
        for (let y = WORLD_LAYERS.SPACE_END_Y; y < WORLD_LAYERS.SURFACE_LEVEL + 20; y++) {
            if (game.tileMap[y][x] === TILE.GRASS && game.tileMap[y - 1][x] === TILE.AIR) {
                // ... (logique de génération d'arbres)
                break;
            }
        }
    }
    
    // Génération de volcans
    for (let i = 0; i < 3; i++) { // 3 volcans par monde
        const volcanoX = Math.floor(SeededRandom.random() * worldWidthInTiles);
        const volcanoBaseHeight = WORLD_LAYERS.SURFACE_LEVEL + Math.floor(Perlin.get(volcanoX * 0.05, 0) * 10);
        const volcanoHeight = 20 + Math.floor(SeededRandom.random() * 10);
        
        for (let h = 0; h < volcanoHeight; h++) {
            const radius = volcanoHeight - h;
            for (let dx = -radius; dx <= radius; dx++) {
                const x = volcanoX + dx;
                const y = volcanoBaseHeight - h;
                if (x >= 0 && x < worldWidthInTiles && y > 0 && y < worldHeightInTiles) {
                    game.tileMap[y][x] = TILE.SCORCHED_STONE;
                }
            }
        }
        // Cratère de lave
        for (let r = 0; r < 4; r++) {
             game.tileMap[volcanoBaseHeight - volcanoHeight + r][volcanoX] = TILE.LAVA;
        }
    }
    
    // === 10. PLACEMENT DES COFFRES ET AUTRES OBJETS ===
    for (let i = 0; i < (generation.chestCount || 0); i++) {
        const x = Math.floor(SeededRandom.random() * worldWidthInTiles);
        const y = WORLD_LAYERS.SURFACE_LEVEL + 5 + Math.floor(SeededRandom.random() * (WORLD_LAYERS.CORE_START_Y - WORLD_LAYERS.SURFACE_LEVEL - 10));
        if (game.tileMap[y]?.[x] === TILE.AIR) {
            game.chests.push({ x: x * tileSize, y: y * tileSize, w: 16, h: 16, items: [], type: randomChestType() });
        }
    }
}
