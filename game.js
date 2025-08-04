// game.js - Le chef d'orchestre du jeu (Version complète et stabilisée)

import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { TILE, generateLevel, ensureWorldColumns } from './world.js';
import { PNJ } from './PNJ.js';
import { generatePNJ } from './generateurPNJ.js';
import { updateGravity } from './miningEngine.js';
import { ParticleSystem } from './fx.js';
import { WorldAnimator } from './worldAnimator.js';
import { TimeSystem } from './timeSystem.js';
import { Logger } from './logger.js';
import { getItemIcon } from './itemIcons.js';
import { SoundManager } from './sound.js';
import { integrateComplexWorld } from './gameIntegration.js';
import { UIManager } from './uiManager.js';
import { WindowManager } from './simpleWindowManager.js';
import { AdvancedWorldGenerator } from './advancedWorldGenerator.js';
import { AdvancedRenderer } from './advancedRenderer.js';
import { AdvancedNPCSystem } from './advancedNPCSystem.js';
import { integrateAdvancedSystems } from './advancedSystemsIntegration.js';
import { convertAdvancedWorldToBasic, enrichBasicWorldWithAdvancedData, syncWorldChanges } from './worldIntegration.js';
import { RPGInterfaceManager } from './rpgInterfaceManager.js';
import { integrateMiningWithRPG } from './miningEngine.js';

async function loadConfig() {
    try {
        const resp = await fetch('config.json');
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        return await resp.json();
    } catch (e) {
        console.error("Impossible de charger config.json. Utilisation d'une configuration par défaut.", e);
        return {
            "version": "0.01",
            "tileSize": 16,
            "zoom": 3,
            "worldWidth": 2048,
            "worldHeight": 1024,
            "generation": { "enemyCount": 10, "treeCount": 20 },
            "physics": {
                "gravity": 0.35,
                "jumpForce": 8,
                "playerSpeed": 3,
                "friction": 0.85,
                "airResistance": 0.98,
                "maxFallSpeed": 10,
                "groundAcceleration": 0.4,
                "airAcceleration": 0.2,
                "wallSlideSpeed": 1.5,
                "wallJumpForce": 6,
                "glideGravity": 0.1,
                "glideFallSpeed": 0.5
            },
            "player": {
                "width": 64,
                "height": 64,
                "hitbox": { "offsetX": 0, "offsetY": 0, "width": 64, "height": 64 }
            },
            "playerAnimations": {
                "idle": ["player_idle1"],
                "walking": ["player_walk1", "player_walk2"],
                "running": ["player_run1", "player_run2"],
                "jumping": ["player_jump"],
                "doubleJump": ["player_double_jump1", "player_double_jump2"],
                "flying": ["player_fly1", "player_fly2"],
                "gliding": ["player_fly1", "player_fly2"],
                "wallSliding": ["player_idle1"],
                "crouching": ["player_crouch"],
                "crouchWalking": ["player_crouch_walk1", "player_crouch_walk2"],
                "prone": ["player_prone"],
                "proneWalking": ["player_prone_walk1", "player_prone_walk2"]
            }
        };
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
        return {
            "zoom": 3,
            "renderDistance": 8,
            "showParticles": true,
            "weatherEffects": true,
            "dynamicLighting": true,
            "soundVolume": 0.8,
            "mobileMode": false,
            "keyBindings": {
                "left": "ArrowLeft",
                "right": "ArrowRight",
                "jump": " ",
                "down": "ArrowDown",
                "up": "ArrowUp",
                "action": "e",
                "run": "Shift",
                "fly": "v",
                "repair": "r",
                "inventory": "i",
                "character": "p",
                "quests": "q",
                "pause": "Escape",
                "options": "o",
                "tool1": "1",
                "tool2": "2",
                "tool3": "3",
                "tool4": "4",
                "tool5": "5",
                "tool6": "6"
            }
        };
    }
}

function saveOptions(opts) {
    localStorage.setItem('gameOptions', JSON.stringify(opts));
}

document.addEventListener('DOMContentLoaded', async () => {
    const config = await loadConfig();
    document.title = `Super Pixel Adventure 2 V.${config.version || '0.01'}`;
    const options = await loadOptions();
    Object.assign(config, options);

    const canvas = document.getElementById('gameCanvas');

    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const engine = new GameEngine(canvas, config);

    const optionsMenu = document.getElementById('optionsMenu');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const characterMenu = document.getElementById('characterMenu');
    const renderDistanceSlider = document.getElementById('renderDistanceSlider');
    const zoomSlider = document.getElementById('zoomSlider');
    const particlesCheckbox = document.getElementById('particlesCheckbox');
    const weatherCheckbox = document.getElementById('weatherCheckbox');
    const lightingCheckbox = document.getElementById('lightingCheckbox');
    const mobileModeCheckbox = document.getElementById('mobileModeCheckbox');
    const soundSlider = document.getElementById('soundSlider');
    const renderDistanceValue = document.getElementById('renderDistanceValue');
    const zoomValue = document.getElementById('zoomValue');
    const volumeValue = document.getElementById('volumeValue');

    function syncOptionUI() {
        renderDistanceSlider.value = config.renderDistance;
        renderDistanceValue.textContent = `${config.renderDistance} chunks`;

        zoomSlider.value = config.zoom;
        zoomValue.textContent = `x${config.zoom}`;

        particlesCheckbox.checked = config.showParticles;
        weatherCheckbox.checked = config.weatherEffects;
        lightingCheckbox.checked = config.dynamicLighting;
        mobileModeCheckbox.checked = config.mobileMode;

        soundSlider.value = config.soundVolume;
        volumeValue.textContent = `${Math.round(config.soundVolume * 100)}%`;

        document.body.classList.toggle('mobile-mode', config.mobileMode);
    }

    function setupOptionHandlers() {
        renderDistanceSlider.addEventListener('input', () => {
            config.renderDistance = parseInt(renderDistanceSlider.value);
            renderDistanceValue.textContent = `${config.renderDistance} chunks`;
        });

        zoomSlider.addEventListener('input', () => {
            config.zoom = parseFloat(zoomSlider.value);
            zoomValue.textContent = `x${config.zoom}`;
        });

        particlesCheckbox.addEventListener('change', () => {
            config.showParticles = particlesCheckbox.checked;
        });

        weatherCheckbox.addEventListener('change', () => {
            config.weatherEffects = weatherCheckbox.checked;
        });

        lightingCheckbox.addEventListener('change', () => {
            config.dynamicLighting = lightingCheckbox.checked;
        });

        mobileModeCheckbox.addEventListener('change', () => {
            config.mobileMode = mobileModeCheckbox.checked;
            document.body.classList.toggle('mobile-mode', config.mobileMode);
            resizeCanvas();
        });

        soundSlider.addEventListener('input', () => {
            config.soundVolume = parseFloat(soundSlider.value);
            volumeValue.textContent = `${Math.round(config.soundVolume * 100)}%`;
            if (game.sound) game.sound.setVolume(config.soundVolume);
        });
    }

    setupOptionHandlers();
    syncOptionUI();

    const game = {
        config: engine.config,
        assets: {},
        tileMap: [],
        player: null,
        enemies: [],
        pnjs: [],
        collectibles: [],
        animals: [], // Ajout pour les animaux du monde complexe
        camera: { x: 0, y: 0 },
        particleSystem: new ParticleSystem(),
        logger: new Logger(),
        lastTime: 0,
        canvas: canvas,
        settings: engine.config,
        cameraShakeTimer: 0,
        cameraShakeStrength: 0,
        cameraShakeOffsetX: 0,
        cameraShakeOffsetY: 0,
        worldIntegration: null, // Système d'intégration du monde complexe
        uiManager: null, // Gestionnaire d'interface modulaire
        paused: false, // État de pause du jeu
        debugMode: false, // Mode debug

        // Function to map keys according to config.keyBindings
        getKeys(rawKeys) {
            const binds = this.config.keyBindings || {};
            return {
                left: rawKeys.left ?? rawKeys[binds.left],
                right: rawKeys.right ?? rawKeys[binds.right],
                up: rawKeys.up ?? rawKeys[binds.up] ?? rawKeys[binds.jump],
                down: rawKeys.down ?? rawKeys[binds.down],
                jump: rawKeys.jump ?? rawKeys[binds.jump],
                run: rawKeys.run ?? rawKeys[binds.run],
                fly: rawKeys.fly ?? rawKeys[binds.fly],
                action: rawKeys.action ?? rawKeys[binds.action],
                repair: rawKeys.repair ?? rawKeys[binds.repair]
            };
        },

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

                // Rendre les outils déplaçables vers l'inventaire
                slot.draggable = true;
                slot.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', `tool:${index}`);
                });

                // Ajouter un gestionnaire de clic pour sélectionner l'outil
                slot.addEventListener('click', () => {
                    this.player.selectedToolIndex = index;
                    this.updateToolbar();
                    this.updateToolInfo();
                });
                
                // Ajouter un titre pour l'accessibilité avec durabilité
                const durability = this.player.durability[toolName] || 0;
                const maxDurability = this.player.toolDurability[toolName] || 100;
                const displayName = toolName.replace(/^tool_/, '');
                slot.title = `${displayName.charAt(0).toUpperCase() + displayName.slice(1).replace('_', ' ')} (${durability}/${maxDurability})`;
                
                const icon = getItemIcon(toolName, this.assets);
                if (icon) slot.appendChild(icon.cloneNode(true));
                
                // Ajouter une barre de durabilité et des effets visuels
                const durabilityPercent = durability / maxDurability;
                
                if (durability < maxDurability) {
                    const durabilityBar = document.createElement('div');
                    durabilityBar.className = 'durability-bar';
                    durabilityBar.style.cssText = `
                        position: absolute;
                        bottom: 2px;
                        left: 2px;
                        right: 2px;
                        height: 3px;
                        background: rgba(255,0,0,0.7);
                        border-radius: 1px;
                    `;
                    const durabilityFill = document.createElement('div');
                    const color = durabilityPercent > 0.5 ? 'rgba(0,255,0,0.8)' : 
                                 durabilityPercent > 0.2 ? 'rgba(255,255,0,0.8)' : 'rgba(255,0,0,0.8)';
                    durabilityFill.style.cssText = `
                        height: 100%;
                        background: ${color};
                        width: ${durabilityPercent * 100}%;
                        border-radius: 1px;
                    `;
                    durabilityBar.appendChild(durabilityFill);
                    slot.style.position = 'relative';
                    slot.appendChild(durabilityBar);
                }
                
                // Effet visuel pour les outils cassés
                if (durability <= 0) {
                    slot.style.opacity = '0.5';
                    slot.style.filter = 'grayscale(70%)';
                    slot.title += ' - CASSÉ';
                }
                
                toolbar.appendChild(slot);
            });
            this.updateToolInfo();
        },
        
        updateToolInfo() {
            if (!this.player) return;
            const toolName = this.player.tools[this.player.selectedToolIndex];
            const toolInfo = document.getElementById('toolInfo');
            if (toolInfo && toolName) {
                const durability = this.player.durability[toolName] || 0;
                const maxDurability = this.player.toolDurability[toolName] || 100;
                const enchantments = this.player.toolEnchantments[toolName] || [];
                const repairMaterial = this.player.getRepairMaterial(toolName);
                const repairMaterialName = Object.keys(TILE).find(k => TILE[k] === repairMaterial) || 'Matériau';
                const hasRepairMaterial = (this.player.inventory[repairMaterial] || 0) > 0;
                const displayName = toolName.replace(/^tool_/, '');

                let statusText = '';
                if (durability <= 0) {
                    statusText = '<span style="color: #ff4444;">CASSÉ</span>';
                } else if (durability < maxDurability * 0.2) {
                    statusText = '<span style="color: #ffaa00;">Très usé</span>';
                } else if (durability < maxDurability * 0.5) {
                    statusText = '<span style="color: #ffff00;">Usé</span>';
                }

                toolInfo.innerHTML = `
                    <div style="font-size: 12px; color: #fff;">
                        <strong>${displayName.charAt(0).toUpperCase() + displayName.slice(1).replace('_', ' ')}</strong><br>
                        Durabilité: ${durability}/${maxDurability} ${statusText}<br>
                        ${enchantments.length > 0 ? `Enchantements: ${enchantments.join(', ')}<br>` : ''}
                        ${durability < maxDurability ? `Réparation: ${repairMaterialName} ${hasRepairMaterial ? '✓' : '✗'}<br>` : ''}
                        ${durability < maxDurability ? '<span style="font-size: 10px; color: #aaa;">Appuyez sur R pour réparer</span>' : ''}
                    </div>
                `;
            }
        },

        triggerCameraShake(strength = 5, duration = 30) {
            this.cameraShakeStrength = strength;
            this.cameraShakeTimer = duration;
        }
    };

    function openOptionsMenu() {
        syncOptionUI();
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

    const gameLogic = {
        init(assets) {
            game.assets = assets;
            game.sound = new SoundManager(config.soundVolume);
            game.logger.log("Génération du monde...");
            generateLevel(game, config);

            // Créer le joueur avec des coordonnées temporaires
            game.player = new Player(0, 0, config, game.sound);

            // Trouver une position de spawn appropriée
            const { tileSize } = config;
            const playerWidthTiles = Math.ceil(game.player.w / tileSize);
            let spawnX = 0;
            let spawnY = 0;
            let spawnFound = false;

            // Chercher une position de spawn sûre (au centre du monde)
            const centerX = Math.floor(game.tileMap[0].length / 2);

            // Parcourir les colonnes autour du centre pour trouver une surface stable
            for (let xOffset = 0; xOffset < 100 && !spawnFound; xOffset++) {
                for (let direction of [-1, 1]) {
                    const x = centerX + (xOffset * direction);
                    if (x < 0 || x >= game.tileMap[0].length) continue;

                    // Trouver le sol à cette position x
                    for (let y = 0; y < game.tileMap.length - 10; y++) {
                        let spaceClear = true;

                        // Vérifier si l'espace est suffisamment large pour le joueur
                        for (let dx = 0; dx < playerWidthTiles; dx++) {
                            const xx = x + dx;
                            if (xx >= game.tileMap[0].length) {
                                spaceClear = false;
                                break;
                            }
                            const isSolid = game.tileMap[y][xx] > TILE.AIR &&
                                game.tileMap[y][xx] !== TILE.WATER &&
                                game.tileMap[y][xx] !== TILE.LAVA;
                            const airAbove = game.tileMap[y - 1] && game.tileMap[y - 1][xx] === TILE.AIR &&
                                game.tileMap[y - 2] && game.tileMap[y - 2][xx] === TILE.AIR &&
                                game.tileMap[y - 3] && game.tileMap[y - 3][xx] === TILE.AIR;
                            if (!(isSolid && airAbove)) {
                                spaceClear = false;
                                break;
                            }
                        }

                        if (spaceClear) {
                            // Centrer le joueur sur la zone dégagée
                            const zoneWidth = playerWidthTiles * tileSize;
                            spawnX = x * tileSize + (zoneWidth - game.player.w) / 2;
                            spawnY = (y - 3) * tileSize; // 3 blocs au-dessus du sol
                            spawnFound = true;
                            break;
                        }
                    }
                    if (spawnFound) break;
                }
            }

            // Si aucune position appropriée n'a été trouvée, utiliser une position par défaut
            if (!spawnFound) {
                const zoneWidth = playerWidthTiles * tileSize;
                spawnX = centerX * tileSize + (zoneWidth - game.player.w) / 2;
                spawnY = 100; // Position par défaut
            }

            // Positionner le joueur
            game.player.x = spawnX;
            game.player.y = spawnY;
            game.player.vx = 0;
            game.player.vy = 0;

            // Point de réapparition du joueur
            game.spawnPoint = { x: game.player.x, y: game.player.y };
            
            game.worldAnimator = new WorldAnimator(config, assets);
            game.timeSystem = new TimeSystem();
            
            // Intégrer le système de monde complexe
            game.logger.log("Initialisation du monde complexe...");
            try {
                game.worldIntegration = integrateComplexWorld(game, config, gameLogic);
                game.logger.log("✅ Monde complexe intégré avec succès !");
            } catch (error) {
                console.error("❌ Erreur lors de l'intégration du monde complexe:", error);
                game.logger.log("⚠️ Monde complexe non disponible");
            }
            
            // Initialiser le gestionnaire d'interface modulaire
            game.logger.log("Initialisation de l'interface modulaire...");
            try {
                game.uiManager = new UIManager(game);
                window.uiManager = game.uiManager; // Rendre accessible globalement
                game.logger.log("✅ Interface modulaire initialisée !");
            } catch (error) {
                console.error("❌ Erreur lors de l'initialisation de l'interface:", error);
                game.logger.log("⚠️ Interface modulaire non disponible");
            }
            
            // Initialiser le gestionnaire de fenêtres Windows 11
            game.logger.log("Initialisation du système de fenêtres...");
            try {
                game.windowManager = new WindowManager();
                window.windowManager = game.windowManager; // Rendre accessible globalement
                window.game = game; // Rendre le jeu accessible pour les dialogues
                game.logger.log("✅ Système de fenêtres initialisé !");
            } catch (error) {
                console.error("❌ Erreur lors de l'initialisation des fenêtres:", error);
                game.logger.log("⚠️ Système de fenêtres non disponible");
            }
            
            // Intégrer les dépendances des systèmes avancés
            game.logger.log("Intégration des dépendances avancées...");
            try {
                integrateAdvancedSystems(game);
                game.logger.log("✅ Dépendances avancées intégrées !");
            } catch (error) {
                console.error("❌ Erreur lors de l'intégration des dépendances:", error);
                game.logger.log("⚠️ Dépendances avancées non disponibles");
            }
            
            // Initialiser les systèmes avancés
            game.logger.log("Initialisation des systèmes avancés...");
            try {
                // Générateur de monde avancé
                game.advancedWorldGenerator = new AdvancedWorldGenerator();
                game.logger.log("✅ Générateur de monde avancé initialisé !");
                
                // Système de rendu avancé
                game.advancedRenderer = new AdvancedRenderer(game.canvas, assets);
                game.logger.log("✅ Système de rendu avancé initialisé !");
                
                // Système de PNJ avancé
                game.advancedNPCSystem = new AdvancedNPCSystem(game);
                game.logger.log("✅ Système de PNJ avancé initialisé !");
                
                // Rendre accessibles globalement
                window.advancedWorldGenerator = game.advancedWorldGenerator;
                window.advancedRenderer = game.advancedRenderer;
                window.advancedNPCSystem = game.advancedNPCSystem;
                
                game.logger.log("✅ Tous les systèmes avancés sont opérationnels !");
            } catch (error) {
                console.error("❌ Erreur lors de l'initialisation des systèmes avancés:", error);
                game.logger.log("⚠️ Systèmes avancés non disponibles - utilisation du mode de base");
            }
            
            // === INTÉGRATION INTERFACE RPG ===
            game.logger.log("Initialisation de l'interface RPG...");
            try {
                game.rpgInterface = new RPGInterfaceManager();
                window.rpgInterface = game.rpgInterface; // Rendre accessible globalement
                
                // Intégrer le système de minage avec l'interface RPG
                integrateMiningWithRPG(game);
                
                game.logger.log("✅ Interface RPG initialisée avec succès !");
                
                // Notification de bienvenue
                setTimeout(() => {
                    if (game.rpgInterface) {
                        game.rpgInterface.showNotification(
                            '🎮 Interface RPG activée ! Utilisez I, C, Q, M, O, J, ESC',
                            'success',
                            5000
                        );
                    }
                }, 2000);
                
            } catch (error) {
                console.error("❌ Erreur lors de l'initialisation de l'interface RPG:", error);
                game.logger.log("⚠️ Interface RPG non disponible - utilisation de l'interface de base");
            }
            
            game.updateToolbar();
            game.logger.log("Jeu prêt !");
        },

        update(delta, keys, mouse) {
            if (!game.player) return;

            // Map raw key states according to config.keyBindings
            const mappedKeys = this.getKeys(keys);

            game.player.update(mappedKeys, mouse, game, delta);
            game.enemies.forEach(e => e.update(game, delta));
            game.pnjs.forEach(p => {
                p.update(game, delta);

                const dx = (p.x + p.w / 2) - (game.player.x + game.player.w / 2);
                const dy = (p.y + p.h / 2) - (game.player.y + game.player.h / 2);
                const dist = Math.hypot(dx, dy);
                p.playerNearby = dist < config.tileSize * 2;

                if (p.playerNearby && mappedKeys.action && p.interactionCooldown <= 0) {
                    const dialogue = p.data?.quest?.dialogues?.greeting || 'Bonjour';
                    game.logger.log(`${p.data?.name || 'PNJ'}: ${dialogue}`);
                    p.interactionCooldown = 30;
                }
            });
            
            game.collectibles.forEach(c => {
                c.vy += config.physics.gravity * 0.5;
                c.y += c.vy;
                // Collision avec le sol pour les collectibles
                const groundY = Math.floor((c.y + c.h) / config.tileSize);
                const groundX = Math.floor((c.x + c.w/2) / config.tileSize);
                if(game.tileMap[groundY]?.[groundX] > TILE.AIR) {
                    c.y = groundY * config.tileSize - c.h;
                    c.vy = 0;
                }
                // Empêcher les collectibles de tomber indéfiniment
                if (c.y > game.tileMap.length * config.tileSize) {
                    c.y = game.tileMap.length * config.tileSize;
                    c.vy = 0;
                }
            });

            // Système de gravité pour les blocs
            updateGravity(game);
            
            game.particleSystem.update();
            if (game.worldAnimator) game.worldAnimator.update(game.camera, canvas, config.zoom);
            if (game.timeSystem) game.timeSystem.update();
            game.logger.update();

            // Mettre à jour l'interface modulaire
            if (game.uiManager && !game.paused) {
                game.uiManager.update();
            }

            // Mettre à jour l'interface utilisateur
            game.updateUI();

            const playerTileX = Math.floor(game.player.x / config.tileSize);
            const bufferTiles = config.renderDistance * config.chunkSize;
            ensureWorldColumns(game, config, playerTileX - bufferTiles, playerTileX + bufferTiles);

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

        // Accepte maintenant delta pour la compatibilité avec le moteur.
        draw(ctx, assets, delta) {
            if (!game.timeSystem || !game.tileMap.length) return;

            // Utiliser le renderer avancé si disponible
            if (game.advancedRenderer) {
                try {
                    game.advancedRenderer.renderWorld(game.tileMap, game.camera, config);
                    game.advancedRenderer.renderEntities(game.player, game.enemies, game.pnjs, game.collectibles);
                    game.advancedRenderer.renderEffects(game.particleSystem, game.miningEffect);
                    game.advancedRenderer.renderUI(game.logger, canvas);
                    return; // Sortir si le rendu avancé a réussi
                } catch (error) {
                    console.warn("⚠️ Erreur du renderer avancé, utilisation du renderer de base:", error);
                }
            }

            // Renderer de base (fallback)
            const { tileSize, zoom } = config;
            
            const skyGrad = game.timeSystem.getSkyGradient();
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, skyGrad[0]);
            gradient.addColorStop(1, skyGrad[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Dessiner le soleil et la lune en fonction de l'heure
            const { hour, minute } = game.timeSystem.getTime();
            const t = (hour + minute / 60) / 24;
            const sunPos = game.timeSystem.getSunPosition(canvas.width, canvas.height);
            const moonPos = game.timeSystem.getMoonPosition(canvas.width, canvas.height);

            // Soleil
            ctx.globalAlpha = Math.max(0, Math.sin(t * Math.PI));
            ctx.fillStyle = '#FDB813';
            ctx.beginPath();
            ctx.arc(sunPos.x, sunPos.y, 30, 0, Math.PI * 2);
            ctx.fill();

            // Lune
            ctx.globalAlpha = Math.max(0, Math.sin((t + 0.5) * Math.PI));
            ctx.fillStyle = '#f0f0f0';
            ctx.beginPath();
            ctx.arc(moonPos.x, moonPos.y, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;

            ctx.save();
            ctx.scale(zoom, zoom);
            ctx.translate(-game.camera.x + game.cameraShakeOffsetX, -game.camera.y + game.cameraShakeOffsetY);

            if (game.worldAnimator) game.worldAnimator.draw(ctx);
            
            const startX = Math.floor(game.camera.x / tileSize) - 1;
            const endX = startX + Math.ceil(canvas.width / zoom / tileSize) + 2;
            const startY = Math.floor(game.camera.y / tileSize) - 1;
            const endY = startY + Math.ceil(canvas.height / zoom / tileSize) + 2;

            for (let y = Math.max(0, startY); y < Math.min(game.tileMap.length, endY); y++) {
                for (let x = Math.max(0, startX); x < endX; x++) {
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

        updateUI() {
            if (!game.player) return;

            // Mettre à jour les statistiques du personnage
            const playerLevel = document.getElementById('playerLevel');
            const playerXP = document.getElementById('playerXP');
            const playerXPFill = document.getElementById('playerXPFill');
            const playerXPText = document.getElementById('playerXPText');
            const playerHealth = document.getElementById('playerHealth');
            const playerHealthFill = document.getElementById('playerHealthFill');
            const playerHealthText = document.getElementById('playerHealthText');
            const playerHunger = document.getElementById('playerHunger');
            const playerHungerFill = document.getElementById('playerHungerFill');
            const playerHungerText = document.getElementById('playerHungerText');
            const playerStrength = document.getElementById('playerStrength');
            const playerSpeed = document.getElementById('playerSpeed');
            const chestsOpened = document.getElementById('chestsOpened');
            const animalsObserved = document.getElementById('animalsObserved');
            const survivalItemsFound = document.getElementById('survivalItemsFound');

            if (playerLevel) playerLevel.textContent = game.player.stats ? game.player.stats.level : '1';
            if (playerXP) playerXP.textContent = game.player.stats ? `${game.player.stats.xp}/${game.player.stats.xpToNextLevel || 100}` : '0/100';
            
            if (playerXPFill && game.player.stats) {
                const xpPercent = game.player.stats.xpToNextLevel ? 
                    (game.player.stats.xp / game.player.stats.xpToNextLevel) * 100 : 0;
                playerXPFill.style.width = `${xpPercent}%`;
            }
            
            if (playerXPText) playerXPText.textContent = game.player.stats ? 
                `${game.player.stats.xp}/${game.player.stats.xpToNextLevel || 100}` : '0/100';
            
            if (playerHealth) playerHealth.textContent = `${Math.floor(game.player.health)}/${game.player.maxHealth || 100}`;
            if (playerHealthFill) {
                const healthPercent = ((game.player.maxHealth || 100) > 0) ? 
                    (game.player.health / (game.player.maxHealth || 100)) * 100 : 0;
                playerHealthFill.style.width = `${healthPercent}%`;
            }
            if (playerHealthText) playerHealthText.textContent = `${Math.floor(game.player.health)}/${game.player.maxHealth || 100}`;
            
            if (playerHunger) playerHunger.textContent = `${Math.floor(game.player.hunger)}/${game.player.maxHunger || 100}`;
            if (playerHungerFill) {
                const hungerPercent = ((game.player.maxHunger || 100) > 0) ? 
                    (game.player.hunger / (game.player.maxHunger || 100)) * 100 : 0;
                playerHungerFill.style.width = `${hungerPercent}%`;
            }
            if (playerHungerText) playerHungerText.textContent = `${Math.floor(game.player.hunger)}/${game.player.maxHunger || 100}`;
            
            if (playerStrength) playerStrength.textContent = game.player.stats ? game.player.stats.strength : '10';
            if (playerSpeed) playerSpeed.textContent = game.player.stats ? game.player.stats.speed : '10';
            if (chestsOpened) chestsOpened.textContent = game.statistics?.chestsOpened ?? '0';
            if (animalsObserved) animalsObserved.textContent = game.statistics?.animalsObserved ?? '0';
            if (survivalItemsFound) survivalItemsFound.textContent = game.statistics?.survivalItemsFound ?? '0';

            // Mettre à jour les informations environnementales
            if (game.timeSystem) {
                const gameTime = document.getElementById('gameTime');
                const gameDate = document.getElementById('gameDate');
                if (gameTime) {
                    const time = game.timeSystem.getTime();
                    gameTime.textContent = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
                }
                if (gameDate) {
                    const date = game.timeSystem.getDate();
                    gameDate.textContent = `Jour ${date.day}`;
                }
            }

            if (game.weatherSystem) {
                const gameWeather = document.getElementById('gameWeather');
                if (gameWeather) {
                    const weather = game.weatherSystem.getCurrentWeather();
                    gameWeather.textContent = weather.name;
                }
            }

            if (game.biomeSystem) {
                const currentBiome = document.getElementById('currentBiome');
                if (currentBiome) {
                    const biome = game.biomeSystem.getCurrentBiome();
                    currentBiome.textContent = biome ? biome.name : 'Surface';
                }
            }
        },

        isPaused: () => optionsMenu.classList.contains('active') || characterMenu?.classList.contains('active') || gameOverScreen?.classList.contains('active'),
        toggleMenu: (menu) => {
            if (menu === 'options') optionsMenu.classList.toggle('active');
            if (menu === 'character') characterMenu?.classList.toggle('active');
        },
        selectTool: (index) => {
            if (game.player && index >= 0 && index < game.player.tools.length) {
                game.player.selectedToolIndex = index;
                game.updateToolbar();
                game.updateToolInfo();
            }
        },
        cycleTool: (direction) => {
            if (game.player) {
                const len = game.player.tools.length;
                game.player.selectedToolIndex = (game.player.selectedToolIndex + direction + len) % len;
                game.updateToolbar();
                game.updateToolInfo();
            }
        },
        updateToolInfo: function() {
            if (!game.player) return;
            
            const toolInfo = document.getElementById('toolInfo');
            if (!toolInfo) return;
            
            const toolName = game.player.tools[game.player.selectedToolIndex];
            if (!toolName) {
                toolInfo.textContent = "Aucun outil sélectionné";
                return;
            }
            
            const durability = game.player.durability[toolName] || 0;
            const maxDurability = game.player.toolDurability[toolName] || 100;
            const enchantments = game.player.toolEnchantments[toolName] || [];
            const displayName = toolName.replace(/^tool_/, '');

            let infoText = `${displayName.charAt(0).toUpperCase() + displayName.slice(1).replace('_', ' ')}`;
            infoText += ` - Durabilité: ${durability}/${maxDurability}`;
            
            if (enchantments.length > 0) {
                infoText += ` - Enchantements: ${enchantments.join(', ')}`;
            }
            
            toolInfo.textContent = infoText;
        }
    };
    // Gestion de la mort du joueur
    document.addEventListener('player-death', () => {
        game.logger.log('☠️ Vous êtes mort !');
        if (gameOverScreen) gameOverScreen.classList.add('active');
    });

    engine.start(gameLogic);
});
