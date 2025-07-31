import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { Slime, Frog, Golem } from './enemy.js';
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

    // Logique spécifique à notre jeu
    const gameLogic = {
        init: (assets) => {
            setupMenus(assets);
        },
        update: (keys, mouse) => {
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
                console.error("Erreur dans la boucle de jeu:", error);
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
        },
        isPaused: () => game.paused,
        toggleMenu: () => toggleMenu(!game.paused),
        selectTool: (index) => {
            if (game.player && index >= 0 && index < game.player.tools.length) {
                game.player.selectedToolIndex = index;
            }
        },
        showError: (error) => {
            if(ui.mainMenu) ui.mainMenu.innerHTML = `<h2>Erreur de chargement.</h2><p style="font-size:0.5em;">${error}</p>`;
        }
    };
    
    // On crée et démarre le moteur de jeu
    const engine = new GameEngine(canvas, config);
    engine.start(gameLogic);

    // --- Fonctions spécifiques à la logique du jeu ---

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
            case 'closeMenu': toggleMenu(false); break;
        }
    }

    function initGame(assets) {
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
    }

    function drawTileMap(ctx, assets) {
        const { tileSize, chunkSize } = config;
        const playerChunkX = Math.floor(game.player.x / (chunkSize * tileSize));
        const playerChunkY = Math.floor(game.player.y / (chunkSize * tileSize));
        
        const startChunkX = Math.max(0, playerChunkX - gameSettings.renderDistance);
        const endChunkX = playerChunkX + gameSettings.renderDistance;
        const startChunkY = Math.max(0, playerChunkY - gameSettings.renderDistance);
        const endChunkY = playerChunkY + gameSettings.renderDistance;

        const TILE_ASSETS = { [TILE.GRASS]: assets.tile_grass, [TILE.DIRT]: assets.tile_dirt, [TILE.STONE]: assets.tile_stone, [TILE.WOOD]: assets.tile_wood, [TILE.LEAVES]: assets.tile_leaves, [TILE.COAL]: assets.tile_coal, [TILE.IRON]: assets.tile_iron };

        for (let cy = startChunkY; cy <= endChunkY; cy++) {
            for (let cx = startChunkX; cx <= endChunkX; cx++) {
                for (let y = 0; y < chunkSize; y++) {
                    for (let x = 0; x < chunkSize; x++) {
                        const tileX = cx * chunkSize + x;
                        const tileY = cy * chunkSize + y;
                        if (game.tileMap[tileY]?.[tileX] > 0) {
                            const asset = TILE_ASSETS[game.tileMap[tileY][tileX]];
                            if (asset) ctx.drawImage(asset, tileX * tileSize, tileY * tileSize, tileSize, tileSize);
                        }
                    }
                }
            }
        }
    }

    function updateCamera(isInstant = false) {
        const targetX = game.player.x - (ui.canvas.width / gameSettings.zoom) / 2;
        const targetY = game.player.y - (ui.canvas.height / gameSettings.zoom) / 2;
        
        if (isInstant) {
            game.camera.x = targetX;
            game.camera.y = targetY;
        } else {
            game.camera.x += (targetX - game.camera.x) * 0.1;
            game.camera.y += (targetY - game.camera.y) * 0.1;
        }
        
        game.camera.x = Math.max(0, Math.min(game.camera.x, config.worldWidth - (ui.canvas.width / gameSettings.zoom)));
        game.camera.y = Math.max(0, Math.min(game.camera.y, config.worldHeight - (ui.canvas.height / gameSettings.zoom)));
    }

    function createToolbar(assets) {
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

    function drawSky(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, ui.canvas.height);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#5C94FC');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    }

    function findSpawnPoint() {
        const { tileSize, worldWidth } = config;
        const worldWidthInTiles = Math.floor(worldWidth / tileSize);
        const spawnX = Math.floor(worldWidthInTiles / 2);

        for (let y = 0; y < game.tileMap.length; y++) {
            if (game.tileMap[y] && game.tileMap[y][spawnX] > 0) {
                return { x: spawnX * tileSize, y: (y - 2) * tileSize };
            }
        }
        return { x: worldWidth / 2, y: 100 };
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
        if(ui.message) ui.message.innerHTML = win ? `🎉 Victoire! 🎉` : `💀 Game Over �`;
        ui.hud?.classList.remove('active');
        ui.gameover?.classList.add('active');
    }

    function updateParticles() {
        if (!game) return;
        game.particles.forEach((p, index) => {
            p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
            if (p.life <= 0) game.particles.splice(index, 1);
        });
    }

    function drawParticles(ctx) {
        if (!game) return;
        ctx.globalAlpha = 1.0;
        game.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
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

    function updateFallingBlocks() {
        if (!game) return;
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

    function drawFallingBlocks(ctx, assets) {
        const TILE_ASSETS = { [TILE.WOOD]: assets.tile_wood, [TILE.LEAVES]: assets.tile_leaves };
        game.fallingBlocks.forEach(block => {
            const asset = TILE_ASSETS[block.tileType];
            if (asset) {
                ctx.drawImage(asset, block.x, block.y, config.tileSize, config.tileSize);
            }
        });
    }

    function updateCollectibles() {
        if (!game) return;
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

    function drawCollectibles(ctx, assets) {
        const TILE_ASSETS = { [TILE.DIRT]: assets.tile_dirt, [TILE.STONE]: assets.tile_stone, [TILE.WOOD]: assets.tile_wood, [TILE.LEAVES]: assets.tile_leaves, [TILE.COAL]: assets.tile_coal, [TILE.IRON]: assets.tile_iron };
        game.collectibles.forEach(item => {
            const asset = TILE_ASSETS[item.tileType];
            if (asset) {
                ctx.drawImage(asset, item.x, item.y, config.tileSize, config.tileSize);
            }
        });
    }

    function drawMiningEffect(ctx) {
        if (game && game.miningEffect) {
            const { x, y, progress } = game.miningEffect;
            const { tileSize } = config;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'white';
            const crackWidth = tileSize * Math.min(1, progress * 2);
            const crackHeight = 2;
            ctx.fillRect(x * tileSize + (tileSize - crackWidth) / 2, y * tileSize + tileSize / 2 - crackHeight / 2, crackWidth, crackHeight);
            if (progress > 0.5) {
                const crackWidth2 = tileSize * Math.min(1, (progress - 0.5) * 2);
                const crackHeight2 = 2;
                ctx.fillRect(x * tileSize + tileSize / 2 - crackHeight2 / 2, y * tileSize + (tileSize - crackWidth2) / 2, crackHeight2, crackWidth2);
            }
            ctx.globalAlpha = 1.0;
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
});
�
