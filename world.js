import { Slime, Frog, Golem } from './enemy.js';

// Nouvelle fonction pour générer des niveaux plus riches et visuellement intéressants
export function generateLevel(game, levelConfig, gameSettings) {
    // On vide les anciens éléments du niveau avant de générer le nouveau
    game.platforms = [];
    game.enemies = [];
    game.water = [];
    game.coins = [];
    game.bonuses = [];
    game.decorations = []; // Nouveau: pour les éléments de décor

    const { worldWidth, worldHeight, generation } = levelConfig;
    const groundY = worldHeight - 64;

    // --- 1. Génération du sol avec des collines ---
    let currentX = 0;
    let currentY = groundY;
    while (currentX < worldWidth) {
        const segmentWidth = 150 + Math.random() * 250;
        // Fait varier la hauteur de la prochaine section de sol
        const nextY = groundY + (Math.random() - 0.5) * 100;
        
        // Ajoute une plateforme de transition en pente si la différence de hauteur est importante
        if (Math.abs(nextY - currentY) > 32) {
             game.platforms.push({ x: currentX, y: Math.min(currentY, nextY) + 32, w: segmentWidth, h: 128, type: 'ground' });
        } else {
             game.platforms.push({ x: currentX, y: currentY, w: segmentWidth, h: 64, type: 'ground' });
        }
        
        // Ajoute une chance de créer un trou avec de l'eau
        if (currentX > 500 && Math.random() < 0.2) {
            const holeWidth = 100 + Math.random() * 50;
            game.water.push({ x: currentX + segmentWidth, y: groundY + 32, w: holeWidth, h: 32 });
            currentX += holeWidth;
        }
        
        currentX += segmentWidth;
        currentY = nextY;
    }

    // --- 2. Ajout de plateformes flottantes structurées ---
    for (let i = 0; i < generation.platformCount; i++) {
        const platX = 400 + Math.random() * (worldWidth - 800);
        const platY = 200 + Math.random() * (groundY - 300);
        
        // Choix aléatoire d'un type de structure de plateforme
        const structureType = Math.random();
        if (structureType < 0.4) { // Escalier
            createStaircase(game, platX, platY, 3 + Math.floor(Math.random() * 3), Math.random() < 0.5);
        } else if (structureType < 0.7) { // Pont
            createBridge(game, platX, platY, 4 + Math.floor(Math.random() * 4));
        } else { // Îles flottantes
            createFloatingIslands(game, platX, platY, 3 + Math.floor(Math.random() * 3));
        }
    }
    
    // --- 3. Placement des pièces, bonus et décorations ---
    game.platforms.forEach(p => {
        // Ajoute des pièces en arc au-dessus de certaines plateformes
        if (p.w > 150 && Math.random() < 0.3) {
            createCoinArc(game, p.x + p.w / 2, p.y - 20, 5, 80);
        }
        // Ajoute un bloc bonus
        if (Math.random() < 0.1) {
            game.bonuses.push({ x: p.x + p.w / 2 - 16, y: p.y - 80, w: 32, h: 32, type: 'random' });
        }
        // Ajoute des décorations (ex: un buisson)
        if (p.type === 'ground' && Math.random() < 0.4) {
             game.decorations.push({ x: p.x + Math.random() * (p.w - 32), y: p.y - 32, w: 32, h: 32, type: 'bush' });
        }
    });

    // --- 4. Placement des ennemis ---
    let enemyCount = generation.enemyCount;
    if(gameSettings.difficulty === 'Easy') enemyCount = Math.floor(enemyCount * 0.7);
    if(gameSettings.difficulty === 'Hard') enemyCount = Math.floor(enemyCount * 1.5);

    for(let i = 0; i < enemyCount; i++) {
        const platform = game.platforms[Math.floor(Math.random() * game.platforms.length)];
        if(platform.y < groundY - 30) { // Place les ennemis principalement sur les plateformes flottantes
            const enemyType = ['slime', 'frog', 'golem'][Math.floor(Math.random() * 3)];
            let enemyClass;
            if (enemyType === 'slime') enemyClass = Slime;
            else if (enemyType === 'frog') enemyClass = Frog;
            else if (enemyType === 'golem') enemyClass = Golem;
            game.enemies.push(new enemyClass(platform.x + platform.w / 2, platform.y - 32, game.config));
        }
    }
    
    // --- 5. Placement des checkpoints ---
    for(let i = 1; i <= generation.checkpoints; i++) {
        game.checkpoints.push({
            x: (worldWidth / (generation.checkpoints + 1)) * i,
            y: groundY - 64, w: 32, h: 64, activated: false
        });
    }
}

// --- Fonctions utilitaires pour créer des structures ---

function createStaircase(game, x, y, steps, goingUp) {
    for (let i = 0; i < steps; i++) {
        game.platforms.push({
            x: x + i * 110,
            y: y + (goingUp ? -i * 40 : i * 40),
            w: 100,
            h: 32,
            type: 'normal'
        });
    }
}

function createBridge(game, x, y, length) {
    for (let i = 0; i < length; i++) {
        game.platforms.push({
            x: x + i * 90,
            y: y + Math.sin(i / 2) * 15, // Pont légèrement incurvé
            w: 85,
            h: 32,
            type: 'normal'
        });
    }
}

function createFloatingIslands(game, x, y, count) {
    for (let i = 0; i < count; i++) {
        game.platforms.push({
            x: x + (Math.random() - 0.5) * 200,
            y: y + (Math.random() - 0.5) * 80,
            w: 60 + Math.random() * 50,
            h: 32,
            type: 'normal'
        });
    }
}

function createCoinArc(game, cx, cy, numCoins, radius) {
    for (let i = 0; i < numCoins; i++) {
        const angle = Math.PI * (i / (numCoins - 1)); // Arc de 180 degrés
        const x = cx - radius * Math.cos(angle);
        const y = cy - radius * Math.sin(angle);
        game.coins.push({ x: x, y: y, w: 32, h: 32 });
    }
}
