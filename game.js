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
    };

    let config, assets = {}, game, keys = {}, mouse = {x:0, y:0, left:false, right:false}, currentSkin = 0;

    async function main() {
        try {
            config = await (await fetch('config.json')).json();
            // Le canvas prend maintenant la taille de la fenêtre
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
        if (ui.gameTitle) ui.gameTitle.style.display = 'none'; // Cache le titre principal
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
            game.player.update(keys, mouse, game);
            game.enemies.forEach(e => e.update(game));
            game.enemies = game.enemies.filter(e => !e.isDead);
            updateParticles();
            updateFallingBlocks();
            updateCamera(false);
            mouse.left = false; mouse.right = false;
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
        ui.ctx.restore();

        updateHUD();
        drawInventoryUI();
    }
    
    function propagateTreeCollapse(startX, startY) {
        // ... (code inchangé)
    }
    function updateFallingBlocks() {
        // ... (code inchangé)
    }
    function drawFallingBlocks() {
        // ... (code inchangé)
    }
    function drawTileMap() {
        // ... (code inchangé)
    }
    function drawParticles() {
        // ... (code inchangé)
    }

    function drawInventoryUI() {
        // ... (code inchangé)
    }
    
    function setupInput() {
        // ... (code inchangé)
    }

    function createParticles(x, y, count, color, options = {}) {
        // ... (code inchangé)
    }

    function updateHUD() {
        if(!game || !ui.hud) return; 
        ui.lives.textContent = '❤'.repeat(game.lives); 
    }

    function loseLife() { 
        if(!game || game.over || (game.player && game.player.invulnerable > 0)) return; 
        game.lives--; 
        updateHUD();
        if(game.lives <= 0) {
            endGame(false);
        } else {
            game.player.invulnerable = 120; 
        }
    }
    function endGame(win) {
        if (!game || game.over) return;
        game.over = true;
        if(ui.message) ui.message.innerHTML = win ? `🎉 Victoire! 🎉` : `💀 Game Over 💀`;
        ui.hud?.classList.remove('active');
        ui.gameover?.classList.add('active');
    }
    function drawSky() {
        const grad = ui.ctx.createLinearGradient(0, 0, 0, ui.canvas.height);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#5C94FC');
        ui.ctx.fillStyle = grad;
        ui.ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    }
    function updateParticles() {
        if (!game) return;
        game.particles.forEach((p, index) => {
            p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
            if (p.life <= 0) game.particles.splice(index, 1);
        });
    }

    main();
});
