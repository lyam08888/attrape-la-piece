// gameConfig.js - Configuration centralisée du jeu RPG

export const GAME_CONFIG = {
    // Configuration du monde
    world: {
        width: 2000,
        height: 1200,
        tileSize: 20,
        gravity: 0.8,
        maxFallSpeed: 15
    },
    
    // Configuration du joueur
    player: {
        width: 16,
        height: 20,
        speed: 4,
        jumpPower: 12,
        maxHealth: 100,
        maxMana: 50,
        maxStamina: 80,
        regenRate: {
            health: 0.5,  // HP par seconde
            mana: 1.0,    // MP par seconde
            stamina: 2.0  // Stamina par seconde
        }
    },
    
    // Configuration du combat
    combat: {
        attackRange: 40,
        attackCooldown: 500, // ms
        criticalChanceBase: 5, // %
        damageVariation: 0.2 // ±20%
    },
    
    // Configuration des ennemis
    enemies: {
        maxCount: 20,
        spawnInterval: 5000, // ms
        detectionRange: 80,
        attackRange: 25,
        spawnDistance: 100 // Distance minimale du joueur pour spawn
    },
    
    // Configuration de l'interface
    interface: {
        hudHeight: 120,
        windowMinWidth: 300,
        windowMinHeight: 200,
        notificationDuration: 3000, // ms
        tooltipDelay: 500 // ms
    },
    
    // Configuration de l'ambiance
    ambiance: {
        particleMaxCount: 100,
        weatherChangeInterval: 30000, // ms
        dayNightCycleDuration: 1440000, // ms (24 minutes = 1 jour)
        soundVolume: 0.7,
        musicVolume: 0.5
    },
    
    // Configuration des quêtes
    quests: {
        maxActiveQuests: 10,
        autoCompleteDelay: 1000, // ms
        notificationDuration: 4000 // ms
    },
    
    // Configuration de l'équipement
    equipment: {
        inventorySize: 40,
        maxStackSize: 99,
        rarityColors: {
            common: '#FFFFFF',
            uncommon: '#4CAF50',
            rare: '#2196F3',
            epic: '#9C27B0',
            legendary: '#FF9800',
            mythic: '#F44336'
        }
    },
    
    // Configuration des contrôles
    controls: {
        keys: {
            moveLeft: ['ArrowLeft', 'a', 'A'],
            moveRight: ['ArrowRight', 'd', 'D'],
            jump: ['ArrowUp', 'w', 'W', ' '],
            crouch: ['ArrowDown', 's', 'S'],
            attack: [' ', 'Enter'],
            interact: ['e', 'E'],
            inventory: ['i', 'I'],
            character: ['c', 'C'],
            quests: ['j', 'J'],
            skills: ['k', 'K'],
            quickSlot1: ['1'],
            quickSlot2: ['2'],
            quickSlot3: ['3'],
            quickSlot4: ['4'],
            skill1: ['q', 'Q'],
            skill2: ['w', 'W'],
            toggleInterface: ['Tab'],
            closeWindows: ['Escape'],
            save: ['F5'],
            load: ['F9'],
            toggleAudio: ['m', 'M']
        }
    },
    
    // Configuration de la physique
    physics: {
        gravity: 0.8,
        maxFallSpeed: 15,
        groundAcceleration: 0.4,
        airAcceleration: 0.2,
        friction: 0.85,
        airResistance: 0.98,
        jumpPower: 12,
        doubleJumpPower: 10
    },
    
    // Configuration du système de minage
    mining: {
        baseTime: 1.0, // secondes
        toolEfficiency: {
            tool_pickaxe: 1.0,
            tool_axe: 0.8,
            tool_shovel: 1.2
        },
        durabilityLoss: 1,
        xpPerBlock: 5
    },
    
    // Configuration des classes de personnage
    classes: {
        statPointsPerLevel: 2,
        skillPointsPerLevel: 1,
        maxLevel: 50,
        xpMultiplier: 1.2 // Multiplicateur d'XP par niveau
    },
    
    // Configuration de la sauvegarde
    save: {
        autoSaveInterval: 300000, // 5 minutes
        maxSaveSlots: 3,
        compressionEnabled: true
    },
    
    // Configuration du debug
    debug: {
        showFPS: false,
        showCollisionBoxes: false,
        showAIStates: false,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        enableConsoleCommands: true
    }
};

// Fonctions utilitaires pour la configuration
export class ConfigManager {
    static get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], GAME_CONFIG);
    }
    
    static set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, GAME_CONFIG);
        target[lastKey] = value;
    }
    
    static save() {
        try {
            localStorage.setItem('game_config', JSON.stringify(GAME_CONFIG));
            return true;
        } catch (error) {
            console.error('Erreur de sauvegarde de la configuration:', error);
            return false;
        }
    }
    
    static load() {
        try {
            const saved = localStorage.getItem('game_config');
            if (saved) {
                const config = JSON.parse(saved);
                Object.assign(GAME_CONFIG, config);
                return true;
            }
        } catch (error) {
            console.error('Erreur de chargement de la configuration:', error);
        }
        return false;
    }
    
    static reset() {
        localStorage.removeItem('game_config');
        // Recharger la configuration par défaut
        window.location.reload();
    }
    
    static isKeyPressed(action, key) {
        const actionKeys = this.get(`controls.keys.${action}`) || [];
        return actionKeys.includes(key);
    }
}

// Constantes globales
export const TILE_TYPES = {
    AIR: 0,
    DIRT: 1,
    STONE: 2,
    GRASS: 3,
    WOOD: 4,
    LEAVES: 5,
    WATER: 6,
    SAND: 7,
    COAL: 8,
    IRON: 9,
    GOLD: 10,
    DIAMOND: 11
};

export const WEATHER_TYPES = {
    CLEAR: 'clear',
    RAIN: 'rain',
    SNOW: 'snow',
    FOG: 'fog',
    STORM: 'storm'
};

export const GAME_STATES = {
    MENU: 'menu',
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    INVENTORY: 'inventory',
    GAME_OVER: 'game_over'
};

export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Validation de la configuration
export function validateConfig() {
    const errors = [];
    
    // Vérifier les valeurs critiques
    if (GAME_CONFIG.world.width <= 0 || GAME_CONFIG.world.height <= 0) {
        errors.push('Dimensions du monde invalides');
    }
    
    if (GAME_CONFIG.player.speed <= 0) {
        errors.push('Vitesse du joueur invalide');
    }
    
    if (GAME_CONFIG.enemies.maxCount < 0) {
        errors.push('Nombre maximum d\'ennemis invalide');
    }
    
    if (errors.length > 0) {
        console.error('Erreurs de configuration:', errors);
        return false;
    }
    
    return true;
}

// Initialisation de la configuration
export function initializeConfig() {
    // Charger la configuration sauvegardée
    ConfigManager.load();
    
    // Valider la configuration
    if (!validateConfig()) {
        console.warn('Configuration invalide, utilisation des valeurs par défaut');
        ConfigManager.reset();
    }
    
    console.log('🎮 Configuration initialisée');
    return GAME_CONFIG;
}