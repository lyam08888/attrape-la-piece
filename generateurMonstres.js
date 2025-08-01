/**
 * Module de Génération de Sprites de Monstres
 * Style : 2D, Blocs (type Minecraft)
 * Usage : Appelez la fonction `generateMonster({ biome: '...' })` pour obtenir les données d'un nouveau monstre.
 */

// === PALETTES DE COULEURS PAR BIOME ===
const SURFACE_COLORS = ['#A8A8A8', '#7B5A3E', '#55AB55', '#4D4D4D', '#EAEAEA', '#FF6B6B', '#48DBFB', '#Feca57', '#363636'];
const UNDERGROUND_COLORS = ['#696969', '#778899', '#A8A8A8', '#4D4D4D', '#5A4D41', '#8B4513'];
const CORE_COLORS = ['#DA70D6', '#BA55D3', '#9370DB', '#FF00FF', '#4B0082', '#E6E6FA'];
const HELL_COLORS = ['#8B0000', '#FF4500', '#FF8C00', '#4D4D4D', '#2F4F4F', '#DC143C'];
const PARADISE_COLORS = ['#FFFFFF', '#FFD700', '#87CEEB', '#F0E68C', '#FFFACD', '#E0FFFF'];
const SPACE_COLORS = ['#000000', '#4B0082', '#FFFFFF', '#9370DB', '#191970', '#E6E6FA'];


// === FORMES ET CARACTÉRISTIQUES ===
const BODY_SHAPES = [
    { type: 'rectangle', width: 60, height: 80, x: 20, y: 10 },
    { type: 'square', width: 70, height: 70, x: 15, y: 15 },
    { type: 'tall_rectangle', width: 40, height: 85, x: 30, y: 5 },
    { type: 'wide_rectangle', width: 80, height: 50, x: 10, y: 25 },
];

const MOUTH_SHAPES = [
    { type: 'line', path: 'M35 75 H65' },
    { type: 'square_open', path: 'M40 70 H60 V80 H40' },
    { type: 'o_square', path: 'M42 72 H58 V80 H42 Z' },
    { type: 'zigzag', path: 'M35 75 L45 70 L55 75 L65 70' },
    // Nouvelle bouche pour l'enfer
    { type: 'sharp_teeth', path: 'M35 70 L40 78 L45 70 L50 78 L55 70 L60 78 L65 70' },
];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);


/**
 * Fonction principale pour générer un monstre.
 * @param {object} options - Options de génération, comme le biome.
 * @returns {Object} Un objet contenant les propriétés du monstre (`properties`) et le code SVG (`svgString`).
 */
export function generateMonster(options = {}) {
    const biome = options.biome || 'surface';
    
    // Sélectionner la palette de couleurs en fonction du biome
    let palette;
    switch (biome) {
        case 'underground': palette = UNDERGROUND_COLORS; break;
        case 'core': palette = CORE_COLORS; break;
        case 'hell': palette = HELL_COLORS; break;
        case 'paradise': palette = PARADISE_COLORS; break;
        case 'space': palette = SPACE_COLORS; break;
        default: palette = SURFACE_COLORS;
    }

    const properties = {
        biome: biome,
        bodyShape: randomChoice(BODY_SHAPES),
        bodyColor: randomChoice(palette),
        eyeCount: randomBetween(1, 3),
        mouthShape: (biome === 'hell' && Math.random() < 0.5) ? MOUTH_SHAPES.find(m => m.type === 'sharp_teeth') : randomChoice(MOUTH_SHAPES),
        hasHorns: Math.random() > 0.3, // Plus de chance d'avoir des cornes
        hasExtraFeature: Math.random() > 0.5, // Pour les ailes, antennes, etc.
    };
    
    properties.eyeColor = randomChoice(palette.filter(c => c !== properties.bodyColor));
    properties.hornColor = randomChoice(palette.filter(c => c !== properties.bodyColor));

    // --- Génération du SVG ---

    // 1. Corps
    const body = properties.bodyShape;
    let bodySvg = `<rect x="${body.x}" y="${body.y}" width="${body.width}" height="${body.height}" fill="${properties.bodyColor}" stroke="#1E1E1E" stroke-width="2"/>`;

    // 2. Yeux
    let eyesSvg = '';
    const eyeSize = 8;
    if (properties.eyeCount === 1) {
        eyesSvg = `<rect x="46" y="40" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>`;
    } else if (properties.eyeCount === 2) {
        eyesSvg = `
            <rect x="32" y="40" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>
            <rect x="60" y="40" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>
        `;
    } else {
        eyesSvg = `
            <rect x="25" y="42" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>
            <rect x="46" y="42" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>
            <rect x="67" y="42" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>
        `;
    }

    // 3. Bouche
    let mouthSvg = `<path d="${properties.mouthShape.path}" stroke="#1E1E1E" stroke-width="3" fill="none" />`;
    if (properties.mouthShape.type === 'o_square') {
        mouthSvg = `<path d="${properties.mouthShape.path}" fill="#1E1E1E" />`;
    }

    // 4. Cornes (variées selon le biome)
    let hornsSvg = '';
    if (properties.hasHorns) {
        let hornFill = properties.hornColor;
        let hornOpacity = 1.0;
        if (biome === 'core') hornOpacity = 0.7; // Cornes de cristal
        if (biome === 'hell') { // Cornes plus grandes et menaçantes
            hornsSvg = `
                <path d="M 20 15 L 15 0 L 30 15 Z" fill="${hornFill}" stroke="#1E1E1E" stroke-width="2" opacity="${hornOpacity}"/>
                <path d="M 80 15 L 85 0 L 70 15 Z" fill="${hornFill}" stroke="#1E1E1E" stroke-width="2" opacity="${hornOpacity}"/>
            `;
        } else {
            hornsSvg = `
                <rect x="20" y="0" width="10" height="15" fill="${hornFill}" stroke="#1E1E1E" stroke-width="2" opacity="${hornOpacity}"/>
                <rect x="70" y="0" width="10" height="15" fill="${hornFill}" stroke="#1E1E1E" stroke-width="2" opacity="${hornOpacity}"/>
            `;
        }
    }

    // 5. Caractéristiques spéciales par biome
    let extraFeatureSvg = '';
    if (properties.hasExtraFeature) {
        switch (biome) {
            case 'paradise': // Ailes d'ange
                extraFeatureSvg = `
                    <rect x="0" y="30" width="20" height="40" fill="${properties.hornColor}" stroke="#1E1E1E" stroke-width="2" />
                    <rect x="80" y="30" width="20" height="40" fill="${properties.hornColor}" stroke="#1E1E1E" stroke-width="2" />
                `;
                break;
            case 'space': // Antennes
                extraFeatureSvg = `
                    <line x1="30" y1="10" x2="15" y2="-5" stroke="${properties.hornColor}" stroke-width="3" />
                    <circle cx="15" cy="-5" r="4" fill="${properties.eyeColor}" />
                    <line x1="70" y1="10" x2="85" y2="-5" stroke="${properties.hornColor}" stroke-width="3" />
                    <circle cx="85" cy="-5" r="4" fill="${properties.eyeColor}" />
                `;
                break;
            case 'underground': // Piques de pierre
                 extraFeatureSvg = `
                    <path d="M 20 10 L 15 20 L 25 20 Z" fill="${properties.hornColor}" stroke="#1E1E1E" stroke-width="1.5"/>
                    <path d="M 80 10 L 85 20 L 75 20 Z" fill="${properties.hornColor}" stroke="#1E1E1E" stroke-width="1.5"/>
                 `;
                break;
        }
    }

    // Assemblage final du SVG
    const svgString = `<svg viewBox="-10 -10 120 120" xmlns="http://www.w3.org/2000/svg">
        ${hornsSvg}
        ${extraFeatureSvg}
        ${bodySvg}
        ${eyesSvg}
        ${mouthSvg}
    </svg>`;

    return {
        properties,
        svgString,
    };
}
