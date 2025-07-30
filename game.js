import { Player } from './player.js';
import { Slime, Frog, Golem } from './enemy.js';
import { generateLevel, TILE } from './world.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        gameTitle: document.getElementById('gameTitle'),
        mainMenu: document.getElementById('mainMenu'),
        controlsMenu: document.getElementById('controlsMenu'),
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

    async function loadAssets() {
        const promises = [];
        const allAssetPaths = {};
        const baseUrl = config.githubRepoUrl || ''; 

        for (const [key, path] of Object.entries(config.assets)) {
            if (path.startsWith('http://') || path.startsWith('https://')) {
                allAssetPaths[key] = path;
            } else {
                allAssetPaths[key] = baseUrl + path;
            }
        }
        config.skins.forEach((fileName, i) => {
            allAssetPaths[`player${i+1}`] = baseUrl + 'assets/' + fileName;
        });

        for (const [key, path] of Object.entries(allAssetPaths)) {
            promises.push(new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = path;
                img.onload = () => { assets[key] = img; resolve(); };
                img.onerror = () => reject(`Impossible de charger l'asset: ${path}`);
            }));
        }
        await Promise.all(promises);
    }
    
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
            case 'closeMenu': toggleMenu(false); break;
        }
    }
    
    function selectSkin(i) {
        currentSkin = i;
        [...ui.skinlist.children].forEach((img, index) => img.classList.toggle("selected", index === i));
    }

    function findSpawnPoint(game, config) {
        const { tileSize, worldWidth, worldHeight } = config;
        const worldWidthInTiles = Math.floor(worldWidth / tileSize);
        const worldHeightInTiles = Math.floor(worldHeight / tileSize);
        const spawnX = Math.floor(worldWidthInTiles / 2);

        for (let y = 0; y < worldHeightInTiles; y++) {
            if (game.tileMap[y] && game.tileMap[y][spawnX] > 0) {
                return { x: spawnX * tileSize, y: (y - 2) * tileSize };
            }
        }
        return { x: worldWidth / 2, y: 100 };
    }

    function initGame() {
        try {
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
                miningEffect: null
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
        } catch (error) {
            console.error("Erreur critique pendant l'initialisation du jeu:", error);
            if(ui.mainMenu) {
                ui.mainMenu.innerHTML = `<h2>Erreur au démarrage.</h2><p style="font-size:0.5em;">Vérifiez la console (F12). Erreur: ${error.message}</p>`;
                ui.mainMenu.classList.add('active');
            }
        }
    }
    
    function gameLoop() {
        if (!game) return;
        if (!game.paused && !game.over) {
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
            // On réinitialise l'état des actions à la fin de chaque frame
            if (keys.action) keys.action = false;
            mouse.left = false;
            mouse.right = false;
        } catch (error) {
            console.error("Erreur dans la boucle de jeu:", error);
            game.over = true;
        }
    }
    
    function updateCamera(isInstant = false) {
        const targetX = game.player.x - ui.canvas.width / 2;
        const targetY = game.player.y - ui.canvas.height / 2;
        
        if (isInstant) {
            game.camera.x = targetX;
            game.camera.y = targetY;
        } else {
            game.camera.x += (targetX - game.camera.x) * 0.1;
            game.camera.y += (targetY - game.camera.y) * 0.1;
        }
        
        game.camera.x = Math.max(0, Math.min(game.camera.x, config.worldWidth - ui.canvas.width));
        game.camera.y = Math.max(0, Math.min(game.camera.y, config.worldHeight - ui.canvas.height));
    }

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
        drawMiningEffect();
        ui.ctx.restore();

        updateHUD();
        updateToolbarUI();
    }
    
    function propagateTreeCollapse(startX, startY) { /* ... (code inchangé) ... */ }
    function updateFallingBlocks() { /* ... (code inchangé) ... */ }
    function drawFallingBlocks() { /* ... (code inchangé) ... */ }
    function drawTileMap() { /* ... (code inchangé) ... */ }
    function drawParticles() { /* ... (code inchangé) ... */ }
    function drawMiningEffect() { /* ... (code inchangé) ... */ }
    function createToolbar() { /* ... (code inchangé) ... */ }
    function updateToolbarUI() { /* ... (code inchangé) ... */ }
    function toggleMenu(show) { /* ... (code inchangé) ... */ }

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
        
        // CORRECTION: Restauration de la gestion de la souris
        ui.canvas.addEventListener('mousemove', e => {
            const rect = ui.canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        ui.canvas.addEventListener('mousedown', e => {
            if (game && !game.paused) {
                if (e.button === 0) mouse.left = true;
                if (e.button === 2) mouse.right = true;
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
