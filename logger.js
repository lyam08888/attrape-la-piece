// logger.js - Système d'affichage de messages en jeu

class LogMessage {
    constructor(text, type = 'info') {
        this.text = text;
        this.type = type; // 'info', 'warning', 'error'
        this.life = 300; // Durée de vie en frames (5 secondes à 60fps)
        this.maxLife = this.life;
    }

    update() {
        this.life--;
    }

    draw(ctx, x, y, index) {
        const opacity = Math.min(1, this.life / 60); // Fondu en sortie
        let color = '#fff';
        if (this.type === 'error') color = '#e74c3c';
        if (this.type === 'warning') color = '#f1c40f';

        ctx.font = '12px "Press Start 2P"';
        ctx.fillStyle = `rgba(${this.hexToRgb(color)}, ${opacity})`;
        ctx.textAlign = 'right';
        ctx.fillText(this.text, x, y - (index * 20));
    }

    hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = "0x" + hex[1] + hex[1];
            g = "0x" + hex[2] + hex[2];
            b = "0x" + hex[3] + hex[3];
        } else if (hex.length == 7) {
            r = "0x" + hex[1] + hex[2];
            g = "0x" + hex[3] + hex[4];
            b = "0x" + hex[5] + hex[6];
        }
        return `${+r},${+g},${+b}`;
    }
}

export class Logger {
    constructor() {
        this.messages = [];
    }

    log(text) {
        this.messages.unshift(new LogMessage(text, 'info'));
        if (this.messages.length > 5) this.messages.pop();
    }

    error(text) {
        console.error(text); // On continue de logger dans la console
        this.messages.unshift(new LogMessage(text, 'error'));
        if (this.messages.length > 5) this.messages.pop();
    }

    update() {
        for (let i = this.messages.length - 1; i >= 0; i--) {
            this.messages[i].update();
            if (this.messages[i].life <= 0) {
                this.messages.splice(i, 1);
            }
        }
    }

    draw(ctx, canvas) {
        const x = canvas.width - 20;
        const y = canvas.height - 20;
        this.messages.forEach((msg, index) => {
            msg.draw(ctx, x, y, index);
        });
    }
}
