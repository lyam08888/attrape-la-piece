// PNJ.js
import { TILE } from './world.js';

export class PNJ {
    constructor(x, y, config, pnjData) {
        this.x = x;
        this.y = y;
        this.spawnX = x; // Point d'ancrage
        this.w = config.player.width;
        this.h = config.player.height * 1.1; // Un peu plus grand que le joueur
        this.data = pnjData;
        this.config = config;
        
        // --- Propriétés de mouvement ---
        this.vx = 0;
        this.vy = 0;
        this.speed = config.tileSize * 0.02; // Vitesse de marche lente
        this.direction = 1;
        this.actionTimer = 120 + Math.random() * 120; // Temps avant de changer d'action
        this.isGrounded = false;

        this.image = this.createImage(pnjData.appearance, pnjData.archetype);

        // Interaction
        this.playerNearby = false;
        this.interactionCooldown = 0;
    }

    createImage(appearance, archetype) {
        let clothesSvg = '';
        const bodyColor = appearance.bodyColor;

        switch (archetype) {
            case 'Forgeron':
                clothesSvg = `<rect x="25" y="60" width="50" height="70" fill="#6B4422" stroke="#44290c" stroke-width="2"/>`;
                break;
            case 'Chasseur':
                clothesSvg = `<rect x="20" y="50" width="60" height="80" fill="#228B22" />`;
                break;
            case 'Herboriste':
                clothesSvg = `<rect x="15" y="50" width="70" height="90" fill="#A0522D" />`;
                break;
        }

        const svg = `
            <svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="50" width="80" height="100" fill="#F0D2B6" />
                ${clothesSvg}
                ${
                    appearance.headShape === "circle"
                        ? `<circle cx="50" cy="25" r="25" fill="${bodyColor}" stroke="#1E1E1E" stroke-width="2"/>`
                        : `<rect x="25" y="0" width="50" height="50" fill="${bodyColor}" stroke="#1E1E1E" stroke-width="2"/>`
                }
                <circle cx="40" cy="25" r="4" fill="white" /><circle cx="40" cy="25" r="2" fill="black" />
                <circle cx="60" cy="25" r="4" fill="white" /><circle cx="60" cy="25" r="2" fill="black" />
                <path d="M 40 40 Q 50 45 60 40" stroke="black" stroke-width="2" fill="none"/>
            </svg>
        `;
        const image = new Image();
        image.src = `data:image/svg+xml;base64,${btoa(svg)}`;
        return image;
    }

    update(game) {
        this.actionTimer--;
        if (this.actionTimer <= 0) {
            if (this.vx === 0) { // S'il était à l'arrêt, il se met à bouger
                this.direction *= -1;
                this.vx = this.speed * this.direction;
            } else { // S'il bougeait, il s'arrête
                this.vx = 0;
            }
            this.actionTimer = 180 + Math.random() * 180;
        }

        this.vy += this.config.physics.gravity;
        this.handleCollisions(game);

        if (this.interactionCooldown > 0) {
            this.interactionCooldown--;
        }
    }
    
    handleCollisions(game) {
        const { tileSize } = this.config;
        const map = game.tileMap;

        // Collision X
        this.x += this.vx;
        let hb = {x: this.x, y: this.y, w: this.w, h: this.h};
        if (this.vx > 0) {
            const tx = Math.floor((hb.x + hb.w) / tileSize);
            const ty1 = Math.floor(hb.y / tileSize);
            const ty2 = Math.floor((hb.y + hb.h - 1) / tileSize);
            if ((map[ty1]?.[tx] > TILE.AIR) || (map[ty2]?.[tx] > TILE.AIR)) {
                this.x = tx * tileSize - hb.w;
                this.vx *= -1;
                this.direction *= -1;
            }
        } else if (this.vx < 0) {
            const tx = Math.floor(hb.x / tileSize);
            const ty1 = Math.floor(hb.y / tileSize);
            const ty2 = Math.floor((hb.y + hb.h - 1) / tileSize);
             if ((map[ty1]?.[tx] > TILE.AIR) || (map[ty2]?.[tx] > TILE.AIR)) {
                this.x = (tx + 1) * tileSize;
                this.vx *= -1;
                this.direction *= -1;
            }
        }

        // Collision Y
        this.y += this.vy;
        hb = {x: this.x, y: this.y, w: this.w, h: this.h};
        this.isGrounded = false;
        if (this.vy > 0) {
            const ty = Math.floor((hb.y + hb.h) / tileSize);
            const tx1 = Math.floor(hb.x / tileSize);
            const tx2 = Math.floor((hb.x + hb.w - 1) / tileSize);
            if ((map[ty]?.[tx1] > TILE.AIR) || (map[ty]?.[tx2] > TILE.AIR)) {
                this.y = ty * tileSize - hb.h;
                this.vy = 0;
                this.isGrounded = true;
            }
        }
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
        }

        if (this.playerNearby) {
            ctx.font = '12px "VT323"';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('[E]', this.x + this.w / 2, this.y - 5);
        }
    }
}
