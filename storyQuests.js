// storyQuests.js - génération de l'histoire principale
// Ce module fournit 150 quêtes scénarisées pour former un arc narratif complet.

export function getStoryQuests() {
    const arcs = [
        { title: "L'Ombre Émergente", description: "Le royaume de Soleria est envahi par une force obscure qui ronge la terre." },
        { title: "Les Forges du Renouveau", description: "Les survivants se rassemblent et reforgent les outils nécessaires à la reconquête." },
        { title: "La Marche des Héros", description: "Les aventuriers se dressent pour repousser l'obscurité." },
        { title: "Le Voile des Anciens", description: "De vieux secrets refont surface, révélant la véritable origine de l'Ombre." },
        { title: "L'Aube Retrouvée", description: "La lumière revient peu à peu sur le monde, annonçant un nouvel espoir." }
    ];

    const quests = [];
    const total = 150; // Nombre total de quêtes principales

    for (let i = 1; i <= total; i++) {
        const arc = arcs[Math.floor((i - 1) / 30)]; // 5 arcs de 30 quêtes chacun
        const step = ((i - 1) % 30) + 1;
        quests.push({
            id: `story_${i}`,
            title: `Chapitre ${i}: ${arc.title}`,
            description: `${arc.description} (Étape ${step}/30)`,
            objectives: [
                {
                    id: `story_${i}_progress`,
                    description: `Progresser dans l'aventure (${step}/30)` ,
                    target: 1
                }
            ],
            rewards: { xp: 100 + i * 5 },
            prerequisites: i === 1 ? [] : [`story_${i - 1}`],
            category: 'main'
        });
    }

    return quests;
}

// Le module peut être étendu ultérieurement pour ajouter des quêtes secondaires
// ou des variations dynamiques.
