import { Player } from './player.js';
import { Slime, Frog, Golem } from './enemy.js';
import { generateLevel } from './world.js';

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

    let config, level, assets = {}, game, keys = {}, currentSkin = 0, audioCtx;

    const gameSettings = {
        godMode: false,
        soundEnabled: true,
        difficulty: 'Normal',
    };

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
            console.error("Erreur de chargement:", error);
            ui.mainMenu.innerHTML = `<h2>Erreur de chargement des assets. Vérifiez votre dépôt GitHub.</h2><p style="font-size:0.5em; margin-top:10px;">${error}</p>`;
        }
    }

    async function loadAssets() {
        const promises = [];
        const baseUrl = config.githubRepoUrl;
        const allAssetPaths = {};
        for (const [key, path] of Object.entries(config.assets)) {
            allAssetPaths[key] = baseUrl + path;
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
                img.onerror = () => reject(`Erreur: ${path}`);
            }));
        }
        await Promise.all(promises);
    }

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
                if(gameSettings.soundEnabled && !audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

    function initGame() {
        game = {
            player: new Player(80, 300, config),
            camera: { x: 0 },
            platforms: [], enemies: [], particles: [], water: [], coins: [], checkpoints: [], bonuses: [],
            lastCheckpoint: { x: 80, y: 300 },
            score: 0, lives: config.player.maxLives, time: config.player.gameTime,
            timeLast: Date.now(), over: false, dayNightCycle: 0, weather: { type: 'clear', particles: [] },
            settings: gameSettings,
            level: level,
            playSound: playSound,
            createParticles: createParticles,
            loseLife: loseLife
        };
        
        generateLevel(game, level, gameSettings);
        updateHUD();
        [ui.mainMenu, ui.optionsMenu, ui.controlsMenu, ui.gameover].forEach(m => m.classList.remove('active'));
        ui.hud.classList.add('active');
        
        requestAnimationFrame(gameLoop);
    }
    
    function gameLoop() {
        if (game.over) return;
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }

    function update() {
        game.player.update(keys, game);
        game.enemies.forEach(e => e.update(game.platforms, level.worldWidth));
        updateParticles();
        updateCamera();
        updateTimer();
        updateWorld();
    }
    
    function updateParticles() {
        game.particles = game.particles.filter(p => {
            p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--;
            return p.life > 0;
        });
    }
    
    function updateCamera() {
        const targetX = game.player.x - ui.canvas.width / 2;
        game.camera.x += (targetX - game.camera.x) * 0.1;
        game.camera.x = Math.max(0, Math.min(game.camera.x, level.worldWidth - ui.canvas.width));
    }
    
    function updateTimer() {
        if (Date.now() - game.timeLast > 1000) {
            game.time--;
            game.timeLast = Date.now();
            if (game.time <= 0) endGame(false);
            updateHUD();
        }
    }

    function updateWorld() {
        game.dayNightCycle = (game.dayNightCycle + 0.0003) % (Math.PI * 2);
    }
    
    function draw() {
        drawSky();
        ui.ctx.save();
        ui.ctx.translate(-game.camera.x, 0);
        drawScenery();
        game.platforms.forEach(p => ui.ctx.drawImage(assets.wall, p.x, p.y, p.w, p.h));
        game.water.forEach(w => { ui.ctx.fillStyle = 'rgba(0, 100, 200, 0.6)'; ui.ctx.fillRect(w.x, w.y, w.w, w.h); });
        game.enemies.forEach(e => e.draw(ui.ctx, assets));
        game.player.draw(ui.ctx, assets, `player${currentSkin + 1}`, gameSettings.godMode);
        drawParticles();
        ui.ctx.restore();
    }
    
    function drawSky() {
        const time = (Math.sin(game.dayNightCycle) + 1) / 2;
        let c1 = "#5C94FC", c2 = "#87CEEB";
        if (time < 0.3) { c1 = "#0a0a2e"; c2 = "#1e1e4e"; }
        else if (time < 0.5) { c1 = "#4a5a8e"; c2 = "#f4a460"; }
        else if (time > 0.8) { c1 = "#ff6b6b"; c2 = "#ffa500"; }
        const grad = ui.ctx.createLinearGradient(0, 0, 0, ui.canvas.height);
        grad.addColorStop(0, c1); grad.addColorStop(1, c2);
        ui.ctx.fillStyle = grad;
        ui.ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    }
    
    function drawScenery() {
        ui.ctx.fillStyle = '#8CD65C';
        const hillX = (-game.camera.x * 0.5) % ui.canvas.width;
        ui.ctx.beginPath();
        ui.ctx.moveTo(hillX, level.worldHeight);
        ui.ctx.arc(hillX + 200, level.worldHeight, 200, Math.PI, 0, false);
        ui.ctx.arc(hillX + 600, level.worldHeight, 250, Math.PI, 0, false);
        ui.ctx.arc(hillX + 1000, level.worldHeight, 200, Math.PI, 0, false);
        ui.ctx.fill();
    }
    
    function drawParticles() {
        game.particles.forEach(p => {
            ui.ctx.fillStyle = p.color;
            ui.ctx.globalAlpha = p.life / p.maxLife;
            ui.ctx.fillRect(p.x, p.y, 2, 2);
        });
        ui.ctx.globalAlpha = 1.0;
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
            ['btnLeft', 'btnRight', 'btnJump'].forEach(id => {
                const key = id.replace('btn', '').toLowerCase();
                ui[id].addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; }, {passive: false});
                ui[id].addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
            });
        }
    }
    
    function playSound(type) { if(!gameSettings.soundEnabled || !audioCtx) return; /* ... */ }
    function updateHUD() { ui.lives.textContent = '❤'.repeat(game.lives); ui.score.textContent = `SCORE: ${String(game.score).padStart(6, '0')}`; ui.timer.textContent = `TEMPS: ${game.time}`; }
    function loseLife() { if(gameSettings.godMode) return; game.lives--; if(game.lives <= 0) endGame(false); else { game.player.x = game.lastCheckpoint.x; game.player.y = game.lastCheckpoint.y; game.player.invulnerable = 120; } updateHUD(); }
    function endGame(win) { game.over = true; ui.message.innerHTML = win ? `🎉 Victoire! 🎉` : `💀 Game Over 💀`; ui.hud.classList.remove('active'); ui.gameover.classList.add('active'); }
    function createParticles(x, y, count, color) { /* ... */ }
    
    main();
});
