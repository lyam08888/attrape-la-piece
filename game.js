import { Player } from './player.js';
import { Slime, Frog, Golem } from './enemy.js';
import { generateLevel, TILE } from './world.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        // ... (autres éléments UI comme avant)
    };

    let config, assets = {}, game, keys = {}, mouse = {x:0, y:0, left:false, right:false};

    async function main() {
        config = await (await fetch('config.json')).json();
        ui.canvas.width = config.canvasWidth;
        ui.canvas.height = config.canvasHeight;
        await loadAssets();
        setupInput(); // Inclut maintenant la souris
        initGame();
    }

    async function loadAssets() { /* ... (code de chargement inchangé) ... */ }
    
    function initGame() {
        game = {
            player: new Player(config.worldWidth / 2, 100, config),
            camera: { x: 0, y: 0 },
            tileMap: [], enemies: [], particles: [],
            score: 0, lives: config.player.maxLives, over: false,
            config: config,
            createParticles: createParticles,
            loseLife: loseLife
        };
        generateLevel(game, config, {});
        requestAnimationFrame(gameLoop);
    }
    
    function gameLoop() {
        if (!game || game.over) return;
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    function update() {
        game.player.update(keys, mouse, game);
        game.enemies.forEach(e => e.update(game));
        game.enemies = game.enemies.filter(e => !e.isDead);
        updateParticles();
        updateCamera();
        // Réinitialise l'état de la souris pour éviter les actions répétées
        mouse.left = false; mouse.right = false;
    }
    
    function updateCamera() {
        const targetX = game.player.x - ui.canvas.width / 2;
        const targetY = game.player.y - ui.canvas.height / 2;
        game.camera.x += (targetX - game.camera.x) * 0.1;
        game.camera.y += (targetY - game.camera.y) * 0.1;
        game.camera.x = Math.max(0, Math.min(game.camera.x, config.worldWidth - ui.canvas.width));
        game.camera.y = Math.max(0, Math.min(game.camera.y, config.worldHeight - ui.canvas.height));
    }

    function draw() {
        if (!game) return;
        drawSky();
        ui.ctx.save();
        ui.ctx.translate(-game.camera.x, -game.camera.y);

        drawTileMap();
        
        game.enemies.forEach(e => e.draw(ui.ctx, assets));
        game.player.draw(ui.ctx, assets);
        drawParticles();
        ui.ctx.restore();

        drawInventoryUI();
    }

    function drawTileMap() {
        const { tileSize } = config;
        const startCol = Math.floor(game.camera.x / tileSize);
        const endCol = startCol + Math.ceil(ui.canvas.width / tileSize);
        const startRow = Math.floor(game.camera.y / tileSize);
        const endRow = startRow + Math.ceil(ui.canvas.height / tileSize);

        const TILE_ASSETS = { [TILE.GRASS]: assets.tile_grass, [TILE.DIRT]: assets.tile_dirt, [TILE.STONE]: assets.tile_stone, [TILE.WOOD]: assets.tile_wood, [TILE.LEAVES]: assets.tile_leaves, [TILE.COAL]: assets.tile_coal, [TILE.IRON]: assets.tile_iron };

        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (game.tileMap[y]?.[x] > 0) {
                    const asset = TILE_ASSETS[game.tileMap[y][x]];
                    if (asset) ui.ctx.drawImage(asset, x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }
    }

    function drawInventoryUI() {
        const ctx = ui.ctx;
        const startX = 20;
        const startY = 20;
        const slotSize = 40;
        const padding = 5;

        // Dessine un slot pour la pioche (implicite) et un pour l'objet équipé
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        const equippedItemTile = game.player.equippedItem;
        const asset = { [TILE.DIRT]: assets.tile_dirt, [TILE.STONE]: assets.tile_stone, [TILE.WOOD]: assets.tile_wood }[equippedItemTile];
        
        ctx.strokeRect(startX, startY, slotSize, slotSize);
        if (asset) {
            ctx.drawImage(asset, startX + padding, startY + padding, slotSize - padding * 2, slotSize - padding * 2);
        }
        ctx.fillStyle = '#fff';
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'right';
        ctx.fillText(game.player.inventory[equippedItemTile], startX + slotSize - 5, startY + slotSize - 5);
    }
    
    function setupInput() {
        keys = { left: false, right: false, jump: false };
        document.addEventListener('keydown', e => {
            if (e.code === 'ArrowLeft') keys.left = true;
            if (e.code === 'ArrowRight') keys.right = true;
            if (e.code === 'Space' || e.code === 'ArrowUp') keys.jump = true;
        });
        document.addEventListener('keyup', e => {
            if (e.code === 'ArrowLeft') keys.left = false;
            if (e.code === 'ArrowRight') keys.right = false;
            if (e.code === 'Space' || e.code === 'ArrowUp') keys.jump = false;
        });

        // Gestion de la souris
        ui.canvas.addEventListener('mousemove', e => {
            const rect = ui.canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        ui.canvas.addEventListener('mousedown', e => {
            if (e.button === 0) mouse.left = true;
            if (e.button === 2) mouse.right = true;
        });
        // Empêche le menu contextuel du clic droit
        ui.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    function createParticles(x, y, count, color, options = {}) { /* ... (code inchangé) ... */ }
    function loseLife() { /* ... (code inchangé) ... */ }
    function drawSky() { /* ... (code inchangé) ... */ }
    function updateParticles() { /* ... (code inchangé) ... */ }

    main();
});
