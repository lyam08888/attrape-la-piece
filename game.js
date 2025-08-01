import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { generateLevel, TILE, WORLD_LAYERS } from './world.js';
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
            
            game.player.quests.forEach(quest => {
                if (quest.status === 'active' && quest.type === 'hunt') {
                    quest.objective.currentAmount++;
                }
            });

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
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
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
        questLogMenu: document.getElementById('questLogMenu'),
        questList: document.getElementById('questList'),
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

    const TOOL_DATA = {
        'hand':          { power: 1, type: 'hand', tier: 0 },
        'wood_axe':      { power: 2, type: 'axe', tier: 1 },
        'stone_axe':     { power: 3, type: 'axe', tier: 2 },
        'iron_axe':      { power: 5, type: 'axe', tier: 3 },
        'wood_shovel':   { power: 2, type: 'shovel', tier: 1 },
        'stone_shovel':  { power: 3, type: 'shovel', tier: 2 },
        'iron_shovel':   { power: 5, type: 'shovel', tier: 3 },
        'wood_pickaxe':  { power: 2, type: 'pickaxe', tier: 1 },
        'stone_pickaxe': { power: 4, type: 'pickaxe', tier: 2 },
        'iron_pickaxe':  { power: 6, type: 'pickaxe', tier: 3 },
    };

    const BLOCK_DATA = {
        [TILE.GRASS]:  { resistance: 25, tool: 'shovel', requiredTier: 0, drops: TILE.DIRT },
        [TILE.DIRT]:   { resistance: 20, tool: 'shovel', requiredTier: 0, drops: TILE.DIRT },
        [TILE.SAND]:   { resistance: 20, tool: 'shovel', requiredTier: 0, drops: TILE.SAND },
        [TILE.WOOD]:   { resistance: 80, tool: 'axe', requiredTier: 0, drops: TILE.WOOD },
        [TILE.OAK_WOOD]: { resistance: 80, tool: 'axe', requiredTier: 0, drops: TILE.OAK_WOOD },
        [TILE.LEAVES]: { resistance: 10, tool: 'any', requiredTier: 0, drops: null },
        [TILE.OAK_LEAVES]: { resistance: 10, tool: 'any', requiredTier: 0, drops: null },
        [TILE.STONE]:  { resistance: 200, tool: 'pickaxe', requiredTier: 1, drops: TILE.STONE },
        [TILE.GRANITE]: { resistance: 220, tool: 'pickaxe', requiredTier: 1, drops: TILE.GRANITE },
        [TILE.DIORITE]: { resistance: 220, tool: 'pickaxe', requiredTier: 1, drops: TILE.DIORITE },
        [TILE.ANDESITE]: { resistance: 220, tool: 'pickaxe', requiredTier: 1, drops: TILE.ANDESITE },
        [TILE.COAL]:   { resistance: 250, tool: 'pickaxe', requiredTier: 1, drops: TILE.COAL },
        [TILE.IRON]:   { resistance: 400, tool: 'pickaxe', requiredTier: 2, drops: TILE.IRON },
        [TILE.LAPIS]:  { resistance: 380, tool: 'pickaxe', requiredTier: 2, drops: TILE.LAPIS },
        [TILE.GOLD]:   { resistance: 600, tool: 'pickaxe', requiredTier: 3, drops: TILE.GOLD },
        [TILE.DIAMOND]:{ resistance: 800, tool: 'pickaxe', requiredTier: 3, drops: TILE.DIAMOND },
        [TILE.CLOUD]:  { resistance: 5, tool: 'any', requiredTier: 0, drops: null },
        [TILE.HEAVENLY_STONE]: { resistance: 500, tool: 'pickaxe', requiredTier: 3, drops: TILE.HEAVENLY_STONE },
        [TILE.MOON_ROCK]: { resistance: 300, tool: 'pickaxe', requiredTier: 2, drops: TILE.MOON_ROCK },
        [TILE.CRYSTAL]: { resistance: 700, tool: 'pickaxe', requiredTier: 3, drops: TILE.CRYSTAL },
        [TILE.AMETHYST]: { resistance: 750, tool: 'pickaxe', requiredTier: 3, drops: TILE.AMETHYST },
        [TILE.HELLSTONE]: { resistance: 450, tool: 'pickaxe', requiredTier: 3, drops: TILE.HELLSTONE },
        [TILE.SCORCHED_STONE]: { resistance: 500, tool: 'pickaxe', requiredTier: 3, drops: TILE.SCORCHED_STONE },
        [TILE.SOUL_SAND]: { resistance: 30, tool: 'shovel', requiredTier: 0, drops: TILE.SOUL_SAND },
        [TILE.OBSIDIAN]: { resistance: 1200, tool: 'pickaxe', requiredTier: 4, drops: TILE.OBSIDIAN },
        [TILE.BEDROCK]: { resistance: 99999, tool: 'none', requiredTier: 99, drops: null },
    };

    function handleMining(game, keys, mouse) {
        const { tileSize } = game.config;
        const { player } = game;
        const mouseWorldX = mouse.x / game.settings.zoom + game.camera.x;
        const mouseWorldY = mouse.y / game.settings.zoom + game.camera.y;
        const tileX = Math.floor(mouseWorldX / tileSize);
        const tileY = Math.floor(mouseWorldY / tileSize);
        const dist = Math.hypot((player.x + player.w / 2) - (tileX * tileSize + tileSize / 2), (player.y + player.h / 2) - (tileY * tileSize + tileSize / 2));
        if (dist > tileSize * 5) {
            game.miningEffect = null;
            return;
        }
        const tileType = game.tileMap[tileY]?.[tileX];
        const isMining = mouse.left;
        if (!isMining || !tileType || tileType === TILE.AIR) {
            game.miningEffect = null;
            return;
        }
        if (!game.miningEffect || game.miningEffect.x !== tileX || game.miningEffect.y !== tileY) {
            const blockInfo = BLOCK_DATA[tileType] || { resistance: 1000, tool: 'none', requiredTier: 99 };
            game.miningEffect = {
                x: tileX, y: tileY, progress: 0, resistance: blockInfo.resistance, blockInfo: blockInfo,
            };
        }
        const miningData = game.miningEffect;
        const blockInfo = miningData.blockInfo;
        const selectedToolName = player.tools[player.selectedToolIndex] || 'hand';
        const toolInfo = TOOL_DATA[selectedToolName] || TOOL_DATA['hand'];
        if (toolInfo.tier < blockInfo.requiredTier) {
            sound.play('hit_fail', { volume: 0.4 });
            return;
        }
        let damage = 1;
        if (blockInfo.tool === 'any' || blockInfo.tool === toolInfo.type) {
            damage = toolInfo.power;
        }
        damage += Math.floor(player.attributes.strength / 5);
        if (Math.random() < 0.05) {
            damage *= 2;
            createParticles(tileX * tileSize + tileSize/2, tileY * tileSize + tileSize/2, 5, '#FFD700');
        }
        miningData.progress += damage;
        sound.play('hit_block', { volume: 0.3, rate: 0.8 + (miningData.progress / miningData.resistance) * 1.2 });
        if (miningData.progress >= miningData.resistance) {
            if (blockInfo.drops !== null) {
                game.collectibles.push({
                    x: tileX * tileSize, y: tileY * tileSize,
                    w: tileSize, h: tileSize, vy: -2, tileType: blockInfo.drops
                });
            }
            game.tileMap[tileY][tileX] = TILE.AIR;
            sound.play('break_block', { volume: 0.6 });
            createParticles(tileX * tileSize + tileSize / 2, tileY * tileSize + tileSize / 2, 15, '#8B4513');
            addXP(10);
            triggerCameraShake(4, 15);
            game.miningEffect = null;
            checkBlockSupport(tileX, tileY - 1);
            checkBlockSupport(tileX - 1, tileY);
            checkBlockSupport(tileX + 1, tileY);
        }
    }
    
    function setupMenus(_assets) {
        assets = _assets;
        if (!ui.mainMenu) { initGame(); return; }
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
            ui.particlesCheckbox.onchange = (e) => { gameSettings.showParticles = e.target.checked; };
        }
        if (ui.weatherCheckbox) {
            ui.weatherCheckbox.checked = gameSettings.weatherEffects;
            ui.weatherCheckbox.onchange = (e) => { gameSettings.weatherEffects = e.target.checked; };
        }
        if (ui.lightingCheckbox) {
            ui.lightingCheckbox.checked = gameSettings.dynamicLighting;
            ui.lightingCheckbox.onchange = (e) => { gameSettings.dynamicLighting = e.target.checked; };
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
            case 'options': showMenu(ui.optionsMenu); break;
            case 'closeOptions': toggleMenu(false, 'options'); break;
            case 'closeInventory': toggleInventoryMenu(); break;
            case 'closeChest': ui.chestMenu.classList.remove('active'); game.paused = false; break;
            case 'closeSkills': toggleSkillsMenu(); break;
            case 'closeCalendar': toggleCalendarMenu(); break;
            case 'closeDialogue': closeDialogue(); break;
            case 'acceptQuest': acceptQuest(); break;
            case 'completeQuest': completeQuest(); break;
            case 'closeQuestLog': toggleQuestLog(); break;
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
                interactingPNJ: null,
                worldLayers: {},
                createParticles: (x, y, count, color, options) => createParticles(x, y, count, color, options),
                startFallingBlock: (x, y, type) => startFallingBlock(x, y, type),
                checkBlockSupport: (x, y) => checkBlockSupport(x, y),
                loseLife: () => loseLife(), addXP: (amount) => addXP(amount),
                showLevelPopup: (lvl) => showLevelPopup(lvl),
            };
            
            generateLevel(game, config, {});
            game.worldLayers = WORLD_LAYERS;

            const CHEST_TYPE = { WOOD: 0, METAL: 1, GOLD: 2, DIAMOND: 3 };
            game.chests.forEach(chest => {
                const biome = getBiomeAt(chest.y);
                switch(biome) {
                    case 'surface':
                    case 'underground':
                        chest.type = Math.random() < 0.7 ? CHEST_TYPE.WOOD : CHEST_TYPE.METAL;
                        break;
                    case 'core':
                        chest.type = CHEST_TYPE.GOLD;
                        break;
                    case 'hell':
                        chest.type = CHEST_TYPE.DIAMOND;
                        break;
                    default:
                        chest.type = CHEST_TYPE.WOOD;
                }
            });

            const spawnPoint = findSpawnPoint();
            game.player = new Player(spawnPoint.x, spawnPoint.y, config, sound);
            game.player.quests = [];
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

    function spawnMonsters() {
        if (!game || !game.player) return;
        const biome = game.playerBiome;
        const MAX_MONSTERS = { paradise: 3, space: 1, surface: 5, underground: 10, core: 8, nucleus: 0, hell: 12 }[biome];
        if (game.enemies.length >= MAX_MONSTERS) return;

        if (Math.random() < 0.02) {
            const { tileSize } = config;
            const screenLeftEdge = game.camera.x - tileSize * 5;
            const screenRightEdge = game.camera.x + canvas.clientWidth / gameSettings.zoom + tileSize * 5;
            const spawnX = Math.random() < 0.5 ? screenLeftEdge : screenRightEdge;
            const spawnTileX = Math.floor(spawnX / tileSize);
            for (let i = 0; i < 10; i++) {
                const y = game.player.y + (Math.random() - 0.5) * 10 * tileSize;
                const spawnTileY = Math.floor(y / tileSize);

                const spawnBiome = getBiomeAt(y);
                if (spawnBiome !== biome) continue;

                if (game.tileMap[spawnTileY+1]?.[spawnTileX] > TILE.AIR && game.tileMap[spawnTileY]?.[spawnTileX] === TILE.AIR) {
                    const monsterData = generateMonster({ biome: biome });
                    const newMonster = new Monster(spawnTileX * tileSize, spawnTileY * tileSize, config, monsterData);
                    game.enemies.push(newMonster);
                    return;
                }
            }
        }
    }
    
    function spawnAnimals() {
        if (!game || !game.player) return;
        const biome = game.playerBiome;
        const MAX_ANIMALS = { paradise: 5, surface: 8, nucleus: 10, space: 0, underground: 0, core: 0, hell: 0 }[biome];
        if (game.animals.length >= MAX_ANIMALS || MAX_ANIMALS === 0) return;

        if (Math.random() < 0.015) {
            const animalData = generateAnimal({ biome: biome });
            const { tileSize } = config;
            const spawnX = game.player.x + (Math.random() - 0.5) * (canvas.clientWidth / gameSettings.zoom);
            const spawnY = game.player.y + (Math.random() - 0.5) * (canvas.clientHeight / gameSettings.zoom);
            
            if (animalData.movement === 'fly' || animalData.movement === 'swim') {
                const newAnimal = new Animal(spawnX, spawnY, config, animalData);
                game.animals.push(newAnimal);
            } else {
                const spawnTileX = Math.floor(spawnX / tileSize);
                const spawnTileY = Math.floor(spawnY / tileSize);
                if (game.tileMap[spawnTileY+1]?.[spawnTileX] > TILE.AIR && game.tileMap[spawnTileY]?.[spawnTileX] === TILE.AIR) {
                    const newAnimal = new Animal(spawnTileX * tileSize, spawnTileY * tileSize, config, animalData);
                    game.animals.push(newAnimal);
                }
            }
        }
    }

    function spawnPNJ() {
        if (!game || game.pnjs.length > 2 || game.playerBiome !== 'surface') return;
        if (Math.random() < 0.005) {
            const pnjData = generatePNJ();
            const { tileSize } = config;
            const spawnX = game.player.x + (Math.random() - 0.5) * (canvas.clientWidth / gameSettings.zoom);
            const spawnTileX = Math.floor(spawnX / tileSize);
            for (let y = game.worldLayers.SURFACE_LEVEL; y < game.worldLayers.UNDERGROUND_START_Y; y++) {
                if (game.tileMap[y+1]?.[spawnTileX] > TILE.AIR && game.tileMap[y]?.[spawnTileX] === TILE.AIR) {
                    const newPNJ = new PNJ(spawnTileX * tileSize, y * tileSize, config, pnjData);
                    game.pnjs.push(newPNJ);
                    return;
                }
            }
        }
    }

    function getBiomeAt(y) {
        const yInTiles = y / config.tileSize;
        if (yInTiles < game.worldLayers.PARADISE_END_Y) return 'paradise';
        if (yInTiles < game.worldLayers.SPACE_END_Y) return 'space';
        if (y > game.worldLayers.HELL_START_Y * config.tileSize) return 'hell';
        if (y > game.worldLayers.NUCLEUS_START_Y * config.tileSize) return 'nucleus';
        if (y > game.worldLayers.CORE_START_Y * config.tileSize) return 'core';
        if (y > game.worldLayers.SURFACE_LEVEL * config.tileSize + 20 * config.tileSize) return 'underground';
        return 'surface';
    }
    
    function updatePlayerBiome() {
        if (!game.player) return;
        const currentBiome = getBiomeAt(game.player.y);
        if (currentBiome !== game.playerBiome) {
            game.playerBiome = currentBiome;
            sound.startAmbient(currentBiome);
        }
    }

    function updateBiomePhysics(game) {
        const player = game.player;
        if (!player) return;

        game.config.physics.gravity = defaultGravity;
        player.isSwimming = false;

        switch(game.playerBiome) {
            case 'space':
                game.config.physics.gravity = defaultGravity * 0.15;
                break;
            case 'nucleus':
                game.config.physics.gravity = -0.05;
                player.isSwimming = true;
                break;
        }
    }

    function handleBiomeDamage(game) {
        if (!game.player || game.over) return;
        const { player, tileMap, config } = game;
        const { tileSize } = config;
        
        const playerTileX = Math.floor((player.x + player.w / 2) / tileSize);
        const playerTileY = Math.floor((player.y + player.h) / tileSize);
        const tileBelow = tileMap[playerTileY]?.[playerTileX];

        if (tileBelow === TILE.LAVA) {
            game.lavaDamageTimer--;
            if (game.lavaDamageTimer <= 0) {
                loseLife();
                game.lavaDamageTimer = 60;
            }
        } else {
            game.lavaDamageTimer = 60;
        }
    }

    function startDialogue(pnj) {
        game.paused = true;
        game.interactingPNJ = pnj;
        
        ui.dialoguePnjName.textContent = pnj.data.name;
        
        const quest = pnj.data.quest;
        const playerQuest = game.player.quests.find(q => q.id === quest.id);

        if (playerQuest) {
            if (playerQuest.objective.currentAmount >= playerQuest.objective.amount) {
                ui.dialogueText.textContent = quest.dialogues.complete;
                ui.dialogueOptions.innerHTML = `<button data-action="completeQuest">Terminer la quête</button>`;
            } else {
                ui.dialogueText.textContent = quest.dialogues.incomplete;
                ui.dialogueOptions.innerHTML = `<button data-action="closeDialogue">Je m'en occupe</button>`;
            }
        } else {
            ui.dialogueText.textContent = quest.dialogues.offer;
            ui.dialogueOptions.innerHTML = `
                <button data-action="acceptQuest">Accepter</button>
                <button data-action="closeDialogue">Refuser</button>
            `;
        }
        
        ui.dialogueBox.classList.add('active');
    }

    function closeDialogue() {
        game.paused = false;
        game.interactingPNJ = null;
        ui.dialogueBox.classList.remove('active');
    }

    function acceptQuest() {
        const quest = game.interactingPNJ.data.quest;
        quest.status = 'active';
        game.player.quests.push(quest);
        closeDialogue();
        updateQuestLogUI();
    }

    function completeQuest() {
        const pnj = game.interactingPNJ;
        const quest = pnj.data.quest;
        
        addXP(quest.reward.xp);
        console.log(`Récompense: ${quest.reward.item.name}`);

        quest.status = 'complete';
        pnj.data.quest = generateQuest(pnj.data.archetype);

        closeDialogue();
        updateQuestLogUI();
    }

    function toggleQuestLog() {
        if (!ui.questLogMenu) return;
        game.paused = !game.paused;
        ui.questLogMenu.classList.toggle('active');
        if (ui.questLogMenu.classList.contains('active')) {
            updateQuestLogUI();
        }
    }

    function updateQuestLogUI() {
        if (!ui.questList) return;
        ui.questList.innerHTML = '';
        const activeQuests = game.player.quests.filter(q => q.status === 'active');
        if (activeQuests.length === 0) {
            ui.questList.innerHTML = '<div class="quest-item">Aucune quête active.</div>';
            return;
        }

        activeQuests.forEach(quest => {
            const questItem = document.createElement('div');
            questItem.className = 'quest-item';
            questItem.innerHTML = `
                <div class="quest-title">${quest.title}</div>
                <div class="quest-progress">${quest.objective.currentAmount} / ${quest.objective.amount}</div>
            `;
            ui.questList.appendChild(questItem);
        });
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
            updateCamera(false);
            if (worldAnimator) worldAnimator.update(game.camera, ui.canvas, gameSettings.zoom);
            
            spawnMonsters();
            spawnAnimals();
            spawnPNJ();

        } catch (error) {
            logger.error(`Erreur update: ${error.message}`);
            game.over = true;
        }
    }

    function draw(ctx, _assets) {
        assets = _assets;
        
        ctx.save();
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        
        ctx.scale(gameSettings.zoom, gameSettings.zoom);
        
        drawSky(ctx);
        
        if (game.player) {
            ctx.save();
            
            let shakeX = 0, shakeY = 0;
            if (cameraShake.duration > 0) {
                shakeX = (Math.random() - 0.5) * cameraShake.intensity;
                shakeY = (Math.random() - 0.5) * cameraShake.intensity;
                cameraShake.duration--;
            } else { cameraShake.intensity = 0; }

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
                // ... (code de debug)
            }
            if (gameSettings.showParticles) drawParticles(ctx);
            drawMiningEffect(ctx);
            ctx.restore();
        }
        ctx.restore();

        updateHUD();
        updateToolbarUI();
        updateDebug();
        logger.draw(ctx, canvas);
    }

    function triggerCameraShake(intensity, duration) {
        cameraShake.intensity = intensity;
        cameraShake.duration = duration;
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
        [ui.mainMenu, ui.optionsMenu, ui.controlsMenu].forEach(m => m?.classList.remove('active'));
        menuToShow?.classList.add('active');
    }

    function findSpawnPoint() {
        const { tileSize, worldWidth } = config;
        const worldWidthInTiles = Math.floor(worldWidth / tileSize);
        const spawnX = Math.floor(worldWidthInTiles / 2);
        const playerTiles = Math.ceil(config.player.height / tileSize);
        const extraOffset = 10;
        for (let y = 0; y < game.tileMap.length; y++) {
            if (game.tileMap[y] && game.tileMap[y][spawnX] > 0) {
                const offset = playerTiles + 1 + extraOffset;
                return { x: spawnX * tileSize, y: Math.max(0, (y - offset) * tileSize) };
            }
        }
        return { x: worldWidth / 2, y: 100 };
    }
    
    function updateCamera(isInstant = false) {
        if (!game.player) return;
        const targetX = (game.player.x + game.player.w / 2) - (canvas.clientWidth / gameSettings.zoom) / 2;
        const targetY = (game.player.y + game.player.h / 2) - (canvas.clientHeight / gameSettings.zoom) / 2;
        if (isInstant) {
            game.camera.x = targetX;
            game.camera.y = targetY;
        } else {
            game.camera.x += (targetX - game.camera.x) * 0.1;
            game.camera.y += (targetY - game.camera.y) * 0.1;
        }
        game.camera.x = Math.max(0, Math.min(game.camera.x, config.worldWidth - (canvas.clientWidth / gameSettings.zoom)));
        game.camera.y = Math.max(0, Math.min(game.camera.y, config.worldHeight - (canvas.clientHeight / gameSettings.zoom)));
    }

    function drawTileMap(ctx, assets) {
        const { tileSize, chunkSize } = config;
        const playerChunkX = Math.floor(game.player.x / (chunkSize * tileSize));
        const playerChunkY = Math.floor(game.player.y / (chunkSize * tileSize));
        const startChunkX = Math.max(0, playerChunkX - gameSettings.renderDistance);
        const endChunkX = playerChunkX + gameSettings.renderDistance;
        const startChunkY = Math.max(0, playerChunkY - gameSettings.renderDistance);
        const endChunkY = playerChunkY + gameSettings.renderDistance;
        const TILE_ASSETS = {
            [TILE.GRASS]: assets.tile_grass, [TILE.DIRT]: assets.tile_dirt, [TILE.STONE]: assets.tile_stone,
            [TILE.WOOD]: assets.tile_wood, [TILE.LEAVES]: assets.tile_leaves, [TILE.COAL]: assets.tile_coal,
            [TILE.IRON]: assets.tile_iron, [TILE.WATER]: assets.tile_water, [TILE.SAND]: assets.tile_sand,
            [TILE.OAK_WOOD]: assets.tile_oak_wood, [TILE.OAK_LEAVES]: assets.tile_oak_leaves,
            [TILE.FLOWER_RED]: assets.tile_flower_red, [TILE.FLOWER_YELLOW]: assets.tile_flower_yellow,
            [TILE.GOLD]: assets.tile_gold, [TILE.DIAMOND]: assets.tile_diamond, [TILE.LAPIS]: assets.tile_lapis,
            [TILE.GRANITE]: assets.tile_granite, [TILE.DIORITE]: assets.tile_diorite, [TILE.ANDESITE]: assets.tile_andesite,
            [TILE.CLOUD]: assets.tile_cloud, [TILE.HEAVENLY_STONE]: assets.tile_heavenly_stone, [TILE.MOON_ROCK]: assets.tile_moon_rock,
            [TILE.CRYSTAL]: assets.tile_crystal, [TILE.AMETHYST]: assets.tile_amethyst, [TILE.GLOW_MUSHROOM]: assets.tile_glow_mushroom,
            [TILE.HELLSTONE]: assets.tile_hellstone, [TILE.SOUL_SAND]: assets.tile_soul_sand, [TILE.SCORCHED_STONE]: assets.tile_scorched_stone,
            [TILE.OBSIDIAN]: assets.tile_obsidian, [TILE.LAVA]: assets.tile_lava,
        };
        for (let cy = startChunkY; cy <= endChunkY; cy++) {
            for (let cx = startChunkX; cx <= endChunkX; cx++) {
                for (let y = 0; y < chunkSize; y++) {
                    for (let x = 0; x < chunkSize; x++) {
                        const tileX = cx * chunkSize + x;
                        const tileY = cy * chunkSize + y;
                        const tileType = game.tileMap[tileY]?.[tileX];
                        if (tileType > 0) {
                            const asset = TILE_ASSETS[tileType];
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
            slot.onclick = () => {
                game.player.selectedToolIndex = index;
                updateToolbarUI();
            };
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

    function createStars(count) {
        stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.5
            });
        }
    }

    function drawSky(ctx) {
        switch (game.playerBiome) {
            case 'paradise':
                const paradiseGrad = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight / gameSettings.zoom);
                paradiseGrad.addColorStop(0, '#FFD700');
                paradiseGrad.addColorStop(1, '#FFFFFF');
                ctx.fillStyle = paradiseGrad;
                ctx.fillRect(0, 0, canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
                break;
            case 'space':
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
                stars.forEach(star => {
                    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                    ctx.beginPath();
                    ctx.arc(star.x / gameSettings.zoom, star.y / gameSettings.zoom, star.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                break;
            case 'surface':
                if (!timeSystem) return;
                const [c1, c2] = timeSystem.getSkyGradient();
                const grad = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight / gameSettings.zoom);
                grad.addColorStop(0, c1); grad.addColorStop(1, c2);
                ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
                const sun = timeSystem.getSunPosition(canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
                ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(sun.x, sun.y, 40, 0, Math.PI * 2); ctx.fill();
                const moon = timeSystem.getMoonPosition(canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
                ctx.fillStyle = '#F0EAD6'; ctx.beginPath(); ctx.arc(moon.x, moon.y, 30, 0, Math.PI * 2); ctx.fill();
                break;
            case 'underground':
                ctx.fillStyle = '#252020';
                ctx.fillRect(0, 0, canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
                break;
            case 'core':
                const coreGrad = ctx.createRadialGradient(canvas.clientWidth / (2 * gameSettings.zoom), canvas.clientHeight / (2 * gameSettings.zoom), 50, canvas.clientWidth / (2 * gameSettings.zoom), canvas.clientHeight / (2 * gameSettings.zoom), canvas.clientWidth / gameSettings.zoom);
                coreGrad.addColorStop(0, '#4a004a');
                coreGrad.addColorStop(1, '#1a001a');
                ctx.fillStyle = coreGrad;
                ctx.fillRect(0, 0, canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
                break;
            case 'nucleus':
                const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight / gameSettings.zoom);
                oceanGrad.addColorStop(0, '#000030');
                oceanGrad.addColorStop(1, '#000010');
                ctx.fillStyle = oceanGrad;
                ctx.fillRect(0, 0, canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
                break;
            case 'hell':
                const hellGrad = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight / gameSettings.zoom);
                hellGrad.addColorStop(0, '#4d0000');
                hellGrad.addColorStop(1, '#1a0000');
                ctx.fillStyle = hellGrad;
                ctx.fillRect(0, 0, canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
                if (Math.random() < 0.5) {
                    createParticles(Math.random() * canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom, 1, 'orange', { speed: 1, gravity: -0.05 });
                }
                break;
        }
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
        if (ui.timeDisplay && timeSystem) {
            ui.timeDisplay.textContent = timeSystem.formatDateTime();
        }
    }

    function updateDebug() {
        if (!ui.debugOverlay) return;
        if (!debugMode) { ui.debugOverlay.style.display = 'none'; return; }
        ui.debugOverlay.style.display = 'block';
        const p = game.player || {x:0,y:0};
        ui.debugOverlay.innerHTML = `FPS: ${fps}<br>x:${Math.round(p.x)} y:${Math.round(p.y)}<br>Biome: ${game.playerBiome}`;
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
        sound.stopMusic();
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

    function startFallingBlock(x, y, tileType) {
        const { tileSize } = config;
        game.tileMap[y][x] = TILE.AIR;
        game.fallingBlocks.push({ x: x * tileSize, y: y * tileSize, vy: 0, tileType });
    }

    function checkBlockSupport(x, y) {
        if (y < 0) return;
        const tile = game.tileMap[y]?.[x];
        if (!tile || tile === TILE.AIR) return;
        const tileBelow = game.tileMap[y + 1]?.[x];
        if (tileBelow === TILE.AIR || tileBelow === undefined) {
            startFallingBlock(x, y, tile);
            if (game.checkBlockSupport) game.checkBlockSupport(x, y - 1);
        }
    }

    function updateFallingBlocks() {
        if (!game) return;
        const { tileSize, physics } = config;
        for (let i = game.fallingBlocks.length - 1; i >= 0; i--) {
            const block = game.fallingBlocks[i];
            block.vy += physics.gravity;
            if (physics.realistic) {
                if (block.vy > physics.maxFallSpeed) block.vy = physics.maxFallSpeed;
                block.vy *= physics.airResistance;
            }
            block.y += block.vy;
            const tileX = Math.floor((block.x + tileSize / 2) / tileSize);
            const tileY = Math.floor((block.y + tileSize) / tileSize);
            if (tileY >= game.tileMap.length) {
                game.fallingBlocks.splice(i, 1);
                continue;
            }
            if (game.tileMap[tileY]?.[tileX] > TILE.AIR) {
                block.y = tileY * tileSize - tileSize;
                block.vy *= -physics.blockBounce;
                if (Math.abs(block.vy) < 0.5) {
                    if (game.tileMap[tileY - 1]?.[tileX] === TILE.AIR) {
                        game.tileMap[tileY - 1][tileX] = block.tileType;
                        if (game.checkBlockSupport) game.checkBlockSupport(tileX, tileY - 2);
                    } else {
                        game.collectibles.push({
                            x: block.x, y: block.y, w: tileSize, h: tileSize, vy: -2, tileType: block.tileType
                        });
                    }
                    game.fallingBlocks.splice(i, 1);
                }
            }
        }
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
            const { x, y, progress, resistance } = game.miningEffect;
            const { tileSize } = config;
            const progressRatio = progress / resistance;
            const crackStage = Math.floor(progressRatio * 10);
            if (crackStage > 0) {
                const crackAsset = assets[`crack_${crackStage}`];
                if (crackAsset) {
                    ctx.globalAlpha = 0.7;
                    ctx.drawImage(crackAsset, x * tileSize, y * tileSize, tileSize, tileSize);
                    ctx.globalAlpha = 1.0;
                }
            }
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
                startFallingBlock(x, y, tile);
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

    function toggleCalendarMenu() {
        if (!ui.calendarMenu) return;
        if (ui.calendarMenu.classList.contains('active')) {
            ui.calendarMenu.classList.remove('active');
            game.paused = false;
        } else {
            updateCalendarUI(timeSystem, {
                date: ui.calendarDate,
                time: ui.calendarTime,
                stage: ui.calendarStage
            });
            ui.calendarMenu.classList.add('active');
            game.paused = true;
        }
    }

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
