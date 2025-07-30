import { Slime, Frog, Golem } from './enemy.js';

export function generateLevel(game, levelConfig, gameSettings) {
    const { worldWidth, worldHeight, generation } = levelConfig;
    const groundY = worldHeight - 64;

    // Sol principal avec des trous
    for (let x = 0; x < worldWidth; x += 200) {
        if (x > 400 && Math.random() < 0.3) {
            if (Math.random() < 0.5) game.water.push({ x: x, y: groundY, w: 120, h: 64 });
            x += 120;
        }
        game.platforms.push({ x: x, y: groundY, w: 200, h: 64, type: 'ground' });
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
    if(gameSettings.difficulty === 'Easy') enemyCount *= 0.7;
    if(gameSettings.difficulty === 'Hard') enemyCount *= 1.5;

    for(let i = 0; i < enemyCount; i++) {
        const platform = game.platforms[Math.floor(Math.random() * game.platforms.length)];
        const enemyType = ['slime', 'frog', 'golem'][Math.floor(Math.random() * 3)];
        let enemyClass;
        if (enemyType === 'slime') enemyClass = Slime;
        if (enemyType === 'frog') enemyClass = Frog;
        if (enemyType === 'golem') enemyClass = Golem;
        game.enemies.push(new enemyClass(platform.x + platform.w / 2, platform.y - 32, game.config));
    }
    
    // Checkpoints
    for(let i = 1; i <= generation.checkpoints; i++) {
        game.checkpoints.push({
            x: (worldWidth / (generation.checkpoints + 1)) * i,
            y: groundY - 64, w: 32, h: 64, activated: false
        });
    }
}
