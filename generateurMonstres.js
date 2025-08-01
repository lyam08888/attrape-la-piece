/**
 * Module de Génération de Sprites de Monstres
 * Style : 2D, Blocs (type Minecraft)
 * Usage : Appelez la fonction `generateMonster()` pour obtenir les données d'un nouveau monstre.
 */

// Palette de couleurs inspirée des jeux de blocs (tons terreux, pierre, etc.)
const BLOCKY_COLORS = [
  '#A8A8A8', // Stone
  '#7B5A3E', // Dirt
  '#55AB55', // Grass Green
  '#4D4D4D', // Cobblestone
  '#EAEAEA', // White Wool
  '#FF6B6B', // Redstone
  '#48DBFB', // Diamond Blue
  '#Feca57', // Gold
  '#363636', // Obsidian
];

// Formes de corps géométriques (rectangles, carrés)
const BODY_SHAPES = [
  { type: 'rectangle', width: 60, height: 80, x: 20, y: 10 },
  { type: 'square', width: 70, height: 70, x: 15, y: 15 },
  { type: 'tall_rectangle', width: 40, height: 85, x: 30, y: 5 },
  { type: 'wide_rectangle', width: 80, height: 50, x: 10, y: 25 },
];

// Types de bouches géométriques
const MOUTH_SHAPES = [
  // Ligne droite
  { type: 'line', path: 'M35 75 H65' },
  // Carré ouvert
  { type: 'square_open', path: 'M40 70 H60 V80 H40' },
  // Bouche en "O" carrée
  { type: 'o_square', path: 'M42 72 H58 V80 H42 Z' },
  // Zigzag
  { type: 'zigzag', path: 'M35 75 L45 70 L55 75 L65 70' },
];

// Choisit un élément aléatoire dans un tableau
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Génère un nombre aléatoire dans une plage
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);


/**
 * Fonction principale pour générer un monstre.
 * Peut être appelée directement depuis la logique du jeu.
 * @returns {Object} Un objet contenant les propriétés du monstre (`properties`) et le code SVG (`svgString`).
 */
export function generateMonster() {
  const properties = {
    bodyShape: randomChoice(BODY_SHAPES),
    bodyColor: randomChoice(BLOCKY_COLORS),
    eyeCount: randomBetween(1, 3), // 1, 2 ou 3 yeux pour un style plus simple
    mouthShape: randomChoice(MOUTH_SHAPES),
    hasHorns: Math.random() > 0.5,
  };
  // S'assurer que la couleur des yeux est différente de celle du corps
  properties.eyeColor = randomChoice(BLOCKY_COLORS.filter(c => c !== properties.bodyColor));
  properties.hornColor = randomChoice(BLOCKY_COLORS.filter(c => c !== properties.bodyColor));


  // --- Génération du SVG ---

  // 1. Corps
  const body = properties.bodyShape;
  let bodySvg = `<rect x="${body.x}" y="${body.y}" width="${body.width}" height="${body.height}" fill="${properties.bodyColor}" stroke="#1E1E1E" stroke-width="2"/>`;

  // 2. Yeux (toujours présents)
  let eyesSvg = '';
  const eyeSize = 8;
  if (properties.eyeCount === 1) {
    eyesSvg = `<rect x="46" y="40" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>`;
  } else if (properties.eyeCount === 2) {
    eyesSvg = `
      <rect x="32" y="40" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>
      <rect x="60" y="40" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>
    `;
  } else { // 3 yeux
    eyesSvg = `
      <rect x="25" y="42" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>
      <rect x="46" y="42" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>
      <rect x="67" y="42" width="${eyeSize}" height="${eyeSize}" fill="${properties.eyeColor}" stroke="#1E1E1E" stroke-width="1.5"/>
    `;
  }

  // 3. Bouche (toujours présente)
  let mouthSvg = `<path d="${properties.mouthShape.path}" stroke="#1E1E1E" stroke-width="3" fill="none" />`;
  if (properties.mouthShape.type === 'o_square') {
    mouthSvg = `<path d="${properties.mouthShape.path}" fill="#1E1E1E" />`;
  }

  // 4. Cornes (optionnelles)
  let hornsSvg = '';
  if (properties.hasHorns) {
    hornsSvg = `
      <rect x="20" y="0" width="10" height="15" fill="${properties.hornColor}" stroke="#1E1E1E" stroke-width="2"/>
      <rect x="70" y="0" width="10" height="15" fill="${properties.hornColor}" stroke="#1E1E1E" stroke-width="2"/>
    `;
  }

  // Assemblage final du SVG
  const svgString = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    ${hornsSvg}
    ${bodySvg}
    ${eyesSvg}
    ${mouthSvg}
  </svg>`;

  return {
    properties,
    svgString,
  };
}
