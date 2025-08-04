// worldIntegration.js - Intégration entre world.js et les systèmes avancés

import { TILE } from './world.js';

// Extension des types de tuiles pour les systèmes avancés
export const ADVANCED_TILES = {
    // Tuiles divines
    DIVINE_STONE: 20,
    BLESSED_EARTH: 21,
    CELESTIAL_CRYSTAL: 22,
    BLESSED_GRASS: 23,
    FERTILE_SOIL: 24,
    LIFE_CRYSTAL: 25,
    
    // Tuiles de cristal
    CRYSTAL_WALL: 26,
    CRYSTAL_ORE: 27,
    ENERGY_CRYSTAL: 28,
    
    // Tuiles infernales
    HELLSTONE: 29,
    LAVA_ROCK: 30,
    OBSIDIAN: 31,
    DEMON_STONE: 32,
    
    // Tuiles du vide
    VOID_STONE: 33,
    SHADOW_BLOCK: 34,
    CHAOS_CRYSTAL: 35
};

// Fusionner avec les tuiles existantes
Object.assign(TILE, ADVANCED_TILES);

// Fonction pour convertir un monde avancé vers le format world.js
export function convertAdvancedWorldToBasic(advancedWorld) {
    console.log("🔄 Conversion du monde avancé vers le format de base...");
    
    const basicWorld = {
        tileMap: advancedWorld.tileMap,
        width: advancedWorld.metadata.width,
        height: advancedWorld.metadata.height,
        biomes: advancedWorld.biomeMap,
        structures: advancedWorld.structures,
        metadata: advancedWorld.metadata
    };
    
    // Convertir les IDs de tuiles avancées vers les IDs de base si nécessaire
    for (let y = 0; y < basicWorld.tileMap.length; y++) {
        for (let x = 0; x < basicWorld.tileMap[y].length; x++) {
            const tileId = basicWorld.tileMap[y][x];
            
            // Mapper les tuiles avancées vers des équivalents de base si nécessaire
            if (tileId > 19) { // Tuiles avancées
                basicWorld.tileMap[y][x] = mapAdvancedTileToBasic(tileId);
            }
        }
    }
    
    console.log("✅ Conversion terminée !");
    return basicWorld;
}

function mapAdvancedTileToBasic(advancedTileId) {
    // Mapper les tuiles avancées vers des équivalents de base
    const mapping = {
        [ADVANCED_TILES.DIVINE_STONE]: TILE.STONE,
        [ADVANCED_TILES.BLESSED_EARTH]: TILE.DIRT,
        [ADVANCED_TILES.CELESTIAL_CRYSTAL]: TILE.DIAMOND,
        [ADVANCED_TILES.BLESSED_GRASS]: TILE.GRASS,
        [ADVANCED_TILES.FERTILE_SOIL]: TILE.DIRT,
        [ADVANCED_TILES.LIFE_CRYSTAL]: TILE.EMERALD,
        [ADVANCED_TILES.CRYSTAL_WALL]: TILE.STONE,
        [ADVANCED_TILES.CRYSTAL_ORE]: TILE.DIAMOND,
        [ADVANCED_TILES.ENERGY_CRYSTAL]: TILE.DIAMOND,
        [ADVANCED_TILES.HELLSTONE]: TILE.STONE,
        [ADVANCED_TILES.LAVA_ROCK]: TILE.STONE,
        [ADVANCED_TILES.OBSIDIAN]: TILE.STONE,
        [ADVANCED_TILES.DEMON_STONE]: TILE.STONE,
        [ADVANCED_TILES.VOID_STONE]: TILE.STONE,
        [ADVANCED_TILES.SHADOW_BLOCK]: TILE.STONE,
        [ADVANCED_TILES.CHAOS_CRYSTAL]: TILE.DIAMOND
    };
    
    return mapping[advancedTileId] || TILE.STONE;
}

// Fonction pour enrichir un monde de base avec des données avancées
export function enrichBasicWorldWithAdvancedData(basicWorld, game) {
    console.log("🌟 Enrichissement du monde de base avec des données avancées...");
    
    if (!game.advancedWorldGenerator) {
        console.log("⚠️ Générateur avancé non disponible");
        return basicWorld;
    }
    
    // Ajouter des métadonnées de biomes
    if (!basicWorld.biomes) {
        basicWorld.biomes = generateBiomeMap(basicWorld);
    }
    
    // Ajouter des structures avancées
    if (!basicWorld.structures) {
        basicWorld.structures = generateAdvancedStructures(basicWorld);
    }
    
    // Ajouter des points d'intérêt
    if (!basicWorld.pointsOfInterest) {
        basicWorld.pointsOfInterest = generatePointsOfInterest(basicWorld);
    }
    
    console.log("✅ Enrichissement terminé !");
    return basicWorld;
}

function generateBiomeMap(world) {
    const biomeMap = [];
    const height = world.tileMap.length;
    
    for (let y = 0; y < height; y++) {
        biomeMap[y] = [];
        for (let x = 0; x < world.tileMap[y].length; x++) {
            // Déterminer le biome basé sur la position Y
            const normalizedY = y / height;
            let biome = "SURFACE";
            
            if (normalizedY < 0.1) biome = "DIVINE_PEAKS";
            else if (normalizedY < 0.2) biome = "CELESTIAL_GARDENS";
            else if (normalizedY < 0.35) biome = "ENCHANTED_FOREST";
            else if (normalizedY < 0.5) biome = "CRYSTAL_CAVERNS";
            else if (normalizedY < 0.65) biome = "MYSTIC_SWAMPS";
            else if (normalizedY < 0.8) biome = "VOLCANIC_LANDS";
            else if (normalizedY < 0.95) biome = "INFERNAL_DEPTHS";
            else biome = "ABYSS";
            
            biomeMap[y][x] = biome;
        }
    }
    
    return biomeMap;
}

function generateAdvancedStructures(world) {
    const structures = [];
    const width = world.tileMap[0]?.length || 0;
    const height = world.tileMap.length;
    
    // Générer quelques structures de base
    const structureTypes = [
        { name: "Temple Divin", biome: "DIVINE_PEAKS", rarity: 0.1 },
        { name: "Arbre Ancien", biome: "ENCHANTED_FOREST", rarity: 0.3 },
        { name: "Géode de Cristal", biome: "CRYSTAL_CAVERNS", rarity: 0.2 },
        { name: "Portail Infernal", biome: "INFERNAL_DEPTHS", rarity: 0.1 }
    ];
    
    structureTypes.forEach(structType => {
        const count = Math.floor(width * height * structType.rarity / 10000);
        
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            
            structures.push({
                name: structType.name,
                type: structType.name.toLowerCase().replace(/\s+/g, '_'),
                x: x,
                y: y,
                width: 5 + Math.floor(Math.random() * 10),
                height: 5 + Math.floor(Math.random() * 10),
                biome: structType.biome,
                discovered: false
            });
        }
    });
    
    return structures;
}

function generatePointsOfInterest(world) {
    const poi = [];
    const width = world.tileMap[0]?.length || 0;
    const height = world.tileMap.length;
    
    // Points d'intérêt spéciaux
    const poiTypes = [
        { name: "Source Divine", description: "Une source d'eau bénite", biome: "DIVINE_PEAKS" },
        { name: "Cercle de Champignons", description: "Un cercle magique de champignons", biome: "ENCHANTED_FOREST" },
        { name: "Caverne de Cristal", description: "Une caverne remplie de cristaux", biome: "CRYSTAL_CAVERNS" },
        { name: "Fissure Infernale", description: "Une fissure vers les profondeurs", biome: "INFERNAL_DEPTHS" }
    ];
    
    poiTypes.forEach(poiType => {
        const count = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            
            poi.push({
                name: poiType.name,
                description: poiType.description,
                x: x,
                y: y,
                biome: poiType.biome,
                discovered: false,
                type: "landmark"
            });
        }
    });
    
    return poi;
}

// Fonction pour synchroniser les changements de monde
export function syncWorldChanges(game) {
    if (!game.tileMap || !game.advancedWorldGenerator) return;
    
    // Synchroniser les changements de tuiles avec les systèmes avancés
    // Cette fonction peut être appelée après des modifications du monde
    
    console.log("🔄 Synchronisation des changements de monde...");
    
    // Mettre à jour les biomes si nécessaire
    if (game.biomes) {
        // Recalculer les biomes affectés
        // Implementation future
    }
    
    // Notifier les systèmes avancés des changements
    if (game.advancedRenderer) {
        // Invalider le cache de rendu
        game.advancedRenderer.tileCache?.clear();
    }
    
    if (game.advancedNPCSystem) {
        // Notifier les PNJ des changements environnementaux
        // Implementation future
    }
}

// Export des fonctions principales
export default {
    ADVANCED_TILES,
    convertAdvancedWorldToBasic,
    enrichBasicWorldWithAdvancedData,
    syncWorldChanges
};