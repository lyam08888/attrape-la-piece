// Test de génération du monde
import { WorldComplexSystem } from './worldComplexSystem.js';

// Test de génération
const worldSystem = new WorldComplexSystem({
    worldWidth: 128,
    worldHeight: 64,
    tileSize: 1
});

const tileMap = worldSystem.tileMap;
console.log('Dimensions de la carte:', tileMap.length, 'x', tileMap[0].length);

// Compter les types de tuiles
const tileCounts = {};
for (let y = 0; y < tileMap.length; y++) {
    for (let x = 0; x < tileMap[y].length; x++) {
        const tileType = tileMap[y][x];
        tileCounts[tileType] = (tileCounts[tileType] || 0) + 1;
    }
}

console.log('Types de tuiles générées:', tileCounts);

// Vérifier la couche surface (18% à 50% de la hauteur)
const surfaceStart = Math.floor(tileMap.length * 0.18);
const surfaceEnd = Math.floor(tileMap.length * 0.5);
console.log(`Couche surface: lignes ${surfaceStart} à ${surfaceEnd}`);

// Afficher quelques lignes de la surface
for (let y = surfaceStart; y < Math.min(surfaceStart + 5, tileMap.length); y++) {
    const line = tileMap[y].slice(0, 20).join(',');
    console.log(`Ligne ${y}: ${line}...`);
}