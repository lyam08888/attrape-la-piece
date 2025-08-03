// seedMap.js - Gestion avancée des seeds par chunk
// Ce module fournit un système de seed déterministe basé sur une seed globale et des coordonnées.
// Chaque chunk ou combinaison de coordonnées reçoit une seed unique mais reproductible.

export class SeedMap {
    constructor(baseSeed = 0) {
        this.baseSeed = baseSeed >>> 0; // Assurer un entier positif
        this.seedCache = new Map();
    }

    setBaseSeed(seed) {
        this.baseSeed = seed >>> 0;
        this.seedCache.clear();
    }

    // Récupère la seed pour une paire de coordonnées (x, y)
    getSeed(x, y = 0) {
        const key = `${x}:${y}`;
        if (!this.seedCache.has(key)) {
            this.seedCache.set(key, this.computeSeed(x, y));
        }
        return this.seedCache.get(key);
    }

    // Algorithme de hachage inspiré de techniques de mixage de bits pour une bonne distribution
    computeSeed(x, y) {
        let h = this.baseSeed ^ (x * 374761393) ^ (y * 668265263);
        h = (h ^ (h >> 13)) * 1274126177;
        h = h ^ (h >> 16);
        return h >>> 0; // Convertir en entier non signé
    }
}
