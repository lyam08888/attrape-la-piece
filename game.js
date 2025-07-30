import { Player } from './player.js';
import { Slime, Frog, Golem } from './enemy.js';
import { generateLevel, TILE } from './world.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        gameTitle: document.getElementById('gameTitle'),
        mainMenu: document.getElementById('mainMenu'),
        menuTitle: document.getElementById('menuTitle'),
        skinlist: document.getElementById('skinlist'),
        hud: document.getElementById('hud'),
        lives: document.getElementById('lives'),
        gameover: document.getElementById('gameover'),
        message: document.getElementById('message'),
        btnRestart: document.getElementById('btnRestart'),
        toolbar: document.getElementById('toolbar'),
    };

    let config, assets = {}, game, keys = {}, currentSkin = 0;

    async function main() {
        try {
            config = await (await fetch('config.json')).json();
            ui.canvas.width = window.innerWidth;
            ui.canvas.height = window.innerHeight;
            if(ui.gameTitle) ui.gameTitle.textContent = config.gameTitle;

            await loadAssets();
            setupMenus();
            setupInput();
        } catch (error) {
            console.error("Erreur de chargement:", error);
            if(ui.mainMenu) ui.mainMenu.innerHTML = `<h2>Erreur de chargement.</h2><p style="font-size:0.5em; margin-top:10px;">Vérifiez les fichiers et la console (F12). Erreur: ${error}</p>`;
        }
    }

    async function loadAssets() { /* ... (code inchangé) ... */ }
    
    function setupMenus() { /* ... (code inchangé) ... */ }

    function handleMenuAction(action) {
        switch(action) {
            case 'start': initGame(); break;
        }
    }
    
    function selectSkin(i) {
        currentSkin = i;
        [...ui.skinlist.children].forEach((img, index) => img.classList.toggle("selected", index === i));
    }

    function findSpawnPoint(game, config) { /* ... (code inchangé) ... */ }

    function initGame() {
        if (ui.gameTitle) ui.gameTitle.style.display = 'none';
        game = {
            player: null,
            camera: { x: 0, y: 0 },
            tileMap: [], enemies: [], particles: [], fallingBlocks: [],
            lives: config.player.maxLives, over: false,
            config: config,
            createParticles: createParticles,
            loseLife: loseLife,
            propagateTreeCollapse: propagateTreeCollapse
        };
        
        generateLevel(game, config, {});

        const spawnPoint = findSpawnPoint(game, config);
        game.player = new Player(spawnPoint.x, spawnPoint.y, config);

        updateCamera(true); 

        if(ui.mainMenu) {
            ui.mainMenu.classList.remove('active');
            ui.hud?.classList.add('active');
        }
        
        // Crée la barre d'outils au démarrage
        createToolbar();

        requestAnimationFrame(gameLoop);
    }
    
    function gameLoop() {
        if (!game || game.over) return;
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    function update() {
        try {
            game.player.update(keys, game);
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
        ui.ctx.restore();

        updateHUD();
        updateToolbarUI(); // Met à jour la surbrillance de l'outil
    }
    
    function propagateTreeCollapse(startX, startY) { /* ... (code inchangé) ... */ }
    function updateFallingBlocks() { /* ... (code inchangé) ... */ }
    function drawFallingBlocks() { /* ... (code inchangé) ... */ }
    function drawTileMap() { /* ... (code inchangé) ... */ }
    function drawParticles() { /* ... (code inchangé) ... */ }
    
    // NOUVEAU: Fonctions pour la barre d'outils
    function createToolbar() {
        ui.toolbar.innerHTML = '';
        game.player.tools.forEach((toolName, index) => {
            const slot = document.createElement('div');
            slot.className = 'toolbar-slot';
            slot.dataset.index = index;
            
            const img = document.createElement('img');
            img.src = assets[`tool_${toolName}`]?.src || '';
            slot.appendChild(img);
            
            ui.toolbar.appendChild(slot);
        });
    }

    function updateToolbarUI() {
        const slots = ui.toolbar.children;
        for (let i = 0; i < slots.length; i++) {
            slots[i].classList.toggle('selected', i === game.player.selectedToolIndex);
        }
    }

    function setupInput() {
        keys = { left: false, right: false, jump: false, action: false };
        document.addEventListener('keydown', e => {
            if (e.code === 'ArrowLeft') keys.left = true;
            if (e.code === 'ArrowRight') keys.right = true;
            if (e.code === 'Space' || e.code === 'ArrowUp') keys.jump = true;
            if (e.code === 'KeyA') keys.action = true;

            // Sélection de l'outil avec les touches 1-6
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
    }

    function createParticles(x, y, count, color, options = {}) { /* ... (code inchangé) ... */ }
    function updateHUD() { /* ... (code inchangé) ... */ }
    function loseLife() { /* ... (code inchangé) ... */ }
    function endGame(win) { /* ... (code inchangé) ... */ }
    function drawSky() { /* ... (code inchangé) ... */ }
    function updateParticles() { /* ... (code inchangé) ... */ }

    main();
});
