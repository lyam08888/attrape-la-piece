// worldAnimator.js - Gère les animations de l'environnement (nuages, vent, etc.)

class Cloud {
    constructor(x, y, speed, asset) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.asset = asset;
        this.width = asset.width * (1 + Math.random());
        this.height = asset.height * (1 + Math.random());
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
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * this.config.worldWidth;
            const y = Math.random() * (this.config.worldHeight / 3);
            const speed = 0.1 + Math.random() * 0.2;
            this.clouds.push(new Cloud(x, y, speed, this.assets.cloud));
        }
    }

    update(camera, canvas, zoom) {
        this.clouds.forEach(cloud => {
            cloud.update();
            // Fait réapparaître les nuages de l'autre côté de l'écran
            if (cloud.x > camera.x + (canvas.width / zoom)) {
                cloud.x = camera.x - cloud.width;
            }
        });
    }

    draw(ctx) {
        this.clouds.forEach(cloud => cloud.draw(ctx));
    }
}
