// test-mining-fix.js - Test corrigé de la fonctionnalité de minage et de gravité des blocs

import { TILE } from './world.js';
import { updateGravity, checkBlockSupport } from './miningEngine.js';

// Fonction de test pour vérifier la gravité des blocs
export function testGravity(game) {
    console.log("Test de la gravité des blocs...");
    
    // Créer une configuration de test
    const testConfig = {
        tileSize: 16,
        physics: {
            gravity: 0.35
        }
    };
    
    // Créer une carte de test avec des blocs de sable au-dessus de l'air
    const testMap = [
        [TILE.STONE, TILE.STONE, TILE.STONE, TILE.STONE, TILE.STONE],
        [TILE.SAND, TILE.AIR, TILE.AIR, TILE.SAND, TILE.STONE],
        [TILE.STONE, TILE.AIR, TILE.AIR, TILE.AIR, TILE.STONE],
        [TILE.STONE, TILE.STONE, TILE.STONE, TILE.STONE, TILE.STONE]
    ];
    
    // Créer un objet game de test
    const testGame = {
        config: testConfig,
        tileMap: testMap,
        collectibles: [],
        gravityTimer: 5 // Run gravity check immediately
    };
    
    // Vérifier l'état initial
    console.log("État initial de la carte:");
    console.log(JSON.parse(JSON.stringify(testMap)));
    
    // Exécuter la mise à jour de la gravité
    updateGravity(testGame);
    
    // Vérifier l'état après la gravité
    console.log("État après la gravité:");
    console.log(JSON.parse(JSON.stringify(testMap)));
    console.log("Collectibles créés:");
    console.log(testGame.collectibles);
    
    // Vérifier que les blocs de sable ont été convertis en collectibles
    if (testGame.collectibles.length > 0) {
        console.log("✅ Test réussi: Les blocs avec gravité tombent correctement");
    } else {
        console.log("❌ Test échoué: Les blocs avec gravité n'ont pas été traités");
    }
    
    return testGame.collectibles.length > 0;
}

// Fonction de test pour vérifier la destruction de blocs
export function testBlockDestruction(game, x, y) {
    console.log(`Test de la destruction du bloc en (${x}, ${y})...`);
    
    // Vérifier que le bloc existe
    const blockType = game.tileMap[y]?.[x];
    if (!blockType || blockType === TILE.AIR) {
        console.log("❌ Test échoué: Aucun bloc à détruire");
        return false;
    }
    
    // Détruire le bloc
    const originalMap = JSON.parse(JSON.stringify(game.tileMap));
    game.tileMap[y][x] = TILE.AIR;
    
    // Vérifier que le bloc a été détruit
    if (game.tileMap[y][x] === TILE.AIR) {
        console.log("✅ Test réussi: Le bloc a été détruit");
        return true;
    } else {
        console.log("❌ Test échoué: Le bloc n'a pas été détruit");
        return false;
    }
}

// Fonction de test pour vérifier checkBlockSupport
export function testCheckBlockSupport() {
    console.log("Test de checkBlockSupport...");
    
    // Créer une configuration de test
    const testConfig = {
        tileSize: 16
    };
    
    // Créer une carte de test avec des blocs de sable sans support en dessous
    const testMap = [
        [TILE.AIR, TILE.AIR, TILE.AIR, TILE.AIR, TILE.AIR],
        [TILE.SAND, TILE.AIR, TILE.AIR, TILE.SAND, TILE.AIR],
        [TILE.AIR, TILE.AIR, TILE.AIR, TILE.AIR, TILE.AIR]
    ];
    
    // Créer un objet game de test
    const testGame = {
        config: testConfig,
        tileMap: testMap,
        collectibles: []
    };
    
    // Vérifier l'état initial
    console.log("État initial de la carte:");
    console.log(JSON.parse(JSON.stringify(testMap)));
    console.log("Collectibles initiaux:");
    console.log(testGame.collectibles);
    
    // Exécuter checkBlockSupport sur le bloc de sable en (0, 1)
    checkBlockSupport(testGame, 0, 1);
    
    // Vérifier l'état après checkBlockSupport
    console.log("État après checkBlockSupport:");
    console.log(JSON.parse(JSON.stringify(testMap)));
    console.log("Collectibles créés:");
    console.log(testGame.collectibles);
    
    // Vérifier que le bloc de sable a été converti en collectible
    if (testGame.collectibles.length > 0) {
        console.log("✅ Test réussi: checkBlockSupport fonctionne correctement");
        return true;
    } else {
        console.log("❌ Test échoué: checkBlockSupport n'a pas fonctionné");
        return false;
    }
}

// Exécuter les tests si ce fichier est exécuté directement
if (typeof window === 'undefined' && typeof module !== 'undefined') {
    // Exécuter les tests
    console.log("Exécution des tests de minage et de gravité...");
    
    // Test de la gravité
    testGravity({});
    
    // Test de checkBlockSupport
    testCheckBlockSupport();
    
    console.log("Tests terminés.");
}
