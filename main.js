// Importation des modules critiques
import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { TILE, generateLevel } from './world.js';
import { RPGInterfaceManager } from './rpgInterfaceManager.js';
import { integrateAdvancedSystems } from './advancedSystemsIntegration.js';
import { CombatSystem } from './combatSystem.js';
import { FoodSystem } from './foodSystem.js';
import { integrateMiningWithRPG } from './miningEngine.js';
import { Logger } from './logger.js';

// --- Configuration Globale ---
let game = {};
let engine = null;
const logger = new Logger();
const config = {
    version: "3.2-stable",
    tileSize: 16,
    zoom: 3,
    worldWidth: 2048,
    worldHeight: 1024,
    physics: { gravity: 0.35, jumpForce: 8, playerSpeed: 3, friction: 0.85, maxFallSpeed: 10, groundAcceleration: 0.4, airAcceleration: 0.2 },
    player: { width: 16, height: 24 },
    chunkSize: 16,
    renderDistance: 8,
    keyBindings: {
        left: 'arrowleft',
        right: 'arrowright',
        jump: ' ',
        action: 'e',
        attack: 'f'
    }
};

// --- Fonctions Utilitaires ---
function updateLoadingStatus(message) {
    const statusEl = document.getElementById('loadingStatus');
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function findSafeSpawnPoint(tileMap, playerHeight, tileSize) {
    const worldCenter = Math.floor(tileMap[0].length / 2);
    for (let x = worldCenter; x < tileMap[0].length; x++) {
        for (let y = 0; y < tileMap.length - 1; y++) {
            const isGround = tileMap[y][x] > TILE.AIR && tileMap[y][x] !== TILE.WATER;
            const isAirAbove = tileMap[y - 1]?.[x] === TILE.AIR && tileMap[y - 2]?.[x] === TILE.AIR;
            if (isGround && isAirAbove) {
                return { x: x * tileSize, y: (y - 2) * tileSize };
            }
        }
    }
    return { x: worldCenter * tileSize, y: 100 };
}

// --- Logique de Jeu (Update & Draw) ---
const gameLogic = {
    init: async (assets) => {
        game.assets = assets;
        logger.success("🖼️ Assets chargés avec succès.");
        return true;
    },
    update: (delta, keys) => {
        if (!game || !game.player || game.paused) return;
        
        // Mettre à jour tous les systèmes
        game.player.update(keys, game, delta);
        game.enemies.forEach(e => e.update(game, delta));
        game.pnjs.forEach(p => p.update(game, delta));
        game.timeSystem?.update(delta);
        game.rpgInterface.updateHUD();
        logger.update(); // Mettre à jour le logger
        
        updateCamera();
    },
    draw: (ctx, assets) => {
        if (!game || !game.player) return;
        
        ctx.fillStyle = game.timeSystem ? game.timeSystem.getSkyColor() : '#87CEEB';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();
        ctx.scale(config.zoom, config.zoom);
        ctx.translate(-game.camera.x, -game.camera.y);
        drawWorld(ctx, assets);
        game.enemies.forEach(e => e.draw(ctx, assets));
        game.pnjs.forEach(p => p.draw(ctx, assets));
        game.player.draw(ctx, assets);
        ctx.restore();
        game.rpgInterface.draw(ctx);
        
        // Dessiner le logger par-dessus tout
        logger.draw(ctx);
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
    const endX = startX + Math.ceil(ctx.canvas.width / tileSize / zoom) + 1;
    const startY = Math.floor(game.camera.y / tileSize);
    const endY = startY + Math.ceil(ctx.canvas.height / tileSize / zoom) + 1;

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

// --- Fonctions de Scène ---
function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
}

function showLoadingScreen() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'flex';
    document.getElementById('gameContainer').style.display = 'none';
}

function showGame() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    resizeCanvas();
}

// --- Point d'Entrée Principal ---
async function startGameSequence() {
    showLoadingScreen();
    
    const loadingStatus = document.getElementById('loadingStatus');
    const updateStatus = (msg) => {
        if(loadingStatus) loadingStatus.textContent = msg;
        logger.log(msg, 'init');
    };

    try {
        updateStatus("Initialisation du moteur...");
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) throw new Error("Canvas non trouvé!");
        resizeCanvas();
        engine = new GameEngine(canvas, config, logger);
        
        game = { config, canvas, ctx: canvas.getContext('2d'), paused: false, logger };
        window.game = game;

        updateStatus("Génération du monde...");
        game.tileMap = generateLevel(Math.floor(config.worldWidth / config.tileSize), Math.floor(config.worldHeight / config.tileSize));
        
        updateStatus("Création de l'aventurier...");
        const spawnPoint = findSafeSpawnPoint(game.tileMap, config.player.height, config.tileSize);
        game.spawnPoint = spawnPoint;
        game.player = new Player(spawnPoint.x, spawnPoint.y, config, null);

        updateStatus("Activation des systèmes...");
        game.rpgInterface = new RPGInterfaceManager();
        integrateAdvancedSystems(game);
        game.combatSystem = new CombatSystem();
        game.foodSystem = new FoodSystem();
        integrateMiningWithRPG(game);

        updateStatus("Chargement des assets...");
        await engine.start(gameLogic);

        showGame();
        game.rpgInterface.showNotification("Bienvenue dans l'aventure !", "success");
        logger.log("Jeu démarré. Appuyez sur 'F2' pour le logger.", 'debug');

    } catch (error) {
        console.error("❌ Erreur fatale au démarrage:", error);
        if(loadingStatus) loadingStatus.innerHTML = `Erreur: ${error.message}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showMainMenu();
    
    document.getElementById('startGameBtn').onclick = () => {
        startGameSequence();
    };

    window.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            logger.toggleVisibility();
        }
    });

    window.addEventListener('resize', resizeCanvas);
});