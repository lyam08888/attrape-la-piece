// game.js - Le chef d'orchestre du jeu (Version complète et corrigée)

// Imports de tous les modules nécessaires pour faire fonctionner le jeu
import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { TILE, generateLevel } from './world.js';
import { PNJ } from './PNJ.js';
import { generatePNJ } from './generateurPNJ.js';
import { Slime, Frog, Golem } from './enemy.js';
import { updateMining } from './miningEngine.js';
import { ParticleSystem } from './fx.js';
import { WorldAnimator } from './worldAnimator.js';
import { TimeSystem, updateCalendarUI } from './timeSystem.js';
import { Logger } from './logger.js';
import { getItemIcon } from './itemIcons.js';

// --- Fonctions de chargement/sauvegarde de la configuration (de votre code original) ---
async function loadConfig() {
    const resp = await fetch('config.json');
    return resp.json();
}

async function loadOptions() {
    const stored = localStorage.getItem('gameOptions');
    if (stored) return JSON.parse(stored);
    const resp = await fetch('options.json');
    return resp.json();
}

function saveOptions(opts) {
    localStorage.setItem('gameOptions', JSON.stringify(opts));
}

document.addEventListener('DOMContentLoaded', async () => {
    // --- Initialisation de la configuration et de l'interface ---
    const config = await loadConfig();
    const options = await loadOptions();
    Object.assign(config, options);

    const canvas = document.getElementById('gameCanvas');
    const engine = new GameEngine(canvas, config);

    // Références aux éléments du menu d'options (conservé de votre code original)
    const optionsMenu = document.getElementById('optionsMenu');
    const renderDistanceSlider = document.getElementById('renderDistanceSlider');
    const renderDistanceValue = document.getElementById('renderDistanceValue');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    const particlesCheckbox = document.getElementById('particlesCheckbox');
    const weatherCheckbox = document.getElementById('weatherCheckbox');
    const lightingCheckbox = document.getElementById('lightingCheckbox');
    const mobileModeCheckbox = document.getElementById('mobileModeCheckbox');
    const soundSlider = document.getElementById('soundSlider');
    const volumeValue = document.getElementById('volumeValue');

    // Initialise les valeurs du menu avec les options chargées
    renderDistanceSlider.value = config.renderDistance;
    renderDistanceValue.textContent = `${config.renderDistance} chunks`;
    zoomSlider.value = config.zoom;
    zoomValue.textContent = `x${config.zoom}`;
    particlesCheckbox.checked = config.showParticles;
    weatherCheckbox.checked = config.weatherEffects;
    lightingCheckbox.checked = config.dynamicLighting;
    mobileModeCheckbox.checked = config.mobileMode;
    if (config.mobileMode) document.body.classList.add('mobile-mode');
    soundSlider.value = config.soundVolume;
    volumeValue.textContent = `${Math.round(config.soundVolume * 100)}%`;

    // Écouteurs d'événements pour les options
    renderDistanceSlider.addEventListener('input', () => { config.renderDistance = parseInt(renderDistanceSlider.value); renderDistanceValue.textContent = `${config.renderDistance} chunks`; });
    zoomSlider.addEventListener('input', () => { config.zoom = parseFloat(zoomSlider.value); zoomValue.textContent = `x${config.zoom}`; });
    particlesCheckbox.addEventListener('change', () => { config.showParticles = particlesCheckbox.checked; });
    weatherCheckbox.addEventListener('change', () => { config.weatherEffects = weatherCheckbox.checked; });
    lightingCheckbox.addEventListener('change', () => { config.dynamicLighting = lightingCheckbox.checked; });
    mobileModeCheckbox.addEventListener('change', () => { config.mobileMode = mobileModeCheckbox.checked; document.body.classList.toggle('mobile-mode', config.mobileMode); });
    soundSlider.addEventListener('input', () => { config.soundVolume = parseFloat(soundSlider.value); volumeValue.textContent = `${Math.round(config.soundVolume * 100)}%`; });

    // --- Objet central du jeu ---
    const game = {
        config: config,
        assets: {},
        tileMap: [],
        player: null,
        enemies: [],
        pnjs: [],
        collectibles: [],
        camera: { x: 0, y: 0 },
        particleSystem: new ParticleSystem(),
        logger: new Logger(),
        lastTime: 0,

        createParticles(x, y, count, color, options) {
            if(this.config.showParticles) this.particleSystem.create(x, y, count, color, options);
        },
        
        updateToolbar() {
            const toolbar = document.getElementById('toolbar');
            if (!toolbar || !this.player) return;
            toolbar.innerHTML = '';
            this.player.tools.forEach((toolName, index) => {
                const slot = document.createElement('div');
                slot.className = 'toolbar-slot';
                if (index === this.player.selectedToolIndex) slot.classList.add('selected');
                const icon = getItemIcon(toolName, this.assets);
                if (icon) slot.appendChild(icon.cloneNode(true));
                toolbar.appendChild(slot);
            });
        }
    };

    // Fonctions de gestion du menu
    function openOptionsMenu() {
        optionsMenu.classList.add('active');
    }

    function closeOptionsMenu() {
        optionsMenu.classList.remove('active');
        saveOptions({
            zoom: config.zoom,
            renderDistance: config.renderDistance,
            showParticles: config.showParticles,
            weatherEffects: config.weatherEffects,
            dynamicLighting: config.dynamicLighting,
            soundVolume: config.soundVolume,
            mobileMode: config.mobileMode
        });
    }
    window.openOptionsMenu = openOptionsMenu;
    window.closeOptionsMenu = closeOptionsMenu;


    // --- Logique de jeu principale, maintenant complète ---
    const gameLogic = {
        init(assets) {
            game.assets = assets;
            game.logger.log("Génération du monde...");
            generateLevel(game, config);
            
            game.player = new Player(100, 100, config);
            
            // Placer le joueur correctement
            const startXTile = Math.floor(game.tileMap[0].length / 4);
            for (let y = 0; y < game.tileMap.length; y++) {
                if (game.tileMap[y][startXTile] > TILE.AIR) {
                    game.player.x = startXTile * config.tileSize;
                    game.player.y = (y - 3) * config.tileSize;
                    break;
                }
            }
            
            game.worldAnimator = new WorldAnimator(config, assets);
            game.timeSystem = new TimeSystem();
            game.updateToolbar();
            game.logger.log("Jeu prêt !");
        },

        update(keys, mouse) {
            const now = performance.now();
            const delta = (now - (game.lastTime || now)) / 1000;
            game.lastTime = now;

            if (!game.player) return;

            game.player.update(keys, mouse, game);
            game.enemies.forEach(e => e.update(game));
            game.pnjs.forEach(p => p.update(game));
            updateMining(game, mouse, delta);
            game.particleSystem.update();
            game.worldAnimator.update(game.camera, canvas, config.zoom);
            game.timeSystem.update();
            game.logger.update();
            
            // =================================================================
            // === CORRECTION DE LA CAMÉRA ===
            // =================================================================
            const { zoom, worldWidth, worldHeight } = config;
            const canvasWidth = canvas.clientWidth;
            const canvasHeight = canvas.clientHeight;

            // 1. Position cible de la caméra (centrée sur le joueur)
            let targetX = game.player.x + game.player.w / 2 - canvasWidth / 2 / zoom;
            let targetY = game.player.y + game.player.h / 2 - canvasHeight / 2 / zoom;

            // 2. Limites du monde en pixels
            const worldPixelWidth = worldWidth;
            const worldPixelHeight = worldHeight;

            // 3. Limites de la caméra pour ne pas sortir du monde
            const minCameraX = 0;
            const maxCameraX = worldPixelWidth - (canvasWidth / zoom);
            const minCameraY = 0;
            const maxCameraY = worldPixelHeight - (canvasHeight / zoom);

            // 4. Appliquer les contraintes (clamping)
            game.camera.x = Math.max(minCameraX, Math.min(targetX, maxCameraX));
            game.camera.y = Math.max(minCameraY, Math.min(targetY, maxCameraY));
            // =================================================================
            // === FIN DE LA CORRECTION DE LA CAMÉRA ===
            // =================================================================
        },

        draw(ctx, assets) {
            const { tileSize, zoom } = config;
            
            const skyGrad = game.timeSystem.getSkyGradient();
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, skyGrad[0]);
            gradient.addColorStop(1, skyGrad[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.scale(zoom, zoom);
            ctx.translate(-game.camera.x, -game.camera.y);

            game.worldAnimator.draw(ctx);
            
            const startX = Math.floor(game.camera.x / tileSize) - 1;
            const endX = startX + Math.ceil(canvas.width / zoom / tileSize) + 2;
            const startY = Math.floor(game.camera.y / tileSize) - 1;
            const endY = startY + Math.ceil(canvas.height / zoom / tileSize) + 2;

            for (let y = Math.max(0, startY); y < Math.min(game.tileMap.length, endY); y++) {
                for (let x = Math.max(0, startX); x < Math.min(game.tileMap[0].length, endX); x++) {
                    const tileType = game.tileMap[y][x];
                    if (tileType > TILE.AIR) {
                        const assetKey = Object.keys(TILE).find(key => TILE[key] === tileType);
                        if(assetKey) {
                            const img = assets[`tile_${assetKey.toLowerCase()}`];
                            if (img) ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
                        }
                    }
                }
            }
            
            game.pnjs.forEach(p => p.draw(ctx));
            game.enemies.forEach(e => e.draw(ctx, assets));
            if(game.player) game.player.draw(ctx, assets, config.playerAnimations);
            game.particleSystem.draw(ctx);
            
            if (game.miningEffect) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = 'white';
                const crackSize = tileSize * game.miningEffect.progress;
                ctx.fillRect(
                    game.miningEffect.x * tileSize + (tileSize - crackSize) / 2,
                    game.miningEffect.y * tileSize + (tileSize - crackSize) / 2,
                    crackSize, crackSize
                );
                ctx.globalAlpha = 1;
            }

            ctx.restore();
            game.logger.draw(ctx, canvas);
        },

        isPaused() {
            return optionsMenu.classList.contains('active');
        },

        toggleMenu(menu) {
            if (menu === 'options') {
                if (optionsMenu.classList.contains('active')) {
                    closeOptionsMenu();
                } else {
                    openOptionsMenu();
                }
            }
        },
        
        selectTool: (index) => {
            if (game.player && index >= 0 && index < game.player.tools.length) {
                game.player.selectedToolIndex = index;
                game.updateToolbar();
            }
        },
        cycleTool: (direction) => {
            if (game.player) {
                const len = game.player.tools.length;
                game.player.selectedToolIndex = (game.player.selectedToolIndex + direction + len) % len;
                game.updateToolbar();
            }
        }
    };

    engine.start(gameLogic);
});
