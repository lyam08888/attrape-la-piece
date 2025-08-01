// seededRandom.js
// Ce module fournit un générateur de nombres pseudo-aléatoires basé sur une graine (seed).
// Cela garantit que chaque fois que le jeu est lancé avec la même graine,
// le monde généré est exactement le même.

export const SeededRandom = {
    seed: 12345, // Vous pouvez changer cette valeur pour générer un monde complètement différent.

    // Réinitialise la graine. Appelé au début de la génération du monde.
    setSeed(newSeed) {
        this.seed = newSeed;
    },

    // Génère le prochain nombre pseudo-aléatoire dans la séquence.
    random: function() {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
};
