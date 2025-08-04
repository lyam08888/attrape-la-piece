// rpgInterfaceManager.js - Gestionnaire d'Interface RPG Complète

export class RPGInterfaceManager {
    constructor() {
        this.windows = {};
        this.notifications = [];
        this.hudData = {
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            stamina: 80,
            maxStamina: 80,
            xp: 0,
            xpToNextLevel: 100,
            level: 1,
            time: '08:00',
            biome: 'Plaines'
        };

        this.createBaseInterface();
        this.setupWindowKeyListeners();
    }
    
    createBaseInterface() {
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;

        // Créer les fenêtres de base (invisibles par défaut)
        this.createWindow('inventoryWindow', 'Inventaire');
        this.createWindow('characterWindow', 'Personnage');
        this.createWindow('questWindow', 'Quêtes');
        this.createWindow('mapWindow', 'Carte du Monde');
        this.createWindow('craftingWindow', 'Artisanat');
        this.createWindow('journalWindow', 'Journal');
        this.createWindow('settingsWindow', 'Options');
    }

    createWindow(id, title) {
        const windowDiv = document.createElement('div');
        windowDiv.id = id;
        windowDiv.className = 'rpg-window';
        windowDiv.style.display = 'none'; // Caché par défaut

        windowDiv.innerHTML = `
            <div class="rpg-window-header">${title}</div>
            <div class="rpg-window-content">Contenu de ${title}...</div>
        `;
        document.body.appendChild(windowDiv);
        this.windows[id] = windowDiv;
    }

    toggleWindow(id) {
        const windowDiv = this.windows[id];
        if (windowDiv) {
            const isVisible = windowDiv.style.display === 'block';
            windowDiv.style.display = isVisible ? 'none' : 'block';
            // Mettre le jeu en pause si une fenêtre est ouverte
            if(window.game) window.game.paused = !isVisible;
        }
    }
    
    setupWindowKeyListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const mapping = {
                'i': 'inventoryWindow', 'c': 'characterWindow', 'q': 'questWindow', 
                'm': 'mapWindow', 'o': 'craftingWindow', 'j': 'journalWindow',
                'escape': 'settingsWindow'
            };
            if (mapping[key]) {
                e.preventDefault();
                this.toggleWindow(mapping[key]);
            }
        });
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `rpg-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, duration);
    }

    updateHUD() {
        if (window.game && window.game.player) {
            const p = window.game.player;
            this.hudData.health = Math.floor(p.health);
            this.hudData.maxHealth = p.maxHealth;
            this.hudData.mana = Math.floor(p.mana);
            this.hudData.maxMana = p.maxMana;
            this.hudData.level = p.stats.level;
        }
        if(window.game && window.game.timeSystem) {
             const time = window.game.timeSystem.getTime();
             this.hudData.time = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
        }
    }

    draw(ctx) {
        // Dessine le HUD
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 200, 80);

        ctx.fillStyle = 'white';
        ctx.font = '16px "VT323"';
        ctx.fillText(`Level: ${this.hudData.level}`, 20, 30);
        
        // Barre de vie
        ctx.fillStyle = 'red';
        ctx.fillRect(20, 40, 180 * (this.hudData.health / this.hudData.maxHealth), 15);
        ctx.fillText(`HP: ${this.hudData.health}/${this.hudData.maxHealth}`, 25, 52);

        // Barre de mana
        ctx.fillStyle = 'blue';
        ctx.fillRect(20, 60, 180 * (this.hudData.mana / this.hudData.maxMana), 15);
        ctx.fillText(`MP: ${this.hudData.mana}/${this.hudData.maxMana}`, 25, 72);
        
        // Heure
        ctx.fillStyle = 'white';
        ctx.font = '20px "VT323"';
        ctx.textAlign = 'right';
        ctx.fillText(this.hudData.time, ctx.canvas.width - 20, 30);
        ctx.textAlign = 'left';
    }
}

// Rendre accessible globalement
window.RPGInterfaceManager = RPGInterfaceManager;