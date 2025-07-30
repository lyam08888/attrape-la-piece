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
                settings: gameSettings // On attache les paramètres au jeu
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
    
    // ... (toutes les autres fonctions comme propagateTreeCollapse, setupInput, etc. restent ici)
});
```

---
### `player.js` (Corrigé)
Ce fichier contient la nouvelle physique de collision qui résout les problèmes de mouvement.


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
                
                const toolMultiplier = TOOL_EFFECTIVENESS[selectedTool]?.includes(target.type) ? 3 : 0.5;
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

    resetMining(game) {
        this.miningTarget = null;
        this.miningProgress = 0;
        game.miningEffect = null;
    }

    getTargetTile(mouse, game) {
        const { tileSize } = this.config;
        let tileX, tileY;

        if (mouse.left) {
            const worldMouseX = mouse.x / game.settings.zoom + game.camera.x;
            const worldMouseY = mouse.y / game.settings.zoom + game.camera.y;
            tileX = Math.floor(worldMouseX / tileSize);
            tileY = Math.floor(worldMouseY / tileSize);

            const playerCenterX = this.x + this.w / 2;
            const playerCenterY = this.y + this.h / 2;
            const dist = Math.sqrt(Math.pow(playerCenterX - worldMouseX, 2) + Math.pow(playerCenterY - worldMouseY, 2));
            if (dist > this.config.player.reach * tileSize) return null;

        } else {
            const checkX = this.x + this.w / 2 + (this.dir * (this.w / 2 + 8));
            const checkY = this.y + this.h / 2;
            tileX = Math.floor(checkX / tileSize);
            tileY = Math.floor(checkY / tileSize);
        }
        
        const tile = game.tileMap[tileY]?.[tileX];

        if (tile > 0) {
            return { x: tileX, y: tileY, type: tile };
        }
        return null;
    }

    mineBlock(tileX, tileY, tile, game) {
        game.tileMap[tileY][tileX] = TILE.AIR;
        
        game.collectibles.push({
            x: tileX * game.config.tileSize,
            y: tileY * game.config.tileSize,
            vy: -2,
            tileType: tile
        });
        
        if (tile === TILE.WOOD) {
            const neighbors = [[tileX, tileY - 1], [tileX - 1, tileY], [tileX + 1, tileY]];
            for (const [nx, ny] of neighbors) {
                game.propagateTreeCollapse(nx, ny);
            }
        }
    }

    handleTileCollisions(game) {
        const { tileSize } = this.config;

        this.x += this.vx;
        if (this.vx > 0) {
            let top = Math.floor(this.y / tileSize);
            let bottom = Math.floor((this.y + this.h - 1) / tileSize);
            let right = Math.floor((this.x + this.w) / tileSize);
            for (let tileY = top; tileY <= bottom; tileY++) {
                if (game.tileMap[tileY]?.[right] > 0) {
                    this.x = right * tileSize - this.w - 0.01;
                    this.vx = 0;
                    break;
                }
            }
        } else if (this.vx < 0) {
            let top = Math.floor(this.y / tileSize);
            let bottom = Math.floor((this.y + this.h - 1) / tileSize);
            let left = Math.floor(this.x / tileSize);
            for (let tileY = top; tileY <= bottom; tileY++) {
                if (game.tileMap[tileY]?.[left] > 0) {
                    this.x = (left + 1) * tileSize + 0.01;
                    this.vx = 0;
                    break;
                }
            }
        }
        this.y += this.vy;
        this.grounded = false;
        if (this.vy > 0) {
            let left = Math.floor((this.x + 1) / tileSize);
            let right = Math.floor((this.x + this.w - 1) / tileSize);
            let bottom = Math.floor((this.y + this.h) / tileSize);
            for (let tileX = left; tileX <= right; tileX++) {
                if (game.tileMap[bottom]?.[tileX] > 0) {
                    this.y = bottom * tileSize - this.h;
                    this.vy = 0;
                    this.grounded = true;
                    this.canDoubleJump = true;
                    break;
                }
            }
        } else if (this.vy < 0) {
            let left = Math.floor((this.x + 1) / tileSize);
            let right = Math.floor((this.x + this.w - 1) / tileSize);
            let top = Math.floor(this.y / tileSize);
            for (let tileX = left; tileX <= right; tileX++) {
                if (game.tileMap[top]?.[tileX] > 0) {
                    this.y = (top + 1) * tileSize;
                    this.vy = 0;
                    break;
                }
            }
        }
    }

    checkEnemyCollisions(game) {
        game.enemies.forEach(enemy => {
            if (this.rectCollide(enemy) && !enemy.isDying) {
                if (this.vy > 0 && (this.y + this.h) < (enemy.y + enemy.h * 0.5)) {
                    enemy.takeDamage(game);
                    this.vy = -this.config.physics.jumpForce * 0.6;
                } 
                else if (this.invulnerable === 0) {
                    game.loseLife();
                }
            }
        });
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
    
    rectCollide(other) {
        return this.x < other.x + other.w && this.x + this.w > other.x &&
               this.y < other.y + other.h && this.y + this.h > other.y;
    }

    drawTool(ctx, assets) {
        ctx.save();
        const selectedTool = this.tools[this.selectedToolIndex];
        const toolAsset = assets[`tool_${selectedTool}`];

        if (toolAsset) {
            ctx.translate(this.w * 0.2, this.h * 0.3);

            if (this.swingTimer > 0) {
                const swingProgress = (15 - this.swingTimer) / 15;
                const swingAngle = Math.sin(swingProgress * Math.PI) * 1.5;
                ctx.rotate(swingAngle);
            }
            ctx.drawImage(toolAsset, -12, -12, 24, 24);
        }
        ctx.restore();
    }

    draw(ctx, assets, skinKey) {
        ctx.save();
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        if (this.dir === 1) {
            ctx.scale(-1, 1);
        }

        const skinAsset = assets[skinKey];
        if (skinAsset) {
            ctx.drawImage(skinAsset, -this.w / 2, -this.h / 2, this.w, this.h);
        } else {
            ctx.fillStyle = '#ea4335';
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        }
        
        this.drawTool(ctx, assets);
        ctx.restore();
    }
}
