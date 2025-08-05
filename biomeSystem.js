// biomeSystem.js - Système de biomes avancé pour une génération de monde plus intéressante

export class BiomeSystem {
    constructor() {
        this.biomes = this.initializeBiomes();
    }

    initializeBiomes() {
        return {
            PLAINS: {
                name: 'Plaines',
                surfaceTile: 2, // GRASS
                subSurfaceTile: 3, // DIRT
                undergroundTile: 1, // STONE
                treeChance: 0.03,
                flowerChance: 0.02,
                oreChance: 0.01,
                color: '#90EE90',
                animals: ['rabbit', 'deer', 'fox', 'butterfly']
            },
            FOREST: {
                name: 'Forêt',
                surfaceTile: 2, // GRASS
                subSurfaceTile: 3, // DIRT
                undergroundTile: 1, // STONE
                treeChance: 0.15,
                flowerChance: 0.01,
                oreChance: 0.008,
                color: '#228B22',
                animals: ['rabbit', 'deer', 'fox', 'bear', 'owl', 'squirrel']
            },
            DESERT: {
                name: 'Désert',
                surfaceTile: 121, // SAND
                subSurfaceTile: 121, // SAND
                undergroundTile: 1, // STONE
                treeChance: 0.001, // Cactus
                flowerChance: 0,
                oreChance: 0.015,
                color: '#F4A460',
                animals: ['mouse', 'beetle']
            },
            MOUNTAIN: {
                name: 'Montagne',
                surfaceTile: 1, // STONE
                subSurfaceTile: 1, // STONE
                undergroundTile: 1, // STONE
                treeChance: 0.01,
                flowerChance: 0,
                oreChance: 0.03,
                color: '#696969',
                animals: ['eagle', 'bear', 'mole']
            },
            OCEAN: {
                name: 'Océan',
                surfaceTile: 0, // WATER (AIR pour simulation)
                subSurfaceTile: 121, // SAND
                undergroundTile: 1, // STONE
                treeChance: 0,
                flowerChance: 0,
                oreChance: 0.005,
                color: '#4169E1',
                animals: ['fish', 'salmon', 'shark', 'dolphin']
            },
            SWAMP: {
                name: 'Marécage',
                surfaceTile: 3, // DIRT
                subSurfaceTile: 3, // DIRT
                undergroundTile: 1, // STONE
                treeChance: 0.08,
                flowerChance: 0.03,
                oreChance: 0.005,
                color: '#556B2F',
                animals: ['frog', 'bat', 'worm']
            }
        };
    }

    getBiomeAt(x, y, width, height) {
        // Utiliser du bruit pour déterminer le biome
        const biomeNoise = this.noise(x * 0.001, y * 0.001);
        const temperatureNoise = this.noise(x * 0.002, 0);
        const humidityNoise = this.noise(0, y * 0.002);
        
        // Facteur de distance du centre pour les océans
        const centerX = width / 2;
        const centerY = height / 2;
        const distanceFromCenter = Math.hypot(x - centerX, y - centerY) / Math.max(width, height);
        
        // Océan sur les bords
        if (distanceFromCenter > 0.4) {
            return this.biomes.OCEAN;
        }
        
        // Altitude basée sur la position Y
        const altitude = 1 - (y / height);
        
        // Montagnes en altitude
        if (altitude > 0.8 && biomeNoise > 0.3) {
            return this.biomes.MOUNTAIN;
        }
        
        // Désert dans les zones chaudes et sèches
        if (temperatureNoise > 0.6 && humidityNoise < 0.3) {
            return this.biomes.DESERT;
        }
        
        // Marécage dans les zones humides et basses
        if (humidityNoise > 0.7 && altitude < 0.3) {
            return this.biomes.SWAMP;
        }
        
        // Forêt dans les zones tempérées et humides
        if (temperatureNoise > 0.2 && temperatureNoise < 0.7 && humidityNoise > 0.4) {
            return this.biomes.FOREST;
        }
        
        // Plaines par défaut
        return this.biomes.PLAINS;
    }

    generateBiomeMap(width, height) {
        const biomeMap = [];
        
        for (let y = 0; y < height; y++) {
            biomeMap[y] = [];
            for (let x = 0; x < width; x++) {
                biomeMap[y][x] = this.getBiomeAt(x, y, width, height);
            }
        }
        
        return biomeMap;
    }

    generateStructures(tileMap, biomeMap, width, height) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const biome = biomeMap[y][x];
                
                // Générer des arbres
                if (Math.random() < biome.treeChance) {
                    this.generateTree(tileMap, x, y, biome, width, height);
                }
                
                // Générer des fleurs
                if (Math.random() < biome.flowerChance) {
                    this.generateFlower(tileMap, x, y, width, height);
                }
            }
        }
    }

    generateTree(tileMap, x, y, biome, width, height) {
        // Vérifier si on peut placer un arbre
        if (y <= 0 || y >= height - 1 || x <= 0 || x >= width - 1) return;
        if (tileMap[y][x] === 0) return; // Pas d'arbre dans l'air
        
        const treeHeight = 3 + Math.floor(Math.random() * 4);
        
        // Tronc
        for (let i = 1; i <= treeHeight; i++) {
            if (y - i >= 0 && tileMap[y - i][x] === 0) {
                tileMap[y - i][x] = 1; // STONE comme tronc temporaire
            }
        }
        
        // Feuillage
        const leafY = y - treeHeight;
        const leafRadius = 2;
        
        for (let dy = -leafRadius; dy <= 1; dy++) {
            for (let dx = -leafRadius; dx <= leafRadius; dx++) {
                const leafPosY = leafY + dy;
                const leafPosX = x + dx;
                
                if (leafPosY >= 0 && leafPosY < height && 
                    leafPosX >= 0 && leafPosX < width) {
                    
                    const distance = Math.abs(dx) + Math.abs(dy);
                    if (distance <= leafRadius && Math.random() < 0.8) {
                        if (tileMap[leafPosY][leafPosX] === 0) {
                            tileMap[leafPosY][leafPosX] = 2; // GRASS comme feuilles
                        }
                    }
                }
            }
        }
    }

    generateFlower(tileMap, x, y, width, height) {
        // Les fleurs poussent sur l'herbe
        if (y > 0 && tileMap[y][x] === 2 && tileMap[y - 1][x] === 0) {
            // Placer une fleur (utiliser un bloc spécial ou laisser comme décoration)
            // Pour l'instant, on peut utiliser un bloc coloré
        }
    }

    // Fonction de bruit simple
    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n));
    }

    // Obtenir la couleur du biome pour l'affichage
    getBiomeColor(biome) {
        return biome.color;
    }

    // Obtenir les animaux du biome
    getBiomeAnimals(biome) {
        return biome.animals || [];
    }
}