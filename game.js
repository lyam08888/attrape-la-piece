import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { generateLevel, TILE } from './world.js';

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const config = await (await fetch('config.json')).json();

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
            if (!game.player || game.over || game.paused) return;
            game.player.update(keys, mouse, game);
            game.enemies.forEach(e => e.update(game));
            game.enemies = game.enemies.filter(e => !e.isDead);
            updateParticles();
            updateFallingBlocks();
            updateCollectibles();
            updateCamera(false);
            if (keys.action) keys.action = false;
            mouse.left = false; mouse.right = false;
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
            if(ui.mainMenu) ui.mainMenu.innerHTML = `<h2>Erreur de chargement.</h2><p style="font-size:0.5em;">${error}</p>`;
        }
    };
    
    const engine = new GameEngine(canvas, config);
    engine.start(gameLogic);

    function setupMenus(assets) {
        if (!ui.mainMenu) { initGame(assets); return; }
        ui.skinlist.innerHTML = '';
        config.skins.forEach((_, i) => {
            const img = assets[`player${i+1}`].cloneNode();
            img.onclick = () => selectSkin(i);
            if (i === currentSkin) img.classList.add("selected");
            ui.skinlist.appendChild(img);
        });
        
        document.body.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) handleMenuAction(action, assets);
        });

        if (ui.renderDistanceSlider) {
            ui.renderDistanceSlider.value = gameSettings.renderDistance;
            ui.renderDistanceValue.textContent = `${gameSettings.renderDistance} chunks`;
            ui.renderDistanceSlider.oninput = (e) => {
                gameSettings.renderDistance = parseInt(e.target.value);
                ui.renderDistanceValue.textContent = `${gameSettings.renderDistance} chunks`;
            };
        }

        if (ui.zoomSlider) {
            ui.zoomSlider.value = gameSettings.zoom;
            ui.zoomValue.textContent = `x${gameSettings.zoom}`;
            ui.zoomSlider.oninput = (e) => {
                gameSettings.zoom = parseFloat(e.target.value);
                ui.zoomValue.textContent = `x${gameSettings.zoom}`;
            };
        }

        if(ui.btnRestart) ui.btnRestart.onclick = () => initGame(assets);
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
        if (ui.gameTitle) ui.gameTitle.style.display = 'none';
        game = {
            player: null, camera: { x: 0, y: 0 },
            tileMap: [], enemies: [], particles: [], fallingBlocks: [], collectibles: [],
            lives: config.player.maxLives, over: false, paused: false,
            config: config,
            // ... (autres propriétés)
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
    }

    function toggleOptionsMenu(show) {
        if (!game) return;
        game.paused = show;
        if (show) {
            showMenu(ui.optionsMenu);
        } else {
            showMenu(null); // Cache tous les menus
        }
    }

    function toggleControlsMenu(show) {
        if (!game) return;
        game.paused = show;
        if (show) {
            showMenu(ui.controlsMenu);
        } else {
            showMenu(null);
        }
    }

    // ... (le reste des fonctions de game.js reste ici)
});
