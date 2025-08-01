// generateurPNJ.js
import { generateQuest } from './generateurQuete.js';

const PNJ_ARCHETYPES = [
    {
        type: 'Forgeron',
        names: { first: ["Balfor", "Korgan", "Thorgar"], last: ["Forgefer", "Marteau-Hardi"] }
    },
    {
        type: 'Chasseur',
        names: { first: ["Fendrel", "Lyra", "Orion"], last: ["Vif-Arc", "Sombrebois"] }
    },
    {
        type: 'Herboriste',
        names: { first: ["Elara", "Sylas", "Briar"], last: ["Feuilleciel", "Racine-Profonde"] }
    }
];

const PNJ_APPEARANCE = {
    bodyColor: ["#C0C0C0", "#A0522D", "#6B8E23", "#4682B4"],
    headShape: ["rect", "circle"],
};

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePNJ() {
    const archetype = getRandom(PNJ_ARCHETYPES);
    const firstName = getRandom(archetype.names.first);
    const lastName = getRandom(archetype.names.last);

    return {
        name: `${firstName} ${lastName}`,
        archetype: archetype.type,
        appearance: {
            bodyColor: getRandom(PNJ_APPEARANCE.bodyColor),
            headShape: getRandom(PNJ_APPEARANCE.headShape),
        },
        quest: generateQuest(archetype.type),
    };
}
