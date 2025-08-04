// Importation des modules critiques
import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { TILE, generateLevel, ensureWorldColumns } from './world.js';
import { RPGInterfaceManager } from './rpgInterfaceManager.js';
import { integrateAdvancedSystems } from './advancedSystemsIntegration.js';

// --- Configuration Globale ---
let game = {};
let engine = null;
const config = {
    version: "3.0-stable",
    tileSize: 16,
    zoom: 3,
    worldWidth: 2048,
    worldHeight: 1024,
    physics: { gravity: 0.35, jumpForce: 8, playerSpeed: 3, friction: 0.85, maxFallSpeed: 10 },
    player: { width: 16, height: 24 },
    chunkSize: 16,
    renderDistance: 8
};

// --- Fonctions d'Initialisation ---

function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

async function initializeGame() {
    console.log("🎮 Initialisation du jeu...");
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) throw new Error("Canvas non trouvé!");

    resizeCanvas();

    engine = new GameEngine(canvas, config);

    // Initialisation de l'objet de jeu
    game = {
        config, canvas,
        ctx: canvas.getContext('2d'),
        rpgInterface: new RPGInterfaceManager(),
        tileMap: [],
        player: null,
        camera: { x: 0, y: 0 },
        mouse: { x: 0, y: 0, left: false, right: false },
        enemies: [], pnjs: [], animals: [], collectibles: [],
        time: 0, paused: false,
        spawnPoint: { x: 400, y: 300 }
    };
    window.game = game; // Rendre accessible globalement

    // Génération du monde
    console.log("🌍 Génération du monde...");
    const worldWidthInTiles = Math.floor(config.worldWidth / config.tileSize);
    const worldHeightInTiles = Math.floor(config.worldHeight / config.tileSize);
    game.tileMap = generateLevel(worldWidthInTiles, worldHeightInTiles);

    // Création du joueur
    console.log("👤 Création du joueur...");
    game.player = new Player(game.spawnPoint.x, game.spawnPoint.y, config, null);

    // Intégration des systèmes avancés
    console.log("🔗 Intégration des systèmes avancés...");
    integrateAdvancedSystems(game);

    console.log("✅ Jeu initialisé avec succès !");
}

// --- Logique de Jeu (Update & Draw) ---

const gameLogic = {
    init: async (assets) => {
        game.assets = assets;
        console.log("🖼️ Assets chargés.");
        // Attacher les moteurs aux systèmes de jeu
        if (typeof integrateMiningWithRPG === 'function') {
            integrateMiningWithRPG(game); // Cela attache le moteur de minage
        }
        game.combatSystem = new CombatSystem(); // Assurer que le système de combat est instancié
        game.foodSystem = new FoodSystem();

        return true;
    },
    update: (delta, keys, mouse) => {
        if (!game || !game.player || game.paused) return;
        
        game.mouse = mouse;
        game.player.update(keys, game, delta);

        // Mettre à jour les systèmes et entités
        game.pnjs.forEach(p => p.update(game, delta));
        game.enemies.forEach(e => e.update(game, delta));
        game.animals.forEach(a => a.update(game, delta));
        
        game.timeSystem?.update(delta);
        game.weatherSystem?.update(delta);
        game.disasterManager?.update(delta);
        game.foodSystem?.update(game, delta);
        game.combatSystem?.updateDamageNumbers(); // Mettre à jour les nombres de dégâts flottants

        // Le minage est maintenant géré dans player.update, qui appelle le miningEngine
        
        updateCamera();
        game.rpgInterface.updateHUD();
    },
    draw: (ctx, assets) => {
        if (!game || !game.player) return;

        // Fond dynamique simple
        ctx.fillStyle = game.timeSystem ? game.timeSystem.getSkyColor() : '#87CEEB';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.save();
        ctx.scale(config.zoom, config.zoom);
        ctx.translate(-game.camera.x, -game.camera.y);
        
        drawWorld(ctx, assets);

        game.animals.forEach(a => a.draw(ctx, assets));
        game.enemies.forEach(e => e.draw(ctx, assets));
        game.pnjs.forEach(p => p.draw(ctx, assets));
        game.player.draw(ctx, assets);
        
        game.weatherSystem?.draw(ctx);
        game.worldAnimator?.draw(ctx, game.tileMap, game.camera);

        // Dessiner les nombres de dégâts
        game.combatSystem?.drawDamageNumbers(ctx, game.camera);

        ctx.restore();
        
        // Dessiner l'UI par-dessus tout
        game.rpgInterface.draw(ctx);
    },
    isPaused: () => game.paused
};

function updateCamera() {
    const { zoom, worldWidth, worldHeight } = config;
    const canvasWidth = game.canvas.width;
    const canvasHeight = game.canvas.height;
    let targetX = game.player.x + game.player.w / 2 - canvasWidth / (2 * zoom);
    let targetY = game.player.y + game.player.h / 2 - canvasHeight / (2 * zoom);
    game.camera.x = Math.max(0, Math.min(targetX, worldWidth - canvasWidth / zoom));
    game.camera.y = Math.max(0, Math.min(targetY, worldHeight - canvasHeight / zoom));
}

function drawWorld(ctx, assets) {
    const { tileSize, zoom } = config;
    const startX = Math.floor(game.camera.x / tileSize);
    const endX = startX + Math.ceil(game.canvas.width / tileSize / zoom) + 1;
    const startY = Math.floor(game.camera.y / tileSize);
    const endY = startY + Math.ceil(game.canvas.height / tileSize / zoom) + 1;

    for (let y = Math.max(0, startY); y < Math.min(game.tileMap.length, endY); y++) {
        for (let x = Math.max(0, startX); x < Math.min(game.tileMap[y].length, endX); x++) {
            const tileType = game.tileMap[y][x];
            if (tileType > TILE.AIR) {
                const assetKey = Object.keys(TILE).find(k => TILE[k] === tileType)?.toLowerCase();
                const asset = assets[`tile_${assetKey}`];
                if (asset) {
                    ctx.drawImage(asset, x * tileSize, y * tileSize, tileSize, tileSize);
                } else {
                    const colors = { 1: '#32CD32', 2: '#8B4513', 3: '#696969' };
                    ctx.fillStyle = colors[tileType] || '#CCCCCC';
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }
    }
}

// --- Point d'Entrée Principal ---

async function main() {
    const loadingScreen = document.getElementById('loadingScreen');
    try {
        await initializeGame();
        await engine.start(gameLogic); // Le moteur charge les assets
        loadingScreen.style.display = 'none'; // Cacher l'écran de chargement
        game.rpgInterface.showNotification("Le jeu est prêt !", "success");
    } catch (error) {
        console.error("❌ Erreur fatale au démarrage:", error);
        loadingScreen.innerHTML = `<h1>Erreur de démarrage</h1><p>${error.message}</p>`;
        loadingScreen.style.color = 'red';
    }
}

window.addEventListener('resize', resizeCanvas);
document.addEventListener('DOMContentLoaded', main);