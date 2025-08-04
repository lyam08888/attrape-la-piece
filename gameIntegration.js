// gameIntegration.js - Intégration du monde complexe dans le jeu existant
import WorldIntegrationSystem from './worldIntegrationSystem.js';
import { createPanel } from './uiPanels.js';
import { AdvancedWorldGenerator } from './advancedWorldGenerator.js';
import { convertAdvancedWorldToBasic, enrichBasicWorldWithAdvancedData } from './worldIntegration.js';

// Fonction principale d'intégration
export function integrateComplexWorld(game, config) {
    if (!game || !config) {
        console.error("❌ Jeu ou configuration manquant pour l'intégration du monde complexe.");
        return null;
    }

    console.log("🔄 Intégration du monde complexe en cours...");

    // 1. Initialiser le générateur de monde avancé
    const advancedGenerator = new AdvancedWorldGenerator(config.seed || Date.now());
    game.advancedWorldGenerator = advancedGenerator; // Attacher au jeu
    console.log("    -> 🌍 Générateur de monde avancé prêt.");

    // 2. Générer les données du monde avancé
    const worldWidthInTiles = Math.floor(config.worldWidth / config.tileSize);
    const worldHeightInTiles = Math.floor(config.worldHeight / config.tileSize);

    // Le générateur avancé peut maintenant prendre plus de paramètres pour la variété
    const advancedWorldData = advancedGenerator.generateFullWorld(
        worldWidthInTiles,
        worldHeightInTiles,
        {
            temperature: 0.5, // Exemple de paramètre global
            humidity: 0.5,
            magic: 0.3
        }
    );
    console.log("    -> ✨ Données du monde avancé générées.");

    // 3. Convertir les données avancées en tileMap de base pour le moteur de jeu
    // Cette fonction doit exister dans `worldIntegration.js`
    game.tileMap = convertAdvancedWorldToBasic(advancedWorldData, worldWidthInTiles, worldHeightInTiles);
    console.log("    -> 🗺️ Monde de base (tileMap) créé à partir des données avancées.");
    
    // 4. Enrichir le monde de base avec des données complexes (biomes, etc.)
    // `game.worldData` contiendra des informations détaillées que les autres systèmes pourront utiliser
    game.worldData = enrichBasicWorldWithAdvancedData(game.tileMap, advancedWorldData);
    console.log("    ->  richer de données complexes (biomes, températures, etc.).");

    console.log("✅ Intégration du monde complexe terminée avec succès !");

    // Retourne un objet API pour interagir avec le monde intégré si nécessaire
    return {
        getAdvancedTileInfo: (x, y) => {
            // Placeholder pour une future fonction qui donne des détails sur une tuile
            return game.worldData?.advancedTiles?.[y]?.[x] || null;
        }
    };
}

// Fonction de rendu des éléments du monde complexe
function drawComplexWorldElements(ctx, game, assets) {
    // Dessiner les effets de destruction
    drawDestructionEffects(ctx, game);
    
    // Dessiner les transitions de biomes
    drawBiomeTransitions(ctx, game);
    
    // Dessiner les landmarks
    drawLandmarks(ctx, game, assets);
    
    // Dessiner les animaux intelligents avec des détails
    drawIntelligentAnimals(ctx, game, assets);
    
    // Dessiner les effets environnementaux
    drawEnvironmentalEffects(ctx, game);
}

function drawDestructionEffects(ctx, game) {
    if (!game.worldComplexSystem || !game.worldComplexSystem.destructionEvents) return;
    
    game.worldComplexSystem.destructionEvents.forEach(event => {
        const progress = (Date.now() - event.startTime) / event.duration;
        if (progress >= 1) return;
        
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        
        // Dessiner l'effet selon le type
        switch (event.type) {
            case 'explosion':
                drawExplosionEffect(ctx, event, progress);
                break;
            case 'earthquake':
                drawEarthquakeEffect(ctx, event, progress);
                break;
            case 'meteor':
                drawMeteorEffect(ctx, event, progress);
                break;
            case 'volcanic_eruption':
                drawVolcanicEffect(ctx, event, progress);
                break;
        }
        
        ctx.restore();
    });
}

function drawExplosionEffect(ctx, event, progress) {
    const radius = event.radius * (1 + progress * 2);
    
    // Cercle d'explosion
    ctx.beginPath();
    ctx.arc(event.x - game.camera.x, event.y - game.camera.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 100, 0, ${0.8 - progress * 0.8})`;
    ctx.fill();
    
    // Onde de choc
    ctx.beginPath();
    ctx.arc(event.x - game.camera.x, event.y - game.camera.y, radius * 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 200, 0, ${0.5 - progress * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawEarthquakeEffect(ctx, event, progress) {
    // Effet de tremblement visuel
    const intensity = event.intensity * (1 - progress);
    const offsetX = (Math.random() - 0.5) * intensity * 10;
    const offsetY = (Math.random() - 0.5) * intensity * 10;
    
    ctx.translate(offsetX, offsetY);
    
    // Fissures dans le sol
    ctx.strokeStyle = `rgba(139, 69, 19, ${0.8 - progress * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5;
        const length = event.radius * (0.5 + Math.random() * 0.5);
        const startX = event.x - game.camera.x;
        const startY = event.y - game.camera.y;
        const endX = startX + Math.cos(angle) * length;
        const endY = startY + Math.sin(angle) * length;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
    }
    
    ctx.stroke();
}

function drawMeteorEffect(ctx, event, progress) {
    // Traînée de météore
    const trailLength = 100;
    const meteorX = event.x - game.camera.x;
    const meteorY = event.y - game.camera.y - (1 - progress) * 200;
    
    ctx.strokeStyle = `rgba(255, 165, 0, ${0.8 - progress * 0.8})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(meteorX, meteorY - trailLength);
    ctx.lineTo(meteorX, meteorY);
    ctx.stroke();
    
    // Météore
    ctx.fillStyle = `rgba(255, 69, 0, ${1 - progress * 0.5})`;
    ctx.beginPath();
    ctx.arc(meteorX, meteorY, 8, 0, Math.PI * 2);
    ctx.fill();
}

function drawVolcanicEffect(ctx, event, progress) {
    // Éruption volcanique
    const eruptionHeight = event.radius * 2 * (1 - progress);
    const baseX = event.x - game.camera.x;
    const baseY = event.y - game.camera.y;
    
    // Lave qui jaillit
    ctx.fillStyle = `rgba(255, 87, 34, ${0.9 - progress * 0.9})`;
    ctx.beginPath();
    ctx.ellipse(baseX, baseY - eruptionHeight/2, 20, eruptionHeight/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Particules de lave
    for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * event.radius;
        const particleX = baseX + Math.cos(angle) * distance;
        const particleY = baseY + Math.sin(angle) * distance - Math.random() * eruptionHeight;
        
        ctx.fillStyle = `rgba(255, 152, 0, ${0.7 - progress * 0.7})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawBiomeTransitions(ctx, game) {
    if (!game.biomeSystem || !game.biomeSystem.transitionZones) return;
    
    game.biomeSystem.transitionZones.forEach(transition => {
        const screenX = transition.x - game.camera.x;
        const screenY = transition.y - game.camera.y;
        
        // Vérifier si visible
        if (screenX + transition.width < 0 || screenX > game.canvas.width ||
            screenY + transition.height < 0 || screenY > game.canvas.height) {
            return;
        }
        
        // Effet de transition visuel
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        const gradient = ctx.createLinearGradient(
            screenX, screenY,
            screenX + transition.width, screenY + transition.height
        );
        
        gradient.addColorStop(0, getBiomeColor(transition.from));
        gradient.addColorStop(1, getBiomeColor(transition.to));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX, screenY, transition.width, transition.height);
        
        ctx.restore();
    });
}

function getBiomeColor(biome) {
    const colors = {
        'PARADISE_MEADOW': 'rgba(255, 228, 181, 0.5)',
        'CRYSTAL_CAVES': 'rgba(225, 190, 231, 0.5)',
        'FLOATING_ISLANDS': 'rgba(135, 206, 235, 0.5)',
        'TEMPERATE_FOREST': 'rgba(34, 139, 34, 0.5)',
        'TROPICAL_JUNGLE': 'rgba(0, 100, 0, 0.5)',
        'ARID_DESERT': 'rgba(244, 164, 96, 0.5)',
        'FROZEN_TUNDRA': 'rgba(176, 224, 230, 0.5)',
        'VOLCANIC_WASTELAND': 'rgba(255, 69, 0, 0.5)',
        'DEEP_CAVERNS': 'rgba(47, 47, 47, 0.5)',
        'CRYSTAL_CORE': 'rgba(147, 112, 219, 0.5)',
        'INFERNAL_DEPTHS': 'rgba(139, 0, 0, 0.5)',
        'CORAL_REEF': 'rgba(65, 105, 225, 0.5)',
        'ABYSSAL_DEPTHS': 'rgba(25, 25, 112, 0.5)'
    };
    
    return colors[biome] || 'rgba(255, 255, 255, 0.5)';
}

function drawLandmarks(ctx, game, assets) {
    if (!game.explorationSystem || !game.explorationSystem.landmarks) return;
    
    game.explorationSystem.landmarks.forEach(landmark => {
        const screenX = landmark.position.x - game.camera.x;
        const screenY = landmark.position.y - game.camera.y;
        
        // Vérifier si visible
        if (screenX < -50 || screenX > game.canvas.width + 50 ||
            screenY < -50 || screenY > game.canvas.height + 50) {
            return;
        }
        
        // Icône du landmark
        ctx.save();
        
        if (landmark.discovered) {
            ctx.fillStyle = '#FFD700';
        } else {
            ctx.fillStyle = '#888888';
        }
        
        // Dessiner l'icône selon le type
        drawLandmarkIcon(ctx, screenX, screenY, landmark.type);
        
        // Effet de brillance pour les landmarks non découverts
        if (!landmark.discovered && Math.sin(Date.now() * 0.005) > 0.5) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    });
}

function drawLandmarkIcon(ctx, x, y, type) {
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const icons = {
        'ancient_ruins': '🏛️',
        'crystal_formation': '💎',
        'giant_tree': '🌳',
        'mysterious_portal': '🌀',
        'floating_island': '🏝️',
        'underground_lake': '🌊',
        'volcanic_crater': '🌋',
        'ice_cavern': '❄️',
        'golden_statue': '🗿',
        'energy_nexus': '⚡',
        'time_rift': '⏰',
        'dimensional_gate': '🚪'
    };
    
    const icon = icons[type] || '❓';
    ctx.fillText(icon, x, y);
}

function drawIntelligentAnimals(ctx, game, assets) {
    if (!game.animals) return;
    
    game.animals.forEach(animal => {
        const screenX = animal.x - game.camera.x;
        const screenY = animal.y - game.camera.y;
        
        // Vérifier si visible
        if (screenX < -animal.w || screenX > game.canvas.width + animal.w ||
            screenY < -animal.h || screenY > game.canvas.height + animal.h) {
            return;
        }
        
        ctx.save();
        
        // Dessiner l'animal avec son asset si disponible
        const assetName = animal.type;
        const animalAsset = assets[assetName];
        
        if (animalAsset) {
            // Flip horizontal selon la direction
            if (animal.direction === -1) {
                ctx.scale(-1, 1);
                ctx.drawImage(animalAsset, -screenX - animal.w, screenY, animal.w, animal.h);
            } else {
                ctx.drawImage(animalAsset, screenX, screenY, animal.w, animal.h);
            }
        } else {
            // Fallback avec couleur
            ctx.fillStyle = animal.color || '#8B4513';
            ctx.fillRect(screenX, screenY, animal.w, animal.h);
            
            // Yeux simples
            ctx.fillStyle = '#000000';
            const eyeY = screenY + animal.h * 0.3;
            const eyeSize = 2;
            ctx.fillRect(screenX + animal.w * 0.2, eyeY, eyeSize, eyeSize);
            ctx.fillRect(screenX + animal.w * 0.7, eyeY, eyeSize, eyeSize);
        }
        
        // Indicateurs d'état
        drawAnimalStateIndicators(ctx, animal, screenX, screenY);
        
        ctx.restore();
    });
}

function drawAnimalStateIndicators(ctx, animal, screenX, screenY) {
    // Barre de santé si blessé
    if (animal.health < animal.maxHealth) {
        const barWidth = animal.w;
        const barHeight = 3;
        const barY = screenY - 8;
        
        // Fond rouge
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(screenX, barY, barWidth, barHeight);
        
        // Santé verte
        ctx.fillStyle = '#00ff00';
        const healthPercent = animal.health / animal.maxHealth;
        ctx.fillRect(screenX, barY, barWidth * healthPercent, barHeight);
    }
    
    // Indicateur d'état
    if (animal.ai && animal.ai.state) {
        const stateIcons = {
            'fleeing': '💨',
            'hunting': '🎯',
            'migrating': '✈️',
            'socializing': '💕'
        };
        
        const icon = stateIcons[animal.ai.state];
        if (icon) {
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(icon, screenX + animal.w/2, screenY - 15);
        }
    }
}

function drawEnvironmentalEffects(ctx, game) {
    // Dessiner les effets météorologiques
    if (game.weatherSystem && game.weatherSystem.currentWeather) {
        drawWeatherEffects(ctx, game);
    }
    
    // Dessiner les effets de biome
    drawBiomeEffects(ctx, game);
}

function drawWeatherEffects(ctx, game) {
    const weather = game.weatherSystem.currentWeather;
    
    switch (weather) {
        case 'rain':
            drawRainEffect(ctx, game);
            break;
        case 'snow':
            drawSnowEffect(ctx, game);
            break;
        case 'sandstorm':
            drawSandstormEffect(ctx, game);
            break;
        case 'aurora':
            drawAuroraEffect(ctx, game);
            break;
    }
}

function drawRainEffect(ctx, game) {
    ctx.strokeStyle = 'rgba(173, 216, 230, 0.6)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * game.canvas.width;
        const y = (Math.random() * game.canvas.height - Date.now() * 0.5) % game.canvas.height;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y + 10);
        ctx.stroke();
    }
}

function drawSnowEffect(ctx, game) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * game.canvas.width;
        const y = (Math.random() * game.canvas.height - Date.now() * 0.1) % game.canvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSandstormEffect(ctx, game) {
    ctx.fillStyle = 'rgba(244, 164, 96, 0.3)';
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    
    // Particules de sable
    ctx.fillStyle = 'rgba(210, 180, 140, 0.6)';
    for (let i = 0; i < 80; i++) {
        const x = (Math.random() * game.canvas.width + Date.now() * 0.2) % game.canvas.width;
        const y = Math.random() * game.canvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawAuroraEffect(ctx, game) {
    const gradient = ctx.createLinearGradient(0, 0, 0, game.canvas.height * 0.5);
    gradient.addColorStop(0, 'rgba(0, 255, 127, 0.3)');
    gradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height * 0.5);
}

function drawBiomeEffects(ctx, game) {
    if (!game.biomeSystem || !game.player) return;
    
    const currentBiome = game.biomeSystem.getBiomeAt(game, game.player.x, game.player.y);
    const biomeData = game.biomeSystem.getBiomeData(currentBiome);
    
    if (!biomeData) return;
    
    // Effets visuels selon le biome
    switch (currentBiome) {
        case 'CRYSTAL_CAVES':
            drawCrystalGlow(ctx, game);
            break;
        case 'INFERNAL_DEPTHS':
            drawHellishGlow(ctx, game);
            break;
        case 'PARADISE_MEADOW':
            drawParadiseSparkles(ctx, game);
            break;
    }
}

function drawCrystalGlow(ctx, game) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.shadowColor = '#E1BEE7';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(225, 190, 231, 0.1)';
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    ctx.restore();
}

function drawHellishGlow(ctx, game) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    const gradient = ctx.createRadialGradient(
        game.canvas.width/2, game.canvas.height,
        0, game.canvas.width/2, game.canvas.height,
        game.canvas.height
    );
    gradient.addColorStop(0, 'rgba(255, 69, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
    ctx.restore();
}

function drawParadiseSparkles(ctx, game) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * game.canvas.width;
        const y = Math.random() * game.canvas.height;
        const size = 1 + Math.sin(Date.now() * 0.01 + i) * 0.5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Ajouter des commandes de débogage
function addDebugCommands(game, worldIntegration) {
    // Commandes de console pour le débogage
    window.complexWorld = {
        // Déclencher un événement naturel
        triggerEvent: (type) => {
            worldIntegration.forceNaturalEvent(game, type);
        },
        
        // Spawner des animaux de test
        spawnAnimals: (count) => {
            return worldIntegration.spawnTestAnimals(game, count);
        },
        
        // Générer un landmark de test
        generateLandmark: () => {
            worldIntegration.generateTestLandmark(game);
        },
        
        // Obtenir les statistiques du monde
        getStats: () => {
            return worldIntegration.getWorldStats();
        },
        
        // Obtenir le statut du système
        getStatus: () => {
            return worldIntegration.getSystemStatus();
        },
        
        // Changer de biome
        changeBiome: (biome) => {
            if (game.explorationSystem) {
                game.explorationSystem.changeBiome(game, game.player.x, game.player.y, {
                    specialAbilities: ['biome_change']
                });
            }
        }
    };
    
    console.log('🔧 Commandes de débogage disponibles dans window.complexWorld');
}

// Ajouter l'interface utilisateur
function addComplexWorldUI(game, worldIntegration) {
    // Ajouter des éléments UI pour le monde complexe
    const hudElement = document.getElementById('hud');
    if (!hudElement) return;
    
    // Panneau d'informations du monde complexe
    const worldInfoPanel = createPanel('worldInfoPanel', 'MONDE COMPLEXE', '');
    hudElement.appendChild(worldInfoPanel);

    // Activer les fonctionnalités de module
    window.makeDraggable?.(worldInfoPanel);
    window.makeResizable?.(worldInfoPanel);
    window.setupMinimize?.(worldInfoPanel);

    // Mettre à jour le panneau périodiquement
    setInterval(() => {
        updateWorldInfoPanel(game, worldIntegration, worldInfoPanel);
    }, 1000);
}

function updateWorldInfoPanel(game, worldIntegration, panel) {
    if (!game.player || !game.biomeSystem) return;

    const content = panel.querySelector('.panel-content') || panel;

    const currentBiome = game.biomeSystem.getBiomeAt(game, game.player.x, game.player.y);
    const biomeData = game.biomeSystem.getBiomeData(currentBiome);
    const stats = worldIntegration.getWorldStats();
    const progress = game.explorationSystem?.getExplorationProgress();

    content.innerHTML = `
        <div><strong>Biome:</strong> ${biomeData?.name || 'Inconnu'}</div>
        <div><strong>Température:</strong> ${biomeData?.temperature || 0}°C</div>
        <div><strong>Humidité:</strong> ${Math.round((biomeData?.humidity || 0) * 100)}%</div>
        <div><strong>Danger:</strong> ${biomeData?.dangerLevel || 0}/6</div>
        <hr>
        <div><strong>Biomes découverts:</strong> ${progress?.biomesDiscovered?.length || 0}</div>
        <div><strong>Landmarks trouvés:</strong> ${progress?.landmarksFound?.length || 0}</div>
        <div><strong>Secrets débloqués:</strong> ${progress?.secretsUnlocked?.length || 0}</div>
        <div><strong>Distance parcourue:</strong> ${Math.round((progress?.totalDistance || 0) / 100)}m</div>
        <hr>
        <div><strong>Animaux actifs:</strong> ${game.animals?.length || 0}</div>
        <div><strong>Destructions:</strong> ${stats.totalDestructions}</div>
        <div><strong>Structures:</strong> ${stats.structuresBuilt}</div>
    `;
}

// Export des fonctions utilitaires
export {
    drawComplexWorldElements,
    addDebugCommands,
    addComplexWorldUI,
    getBiomeColor
};