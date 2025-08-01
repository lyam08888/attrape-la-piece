// worldAnimator.js - Gère les animations de l'environnement (nuages, vent, etc.)
import { SeededRandom } from './seededRandom.js';

class Cloud {
    constructor(x, y, speed, asset) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.asset = asset;
        this.width = asset.width * (1 + SeededRandom.random());
        this.height = asset.height * (1 + SeededRandom.random());
    }

    update() {
        this.x += this.speed;
    }

    draw(ctx) {
        ctx.globalAlpha = 0.8;
        ctx.drawImage(this.asset, this.x, this.y, this.width, this.height);
        ctx.globalAlpha = 1.0;
    }
}

export class WorldAnimator {
    constructor(config, assets) {
        this.config = config;
        this.assets = assets;
        this.clouds = [];
        this.init();
    }

    init() {
        // La graine est déjà initialisée dans world.js, on continue la séquence
        for (let i = 0; i < 15; i++) {
            const x = SeededRandom.random() * this.config.worldWidth;
            const y = SeededRandom.random() * (this.config.worldHeight / 3);
            const speed = 0.1 + SeededRandom.random() * 0.2;
            if (this.assets.cloud) {
                this.clouds.push(new Cloud(x, y, speed, this.assets.cloud));
            }
        }
    }

    update(camera, canvas, zoom) {
        this.clouds.forEach(cloud => {
            cloud.update();
            // CORRECTION: Utiliser clientWidth pour la taille visible
            if (cloud.x > camera.x + (canvas.clientWidth / zoom)) {
                cloud.x = camera.x - cloud.width;
            }
        });
    }

    draw(ctx) {
        this.clouds.forEach(cloud => cloud.draw(ctx));
    }
}
