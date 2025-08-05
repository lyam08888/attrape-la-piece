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
        // Affichage stylé dans le panneau HTML
        this.displayInPanel(fullMessage, type);
    }

    displayInPanel(msg, type) {
        let panel = document.getElementById('logPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'logPanel';
            panel.style.position = 'fixed';
            panel.style.bottom = '10px';
            panel.style.right = '10px';
            panel.style.width = '420px';
            panel.style.maxHeight = '300px';
            panel.style.overflowY = 'auto';
            panel.style.background = 'rgba(20,20,20,0.95)';
            panel.style.border = '2px solid #444';
            panel.style.borderRadius = '8px';
            panel.style.fontFamily = 'VT323, monospace';
            panel.style.fontSize = '15px';
            panel.style.zIndex = 9999;
            panel.style.boxShadow = '0 2px 12px #000a';
            document.body.appendChild(panel);
        }
        const line = document.createElement('div');
        line.textContent = msg;
        line.style.margin = '2px 8px';
        line.style.padding = '2px 0';
        line.style.borderBottom = '1px solid #2226';
        switch(type) {
            case 'error': line.style.color = '#ff5555'; line.style.fontWeight = 'bold'; line.innerHTML = '❌ ' + line.innerHTML; break;
            case 'warn': line.style.color = '#ffe066'; line.innerHTML = '⚠️ ' + line.innerHTML; break;
            case 'success': line.style.color = '#7CFC00'; line.innerHTML = '✅ ' + line.innerHTML; break;
            case 'debug': line.style.color = '#00BFFF'; line.innerHTML = '🛠️ ' + line.innerHTML; break;
            default: line.style.color = '#fff'; line.innerHTML = 'ℹ️ ' + line.innerHTML;
        }
        panel.insertBefore(line, panel.firstChild);
        // Limite le nombre de logs visibles
        while (panel.childNodes.length > 15) panel.removeChild(panel.lastChild);
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