import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { generateLevel, TILE } from './world.js';
import { Logger } from './logger.js';
import { WorldAnimator } from './worldAnimator.js';
import { SoundManager } from './sound.js';
import { TimeSystem, updateCalendarUI } from './calendar.js';
import { randomItem } from './survivalItems.js';
import { getItemIcon } from './itemIcons.js';
import { getChestImage } from './chestGenerator.js';
import { generateMonster } from './generateurMonstres.js';
import { generateAnimal } from './generateurAnimaux.js';
import { generatePNJ } from './generateurPNJ.js';
import { PNJ } from './PNJ.js';

// --- CLASSES MONSTER & ANIMAL ---
class Monster {
    constructor(x, y, config, monsterData) {
        this.x = x; this.y = y; this.w = config.tileSize; this.h = config.tileSize;
        this.properties = monsterData.properties; this.isDead = false; this.vx = 0; this.vy = 0;
        this.speed = config.tileSize * (0.01 + Math.random() * 0.02); this.direction = Math.random() < 0.5 ? 1 : -1;
        this.actionTimer = 60 + Math.random() * 120; this.isGrounded = false; this.health = 50; this.isDying = false;
        this.image = new Image(); const svg64 = btoa(monsterData.svgString); this.image.src = 'data:image/svg+xml;base64,' + svg64;
    }
    takeDamage(game, amount) {
        if (this.isDying) return; this.health -= amount;
        game.createParticles(this.x + this.w / 2, this.y + this.h / 2, 5, 'red');
        if (this.health <= 0) {
            this.isDying = true; game.sound.play('enemy_die', { volume: 0.7 }); game.addXP(25);
            game.createParticles(this.x + this.w / 2, this.y + this.h / 2, 15, this.properties.bodyColor || '#888');
            setTimeout(() => { this.isDead = true; }, 300);
        }
    }
    rectCollide(other) { return (this.x < other.x + other.w && this.x + this.w > other.x && this.y < other.y + other.h && this.y + this.h > other.y); }
    update(game) {
        if (this.isDead || this.isDying) return;
        const { tileSize, physics } = game.config; this.actionTimer--;
        if (this.actionTimer <= 0) { this.direction *= -1; this.actionTimer = 120 + Math.random() * 180; }
        this.vx = this.speed * this.direction; this.vy += physics.gravity;
        if (this.vy > physics.maxFallSpeed) this.vy = physics.maxFallSpeed;
        this.handleCollisions(game, tileSize); const player = game.player;
        if (this.rectCollide(player)) {
            if (player.vy > 0 && (player.y + player.h) < (this.y + this.h * 0.5)) { this.takeDamage(game, 100); player.vy = -player.config.physics.jumpForce * 0.6; } 
            else if (!player.invulnerable) { game.loseLife(); }
        }
    }
    handleCollisions(game, tileSize) {
        let nextX = this.x + this.vx;
        const xTile = Math.floor((nextX + (this.vx > 0 ? this.w : 0)) / tileSize);
        const yTileTop = Math.floor(this.y / tileSize); const yTileBottom = Math.floor((this.y + this.h - 1) / tileSize);
        if (game.tileMap[yTileTop]?.[xTile] > TILE.AIR || game.tileMap[yTileBottom]?.[xTile] > TILE.AIR) { nextX = this.x; this.direction *= -1; }
        this.x = nextX; this.y += this.vy;
        const yTile = Math.floor((this.y + (this.vy > 0 ? this.h : 0)) / tileSize);
        const xTileLeft = Math.floor(this.x / tileSize); const xTileRight = Math.floor((this.x + this.w - 1) / tileSize);
        if (game.tileMap[yTile]?.[xTileLeft] > TILE.AIR || game.tileMap[yTile]?.[xTileRight] > TILE.AIR) {
            if (this.vy > 0) { this.y = yTile * tileSize - this.h; this.vy = 0; this.isGrounded = true; } 
            else if (this.vy < 0) { this.y = yTile * tileSize + tileSize; this.vy = 0; }
        } else { this.isGrounded = false; }
    }
    draw(ctx) { if (this.isDying) { ctx.globalAlpha = 0.5; } if (this.image.complete) { ctx.drawImage(this.image, this.x, this.y, this.w, this.h); } ctx.globalAlpha = 1.0; }
}
class Animal {
    constructor(x, y, config, animalData) {
        this.x = x; this.y = y; this.w = config.tileSize * 0.8; this.h = config.tileSize * 0.8;
        this.properties = animalData; this.isDead = false; this.vx = 0; this.vy = 0;
        this.speed = config.tileSize * (0.005 + Math.random() * 0.015); this.direction = Math.random() < 0.5 ? 1 : -1;
        this.actionTimer = 120 + Math.random() * 240; this.image = new Image();
        const svg64 = btoa(this.properties.svgString); this.image.src = 'data:image/svg+xml;base64,' + svg64;
    }
    update(game) {
        const { tileSize, physics } = game.config; this.actionTimer--;
        if (this.actionTimer <= 0) { this.direction *= -1; this.actionTimer = 180 + Math.random() * 300; }
        this.vx = this.speed * this.direction;
        if (this.properties.movement === 'fly') { this.vy = (Math.random() - 0.5) * 0.5; } 
        else if (this.properties.movement === 'swim') { this.vy = (Math.random() - 0.5) * 0.3; this.vx *= 1.5; } 
        else { this.vy += physics.gravity; if (this.vy > physics.maxFallSpeed) this.vy = physics.maxFallSpeed; }
        this.handleCollisions(game, tileSize);
    }
    handleCollisions(game, tileSize) { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x + this.w > game.config.worldWidth) { this.direction *= -1; } }
    draw(ctx) { if (this.image.complete) { ctx.drawImage(this.image, this.x, this.y, this.w, this.h); } }
}


document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const config = await (await fetch('config.json')).json();
    const logger = new Logger();
    const sound = new SoundManager(config.soundVolume);

    const ui = {
        canvas: canvas, ctx: ctx, gameTitle: document.getElementById('gameTitle'), mainMenu: document.getElementById('mainMenu'),
        optionsMenu: document.getElementById('optionsMenu'), controlsMenu: document.getElementById('controlsMenu'), hud: document.getElementById('hud'),
        lives: document.getElementById('lives'), gameover: document.getElementById('gameover'), message: document.getElementById('message'),
        btnRestart: document.getElementById('btnRestart'), toolbar: document.getElementById('toolbar'), inventoryMenu: document.getElementById('inventoryMenu'),
        chestMenu: document.getElementById('chestMenu'), inventoryGrid: document.getElementById('inventoryGrid'), chestGrid: document.getElementById('chestGrid'),
        renderDistanceSlider: document.getElementById('renderDistanceSlider'), renderDistanceValue: document.getElementById('renderDistanceValue'),
        zoomSlider: document.getElementById('zoomSlider'), zoomValue: document.getElementById('zoomValue'),
        particlesCheckbox: document.getElementById('particlesCheckbox'), weatherCheckbox: document.getElementById('weatherCheckbox'),
        lightingCheckbox: document.getElementById('lightingCheckbox'), soundSlider: document.getElementById('soundSlider'),
        volumeValue: document.getElementById('volumeValue'), xpFill: document.getElementById('xpFill'), levelPopup: document.getElementById('levelPopup'),
        levelDisplay: document.getElementById('levelDisplay'), timeDisplay: document.getElementById('timeDisplay'), debugOverlay: document.getElementById('debugOverlay'),
        calendarMenu: document.getElementById('calendarMenu'), calendarDate: document.getElementById('calendarDate'), calendarTime: document.getElementById('calendarTime'),
        calendarStage: document.getElementById('calendarStage'), closeCalendar: document.getElementById('closeCalendar'), skillsMenu: document.getElementById('skillsMenu'),
        skillPointsInfo: document.getElementById('skillPointsInfo'), skillRows: document.querySelectorAll('.skill-row'),
        dialogueBox: document.getElementById('dialogueBox'),
        dialoguePnjName: document.getElementById('dialoguePnjName'),
        dialogueText: document.getElementById('dialogueText'),
        dialogueOptions: document.getElementById('dialogueOptions'),
    };

    let game = {};
    let currentSkin = 0;
    let gameSettings = {
        renderDistance: config.renderDistance, zoom: config.zoom, showParticles: config.showParticles,
        weatherEffects: config.weatherEffects, dynamicLighting: config.dynamicLighting, soundVolume: config.soundVolume
    };
    let assets = {};
    let worldAnimator;
    let timeSystem;
    let debugMode = false;
    let fps = 0;
    let lastFrame = performance.now();
    let cameraShake = { intensity: 0, duration: 0 };
    let stars = [];
    const defaultGravity = config.physics.gravity;

    // --- NIVEAUX DES COUCHES DU MONDE ---
    const PARADISE_LEVEL_Y = Math.floor(config.worldHeight * 0.1);
    const SPACE_LEVEL_Y = Math.floor(config.worldHeight * 0.2);
    const SURFACE_LEVEL_Y = Math.floor(config.worldHeight * 0.3);
    const UNDERGROUND_START_Y = SURFACE_LEVEL_Y + (20 * config.tileSize);
    const CORE_START_Y = Math.floor(config.worldHeight * 0.6);
    const NUCLEUS_START_Y = Math.floor(config.worldHeight * 0.8);
    const HELL_START_Y = Math.floor(config.worldHeight * 0.9);

    const BLOCK_DATA = { /* ... */ };

    function handleMining(game, keys, mouse) { /* ... */ }
    
    function setupMenus(_assets) {
        assets = _assets;
        if (!ui.mainMenu) { initGame(); return; }
        document.body.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) { handleMenuAction(action); return; }
            const inc = e.target.dataset.inc;
            if (inc) { increaseSkill(inc); }
        });
        // ... (le reste de la configuration des menus est inchangé)
    }

    function handleMenuAction(action) {
        switch(action) {
            case 'start': initGame(); break;
            case 'options': showMenu(ui.optionsMenu); break;
            case 'backToMain': showMenu(ui.mainMenu); break;
            case 'closeMenu': toggleMenu(false, 'controls'); break;
            case 'closeOptions': toggleMenu(false, 'options'); break;
            case 'closeInventory': toggleInventoryMenu(); break;
            case 'closeChest': ui.chestMenu.classList.remove('active'); game.paused = false; break;
            case 'closeSkills': toggleSkillsMenu(); break;
            case 'closeCalendar': toggleCalendarMenu(); break;
            case 'closeDialogue': closeDialogue(); break; // Nouvelle action
        }
    }

    function initGame() {
        try {
            if (ui.gameTitle) ui.gameTitle.style.display = 'none';
            game = {
                player: null, camera: { x: 0, y: 0 }, tileMap: [], enemies: [], animals: [], pnjs: [],
                particles: [], fallingBlocks: [], collectibles: [], decorations: [], coins: [], bonuses: [],
                checkpoints: [], chests: [], lives: config.player.maxLives, over: false, paused: false,
                config: config, settings: gameSettings, sound: sound, propagateTreeCollapse: propagateTreeCollapse,
                miningEffect: null,
                playerBiome: 'surface',
                lavaDamageTimer: 0,
                interactingPNJ: null, // NOUVEAU: Suivre le PNJ avec qui on interagit
                createParticles: (x, y, count, color, options) => createParticles(x, y, count, color, options),
                startFallingBlock: (x, y, type) => startFallingBlock(x, y, type),
                checkBlockSupport: (x, y) => checkBlockSupport(x, y),
                loseLife: () => loseLife(), addXP: (amount) => addXP(amount),
                showLevelPopup: (lvl) => showLevelPopup(lvl),
            };
            
            generateLevel(game, config, {});
            const spawnPoint = findSpawnPoint();
            game.player = new Player(spawnPoint.x, spawnPoint.y, config, sound);
            game.player.survivalItems = randomItem(5);
            game.chests.forEach(ch => { ch.items = randomItem(3); });
            worldAnimator = new WorldAnimator(config, assets);
            timeSystem = new TimeSystem();
            updateCamera(true);
            sound.stopMusic();
            sound.startAmbient('surface');
            createStars(200);

            if(ui.mainMenu) {
                [ui.mainMenu, ui.optionsMenu].forEach(m => m?.classList.remove('active'));
                ui.hud?.classList.add('active');
            }
            createToolbar();
        } catch (error) { logger.error(`Erreur init: ${error.message}`); }
    }

    function spawnMonsters() { /* ... */ }
    function spawnAnimals() { /* ... */ }

    function spawnPNJ() {
        if (!game || game.pnjs.length > 2 || game.playerBiome !== 'surface') return; // Limiter à 3 PNJ
        if (Math.random() < 0.005) { // Chance d'apparition
            const pnjData = generatePNJ();
            const { tileSize } = config;
            const spawnX = game.player.x + (Math.random() - 0.5) * (ui.canvas.clientWidth / gameSettings.zoom);
            const spawnTileX = Math.floor(spawnX / tileSize);
            for (let y = SURFACE_LEVEL_Y; y < UNDERGROUND_START_Y; y++) {
                if (game.tileMap[y+1]?.[spawnTileX] > TILE.AIR && game.tileMap[y]?.[spawnTileX] === TILE.AIR) {
                    const newPNJ = new PNJ(spawnTileX * tileSize, y * tileSize, config, pnjData);
                    game.pnjs.push(newPNJ);
                    return;
                }
            }
        }
    }

    function getBiomeAt(y) { /* ... */ }
    function updatePlayerBiome() { /* ... */ }
    function updateBiomePhysics(game) { /* ... */ }
    function handleBiomeDamage(game) { /* ... */ }
    
    // --- NOUVEAU: GESTION DE L'INTERACTION AVEC LES PNJ ---
    function handlePNJInteraction(keys) {
        if (!keys.action || game.interactingPNJ) return; // 'E' pour interagir, ne pas interagir si déjà en dialogue
        
        const { player, pnjs } = game;
        for (const pnj of pnjs) {
            const dist = Math.hypot(player.x - pnj.x, player.y - pnj.y);
            if (dist < config.tileSize * 2) { // Si le joueur est assez proche
                startDialogue(pnj);
                break;
            }
        }
    }

    function startDialogue(pnj) {
        game.paused = true;
        game.interactingPNJ = pnj;
        
        ui.dialoguePnjName.textContent = pnj.data.name;
        ui.dialogueText.textContent = pnj.data.quest.description;
        
        ui.dialogueOptions.innerHTML = `
            <button data-action="acceptQuest">Accepter la quête</button>
            <button data-action="closeDialogue">Au revoir</button>
        `;
        
        ui.dialogueBox.classList.add('active');
    }

    function closeDialogue() {
        game.paused = false;
        game.interactingPNJ = null;
        ui.dialogueBox.classList.remove('active');
    }

    function update(keys, mouse) {
        logger.update();
        const now = performance.now();
        fps = Math.round(1000 / Math.max(16, now - lastFrame));
        lastFrame = now;
        if (!game.player || game.over || game.paused) {
            if (ui.calendarMenu?.classList.contains('active')) {
                updateCalendarUI(timeSystem, { date: ui.calendarDate, time: ui.calendarTime, stage: ui.calendarStage });
            }
            return;
        }
        try {
            updatePlayerBiome();
            updateBiomePhysics(game);

            if (timeSystem) timeSystem.update();
            sound.update();
            game.player.update(keys, mouse, game);
            game.enemies.forEach(e => e.update(game));
            game.enemies = game.enemies.filter(e => !e.isDead);
            game.animals.forEach(a => a.update(game));
            game.pnjs.forEach(p => p.update(game));
            updateParticles();
            updateFallingBlocks();
            updateCollectibles();
            handleMining(game, keys, mouse);
            handleBiomeDamage(game);
            handlePNJInteraction(keys); // NOUVEAU
            updateCamera(false);
            if (worldAnimator) worldAnimator.update(game.camera, ui.canvas, gameSettings.zoom);
            
            spawnMonsters();
            spawnAnimals();
            spawnPNJ();

            // Réinitialiser la touche d'action après traitement pour éviter les actions répétées
            if (keys.action) keys.action = false;

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
            
            let shakeX = 0, shakeY = 0;
            if (cameraShake.duration > 0) {
                shakeX = (Math.random() - 0.5) * cameraShake.intensity;
                shakeY = (Math.random() - 0.5) * cameraShake.intensity;
                cameraShake.duration--;
            } else { cameraShake.intensity = 0; }

            ctx.scale(gameSettings.zoom, gameSettings.zoom);
            ctx.translate(-Math.round(game.camera.x + shakeX), -Math.round(game.camera.y + shakeY));

            if (worldAnimator) worldAnimator.draw(ctx);
            drawTileMap(ctx, assets);
            drawDecorations(ctx, assets);
            drawFallingBlocks(ctx, assets);
            drawCollectibles(ctx, assets);
            drawChests(ctx, assets);
            
            game.animals.forEach(a => a.draw(ctx));
            game.enemies.forEach(e => e.draw(ctx, assets));
            game.pnjs.forEach(p => p.draw(ctx));
            game.player.draw(ctx, assets, `player${currentSkin + 1}`);
            if (debugMode) {
                ctx.save();
                ctx.strokeStyle = 'red';
                const hb = game.player.getHitbox();
                ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
                ctx.strokeStyle = 'yellow';
                game.enemies.forEach(en => ctx.strokeRect(en.x, en.y, en.w, en.h));
                ctx.strokeStyle = 'cyan';
                game.animals.forEach(an => ctx.strokeRect(an.x, an.y, an.w, an.h));
                ctx.strokeStyle = 'magenta';
                game.pnjs.forEach(p => ctx.strokeRect(p.x, p.y, p.w, p.h));
                ctx.restore();
            }
            if (gameSettings.showParticles) drawParticles(ctx);
            drawMiningEffect(ctx);
            ctx.restore();

            updateHUD();
            updateToolbarUI();
            updateDebug();
        }

        logger.draw(ctx, canvas);
    }

    function triggerCameraShake(intensity, duration) { /* ... */ }
    function toggleMenu(show, menuType) { /* ... */ }
    function showMenu(menuToShow) { /* ... */ }
    function findSpawnPoint() { /* ... */ }
    function updateCamera(isInstant = false) { /* ... */ }
    function drawTileMap(ctx, assets) { /* ... */ }
    function createToolbar() { /* ... */ }
    function updateToolbarUI() { /* ... */ }
    function createStars(count) { /* ... */ }
    function drawSky(ctx) { /* ... */ }
    function updateHUD() { /* ... */ }
    function updateDebug() { /* ... */ }
    function loseLife() { /* ... */ }
    function endGame(win) { /* ... */ }
    function updateParticles() { /* ... */ }
    function showLevelPopup(level) { /* ... */ }
    function addXP(amount) { /* ... */ }
    function drawParticles(ctx) { /* ... */ }
    function createParticles(x, y, count, color, options = {}) { /* ... */ }
    function startFallingBlock(x, y, tileType) { /* ... */ }
    function checkBlockSupport(x, y) { /* ... */ }
    function updateFallingBlocks() { /* ... */ }
    function drawFallingBlocks(ctx, assets) { /* ... */ }
    function updateCollectibles() { /* ... */ }
    function drawCollectibles(ctx, assets) { /* ... */ }
    function drawChests(ctx, assets) { /* ... */ }
    function drawDecorations(ctx, assets) { /* ... */ }
    function drawMiningEffect(ctx) { /* ... */ }
    function propagateTreeCollapse(startX, startY) { /* ... */ }
    function openChestMenu(chest) { /* ... */ }
    function increaseSkill(skill) { /* ... */ }
    function toggleSkillsMenu() { /* ... */ }
    function updateSkillsUI() { /* ... */ }
    function toggleInventoryMenu() { /* ... */ }
    function toggleCalendarMenu() { /* ... */ }

    const gameLogic = {
        init: setupMenus, update: update, draw: draw, isPaused: () => game.paused,
        toggleMenu: (menu) => {
            if (menu === 'options') toggleMenu(!game.paused, 'options');
            else if (menu === 'controls') toggleMenu(!game.paused, 'controls');
        },
        selectTool: (index) => { if (game.player && index >= 0 && index < game.player.tools.length) { game.player.selectedToolIndex = index; } },
        cycleTool: (dir) => { if (game.player) { const len = game.player.tools.length; game.player.selectedToolIndex = (game.player.selectedToolIndex + dir + len) % len; } },
        toggleInventory: () => toggleInventoryMenu(), toggleSkills: () => toggleSkillsMenu(),
        toggleCalendar: () => toggleCalendarMenu(), openChest: (ch) => openChestMenu(ch),
        toggleDebug: () => { debugMode = !debugMode; updateDebug(); },
        showError: (error) => { logger.error(error.message); if(ui.mainMenu) ui.mainMenu.innerHTML = `<h2>Erreur.</h2><p style="font-size:0.5em;">${error}</p>`; }
    };
    
    const engine = new GameEngine(canvas, config);
    engine.start(gameLogic);
});
