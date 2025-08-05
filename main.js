// Importation des modules critiques
import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { WorldComplexSystem } from './worldComplexSystem.js';

// Définition TILE compatible avec l'ancien système
const TILE = {
  AIR: 0,
  STONE: 1,
  GRASS: 2,
  DIRT: 3,
  // Ajoute d'autres blocs si besoin
};

// Fonction de génération de niveau compatible (utilise le monde complexe)
function generateLevel(width, height) {
  const worldSystem = new WorldComplexSystem({
    worldWidth: width, // Utilise directement les dimensions
    worldHeight: height,
    tileSize: 1
  });
  return worldSystem.tileMap;
}
import { RPGInterfaceManager } from './rpgInterfaceManager.js';
import { integrateAdvancedSystems } from './advancedSystemsIntegration.js';
import { CombatSystem } from './combatSystem.js';
import { FoodSystem } from './foodSystem.js';
import { integrateMiningWithRPG } from './miningEngine.js';
import { Logger } from './logger.js';

// Nouveaux systèmes RPG
import { CharacterClassManager, CHARACTER_CLASSES } from './characterClasses.js';
import { EquipmentManager } from './equipmentSystem.js';
import { ModularRPGInterface } from './modularRPGInterface.js';
import { AmbianceSystem } from './ambianceSystem.js';
import { EnemySpawner } from './enemySystem.js';
import { QuestManager } from './questSystem.js';
import { FaunaSystem } from './faunaSystem.js';
import { ControlsHUD } from './controlsHUD.js';
import { Minimap } from './minimap.js';
import { PerformanceOptimizer } from './performanceOptimizer.js';
import { DebugOverlay } from './debugOverlay.js';

// --- Configuration Globale ---
let game = {};
let engine = null;
const logger = new Logger();

// Fonction de débogage
function debugGameState() {
    console.log('=== DEBUG GAME STATE ===');
    console.log('Game object:', game);
    console.log('Player:', game.player);
    console.log('TileMap dimensions:', game.tileMap ? `${game.tileMap.length}x${game.tileMap[0]?.length}` : 'undefined');
    console.log('Camera:', game.camera);
    console.log('Config:', config);
    
    if (game.tileMap) {
        const nonAirTiles = game.tileMap.flat().filter(t => t !== 0).length;
        const totalTiles = game.tileMap.length * game.tileMap[0].length;
        console.log(`Tiles: ${nonAirTiles} non-AIR / ${totalTiles} total`);
        
        // Afficher quelques lignes de la surface
        const surfaceStart = Math.floor(game.tileMap.length * 0.18);
        console.log(`Surface (ligne ${surfaceStart}):`, game.tileMap[surfaceStart]?.slice(0, 20));
    }
    
    logger.log('État du jeu affiché dans la console', 'debug');
}

// Ajouter le raccourci F12 pour le débogage
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
        e.preventDefault();
        debugGameState();
    }
});
const config = {
    version: "3.2-stable",
    tileSize: 16,
    zoom: 3,
    worldWidth: 2048,
    worldHeight: 1024,
    physics: { gravity: 0.35, jumpForce: 8, playerSpeed: 3, friction: 0.85, maxFallSpeed: 10, groundAcceleration: 0.4, airAcceleration: 0.2 },
    player: { width: 32, height: 48 },
    chunkSize: 16,
    renderDistance: 8,
    keyBindings: {
        left: 'arrowleft',
        right: 'arrowright',
        jump: ' ',
        action: 'e',
        attack: 'f'
    }
};

// --- Fonctions Utilitaires ---
function updateLoadingStatus(message) {
    const statusEl = document.getElementById('loadingStatus');
    if (statusEl) statusEl.textContent = message;
    console.log(message);
}

function logPatchNotes() {
    const improvements = [
        '🌍 GÉNÉRATION DE MONDE AMÉLIORÉE:',
        '  • Terrain naturel avec collines et vallées',
        '  • Biomes variés (Plaines, Forêts, Déserts, Montagnes)',
        '  • Cavernes et structures générées procéduralement',
        '  • Minerais et ressources répartis intelligemment',
        '',
        '🐾 SYSTÈME DE FAUNE VIVANT:',
        '  • 18+ espèces d\'animaux différentes',
        '  • Comportements IA réalistes',
        '  • Animaux adaptés aux biomes',
        '  • Interactions avec l\'environnement',
        '',
        '🗺️ INTERFACE AMÉLIORÉE:',
        '  • Minimap avec exploration',
        '  • HUD des contrôles',
        '  • Optimisations de performance',
        '  • Meilleure gestion des assets',
        '',
        '🎮 CONTRÔLES:',
        '  • Flèches ou WASD pour se déplacer',
        '  • Espace/W pour sauter',
        '  • E pour miner, F pour attaquer',
        '  • M pour basculer la minimap'
    ];
    logger.log('🎮 SUPER PIXEL ADVENTURE 2 - AMÉLIORÉ! 🎮', 'info');
    improvements.forEach(line => logger.log(line, 'info'));
}

function resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth || window.innerWidth;
    const containerHeight = container.clientHeight || window.innerHeight;
    
    // S'assurer que les dimensions ne sont jamais 0
    canvas.width = Math.max(containerWidth, 800);
    canvas.height = Math.max(containerHeight, 600);
    
    console.log(`Canvas redimensionné: ${canvas.width}x${canvas.height}`);
}

function findSafeSpawnPoint(tileMap, playerHeight, tileSize) {
    const worldCenter = Math.floor(tileMap[0].length / 2);
    const height = tileMap.length;
    const width = tileMap[0].length;
    const yStart = Math.floor(height * 0.18);
    const yEnd = Math.floor(height * 0.5);
    for (let y = yEnd - 1; y > yStart + 2; y--) {
        for (let x = Math.floor(width * 0.2); x < Math.floor(width * 0.8); x++) {
            const isGround = tileMap[y][x] > TILE.AIR && tileMap[y][x] !== 0;
            const isAirAbove = tileMap[y - 1]?.[x] === TILE.AIR && tileMap[y - 2]?.[x] === TILE.AIR;
            if (isGround && isAirAbove) {
                logger.log(`SPAWN trouvé : x=${x}, y=${y}, tuile=${tileMap[y][x]}`, 'success');
                // Spawn le joueur juste au-dessus de la tuile solide
                return { x: x * tileSize, y: (y - 1) * tileSize - playerHeight };
            }
        }
    }
    logger.error('AUCUN SPAWN SOLIDE TROUVÉ, fallback centre');
    return { x: worldCenter * tileSize, y: (yStart - 1) * tileSize - playerHeight };
}

// --- Logique de Jeu (Update & Draw) ---
const gameLogic = {
    init: async (assets) => {
        game.assets = assets;
        logger.success("🖼️ Assets chargés avec succès.");
        return true;
    },
    update: (delta, keys, mouse) => {
        // keep mouse state in sync with the engine so gameplay can react to clicks
        if (game) game.mouse = mouse;
        if (!game || !game.player || game.paused) return;
        
        // Mettre à jour tous les systèmes
        game.player.update(keys, game, delta);
        game.enemySpawner?.update(game, delta);
        game.enemies = game.enemySpawner?.getEnemies() || [];
        game.pnjs?.forEach(p => { if (typeof p.update === 'function') p.update(game, delta); });
        game.timeSystem?.update(delta);
        game.rpgInterface?.updateHUD();
        game.modularInterface?.updateHUD(game.player);
        game.ambianceSystem?.update(game, delta);
        game.equipmentManager?.updatePlayerStats();
        game.questManager?.update(game.player, game, delta);
        game.faunaSystem?.update(game, delta);
        game.controlsHUD?.update(delta);
        game.minimap?.update(game);
        game.performanceOptimizer?.update(delta);
        game.debugOverlay?.update(game, delta);
        logger.update(); // Mettre à jour le logger
        
        updateCamera();
    },
    draw: (ctx, assets, delta) => {
        // Log occasionnel pour vérifier que draw est appelé
        if (Math.random() < 0.001) {
            console.log('Draw: canvas=', ctx.canvas.width + 'x' + ctx.canvas.height, 'game=', !!game, 'player=', !!game?.player);
        }
        
        if (!game || !game.player) {
            // Dessiner un écran de test pour vérifier que le rendu fonctionne
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(0, 0, 100, 100);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px Arial';
            ctx.fillText('LOADING...', 10, 50);
            
            if (Math.random() < 0.01) {
                logger.log("Draw: game ou player manquant", 'error');
            }
            return;
        }
        
        // Couleur du ciel basée sur l'ambiance ou le système de temps
        const skyColor = game.ambianceSystem?.lightingSystem?.getSkyColor() || 
                        (game.timeSystem ? game.timeSystem.getSkyColor() : '#87CEEB');
        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.save();
        ctx.scale(config.zoom, config.zoom);
        ctx.translate(-game.camera.x, -game.camera.y);
        
        // Log de débogage pour le rendu
        if (Math.random() < 0.01) { // Log seulement 1% du temps pour éviter le spam
            logger.log(`Rendu: caméra(${game.camera.x.toFixed(1)}, ${game.camera.y.toFixed(1)}), joueur(${game.player.x.toFixed(1)}, ${game.player.y.toFixed(1)})`, 'debug');
        }
        
        drawWorld(ctx, assets);
        game.faunaSystem?.draw(ctx, assets, game.camera);
        game.enemies?.forEach(e => e.draw(ctx, assets));
        game.pnjs?.forEach(p => { if (typeof p.draw === 'function') p.draw(ctx, assets); });
        game.player.draw(ctx, assets);
        ctx.restore();
        
        // Dessiner les effets d'ambiance
        game.ambianceSystem?.draw(ctx);
        
        // Dessiner les interfaces
        game.rpgInterface?.draw(ctx);
        game.controlsHUD?.draw(ctx);
        game.minimap?.draw(ctx, game);

        // Dessiner l'overlay de debug
        game.debugOverlay?.draw(ctx);
        
        // Dessiner le logger par-dessus tout
        logger.draw(ctx);
    },
    // Sélection directe d'un outil
    selectTool: (index) => {
        if (game.modularInterface) {
            game.modularInterface.selectTool(index);
        } else if (game.player) {
            game.player.selectedToolIndex = index;
        }
    },
    // Changer d'outil via la molette ou d'autres commandes
    cycleTool: (direction) => {
        if (!game.player) return;
        const total = game.player.tools.length;
        const newIndex = (game.player.selectedToolIndex + direction + total) % total;
        if (game.modularInterface) {
            game.modularInterface.selectTool(newIndex);
        } else {
            game.player.selectedToolIndex = newIndex;
        }
    },
    isPaused: () => game.paused
};

function updateCamera() {
    const { zoom, worldWidth, worldHeight } = config;
    const canvasWidth = game.canvas.width;
    const canvasHeight = game.canvas.height;
    let targetX = game.player.x + game.player.w / 2 - canvasWidth / (2 * zoom);
    let targetY = game.player.y + game.player.h / 2 - canvasHeight / (2 * zoom);
    
    // Permettre à la caméra de suivre le joueur même s'il tombe en dessous de y=0
    game.camera.x = Math.max(0, Math.min(targetX, worldWidth - canvasWidth / zoom));
    game.camera.y = Math.min(targetY, worldHeight - canvasHeight / zoom); // Supprimé Math.max(0, ...)
    
    // Log occasionnel de la caméra
    if (Math.random() < 0.001) {
        logger.log(`Camera: target(${targetX.toFixed(1)}, ${targetY.toFixed(1)}) -> actual(${game.camera.x.toFixed(1)}, ${game.camera.y.toFixed(1)})`, 'debug');
    }
}

function drawWorld(ctx, assets) {
    const { tileSize, zoom } = config;
    const startX = Math.floor(game.camera.x / tileSize);
    const endX = startX + Math.ceil(ctx.canvas.width / tileSize / zoom) + 1;
    const startY = Math.floor(game.camera.y / tileSize);
    const endY = startY + Math.ceil(ctx.canvas.height / tileSize / zoom) + 1;

    // Log la position de la caméra et la première ligne de tuiles visibles (occasionnellement)
    if (startY < game.tileMap.length && Math.random() < 0.01) {
        logger.log(`DrawWorld: caméra(${game.camera.x}, ${game.camera.y}), zone(${startX}-${endX}, ${startY}-${endY})`, 'debug');
        logger.log(`Première ligne visible: [${game.tileMap[startY].slice(startX, Math.min(endX, startX + 10)).join(', ')}]`, 'debug');
    }

    // Mapping ID -> nom d'asset
    const tileIdToAsset = {
        0: null,
        1: 'tile_stone',
        2: 'tile_grass',
        3: 'tile_dirt',
        100: 'tile_stone',
        103: 'tile_grass',
        106: 'tile_cloud',
        112: 'tile_crystal',
        121: 'tile_sand',
        130: 'tile_hellstone',
    };
    
    let tilesDrawn = 0;
    for (let y = Math.max(0, startY); y < Math.min(game.tileMap.length, endY); y++) {
        for (let x = Math.max(0, startX); x < Math.min(game.tileMap[y].length, endX); x++) {
            const tileType = game.tileMap[y][x];
            if (tileType > TILE.AIR) {
                tilesDrawn++;
                const assetName = tileIdToAsset[tileType];
                const asset = assetName ? assets[assetName] : null;
                if (asset) {
                    ctx.drawImage(asset, x * tileSize, y * tileSize, tileSize, tileSize);
                } else {
                    // Log seulement la première fois qu'une texture manque
                    if (Math.random() < 0.001) {
                        logger.error(`Texture manquante pour tileType=${tileType} (assetName=${assetName})`);
                    }
                    const colors = { 
                        1: '#696969',   // STONE - gris
                        2: '#32CD32',   // GRASS - vert
                        3: '#8B4513',   // DIRT - marron
                        100: '#F0F8FF', // DIVINE_STONE - blanc bleuté
                        103: '#BFFF00', // autre grass - vert clair
                        106: '#E0FFFF', // CLOUD - blanc nuageux
                        112: '#9370DB', // CRYSTAL - violet
                        121: '#F4E285', // SAND - sable
                        130: '#8B0000'  // HELLSTONE - rouge foncé
                    };
                    ctx.fillStyle = colors[tileType] || '#CCCCCC';
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }
    }
    
    // Log occasionnel du nombre de tuiles dessinées
    if (Math.random() < 0.01) {
        logger.log(`DrawWorld: ${tilesDrawn} tuiles dessinées`, 'debug');
    }
}

// --- Fonctions de Scène ---
function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
}

function showLoadingScreen() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'flex';
    document.getElementById('gameContainer').style.display = 'none';
}

function showGame() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    resizeCanvas();
    
    // Ajouter un gestionnaire pour redimensionner le canvas
    window.addEventListener('resize', resizeCanvas);
}

// --- Point d'Entrée Principal ---
async function startGameSequence() {
    showLoadingScreen();
    
    const loadingStatus = document.getElementById('loadingStatus');
    const updateStatus = (msg) => {
        if(loadingStatus) loadingStatus.textContent = msg;
        logger.log(msg, 'init');
    };

    try {
        updateStatus("Chargement de la configuration...");
        // Charger la configuration depuis le fichier JSON
        try {
            const configResponse = await fetch('./config.json');
            const jsonConfig = await configResponse.json();
            // Fusionner avec la configuration par défaut
            Object.assign(config, jsonConfig);
            logger.log("Configuration chargée depuis config.json", 'success');
        } catch (e) {
            logger.warn("Impossible de charger config.json, utilisation de la configuration par défaut");
        }

        updateStatus("Initialisation du moteur...");
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) throw new Error("Canvas non trouvé!");
        resizeCanvas();
        engine = new GameEngine(canvas, config, logger);
        
        game = { config, canvas, ctx: canvas.getContext('2d'), paused: false, logger };
        window.game = game;
        game.camera = { x: 0, y: 0 };
        // Share the engine's mouse state with the game object so that
        // player actions like mining can react to mouse input
        game.mouse = engine.mouse;

        updateStatus("Génération du monde...");
        const worldWidth = Math.floor(config.worldWidth / config.tileSize);
        const worldHeight = Math.floor(config.worldHeight / config.tileSize);
        logger.log(`Génération du monde: ${worldWidth}x${worldHeight} tuiles`, 'debug');
        
        game.tileMap = generateLevel(worldWidth, worldHeight);
        
        // Stocker une référence au système de monde pour le debug
        if (window.worldSystem) {
            game.worldSystem = window.worldSystem;
        }
        
        // Log pour vérifier la génération de la map
        const nonAirTiles = game.tileMap.flat().filter(t => t !== 0).length;
        const totalTiles = game.tileMap.length * game.tileMap[0].length;
        logger.log(`Tiles générées: ${nonAirTiles} non-AIR / ${totalTiles} total (${(nonAirTiles/totalTiles*100).toFixed(1)}%)`, nonAirTiles > 0 ? 'success' : 'error');
        
        // Log des types de tuiles
        const tileCounts = {};
        game.tileMap.flat().forEach(t => tileCounts[t] = (tileCounts[t] || 0) + 1);
        logger.log(`Types de tuiles: ${JSON.stringify(tileCounts)}`, 'debug');
        
        // Vérifier la couche surface
        const surfaceStart = Math.floor(game.tileMap.length * 0.18);
        const surfaceEnd = Math.floor(game.tileMap.length * 0.5);
        logger.log(`Couche surface: lignes ${surfaceStart} à ${surfaceEnd}`, 'debug');
        
        updateStatus("Initialisation des systèmes RPG...");
        
        // Initialiser le gestionnaire de classes
        game.classManager = new CharacterClassManager();
        
        // Initialiser l'interface RPG modulaire
        game.modularInterface = new ModularRPGInterface();
        
        // Charger les paramètres sauvegardés
        game.modularInterface.loadSettings();
        
        // Initialiser le système d'ambiance
        game.ambianceSystem = new AmbianceSystem();
        
        // Initialiser le système d'ennemis
        game.enemySpawner = new EnemySpawner();
        
        // Initialiser le système de quêtes
        game.questManager = new QuestManager();
        
        // Initialiser le système de faune
        game.faunaSystem = new FaunaSystem(config);
        
        // Initialiser le HUD des contrôles
        game.controlsHUD = new ControlsHUD();
        
        // Initialiser la minimap
        game.minimap = new Minimap(config);

        // Initialiser l'optimiseur de performance
        game.performanceOptimizer = new PerformanceOptimizer();

        // Initialiser l'overlay de debug
        game.debugOverlay = new DebugOverlay();
        
        updateStatus("Sélection de classe...");
        
        // Déclencher l'affichage de la sélection de classe
        game.classManager.showClassSelection();
        
        // Timeout de sécurité pour éviter d'attendre indéfiniment
        let classSelectionTimeout = setTimeout(async () => {
            logger.warn("Timeout de sélection de classe, sélection automatique du guerrier");
            const { CharacterClass } = await import('./characterClasses.js');
            window.dispatchEvent(new CustomEvent('classSelected', { 
                detail: { 
                    classType: 'warrior',
                    classData: new CharacterClass('warrior')
                } 
            }));
        }, 10000); // 10 secondes
        
        // Attendre la sélection de classe avant de continuer
        await new Promise((resolve) => {
            const handleClassSelection = (event) => {
                clearTimeout(classSelectionTimeout); // Annuler le timeout
                const { classType, classData } = event.detail;
                
                updateStatus("Création de l'aventurier...");
                const spawnPoint = findSafeSpawnPoint(game.tileMap, config.player.height, config.tileSize);
                game.spawnPoint = spawnPoint;
                game.player = new Player(spawnPoint.x, spawnPoint.y, config, null);
                // Log la tuile sous le joueur
                const px = Math.floor(game.player.x / config.tileSize);
                const py = Math.floor(game.player.y / config.tileSize) + 2;
                logger.log(`Joueur spawn en x=${game.player.x}, y=${game.player.y}, tuile sous les pieds: ${game.tileMap[py]?.[px]}`, 'debug');
                // Centrer la caméra sur le joueur
                game.camera.x = game.player.x - game.canvas.width / (2 * config.zoom);
                game.camera.y = game.player.y - game.canvas.height / (2 * config.zoom);
                
                // Appliquer la classe sélectionnée
                game.player.characterClass = classData;
                const classStats = classData.calculateStats(1);
                
                // Mettre à jour les stats de base du joueur
                game.player.baseMaxHealth = classStats.health;
                game.player.baseMaxMana = classStats.mana;
                game.player.baseMaxStamina = classStats.stamina;
                game.player.maxHealth = classStats.health;
                game.player.maxMana = classStats.mana;
                game.player.maxStamina = classStats.stamina;
                game.player.health = classStats.health;
                game.player.mana = classStats.mana;
                game.player.stamina = classStats.stamina;
                
                // Appliquer les stats de classe
                game.player.stats.strength = classStats.strength;
                game.player.stats.defense = classStats.defense;
                game.player.stats.agility = classStats.agility;
                game.player.stats.intelligence = classStats.intelligence;
                game.player.stats.luck = classStats.luck;
                
                // Initialiser le gestionnaire d'équipement
                game.equipmentManager = new EquipmentManager(game.player);
                
                // Donner quelques objets de départ selon la classe
                game.equipmentManager.addToInventory('health_potion', 3);
                game.equipmentManager.addToInventory('mana_potion', 2);
                
                if (classType === CHARACTER_CLASSES.WARRIOR) {
                    game.equipmentManager.addToInventory('iron_sword', 1);
                    game.equipmentManager.addToInventory('leather_armor', 1);
                } else if (classType === CHARACTER_CLASSES.MAGE) {
                    game.equipmentManager.addToInventory('magic_staff', 1);
                    game.equipmentManager.addToInventory('mage_robe', 1);
                } else if (classType === CHARACTER_CLASSES.ROGUE) {
                    game.equipmentManager.addToInventory('assassin_dagger', 1);
                    game.equipmentManager.addToInventory('leather_armor', 1);
                } else if (classType === CHARACTER_CLASSES.PALADIN) {
                    game.equipmentManager.addToInventory('holy_mace', 1);
                    game.equipmentManager.addToInventory('chain_mail', 1);
                }

                // Journaliser les nouveautés dans la console
                setTimeout(() => {
                    logPatchNotes();
                }, 1000);

                window.removeEventListener('classSelected', handleClassSelection);
                resolve();
            };
            
            window.addEventListener('classSelected', handleClassSelection);
            game.classManager.showClassSelection();
        });

        updateStatus("Activation des systèmes...");
        game.rpgInterface = new RPGInterfaceManager();
        integrateAdvancedSystems(game);
        game.combatSystem = new CombatSystem();
        game.foodSystem = new FoodSystem();
        integrateMiningWithRPG(game);
        
        // Générer les ennemis dans le monde
        game.enemySpawner.generateRandomSpawns(game);
        game.enemies = game.enemySpawner.getEnemies();
        
        // Accepter automatiquement la première quête
        const starterQuest = game.questManager.getQuest('starter_quest');
        if (starterQuest) {
            game.questManager.acceptQuest('starter_quest', game.player);
        }

        updateStatus("Chargement des assets...");
        
        // Vérifier l'état du jeu avant de démarrer le moteur
        console.log('État avant démarrage moteur:');
        console.log('- game:', !!game);
        console.log('- game.player:', !!game?.player);
        console.log('- game.tileMap:', !!game?.tileMap);
        console.log('- game.camera:', game?.camera);
        
        await engine.start(gameLogic);

        showGame();
        // Vérification visibilité du canvas
        const canvasStyle = window.getComputedStyle(document.getElementById('gameCanvas'));
        logger.log(`Canvas display: ${canvasStyle.display}, visibility: ${canvasStyle.visibility}, opacity: ${canvasStyle.opacity}`, 'debug');
        
        // Notifications de bienvenue
        game.modularInterface.showNotification(`Bienvenue, ${game.player.characterClass.data.name} !`, "success");
        game.modularInterface.showNotification("Contrôles: WASD/Flèches=Bouger, Espace=Attaque, 1-6=Outils, Q/W=Compétences", "info", 8000);
        game.modularInterface.showNotification("Interface: Tab=Basculer, I=Inventaire, C=Personnage, J=Quêtes", "info", 6000);
        
        // Jouer l'ambiance de départ
        game.ambianceSystem.setAmbientMusic('ambient_forest');
        game.ambianceSystem.playSound('levelup'); // Son de début d'aventure
        
        // Configurer les contrôles
        setupGameControls(game);
        
        logger.log("Jeu démarré. Appuyez sur 'F2' pour le logger.", 'debug');

    } catch (error) {
        console.error("❌ Erreur fatale au démarrage:", error);
        if(loadingStatus) loadingStatus.innerHTML = `Erreur: ${error.message}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showMainMenu();
    
    document.getElementById('startGameBtn').onclick = () => {
        startGameSequence();
    };

    window.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            logger.toggleVisibility();
        }
    });

    window.addEventListener('resize', resizeCanvas);
});

// --- Fonctions de contrôles et sauvegarde ---
function setupGameControls(game) {
    // Gestionnaire d'événements clavier pour les interfaces
    document.addEventListener('keydown', (e) => {
        if (!game.player) return;
        
        switch(e.key.toLowerCase()) {
            case 'tab':
                e.preventDefault();
                game.modularInterface?.toggleInterface();
                break;
                
            case 'i':
                e.preventDefault();
                game.modularInterface?.toggleWindow('inventory');
                break;
                
            case 'c':
                e.preventDefault();
                game.modularInterface?.toggleWindow('character');
                break;
                
            case 'j':
                e.preventDefault();
                game.modularInterface?.toggleWindow('quests');
                break;
                
            case 'k':
                e.preventDefault();
                game.modularInterface?.toggleWindow('skills');
                break;
                
            case 'escape':
                e.preventDefault();
                game.modularInterface?.closeAllWindows();
                break;
                
            case 'f5':
                e.preventDefault();
                saveGame(game);
                break;
                
            case 'f9':
                e.preventDefault();
                loadGame(game);
                break;
                
            case 'm':
                e.preventDefault();
                const enabled = game.ambianceSystem?.toggle();
                game.modularInterface?.showNotification(
                    `Audio ${enabled ? 'activé' : 'désactivé'}`, 
                    'info'
                );
                break;
        }
    });
}

function saveGame(game) {
    try {
        const saveData = {
            player: {
                x: game.player.x,
                y: game.player.y,
                health: game.player.health,
                mana: game.player.mana,
                stamina: game.player.stamina,
                stats: game.player.stats,
                characterClass: game.player.characterClass?.data?.name,
                equipmentBonuses: game.player.equipmentBonuses
            },
            inventory: Array.from(game.equipmentManager?.inventory.entries() || []),
            equipment: game.equipmentManager?.equipment || {},
            quests: {
                active: Array.from(game.questManager?.activeQuests.keys() || []),
                completed: Array.from(game.questManager?.completedQuests || [])
            },
            timestamp: Date.now()
        };
        
        localStorage.setItem('rpg_game_save', JSON.stringify(saveData));
        game.modularInterface?.showNotification('Jeu sauvegardé !', 'success');
        console.log('🎮 Jeu sauvegardé');
    } catch (error) {
        console.error('❌ Erreur de sauvegarde:', error);
        game.modularInterface?.showNotification('Erreur de sauvegarde', 'error');
    }
}

function loadGame(game) {
    try {
        const saveData = localStorage.getItem('rpg_game_save');
        if (!saveData) {
            game.modularInterface?.showNotification('Aucune sauvegarde trouvée', 'error');
            return;
        }
        
        const data = JSON.parse(saveData);
        
        // Restaurer le joueur
        if (data.player) {
            game.player.x = data.player.x;
            game.player.y = data.player.y;
            game.player.health = data.player.health;
            game.player.mana = data.player.mana;
            game.player.stamina = data.player.stamina;
            game.player.stats = { ...game.player.stats, ...data.player.stats };
            game.player.equipmentBonuses = data.player.equipmentBonuses || {};
        }
        
        // Restaurer l'inventaire
        if (data.inventory && game.equipmentManager) {
            game.equipmentManager.inventory.clear();
            data.inventory.forEach(([key, value]) => {
                game.equipmentManager.inventory.set(key, value);
            });
        }
        
        // Restaurer l'équipement
        if (data.equipment && game.equipmentManager) {
            game.equipmentManager.equipment = data.equipment;
        }
        
        // Restaurer les quêtes
        if (data.quests && game.questManager) {
            // Réactiver les quêtes actives
            data.quests.active.forEach(questId => {
                game.questManager.acceptQuest(questId, game.player);
            });
            
            // Marquer les quêtes comme terminées
            data.quests.completed.forEach(questId => {
                game.questManager.completedQuests.add(questId);
            });
        }
        
        game.modularInterface?.showNotification('Jeu chargé !', 'success');
        console.log('🎮 Jeu chargé');
    } catch (error) {
        console.error('❌ Erreur de chargement:', error);
        game.modularInterface?.showNotification('Erreur de chargement', 'error');
    }
}