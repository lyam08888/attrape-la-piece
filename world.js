import { Slime, Frog, Golem } from './enemy.js';
import { randomChestType } from './chestGenerator.js';

// Perlin Noise Generator (inchangé)
const Perlin = {
    rand_vect: function(){ let theta = Math.random()*2*Math.PI; return {x:Math.cos(theta), y:Math.sin(theta)}; },
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
Perlin.seed();

// --- NOUVEAUX TYPES DE BLOCS ---
export const TILE = { 
    AIR: 0, 
    GRASS: 1, 
    DIRT: 2, 
    STONE: 3, 
    WOOD: 4, 
    LEAVES: 5, 
    COAL: 6, 
    IRON: 7,
    // Nouveaux blocs
    BEDROCK: 8,
    WATER: 9,
    CRYSTAL: 10,
    GLOW_MUSHROOM: 11,
};

export function generateLevel(game, levelConfig, gameSettings) {
    const { worldWidth, worldHeight, tileSize, generation } = levelConfig;
    const worldWidthInTiles = Math.floor(worldWidth / tileSize);
    const worldHeightInTiles = Math.floor(worldHeight / tileSize);

    // Initialisation des tableaux du jeu
    game.decorations = []; game.coins = []; game.bonuses = []; game.chests = [];
    game.checkpoints = []; game.enemies = []; game.fallingBlocks = []; game.collectibles = [];
    game.tileMap = Array(worldHeightInTiles).fill(0).map(() => Array(worldWidthInTiles).fill(TILE.AIR));
    
    // --- NOUVELLES CONSTANTES DE GÉNÉRATION ---
    const SURFACE_LEVEL = Math.floor(worldHeightInTiles / 3);
    const UNDERGROUND_START_Y = SURFACE_LEVEL + 20;
    const CORE_START_Y = worldHeightInTiles * 0.6;
    const NUCLEUS_START_Y = worldHeightInTiles * 0.85;

    // === ÉTAPE 1: GÉNÉRATION DU TERRAIN DE BASE (SURFACE) ===
    for (let x = 0; x < worldWidthInTiles; x++) {
        const height = Math.floor(Perlin.get(x * 0.05, 0) * 10);
        const ySurface = SURFACE_LEVEL + height;
        for (let y = ySurface; y < worldHeightInTiles; y++) {
            if (y === ySurface) game.tileMap[y][x] = TILE.GRASS;
            else if (y < ySurface + 6) game.tileMap[y][x] = TILE.DIRT;
            else game.tileMap[y][x] = TILE.STONE;
        }
    }

    // === ÉTAPE 2: GÉNÉRATION DES GROTTES SOUTERRAINES ===
    const caveNoiseScale = 0.07;
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = UNDERGROUND_START_Y; y < NUCLEUS_START_Y; y++) {
            if (game.tileMap[y][x] === TILE.STONE) {
                // Utilisation de deux bruits pour des grottes plus variées
                const noise1 = Perlin.get(x * caveNoiseScale, y * caveNoiseScale);
                const noise2 = Perlin.get(x * 0.04, y * 0.04);
                if (noise1 > 0.35 || noise2 > 0.4) {
                    game.tileMap[y][x] = TILE.AIR;
                }
                // Ajout des minerais
                else if (Math.random() < 0.05) game.tileMap[y][x] = TILE.COAL;
                else if (Math.random() < 0.03) game.tileMap[y][x] = TILE.IRON;
            }
        }
    }

    // === ÉTAPE 3: GÉNÉRATION DU CŒUR DU MONDE (GÉODE DE CRISTAL) ===
    const coreRadius = (NUCLEUS_START_Y - CORE_START_Y) / 2;
    const coreCenterX = worldWidthInTiles / 2;
    const coreCenterY = CORE_START_Y + coreRadius;
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = CORE_START_Y; y < NUCLEUS_START_Y; y++) {
            const dist = Math.hypot(x - coreCenterX, y - coreCenterY);
            const noise = Perlin.get(x * 0.02, y * 0.02) * coreRadius * 0.5;
            if (dist < coreRadius + noise) {
                 if (game.tileMap[y][x] !== TILE.AIR) {
                    game.tileMap[y][x] = TILE.CRYSTAL;
                 }
                 // Ajouter des champignons lumineux sur le sol de la géode
                 if (game.tileMap[y+1]?.[x] === TILE.CRYSTAL && game.tileMap[y][x] === TILE.AIR && Math.random() < 0.1) {
                    game.tileMap[y][x] = TILE.GLOW_MUSHROOM;
                 }
            }
        }
    }
    
    // === ÉTAPE 4: GÉNÉRATION DU NOYAU OCÉANIQUE ===
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = NUCLEUS_START_Y; y < worldHeightInTiles; y++) {
            game.tileMap[y][x] = TILE.WATER;
        }
    }

    // === ÉTAPE 5: AJOUT DE LA BEDROCK ===
    for (let x = 0; x < worldWidthInTiles; x++) {
        // Couche supérieure de Bedrock
        for (let y = UNDERGROUND_START_Y - 5; y < UNDERGROUND_START_Y; y++) {
            if (Perlin.get(x * 0.1, y * 0.1) > -0.2) game.tileMap[y][x] = TILE.BEDROCK;
        }
        // Couche inférieure de Bedrock
        for (let y = worldHeightInTiles - 5; y < worldHeightInTiles; y++) {
            game.tileMap[y][x] = TILE.BEDROCK;
        }
    }

    // === ÉTAPE 6: PLACEMENT DES DÉCORS (ARBRES, BUISSONS, ETC.) ===
    // (Cette partie est principalement pour la surface)
    for (let i = 0; i < generation.treeCount; i++) {
        const x = Math.floor(Math.random() * (worldWidthInTiles - 20)) + 10;
        for (let y = 1; y < UNDERGROUND_START_Y; y++) {
            if (game.tileMap[y][x] === TILE.GRASS && game.tileMap[y - 1][x] === TILE.AIR) {
                const treeHeight = 5 + Math.floor(Math.random() * 5);
                for (let j = 1; j <= treeHeight; j++) {
                    if (y - j > 0) game.tileMap[y - j][x] = TILE.WOOD;
                }
                const canopySize = 2;
                for (let ly = -canopySize; ly <= canopySize; ly++) {
                    for (let lx = -canopySize; lx <= canopySize; lx++) {
                        if (lx === 0 && ly < 0) continue;
                        if (Math.random() > 0.4) {
                            const leafY = y - treeHeight + ly;
                            const leafX = x + lx;
                            if (game.tileMap[leafY]?.[leafX] === TILE.AIR) {
                                game.tileMap[leafY][leafX] = TILE.LEAVES;
                            }
                        }
                    }
                }
                break;
            }
        }
    }
    
    // Placement des buissons, coffres, etc. (inchangé mais limité à la surface/grottes supérieures)
    for (let i = 0; i < generation.bushCount; i++) {
        const x = Math.floor(Math.random() * worldWidthInTiles);
        for (let y = 1; y < UNDERGROUND_START_Y; y++) {
            if (game.tileMap[y][x] === TILE.GRASS && game.tileMap[y - 1][x] === TILE.AIR) {
                game.decorations.push({ x: x * tileSize, y: (y - 1) * tileSize, w: 16, h: 16, type: 'bush' });
                break;
            }
        }
    }
    for (let i = 0; i < (generation.chestCount || 0); i++) {
        const x = Math.floor(Math.random() * worldWidthInTiles);
        const y = SURFACE_LEVEL + 5 + Math.floor(Math.random() * (CORE_START_Y - SURFACE_LEVEL - 10));
        if (game.tileMap[y]?.[x] === TILE.AIR) {
            game.chests.push({ x: x * tileSize, y: y * tileSize, w: 16, h: 16, items: [], type: randomChestType() });
        }
    }

    // Le reste du placement des objets reste inchangé pour l'instant
    // ...
}
