import { Player } from './player.js';
import { Slime, Frog, Golem } from './enemy.js';
import { generateLevel, TILE } from './world.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        gameTitle: document.getElementById('gameTitle'),
        mainMenu: document.getElementById('mainMenu'),
        controlsMenu: document.getElementById('controlsMenu'), // NOUVEAU
        menuTitle: document.getElementById('menuTitle'),
        skinlist: document.getElementById('skinlist'),
        hud: document.getElementById('hud'),
        lives: document.getElementById('lives'),
        gameover: document.getElementById('gameover'),
        message: document.getElementById('message'),
        btnRestart: document.getElementById('btnRestart'),
        toolbar: document.getElementById('toolbar'),
    };

    let config, assets = {}, game, keys = {}, mouse = {x:0, y:0, left:false, right:false}, currentSkin = 0;

    async function main() { /* ... (code inchangé) ... */ }
    async function loadAssets() { /* ... (code inchangé) ... */ }
    
    function setupMenus() {
        if(!ui.mainMenu) { 
            initGame();
            return;
        }
        ui.skinlist.innerHTML = '';
        config.skins.forEach((_, i) => {
            const img = assets[`player${i+1}`].cloneNode();
            img.onclick = () => selectSkin(i);
            if (i === currentSkin) img.classList.add("selected");
            ui.skinlist.appendChild(img);
        });
        
        document.body.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) handleMenuAction(action);
        });
        if(ui.btnRestart) ui.btnRestart.onclick = initGame;
    }

    function handleMenuAction(action) {
        switch(action) {
            case 'start': initGame(); break;
            case 'closeMenu': toggleMenu(false); break; // Pour fermer le menu des contrôles
        }
    }
    
    function selectSkin(i) { /* ... (code inchangé) ... */ }
    function findSpawnPoint(game, config) { /* ... (code inchangé) ... */ }

    function initGame() {
        if (ui.gameTitle) ui.gameTitle.style.display = 'none';
        game = {
            player: null,
            camera: { x: 0, y: 0 },
            tileMap: [], enemies: [], particles: [], fallingBlocks: [],
            lives: config.player.maxLives, over: false, paused: false,
            config: config,
            createParticles: createParticles,
            loseLife: loseLife,
            propagateTreeCollapse: propagateTreeCollapse,
            miningEffect: null // Pour l'animation de minage
        };
        
        generateLevel(game, config, {});
        const spawnPoint = findSpawnPoint(game, config);
        game.player = new Player(spawnPoint.x, spawnPoint.y, config);
        updateCamera(true); 

        if(ui.mainMenu) {
            ui.mainMenu.classList.remove('active');
            ui.hud?.classList.add('active');
        }
        
        createToolbar();
        requestAnimationFrame(gameLoop);
    }
    
    function gameLoop() {
        if (!game) return;
        if (!game.paused) {
            update();
        }
        draw();
        requestAnimationFrame(gameLoop);
    }

    function update() {
        try {
            game.player.update(keys, mouse, game);
            game.enemies.forEach(e => e.update(game));
            game.enemies = game.enemies.filter(e => !e.isDead);
            updateParticles();
            updateFallingBlocks();
            updateCamera(false);
        } catch (error) {
            console.error("Erreur dans la boucle de jeu:", error);
            game.over = true;
        }
    }
    
    function updateCamera(isInstant = false) { /* ... (code inchangé) ... */ }

    function draw() {
        if (!game) return;
        drawSky();
        ui.ctx.save();
        ui.ctx.translate(-Math.round(game.camera.x), -Math.round(game.camera.y));

        drawTileMap();
        drawFallingBlocks();
        
        game.enemies.forEach(e => e.draw(ui.ctx, assets));
        game.player.draw(ui.ctx, assets, `player${currentSkin + 1}`);
        drawParticles();
        drawMiningEffect(); // NOUVEAU
        ui.ctx.restore();

        updateHUD();
        updateToolbarUI();
    }
    
    function propagateTreeCollapse(startX, startY) { /* ... (code inchangé) ... */ }
    function updateFallingBlocks() { /* ... (code inchangé) ... */ }
    function drawFallingBlocks() { /* ... (code inchangé) ... */ }
    function drawTileMap() { /* ... (code inchangé) ... */ }
    function drawParticles() { /* ... (code inchangé) ... */ }
    
    function drawMiningEffect() {
        if (game && game.miningEffect) {
            const { x, y, progress } = game.miningEffect;
            const { tileSize } = config;
            ui.ctx.globalAlpha = 0.5;
            ui.ctx.fillStyle = 'white';
            const crackWidth = tileSize * Math.min(1, progress * 2);
            const crackHeight = 2;
            ui.ctx.fillRect(x * tileSize + (tileSize - crackWidth) / 2, y * tileSize + tileSize / 2 - crackHeight / 2, crackWidth, crackHeight);
            if (progress > 0.5) {
                const crackWidth2 = tileSize * Math.min(1, (progress - 0.5) * 2);
                const crackHeight2 = 2;
                ui.ctx.fillRect(x * tileSize + tileSize / 2 - crackHeight2 / 2, y * tileSize + (tileSize - crackWidth2) / 2, crackHeight2, crackWidth2);
            }
            ui.ctx.globalAlpha = 1.0;
        }
    }

    function createToolbar() { /* ... (code inchangé) ... */ }
    function updateToolbarUI() { /* ... (code inchangé) ... */ }

    function toggleMenu(show) {
        if (show) {
            game.paused = true;
            ui.controlsMenu.classList.add('active');
        } else {
            game.paused = false;
            ui.controlsMenu.classList.remove('active');
        }
    }

    function setupInput() {
        keys = { left: false, right: false, jump: false, action: false };
        document.addEventListener('keydown', e => {
            if (game && game.paused && e.code !== 'KeyC') return;

            if (e.code === 'ArrowLeft') keys.left = true;
            if (e.code === 'ArrowRight') keys.right = true;
            if (e.code === 'Space' || e.code === 'ArrowUp') keys.jump = true;
            if (e.code === 'KeyA') keys.action = true;
            if (e.code === 'KeyC') toggleMenu(!game.paused);

            if (e.code.startsWith('Digit')) {
                const index = parseInt(e.code.replace('Digit', '')) - 1;
                if (game && game.player && index >= 0 && index < game.player.tools.length) {
                    game.player.selectedToolIndex = index;
                }
            }
        });
        document.addEventListener('keyup', e => {
            if (e.code === 'ArrowLeft') keys.left = false;
            if (e.code === 'ArrowRight') keys.right = false;
            if (e.code === 'Space' || e.code === 'ArrowUp') keys.jump = false;
        });
        
        ui.canvas.addEventListener('mousedown', e => {
            if (game && !game.paused) {
                if (e.button === 0) mouse.left = true;
            }
        });
        ui.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    function createParticles(x, y, count, color, options = {}) { /* ... (code inchangé) ... */ }
    function updateHUD() { /* ... (code inchangé) ... */ }
    function loseLife() { /* ... (code inchangé) ... */ }
    function endGame(win) { /* ... (code inchangé) ... */ }
    function drawSky() { /* ... (code inchangé) ... */ }
    function updateParticles() { /* ... (code inchangé) ... */ }

    main();
});
