import { SeededRandom } from './seededRandom.js';
import { Perlin } from './perlin.js';
import { Slime, Frog, Golem } from './enemy.js';
import { PNJ } from './PNJ.js';
import { generatePNJ } from './generateurPNJ.js';


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

function generateColumns(game, config, startX, width) {
    const worldHeightInTiles = game.tileMap.length;
    const surfaceLevel = Math.floor(worldHeightInTiles * 0.3); // Surface plus haute
    const { tileSize } = config;

    console.log(`Génération colonnes ${startX} à ${startX + width}, surface à ${surfaceLevel}`);

    for (let x = startX; x < startX + width; x++) {
        // Génération de terrain simple et fiable
        const terrainVariation = Math.floor(Perlin.get(x * 0.02, 0) * 8); // Variation plus douce
        const groundY = Math.max(10, surfaceLevel + terrainVariation); // Minimum à y=10
        
        console.log(`Colonne ${x}: groundY=${groundY}`);
        
        // S'assurer que la colonne x existe dans toutes les lignes
        for (let y = 0; y < worldHeightInTiles; y++) {
            if (!game.tileMap[y]) {
                console.error(`Ligne ${y} manquante dans tileMap`);
                continue;
            }
            
            if (y < groundY) {
                // Ciel - laisser vide (AIR)
                if (y < 20 && Perlin.get(x * 0.03, y * 0.03) > 0.4) {
                    game.tileMap[y][x] = TILE.CLOUD; // Quelques nuages
                } else {
                    game.tileMap[y][x] = TILE.AIR;
                }
            } else if (y === groundY) {
                // Surface
                game.tileMap[y][x] = TILE.GRASS;
            } else if (y < groundY + 5) {
                // Couche de terre
                game.tileMap[y][x] = TILE.DIRT;
            } else if (y < worldHeightInTiles * 0.7) {
                // Couche de pierre avec minerais occasionnels
                const oreChance = SeededRandom.random();
                if (oreChance < 0.02) {
                    game.tileMap[y][x] = TILE.COAL;
                } else if (oreChance < 0.03) {
                    game.tileMap[y][x] = TILE.IRON;
                } else if (oreChance < 0.035) {
                    game.tileMap[y][x] = TILE.GOLD;
                } else {
                    game.tileMap[y][x] = TILE.STONE;
                }
            } else if (y < worldHeightInTiles * 0.9) {
                // Couches profondes
                game.tileMap[y][x] = TILE.OBSIDIAN;
            } else if (y < worldHeightInTiles - 1) {
                // Enfer
                const hellNoise = Perlin.get(x * 0.1, y * 0.1);
                if (hellNoise > 0.3) {
                    game.tileMap[y][x] = TILE.LAVA;
                } else {
                    game.tileMap[y][x] = TILE.HELLSTONE;
                }
            } else {
                // Bedrock au fond
                game.tileMap[y][x] = TILE.BEDROCK;
            }
        }

        // Génération d'arbres simplifiée
        if (SeededRandom.random() < 0.03) {
            for (let y = 10; y < worldHeightInTiles; y++) {
                if (
                    game.tileMap[y]?.[x] === TILE.GRASS &&
                    (game.tileMap[y - 1]?.[x] === TILE.AIR || game.tileMap[y - 1]?.[x] === undefined)
                ) {
                    const treeHeight = 5 + Math.floor(SeededRandom.random() * 5);
                    for (let j = 0; j < treeHeight; j++) {
                        if (y - 1 - j > 0) game.tileMap[y - 1 - j][x] = TILE.OAK_WOOD;
                    }
                    const leafRadius = 3;
                    const leafCenterY = y - treeHeight;
                    for (let ly = -leafRadius; ly <= leafRadius; ly++) {
                        for (let lx = -leafRadius; lx <= leafRadius; lx++) {
                            if (Math.hypot(lx, ly) < leafRadius + 0.5) {
                                const currentX = x + lx;
                                const currentY = leafCenterY + ly;
                                if (game.tileMap[currentY]?.[currentX] === TILE.AIR || game.tileMap[currentY]?.[currentX] === undefined) {
                                    game.tileMap[currentY][currentX] = TILE.OAK_LEAVES;
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }

        if (SeededRandom.random() < 0.02) {
            const enemyTypes = [Slime, Frog, Golem];
            for (let y = 0; y < worldHeightInTiles; y++) {
                if (game.tileMap[y]?.[x] > TILE.AIR && game.tileMap[y - 1]?.[x] === TILE.AIR) {
                    const EnemyType = enemyTypes[Math.floor(SeededRandom.random() * enemyTypes.length)];
                    game.enemies.push(new EnemyType(x * tileSize, (y - 2) * tileSize, config));
                    break;
                }
            }
        }

        if (SeededRandom.random() < 0.005) {
            for (let y = 0; y < worldHeightInTiles; y++) {
                if (game.tileMap[y]?.[x] > TILE.AIR && game.tileMap[y - 1]?.[x] === TILE.AIR) {
                    game.pnjs.push(new PNJ(x * tileSize, (y - 2) * tileSize, config, generatePNJ()));
                    break;
                }
            }
        }
    }
}

export function generateLevel(game, config) {
    SeededRandom.setSeed(config.seed || Date.now());
    Perlin.seed();

    const { worldWidth = 4096, worldHeight, tileSize } = config;
    const worldHeightInTiles = Math.floor(worldHeight / tileSize);

    // Initialiser le tileMap avec la bonne largeur
    const initialWidth = Math.floor(worldWidth / tileSize) || 512; // Plus large par défaut
    game.tileMap = [];
    
    // Créer chaque ligne individuellement pour éviter les références partagées
    for (let y = 0; y < worldHeightInTiles; y++) {
        game.tileMap[y] = new Array(initialWidth).fill(TILE.AIR);
    }
    
    game.generatedRange = { min: 0, max: initialWidth };

    console.log(`Initialisation tileMap: ${worldHeightInTiles} x ${initialWidth}`);
    
    // Test simple : remplir quelques colonnes manuellement pour déboguer
    console.log("Génération de test...");
    for (let x = 0; x < Math.min(10, initialWidth); x++) {
        for (let y = 0; y < worldHeightInTiles; y++) {
            if (y < 30) {
                game.tileMap[y][x] = TILE.AIR;
            } else if (y === 30) {
                game.tileMap[y][x] = TILE.GRASS;
            } else if (y < 35) {
                game.tileMap[y][x] = TILE.DIRT;
            } else {
                game.tileMap[y][x] = TILE.STONE;
            }
        }
    }
    
    generateColumns(game, config, 10, initialWidth - 10);
    
    // Vérifier que le monde a été généré
    let solidTiles = 0;
    for (let y = 0; y < worldHeightInTiles; y++) {
        for (let x = 0; x < initialWidth; x++) {
            if (game.tileMap[y][x] > TILE.AIR) {
                solidTiles++;
            }
        }
    }
    console.log(`Monde généré: ${solidTiles} blocs solides sur ${worldHeightInTiles * initialWidth} total`);
    config.worldWidth = initialWidth * tileSize;
}

export function ensureWorldColumns(game, config, fromX, toX) {
    const start = Math.max(0, Math.floor(fromX));
    const end = Math.max(start, Math.floor(toX));
    const worldHeightInTiles = game.tileMap.length;
    const currentWidth = game.tileMap[0]?.length || 0;

    console.log(`ensureWorldColumns: ${start} à ${end}, largeur actuelle: ${currentWidth}`);

    // Étendre le tableau vers la droite si nécessaire
    if (end >= currentWidth) {
        const newWidth = Math.max(end + 50, currentWidth * 2); // Ajouter une marge
        console.log(`Extension du monde vers la droite: nouvelle largeur ${newWidth}`);
        
        for (let y = 0; y < worldHeightInTiles; y++) {
            // Étendre chaque ligne
            const currentRowLength = game.tileMap[y].length;
            const columnsToAdd = newWidth - currentRowLength;
            if (columnsToAdd > 0) {
                const newColumns = Array(columnsToAdd).fill(TILE.AIR);
                game.tileMap[y] = game.tileMap[y].concat(newColumns);
            }
        }
        
        // Générer le contenu pour les nouvelles colonnes
        const startGeneration = Math.max(game.generatedRange.max, currentWidth);
        const widthToGenerate = newWidth - startGeneration;
        if (widthToGenerate > 0) {
            generateColumns(game, config, startGeneration, widthToGenerate);
            game.generatedRange.max = newWidth;
        }
    }

    // Étendre le tableau vers la gauche si nécessaire (plus complexe)
    if (start < game.generatedRange.min) {
        const columnsToAdd = game.generatedRange.min - start;
        console.log(`Extension du monde vers la gauche: ${columnsToAdd} colonnes`);
        
        for (let y = 0; y < worldHeightInTiles; y++) {
            const newColumns = Array(columnsToAdd).fill(TILE.AIR);
            game.tileMap[y] = newColumns.concat(game.tileMap[y]);
        }
        generateColumns(game, config, start, columnsToAdd);
        game.generatedRange.min = start;
    }

    config.worldWidth = (game.generatedRange.max - game.generatedRange.min) * config.tileSize;
}
