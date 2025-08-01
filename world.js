import { randomChestType } from './chestGenerator.js';

// --- Générateur de nombres pseudo-aléatoires (intégré pour éviter les erreurs 404) ---
const SeededRandom = {
    seed: 12345,
    setSeed(newSeed) { this.seed = newSeed; },
    random: function() {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
};

// --- Générateur de Bruit de Perlin (maintenant déterministe) ---
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

// --- NIVEAUX DU MONDE (EXPORTÉS CORRECTEMENT) ---
export const WORLD_LAYERS = {};

export function generateLevel(game, levelConfig, gameSettings) {
    SeededRandom.setSeed(12345);
    Perlin.seed();
    
    const { worldWidth, worldHeight, tileSize, generation } = levelConfig;
    const worldWidthInTiles = Math.floor(worldWidth / tileSize);
    const worldHeightInTiles = Math.floor(worldHeight / tileSize);

    // Remplir l'objet WORLD_LAYERS pour l'exportation
    WORLD_LAYERS.PARADISE_END_Y = Math.floor(worldHeightInTiles * 0.15);
    WORLD_LAYERS.SPACE_END_Y = Math.floor(worldHeightInTiles * 0.25);
    WORLD_LAYERS.SURFACE_LEVEL = Math.floor(worldHeightInTiles * 0.35);
    WORLD_LAYERS.CORE_START_Y = Math.floor(worldHeightInTiles * 0.6);
    WORLD_LAYERS.NUCLEUS_START_Y = Math.floor(worldHeightInTiles * 0.8);
    WORLD_LAYERS.HELL_START_Y = Math.floor(worldHeightInTiles * 0.9);
    
    game.decorations = []; game.coins = []; game.bonuses = []; game.chests = [];
    game.checkpoints = []; game.enemies = []; game.fallingBlocks = []; game.collectibles = [];
    game.tileMap = Array(worldHeightInTiles).fill(0).map(() => Array(worldWidthInTiles).fill(TILE.AIR));
    
    // 1. Remplissage solide de bas en haut
    for (let x = 0; x < worldWidthInTiles; x++) {
        const surfaceHeight = Math.floor(Perlin.get(x * 0.05, 0) * 10);
        const ySurface = WORLD_LAYERS.SURFACE_LEVEL + surfaceHeight;
        
        for (let y = 0; y < worldHeightInTiles; y++) {
            if (y > ySurface) {
                if (y < ySurface + 6) game.tileMap[y][x] = TILE.DIRT;
                else game.tileMap[y][x] = TILE.STONE;
            }
        }
    }

    // 2. Remplissage des biomes profonds
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = WORLD_LAYERS.CORE_START_Y; y < worldHeightInTiles; y++) {
            if (y < WORLD_LAYERS.NUCLEUS_START_Y) {
                game.tileMap[y][x] = TILE.CRYSTAL;
            } else if (y < WORLD_LAYERS.HELL_START_Y) {
                game.tileMap[y][x] = TILE.WATER;
            } else {
                game.tileMap[y][x] = TILE.HELLSTONE;
            }
        }
    }

    // 3. Creusage et détails
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = 0; y < worldHeightInTiles; y++) {
            const caveNoise = Perlin.get(x * 0.07, y * 0.07);
            
            if (y > WORLD_LAYERS.SURFACE_LEVEL + 20 && y < WORLD_LAYERS.CORE_START_Y && caveNoise > 0.35) {
                game.tileMap[y][x] = TILE.AIR;
            }

            const coreRadius = (WORLD_LAYERS.NUCLEUS_START_Y - WORLD_LAYERS.CORE_START_Y) / 2;
            const distToCore = Math.hypot(x - worldWidthInTiles/2, y - (WORLD_LAYERS.CORE_START_Y + coreRadius));
            if (distToCore < coreRadius) {
                 if (Perlin.get(x * 0.1, y * 0.1) > 0.1) game.tileMap[y][x] = TILE.AIR;
            }

            if (y > WORLD_LAYERS.HELL_START_Y && caveNoise > 0.4) {
                game.tileMap[y][x] = TILE.LAVA;
            }
        }
    }

    // 4. Ajout des minerais et roches variées
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = WORLD_LAYERS.SURFACE_LEVEL; y < WORLD_LAYERS.HELL_START_Y; y++) {
            if (game.tileMap[y][x] === TILE.STONE) {
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

    // 5. Génération des couches supérieures
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = 0; y < WORLD_LAYERS.SPACE_END_Y; y++) {
            if (y < WORLD_LAYERS.PARADISE_END_Y && Perlin.get(x * 0.08, y * 0.1) > 0.4) {
                game.tileMap[y][x] = TILE.CLOUD;
            }
            else if (y >= WORLD_LAYERS.PARADISE_END_Y && Perlin.get(x*0.2, y*0.2) > 0.65) {
                game.tileMap[y][x] = TILE.MOON_ROCK;
            }
        }
    }
    
    // 6. Finalisation (Herbe, Arbres, Bedrock)
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = 1; y < worldHeightInTiles -1; y++) {
            if (game.tileMap[y][x] === TILE.DIRT && game.tileMap[y-1][x] === TILE.AIR) {
                game.tileMap[y][x] = TILE.GRASS;
            }
        }
        game.tileMap[worldHeightInTiles - 1][x] = TILE.BEDROCK;
        game.tileMap[0][x] = TILE.BEDROCK;
    }

    // 7. Placer les arbres, fleurs, etc.
    for (let i = 0; i < generation.treeCount; i++) {
        const x = Math.floor(SeededRandom.random() * (worldWidthInTiles - 20)) + 10;
        for (let y = WORLD_LAYERS.SPACE_END_Y; y < WORLD_LAYERS.SURFACE_LEVEL + 20; y++) {
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
    
    for (let i = 0; i < (generation.chestCount || 0); i++) {
        const x = Math.floor(SeededRandom.random() * worldWidthInTiles);
        const y = WORLD_LAYERS.SURFACE_LEVEL + 5 + Math.floor(SeededRandom.random() * (WORLD_LAYERS.CORE_START_Y - WORLD_LAYERS.SURFACE_LEVEL - 10));
        if (game.tileMap[y]?.[x] === TILE.AIR) {
            game.chests.push({ x: x * tileSize, y: y * tileSize, w: 16, h: 16, items: [], type: randomChestType() });
        }
    }
}
