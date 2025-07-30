import { Slime, Frog, Golem } from './enemy.js';

// Générateur de bruit de Perlin pour un terrain plus naturel
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

// ID des tuiles pour une meilleure lisibilité
export const TILE = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5, COAL: 6, IRON: 7 };

export function generateLevel(game, levelConfig, gameSettings) {
    const { worldWidth, worldHeight, tileSize, generation } = levelConfig;
    const worldWidthInTiles = Math.floor(worldWidth / tileSize);
    const worldHeightInTiles = Math.floor(worldHeight / tileSize);

    game.tileMap = Array(worldHeightInTiles).fill(0).map(() => Array(worldWidthInTiles).fill(TILE.AIR));
    
    // 1. Génération du terrain de surface
    const surfaceLevel = Math.floor(worldHeightInTiles / 2.5);
    for (let x = 0; x < worldWidthInTiles; x++) {
        const height = Math.floor(Perlin.get(x * 0.05, 0) * 10);
        const ySurface = surfaceLevel + height;
        for (let y = ySurface; y < worldHeightInTiles; y++) {
            if (y === ySurface) game.tileMap[y][x] = TILE.GRASS;
            else if (y < ySurface + 6) game.tileMap[y][x] = TILE.DIRT;
            else game.tileMap[y][x] = TILE.STONE;
        }
    }

    // 2. Génération des grottes et des minerais
    const caveNoiseScale = 0.07;
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = surfaceLevel + 6; y < worldHeightInTiles; y++) {
            if (game.tileMap[y][x] === TILE.STONE) {
                if (Perlin.get(x * caveNoiseScale, y * caveNoiseScale) > 0.35) game.tileMap[y][x] = TILE.AIR;
                else if (Math.random() < 0.05) game.tileMap[y][x] = TILE.COAL;
                else if (Math.random() < 0.03) game.tileMap[y][x] = TILE.IRON;
            }
        }
    }

    // 3. Génération des arbres
    for (let i = 0; i < generation.treeCount; i++) {
        const x = Math.floor(Math.random() * (worldWidthInTiles - 20)) + 10;
        for (let y = 0; y < worldHeightInTiles - 1; y++) {
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
                            if (game.tileMap[leafY] && game.tileMap[leafY][leafX] === TILE.AIR) {
                                game.tileMap[leafY][leafX] = TILE.LEAVES;
                            }
                        }
                    }
                }
                break; 
            }
        }
    }

    // 4. Placement des ennemis
    for (let i = 0; i < generation.enemyCount; i++) {
        const x = Math.floor(Math.random() * worldWidthInTiles);
        const y = surfaceLevel + Math.floor(Math.random() * (worldHeightInTiles - surfaceLevel - 5));
        
        if (game.tileMap[y] && game.tileMap[y][x] !== TILE.AIR && game.tileMap[y-1] && game.tileMap[y-1][x] === TILE.AIR) {
            const enemyType = ['slime', 'frog', 'golem'][Math.floor(Math.random() * 3)];
            let enemyClass;
            if (enemyType === 'slime') enemyClass = Slime;
            else if (enemyType === 'frog') enemyClass = Frog;
            else if (enemyType === 'golem') enemyClass = Golem;
            game.enemies.push(new enemyClass(x * tileSize, (y - 1) * tileSize, game.config));
        }
    }
}
