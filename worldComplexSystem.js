// worldComplexSystem.js - Système de monde complexe, multi-couches, destructible et évolutif

export class WorldComplexSystem {
    constructor(config) {
        this.config = config;
        this.layers = this.initializeLayers();
        this.tileMap = this.generateComplexWorld();
        this.destructionEvents = [];
    }

    initializeLayers() {
        return [
            { name: 'paradise', yStart: 0, yEnd: 0.1, biome: 'DIVINE_PEAKS' },
            { name: 'sky', yStart: 0.1, yEnd: 0.2, biome: 'CLOUD_REALM' },
            { name: 'surface', yStart: 0.2, yEnd: 0.5, biome: 'ENCHANTED_FOREST' },
            { name: 'underground', yStart: 0.5, yEnd: 0.8, biome: 'DEEP_CAVERNS' },
            { name: 'core', yStart: 0.8, yEnd: 0.95, biome: 'CRYSTAL_CORE' },
            { name: 'hell', yStart: 0.95, yEnd: 1.0, biome: 'INFERNAL_DEPTHS' }
        ];
    }

    generateComplexWorld() {
        const width = Math.floor(this.config.worldWidth / this.config.tileSize);
        const height = Math.floor(this.config.worldHeight / this.config.tileSize);
        const tileMap = Array.from({ length: height }, () => Array(width).fill(0));
        
        // Génération par couches
        for (let y = 0; y < height; y++) {
            const layer = this.getLayerForY(y / height);
            for (let x = 0; x < width; x++) {
                // Simple : chaque couche a un bloc principal
                switch (layer.name) {
                    case 'paradise': tileMap[y][x] = 100; break; // DIVINE_STONE
                    case 'sky': tileMap[y][x] = 106; break; // CLOUD_STONE
                    case 'surface': tileMap[y][x] = 2; break; // GRASS
                    case 'underground': tileMap[y][x] = 1; break; // STONE
                    case 'core': tileMap[y][x] = 112; break; // CRYSTAL_STONE
                    case 'hell': tileMap[y][x] = 130; break; // HELLSTONE
                }
                // Ajoute des cavernes, lacs, etc. (simple bruit)
                if (layer.name === 'underground' && Math.random() < 0.08) tileMap[y][x] = 0; // Caverne
                if (layer.name === 'surface' && Math.random() < 0.03) tileMap[y][x] = 121; // Sable
                if (layer.name === 'surface' && Math.random() < 0.02) tileMap[y][x] = 103; // BLESSED_GRASS
            }
        }
        return tileMap;
    }

    getLayerForY(yNorm) {
        return this.layers.find(l => yNorm >= l.yStart && yNorm < l.yEnd) || this.layers[2];
    }

    triggerDestruction(x, y, radius = 3) {
        // Explosion/minage : détruit les blocs dans un rayon
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (this.tileMap[ny] && this.tileMap[ny][nx] !== undefined) {
                    if (Math.hypot(dx, dy) <= radius) {
                        this.tileMap[ny][nx] = 0;
                    }
                }
            }
        }
        this.destructionEvents.push({ x, y, radius, time: Date.now() });
    }

    update(game, delta) {
        // Ici, on pourrait faire évoluer les biomes, la faune, etc.
    }
}
