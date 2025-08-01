/**
 * Module de Génération de Sprites d'Animaux
 * Style : 2D, Blocs
 * Usage : Appelez la fonction `generateAnimal({ biome: '...' })` pour obtenir les données d'un nouvel animal.
 */

// === PALETTES DE COULEURS PAR BIOME ===
const SURFACE_COLORS = ['#A0522D', '#FFFFFF', '#8B4513', '#FFC0CB', '#228B22']; // Marron, Blanc, Rose, Vert
const PARADISE_COLORS = ['#FFFFFF', '#FFD700', '#ADD8E6', '#F0E68C']; // Blanc, Or, Bleu clair
const NUCLEUS_COLORS = ['#00FFFF', '#7FFFD4', '#FF00FF', '#9400D3']; // Couleurs bioluminescentes

// === PARTIES D'ANIMAUX PAR BIOME ===
const ANIMAL_PARTS = {
    surface: {
        bodies: [
            `<rect x="30" y="40" width="40" height="30" fill="{color}" stroke="#1E1E1E" stroke-width="2"/>`, // Corps de mouton/vache
            `<ellipse cx="50" cy="50" rx="20" ry="15" fill="{color}" stroke="#1E1E1E" stroke-width="2"/>` // Corps de poulet
        ],
        heads: [
            `<rect x="60" y="30" width="20" height="20" fill="{color}" stroke="#1E1E1E" stroke-width="2"/>` // Tête carrée
        ],
        legs: [
            `<rect x="35" y="70" width="8" height="15" fill="{color}" stroke="#1E1E1E" stroke-width="1.5"/>
             <rect x="57" y="70" width="8" height="15" fill="{color}" stroke="#1E1E1E" stroke-width="1.5"/>`
        ],
        extras: [
            `<ellipse cx="40" cy="35" rx="15" ry="10" fill="#FFFFFF" stroke="#1E1E1E" stroke-width="1.5"/>` // Laine de mouton
        ]
    },
    paradise: {
        bodies: [
            `<ellipse cx="50" cy="50" rx="25" ry="15" fill="{color}" stroke="#1E1E1E" stroke-width="2"/>` // Corps d'oiseau
        ],
        wings: [
            `<path d="M 25 50 Q 0 30 25 10 Z" fill="{wingColor}" stroke="#1E1E1E" stroke-width="2" />
             <path d="M 75 50 Q 100 30 75 10 Z" fill="{wingColor}" stroke="#1E1E1E" stroke-width="2" />`
        ]
    },
    nucleus: {
        bodies: [
            `<path d="M 20 50 Q 50 20 80 50 Q 50 80 20 50 Z" fill="{color}" stroke="#1E1E1E" stroke-width="2"/>` // Corps de poisson
        ],
        fins: [
            `<path d="M 75 50 L 90 40 L 90 60 Z" fill="{color}" stroke="#1E1E1E" stroke-width="1.5"/>`, // Nageoire caudale
            `<path d="M 50 35 L 40 25 L 60 25 Z" fill="{color}" stroke="#1E1E1E" stroke-width="1.5"/>` // Nageoire dorsale
        ],
        extras: [
             `<circle cx="25" cy="50" r="3" fill="#FFFFFF" /><line x1="25" y1="50" x2="10" y2="35" stroke-width="2" stroke="{eyeColor}" /><circle cx="10" cy="35" r="4" fill="{eyeColor}" />` // Antenne lumineuse
        ]
    }
};

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function generateAnimal(options = {}) {
    const biome = options.biome || 'surface';
    let palette, parts, movement;

    switch (biome) {
        case 'paradise':
            palette = PARADISE_COLORS;
            parts = ANIMAL_PARTS.paradise;
            movement = 'fly';
            break;
        case 'nucleus':
            palette = NUCLEUS_COLORS;
            parts = ANIMAL_PARTS.nucleus;
            movement = 'swim';
            break;
        default: // surface
            palette = SURFACE_COLORS;
            parts = ANIMAL_PARTS.surface;
            movement = 'walk';
    }

    const bodyColor = randomChoice(palette);
    const eyeColor = randomChoice(palette.filter(c => c !== bodyColor));
    let svgParts = [];

    // Assemblage des parties
    if (parts.bodies) svgParts.push(randomChoice(parts.bodies).replace(/{color}/g, bodyColor));
    if (parts.heads) svgParts.push(randomChoice(parts.heads).replace(/{color}/g, bodyColor));
    if (parts.legs) svgParts.push(randomChoice(parts.legs).replace(/{color}/g, bodyColor));
    if (parts.fins) svgParts.push(randomChoice(parts.fins).replace(/{color}/g, bodyColor));
    if (parts.wings) {
        const wingColor = randomChoice(palette.filter(c => c !== bodyColor));
        svgParts.push(randomChoice(parts.wings).replace(/{wingColor}/g, wingColor));
    }
    if (parts.extras && Math.random() < 0.5) {
        svgParts.push(randomChoice(parts.extras).replace(/{color}/g, bodyColor).replace(/{eyeColor}/g, eyeColor));
    }

    // Oeil simple pour tous
    svgParts.push(`<circle cx="65" cy="40" r="3" fill="${eyeColor}" />`);
    
    const svgString = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${svgParts.join('')}</svg>`;

    return {
        movement,
        svgString,
    };
}
