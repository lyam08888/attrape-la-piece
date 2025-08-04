// worldIntegration.js - Intégration entre world.js et les systèmes avancés

import { TILE } from './world.js';

/**
 * Convertit les données d'un monde avancé (avec objets et propriétés) 
 * en une simple tileMap numérique pour le moteur de base.
 * @param {object} advancedWorldData - Les données du monde générées par AdvancedWorldGenerator.
 * @param {number} width - La largeur du monde en tuiles.
 * @param {number} height - La hauteur du monde en tuiles.
 * @returns {Array<Array<number>>} La tileMap de base.
 */
export function convertAdvancedWorldToBasic(advancedWorldData, width, height) {
    const tileMap = Array(height).fill(0).map(() => Array(width).fill(TILE.AIR));
    if (!advancedWorldData || !advancedWorldData.tiles) {
        console.error("Données du monde avancé invalides pour la conversion.");
        return tileMap;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const advancedTile = advancedWorldData.tiles[y]?.[x];
            if (advancedTile) {
                // `tileId` est l'identifiant numérique correspondant à `TILE.GRASS`, `TILE.STONE`, etc.
                tileMap[y][x] = advancedTile.tileId || TILE.AIR;
            }
        }
    }
    return tileMap;
}

/**
 * Enrichit la tileMap de base avec des données supplémentaires du monde avancé.
 * Crée une structure de données parallèle pour des informations comme le biome, la température, etc.
 * @param {Array<Array<number>>} tileMap - La tileMap de base.
 * @param {object} advancedWorldData - Les données complètes du monde avancé.
 * @returns {object} Un objet contenant les données enrichies.
 */
export function enrichBasicWorldWithAdvancedData(tileMap, advancedWorldData) {
    if (!advancedWorldData) return {};
    // Stocke directement les données avancées pour une consultation facile par d'autres systèmes.
    return {
        biomes: advancedWorldData.biomes,
        temperatures: advancedWorldData.temperatures,
        humidity: advancedWorldData.humidity,
        advancedTiles: advancedWorldData.tiles // Conserve toutes les données par tuile
    };
}

/**
 * (Fonction future) Synchronise les changements du monde de base vers le monde avancé.
 * Par exemple, si le joueur casse un bloc.
 * @param {number} x - Coordonnée X de la tuile modifiée.
 * @param {number} y - Coordonnée Y de la tuile modifiée.
 * @param {number} newTileId - Le nouvel ID de la tuile.
 * @param {object} game - L'objet de jeu principal.
 */
export function syncWorldChanges(x, y, newTileId, game) {
    // Cette fonction est un placeholder. Dans une implémentation complète,
    // elle mettrait à jour game.worldData.advancedTiles[y][x]
    // pour refléter le changement, par exemple en changeant le type de sol
    // ou en retirant un minéral.
    if (game.worldData?.advancedTiles?.[y]?.[x]) {
        game.worldData.advancedTiles[y][x].tileId = newTileId;
        // On pourrait aussi mettre à jour d'autres propriétés, comme "mined: true"
    }
}