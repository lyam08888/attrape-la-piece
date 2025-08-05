// game.js - Ce fichier est maintenant principalement un point d'entrée pour les modules plus anciens.
// La logique principale d'initialisation et de boucle de jeu a été déplacée dans `index.html` pour une meilleure gestion des dépendances et des erreurs.

// Importations nécessaires pour que d'autres modules puissent y accéder via `game.js` si nécessaire.
import { GameEngine } from './engine.js';
import { Player } from './player.js';
import { TILE, generateLevel, ensureWorldColumns } from './world.js';
import { AdvancedNPCSystem } from './advancedNPCSystem.js';
const PNJ = AdvancedNPCSystem?.PNJ || function() { throw new Error('PNJ non disponible'); };
import { generatePNJ } from './generateurPNJ.js';
import { updateGravity } from './miningEngine.js';
import { ParticleSystem as ParticleSystemFX } from './fx.js';
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
import { RPGInterfaceManager } from './rpgInterfaceManager.js';
import { integrateMiningWithRPG } from './miningEngine.js';

console.log("game.js a été chargé, mais l'initialisation est gérée par index.html");

// Exporter les modules pour assurer la compatibilité avec les anciens imports
export {
    GameEngine,
    Player,
    TILE,
    generateLevel,
    ensureWorldColumns,
    PNJ,
    generatePNJ,
    updateGravity,
    ParticleSystem,
    WorldAnimator,
    TimeSystem,
    Logger,
    getItemIcon,
    SoundManager,
    integrateComplexWorld,
    UIManager,
    WindowManager,
    AdvancedWorldGenerator,
    AdvancedRenderer,
    AdvancedNPCSystem,
    integrateAdvancedSystems,
    RPGInterfaceManager,
    integrateMiningWithRPG
};