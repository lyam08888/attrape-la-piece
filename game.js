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
    };

    let config, assets = {}, game, keys = {}, mouse = {x:0, y:0, left:false, right:false}, currentSkin = 0;
    let gameSettings = {};

    async function main() {
        try {
            config = await (await fetch('config.json')).json();
            gameSettings.renderDistance = config.renderDistance;
            ui.canvas.width = window.innerWidth;
            ui.canvas.height = window.innerHeight;
            if(ui.gameTitle) ui.gameTitle.textContent = config.gameTitle;

            await loadAssets();
            setupMenus();
            setupInput();
        } catch (error) {
            console.error("Erreur de chargement:", error);
        }
    }

    async function loadAssets() { /* ... (code inchangé) ... */ }
    
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
        const targetX = game.player.x - (ui.canvas.width / config.zoom) / 2;
        const targetY = game.player.y - (ui.canvas.height / config.zoom) / 2;
        
        if (isInstant) {
            game.camera.x = targetX;
            game.camera.y = targetY;
        } else {
            game.camera.x += (targetX - game.camera.x) * 0.1;
            game.camera.y += (targetY - game.camera.y) * 0.1;
        }
        
        game.camera.x = Math.max(0, Math.min(game.camera.x, config.worldWidth - (ui.canvas.width / config.zoom)));
        game.camera.y = Math.max(0, Math.min(game.camera.y, config.worldHeight - (ui.canvas.height / config.zoom)));
    }

    function draw() {
        if (!game) return;
        drawSky();
        ui.ctx.save();
        ui.ctx.scale(config.zoom, config.zoom);
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

    // ... (toutes les autres fonctions comme propagateTreeCollapse, setupInput, etc. restent ici)
});
```

---
### `player.js` (Mis à jour)
Ce fichier gère maintenant la récolte des objets au sol et l'utilisation de l'outil approprié pour casser les blocs.


```javascript
import { TILE } from './world.js';

const TILE_HARDNESS = {
    [TILE.GRASS]: 1, [TILE.DIRT]: 1,
    [TILE.LEAVES]: 0.5, [TILE.WOOD]: 2,
    [TILE.STONE]: 3, [TILE.COAL]: 3.5, [TILE.IRON]: 4
};

const TOOL_EFFECTIVENESS = {
    'shovel': [TILE.GRASS, TILE.DIRT],
    'axe': [TILE.WOOD, TILE.LEAVES],
    'pickaxe': [TILE.STONE, TILE.COAL, TILE.IRON]
};

export class Player {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = config.player.width;
        this.h = config.player.height;
        this.config = config;
        this.grounded = false;
        this.canDoubleJump = true;
        this.dir = 1;
        this.invulnerable = 0;
        this.swingTimer = 0;
        this.tools = ['pickaxe', 'shovel', 'axe', 'sword', 'bow', 'fishing_rod'];
        this.selectedToolIndex = 0;
        this.inventory = {};
        this.miningTarget = null;
        this.miningProgress = 0;
    }

    update(keys, mouse, game) {
        const { physics } = this.config;
        
        if (keys.left) { this.vx = -physics.playerSpeed; this.dir = -1; }
        else if (keys.right) { this.vx = physics.playerSpeed; this.dir = 1; }
        else { this.vx *= physics.friction; }

        if (keys.jump) {
            if (this.grounded) { this.vy = -physics.jumpForce; this.canDoubleJump = true; }
            else if (this.canDoubleJump) { this.vy = -physics.jumpForce * 0.8; this.canDoubleJump = false; }
            keys.jump = false;
        }

        this.vy += physics.gravity;
        
        this.handleActions(keys, mouse, game);
        this.handleTileCollisions(game);
        this.checkEnemyCollisions(game);
        this.checkCollectibleCollisions(game);

        if (this.invulnerable > 0) this.invulnerable--;
        if (this.swingTimer > 0) this.swingTimer--;
    }

    handleActions(keys, mouse, game) {
        const isActionPressed = keys.action || mouse.left;
        const selectedTool = this.tools[this.selectedToolIndex];

        if (isActionPressed) {
            this.swingTimer = 15;
            
            const target = this.getTargetTile(mouse, game);
            if (target) {
                if (!this.miningTarget || this.miningTarget.x !== target.x || this.miningTarget.y !== target.y) {
                    this.miningTarget = { x: target.x, y: target.y, type: target.type };
                    this.miningProgress = 0;
                }
                
                const toolMultiplier = TOOL_EFFECTIVENESS[selectedTool]?.includes(target.type) ? 3 : 0.5; // Grosse pénalité si mauvais outil
                this.miningProgress += 0.05 * toolMultiplier;

                game.miningEffect = { x: target.x, y: target.y, progress: this.miningProgress / TILE_HARDNESS[target.type] };

                if (this.miningProgress >= TILE_HARDNESS[target.type]) {
                    this.mineBlock(target.x, target.y, target.type, game);
                    this.resetMining(game);
                }
            } else {
                this.resetMining(game);
            }
        } else {
            this.resetMining(game);
        }
    }

    mineBlock(tileX, tileY, tile, game) {
        game.tileMap[tileY][tileX] = TILE.AIR;
        
        // Crée un objet à récolter
        game.collectibles.push({
            x: tileX * game.config.tileSize,
            y: tileY * game.config.tileSize,
            vy: -2, // Pop vers le haut
            tileType: tile
        });
        
        if (tile === TILE.WOOD) {
            const neighbors = [[tileX, tileY - 1], [tileX - 1, tileY], [tileX + 1, tileY]];
            for (const [nx, ny] of neighbors) {
                game.propagateTreeCollapse(nx, ny);
            }
        }
    }

    checkCollectibleCollisions(game) {
        game.collectibles.forEach((item, index) => {
            if (this.rectCollide(item)) {
                if (!this.inventory[item.tileType]) {
                    this.inventory[item.tileType] = 0;
                }
                this.inventory[item.tileType]++;
                game.collectibles.splice(index, 1);
            }
        });
    }

    // ... (les autres fonctions comme handleTileCollisions, draw, etc. restent ici)
}
