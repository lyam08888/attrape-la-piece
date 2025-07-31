import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { generateLevel, TILE } from './world.js';
import { Logger } from './logger.js';

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const config = await (await fetch('config.json')).json();
    const logger = new Logger();

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
        score: document.getElementById('score'),
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
            logger.update();
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
            drawSky(ctx);
            
            if (game.player) {
                ctx.save();
                ctx.scale(gameSettings.zoom, gameSettings.zoom);
                ctx.translate(-Math.round(game.camera.x), -Math.round(game.camera.y));

                drawTileMap(ctx, assets);
                drawFallingBlocks(ctx, assets);
                drawCollectibles(ctx, assets);
                
                game.decorations.forEach(d => ctx.drawImage(assets.decoration_bush, d.x, d.y, d.w, d.h));
                game.coins.forEach(c => ctx.drawImage(assets.coin, c.x, c.y, c.w, c.h));
                game.bonuses.forEach(b => ctx.drawImage(assets.bonus, b.x, b.y, b.w, b.h));
                game.checkpoints.forEach(c => ctx.drawImage(c.activated ? assets.checkpoint_on : assets.checkpoint_off, c.x, c.y, c.w, c.h));
                if (game.flag) ctx.drawImage(assets.flag, game.flag.x, game.flag.y, game.flag.w, game.flag.h);

                game.enemies.forEach(e => e.draw(ctx, assets));
                game.player.draw(ctx, assets, `player${currentSkin + 1}`);
                drawParticles(ctx);
                drawMiningEffect(ctx);
                ctx.restore();
            }
            
            updateHUD();
            updateToolbarUI();
            logger.draw(ctx, canvas);
        },
        // ... (autres fonctions de logique de jeu)
    };
    
    const engine = new GameEngine(canvas, config);
    engine.start(gameLogic);

    function initGame(assets) {
        try {
            if (ui.gameTitle) ui.gameTitle.style.display = 'none';
            game = {
                player: null, camera: { x: 0, y: 0 },
                tileMap: [], enemies: [], particles: [], fallingBlocks: [], collectibles: [],
                decorations: [], coins: [], bonuses: [], checkpoints: [], flag: null,
                score: 0, lives: config.player.maxLives, over: false, paused: false,
                lastCheckpoint: null,
                config: config,
                // ... (autres propriétés)
            };
            
            generateLevel(game, config, {});
            const spawnPoint = findSpawnPoint();
            game.player = new Player(spawnPoint.x, spawnPoint.y, config);
            game.lastCheckpoint = { x: spawnPoint.x, y: spawnPoint.y };
            updateCamera(true); 

            if(ui.mainMenu) {
                [ui.mainMenu, ui.optionsMenu].forEach(m => m?.classList.remove('active'));
                ui.hud?.classList.add('active');
            }
            
            createToolbar(assets);
        } catch (error) {
            logger.error(`Erreur init: ${error.message}`);
        }
    }

    function loseLife() { 
        if(!game || game.over || (game.player && game.player.invulnerable > 0)) return; 
        game.lives--; 
        updateHUD();
        if(game.lives <= 0) {
            endGame(false);
        } else {
            game.player.x = game.lastCheckpoint.x;
            game.player.y = game.lastCheckpoint.y;
            game.player.invulnerable = 120; 
        }
    }

    function updateHUD() {
        if(!game || !ui.hud) return; 
        ui.lives.textContent = '❤'.repeat(game.lives);
        ui.score.textContent = `SCORE: ${game.score || 0}`;
    }
    
    // ... (le reste des fonctions de game.js reste ici)
});
