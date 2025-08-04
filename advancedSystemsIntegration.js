// advancedSystemsIntegration.js - Intégration des systèmes avancés

import { WeatherSystem } from './weatherSystem.js';
import { DisasterManager } from './disasterManager.js';
import { FoodSystem } from './foodSystem.js';
import { AnimalSystem } from './animalSystem.js';
import { ExplorationSystem } from './explorationSystem.js';
import { TimeSystem } from './timeSystem.js';
import { LightingSystem } from './lighting.js';
import { WorldAnimator } from './worldAnimator.js';
import { generateMonsters } from './generateurMonstres.js';
import { generateAnimals } from './generateurAnimaux.js';
import { generatePNJ } from './generateurPNJ.js';
import { PNJ } from './PNJ.js';

/**
 * Intègre tous les systèmes de jeu avancés dans l'objet de jeu principal.
 * C'est le point central pour activer et connecter les fonctionnalités complexes.
 * @param {object} game - L'objet de jeu principal.
 */
export function integrateAdvancedSystems(game) {
    if (!game || !game.config) {
        console.error("❌ Objet de jeu ou configuration manquant pour l'intégration des systèmes avancés.");
        return;
    }

    console.log("🔗 Intégration des systèmes de jeu avancés...");

    // 1. Système de temps et de cycle jour/nuit
    // Ce système est fondamental pour beaucoup d'autres (météo, éclairage, etc.)
    game.timeSystem = new TimeSystem(game.config);
    console.log("    -> 🕒 Système de temps initialisé.");

    // 2. Système météorologique dynamique
    // Dépend du système de temps.
    game.weatherSystem = new WeatherSystem(game.canvas, game.config);
    console.log("    -> ☁️ Système météorologique initialisé.");

    // 3. Gestionnaire de désastres et de catastrophes naturelles
    // Dépend de la météo et du temps.
    game.disasterManager = new DisasterManager(game);
    console.log("    -> 🌋 Gestionnaire de désastres initialisé.");

    // 4. Système d'éclairage dynamique
    // Dépend du système de temps.
    game.lightingSystem = new LightingSystem(game.canvas, game.config.tileSize);
    console.log("    -> 💡 Système d'éclairage initialisé.");

    // 5. Animateur du monde pour les effets visuels
    game.worldAnimator = new WorldAnimator(game.config, game.assets);
    console.log("    -> ✨ Animateur du monde initialisé.");

    // 6. Système de faune (animaux)
    game.animalSystem = new AnimalSystem(game);
    if (typeof generateAnimals === 'function') {
        const animals = generateAnimals(5, game.config, game.tileMap); // Génère 5 animaux
        game.animals = animals;
    }
    console.log("    -> 🐾 Système de faune initialisé.");

    // 7. Génération de monstres
    if (typeof generateMonsters === 'function') {
        const monsters = generateMonsters(10, game.config, game.tileMap); // Génère 10 monstres
        game.enemies = [...game.enemies, ...monsters];
    }
    console.log("    -> 👾 Générateur de monstres actif.");

    // 8. Génération de PNJ
    // Assurez-vous que les PNJ ont une configuration valide.
    if (typeof generatePNJ === 'function' && typeof PNJ === 'function') {
        for (let i = 0; i < 5; i++) { // Génère 5 PNJ
            const pnjData = generatePNJ();
            const spawnPos = findValidSpawn(game.tileMap, game.config.tileSize);
            if (spawnPos) {
                const newPnj = new PNJ(spawnPos.x, spawnPos.y, game.config, pnjData);
                game.pnjs.push(newPnj);
            }
        }
    }
    console.log("    -> 👨‍👩‍👧‍👦 Générateur de PNJ actif.");

    // 9. Système de nourriture et de survie
    game.foodSystem = new FoodSystem(game.player, game.inventory);
    console.log("    -> 🍔 Système de nourriture et survie initialisé.");

    // 10. Système d'exploration et de brouillard de guerre
    game.explorationSystem = new ExplorationSystem(
        game.config.worldWidth,
        game.config.worldHeight,
        game.config.chunkSize
    );
    console.log("    -> 🗺️ Système d'exploration initialisé.");

    console.log("✅ Tous les systèmes avancés ont été intégrés avec succès !");
}

/**
 * Trouve une position de spawn valide sur la surface du monde.
 * @param {Array<Array<number>>} tileMap - La carte du monde.
 * @param {number} tileSize - La taille d'une tuile.
 * @returns {{x: number, y: number}|null}
 */
function findValidSpawn(tileMap, tileSize) {
    const worldWidthInTiles = tileMap[0].length;
    for (let i = 0; i < 100; i++) { // Tente 100 fois de trouver un point
        const x = Math.floor(Math.random() * worldWidthInTiles);
        for (let y = 1; y < tileMap.length; y++) {
            const isGround = tileMap[y][x] > 0;
            const isAirAbove = tileMap[y - 1][x] === 0;
            if (isGround && isAirAbove) {
                return { x: x * tileSize, y: (y - 2) * tileSize }; // Positionne le PNJ juste au-dessus du sol
            }
        }
    }
    return null; // Retourne null si aucun point n'est trouvé
}

