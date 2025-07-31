// fx.js - Gère les effets de particules (pluie, étincelles, etc.)

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * (options.speed || 4);
        this.vy = (Math.random() - 0.5) * (options.speed || 4) - 2;
        this.life = 30 + Math.random() * 30;
        this.maxLife = this.life;
        this.size = 1 + Math.random() * 2;
        this.gravity = options.gravity || 0.1;
        this.color = options.color || '#fff';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    create(x, y, count, color, options) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, { ...options, color }));
        }
    }

    // Effet de pluie
    rain(camera, canvas, zoom) {
        if (Math.random() < 0.5) {
            const rainOptions = {
                speed: 1,
                gravity: 0.5,
                color: 'rgba(174,194,224,0.7)'
            };
            const x = camera.x + Math.random() * (canvas.width / zoom);
            const y = camera.y - 10;
            this.particles.push(new Particle(x, y, rainOptions));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        this.particles.forEach(p => p.draw(ctx));
        ctx.restore();
    }
}
