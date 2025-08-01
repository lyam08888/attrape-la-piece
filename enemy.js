// enemy.js
// Ce fichier définit les classes de base pour les ennemis.

class Enemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.w = config.tileSize;
        this.h = config.tileSize;
        this.vx = 0;
        this.vy = 0;
        this.isDead = false;
        // Des propriétés de base pour que les ennemis puissent exister
    }

    update(game) {
        // Logique de mouvement et d'IA de base
        this.vy += game.config.physics.gravity;
        this.y += this.vy;
        
        // Simple collision avec le sol (à améliorer si besoin)
        const groundY = game.config.worldHeight - 200; // Exemple
        if (this.y + this.h > groundY) {
            this.y = groundY - this.h;
            this.vy = 0;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'purple'; // Placeholder color
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

// Exporter les classes spécifiques pour que world.js puisse les utiliser
export class Slime extends Enemy {
    draw(ctx) {
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
export class Frog extends Enemy {
     draw(ctx) {
        ctx.fillStyle = 'darkgreen';
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}
export class Golem extends Enemy {
     draw(ctx) {
        ctx.fillStyle = 'grey';
        ctx.fillRect(this.x, this.y, this.w, this.h * 1.5); // Un peu plus grand
    }
}
