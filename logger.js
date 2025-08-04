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
        let color = '#FFFFFF'; // Blanc pour info
        if (this.type === 'error') color = '#e74c3c'; // Rouge pour erreur
        if (this.type === 'warning') color = '#f1c40f'; // Jaune pour avertissement

        // Convertit la couleur hexadécimale en RGBA avec l'opacité calculée
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        ctx.font = '12px "VT323"';
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.textAlign = 'right';
        ctx.fillText(this.text, x, y - (index * 20));
    }
}

export class Logger {
    constructor(chatSystem = null) {
        this.messages = [];
        this.chatSystem = chatSystem;
    }

    log(text) {
        console.log(text);
        this.messages.unshift(new LogMessage(text, 'info'));
        if (this.messages.length > 5) this.messages.pop();
        this.chatSystem?.addLog(text, 'info');
    }

    error(text) {
        console.error(text); // On continue de logger dans la console
        this.messages.unshift(new LogMessage(text, 'error'));
        if (this.messages.length > 5) this.messages.pop();
        this.chatSystem?.addLog(text, 'error');
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
