import { Slime, Frog, Golem } from './enemy.js';

// --- NOUVEAU: Générateur de bruit de Perlin simple ---
// Utilisé pour créer un terrain plus naturel et des grottes
const Perlin = {
    rand_vect: function(){
        let theta = Math.random() * 2 * Math.PI;
        return {x: Math.cos(theta), y: Math.sin(theta)};
    },
    dot_prod_grid: function(x, y, vx, vy){
        let g_vect;
        let d_vect = {x: x - vx, y: y - vy};
        if (this.gradients[[vx,vy]]){
            g_vect = this.gradients[[vx,vy]];
        } else {
            g_vect = this.rand_vect();
            this.gradients[[vx,vy]] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    },
    smootherstep: function(x){
        return 6*x**5 - 15*x**4 + 10*x**3;
    },
    interp: function(x, a, b){
        return a + this.smootherstep(x) * (b-a);
    },
    seed: function(){
        this.gradients = {};
        this.memory = {};
    },
    get: function(x, y) {
        if (this.memory.hasOwnProperty([x,y]))
            return this.memory[[x,y]];
        let xf = Math.floor(x);
        let yf = Math.floor(y);
        //interpolate
        let tl = this.dot_prod_grid(x, y, xf,   yf);
        let tr = this.dot_prod_grid(x, y, xf+1, yf);
        let bl = this.dot_prod_grid(x, y, xf,   yf+1);
        let br = this.dot_prod_grid(x, y, xf+1, yf+1);
        let xt = this.interp(x-xf, tl, tr);
        let xb = this.interp(x-xf, bl, br);
        let v = this.interp(y-yf, xt, xb);
        this.memory[[x,y]] = v;
        return v;
    }
}
Perlin.seed();

// --- Fonction de génération de niveau entièrement réécrite ---
export function generateLevel(game, levelConfig, gameSettings) {
    const { worldWidth, worldHeight, tileSize } = levelConfig;
    const worldWidthInTiles = Math.floor(worldWidth / tileSize);
    const worldHeightInTiles = Math.floor(worldHeight / tileSize);

    // Initialisation de la carte de tuiles (tilemap)
    game.tileMap = Array(worldHeightInTiles).fill(0).map(() => Array(worldWidthInTiles).fill(0));
    
    // ID des tuiles
    const TILE = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COAL: 4, IRON: 5 };

    // 1. Génération du terrain de surface
    const surfaceLevel = Math.floor(worldHeightInTiles / 2.5);
    for (let x = 0; x < worldWidthInTiles; x++) {
        const height = Math.floor(Perlin.get(x * 0.05, 0) * 10);
        const ySurface = surfaceLevel + height;

        for (let y = 0; y < worldHeightInTiles; y++) {
            if (y > ySurface) {
                if (y === ySurface + 1) {
                    game.tileMap[y][x] = TILE.GRASS;
                } else if (y < ySurface + 6) {
                    game.tileMap[y][x] = TILE.DIRT;
                } else {
                    game.tileMap[y][x] = TILE.STONE;
                }
            }
        }
    }

    // 2. Génération des grottes et des minerais
    const caveNoiseScale = 0.07;
    for (let x = 0; x < worldWidthInTiles; x++) {
        for (let y = surfaceLevel + 6; y < worldHeightInTiles; y++) {
            if (game.tileMap[y][x] === TILE.STONE) {
                const noiseValue = Perlin.get(x * caveNoiseScale, y * caveNoiseScale);
                if (noiseValue > 0.35) { // Creuse les grottes
                    game.tileMap[y][x] = TILE.AIR;
                } else if (Math.random() < 0.05) { // Ajoute du charbon
                    game.tileMap[y][x] = TILE.COAL;
                } else if (Math.random() < 0.03) { // Ajoute du fer
                    game.tileMap[y][x] = TILE.IRON;
                }
            }
        }
    }

    // 3. Placement des ennemis
    for (let i = 0; i < generation.enemyCount; i++) {
        const x = Math.floor(Math.random() * worldWidthInTiles);
        const y = surfaceLevel + Math.floor(Math.random() * (worldHeightInTiles - surfaceLevel - 5));
        
        // S'assure que l'ennemi apparaît sur une tuile solide avec de l'air au-dessus
        if (game.tileMap[y][x] !== TILE.AIR && game.tileMap[y-1][x] === TILE.AIR && game.tileMap[y-2][x] === TILE.AIR) {
            const enemyType = ['slime', 'frog', 'golem'][Math.floor(Math.random() * 3)];
            let enemyClass;
            if (enemyType === 'slime') enemyClass = Slime;
            else if (enemyType === 'frog') enemyClass = Frog;
            else if (enemyType === 'golem') enemyClass = Golem;
            game.enemies.push(new enemyClass(x * tileSize, (y - 1) * tileSize, game.config));
        }
    }
}
