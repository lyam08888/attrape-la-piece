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
        
        this.image = this.createImage(pnjData.appearance, pnjData.archetype);
    }

    createImage(appearance, archetype) {
        let clothesSvg = '';
        const bodyColor = appearance.bodyColor;

        // --- Vêtements spécifiques à l'archétype ---
        switch (archetype) {
            case 'Forgeron':
                clothesSvg = `<rect x="25" y="60" width="50" height="70" fill="#6B4422" stroke="#44290c" stroke-width="2"/>`; // Tablier en cuir
                break;
            case 'Chasseur':
                clothesSvg = `<rect x="20" y="50" width="60" height="80" fill="#228B22" />`; // Tunique verte
                break;
            case 'Herboriste':
                clothesSvg = `<rect x="15" y="50" width="70" height="90" fill="#A0522D" />`; // Robe marron
                break;
        }

        const svg = `
            <svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
                <!-- Corps (couleur de peau) -->
                <rect x="10" y="50" width="80" height="100" fill="#F0D2B6" />
                
                <!-- Vêtements -->
                ${clothesSvg}

                <!-- Tête -->
                ${
                    appearance.headShape === "circle"
                        ? `<circle cx="50" cy="25" r="25" fill="${bodyColor}" stroke="#1E1E1E" stroke-width="2"/>`
                        : `<rect x="25" y="0" width="50" height="50" fill="${bodyColor}" stroke="#1E1E1E" stroke-width="2"/>`
                }
                
                <!-- Yeux -->
                <circle cx="40" cy="25" r="4" fill="white" /><circle cx="40" cy="25" r="2" fill="black" />
                <circle cx="60" cy="25" r="4" fill="white" /><circle cx="60" cy="25" r="2" fill="black" />

                <!-- Bouche -->
                <path d="M 40 40 Q 50 45 60 40" stroke="black" stroke-width="2" fill="none"/>
            </svg>
        `;
        const image = new Image();
        image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
        return image;
    }

    update(game) {
        const { tileSize, physics } = game.config;
        
        // --- Logique de mouvement améliorée ---
        this.actionTimer--;
        // Change de direction s'il atteint sa limite de patrouille ou après un certain temps
        if (this.actionTimer <= 0 || this.x > this.spawnX + 50 || this.x < this.spawnX - 50) {
            this.direction *= -1;
            this.actionTimer = 300 + Math.random() * 300; // Pause plus longue avant de repartir
        }

        // Ne bouge que pendant une partie de son cycle
        if (this.actionTimer < 180) {
             this.vx = this.speed * this.direction;
        } else {
            this.vx = 0; // Fait une pause
        }

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
        const map = game.tileMap;

        // --- Collision Horizontale ---
        let nextX = this.x + this.vx;
        const xTile = Math.floor((nextX + (this.vx > 0 ? this.w : 0)) / tileSize);
        const yTileTop = Math.floor(this.y / tileSize);
        const yTileBottom = Math.floor((this.y + this.h - 1) / tileSize);
        if (map[yTileTop]?.[xTile] > TILE.AIR || map[yTileBottom]?.[xTile] > TILE.AIR) {
            nextX = this.x;
            this.direction *= -1;
            this.actionTimer = 300 + Math.random() * 300;
        }
        this.x = nextX;
        
        // --- Collision Verticale ---
        this.y += this.vy;
        const yTile = Math.floor((this.y + (this.vy > 0 ? this.h : 0)) / tileSize);
        const xTileLeft = Math.floor(this.x / tileSize);
        const xTileRight = Math.floor((this.x + this.w - 1) / tileSize);

        if (map[yTile]?.[xTileLeft] > TILE.AIR || map[yTile]?.[xTileRight] > TILE.AIR) {
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
