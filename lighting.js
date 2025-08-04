// lighting.js - Système d'éclairage dynamique

// Indicateur global pour éviter les conflits si utilisé hors modules
if (typeof window !== 'undefined') {
    window.LightingSystemLoaded = true;
}

const TILE_LIGHT_SOURCES = {
    // [TILE.type]: { color: 'rgba(r,g,b,a)', intensity: number }
    // Exemple :
    // 11: { color: 'rgba(180, 255, 180, 0.6)', intensity: 5 }, // GLOW_MUSHROOM
    // 14: { color: 'rgba(255, 100, 0, 0.7)', intensity: 8 }, // LAVA
};

export class LightingSystem {
    constructor(canvas, tileSize) {
        if (!canvas) {
            console.error("LightingSystem: Canvas non fourni.");
            return;
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = tileSize;
        this.darknessAlpha = 0; // 0 = jour, 1 = nuit
        this.lights = []; // Sources de lumière dynamiques (ex: torches tenues par le joueur)
    }

    update(timeSystem, tileMap, camera) {
        if (!timeSystem) return;

        // Mettre à jour l'opacité de l'obscurité en fonction de l'heure
        const time = timeSystem.getTime();
        const hour = time.hour;
        if (hour >= 20 || hour < 5) { // Nuit
            this.darknessAlpha = Math.min(1, this.darknessAlpha + 0.005);
        } else if (hour >= 7 && hour < 18) { // Jour
            this.darknessAlpha = Math.max(0, this.darknessAlpha - 0.01);
        }
        // Les périodes de crépuscule/aube sont gérées par la transition lente.

        // (Optionnel) Ici, on pourrait scanner l'écran pour les sources de lumière des tuiles
        // this.scanForTileLights(tileMap, camera);
    }

    draw(camera) {
        if (this.darknessAlpha <= 0) return; // Pas besoin de dessiner s'il fait jour

        this.ctx.save();

        // 1. Dessiner l'obscurité globale
        this.ctx.fillStyle = `rgba(0, 0, 15, ${this.darknessAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. "Découper" la lumière autour des sources
        this.ctx.globalCompositeOperation = 'destination-out';

        // Lumière ambiante autour du joueur
        if (window.game && window.game.player) {
            const player = window.game.player;
            const lightRadius = 100; // Rayon de la lumière du joueur
            const screenX = (player.x + player.w / 2 - camera.x) * window.game.config.zoom;
            const screenY = (player.y + player.h / 2 - camera.y) * window.game.config.zoom;

            const gradient = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, lightRadius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(screenX - lightRadius, screenY - lightRadius, lightRadius * 2, lightRadius * 2);
        }

        // (Optionnel) Dessiner les autres sources de lumière ici...

        this.ctx.restore();
    }
}
