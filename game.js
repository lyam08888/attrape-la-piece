// On importe les classes et fonctions depuis les autres fichiers
import { Player } from './player.js';
import { Slime, Frog, Golem } from './enemy.js';
import { generateLevel } from './world.js';

document.addEventListener('DOMContentLoaded', () => {
    // Références aux éléments de l'interface utilisateur
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

    // Variables globales du jeu
    let config, level, assets = {}, game, keys = {}, currentSkin = 0, audioCtx;

    const gameSettings = {
        godMode: false,
        soundEnabled: true,
        difficulty: 'Normal',
    };

    // Fonction principale qui lance le chargement
    async function main() {
        try {
            const [configRes, levelRes] = await Promise.all([
                fetch('config.json'),
                fetch('level1.json')
            ]);
            config = await configRes.json();
            level = await levelRes.json();
            
            ui.gameTitle.textContent = config.gameTitle;
            ui.canvas.width = config.canvasWidth;
            ui.canvas.height = config.canvasHeight;
            
            await loadAssets();
            setupMenus();
            setupInput();
        } catch (error) {
            console.error("Erreur de chargement:", error);
            ui.mainMenu.innerHTML = `<h2>Erreur de chargement des fichiers.</h2><p style="font-size:0.5em; margin-top:10px;">Vérifiez que les fichiers config.json et level1.json existent et que les URLs dans config.json sont correctes. Erreur: ${error}</p>`;
        }
    }

    // Charge toutes les images nécessaires
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

    // Met en place les menus et leurs interactions
    function setupMenus() {
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
            const difficulty = e.target.dataset.difficulty;
            if (action) handleMenuAction(action);
            if (difficulty) setDifficulty(difficulty);
        });
        ui.btnRestart.onclick = initGame;
    }

    function handleMenuAction(action) {
        switch(action) {
            case 'start': initGame(); break;
            case 'options': showMenu(ui.optionsMenu); break;
            case 'controls': showMenu(ui.controlsMenu); break;
            case 'backToMain': showMenu(ui.mainMenu); break;
            case 'toggleGodMode':
                gameSettings.godMode = !gameSettings.godMode;
                ui.godModeBtn.textContent = gameSettings.godMode ? 'ON' : 'OFF';
                ui.godModeBtn.classList.toggle('on', gameSettings.godMode);
                break;
            case 'toggleSound':
                gameSettings.soundEnabled = !gameSettings.soundEnabled;
                ui.soundBtn.textContent = gameSettings.soundEnabled ? 'ON' : 'OFF';
                ui.soundBtn.classList.toggle('on', gameSettings.soundEnabled);
                if(gameSettings.soundEnabled && !audioCtx) {
                    try {
                       audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    } catch(e) {
                       console.error("Web Audio API is not supported in this browser.");
                    }
                }
                break;
        }
    }

    function showMenu(menuToShow) {
        [ui.mainMenu, ui.optionsMenu, ui.controlsMenu].forEach(menu => menu.classList.remove('active'));
        menuToShow.classList.add('active');
    }

    function selectSkin(i) {
        currentSkin = i;
        [...ui.skinlist.children].forEach((img, index) => img.classList.toggle("selected", index === i));
    }

    function setDifficulty(level) {
        gameSettings.difficulty = level;
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.difficulty === level);
        });
    }

    // Initialise une nouvelle partie
    function initGame() {
        try {
            game = {
                player: new Player(config.canvasWidth / 2, 100, config),
                camera: { x: 0, y: 0 },
                tileMap: [], enemies: [], particles: [],
                score: 0, lives: config.player.maxLives, time: config.player.gameTime,
                timeLast: Date.now(), over: false, dayNightCycle: 0,
                settings: gameSettings,
                level: level,
                config: config,
                playSound: playSound,
                createParticles: createParticles,
                loseLife: loseLife
            };
            
            generateLevel(game, config, gameSettings);
            
            updateHUD();
            [ui.mainMenu, ui.optionsMenu, ui.controlsMenu, ui.gameover].forEach(m => m.classList.remove('active'));
            ui.hud.classList.add('active');
            
            requestAnimationFrame(gameLoop);
        } catch (error) {
            console.error("ERREUR CRITIQUE pendant initGame:", error);
            ui.mainMenu.innerHTML = `<h2>Une erreur critique est survenue.</h2><p style="font-size:0.5em; margin-top:10px;">Vérifiez la console (F12) pour les détails.</p>`;
            showMenu(ui.mainMenu);
        }
    }
    
    // Boucle de jeu principale
    function gameLoop() {
        if (!game || game.over) return;
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // Met à jour l'état de tous les objets du jeu
    function update() {
        game.player.update(keys, game);
        game.enemies.forEach(e => e.update(game));
        game.enemies = game.enemies.filter(e => !e.isDead);
        updateParticles();
        updateCamera();
        updateTimer();
        updateWorld();
    }
    
    function updateParticles() {
        game.particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life--;
            p.size = Math.max(0, p.size - 0.1);
            if (p.life <= 0) {
                game.particles.splice(index, 1);
            }
        });
    }
    
    function updateCamera() {
        const targetX = game.player.x - ui.canvas.width / 2;
        const targetY = game.player.y - ui.canvas.height / 2;
        game.camera.x += (targetX - game.camera.x) * 0.1;
        game.camera.y += (targetY - game.camera.y) * 0.1;

        const worldPixelWidth = config.worldWidth;
        const worldPixelHeight = config.worldHeight;
        
        game.camera.x = Math.max(0, Math.min(game.camera.x, worldPixelWidth - ui.canvas.width));
        game.camera.y = Math.max(0, Math.min(game.camera.y, worldPixelHeight - ui.canvas.height));
    }
    
    function updateTimer() {
        if (Date.now() - game.timeLast > 1000) {
            game.time--;
            game.timeLast = Date.now();
            if (game.time <= 0) {
                game.time = 0;
                endGame(false);
            }
            updateHUD();
        }
    }

    function updateWorld() {
        game.dayNightCycle = (game.dayNightCycle + 0.0002) % (Math.PI * 2);
    }
    
    // Dessine tous les éléments du jeu sur le canvas
    function draw() {
        if (!game) return;
        drawSky();
        ui.ctx.save();
        ui.ctx.translate(-game.camera.x, -game.camera.y);

        drawTileMap();
        
        game.enemies.forEach(e => e.draw(ui.ctx, assets));
        game.player.draw(ui.ctx, assets, `player${currentSkin + 1}`, gameSettings.godMode);
        drawParticles();
        ui.ctx.restore();

        drawVignette();
    }
    
    function drawTileMap() {
        const { tileSize } = config;
        const startCol = Math.floor(game.camera.x / tileSize);
        const endCol = startCol + Math.ceil(ui.canvas.width / tileSize);
        const startRow = Math.floor(game.camera.y / tileSize);
        const endRow = startRow + Math.ceil(ui.canvas.height / tileSize);

        const TILE_ASSETS = { 1: assets.tile_grass, 2: assets.tile_dirt, 3: assets.tile_stone, 4: assets.tile_coal, 5: assets.tile_iron };

        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (game.tileMap[y] && game.tileMap[y][x]) {
                    const tileId = game.tileMap[y][x];
                    const asset = TILE_ASSETS[tileId];
                    if (asset) {
                        ui.ctx.drawImage(asset, x * tileSize, y * tileSize, tileSize, tileSize);
                    }
                }
            }
        }
    }

    function drawSky() {
        const time = (Math.sin(game.dayNightCycle) + 1) / 2;
        let c1 = "#87CEEB", c2 = "#5C94FC"; // Jour
        if (time < 0.25) { c1 = "#0a0a2e"; c2 = "#1e1e4e"; } // Nuit
        else if (time < 0.5) { c1 = "#4a5a8e"; c2 = "#f4a460"; } // Aube
        else if (time > 0.85) { c1 = "#ff6b6b"; c2 = "#ffa500"; } // Crépuscule
        const grad = ui.ctx.createLinearGradient(0, 0, 0, ui.canvas.height);
        grad.addColorStop(0, c1); grad.addColorStop(1, c2);
        ui.ctx.fillStyle = grad;
        ui.ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    }
    
    function drawParticles() {
        if (!game) return;
        game.particles.forEach(p => {
            ui.ctx.fillStyle = p.color;
            ui.ctx.globalAlpha = p.life / p.maxLife;
            ui.ctx.beginPath();
            ui.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ui.ctx.fill();
        });
        ui.ctx.globalAlpha = 1.0;
    }

    function drawVignette() {
        const grad = ui.ctx.createRadialGradient(
            ui.canvas.width / 2, ui.canvas.height / 2, ui.canvas.width / 3,
            ui.canvas.width / 2, ui.canvas.height / 2, ui.canvas.width / 2 + 150
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.3)');
        ui.ctx.fillStyle = grad;
        ui.ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    }
    
    function setupInput() {
        keys = { left: false, right: false, jump: false };
        document.addEventListener('keydown', e => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.jump = true;
        });
        document.addEventListener('keyup', e => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.jump = false;
        });

        if ('ontouchstart' in window) {
            ui.controls.style.display = 'flex';
            const handleTouch = (e, isDown) => {
                e.preventDefault();
                const key = e.currentTarget.id.replace('btn', '').toLowerCase();
                keys[key] = isDown;
            };

            ui.btnLeft.addEventListener('touchstart', e => handleTouch(e, true), {passive: false});
            ui.btnLeft.addEventListener('touchend', e => handleTouch(e, false));
            ui.btnRight.addEventListener('touchstart', e => handleTouch(e, true), {passive: false});
            ui.btnRight.addEventListener('touchend', e => handleTouch(e, false));
            ui.btnJump.addEventListener('touchstart', e => handleTouch(e, true), {passive: false});
            ui.btnJump.addEventListener('touchend', e => handleTouch(e, false));
        }
    }
    
    function playSound(type) { if(!gameSettings.soundEnabled || !audioCtx) return; /* ... logique du son ici ... */ }
    function updateHUD() { if(!game) return; ui.lives.textContent = '❤'.repeat(game.lives); ui.score.textContent = `SCORE: ${String(game.score).padStart(6, '0')}`; ui.timer.textContent = `TEMPS: ${game.time}`; }
    function loseLife() { if(!game || game.over || gameSettings.godMode) return; game.lives--; game.playSound('hurt'); if(game.lives <= 0) { endGame(false); } else { game.player.invulnerable = 120; } updateHUD(); }
    function endGame(win) { if (!game) return; game.over = true; ui.message.innerHTML = win ? `🎉 Victoire! 🎉<br>SCORE: ${game.score}` : `💀 Game Over 💀`; ui.hud.classList.remove('active'); ui.gameover.classList.add('active'); }
    function createParticles(x, y, count, color, options = {}) { 
        if (!game) return;
         for (let i = 0; i < count; i++) {
            game.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * (options.speed || 4),
                vy: (Math.random() - 0.5) * (options.speed || 4) - 2,
                life: 30 + Math.random() * 30,
                maxLife: 60,
                size: 2 + Math.random() * 3,
                gravity: options.gravity || 0.1,
                color: color
            });
        }
    }
    
    main();
});
