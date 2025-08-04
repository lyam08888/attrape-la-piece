// logger.js - Système de journalisation amélioré pour le débogage en jeu

export class Logger {
    constructor() {
        this.messages = [];
        this.maxMessages = 10; // Nombre maximum de messages à afficher
        this.isVisible = false; // Le logger n'est visible que si activé
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const fullMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        
        console.log(fullMessage); // Garde la journalisation console

        // Ajoute le message à l'affichage en jeu
        this.messages.unshift({ text: fullMessage, type, life: 300 }); // Dure 5 secondes (300 frames)
        
        if (this.messages.length > this.maxMessages) {
            this.messages.pop();
        }
    }
    
    error(message) {
        this.log(message, 'error');
    }

    warn(message) {
        this.log(message, 'warn');
    }

    success(message) {
        this.log(message, 'success');
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.log(`Logger in-game ${this.isVisible ? 'activé' : 'désactivé'}.`, 'debug');
    }

    update() {
        // Décrémente la durée de vie des messages
        for (let i = this.messages.length - 1; i >= 0; i--) {
            this.messages[i].life--;
            if (this.messages[i].life <= 0) {
                this.messages.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (!this.isVisible) return;

        ctx.save();
        ctx.font = '12px "VT323"';
        ctx.textAlign = 'left';
        
        let y = 30;
        this.messages.forEach(msg => {
            const alpha = Math.min(1, msg.life / 60); // Fondu sortant
            switch(msg.type) {
                case 'error': ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`; break;
                case 'warn': ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`; break;
                case 'success': ctx.fillStyle = `rgba(100, 255, 100, ${alpha})`; break;
                default: ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            }
            ctx.fillText(msg.text, 10, y);
            y += 15;
        });

        ctx.restore();
    }
}