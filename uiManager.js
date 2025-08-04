// uiManager.js - Gestionnaire principal de l'interface utilisateur
import { windowManager } from './windowManager.js';
import { GameMenus } from './gameMenus.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.gameMenus = new GameMenus(game);
        this.shortcuts = new Map();
        this.contextMenus = new Map();
        this.notifications = [];
        this.init();
    }

    init() {
        this.setupGlobalShortcuts();
        this.createContextMenus();
        this.createNotificationSystem();
        this.createQuickAccessBar();
        this.setupWindowSnapping();
        this.createMainMenu();
    }

    setupGlobalShortcuts() {
        // Raccourcis globaux du jeu
        this.registerShortcut('F1', () => this.showHelp());
        this.registerShortcut('F2', () => this.toggleDebugMode());
        this.registerShortcut('F3', () => this.takeScreenshot());
        this.registerShortcut('F4', () => this.toggleFullscreen());
        this.registerShortcut('F5', () => this.quickSave());
        this.registerShortcut('F9', () => this.quickLoad());
        this.registerShortcut('F11', () => this.toggleUI());
        this.registerShortcut('F12', () => this.openConsole());
        
        // Raccourcis avec modificateurs
        this.registerShortcut('Ctrl+S', () => this.saveGame());
        this.registerShortcut('Ctrl+L', () => this.loadGame());
        this.registerShortcut('Ctrl+N', () => this.newGame());
        this.registerShortcut('Ctrl+Q', () => this.quitGame());
        this.registerShortcut('Ctrl+M', () => this.toggleMute());
        this.registerShortcut('Ctrl+P', () => this.pauseGame());
        
        // Raccourcis de fenêtres
        this.registerShortcut('Alt+Tab', () => this.cycleWindows());
        this.registerShortcut('Alt+F4', () => this.closeActiveWindow());
        this.registerShortcut('Win+M', () => this.minimizeAllWindows());
        this.registerShortcut('Win+D', () => this.showDesktop());

        // Écouter les événements clavier
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    registerShortcut(combination, callback) {
        this.shortcuts.set(combination.toLowerCase(), callback);
    }

    handleKeyDown(e) {
        const combination = this.getKeyCombination(e);
        const shortcut = this.shortcuts.get(combination);
        
        if (shortcut) {
            e.preventDefault();
            shortcut();
        }
    }

    handleKeyUp(e) {
        // Gérer les raccourcis qui nécessitent le relâchement de la touche
    }

    getKeyCombination(e) {
        const parts = [];
        
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.metaKey) parts.push('win');
        
        let key = e.key.toLowerCase();
        if (key.startsWith('f') && key.length <= 3) {
            key = key.toUpperCase();
        }
        
        parts.push(key);
        return parts.join('+');
    }

    createContextMenus() {
        // Menu contextuel pour les fenêtres
        this.createWindowContextMenu();
        
        // Menu contextuel pour l'inventaire
        this.createInventoryContextMenu();
        
        // Menu contextuel pour la carte
        this.createMapContextMenu();
        
        // Écouter les clics droits
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
    }

    createWindowContextMenu() {
        const menu = {
            items: [
                {
                    label: 'Restaurer',
                    icon: 'fas fa-window-restore',
                    action: (target) => this.restoreWindow(target)
                },
                {
                    label: 'Minimiser',
                    icon: 'fas fa-window-minimize',
                    action: (target) => this.minimizeWindow(target)
                },
                {
                    label: 'Maximiser',
                    icon: 'fas fa-window-maximize',
                    action: (target) => this.maximizeWindow(target)
                },
                { separator: true },
                {
                    label: 'Toujours au premier plan',
                    icon: 'fas fa-thumbtack',
                    action: (target) => this.toggleAlwaysOnTop(target),
                    toggle: true
                },
                {
                    label: 'Transparence',
                    icon: 'fas fa-adjust',
                    submenu: [
                        { label: '100%', action: (target) => this.setOpacity(target, 1) },
                        { label: '90%', action: (target) => this.setOpacity(target, 0.9) },
                        { label: '80%', action: (target) => this.setOpacity(target, 0.8) },
                        { label: '70%', action: (target) => this.setOpacity(target, 0.7) }
                    ]
                },
                { separator: true },
                {
                    label: 'Fermer',
                    icon: 'fas fa-times',
                    action: (target) => this.closeWindow(target)
                }
            ]
        };
        
        this.contextMenus.set('window', menu);
    }

    createInventoryContextMenu() {
        const menu = {
            items: [
                {
                    label: 'Utiliser',
                    icon: 'fas fa-hand-pointer',
                    action: (target) => this.useItem(target)
                },
                {
                    label: 'Équiper',
                    icon: 'fas fa-shield-alt',
                    action: (target) => this.equipItem(target)
                },
                {
                    label: 'Examiner',
                    icon: 'fas fa-search',
                    action: (target) => this.examineItem(target)
                },
                { separator: true },
                {
                    label: 'Diviser',
                    icon: 'fas fa-cut',
                    action: (target) => this.splitItem(target)
                },
                {
                    label: 'Jeter',
                    icon: 'fas fa-trash',
                    action: (target) => this.dropItem(target)
                },
                {
                    label: 'Détruire',
                    icon: 'fas fa-times-circle',
                    action: (target) => this.destroyItem(target)
                }
            ]
        };
        
        this.contextMenus.set('inventory', menu);
    }

    createMapContextMenu() {
        const menu = {
            items: [
                {
                    label: 'Ajouter un repère',
                    icon: 'fas fa-map-pin',
                    action: (target, x, y) => this.addWaypoint(x, y)
                },
                {
                    label: 'Aller à',
                    icon: 'fas fa-route',
                    action: (target, x, y) => this.navigateTo(x, y)
                },
                {
                    label: 'Mesurer la distance',
                    icon: 'fas fa-ruler',
                    action: (target, x, y) => this.measureDistance(x, y)
                },
                { separator: true },
                {
                    label: 'Centrer sur le joueur',
                    icon: 'fas fa-crosshairs',
                    action: () => this.centerMapOnPlayer()
                },
                {
                    label: 'Réinitialiser le zoom',
                    icon: 'fas fa-search-minus',
                    action: () => this.resetMapZoom()
                }
            ]
        };
        
        this.contextMenus.set('map', menu);
    }

    handleContextMenu(e) {
        e.preventDefault();
        
        const target = e.target.closest('[data-context-menu]');
        if (target) {
            const menuType = target.dataset.contextMenu;
            const menu = this.contextMenus.get(menuType);
            
            if (menu) {
                this.showContextMenu(menu, e.clientX, e.clientY, target);
            }
        }
    }

    showContextMenu(menu, x, y, target) {
        // Supprimer le menu existant
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) existingMenu.remove();
        
        const menuEl = document.createElement('div');
        menuEl.className = 'context-menu';
        menuEl.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            background: linear-gradient(to bottom, #3a3a3a, #2a2a2a);
            border: 1px solid #666;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            z-index: 10000;
            min-width: 150px;
            padding: 5px 0;
            font-family: 'VT323', monospace;
            font-size: 14px;
        `;
        
        menu.items.forEach(item => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.style.cssText = `
                    height: 1px;
                    background: #555;
                    margin: 5px 10px;
                `;
                menuEl.appendChild(separator);
            } else {
                const itemEl = document.createElement('div');
                itemEl.className = 'context-menu-item';
                itemEl.style.cssText = `
                    padding: 8px 15px;
                    color: #fff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s;
                `;
                
                itemEl.innerHTML = `
                    <i class="${item.icon}"></i>
                    <span>${item.label}</span>
                    ${item.submenu ? '<i class="fas fa-chevron-right" style="margin-left: auto;"></i>' : ''}
                `;
                
                itemEl.addEventListener('mouseenter', () => {
                    itemEl.style.background = 'rgba(255,152,0,0.2)';
                });
                
                itemEl.addEventListener('mouseleave', () => {
                    itemEl.style.background = 'transparent';
                });
                
                itemEl.addEventListener('click', () => {
                    if (item.action) {
                        item.action(target, x, y);
                    }
                    menuEl.remove();
                });
                
                menuEl.appendChild(itemEl);
            }
        });
        
        document.body.appendChild(menuEl);
        
        // Fermer le menu en cliquant ailleurs
        setTimeout(() => {
            document.addEventListener('click', () => {
                menuEl.remove();
            }, { once: true });
        }, 100);
        
        // Ajuster la position si le menu sort de l'écran
        const rect = menuEl.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menuEl.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menuEl.style.top = (y - rect.height) + 'px';
        }
    }

    createNotificationSystem() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(this.notificationContainer);
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: linear-gradient(to right, ${this.getNotificationColor(type)});
            color: #fff;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border-left: 4px solid ${this.getNotificationBorderColor(type)};
            font-family: 'VT323', monospace;
            font-size: 14px;
            max-width: 300px;
            pointer-events: all;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            cursor: pointer;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <i class="fas fa-times" style="margin-left: auto; opacity: 0.7;"></i>
            </div>
        `;
        
        this.notificationContainer.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Fermeture au clic
        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // Fermeture automatique
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
        
        this.notifications.push(notification);
        return notification;
    }

    removeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    getNotificationColor(type) {
        switch(type) {
            case 'success': return '#27ae60, #2ecc71';
            case 'warning': return '#f39c12, #e67e22';
            case 'error': return '#e74c3c, #c0392b';
            case 'info': return '#3498db, #2980b9';
            default: return '#34495e, #2c3e50';
        }
    }

    getNotificationBorderColor(type) {
        switch(type) {
            case 'success': return '#2ecc71';
            case 'warning': return '#e67e22';
            case 'error': return '#c0392b';
            case 'info': return '#2980b9';
            default: return '#2c3e50';
        }
    }

    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'error': return 'fa-times-circle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-bell';
        }
    }

    createQuickAccessBar() {
        this.quickAccessBar = document.createElement('div');
        this.quickAccessBar.id = 'quick-access-bar';
        this.quickAccessBar.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(to bottom, rgba(40, 40, 40, 0.95), rgba(20, 20, 20, 0.95));
            border: 2px solid #555;
            border-radius: 25px;
            padding: 8px 15px;
            display: flex;
            gap: 10px;
            z-index: 150;
            backdrop-filter: blur(10px);
            transition: all 0.3s;
        `;
        
        const quickButtons = [
            { icon: 'fas fa-backpack', tooltip: 'Inventaire (I)', action: () => this.gameMenus.toggleInventory() },
            { icon: 'fas fa-user', tooltip: 'Personnage (C)', action: () => this.gameMenus.toggleCharacter() },
            { icon: 'fas fa-scroll', tooltip: 'Quêtes (Q)', action: () => this.gameMenus.toggleQuests() },
            { icon: 'fas fa-map', tooltip: 'Carte (M)', action: () => this.gameMenus.toggleMap() },
            { icon: 'fas fa-hammer', tooltip: 'Artisanat', action: () => this.gameMenus.toggleCrafting() },
            { icon: 'fas fa-book', tooltip: 'Journal (J)', action: () => this.gameMenus.toggleJournal() },
            { icon: 'fas fa-cog', tooltip: 'Options (O)', action: () => this.gameMenus.toggleOptions() }
        ];
        
        quickButtons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'quick-access-btn';
            button.innerHTML = `<i class="${btn.icon}"></i>`;
            button.title = btn.tooltip;
            button.style.cssText = `
                width: 35px;
                height: 35px;
                background: linear-gradient(to bottom, #4a4a4a, #2a2a2a);
                border: 1px solid #666;
                border-radius: 50%;
                color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                font-size: 14px;
            `;
            
            button.addEventListener('click', btn.action);
            button.addEventListener('mouseenter', () => {
                button.style.background = 'linear-gradient(to bottom, #FF9800, #F57C00)';
                button.style.transform = 'scale(1.1)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = 'linear-gradient(to bottom, #4a4a4a, #2a2a2a)';
                button.style.transform = 'scale(1)';
            });
            
            this.quickAccessBar.appendChild(button);
        });
        
        document.body.appendChild(this.quickAccessBar);
    }

    setupWindowSnapping() {
        this.snapZones = {
            left: { x: 0, y: 0, width: '50%', height: '100%' },
            right: { x: '50%', y: 0, width: '50%', height: '100%' },
            top: { x: 0, y: 0, width: '100%', height: '50%' },
            bottom: { x: 0, y: '50%', width: '100%', height: '50%' },
            topLeft: { x: 0, y: 0, width: '50%', height: '50%' },
            topRight: { x: '50%', y: 0, width: '50%', height: '50%' },
            bottomLeft: { x: 0, y: '50%', width: '50%', height: '50%' },
            bottomRight: { x: '50%', y: '50%', width: '50%', height: '50%' }
        };
        
        // Zones de snap visuelles
        this.createSnapZones();
    }

    createSnapZones() {
        this.snapIndicators = {};
        
        Object.keys(this.snapZones).forEach(zone => {
            const indicator = document.createElement('div');
            indicator.className = 'snap-indicator';
            indicator.style.cssText = `
                position: fixed;
                background: rgba(255, 152, 0, 0.3);
                border: 2px solid #FF9800;
                border-radius: 8px;
                display: none;
                z-index: 9998;
                pointer-events: none;
            `;
            document.body.appendChild(indicator);
            this.snapIndicators[zone] = indicator;
        });
    }

    createMainMenu() {
        // Menu principal accessible via la barre des tâches
        this.mainMenu = document.createElement('div');
        this.mainMenu.id = 'main-menu';
        this.mainMenu.style.cssText = `
            position: fixed;
            bottom: 60px;
            left: 10px;
            width: 300px;
            background: linear-gradient(to bottom, rgba(40, 40, 40, 0.98), rgba(20, 20, 20, 0.98));
            border: 2px solid #555;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
            display: none;
            z-index: 250;
            padding: 15px;
            font-family: 'VT323', monospace;
        `;
        
        const menuItems = [
            { 
                category: 'Jeu',
                items: [
                    { label: 'Nouvelle Partie', icon: 'fas fa-plus', action: () => this.newGame() },
                    { label: 'Sauvegarder', icon: 'fas fa-save', action: () => this.saveGame() },
                    { label: 'Charger', icon: 'fas fa-folder-open', action: () => this.loadGame() },
                    { label: 'Options', icon: 'fas fa-cog', action: () => this.gameMenus.toggleOptions() }
                ]
            },
            {
                category: 'Interface',
                items: [
                    { label: 'Réinitialiser les fenêtres', icon: 'fas fa-window-restore', action: () => this.resetWindowPositions() },
                    { label: 'Masquer toutes les fenêtres', icon: 'fas fa-eye-slash', action: () => this.hideAllWindows() },
                    { label: 'Afficher toutes les fenêtres', icon: 'fas fa-eye', action: () => this.showAllWindows() }
                ]
            },
            {
                category: 'Aide',
                items: [
                    { label: 'Raccourcis clavier', icon: 'fas fa-keyboard', action: () => this.showKeyboardShortcuts() },
                    { label: 'À propos', icon: 'fas fa-info-circle', action: () => this.showAbout() },
                    { label: 'Quitter', icon: 'fas fa-sign-out-alt', action: () => this.quitGame() }
                ]
            }
        ];
        
        menuItems.forEach(category => {
            const categoryEl = document.createElement('div');
            categoryEl.innerHTML = `<h4 style="color: #FF9800; margin: 10px 0 5px 0; border-bottom: 1px solid #555; padding-bottom: 5px;">${category.category}</h4>`;
            
            category.items.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'main-menu-item';
                itemEl.style.cssText = `
                    padding: 8px 12px;
                    color: #fff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    border-radius: 4px;
                    transition: background 0.2s;
                `;
                
                itemEl.innerHTML = `<i class="${item.icon}"></i><span>${item.label}</span>`;
                
                itemEl.addEventListener('mouseenter', () => {
                    itemEl.style.background = 'rgba(255,152,0,0.2)';
                });
                
                itemEl.addEventListener('mouseleave', () => {
                    itemEl.style.background = 'transparent';
                });
                
                itemEl.addEventListener('click', () => {
                    item.action();
                    this.hideMainMenu();
                });
                
                categoryEl.appendChild(itemEl);
            });
            
            this.mainMenu.appendChild(categoryEl);
        });
        
        document.body.appendChild(this.mainMenu);
    }

    toggleMainMenu() {
        if (this.mainMenu.style.display === 'none') {
            this.showMainMenu();
        } else {
            this.hideMainMenu();
        }
    }

    showMainMenu() {
        this.mainMenu.style.display = 'block';
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!this.mainMenu.contains(e.target) && !e.target.closest('#gameTaskbar')) {
                    this.hideMainMenu();
                }
            }, { once: true });
        }, 100);
    }

    hideMainMenu() {
        this.mainMenu.style.display = 'none';
    }

    // Méthodes d'action des raccourcis
    showHelp() {
        this.showNotification('Aide: Utilisez F1 pour l\'aide, I pour l\'inventaire, C pour le personnage', 'info');
    }

    toggleDebugMode() {
        this.game.debugMode = !this.game.debugMode;
        this.showNotification(`Mode debug ${this.game.debugMode ? 'activé' : 'désactivé'}`, 'info');
    }

    takeScreenshot() {
        // Logique de capture d'écran
        this.showNotification('Capture d\'écran sauvegardée', 'success');
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    }

    quickSave() {
        // Logique de sauvegarde rapide
        this.showNotification('Partie sauvegardée', 'success');
    }

    quickLoad() {
        // Logique de chargement rapide
        this.showNotification('Partie chargée', 'success');
    }

    toggleUI() {
        const container = document.getElementById('windowContainer');
        const quickAccess = document.getElementById('quick-access-bar');
        
        if (container.style.display === 'none') {
            container.style.display = 'block';
            quickAccess.style.display = 'flex';
            this.showNotification('Interface affichée', 'info');
        } else {
            container.style.display = 'none';
            quickAccess.style.display = 'none';
            this.showNotification('Interface masquée (F11 pour réafficher)', 'info');
        }
    }

    openConsole() {
        // Ouvrir la console de développement
        this.showNotification('Console ouverte (F12)', 'info');
    }

    saveGame() {
        // Logique de sauvegarde
        this.showNotification('Partie sauvegardée', 'success');
    }

    loadGame() {
        // Logique de chargement
        this.showNotification('Sélectionnez une sauvegarde', 'info');
    }

    newGame() {
        // Logique nouvelle partie
        this.showNotification('Nouvelle partie', 'info');
    }

    quitGame() {
        if (confirm('Êtes-vous sûr de vouloir quitter le jeu ?')) {
            // Logique de fermeture
            this.showNotification('Au revoir !', 'info');
        }
    }

    toggleMute() {
        // Logique de son
        this.showNotification('Son coupé/activé', 'info');
    }

    pauseGame() {
        this.game.paused = !this.game.paused;
        this.showNotification(`Jeu ${this.game.paused ? 'en pause' : 'repris'}`, 'info');
    }

    cycleWindows() {
        // Logique de cycle des fenêtres
        const windows = Array.from(windowManager.windows.keys());
        if (windows.length > 0) {
            const currentIndex = windows.indexOf(windowManager.activeWindow);
            const nextIndex = (currentIndex + 1) % windows.length;
            windowManager.focusWindow(windows[nextIndex]);
        }
    }

    closeActiveWindow() {
        if (windowManager.activeWindow) {
            windowManager.closeWindow(windowManager.activeWindow);
        }
    }

    minimizeAllWindows() {
        windowManager.windows.forEach((window, id) => {
            windowManager.minimizeWindow(id);
        });
        this.showNotification('Toutes les fenêtres minimisées', 'info');
    }

    showDesktop() {
        this.minimizeAllWindows();
    }

    resetWindowPositions() {
        localStorage.removeItem('gameWindowPositions');
        this.showNotification('Positions des fenêtres réinitialisées', 'info');
    }

    hideAllWindows() {
        const container = document.getElementById('windowContainer');
        container.style.display = 'none';
        this.showNotification('Toutes les fenêtres masquées', 'info');
    }

    showAllWindows() {
        const container = document.getElementById('windowContainer');
        container.style.display = 'block';
        this.showNotification('Toutes les fenêtres affichées', 'info');
    }

    showKeyboardShortcuts() {
        const shortcuts = `
            <div style="font-family: 'VT323', monospace;">
                <h3>Raccourcis Clavier</h3>
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-top: 15px;">
                    <strong>F1</strong><span>Aide</span>
                    <strong>F2</strong><span>Mode Debug</span>
                    <strong>F3</strong><span>Capture d'écran</span>
                    <strong>F4</strong><span>Plein écran</span>
                    <strong>F5</strong><span>Sauvegarde rapide</span>
                    <strong>F9</strong><span>Chargement rapide</span>
                    <strong>F11</strong><span>Masquer/Afficher UI</span>
                    <strong>I</strong><span>Inventaire</span>
                    <strong>C</strong><span>Personnage</span>
                    <strong>Q</strong><span>Quêtes</span>
                    <strong>M</strong><span>Carte</span>
                    <strong>J</strong><span>Journal</span>
                    <strong>O</strong><span>Options</span>
                    <strong>Ctrl+S</strong><span>Sauvegarder</span>
                    <strong>Ctrl+P</strong><span>Pause</span>
                    <strong>Alt+Tab</strong><span>Changer de fenêtre</span>
                </div>
            </div>
        `;
        
        windowManager.createWindow('shortcuts', 'Raccourcis Clavier', shortcuts, {
            width: 400,
            height: 500,
            icon: 'fas fa-keyboard'
        });
    }

    showAbout() {
        const about = `
            <div style="text-align: center; font-family: 'VT323', monospace;">
                <h2 style="color: #FF9800;">Super Pixel Adventure 2</h2>
                <p>Version 2.0</p>
                <br>
                <p>Un jeu d'aventure en pixel art avec une interface modulaire complète.</p>
                <br>
                <p>Fonctionnalités:</p>
                <ul style="text-align: left; margin: 15px 0;">
                    <li>Interface modulaire type Windows</li>
                    <li>Système de fenêtres redimensionnables</li>
                    <li>Menus complets (Inventaire, Personnage, Quêtes, etc.)</li>
                    <li>Raccourcis clavier avancés</li>
                    <li>Système de notifications</li>
                    <li>Sauvegarde des positions</li>
                </ul>
                <br>
                <p style="color: #999;">Développé avec ❤️</p>
            </div>
        `;
        
        windowManager.createWindow('about', 'À Propos', about, {
            width: 350,
            height: 400,
            icon: 'fas fa-info-circle'
        });
    }

    // Actions du menu contextuel
    useItem(target) {
        this.showNotification('Objet utilisé', 'success');
    }

    equipItem(target) {
        this.showNotification('Objet équipé', 'success');
    }

    examineItem(target) {
        this.showNotification('Examen de l\'objet', 'info');
    }

    splitItem(target) {
        this.showNotification('Objet divisé', 'info');
    }

    dropItem(target) {
        this.showNotification('Objet jeté', 'warning');
    }

    destroyItem(target) {
        if (confirm('Êtes-vous sûr de vouloir détruire cet objet ?')) {
            this.showNotification('Objet détruit', 'error');
        }
    }

    addWaypoint(x, y) {
        this.showNotification(`Repère ajouté à (${x}, ${y})`, 'success');
    }

    navigateTo(x, y) {
        this.showNotification(`Navigation vers (${x}, ${y})`, 'info');
    }

    measureDistance(x, y) {
        this.showNotification('Mode mesure activé', 'info');
    }

    centerMapOnPlayer() {
        this.showNotification('Carte centrée sur le joueur', 'info');
    }

    resetMapZoom() {
        this.showNotification('Zoom de la carte réinitialisé', 'info');
    }

    // Méthodes utilitaires
    update() {
        // Mise à jour de l'interface
        this.updateQuickAccessBar();
        this.updateNotifications();
    }

    updateQuickAccessBar() {
        // Mettre à jour l'état des boutons de la barre d'accès rapide
    }

    updateNotifications() {
        // Gérer les notifications automatiques du jeu
    }
}

// Connecter le gestionnaire de fenêtres au menu principal
windowManager.toggleMainMenu = function() {
    if (window.uiManager) {
        window.uiManager.toggleMainMenu();
    }
};

export { UIManager };