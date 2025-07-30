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
            // Initialise les paramètres de jeu avec les valeurs par défaut du config
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

        // Logique pour les curseurs du menu d'options
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

    function selectSkin(i) { /* ... (code inchangé) ... */ }
    function findSpawnPoint(game, config) { /* ... (code inchangé) ... */ }

    function initGame() {
        if (ui.gameTitle) ui.gameTitle.style.display = 'none';
        game = {
            player: null, camera: { x: 0, y: 0 },
            tileMap: [], enemies: [], particles: [], fallingBlocks: [], collectibles: [],
            lives: config.player.maxLives, over: false, paused: false,
            config: config, createParticles: createParticles, loseLife: loseLife,
            propagateTreeCollapse: propagateTreeCollapse, miningEffect: null
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

    function draw() {
        if (!game) return;
        drawSky();
        ui.ctx.save();
        ui.ctx.scale(gameSettings.zoom, gameSettings.zoom);
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
                            if (asset) ui.ctx.drawImage(asset, tileX * tileSize, tileY * tileSize, tileSize, tileSize);
                        }
                    }
                }
            }
        }
    }
    
    // ... (toutes les autres fonctions comme propagateTreeCollapse, setupInput, etc. restent ici)
});
```

---
### `config.json` (Corrigé)
J'ai vérifié que les noms des outils correspondent bien à ce que le jeu attend. Assurez-vous que vos fichiers d'images dans le dossier `assets` ont exactement ces noms (par exemple, `tool_axe.png`).


```json
{
  "gameTitle": "Super Pixel Adventure 2",
  "githubRepoUrl": "",
  "canvasWidth": 960,
  "canvasHeight": 540,
  "worldWidth": 4000,
  "worldHeight": 2000,
  "tileSize": 16,
  "zoom": 2,
  "chunkSize": 16,
  "renderDistance": 8,
  "generation": {
    "enemyCount": 50,
    "treeCount": 40
  },
  "physics": {
    "gravity": 0.35,
    "jumpForce": 7,
    "playerSpeed": 2.5,
    "friction": 0.88
  },
  "player": {
    "maxLives": 5,
    "width": 16,
    "height": 28,
    "reach": 4
  },
  "skins": [
    "player1.png",
    "player2.png",
    "player3.png"
  ],
  "assets": {
    "tile_grass": "assets/tile_grass.png",
    "tile_dirt": "assets/tile_dirt.png",
    "tile_stone": "assets/tile_stone.png",
    "tile_wood": "assets/tile_wood.png",
    "tile_leaves": "assets/tile_leaves.png",
    "tile_coal": "assets/tile_coal.png",
    "tile_iron": "assets/tile_iron.png",
    "enemy_slime": "assets/enemy_slime.png",
    "enemy_frog": "assets/enemy_frog.png",
    "enemy_golem": "assets/enemy_golem.png",
    "tool_pickaxe": "assets/tool_pickaxe.png",
    "tool_shovel": "assets/tool_shovel.png",
    "tool_axe": "assets/tool_axe.png",
    "tool_sword": "assets/tool_sword.png",
    "tool_bow": "assets/tool_bow.png",
    "tool_fishing_rod": "assets/tool_fishing_rod.png",
    "tool_knife": "assets/tool_knife.png"
  }
}
