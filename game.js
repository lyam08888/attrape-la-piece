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
        score: document.getElementById('score'),
        lives: document.getElementById('lives'),
        timer: document.getElementById('timer'),
        gameover: document.getElementById('gameover'),
        message: document.getElementById('message'),
        btnRestart: document.getElementById('btnRestart'),
        godModeBtn: document.getElementById('godModeBtn'),
        soundBtn: document.getElementById('soundBtn'),
        controls: document.getElementById('controls'),
        btnLeft: document.getElementById('btnLeft'),
        btnJump: document.getElementById('btnJump'),
        btnRight: document.getElementById('btnRight'),
    };

    let config, assets = {}, game, keys = {}, mouse = {x:0, y:0, left:false, right:false}, currentSkin = 0, gameSettings = {};

    async function main() {
        try {
            config = await (await fetch('config.json')).json();
            ui.canvas.width = config.canvasWidth;
            ui.canvas.height = config.canvasHeight;
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
        ui.menuTitle.textContent = "Choisissez un héros";
        ui.skinlist.innerHTML = '';
        config.skins.forEach((_, i) => {
            const img = assets[`player${i+1}`].cloneNode();
            img.onclick = () => selectSkin(i);
            if (i === currentSkin) img.classList.add("selected");
            ui.skinlist.appendChild(img);
        });
        
        document.querySelectorAll('#mainMenu button').forEach(b => b.style.display = 'block');
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
        game = {
            player: null,
            camera: { x: 0, y: 0 },
            tileMap: [], enemies: [], particles: [], fallingBlocks: [], // NOUVEAU: Pour les blocs qui tombent
            score: 0, lives: config.player.maxLives, time: config.player.gameTime, over: false,
            config: config,
            createParticles: createParticles,
            loseLife: loseLife,
            timeLast: Date.now(),
            // NOUVEAU: On expose la fonction de physique des arbres au jeu
            propagateTreeCollapse: propagateTreeCollapse
        };
        gameSettings = { godMode: false }; 
        
        generateLevel(game, config, {});

        const spawnPoint = findSpawnPoint(game, config);
        game.player = new Player(spawnPoint.x, spawnPoint.y, config);

        updateCamera(true); 

        if(ui.mainMenu) {
            [ui.mainMenu, ui.optionsMenu, ui.controlsMenu, ui.gameover].forEach(m => m?.classList.remove('active'));
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
            updateFallingBlocks(); // NOUVEAU: Mise à jour des blocs qui tombent
            updateCamera(false);
            updateTimer();
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

    function updateTimer() {
        if (Date.now() - game.timeLast > 1000) {
            game.time--;
            game.timeLast = Date.now();
            if (game.time <= 0) {
                game.time = 0;
                endGame(false);
            }
        }
    }

    function draw() {
        if (!game) return;
        drawSky();
        ui.ctx.save();
        ui.ctx.translate(-Math.round(game.camera.x), -Math.round(game.camera.y));

        drawTileMap();
        drawFallingBlocks(); // NOUVEAU: Dessine les blocs qui tombent
        
        game.enemies.forEach(e => e.draw(ui.ctx, assets));
        game.player.draw(ui.ctx, assets, `player${currentSkin + 1}`, gameSettings.godMode);
        drawParticles();
        ui.ctx.restore();

        drawInventoryUI();
        updateHUD();
    }

    // NOUVEAU: Logique pour la chute des blocs d'arbres
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

                // Ajoute les voisins à la file d'attente pour vérifier s'ils tombent aussi
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
                if (game.player.inventory[block.tileType] !== undefined) {
                    game.player.inventory[block.tileType]++;
                }
                createParticles(block.x + tileSize / 2, block.y + tileSize / 2, 5, '#fff');
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

    function drawTileMap() {
        const { tileSize } = config;
        const startCol = Math.floor(game.camera.x / tileSize);
        const endCol = startCol + Math.ceil(ui.canvas.width / tileSize) + 1;
        const startRow = Math.floor(game.camera.y / tileSize);
        const endRow = startRow + Math.ceil(ui.canvas.height / tileSize) + 1;

        const TILE_ASSETS = { [TILE.GRASS]: assets.tile_grass, [TILE.DIRT]: assets.tile_dirt, [TILE.STONE]: assets.tile_stone, [TILE.WOOD]: assets.tile_wood, [TILE.LEAVES]: assets.tile_leaves, [TILE.COAL]: assets.tile_coal, [TILE.IRON]: assets.tile_iron };

        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (game.tileMap[y]?.[x] > 0) {
                    const asset = TILE_ASSETS[game.tileMap[y][x]];
                    if (asset) ui.ctx.drawImage(asset, x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }
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

    function drawInventoryUI() {
        if (!game || !game.player) return;
        const ctx = ui.ctx;
        const startX = 20;
        const startY = 20;
        const slotSize = 40;
        const padding = 5;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        const equippedItemTile = game.player.equippedItem;
        const asset = { [TILE.DIRT]: assets.tile_dirt, [TILE.STONE]: assets.tile_stone, [TILE.WOOD]: assets.tile_wood }[equippedItemTile];
        
        ctx.strokeRect(startX, startY, slotSize, slotSize);
        if (asset) {
            ctx.drawImage(asset, startX + padding, startY + padding, slotSize - padding * 2, slotSize - padding * 2);
        }
        ctx.fillStyle = '#fff';
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'right';
        ctx.fillText(game.player.inventory[equippedItemTile], startX + slotSize - 5, startY + slotSize - 5);
    }
    
    function setupInput() {
        keys = { left: false, right: false, jump: false };
        document.addEventListener('keydown', e => {
            if (e.code === 'ArrowLeft') keys.left = true;
            if (e.code === 'ArrowRight') keys.right = true;
            if (e.code === 'Space' || e.code === 'ArrowUp') keys.jump = true;
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
            if (e.button === 0) mouse.left = true;
            if (e.button === 2) mouse.right = true;
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
        ui.score.textContent = `SCORE: ${String(game.score).padStart(6, '0')}`; 
        ui.timer.textContent = `TEMPS: ${game.time}`; 
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
        if(ui.message) ui.message.innerHTML = win ? `🎉 Victoire! 🎉<br>SCORE: ${game.score}` : `💀 Game Over 💀`;
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
