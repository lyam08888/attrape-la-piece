// worldComplexSystem.js - Système de monde complexe, multi-couches, destructible et évolutif

import { BiomeSystem } from './biomeSystem.js';

export class WorldComplexSystem {
    constructor(config) {
        this.config = config;
        this.layers = this.initializeLayers();
        this.biomeSystem = new BiomeSystem();
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
        
        // Génération de terrain avec bruit et biomes pour un aspect plus naturel
        const surfaceHeight = this.generateSurfaceHeights(width, height);
        const biomeMap = this.biomeSystem.generateBiomeMap(width, height);
        
        for (let x = 0; x < width; x++) {
            const surfaceY = surfaceHeight[x];
            
            for (let y = 0; y < height; y++) {
                const yNorm = y / height;
                const biome = biomeMap[y] ? biomeMap[y][x] : this.biomeSystem.biomes.PLAINS;
                
                // Génération basée sur la hauteur de surface et le biome
                if (y < surfaceY - 20) {
                    // Ciel
                    if (yNorm < 0.04) {
                        tileMap[y][x] = 0; // Espace
                    } else if (yNorm < 0.10) {
                        // Nuages occasionnels
                        if (Math.random() < 0.05 && this.noise(x * 0.1, y * 0.1) > 0.4) {
                            tileMap[y][x] = 106; // CLOUD
                        } else {
                            tileMap[y][x] = 0; // AIR
                        }
                    } else if (yNorm < 0.18) {
                        // Îles flottantes occasionnelles
                        if (this.noise(x * 0.03, y * 0.03) > 0.7) {
                            tileMap[y][x] = 100; // DIVINE_STONE
                        } else {
                            tileMap[y][x] = 0; // AIR
                        }
                    } else {
                        tileMap[y][x] = 0; // AIR
                    }
                } else if (y < surfaceY) {
                    // Surface basée sur le biome
                    const distanceFromSurface = surfaceY - y;
                    
                    if (distanceFromSurface <= 1) {
                        tileMap[y][x] = biome.surfaceTile;
                    } else if (distanceFromSurface <= 5) {
                        tileMap[y][x] = biome.subSurfaceTile;
                    } else {
                        tileMap[y][x] = biome.undergroundTile;
                    }
                } else {
                    // Souterrain
                    const depthRatio = (y - surfaceY) / (height - surfaceY);
                    
                    if (depthRatio < 0.2) {
                        // Couche de transition
                        if (Math.random() < 0.03) {
                            tileMap[y][x] = 0; // Petites cavernes
                        } else {
                            tileMap[y][x] = biome.undergroundTile;
                        }
                    } else if (depthRatio < 0.5) {
                        // Couche de pierre avec minerais
                        if (Math.random() < 0.06) {
                            tileMap[y][x] = 0; // Cavernes
                        } else if (Math.random() < biome.oreChance) {
                            tileMap[y][x] = 112; // CRYSTAL (minerai)
                        } else {
                            tileMap[y][x] = 1; // STONE
                        }
                    } else if (depthRatio < 0.8) {
                        // Couche profonde
                        if (Math.random() < 0.08) {
                            tileMap[y][x] = 0; // Cavernes profondes
                        } else if (Math.random() < 0.03) {
                            tileMap[y][x] = 112; // CRYSTAL
                        } else {
                            tileMap[y][x] = 1; // STONE
                        }
                    } else {
                        // Enfer
                        if (Math.random() < 0.04) {
                            tileMap[y][x] = 0; // Lacs de lave
                        } else {
                            tileMap[y][x] = 130; // HELLSTONE
                        }
                    }
                }
            }
        }
        
        // Générer des structures spéciales
        this.generateCaves(tileMap, width, height);
        this.generateOres(tileMap, width, height);
        
        // Générer des structures de biomes
        this.biomeSystem.generateStructures(tileMap, biomeMap, width, height);
        
        // Stocker la carte des biomes pour référence
        this.biomeMap = biomeMap;
        
        return tileMap;
    }
    
    generateSurfaceHeights(width, height) {
        const heights = [];
        const baseHeight = Math.floor(height * 0.3); // Surface à 30% de la hauteur
        
        for (let x = 0; x < width; x++) {
            // Utiliser du bruit pour créer des collines et vallées
            const noise1 = this.noise(x * 0.01, 0) * 30;
            const noise2 = this.noise(x * 0.005, 100) * 50;
            const noise3 = this.noise(x * 0.002, 200) * 20;
            
            const height = baseHeight + noise1 + noise2 + noise3;
            heights.push(Math.floor(Math.max(height, height * 0.2)));
        }
        
        return heights;
    }
    
    generateTree(tileMap, x, y, width, height) {
        const treeHeight = 3 + Math.floor(Math.random() * 4);
        
        // Tronc
        for (let i = 1; i <= treeHeight; i++) {
            if (y - i >= 0) {
                tileMap[y - i][x] = 1; // Utiliser STONE comme tronc temporairement
            }
        }
        
        // Feuillage
        const leafY = y - treeHeight;
        for (let dy = -2; dy <= 1; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (leafY + dy >= 0 && leafY + dy < height && 
                    x + dx >= 0 && x + dx < width) {
                    if (Math.abs(dx) + Math.abs(dy) <= 2 && Math.random() < 0.8) {
                        if (tileMap[leafY + dy][x + dx] === 0) {
                            tileMap[leafY + dy][x + dx] = 2; // GRASS comme feuilles
                        }
                    }
                }
            }
        }
    }
    
    generateCaves(tileMap, width, height) {
        const numCaves = 20;
        
        for (let i = 0; i < numCaves; i++) {
            const startX = Math.floor(Math.random() * width);
            const startY = Math.floor(height * 0.4 + Math.random() * height * 0.4);
            
            this.carveCave(tileMap, startX, startY, width, height, 50 + Math.random() * 100);
        }
    }
    
    carveCave(tileMap, startX, startY, width, height, length) {
        let x = startX;
        let y = startY;
        let direction = Math.random() * Math.PI * 2;
        
        for (let i = 0; i < length; i++) {
            const radius = 1 + Math.random() * 3;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = Math.floor(x + dx);
                    const ny = Math.floor(y + dy);
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        if (dx * dx + dy * dy <= radius * radius) {
                            tileMap[ny][nx] = 0; // AIR
                        }
                    }
                }
            }
            
            // Changer légèrement la direction
            direction += (Math.random() - 0.5) * 0.5;
            x += Math.cos(direction) * 2;
            y += Math.sin(direction) * 2;
            
            // Garder dans les limites
            x = Math.max(5, Math.min(width - 5, x));
            y = Math.max(height * 0.3, Math.min(height - 5, y));
        }
    }
    
    generateOres(tileMap, width, height) {
        // Générer différents types de minerais à différentes profondeurs
        const ores = [
            { type: 112, rarity: 0.01, minDepth: 0.4, maxDepth: 1.0 }, // CRYSTAL
            { type: 121, rarity: 0.005, minDepth: 0.6, maxDepth: 1.0 }, // SAND (or rare)
        ];
        
        for (let y = Math.floor(height * 0.3); y < height; y++) {
            const depthRatio = (y - height * 0.3) / (height * 0.7);
            
            for (let x = 0; x < width; x++) {
                if (tileMap[y][x] === 1) { // Seulement dans la pierre
                    for (const ore of ores) {
                        if (depthRatio >= ore.minDepth && depthRatio <= ore.maxDepth) {
                            if (Math.random() < ore.rarity) {
                                // Créer une veine de minerai
                                this.generateOreVein(tileMap, x, y, ore.type, width, height);
                            }
                        }
                    }
                }
            }
        }
    }
    
    generateOreVein(tileMap, startX, startY, oreType, width, height) {
        const veinSize = 2 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < veinSize; i++) {
            const x = startX + Math.floor((Math.random() - 0.5) * 4);
            const y = startY + Math.floor((Math.random() - 0.5) * 4);
            
            if (x >= 0 && x < width && y >= 0 && y < height && tileMap[y][x] === 1) {
                tileMap[y][x] = oreType;
            }
        }
    }
    
    // Fonction de bruit simple (remplace Perlin pour simplicité)
    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n));
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
