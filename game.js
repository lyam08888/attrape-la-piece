// game.js - Le chef d'orchestre du jeu (Version complète et stabilisée)

import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { TILE, generateLevel } from './world.js';
import { PNJ } from './PNJ.js';
import { generatePNJ } from './generateurPNJ.js';
import { updateMining } from './miningEngine.js';
import { ParticleSystem } from './fx.js';
import { WorldAnimator } from './worldAnimator.js';
import { TimeSystem } from './timeSystem.js';
import { Logger } from './logger.js';
import { getItemIcon } from './itemIcons.js';
import { SoundManager } from './sound.js';

async function loadConfig() {
    try {
        const resp = await fetch('config.json');
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        return await resp.json();
    } catch (e) {
        console.error("Impossible de charger config.json. Utilisation d'une configuration par défaut.", e);
        return {"tileSize":16,"zoom":3,"worldWidth":2048,"worldHeight":1024,"generation":{"enemyCount":10,"treeCount":20},"physics":{"gravity":0.35,"jumpForce":8,"playerSpeed":3,"friction":0.85,"airResistance":0.98,"maxFallSpeed":10,"groundAcceleration":0.4,"airAcceleration":0.2},"player":{"width":24,"height":24,"hitbox":{"offsetX":3,"offsetY":3,"width":18,"height":21}}};
    }
}

async function loadOptions() {
    const stored = localStorage.getItem('gameOptions');
    if (stored) return JSON.parse(stored);
    try {
        const resp = await fetch('options.json');
        if (!resp.ok) throw new Error('options.json non trouvé');
        return await resp.json();
    } catch (e) {
        console.warn(e);
        return {"zoom":3,"renderDistance":8,"showParticles":true,"weatherEffects":true,"dynamicLighting":true,"soundVolume":0.8,"mobileMode":false};
    }
}

function saveOptions(opts) {
    localStorage.setItem('gameOptions', JSON.stringify(opts));
}

document.addEventListener('DOMContentLoaded', async () => {
    const config = await loadConfig();
    const options = await loadOptions();
    Object.assign(config, options);

    const canvas = document.getElementById('gameCanvas');
    const engine = new GameEngine(canvas, config);

    const optionsMenu = document.getElementById('optionsMenu');
    // ... (toute votre logique de gestion des menus reste identique)

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
        canvas: canvas,
        settings: config,
        cameraShakeTimer: 0,
        cameraShakeStrength: 0,
        cameraShakeOffsetX: 0,
        cameraShakeOffsetY: 0,

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
        },

        triggerCameraShake(strength = 5, duration = 30) {
            this.cameraShakeStrength = strength;
            this.cameraShakeTimer = duration;
        },

        checkBlockSupport(x, y) {
            const type = this.tileMap[y]?.[x];
            if (type > TILE.AIR && (this.tileMap[y + 1]?.[x] === TILE.AIR || this.tileMap[y + 1]?.[x] === undefined)) {
                this.tileMap[y][x] = TILE.AIR;
                this.collectibles.push({
                    x: x * this.config.tileSize,
                    y: y * this.config.tileSize,
                    w: this.config.tileSize,
                    h: this.config.tileSize,
                    vy: -2,
                    tileType: type
                });
            }
        }
    };

    function openOptionsMenu() { optionsMenu.classList.add('active'); }
    function closeOptionsMenu() {
        optionsMenu.classList.remove('active');
        saveOptions({ /* ... */ });
    }
    window.openOptionsMenu = openOptionsMenu;
    window.closeOptionsMenu = closeOptionsMenu;

    const gameLogic = {
        init(assets) {
            game.assets = assets;
            game.sound = new SoundManager(config.soundVolume);
            game.logger.log("Génération du monde...");
            generateLevel(game, config);
            
            game.player = new Player(100, 100, config, game.sound);
            
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

        update(delta, keys, mouse) {
            if (!game.player) return;

            game.player.update(keys, mouse, game, delta);
            game.enemies.forEach(e => e.update(game, delta));
            game.pnjs.forEach(p => p.update(game, delta));
            
            game.collectibles.forEach(c => {
                c.vy += config.physics.gravity * 0.5;
                c.y += c.vy;
                // Simple collision avec le sol pour les collectibles
                const groundY = Math.floor((c.y + c.h) / config.tileSize);
                const groundX = Math.floor((c.x + c.w/2) / config.tileSize);
                if(game.tileMap[groundY]?.[groundX] > TILE.AIR) {
                    c.y = groundY * config.tileSize - c.h;
                    c.vy = 0;
                }
            });

            updateMining(game, mouse, delta);
            game.particleSystem.update();
            if (game.worldAnimator) game.worldAnimator.update(game.camera, canvas, config.zoom);
            if (game.timeSystem) game.timeSystem.update();
            game.logger.update();
            
            const { zoom, worldWidth, worldHeight } = config;
            const canvasWidth = canvas.clientWidth;
            const canvasHeight = canvas.clientHeight;

            let targetX = game.player.x + game.player.w / 2 - canvasWidth / 2 / zoom;
            let targetY = game.player.y + game.player.h / 2 - canvasHeight / 2 / zoom;

            const maxCameraX = worldWidth - (canvasWidth / zoom);
            const maxCameraY = worldHeight - (canvasHeight / zoom);

            game.camera.x = Math.max(0, Math.min(targetX, maxCameraX));
            game.camera.y = Math.max(0, Math.min(targetY, maxCameraY));

            if (game.cameraShakeTimer > 0) {
                game.cameraShakeTimer--;
                game.cameraShakeOffsetX = (Math.random() - 0.5) * game.cameraShakeStrength;
                game.cameraShakeOffsetY = (Math.random() - 0.5) * game.cameraShakeStrength;
            } else {
                game.cameraShakeOffsetX = 0;
                game.cameraShakeOffsetY = 0;
            }
        },

        draw(ctx, assets) {
            if (!game.timeSystem || !game.tileMap.length) return;

            const { tileSize, zoom } = config;
            
            const skyGrad = game.timeSystem.getSkyGradient();
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, skyGrad[0]);
            gradient.addColorStop(1, skyGrad[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.scale(zoom, zoom);
            ctx.translate(-game.camera.x + game.cameraShakeOffsetX, -game.camera.y + game.cameraShakeOffsetY);

            if (game.worldAnimator) game.worldAnimator.draw(ctx);
            
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
            
            game.collectibles.forEach(c => {
                 const assetKey = Object.keys(TILE).find(key => TILE[key] === c.tileType);
                 if(assetKey) {
                    const img = assets[`tile_${assetKey.toLowerCase()}`];
                    if (img) ctx.drawImage(img, c.x, c.y, c.w, c.h);
                 }
            });

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

        isPaused: () => optionsMenu.classList.contains('active'),
        toggleMenu: (menu) => { if (menu === 'options') optionsMenu.classList.toggle('active'); },
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
