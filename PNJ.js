// PNJ.js
import { TILE } from './world.js';

export class PNJ {
    constructor(x, y, config, pnjData) {
        this.x = x;
        this.y = y;
        this.spawnX = x; // Point d'ancrage
        this.w = config.tileSize;
        this.h = config.tileSize * 1.5;
        this.data = pnjData;
        
        // --- Propriétés de mouvement ---
        this.vx = 0;
        this.vy = 0;
        this.speed = config.tileSize * 0.01; // Vitesse de marche lente
        this.direction = 1;
        this.actionTimer = 120 + Math.random() * 120; // Temps avant de changer de direction
        this.isGrounded = false;
        
        this.image = this.createImage(pnjData.appearance);
    }

    createImage(appearance) {
        const svg = `
            <svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="50" width="80" height="100" fill="${appearance.bodyColor}" stroke="#1E1E1E" stroke-width="2"/>
                ${
                    appearance.headShape === "circle"
                        ? `<circle cx="50" cy="25" r="25" fill="${appearance.bodyColor}" stroke="#1E1E1E" stroke-width="2"/>`
                        : `<rect x="25" y="0" width="50" height="50" fill="${appearance.bodyColor}" stroke="#1E1E1E" stroke-width="2"/>`
                }
            </svg>
        `;
        const image = new Image();
        image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
        return image;
    }

    update(game) {
        const { tileSize, physics } = game.config;
        
        // --- Logique de mouvement simple ---
        this.actionTimer--;
        if (this.actionTimer <= 0 || this.x > this.spawnX + 50 || this.x < this.spawnX - 50) {
            this.direction *= -1;
            this.actionTimer = 180 + Math.random() * 240; // Attend avant de repartir
        }

        if (this.actionTimer < 180) { // Ne bouge que s'il n'est pas en pause
             this.vx = this.speed * this.direction;
        } else {
            this.vx = 0;
        }

        // Appliquer la gravité
        this.vy += physics.gravity;
        if (this.vy > physics.maxFallSpeed) this.vy = physics.maxFallSpeed;

        this.handleCollisions(game, tileSize);

        // --- Mise à jour de l'état de la quête ---
        const quest = this.data.quest;
        const playerQuest = game.player.quests.find(q => q.id === quest.id);

        if (playerQuest) {
            if (playerQuest.objective.currentAmount >= playerQuest.objective.amount) {
                this.questState = "completed";
            } else {
                this.questState = "active";
            }
        } else {
            this.questState = "available";
        }
    }
    
    handleCollisions(game, tileSize) {
        this.x += this.vx;
        // (Collision horizontale simplifiée pour éviter que le PNJ ne se bloque)
        
        this.y += this.vy;
        const yTile = Math.floor((this.y + (this.vy > 0 ? this.h : 0)) / tileSize);
        const xTileLeft = Math.floor(this.x / tileSize);
        const xTileRight = Math.floor((this.x + this.w - 1) / tileSize);

        if (game.tileMap[yTile]?.[xTileLeft] > TILE.AIR || game.tileMap[yTile]?.[xTileRight] > TILE.AIR) {
            if (this.vy > 0) {
                this.y = yTile * tileSize - this.h;
                this.vy = 0;
                this.isGrounded = true;
            } else if (this.vy < 0) {
                this.y = yTile * tileSize + tileSize;
                this.vy = 0;
            }
        } else {
            this.isGrounded = false;
        }
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
        }

        // --- Dessin de l'indicateur de quête ---
        ctx.font = "24px 'Press Start 2P'";
        ctx.textAlign = "center";
        let indicatorText = "";
        let indicatorColor = "yellow";

        if (this.questState === "available") {
            indicatorText = "!";
        } else if (this.questState === "active") {
            indicatorText = "?";
            indicatorColor = "#DDD";
        } else if (this.questState === "completed") {
            indicatorText = "?";
            indicatorColor = "yellow";
        }

        if (indicatorText) {
            ctx.fillStyle = indicatorColor;
            ctx.fillText(indicatorText, this.x + this.w / 2, this.y - 10);
        }
    }
    
    rectCollide(other) {
        return (
            this.x < other.x + other.w &&
            this.x + this.w > other.x &&
            this.y < other.y + other.h &&
            this.y + this.h > other.y
        );
    }
}
