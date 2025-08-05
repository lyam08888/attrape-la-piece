// debugOverlay.js - Overlay de debug avec informations de performance

export class DebugOverlay {
    constructor() {
        this.visible = false;
        this.updateInterval = 0.5; // Mettre à jour toutes les 0.5 secondes
        this.lastUpdate = 0;
        this.cachedInfo = {};
    }

    toggle() {
        this.visible = !this.visible;
    }

    update(game, delta) {
        if (!this.visible) return;

        this.lastUpdate += delta;
        if (this.lastUpdate >= this.updateInterval) {
            this.updateCachedInfo(game);
            this.lastUpdate = 0;
        }
    }

    updateCachedInfo(game) {
        const player = game.player;
        const performanceInfo = game.performanceOptimizer?.getPerformanceInfo() || {};
        
        this.cachedInfo = {
            // Position du joueur
            playerX: player ? Math.floor(player.x) : 0,
            playerY: player ? Math.floor(player.y) : 0,
            playerTileX: player ? Math.floor(player.x / game.config.tileSize) : 0,
            playerTileY: player ? Math.floor(player.y / game.config.tileSize) : 0,
            
            // Performance
            fps: performanceInfo.fps || 0,
            qualityLevel: Math.floor((performanceInfo.qualityLevel || 1) * 100),
            
            // Entités
            animalCount: game.faunaSystem?.animals?.length || 0,
            animalLimit: performanceInfo.animalLimit || 0,
            
            // Monde
            worldWidth: Math.floor(game.config.worldWidth / game.config.tileSize),
            worldHeight: Math.floor(game.config.worldHeight / game.config.tileSize),
            
            // Caméra
            cameraX: game.camera ? Math.floor(game.camera.x) : 0,
            cameraY: game.camera ? Math.floor(game.camera.y) : 0,
            
            // Biome actuel
            currentBiome: this.getCurrentBiome(game),
            
            // Mémoire (approximative)
            cacheSize: performanceInfo.cacheSize || 0,
            exploredTiles: game.minimap?.exploredTiles?.size || 0
        };
    }

    getCurrentBiome(game) {
        if (!game.player || !game.worldSystem?.biomeMap) return 'Inconnu';
        
        const tileX = Math.floor(game.player.x / game.config.tileSize);
        const tileY = Math.floor(game.player.y / game.config.tileSize);
        
        const biome = game.worldSystem.biomeMap[tileY]?.[tileX];
        return biome?.name || 'Inconnu';
    }

    draw(ctx) {
        if (!this.visible) return;

        ctx.save();
        
        // Fond semi-transparent
        const panelWidth = 300;
        const panelHeight = 400;
        const x = ctx.canvas.width - panelWidth - 10;
        const y = 10;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, panelWidth, panelHeight);
        
        // Bordure
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, panelWidth, panelHeight);
        
        // Titre
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 16px VT323, monospace';
        ctx.fillText('DEBUG INFO', x + 10, y + 25);
        
        // Informations
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px VT323, monospace';
        
        const info = [
            '--- POSITION ---',
            `Joueur: (${this.cachedInfo.playerX}, ${this.cachedInfo.playerY})`,
            `Tuile: (${this.cachedInfo.playerTileX}, ${this.cachedInfo.playerTileY})`,
            `Caméra: (${this.cachedInfo.cameraX}, ${this.cachedInfo.cameraY})`,
            `Biome: ${this.cachedInfo.currentBiome}`,
            '',
            '--- PERFORMANCE ---',
            `FPS: ${this.cachedInfo.fps}`,
            `Qualité: ${this.cachedInfo.qualityLevel}%`,
            `Cache tuiles: ${this.cachedInfo.cacheSize}`,
            '',
            '--- ENTITÉS ---',
            `Animaux: ${this.cachedInfo.animalCount}/${this.cachedInfo.animalLimit}`,
            '',
            '--- MONDE ---',
            `Taille: ${this.cachedInfo.worldWidth}x${this.cachedInfo.worldHeight}`,
            `Exploré: ${this.cachedInfo.exploredTiles} tuiles`,
            '',
            '--- CONTRÔLES DEBUG ---',
            'F12: Basculer debug',
            'M: Basculer minimap',
            'F11: Plein écran',
            '',
            '--- STATS TECHNIQUES ---',
            `Canvas: ${ctx.canvas.width}x${ctx.canvas.height}`,
            `Zoom: ${window.game?.config?.zoom || 1}x`,
            `Tile size: ${window.game?.config?.tileSize || 16}px`
        ];
        
        let lineY = y + 45;
        info.forEach(line => {
            if (line.startsWith('---')) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 12px VT323, monospace';
            } else if (line === '') {
                lineY += 5;
                return;
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px VT323, monospace';
            }
            
            ctx.fillText(line, x + 10, lineY);
            lineY += 15;
        });
        
        // Graphique FPS simple
        this.drawFPSGraph(ctx, x + 10, y + panelHeight - 60, 280, 40);
        
        ctx.restore();
    }

    drawFPSGraph(ctx, x, y, width, height) {
        // Fond du graphique
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);
        
        // Bordure
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Ligne de référence 60 FPS
        const fps60Y = y + height - (60 / 120) * height;
        ctx.strokeStyle = '#FFD700';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(x, fps60Y);
        ctx.lineTo(x + width, fps60Y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Barre FPS actuelle
        const currentFPS = Math.min(120, this.cachedInfo.fps);
        const barHeight = (currentFPS / 120) * height;
        const barY = y + height - barHeight;
        
        // Couleur selon les performances
        if (currentFPS >= 50) {
            ctx.fillStyle = '#00FF00';
        } else if (currentFPS >= 30) {
            ctx.fillStyle = '#FFD700';
        } else {
            ctx.fillStyle = '#FF0000';
        }
        
        ctx.fillRect(x + width - 20, barY, 15, barHeight);
        
        // Texte FPS
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px VT323, monospace';
        ctx.fillText(`${currentFPS} FPS`, x + 5, y + 12);
        ctx.fillText('60', x + 5, fps60Y - 2);
    }
}