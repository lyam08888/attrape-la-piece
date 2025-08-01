// PNJ.js

export class PNJ {
    constructor(x, y, config, pnjData) {
        this.x = x;
        this.y = y;
        this.w = config.tileSize;
        this.h = config.tileSize * 1.5;
        this.data = pnjData;
        this.questState = "available"; // available, active, completed

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
        // Logique future (mouvements, etc.)
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
