// logger.js - Système de journalisation amélioré pour le débogage en jeu

import { windowManager } from './windowManager.js';

export class Logger {
    constructor() {
        this.messages = [];
        this.maxMessages = 10; // Nombre maximum de messages à afficher
        this.isVisible = false; // Le logger n'est visible que si activé
        this.contentElement = null; // Conteneur des logs dans la fenêtre
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
        // Affichage stylé dans la fenêtre de logs
        this.displayInPanel(fullMessage, type);
    }

    ensureWindow() {
        // Crée la fenêtre de logs si nécessaire
        if (!windowManager.isWindowOpen('logger')) {
            const content = `<div id="loggerContent" style="font-family: 'VT323', monospace; font-size: 14px;"></div>`;
            const win = windowManager.createWindow('logger', 'Logs', content, {
                width: 420,
                height: 300,
                icon: 'fas fa-terminal',
                resizable: true
            });
            this.contentElement = win.element.querySelector('#loggerContent');
            this.isVisible = true;
        } else if (!this.contentElement) {
            const win = windowManager.getWindow('logger');
            this.contentElement = win?.element.querySelector('#loggerContent');
        }
    }

    displayInPanel(msg, type) {
        this.ensureWindow();
        if (!this.contentElement) return;

        const line = document.createElement('div');
        line.textContent = msg;
        line.style.margin = '2px 0';
        line.style.padding = '2px 0';
        line.style.borderBottom = '1px solid #2226';
        switch(type) {
            case 'error':
                line.style.color = '#ff5555';
                line.style.fontWeight = 'bold';
                line.textContent = '❌ ' + line.textContent;
                break;
            case 'warn':
                line.style.color = '#ffe066';
                line.textContent = '⚠️ ' + line.textContent;
                break;
            case 'success':
                line.style.color = '#7CFC00';
                line.textContent = '✅ ' + line.textContent;
                break;
            case 'debug':
                line.style.color = '#00BFFF';
                line.textContent = '🛠️ ' + line.textContent;
                break;
            default:
                line.style.color = '#fff';
                line.textContent = 'ℹ️ ' + line.textContent;
        }
        this.contentElement.insertBefore(line, this.contentElement.firstChild);
        // Limite le nombre de logs visibles
        while (this.contentElement.childNodes.length > 15) {
            this.contentElement.removeChild(this.contentElement.lastChild);
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
        if (!windowManager.isWindowOpen('logger')) {
            this.ensureWindow();
            this.isVisible = true;
            this.log('Logger in-game activé.', 'debug');
        } else {
            const win = windowManager.getWindow('logger');
            if (win.isMinimized) {
                windowManager.restoreWindow('logger');
                this.isVisible = true;
                this.log('Logger in-game activé.', 'debug');
            } else {
                windowManager.minimizeWindow('logger');
                this.isVisible = false;
                this.log('Logger in-game désactivé.', 'debug');
            }
        }
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