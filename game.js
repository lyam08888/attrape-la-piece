// =================================================================================
// SUPER PIXEL ADVENTURE - GAME ENGINE V3
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
    const ui = {
        canvas: document.getElementById('gameCanvas'),
        ctx: document.getElementById('gameCanvas').getContext('2d'),
        gameTitle: document.getElementById('gameTitle'),
        mainMenu: document.getElementById('mainMenu'),
        optionsMenu: document.getElementById('optionsMenu'),
        controlsMenu: document.getElementById('controlsMenu'),
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

    // --- Variables globales ---
    let config, level, assets = {}, game, keys = {}, currentSkin = 0;

    const gameSettings = {
        godMode: false,
        soundEnabled: true,
        difficulty: 'Normal', // Easy, Normal, Hard
    };

    // --- Chargement initial ---
    async function main() {
        try {
            const [configRes, levelRes] = await Promise.all([fetch('config.json'), fetch('level1.json')]);
            config = await configRes.json();
            level = await levelRes.json();
            
            ui.gameTitle.textContent = config.gameTitle;
            ui.canvas.width = config.canvasWidth;
            ui.canvas.height = config.canvasHeight;
            
            await loadAssets();
            setupMenus();
            setupInput();
        } catch (error) {
            console.error("Erreur de chargement des fichiers du jeu:", error);
            ui.mainMenu.innerHTML = "<h2>Erreur de chargement</h2>";
        }
    }

    async function loadAssets() {
        const promises = [];
        const allAssetPaths = [...Object.values(config.assets)];
        
        // Créer les skins dynamiquement
        config.skins.forEach((color, index) => {
            const key = `player${index + 1}`;
            config.assets[key] = `https://placehold.co/32x32/${color}/FFFFFF?text=${index + 1}`;
            allAssetPaths.push(config.assets[key]);
        });


        for (const path of allAssetPaths) {
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    const key = Object.keys(config.assets).find(k => config.assets[k] === path);
                    if (key) assets[key] = img;
                    resolve();
                };
                img.onerror = reject;
            });
            promises.push(promise);
        }
        await Promise.all(promises);
    }

    // --- Gestion des Menus ---
    function setupMenus() {
        ui.skinlist.innerHTML = '';
        config.skins.forEach((color, i) => {
            const key = `player${i + 1}`;
            const img = assets[key].cloneNode();
            img.onclick = () => selectSkin(i);
            if (i === currentSkin) img.classList.add("selected");
            ui.skinlist.appendChild(img);
        });
        
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

    // --- Initialisation du Jeu ---
    function initGame() {
        game = {
            player: {
                x: 50, y: 150, vx: 0, vy: 0,
                w: 32, h: 32,
                grounded: false, canDoubleJump: true, dir: 1, invulnerable: 0
            },
            camera: { x: 0 },
            enemies: [], particles: [],
            tileMap: level.tiles.map(row => row.split('').map(Number)),
            score: 0, lives: config.player.maxLives, time: config.player.gameTime,
            timeLast: Date.now(), over: false, dayNightCycle: 0, weather: { type: 'clear', particles: [] }
        };
        
        setupDifficulty();
        
        updateHUD();
        [ui.mainMenu, ui.optionsMenu, ui.controlsMenu, ui.gameover].forEach(m => m.classList.remove('active'));
        ui.hud.classList.add('active');
        
        requestAnimationFrame(gameLoop);
    }
    
    function setupDifficulty() {
        let enemyMultiplier = 1;
        if (gameSettings.difficulty === 'Easy') enemyMultiplier = 0.7;
        if (gameSettings.difficulty === 'Hard') enemyMultiplier = 1.5;
        
        game.tileMap.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile === 8 && Math.random() < enemyMultiplier) {
                    game.enemies.push({ 
                        x: x * config.tileSize, y: y * config.tileSize, 
                        w: 32, h: 32, vx: -0.5 * (gameSettings.difficulty === 'Hard' ? 1.5 : 1), vy: 0 
                    });
                }
            });
        });
    }

    // --- Boucle de Jeu ---
    function gameLoop() {
        if (game.over) return;
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // --- Logique de mise à jour ---
    function update() {
        updatePlayer();
        updateEnemies();
        updateParticles();
        updateCamera();
        updateTimer();
        updateWorld();
    }

    function updatePlayer() {
        const p = game.player;
        if (keys.left) { p.vx = -config.physics.playerSpeed; p.dir = -1; }
        else if (keys.right) { p.vx = config.physics.playerSpeed; p.dir = 1; }
        else { p.vx = 0; }

        if (keys.jump) {
            if (p.grounded) { p.vy = -config.physics.jumpForce; p.canDoubleJump = true; playSound('jump'); }
            else if (p.canDoubleJump) { p.vy = -config.physics.jumpForce * 0.8; p.canDoubleJump = false; playSound('jump'); }
            keys.jump = false;
        }

        p.vy += config.physics.gravity;
        
        p.x += p.vx;
        handleCollision('x');
        p.y += p.vy;
        p.grounded = false;
        handleCollision('y');

        if (p.y > level.height * config.tileSize) loseLife();
        if (p.invulnerable > 0) p.invulnerable--;
    }
    
    function updateEnemies() {
        game.enemies.forEach(e => {
            e.vy += config.physics.gravity;
            let oldX = e.x;
            e.x += e.vx;
            
            const nextTileX = e.vx > 0 ? e.x + e.w : e.x;
            const groundAhead = getTileAt(e.vx > 0 ? e.x + e.w : e.x -1, e.y + e.h + 1);

            if (getTileAt(nextTileX, e.y) > 0 || getTileAt(nextTileX, e.y + e.h - 1) > 0 || groundAhead === 0) {
                e.x = oldX;
                e.vx *= -1;
            }

            e.y += e.vy;
            if (e.vy > 0 && (getTileAt(e.x, e.y + e.h) > 0 || getTileAt(e.x + e.w, e.y + e.h) > 0)) {
                e.y = Math.floor((e.y + e.h) / config.tileSize) * config.tileSize - e.h;
                e.vy = 0;
            }

            if (rectCollide(game.player, e) && game.player.invulnerable === 0) {
                if (game.player.vy > 0 && game.player.y + game.player.h < e.y + 16) {
                    game.enemies = game.enemies.filter(en => en !== e);
                    game.score += 100;
                    game.player.vy = -config.physics.jumpForce / 2;
                } else {
                    loseLife();
                }
            }
        });
    }

    function updateParticles() {
        game.particles = game.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            return p.life > 0;
        });
    }
    
    function updateCamera() {
        const targetX = game.player.x - ui.canvas.width / 2;
        game.camera.x += (targetX - game.camera.x) * 0.1;
        game.camera.x = Math.max(0, Math.min(game.camera.x, level.width * config.tileSize - ui.canvas.width));
    }
    
    function updateTimer() {
        if (Date.now() - game.timeLast > 1000) {
            game.time--;
            game.timeLast = Date.now();
            if (game.time <= 0) {
                endGame(false);
            }
            updateHUD();
        }
    }

    function updateWorld() {
        game.dayNightCycle = (game.dayNightCycle + 0.0005) % (Math.PI * 2);
        if (Math.random() < 0.001) game.weather.type = ['clear', 'rain', 'snow'][Math.floor(Math.random() * 3)];
    }
    
    // --- Dessin ---
    function draw() {
        drawSky();
        ui.ctx.save();
        ui.ctx.translate(-game.camera.x, 0);
        drawTiles();
        drawEnemies();
        drawPlayer();
        drawParticles();
        ui.ctx.restore();
    }
    
    function drawSky() {
        const time = (Math.sin(game.dayNightCycle) + 1) / 2;
        let c1 = "#87ceeb", c2 = "#98d8e8"; // Jour
        if (time < 0.3) { c1 = "#0a0a2e"; c2 = "#1e1e4e"; } // Nuit
        else if (time < 0.5) { c1 = "#4a5a8e"; c2 = "#f4a460"; } // Aube
        else if (time > 0.8) { c1 = "#ff6b6b"; c2 = "#ffa500"; } // Crépuscule
        const grad = ui.ctx.createLinearGradient(0, 0, 0, ui.canvas.height);
        grad.addColorStop(0, c1); grad.addColorStop(1, c2);
        ui.ctx.fillStyle = grad;
        ui.ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    }

    function drawTiles() {
        const startCol = Math.floor(game.camera.x / config.tileSize);
        const endCol = startCol + (ui.canvas.width / config.tileSize) + 2;
        for (let y = 0; y < level.height; y++) {
            for (let x = startCol; x < endCol; x++) {
                const tile = getTile(x, y);
                if (!tile) continue;
                const tx = x * config.tileSize, ty = y * config.tileSize;
                if(tile === 1 || tile === 2) ui.ctx.drawImage(assets.wall, tx, ty);
                if(tile === 4) ui.ctx.drawImage(assets.coin, tx, ty);
                if(tile === 9) ui.ctx.drawImage(assets.flag, tx, ty);
            }
        }
    }

    function drawPlayer() {
        const p = game.player;
        ui.ctx.save();
        ui.ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        if (p.dir === -1) { ui.ctx.scale(-1, 1); }
        
        if (gameSettings.godMode) {
            ui.ctx.shadowColor = 'gold';
            ui.ctx.shadowBlur = 15;
        }
        
        if (p.invulnerable > 0 && p.invulnerable % 10 < 5) ui.ctx.globalAlpha = 0.5;
        
        const skinKey = `player${currentSkin + 1}`;
        ui.ctx.drawImage(assets[skinKey], -p.w / 2, -p.h / 2, p.w, p.h);
        ui.ctx.restore();
    }

    function drawEnemies() {
        game.enemies.forEach(e => ui.ctx.drawImage(assets.enemy, e.x, e.y, e.w, e.h));
    }
    
    function drawParticles() {
        game.particles.forEach(p => {
            ui.ctx.fillStyle = p.color;
            ui.ctx.globalAlpha = p.life / p.maxLife;
            ui.ctx.fillRect(p.x, p.y, 2, 2);
        });
        ui.ctx.globalAlpha = 1.0;
    }

    // --- Utilitaires ---
    function getTile(x, y) { return (y < 0 || y >= level.height || x < 0 || x >= level.width) ? 0 : game.tileMap[y][x]; }
    function getTileAt(px, py) { return getTile(Math.floor(px / config.tileSize), Math.floor(py / config.tileSize)); }
    function rectCollide(r1, r2) { return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y; }
    function playSound(type) { if(!gameSettings.soundEnabled) return; /* Logique audio ici */ }
    
    function updateHUD() {
        ui.score.textContent = `SCORE: ${String(game.score).padStart(6, '0')}`;
        ui.lives.textContent = '❤'.repeat(game.lives);
        ui.timer.textContent = `TEMPS: ${game.time}`;
    }

    function loseLife() {
        if(gameSettings.godMode) return;
        game.lives--;
        if (game.lives <= 0) {
            endGame(false);
        } else {
            game.player.x = 50;
            game.player.y = 150;
            game.player.invulnerable = 120; // 2 secondes d'invincibilité
        }
        updateHUD();
    }

    function endGame(win) {
        game.over = true;
        ui.message.innerHTML = win ? `🎉 Victoire! 🎉` : `💀 Game Over 💀`;
        ui.hud.classList.remove('active');
        ui.gameover.classList.add('active');
    }

    function handleCollision(axis) {
        const p = game.player;
        const ts = config.tileSize;
        const left = Math.floor(p.x / ts), right = Math.floor((p.x + p.w) / ts);
        const top = Math.floor(p.y / ts), bottom = Math.floor((p.y + p.h) / ts);

        for (let y = top; y <= bottom; y++) {
            for (let x = left; x <= right; x++) {
                const tile = getTile(x, y);
                if (tile === 1 || tile === 2) {
                    if (axis === 'x') {
                        if (p.vx > 0) p.x = x * ts - p.w;
                        else if (p.vx < 0) p.x = (x + 1) * ts;
                    } else {
                        if (p.vy > 0) { p.y = y * ts - p.h; p.vy = 0; p.grounded = true; }
                        else if (p.vy < 0) { p.y = (y + 1) * ts; p.vy = 0; }
                    }
                }
                if (tile === 4) {
                    game.tileMap[y][x] = 0;
                    game.score += 10;
                    updateHUD();
                }
                if (tile === 9) endGame(true);
            }
        }
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
        });

        if ('ontouchstart' in window) {
            ui.controls.style.display = 'flex';
            ui.btnLeft.addEventListener('touchstart', () => keys.left = true, {passive: true});
            ui.btnLeft.addEventListener('touchend', () => keys.left = false);
            ui.btnRight.addEventListener('touchstart', () => keys.right = true, {passive: true});
            ui.btnRight.addEventListener('touchend', () => keys.right = false);
            ui.btnJump.addEventListener('touchstart', () => keys.jump = true, {passive: true});
            ui.btnJump.addEventListener('touchend', () => keys.jump = false);
        }
    }

    main();
});
