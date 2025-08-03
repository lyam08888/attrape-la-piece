// disasterManager.js - Gère les catastrophes climatiques et événements mondiaux.
import { TILE } from './world.js';

class Meteor {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.vy = 15; // Vitesse de chute
        this.w = 16;
        this.h = 16;
        this.game = game;
    }

    update() {
        this.y += this.vy;

        // Collision avec le sol
        const { tileSize } = this.game.config;
        const tileX = Math.floor(this.x / tileSize);
        const tileY = Math.floor(this.y / tileSize);

        if (this.game.tileMap[tileY]?.[tileX] > TILE.AIR) {
            this.explode();
            return false; // Se détruire
        }
        if (this.y > this.game.config.worldHeight) {
            return false;
        }
        return true; // Continuer d'exister
    }

    explode() {
        const { tileSize } = this.game.config;
        const radius = 3;
        const tileX = Math.floor(this.x / tileSize);
        const tileY = Math.floor(this.y / tileSize);

        this.game.sound.play('explosion', { volume: 1.0 });
        this.game.createParticles(this.x, this.y, 50, 'orange', { speed: 8 });
        
        // Créer un cratère
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (Math.hypot(dx, dy) <= radius) {
                    const currentX = tileX + dx;
                    const currentY = tileY + dy;
                    if (this.game.tileMap[currentY]?.[currentX]) {
                        this.game.tileMap[currentY][currentX] = TILE.AIR;
                    }
                }
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'orange';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x + 4, this.y + 4, 8, 8);
    }
}


export class DisasterManager {
    constructor(game = null) {
        this.game = game;
        this.disasterTimer = 3000; // Temps en frames avant le prochain événement possible
        this.activeDisaster = null;
        this.projectiles = []; // Pour les météorites, bombes de lave, etc.
    }

    update(game, delta) {
        if (!this.game) this.game = game;
        
        if (this.activeDisaster) {
            this.activeDisaster.duration--;
            if (this.activeDisaster.duration <= 0) {
                this.stopDisaster();
            } else {
                this.updateDisaster();
            }
        } else {
            this.disasterTimer--;
            if (this.disasterTimer <= 0) {
                this.tryStartDisaster();
                this.disasterTimer = 10000 + Math.random() * 10000; // Prochain événement dans 10-20k frames
            }
        }
        
        // Mettre à jour les projectiles
        this.projectiles = this.projectiles.filter(p => p.update());
    }

    tryStartDisaster() {
        if (Math.random() < 0.3) { // 30% de chance de déclencher un événement
            const disasterTypes = ['thunderstorm', 'earthquake', 'meteor_shower'];
            const chosenDisaster = disasterTypes[Math.floor(Math.random() * disasterTypes.length)];
            this.startDisaster(chosenDisaster);
        }
    }

    startDisaster(type) {
        this.activeDisaster = {
            type: type,
            duration: 1200 + Math.random() * 1200, // Durée de 20-40 secondes
            intensity: 0.5 + Math.random() * 0.5,
            internalTimer: 0,
        };
    }

    triggerDisaster(type, options = {}) {
        this.startDisaster(type);
        if (options.intensity !== undefined) {
            this.activeDisaster.intensity = options.intensity;
        }
        if (options.duration !== undefined) {
            this.activeDisaster.duration = options.duration;
        }
    }

    stopDisaster() {
        this.activeDisaster = null;
    }

    updateDisaster() {
        const d = this.activeDisaster;
        d.internalTimer++;

        switch (d.type) {
            case 'thunderstorm':
                if (d.internalTimer % 120 === 0 && Math.random() < 0.3) {
                    this.game.lightningFlash = 1.0; // Déclenche un éclair
                    this.game.sound.play('thunder');
                }
                break;
            case 'earthquake':
                this.game.triggerCameraShake(10 * d.intensity, 5);
                if (d.internalTimer % 30 === 0 && Math.random() < 0.1) {
                    // Faire tomber un bloc aléatoire près du joueur
                    const px = Math.floor(this.game.player.x / this.game.config.tileSize);
                    const py = Math.floor(this.game.player.y / this.game.config.tileSize);
                    const randX = px + Math.floor((Math.random() - 0.5) * 20);
                    const randY = py + Math.floor((Math.random() - 0.5) * 10);
                    this.game.checkBlockSupport(randX, randY);
                }
                break;
            case 'meteor_shower':
                if (d.internalTimer % 20 === 0 && Math.random() < 0.4) {
                    const spawnX = this.game.camera.x + Math.random() * (this.game.canvas.clientWidth / this.game.settings.zoom);
                    const spawnY = this.game.camera.y - 50;
                    this.projectiles.push(new Meteor(spawnX, spawnY, this.game));
                }
                break;
        }
    }

    draw(ctx) {
        // Dessiner les projectiles
        this.projectiles.forEach(p => p.draw(ctx));

        // Gérer les effets visuels des catastrophes
        if (this.activeDisaster) {
            switch (this.activeDisaster.type) {
                case 'thunderstorm':
                    // Dessiner la pluie
                    for (let i = 0; i < 50; i++) {
                        const x = Math.random() * this.game.canvas.clientWidth / this.game.settings.zoom;
                        const y = Math.random() * this.game.canvas.clientHeight / this.game.settings.zoom;
                        ctx.fillStyle = 'rgba(180, 180, 220, 0.5)';
                        ctx.fillRect(x, y, 1, 10);
                    }
                    break;
            }
        }
    }
}
