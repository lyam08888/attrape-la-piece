import { Player } from './player.js';
import { Slime, Frog, Golem } from './enemy.js';
import { generateLevel, TILE } from './world.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        gameTitle: document.getElementById('gameTitle'),
        mainMenu: document.getElementById('mainMenu'),
        optionsMenu: document.getElementById('optionsMenu'),
        controlsMenu: document.getElementById('controlsMenu'),
        menuTitle: document.getElementById('menuTitle'),
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

    let config, assets = {}, game, keys = {}, mouse = {x:0, y:0, left:false, right:false}, currentSkin = 0;
    let gameSettings = {};

    async function main() {
        try {
            config = await (await fetch('config.json')).json();
            gameSettings.renderDistance = config.renderDistance;
            gameSettings.zoom = config.zoom;

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
        if(!ui.mainMenu) { initGame(); return; }
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

        ui.renderDistanceSlider.value = gameSettings.renderDistance;
        ui.renderDistanceValue.textContent = `${gameSettings.renderDistance} chunks`;
        ui.renderDistanceSlider.oninput = (e) => {
            gameSettings.renderDistance = parseInt(e.target.value);
            ui.renderDistanceValue.textContent = `${gameSettings.renderDistance} chunks`;
        };

        ui.zoomSlider.value = gameSettings.zoom;
        ui.zoomValue.textContent = `x${gameSettings.zoom}`;
        ui.zoomSlider.oninput = (e) => {
            gameSettings.zoom = parseFloat(e.target.value);
            ui.zoomValue.textContent = `x${gameSettings.zoom}`;
        };

        if(ui.btnRestart) ui.btnRestart.onclick = initGame;
    }

    function handleMenuAction(action) {
        switch(action) {
            case 'start': initGame(); break;
            case 'options': showMenu(ui.optionsMenu); break;
            case 'backToMain': showMenu(ui.mainMenu); break;
            case 'closeMenu': toggleMenu(false); break;
        }
    }
    
    function showMenu(menuToShow) {
        [ui.mainMenu, ui.optionsMenu, ui.controlsMenu].forEach(m => m?.classList.remove('active'));
        menuToShow?.classList.add('active');
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
                player: null, camera: { x: 0, y: 0 },
                tileMap: [], enemies: [], particles: [], fallingBlocks: [], collectibles: [],
                lives: config.player.maxLives, over: false, paused: false,
                config: config, createParticles: createParticles, loseLife: loseLife,
                propagateTreeCollapse: propagateTreeCollapse, miningEffect: null,
                settings: gameSettings
            };
            
            generateLevel(game, config, {});
            const spawnPoint = findSpawnPoint(game, config);
            game.player = new Player(spawnPoint.x, spawnPoint.y, config);
            updateCamera(true); 

            if(ui.mainMenu) {
                [ui.mainMenu, ui.optionsMenu].forEach(m => m?.classList.remove('active'));
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
        if (!game.paused && !game.over) update();
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
            updateCollectibles();
            updateCamera(false);
            if (keys.action) keys.action = false;
            mouse.left = false; mouse.right = false;
        } catch (error) {
            console.error("Erreur dans la boucle de jeu:", error);
            game.over = true;
        }
    }
    
    function updateCamera(isInstant = false) {
        const targetX = game.player.x - (ui.canvas.width / game.settings.zoom) / 2;
        const targetY = game.player.y - (ui.canvas.height / game.settings.zoom) / 2;
        
        if (isInstant) {
            game.camera.x = targetX;
            game.camera.y = targetY;
        } else {
            game.camera.x += (targetX - game.camera.x) * 0.1;
            game.camera.y += (targetY - game.camera.y) * 0.1;
        }
        
        game.camera.x = Math.max(0, Math.min(game.camera.x, config.worldWidth - (ui.canvas.width / game.settings.zoom)));
        game.camera.y = Math.max(0, Math.min(game.camera.y, config.worldHeight - (ui.canvas.height / game.settings.zoom)));
    }

    function draw() {
        if (!game) return;
        drawSky();
        ui.ctx.save();
        ui.ctx.scale(game.settings.zoom, game.settings.zoom);
        ui.ctx.translate(-Math.round(game.camera.x), -Math.round(game.camera.y));

        drawTileMap();
        drawFallingBlocks();
        drawCollectibles();
        
        game.enemies.forEach(e => e.draw(ui.ctx, assets));
        game.player.draw(ui.ctx, assets, `player${currentSkin + 1}`);
        drawParticles();
        drawMiningEffect();
        ui.ctx.restore();

        updateHUD();
        updateToolbarUI();
    }
    
    function drawTileMap() {
        const { tileSize, chunkSize } = config;
        const playerChunkX = Math.floor(game.player.x / (chunkSize * tileSize));
        const playerChunkY = Math.floor(game.player.y / (chunkSize * tileSize));
        
        const startChunkX = Math.max(0, playerChunkX - game.settings.renderDistance);
        const endChunkX = playerChunkX + game.settings.renderDistance;
        const startChunkY = Math.max(0, playerChunkY - game.settings.renderDistance);
        const endChunkY = playerChunkY + game.settings.renderDistance;

        const TILE_ASSETS = { [TILE.GRASS]: assets.tile_grass, [TILE.DIRT]: assets.tile_dirt, [TILE.STONE]: assets.tile_stone, [TILE.WOOD]: assets.tile_wood, [TILE.LEAVES]: assets.tile_leaves, [TILE.COAL]: assets.tile_coal, [TILE.IRON]: assets.tile_iron };

        for (let cy = startChunkY; cy <= endChunkY; cy++) {
            for (let cx = startChunkX; cx <= endChunkX; cx++) {
                for (let y = 0; y < chunkSize; y++) {
                    for (let x = 0; x < chunkSize; x++) {
                        const tileX = cx * chunkSize + x;
                        const tileY = cy * chunkSize + y;
                        if (game.tileMap[tileY]?.[tileX] > 0) {
                            const asset = TILE_ASSETS[game.tileMap[tileY][tileX]];
                            if (asset) ui.ctx.drawImage(asset, tileX * tileSize, tileY * tileSize, tileSize, tileSize);
                        }
                    }
                }
            }
        }
    }
    
    function propagateTreeCollapse(startX, startY) {
        const checkQueue = [[startX, startY]];
        const visited = new Set([`${startX},${startY}`]);

        while(checkQueue.length > 0) {
            const [x, y] = checkQueue.shift();
            const tile = game.tileMap[y]?.[x];
            
            if (!tile || (tile !== TILE.WOOD && tile !== TILE.LEAVES)) continue;

            const tileBelow = game.tileMap[y + 1]?.[x];
            const isSupported = tileBelow > 0 && tileBelow !== TILE.LEAVES;

            if (!isSupported) {
                game.fallingBlocks.push({
                    x: x * config.tileSize,
                    y: y * config.tileSize,
                    vy: 0,
                    tileType: tile
                });
                game.tileMap[y][x] = TILE.AIR;

                const neighbors = [[x, y - 1], [x - 1, y], [x + 1, y]];
                for (const [nx, ny] of neighbors) {
                    if (!visited.has(`${nx},${ny}`)) {
                        checkQueue.push([nx, ny]);
                        visited.add(`${nx},${ny}`);
                    }
                }
            }
        }
    }

    function updateFallingBlocks() {
        const { tileSize } = config;
        game.fallingBlocks.forEach((block, index) => {
            block.vy += config.physics.gravity;
            block.y += block.vy;

            const tileX = Math.floor((block.x + tileSize / 2) / tileSize);
            const tileY = Math.floor((block.y + tileSize) / tileSize);

            if (game.tileMap[tileY]?.[tileX] > 0) {
                game.fallingBlocks.splice(index, 1);
            }
        });
    }

    function drawFallingBlocks() {
        const TILE_ASSETS = { [TILE.WOOD]: assets.tile_wood, [TILE.LEAVES]: assets.tile_leaves };
        game.fallingBlocks.forEach(block => {
            const asset = TILE_ASSETS[block.tileType];
            if (asset) {
                ui.ctx.drawImage(asset, block.x, block.y, config.tileSize, config.tileSize);
            }
        });
    }

    function updateCollectibles() {
        game.collectibles.forEach((item, index) => {
            item.vy += config.physics.gravity;
            item.y += item.vy;

            const { tileSize } = config;
            const tileY = Math.floor((item.y + tileSize) / tileSize);
            const tileX = Math.floor((item.x + tileSize / 2) / tileSize);

            if (game.tileMap[tileY]?.[tileX] > 0) {
                item.y = tileY * tileSize - tileSize;
                item.vy = 0;
            }
        });
    }

    function drawCollectibles() {
        const TILE_ASSETS = { [TILE.DIRT]: assets.tile_dirt, [TILE.STONE]: assets.tile_stone, [TILE.WOOD]: assets.tile_wood, [TILE.LEAVES]: assets.tile_leaves, [TILE.COAL]: assets.tile_coal, [TILE.IRON]: assets.tile_iron };
        game.collectibles.forEach(item => {
            const asset = TILE_ASSETS[item.tileType];
            if (asset) {
                ui.ctx.drawImage(asset, item.x, item.y, config.tileSize, config.tileSize);
            }
        });
    }

    function drawParticles() {
        if (!game) return;
        ui.ctx.globalAlpha = 1.0;
        game.particles.forEach(p => {
            ui.ctx.fillStyle = p.color;
            ui.ctx.globalAlpha = p.life / p.maxLife;
            ui.ctx.beginPath();
            ui.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ui.ctx.fill();
        });
        ui.ctx.globalAlpha = 1.0;
    }
    
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
        if (!game || !ui.toolbar) return;
        const slots = ui.toolbar.children;
        for (let i = 0; i < slots.length; i++) {
            slots[i].classList.toggle('selected', i === game.player.selectedToolIndex);
        }
    }

    function toggleMenu(show) {
        if (!game) return;
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

    function createParticles(x, y, count, color, options = {}) {
        if (!game) return;
        for (let i = 0; i < count; i++) {
            game.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * (options.speed || 4),
                vy: (Math.random() - 0.5) * (options.speed || 4) - 2,
                life: 30 + Math.random() * 30,
                maxLife: 60,
                size: 1 + Math.random() * 2,
                gravity: options.gravity || 0.1,
                color: color
            });
        }
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
        if (ui.gameTitle) ui.gameTitle.style.display = 'block';
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
