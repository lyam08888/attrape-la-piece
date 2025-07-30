import { Slime, Frog, Golem } from './enemy.js';

export function generateLevel(game, levelConfig, gameSettings) {
    const { worldWidth, worldHeight, generation } = levelConfig;
    const groundY = worldHeight - 64;

    // Sol principal avec des trous
    let currentX = 0;
    while (currentX < worldWidth) {
        if (currentX > 400 && Math.random() < 0.3) {
            const holeWidth = 100 + Math.random() * 50;
            if (Math.random() < 0.5) game.water.push({ x: currentX, y: groundY, w: holeWidth, h: 64 });
            currentX += holeWidth;
        } else {
            const segmentWidth = 200 + Math.random() * 300;
            game.platforms.push({ x: currentX, y: groundY, w: segmentWidth, h: 64, type: 'ground' });
            currentX += segmentWidth;
        }
    }

    // Plateformes flottantes
    for (let i = 0; i < generation.platformCount; i++) {
        game.platforms.push({
            x: 400 + Math.random() * (worldWidth - 800),
            y: 200 + Math.random() * (groundY - 250),
            w: 100 + Math.random() * 100,
            h: 32,
            type: 'normal'
        });
    }
    
    // Ennemis
    let enemyCount = generation.enemyCount;
    if(gameSettings.difficulty === 'Easy') enemyCount = Math.floor(enemyCount * 0.7);
    if(gameSettings.difficulty === 'Hard') enemyCount = Math.floor(enemyCount * 1.5);

    for(let i = 0; i < enemyCount; i++) {
        // On cherche une plateforme qui n'est pas le sol principal pour y placer un ennemi
        const platform = game.platforms.filter(p => p.type !== 'ground')[Math.floor(Math.random() * generation.platformCount)];
        if(platform) {
            const enemyType = ['slime', 'frog', 'golem'][Math.floor(Math.random() * 3)];
            let enemyClass;
            if (enemyType === 'slime') enemyClass = Slime;
            else if (enemyType === 'frog') enemyClass = Frog;
            else if (enemyType === 'golem') enemyClass = Golem;
            game.enemies.push(new enemyClass(platform.x + platform.w / 2, platform.y - 32, game.config));
        }
    }
    
    // Checkpoints
    for(let i = 1; i <= generation.checkpoints; i++) {
        game.checkpoints.push({
            x: (worldWidth / (generation.checkpoints + 1)) * i,
            y: groundY - 64, w: 32, h: 64, activated: false
        });
    }
}
