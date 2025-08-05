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
            { name: 'space', yStart: 0, yEnd: 0.04, biome: 'SPACE' },
            { name: 'sky', yStart: 0.04, yEnd: 0.10, biome: 'CLOUD_REALM' },
            { name: 'paradise', yStart: 0.10, yEnd: 0.18, biome: 'DIVINE_PEAKS' },
            { name: 'surface', yStart: 0.18, yEnd: 0.5, biome: 'ENCHANTED_FOREST' },
            { name: 'underground', yStart: 0.5, yEnd: 0.8, biome: 'DEEP_CAVERNS' },
            { name: 'core', yStart: 0.8, yEnd: 0.95, biome: 'CRYSTAL_CORE' },
            { name: 'hell', yStart: 0.95, yEnd: 1.0, biome: 'INFERNAL_DEPTHS' }
        ];
    }

    generateComplexWorld() {
        const width = Math.floor(this.config.worldWidth / this.config.tileSize);
        const height = Math.floor(this.config.worldHeight / this.config.tileSize);
        const tileMap = Array.from({ length: height }, () => Array(width).fill(0));
        
        for (let y = 0; y < height; y++) {
            const yNorm = y / height;
            const layer = this.getLayerForY(yNorm);
            for (let x = 0; x < width; x++) {
                // Couches principales
                switch (layer.name) {
                    case 'space': tileMap[y][x] = 0; break; // AIR
                    case 'sky': tileMap[y][x] = 106; break; // CLOUD_STONE
                    case 'paradise': tileMap[y][x] = 100; break; // DIVINE_STONE
                    case 'surface':
                        // Bande centrale toujours herbe (terre ferme)
                        if (x > width * 0.3 && x < width * 0.7) tileMap[y][x] = 2;
                        else if (yNorm < 0.22 && Math.random() < 0.2) tileMap[y][x] = 121; // Sable (plage)
                        else if (x < width * 0.15 || x > width * 0.85) tileMap[y][x] = 0; // Océan (AIR = eau visuelle)
                        else if (Math.random() < 0.04) tileMap[y][x] = 0; // Lacs/rivières
                        else tileMap[y][x] = 2; // GRASS
                        break;
                    case 'underground':
                        if (Math.random() < 0.08) tileMap[y][x] = 0; // Caverne
                        else if (Math.random() < 0.03) tileMap[y][x] = 121; // Sable
                        else if (Math.random() < 0.03) tileMap[y][x] = 0; // Lacs souterrains (AIR = eau visuelle)
                        else tileMap[y][x] = 1; // STONE
                        break;
                    case 'core':
                        // Noyau liquide (eau/lave)
                        tileMap[y][x] = (Math.random() < 0.5) ? 112 : 0; // CRYSTAL_STONE ou AIR (eau/lave)
                        break;
                    case 'hell': tileMap[y][x] = 130; break; // HELLSTONE
                }
            }
        }
        return tileMap;
    }

    getLayerForY(yNorm) {
        return this.layers.find(l => yNorm >= l.yStart && yNorm < l.yEnd) || this.layers[3];
    }

    triggerDestruction(x, y, radius = 3) {
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
