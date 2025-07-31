import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { generateLevel, TILE } from './world.js';
import { Logger } from './logger.js'; // NOUVEAU

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const config = await (await fetch('config.json')).json();
    const logger = new Logger(); // NOUVEAU

    const ui = {
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        gameTitle: document.getElementById('gameTitle'),
        mainMenu: document.getElementById('mainMenu'),
        optionsMenu: document.getElementById('optionsMenu'),
        controlsMenu: document.getElementById('controlsMenu'),
        skinlist: document.getElementById('skinlist'),
        hud: document.getElementById('hud'),
        lives: document.getElementById('lives'),
        gameover: document.getElementById('gameover'),
        message: document.getElementById('message'),
        btnRestart: document.getElementById('btnRestart'),
        toolbar: document.getElementById('toolbar'),
        renderDistanceSlider: document.getElementById('renderDistanceSlider'),
        renderDistanceValue: document.getElementById('renderDistanceValue'),
        zoomSlider: document.getElementById('zoomSlider'),
        zoomValue: document.getElementById('zoomValue'),
    };

    let game = {};
    let currentSkin = 0;
    let gameSettings = {
        renderDistance: config.renderDistance,
        zoom: config.zoom
    };

    const gameLogic = {
        init: (assets) => {
            setupMenus(assets);
        },
        update: (keys, mouse) => {
            logger.update(); // NOUVEAU
            if (!game.player || game.over || game.paused) return;
            try {
                game.player.update(keys, mouse, game);
                game.enemies.forEach(e => e.update(game));
                game.enemies = game.enemies.filter(e => !e.isDead);
                updateParticles();
                updateFallingBlocks();
                updateCollectibles();
                updateCamera(false);
                if (keys.action) keys.action = false;
                mouse.left = false; mouse.right = false;
            } catch (error) {
                logger.error(`Erreur update: ${error.message}`);
                game.over = true;
            }
        },
        draw: (ctx, assets) => {
            if (!game.player) return;
            drawSky(ctx);
            ctx.save();
            ctx.scale(gameSettings.zoom, gameSettings.zoom);
            ctx.translate(-Math.round(game.camera.x), -Math.round(game.camera.y));

            drawTileMap(ctx, assets);
            drawFallingBlocks(ctx, assets);
            drawCollectibles(ctx, assets);
            
            game.enemies.forEach(e => e.draw(ctx, assets));
            game.player.draw(ctx, assets, `player${currentSkin + 1}`);
            drawParticles(ctx);
            drawMiningEffect(ctx);
            ctx.restore();

            updateHUD();
            updateToolbarUI();
            logger.draw(ctx, canvas); // NOUVEAU
        },
        isPaused: () => game.paused,
        toggleMenu: (menu) => {
            if (menu === 'options') toggleOptionsMenu(!game.paused);
            else if (menu === 'controls') toggleControlsMenu(!game.paused);
        },
        selectTool: (index) => {
            if (game.player && index >= 0 && index < game.player.tools.length) {
                game.player.selectedToolIndex = index;
            }
        },
        showError: (error) => {
            logger.error(error.message);
            if(ui.mainMenu) ui.mainMenu.innerHTML = `<h2>Erreur de chargement.</h2><p style="font-size:0.5em;">${error}</p>`;
        }
    };
    
    const engine = new GameEngine(canvas, config);
    engine.start(gameLogic);

    function setupMenus(assets) {
        // ... (code inchangé)
    }

    function handleMenuAction(action, assets) {
        switch(action) {
            case 'start': initGame(assets); break;
            case 'options': showMenu(ui.optionsMenu); break;
            case 'backToMain': showMenu(ui.mainMenu); break;
            case 'closeMenu': toggleControlsMenu(false); break;
        }
    }

    function initGame(assets) {
        try {
            if (ui.gameTitle) ui.gameTitle.style.display = 'none';
            game = {
                player: null, camera: { x: 0, y: 0 },
                tileMap: [], enemies: [], particles: [], fallingBlocks: [], collectibles: [],
                lives: config.player.maxLives, over: false, paused: false,
                config: config,
                propagateTreeCollapse: propagateTreeCollapse,
                miningEffect: null,
                createParticles: (x, y, count, color, options) => createParticles(x, y, count, color, options),
                loseLife: () => loseLife(),
            };
            
            generateLevel(game, config, {});
            const spawnPoint = findSpawnPoint();
            game.player = new Player(spawnPoint.x, spawnPoint.y, config);
            updateCamera(true); 

            if(ui.mainMenu) {
                [ui.mainMenu, ui.optionsMenu].forEach(m => m?.classList.remove('active'));
                ui.hud?.classList.add('active');
            }
            
            createToolbar(assets);
        } catch (error) {
            logger.error(`Erreur init: ${error.message}`);
            if(ui.mainMenu) {
                ui.mainMenu.innerHTML = `<h2>Erreur au démarrage.</h2><p style="font-size:0.5em;">${error.message}</p>`;
                showMenu(ui.mainMenu);
            }
        }
    }

    // ... (le reste des fonctions de game.js reste ici)
});
