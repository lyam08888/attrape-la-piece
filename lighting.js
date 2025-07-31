// lighting.js - Gère le cycle jour/nuit et les sources de lumière

export class LightingSystem {
    constructor(config) {
        this.config = config;
        this.dayNightCycle = 0;
        this.timeOfDay = 0; // 0 = jour, 1 = nuit
    }

    update() {
        this.dayNightCycle = (this.dayNightCycle + 0.0002) % (Math.PI * 2);
        this.timeOfDay = (Math.sin(this.dayNightCycle) + 1) / 2; // Varie de 0 (midi) à 1 (minuit)
    }

    drawSky(ctx, canvas) {
        let c1 = "#87CEEB", c2 = "#5C94FC"; // Jour
        if (this.timeOfDay > 0.85 || this.timeOfDay < 0.15) { c1 = "#0a0a2e"; c2 = "#1e1e4e"; } // Nuit
        else if (this.timeOfDay > 0.75) { c1 = "#4a5a8e"; c2 = "#f4a460"; } // Aube
        else if (this.timeOfDay < 0.25) { c1 = "#ff6b6b"; c2 = "#ffa500"; } // Crépuscule
        
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawLightOverlay(ctx, player, camera, zoom) {
        if (this.timeOfDay > 0.8 || this.timeOfDay < 0.2) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 20, 0.7)';
            ctx.fillRect(camera.x, camera.y, this.config.canvasWidth / zoom, this.config.canvasHeight / zoom);

            // Aura de lumière autour du joueur
            const playerScreenX = player.x + player.w / 2;
            const playerScreenY = player.y + player.h / 2;
            const lightRadius = 150;

            const grad = ctx.createRadialGradient(playerScreenX, playerScreenY, 10, playerScreenX, playerScreenY, lightRadius);
            grad.addColorStop(0, 'rgba(255, 220, 150, 0.2)');
            grad.addColorStop(1, 'rgba(0, 0, 20, 0)');
            
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = grad;
            ctx.fillRect(playerScreenX - lightRadius, playerScreenY - lightRadius, lightRadius * 2, lightRadius * 2);
            
            ctx.restore();
        }
    }
}
