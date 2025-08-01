// generateurPNJ.js

// Listes de noms pour la génération de PNJ
const PNJ_NAMES = {
    first: ["Elara", "Finn", "Gwen", "Jasper", "Lyra", "Orion"],
    last: ["Forge", "Stone", "Leaf", "River", "Wind", "Sun"],
};

// Apparences possibles pour les PNJ
const PNJ_APPEARANCE = {
    bodyColor: ["#C0C0C0", "#A0522D", "#6B8E23", "#4682B4"],
    headShape: ["rect", "circle"],
};

// Types de quêtes avec leurs objectifs et récompenses
const QUEST_TEMPLATES = [
    {
        type: "gather",
        objective: { item: "wood", amount: 10 },
        dialogue: "J'ai besoin de bois pour réparer ma maison. Pouvez-vous m'en apporter ?",
        reward: { xp: 50, items: [{ item: "coin", amount: 5 }] },
    },
    {
        type: "craft",
        objective: { item: "pickaxe", amount: 1 },
        dialogue: "Ma pioche est cassée. Pourriez-vous m'en fabriquer une nouvelle ?",
        reward: { xp: 100, items: [{ item: "iron", amount: 3 }] },
    },
    {
        type: "hunt",
        objective: { target: "monster", amount: 3 },
        dialogue: "Des monstres rôdent près du village. Éliminez-les pour notre sécurité.",
        reward: { xp: 150, items: [{ item: "sword", amount: 1 }] },
    },
];

// Fonction pour générer un PNJ aléatoire
export function generatePNJ() {
    const firstName = PNJ_NAMES.first[Math.floor(Math.random() * PNJ_NAMES.first.length)];
    const lastName = PNJ_NAMES.last[Math.floor(Math.random() * PNJ_NAMES.last.length)];

    return {
        name: `${firstName} ${lastName}`,
        appearance: {
            bodyColor: PNJ_APPEARANCE.bodyColor[Math.floor(Math.random() * PNJ_APPEARANCE.bodyColor.length)],
            headShape: PNJ_APPEARANCE.headShape[Math.floor(Math.random() * PNJ_APPEARANCE.headShape.length)],
        },
        quest: QUEST_TEMPLATES[Math.floor(Math.random() * QUEST_TEMPLATES.length)],
    };
}
