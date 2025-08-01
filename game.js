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
import { DisasterManager } from './disasterManager.js'; // NOUVEL IMPORT

// ... (Classes Monster et Animal inchangées)

document.addEventListener('DOMContentLoaded', async () => {
    // ... (initialisation du canvas, config, ui, etc. inchangée)
    
    let game = {};
    let disasterManager; // NOUVELLE VARIABLE
    // ... (autres variables globales inchangées)

    function initGame() {
        try {
            // ... (début de la fonction initGame inchangé)
            
            game = {
                // ... (propriétés du jeu inchangées)
                worldLayers: {},
                lightningFlash: 0, // Pour les éclairs
                triggerCameraShake: (intensity, duration) => triggerCameraShake(intensity, duration), // Pour les tremblements de terre
                // ... (le reste des propriétés)
            };
            
            generateLevel(game, config, {});
            game.worldLayers = WORLD_LAYERS;
            disasterManager = new DisasterManager(game); // NOUVEAU: Initialiser le manager

            // ... (le reste de la fonction initGame est inchangé)
        } catch (error) { logger.error(`Erreur init: ${error.message}`); }
    }

    function update(keys, mouse) {
        // ... (début de la fonction update inchangé)
        try {
            updatePlayerBiome();
            updateBiomePhysics(game);
            disasterManager.update(); // NOUVEAU: Mettre à jour les catastrophes

            // ... (le reste de la fonction update est inchangé)
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
            // ... (dessin des autres éléments)
            
            disasterManager.draw(ctx); // NOUVEAU: Dessiner les effets de catastrophe

            if (game.lightningFlash > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${game.lightningFlash})`;
                ctx.fillRect(game.camera.x, game.camera.y, canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
                game.lightningFlash -= 0.05;
            }
            
            ctx.restore();
        }
        ctx.restore();

        updateHUD();
        updateToolbarUI();
        updateDebug();
        logger.draw(ctx, canvas);
    }

    function drawSky(ctx) {
        if (disasterManager && disasterManager.activeDisaster?.type === 'thunderstorm') {
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(0, 0, canvas.clientWidth / gameSettings.zoom, canvas.clientHeight / gameSettings.zoom);
            return;
        }
        // ... (le reste de la fonction drawSky est inchangé)
    }

    // ... (toutes les autres fonctions restent les mêmes)

    const gameLogic = { /* ... */ };
    const engine = new GameEngine(canvas, config);
    engine.start(gameLogic);
});
