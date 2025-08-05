// performanceOptimizer.js - Optimisations de performance pour le jeu

export class PerformanceOptimizer {
    constructor() {
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.fps = 60;
        this.targetFPS = 60;
        this.adaptiveQuality = true;
        this.qualityLevel = 1.0; // 1.0 = qualité maximale, 0.5 = qualité réduite
        
        // Cache pour les assets
        this.assetCache = new Map();
        this.tileCache = new Map();
        
        // Optimisations de rendu
        this.cullingEnabled = true;
        this.particleLimit = 100;
        this.animalLimit = 30;
    }

    update(delta) {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFPSUpdate > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = now;
            
            // Ajuster la qualité automatiquement
            if (this.adaptiveQuality) {
                this.adjustQuality();
            }
        }
    }

    adjustQuality() {
        if (this.fps < 30) {
            // Performance faible - réduire la qualité
            this.qualityLevel = Math.max(0.3, this.qualityLevel - 0.1);
            this.particleLimit = Math.max(20, this.particleLimit - 10);
            this.animalLimit = Math.max(10, this.animalLimit - 5);
        } else if (this.fps > 50 && this.qualityLevel < 1.0) {
            // Performance bonne - augmenter la qualité
            this.qualityLevel = Math.min(1.0, this.qualityLevel + 0.05);
            this.particleLimit = Math.min(100, this.particleLimit + 5);
            this.animalLimit = Math.min(30, this.animalLimit + 2);
        }
    }

    shouldRenderTile(x, y, camera, canvasWidth, canvasHeight, tileSize, zoom) {
        if (!this.cullingEnabled) return true;
        
        const screenX = x * tileSize - camera.x;
        const screenY = y * tileSize - camera.y;
        
        // Culling avec marge pour éviter les artefacts
        const margin = tileSize * 2;
        return screenX > -margin && 
               screenX < canvasWidth / zoom + margin &&
               screenY > -margin && 
               screenY < canvasHeight / zoom + margin;
    }

    shouldRenderAnimal(animal, camera, canvasWidth, canvasHeight, zoom) {
        const screenX = animal.x - camera.x;
        const screenY = animal.y - camera.y;
        
        const margin = 50;
        return screenX > -margin && 
               screenX < canvasWidth / zoom + margin &&
               screenY > -margin && 
               screenY < canvasHeight / zoom + margin;
    }

    optimizeParticles(particles) {
        // Limiter le nombre de particules
        if (particles.length > this.particleLimit) {
            particles.splice(0, particles.length - this.particleLimit);
        }
        
        return particles;
    }

    optimizeAnimals(animals) {
        // Limiter le nombre d'animaux actifs
        if (animals.length > this.animalLimit) {
            // Garder les animaux les plus proches du joueur
            animals.sort((a, b) => {
                const distA = Math.hypot(a.x - window.game?.player?.x || 0, a.y - window.game?.player?.y || 0);
                const distB = Math.hypot(b.x - window.game?.player?.x || 0, b.y - window.game?.player?.y || 0);
                return distA - distB;
            });
            
            return animals.slice(0, this.animalLimit);
        }
        
        return animals;
    }

    getCachedTile(tileType, tileSize) {
        const key = `${tileType}_${tileSize}`;
        
        if (this.tileCache.has(key)) {
            return this.tileCache.get(key);
        }
        
        // Créer une version mise en cache de la tuile
        const canvas = document.createElement('canvas');
        canvas.width = tileSize;
        canvas.height = tileSize;
        const ctx = canvas.getContext('2d');
        
        // Dessiner la tuile de base
        const colors = {
            1: '#696969',   // STONE
            2: '#32CD32',   // GRASS
            3: '#8B4513',   // DIRT
            100: '#F0F8FF', // DIVINE_STONE
            106: '#E0FFFF', // CLOUD
            112: '#9370DB', // CRYSTAL
            121: '#F4E285', // SAND
            130: '#8B0000'  // HELLSTONE
        };
        
        ctx.fillStyle = colors[tileType] || '#CCCCCC';
        ctx.fillRect(0, 0, tileSize, tileSize);
        
        // Ajouter des détails selon la qualité
        if (this.qualityLevel > 0.7) {
            this.addTileDetails(ctx, tileType, tileSize);
        }
        
        this.tileCache.set(key, canvas);
        return canvas;
    }

    addTileDetails(ctx, tileType, tileSize) {
        // Ajouter des détails visuels aux tuiles
        switch (tileType) {
            case 1: // STONE
                ctx.fillStyle = 'rgba(105, 105, 105, 0.3)';
                for (let i = 0; i < 3; i++) {
                    const x = Math.random() * tileSize;
                    const y = Math.random() * tileSize;
                    ctx.fillRect(x, y, 2, 2);
                }
                break;
                
            case 2: // GRASS
                ctx.fillStyle = 'rgba(0, 100, 0, 0.5)';
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * tileSize;
                    const y = Math.random() * (tileSize / 2);
                    ctx.fillRect(x, y, 1, 3);
                }
                break;
                
            case 112: // CRYSTAL
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fillRect(tileSize/4, tileSize/4, tileSize/2, tileSize/2);
                break;
        }
    }

    getPerformanceInfo() {
        return {
            fps: this.fps,
            qualityLevel: this.qualityLevel,
            particleLimit: this.particleLimit,
            animalLimit: this.animalLimit,
            cacheSize: this.tileCache.size
        };
    }

    clearCache() {
        this.tileCache.clear();
        this.assetCache.clear();
    }

    setQuality(level) {
        this.qualityLevel = Math.max(0.1, Math.min(1.0, level));
        this.adaptiveQuality = false;
    }

    enableAdaptiveQuality() {
        this.adaptiveQuality = true;
    }
}