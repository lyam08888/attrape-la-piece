import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { generateLevel, TILE } from './world.js';
import { Logger } from './logger.js';
import { WorldAnimator } from './worldAnimator.js';
import { SoundManager } from './sound.js';
import { randomItem } from './survivalItems.js';
import { getItemIcon } from './itemIcons.js';
import { getChestImage } from './chestGenerator.js';

document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const config = await (await fetch('config.json')).json();
    const logger = new Logger();
    const sound = new SoundManager(config.soundVolume);

    const ui = {
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        gameTitle: document.getElementById('gameTitle'),
        mainMenu: document.getElementById('mainMenu'),
        optionsMenu: document.getElementById('optionsMenu'),
        controlsMenu: document.getElementById('controlsMenu'),
        creatorMenu: document.getElementById('creatorMenu'),
        skinlist: document.getElementById('skinlist'),
        hud: document.getElementById('hud'),
        lives: document.getElementById('lives'),
        gameover: document.getElementById('gameover'),
        message: document.getElementById('message'),
        btnRestart: document.getElementById('btnRestart'),
        toolbar: document.getElementById('toolbar'),
        inventoryMenu: document.getElementById('inventoryMenu'),
        chestMenu: document.getElementById('chestMenu'),
        inventoryGrid: document.getElementById('inventoryGrid'),
        chestGrid: document.getElementById('chestGrid'),
        renderDistanceSlider: document.getElementById('renderDistanceSlider'),
        renderDistanceValue: document.getElementById('renderDistanceValue'),
        zoomSlider: document.getElementById('zoomSlider'),
        zoomValue: document.getElementById('zoomValue'),
        particlesCheckbox: document.getElementById('particlesCheckbox'),
        weatherCheckbox: document.getElementById('weatherCheckbox'),
        lightingCheckbox: document.getElementById('lightingCheckbox'),
        soundSlider: document.getElementById('soundSlider'),
        volumeValue: document.getElementById('volumeValue'),
        xpFill: document.getElementById('xpFill'),
        levelPopup: document.getElementById('levelPopup'),
        levelDisplay: document.getElementById('levelDisplay'),
        skillsMenu: document.getElementById('skillsMenu'),
        skillPointsInfo: document.getElementById('skillPointsInfo'),
        skillRows: document.querySelectorAll('.skill-row'),
    };

    let game = {};
    let currentSkin = 0;
    let gameSettings = {
        renderDistance: config.renderDistance,
        zoom: config.zoom,
        showParticles: config.showParticles,
        weatherEffects: config.weatherEffects,
        dynamicLighting: config.dynamicLighting,
        soundVolume: config.soundVolume
    };
    let assets = {}; // Pour stocker les images chargées
    let worldAnimator;

    // --- Définition de TOUTES les fonctions de logique du jeu ---
    // CORRECTION: Toutes les fonctions sont maintenant définies ici avant d'être utilisées.

    function setupMenus(_assets) {
        assets = _assets;
        if (!ui.mainMenu) { initGame(); return; }
        ui.skinlist.innerHTML = '';
        config.skins.forEach((_, i) => {
            const asset = assets[`player${i+1}`];
            if (!asset) {
                logger.error(`Skin player${i+1} manquant`);
                return;
            }
            const img = asset.cloneNode();
            img.onclick = () => selectSkin(i);
            if (i === currentSkin) img.classList.add("selected");
            ui.skinlist.appendChild(img);
        });
        
        document.body.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) { handleMenuAction(action); return; }
            const inc = e.target.dataset.inc;
            if (inc) { increaseSkill(inc); }
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
                updateCamera(true);
            };
        }

        if (ui.particlesCheckbox) {
            ui.particlesCheckbox.checked = gameSettings.showParticles;
            ui.particlesCheckbox.onchange = (e) => {
                gameSettings.showParticles = e.target.checked;
            };
        }
        if (ui.weatherCheckbox) {
            ui.weatherCheckbox.checked = gameSettings.weatherEffects;
            ui.weatherCheckbox.onchange = (e) => {
                gameSettings.weatherEffects = e.target.checked;
            };
        }
        if (ui.lightingCheckbox) {
            ui.lightingCheckbox.checked = gameSettings.dynamicLighting;
            ui.lightingCheckbox.onchange = (e) => {
                gameSettings.dynamicLighting = e.target.checked;
            };
        }
        if (ui.soundSlider) {
            ui.soundSlider.value = gameSettings.soundVolume;
            ui.volumeValue.textContent = `${Math.round(gameSettings.soundVolume*100)}%`;
            ui.soundSlider.oninput = (e) => {
                gameSettings.soundVolume = parseFloat(e.target.value);
                ui.volumeValue.textContent = `${Math.round(gameSettings.soundVolume*100)}%`;
                sound.setVolume(gameSettings.soundVolume);
            };
        }

        if(ui.btnRestart) ui.btnRestart.onclick = initGame;
    }

    function handleMenuAction(action) {
        switch(action) {
            case 'start': initGame(); break;
            case 'creator': showMenu(ui.creatorMenu); break;
            case 'options': showMenu(ui.optionsMenu); break;
            case 'backToMain': showMenu(ui.mainMenu); break;
            case 'closeMenu': toggleMenu(false, 'controls'); break;
            case 'closeOptions': toggleMenu(false, 'options'); break;
            case 'closeInventory': toggleInventoryMenu(); break;
            case 'closeChest': ui.chestMenu.classList.remove('active'); game.paused = false; break;
            case 'closeSkills': toggleSkillsMenu(); break;
        }
    }

    function initGame() {
    try {
        if (ui.gameTitle) ui.gameTitle.style.display = 'none';
        game = {
            player: null,
            camera: { x: 0, y: 0 },
            tileMap: [],
            enemies: [],
            particles: [],
            fallingBlocks: [],
            collectibles: [],
            decorations: [],
            coins: [],
            bonuses: [],
            checkpoints: [],
            chests: [],
            lives: config.player.maxLives,
            over: false,
            paused: false,
            config: config,
            settings: gameSettings,
            sound: sound,
            propagateTreeCollapse: propagateTreeCollapse,
            miningEffect: null,
            createParticles: (x, y, count, color, options) => createParticles(x, y, count, color, options),
            loseLife: () => loseLife(),
            addXP: (amount) => addXP(amount),
            showLevelPopup: (lvl) => showLevelPopup(lvl),
        };
        
        generateLevel(game, config, {});
        const spawnPoint = findSpawnPoint();
        game.player = new Player(spawnPoint.x, spawnPoint.y, config, sound);
        game.player.survivalItems = randomItem(5);
        game.chests.forEach(ch => { ch.items = randomItem(3); });
        worldAnimator = new WorldAnimator(config, assets);
        updateCamera(true);
        sound.startAmbient();

        if(ui.mainMenu) {
            [ui.mainMenu, ui.optionsMenu].forEach(m => m?.classList.remove('active'));
            ui.hud?.classList.add('active');
        }
        
        createToolbar();
    } catch (error) {
        logger.error(`Erreur init: ${error.message}`);
    }
}



    function update(keys, mouse) {
        logger.update();
        if (!game.player || game.over || game.paused) return;
        try {
            sound.update();
            game.player.update(keys, mouse, game);
            game.enemies.forEach(e => e.update(game));
            game.enemies = game.enemies.filter(e => !e.isDead);
            updateParticles();
            updateFallingBlocks();
            updateCollectibles();
            updateCamera(false);
            if (worldAnimator) worldAnimator.update(game.camera, ui.canvas, gameSettings.zoom);
            if (keys.action) keys.action = false;
            mouse.left = false; mouse.right = false;
        } catch (error) {
            logger.error(`Erreur update: ${error.message}`);
            game.over = true;
        }
    }

    function draw(ctx, _assets) {
        assets = _assets;
        drawSky(ctx);
        
        if (game.player) {
            ctx.save();
            ctx.scale(gameSettings.zoom, gameSettings.zoom);
            ctx.translate(-Math.round(game.camera.x), -Math.round(game.camera.y));

            if (worldAnimator) worldAnimator.draw(ctx);
            drawTileMap(ctx, assets);
            drawDecorations(ctx, assets);
            drawFallingBlocks(ctx, assets);
            drawCollectibles(ctx, assets);
            drawChests(ctx, assets);
            
            game.enemies.forEach(e => e.draw(ctx, assets));
            game.player.draw(ctx, assets, `player${currentSkin + 1}`);
            if (gameSettings.showParticles) drawParticles(ctx);
            drawMiningEffect(ctx);
            ctx.restore();

            updateHUD();
            updateToolbarUI();
        }
        
        logger.draw(ctx, canvas);
    }

    function toggleMenu(show, menuType) {
        if (!game) return;
        game.paused = show;
        let menuToToggle = menuType === 'options' ? ui.optionsMenu : ui.controlsMenu;
        if (show) {
            showMenu(menuToToggle);
        } else {
            showMenu(null);
        }
    }

    function showMenu(menuToShow) {
        [ui.mainMenu, ui.optionsMenu, ui.controlsMenu, ui.creatorMenu].forEach(m => m?.classList.remove('active'));
        menuToShow?.classList.add('active');
    }

    function selectSkin(i) {
        currentSkin = i;
        [...ui.skinlist.children].forEach((img, index) => img.classList.toggle("selected", index === i));
    }

    function findSpawnPoint() {
        const { tileSize, worldWidth } = config;
        const worldWidthInTiles = Math.floor(worldWidth / tileSize);
        const spawnX = Math.floor(worldWidthInTiles / 2);

        for (let y = 0; y < game.tileMap.length; y++) {
            if (game.tileMap[y] && game.tileMap[y][spawnX] > 0) {
                return { x: spawnX * tileSize, y: Math.max(0, (y - 4) * tileSize) };
            }
        }
        return { x: worldWidth / 2, y: 100 };
    }
    
    function updateCamera(isInstant = false) {
        if (!game.player) return;
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

    function drawSky(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, ui.canvas.height);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#5C94FC');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(ui.canvas.width - 80, 80, 40, 0, Math.PI * 2);
        ctx.fill();
    }

    function updateHUD() {
        if(!game || !ui.hud) return;
        ui.lives.textContent = '❤'.repeat(game.lives);
        if (ui.xpFill && game.player) {
            const pct = (game.player.xp / game.player.xpToNext) * 100;
            ui.xpFill.style.width = pct + '%';
        }
        if (ui.levelDisplay && game.player) {
            ui.levelDisplay.textContent = `Lvl ${game.player.level}`;
        }
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
        sound.stopAmbient();
    }

    function updateParticles() {
        if (!game) return;
        game.particles.forEach((p, index) => {
            p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
            if (p.life <= 0) game.particles.splice(index, 1);
        });
    }

    function showLevelPopup(level) {
        if (!ui.levelPopup) return;
        ui.levelPopup.textContent = `Niveau ${level}!`;
        ui.levelPopup.classList.add('show');
        setTimeout(() => ui.levelPopup.classList.remove('show'), 1500);
    }

    function addXP(amount) {
        if (!game.player) return;
        game.player.addXP(amount, game);
        updateHUD();
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

    function drawChests(ctx, assets) {
        game.chests.forEach(ch => {
            const img = getChestImage(ch.type);
            ctx.drawImage(img, ch.x, ch.y, ch.w, ch.h);
        });
    }

    function drawDecorations(ctx, assets) {
        game.decorations.forEach(dec => {
            if (dec.type === 'bush') {
                ctx.drawImage(assets.decoration_bush, dec.x, dec.y, dec.w, dec.h);
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

    function openChestMenu(chest) {
        if (!chest || !ui.chestMenu) return;
        ui.chestGrid.innerHTML = '';
        chest.items.forEach((item, idx) => {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = idx;
            const img = getItemIcon(item);
            slot.appendChild(img.cloneNode());
            const tip = document.createElement('div');
            tip.className = 'tooltip';
            tip.textContent = item;
            slot.appendChild(tip);
            slot.onclick = () => {
                if (game.player.survivalItems.length < 16) {
                    game.player.survivalItems.push(item);
                    chest.items.splice(idx,1);
                    openChestMenu(chest);
                }
            };
            ui.chestGrid.appendChild(slot);
        });
        ui.chestMenu.classList.add('active');
        game.paused = true;
        game.addXP(15);
    }

    function increaseSkill(skill) {
        if (!game.player || game.player.skillPoints <= 0) return;
        if (game.player.attributes[skill] !== undefined) {
            game.player.attributes[skill]++;
            game.player.skillPoints--;
            updateSkillsUI();
        }
    }

    function toggleSkillsMenu() {
        if (!ui.skillsMenu) return;
        if (ui.skillsMenu.classList.contains('active')) {
            ui.skillsMenu.classList.remove('active');
            game.paused = false;
        } else {
            updateSkillsUI();
            ui.skillsMenu.classList.add('active');
            game.paused = true;
        }
    }

    function updateSkillsUI() {
        if (!game.player) return;
        if (ui.skillPointsInfo) ui.skillPointsInfo.textContent = `Points: ${game.player.skillPoints}`;
        ui.skillRows.forEach(row => {
            const skill = row.dataset.skill;
            row.querySelector('.value').textContent = game.player.attributes[skill];
        });
    }

    function toggleInventoryMenu() {
        if (!ui.inventoryMenu) return;
        if (ui.inventoryMenu.classList.contains('active')) {
            ui.inventoryMenu.classList.remove('active');
            game.paused = false;
        } else {
            ui.inventoryGrid.innerHTML = '';
            for (let i = 0; i < 16; i++) {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                const item = game.player.survivalItems[i];
                if (item) {
                    slot.appendChild(getItemIcon(item).cloneNode());
                    const tip = document.createElement('div');
                    tip.className = 'tooltip';
                    tip.textContent = item;
                    slot.appendChild(tip);
                }
                ui.inventoryGrid.appendChild(slot);
            }
            ui.inventoryMenu.classList.add('active');
            game.paused = true;
        }
    }

    // --- Lancement du moteur ---

    const gameLogic = {
        init: setupMenus,
        update: update,
        draw: draw,
        isPaused: () => game.paused,
        toggleMenu: (menu) => {
            if (menu === 'options') toggleMenu(!game.paused, 'options');
            else if (menu === 'controls') toggleMenu(!game.paused, 'controls');
        },
        selectTool: (index) => {
            if (game.player && index >= 0 && index < game.player.tools.length) {
                game.player.selectedToolIndex = index;
            }
        },
        cycleTool: (dir) => {
            if (game.player) {
                const len = game.player.tools.length;
                game.player.selectedToolIndex = (game.player.selectedToolIndex + dir + len) % len;
            }
        },
        toggleInventory: () => toggleInventoryMenu(),
        toggleSkills: () => toggleSkillsMenu(),
        openChest: (ch) => openChestMenu(ch),
        showError: (error) => {
            logger.error(error.message);
            if(ui.mainMenu) ui.mainMenu.innerHTML = `<h2>Erreur de chargement.</h2><p style="font-size:0.5em;">${error}</p>`;
        }
    };
    
    const engine = new GameEngine(canvas, config);
    engine.start(gameLogic);
});
