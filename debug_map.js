// debug_map.js - Génère une image PNG de la map complète pour visualisation
const { createCanvas } = require('canvas');
const fs = require('fs');
const { WorldComplexSystem } = require('./worldComplexSystem.js');

const TILE_COLORS = {
    0: '#000', // AIR
    1: '#888', // STONE
    2: '#32CD32', // GRASS
    3: '#8B4513', // DIRT
    100: '#F0F8FF', // DIVINE_STONE
    103: '#BFFF00', // BLESSED_GRASS
    106: '#E0FFFF', // CLOUD
    112: '#9370DB', // CRYSTAL
    121: '#F4E285', // SAND
    130: '#8B0000', // HELLSTONE
};

const config = {
    worldWidth: 2048,
    worldHeight: 1024,
    tileSize: 1
};

const worldSystem = new WorldComplexSystem(config);
const tileMap = worldSystem.tileMap;
const width = tileMap[0].length;
const height = tileMap.length;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const t = tileMap[y][x];
        ctx.fillStyle = TILE_COLORS[t] || '#ccc';
        ctx.fillRect(x, y, 1, 1);
    }
}

const out = fs.createWriteStream('assets/map_debug.png');
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => {
    console.log('✅ Image de la map générée : assets/map_debug.png');
});
