// seededRandom.js
// Ce module fournit un générateur de nombres pseudo-aléatoires basé sur une graine (seed).
// Cela garantit que chaque fois que le jeu est lancé avec la même graine,
// le monde généré est exactement le même.

export const SeededRandom = {
    seed: 12345, // Vous pouvez changer cette valeur pour générer un monde complètement différent.
    originalSeed: 12345, // Conserver la seed originale pour les reset

    // Réinitialise la graine. Appelé au début de la génération du monde.
    setSeed(newSeed) {
        this.seed = newSeed;
        this.originalSeed = newSeed;
    },

    // Génère le prochain nombre pseudo-aléatoire dans la séquence.
    random: function() {
        // Amélioration de l'algorithme pour une meilleure distribution
        const x = Math.sin(this.seed) * 10000;
        this.seed += 1.618033988749895; // Nombre d'or pour une meilleure distribution
        return x - Math.floor(x);
    },
    
    // Génère un nombre aléatoire dans une plage spécifique
    randomRange: function(min, max) {
        return min + (this.random() * (max - min));
    },
    
    // Génère un nombre entier aléatoire dans une plage spécifique
    randomInt: function(min, max) {
        return Math.floor(this.randomRange(min, max));
    },
    
    // Réinitialise la seed à sa valeur originale
    reset: function() {
        this.seed = this.originalSeed;
    },
    
    // Génère une seed dérivée basée sur la seed actuelle
    deriveSeed: function(offset) {
        return this.originalSeed + (offset * 1618033988749895) % 2147483647;
    },
    
    // Mélange un tableau basé sur la seed actuelle
    shuffleArray: function(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};
