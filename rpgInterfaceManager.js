// rpgInterfaceManager.js - Gestionnaire d'Interface RPG Complète

export class RPGInterfaceManager {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.draggedWindow = null;
        this.dragOffset = { x: 0, y: 0 };
        this.contextMenu = null;
        this.notifications = [];
        
        this.windowPositions = new Map();
        this.windowSizes = new Map();
        
        this.init();
    }

    init() {
        console.log("🎮 Initialisation de l'interface RPG...");
        
        this.createRPGInterface();
        this.setupEventListeners();
        this.initializeWindows();
        this.setupHUD();
        this.setupMinimap();
        
        console.log("✅ Interface RPG initialisée !");
    }

    createRPGInterface() {
        // Créer le conteneur principal de l'interface
        const rpgInterface = document.createElement('div');
        rpgInterface.id = 'rpgInterface';
        document.body.appendChild(rpgInterface);

        // Créer le HUD principal
        const hud = document.createElement('div');
        hud.id = 'rpgHUD';
        hud.innerHTML = `
            <div class="rpg-stats-container">
                <div class="rpg-stat-bar">
                    <div class="rpg-stat-icon health"><i class="fas fa-heart"></i></div>
                    <div class="rpg-progress-bar">
                        <div class="rpg-progress-fill health" style="width: 100%"></div>
                        <div class="rpg-progress-text">100/100</div>
                    </div>
                </div>
                <div class="rpg-stat-bar">
                    <div class="rpg-stat-icon mana"><i class="fas fa-magic"></i></div>
                    <div class="rpg-progress-bar">
                        <div class="rpg-progress-fill mana" style="width: 80%"></div>
                        <div class="rpg-progress-text">80/100</div>
                    </div>
                </div>
            </div>
            
            <div class="rpg-action-bar">
                <div class="rpg-action-slot" data-action="inventory">
                    <i class="fas fa-backpack"></i>
                    <div class="keybind">I</div>
                </div>
                <div class="rpg-action-slot" data-action="character">
                    <i class="fas fa-user"></i>
                    <div class="keybind">C</div>
                </div>
                <div class="rpg-action-slot" data-action="quests">
                    <i class="fas fa-scroll"></i>
                    <div class="keybind">Q</div>
                </div>
                <div class="rpg-action-slot" data-action="map">
                    <i class="fas fa-map"></i>
                    <div class="keybind">M</div>
                </div>
                <div class="rpg-action-slot" data-action="crafting">
                    <i class="fas fa-hammer"></i>
                    <div class="keybind">O</div>
                </div>
                <div class="rpg-action-slot" data-action="journal">
                    <i class="fas fa-book"></i>
                    <div class="keybind">J</div>
                </div>
                <div class="rpg-action-slot" data-action="settings">
                    <i class="fas fa-cog"></i>
                    <div class="keybind">ESC</div>
                </div>
            </div>
            
            <div class="rpg-player-info">
                <div class="rpg-player-level">Niveau 12</div>
                <div class="rpg-player-gold">
                    <i class="fas fa-coins"></i>
                    <span>1,247</span>
                </div>
            </div>
        `;
        rpgInterface.appendChild(hud);

        // Créer la minimap
        const minimap = document.createElement('div');
        minimap.className = 'rpg-minimap';
        minimap.innerHTML = `
            <div class="rpg-minimap-header">
                <i class="fas fa-compass"></i> Carte
            </div>
            <div class="rpg-minimap-content" id="minimapContent">
                <!-- Contenu de la minimap généré dynamiquement -->
            </div>
        `;
        rpgInterface.appendChild(minimap);
    }

    initializeWindows() {
        const windowConfigs = [
            {
                id: 'inventoryWindow',
                title: 'Inventaire',
                icon: 'fas fa-backpack',
                defaultPosition: { x: 100, y: 100 },
                defaultSize: { width: 400, height: 500 },
                content: this.generateInventoryContent()
            },
            {
                id: 'characterWindow',
                title: 'Personnage',
                icon: 'fas fa-user',
                defaultPosition: { x: 150, y: 150 },
                defaultSize: { width: 350, height: 450 },
                content: this.generateCharacterContent()
            },
            {
                id: 'questWindow',
                title: 'Journal des Quêtes',
                icon: 'fas fa-scroll',
                defaultPosition: { x: 200, y: 200 },
                defaultSize: { width: 450, height: 400 },
                content: this.generateQuestContent()
            },
            {
                id: 'mapWindow',
                title: 'Carte du Monde',
                icon: 'fas fa-map',
                defaultPosition: { x: 250, y: 100 },
                defaultSize: { width: 500, height: 400 },
                content: this.generateMapContent()
            },
            {
                id: 'craftingWindow',
                title: 'Artisanat',
                icon: 'fas fa-hammer',
                defaultPosition: { x: 300, y: 150 },
                defaultSize: { width: 450, height: 350 },
                content: this.generateCraftingContent()
            },
            {
                id: 'journalWindow',
                title: 'Journal Personnel',
                icon: 'fas fa-book',
                defaultPosition: { x: 350, y: 200 },
                defaultSize: { width: 400, height: 300 },
                content: this.generateJournalContent()
            },
            {
                id: 'settingsWindow',
                title: 'Paramètres',
                icon: 'fas fa-cog',
                defaultPosition: { x: 400, y: 100 },
                defaultSize: { width: 350, height: 400 },
                content: this.generateSettingsContent()
            },
            {
                id: 'dialogueWindow',
                title: 'Dialogue',
                icon: 'fas fa-comments',
                defaultPosition: { x: 300, y: 250 },
                defaultSize: { width: 400, height: 250 },
                content: '<div class="dialogue-placeholder">Aucun dialogue actif</div>'
            }
        ];

        windowConfigs.forEach(config => {
            this.createWindow(config);
        });
    }

    createWindow(config) {
        const window = document.createElement('div');
        window.id = config.id;
        window.className = 'rpg-window';
        
        // Position et taille par défaut
        const pos = this.windowPositions.get(config.id) || config.defaultPosition;
        const size = this.windowSizes.get(config.id) || config.defaultSize;
        
        window.style.left = pos.x + 'px';
        window.style.top = pos.y + 'px';
        window.style.width = size.width + 'px';
        window.style.height = size.height + 'px';

        window.innerHTML = `
            <div class="rpg-window-header">
                <div class="rpg-window-title">
                    <i class="${config.icon}"></i>
                    ${config.title}
                </div>
                <div class="rpg-window-controls">
                    <button class="rpg-window-btn minimize-btn" onclick="rpgInterface.minimizeWindow('${config.id}')">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="rpg-window-btn close-btn" onclick="rpgInterface.closeWindow('${config.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="rpg-window-content" id="${config.id}Content">
                ${config.content}
            </div>
        `;

        document.getElementById('rpgInterface').appendChild(window);
        this.windows.set(config.id, window);
    }

    setupEventListeners() {
        // Gestion des raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.key.toLowerCase()) {
                case 'i':
                    e.preventDefault();
                    this.toggleWindow('inventoryWindow');
                    break;
                case 'c':
                    e.preventDefault();
                    this.toggleWindow('characterWindow');
                    break;
                case 'q':
                    e.preventDefault();
                    this.toggleWindow('questWindow');
                    break;
                case 'm':
                    e.preventDefault();
                    this.toggleWindow('mapWindow');
                    break;
                case 'o':
                    e.preventDefault();
                    this.toggleWindow('craftingWindow');
                    break;
                case 'j':
                    e.preventDefault();
                    this.toggleWindow('journalWindow');
                    break;
                case 'escape':
                    e.preventDefault();
                    if (this.hasOpenWindows()) {
                        this.closeAllWindows();
                    } else {
                        this.toggleWindow('settingsWindow');
                    }
                    break;
            }
        });

        // Gestion des clics sur les boutons d'action
        document.addEventListener('click', (e) => {
            if (e.target.closest('.rpg-action-slot')) {
                const slot = e.target.closest('.rpg-action-slot');
                const action = slot.dataset.action;
                this.handleActionClick(action);
            }
        });

        // Gestion du glisser-déposer des fenêtres
        document.addEventListener('mousedown', (e) => {
            const header = e.target.closest('.rpg-window-header');
            if (header && !e.target.closest('.rpg-window-controls')) {
                this.startDragging(header.parentElement, e);
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (this.draggedWindow) {
                this.dragWindow(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.draggedWindow) {
                this.stopDragging();
            }
        });

        // Fermer le menu contextuel en cliquant ailleurs
        document.addEventListener('click', (e) => {
            if (this.contextMenu && !e.target.closest('.rpg-context-menu')) {
                this.hideContextMenu();
            }
        });
    }

    handleActionClick(action) {
        const actionMap = {
            'inventory': 'inventoryWindow',
            'character': 'characterWindow',
            'quests': 'questWindow',
            'map': 'mapWindow',
            'crafting': 'craftingWindow',
            'journal': 'journalWindow',
            'settings': 'settingsWindow'
        };

        const windowId = actionMap[action];
        if (windowId) {
            this.toggleWindow(windowId);
        }
    }

    toggleWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        if (window.classList.contains('active')) {
            this.closeWindow(windowId);
        } else {
            this.openWindow(windowId);
        }
    }

    openWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        // Fermer les autres fenêtres si nécessaire (optionnel)
        // this.closeAllWindows();

        window.classList.add('active');
        window.classList.remove('minimized');
        this.activeWindow = windowId;

        // Mettre la fenêtre au premier plan
        this.bringToFront(window);

        // Générer le contenu dynamique
        this.updateWindowContent(windowId);

        console.log(`📖 Fenêtre ${windowId} ouverte`);
    }

    closeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        window.classList.remove('active');
        
        if (this.activeWindow === windowId) {
            this.activeWindow = null;
        }

        console.log(`📖 Fenêtre ${windowId} fermée`);
    }

    minimizeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        window.classList.add('minimized');
        window.classList.remove('active');

        if (this.activeWindow === windowId) {
            this.activeWindow = null;
        }

        console.log(`📖 Fenêtre ${windowId} minimisée`);
    }

    closeAllWindows() {
        this.windows.forEach((window, windowId) => {
            this.closeWindow(windowId);
        });
    }

    hasOpenWindows() {
        return Array.from(this.windows.values()).some(window => 
            window.classList.contains('active')
        );
    }

    bringToFront(window) {
        const maxZ = Math.max(...Array.from(this.windows.values()).map(w => 
            parseInt(w.style.zIndex) || 10
        ));
        window.style.zIndex = maxZ + 1;
    }

    startDragging(window, e) {
        this.draggedWindow = window;
        const rect = window.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        window.style.cursor = 'grabbing';
        this.bringToFront(window);
    }

    dragWindow(e) {
        if (!this.draggedWindow) return;

        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;

        // Contraintes de position
        const maxX = window.innerWidth - this.draggedWindow.offsetWidth;
        const maxY = window.innerHeight - this.draggedWindow.offsetHeight;

        this.draggedWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
        this.draggedWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    }

    stopDragging() {
        if (this.draggedWindow) {
            this.draggedWindow.style.cursor = '';
            
            // Sauvegarder la position
            const windowId = this.draggedWindow.id;
            this.windowPositions.set(windowId, {
                x: parseInt(this.draggedWindow.style.left),
                y: parseInt(this.draggedWindow.style.top)
            });
            
            this.draggedWindow = null;
        }
    }

    updateWindowContent(windowId) {
        const contentElement = document.getElementById(windowId + 'Content');
        if (!contentElement) return;

        switch (windowId) {
            case 'inventoryWindow':
                contentElement.innerHTML = this.generateInventoryContent();
                break;
            case 'characterWindow':
                contentElement.innerHTML = this.generateCharacterContent();
                break;
            case 'questWindow':
                contentElement.innerHTML = this.generateQuestContent();
                break;
            case 'mapWindow':
                contentElement.innerHTML = this.generateMapContent();
                break;
            case 'craftingWindow':
                contentElement.innerHTML = this.generateCraftingContent();
                break;
            case 'journalWindow':
                contentElement.innerHTML = this.generateJournalContent();
                break;
            case 'settingsWindow':
                contentElement.innerHTML = this.generateSettingsContent();
                break;
        }
    }

    // === GÉNÉRATION DE CONTENU ===

    generateInventoryContent() {
        return `
            <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; margin-bottom: 20px;">
                ${Array.from({length: 40}, (_, i) => `
                    <div class="rpg-action-slot" style="width: 40px; height: 40px; font-size: 14px;">
                        ${i < 10 ? '<i class="fas fa-sword"></i>' : ''}
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--rpg-bg-light); border-radius: 4px;">
                <div><i class="fas fa-weight-hanging"></i> Poids: 45/100</div>
                <div><i class="fas fa-coins"></i> Or: 1,247</div>
            </div>
        `;
    }

    generateCharacterContent() {
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h3 style="color: var(--rpg-accent); margin-bottom: 15px;">Statistiques</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div class="rpg-stat-bar">
                            <span style="min-width: 80px;">Force:</span>
                            <div class="rpg-progress-bar" style="height: 16px;">
                                <div class="rpg-progress-fill" style="width: 75%; background: var(--rpg-danger);"></div>
                                <div class="rpg-progress-text" style="font-size: 10px;">15</div>
                            </div>
                        </div>
                        <div class="rpg-stat-bar">
                            <span style="min-width: 80px;">Agilité:</span>
                            <div class="rpg-progress-bar" style="height: 16px;">
                                <div class="rpg-progress-fill" style="width: 60%; background: var(--rpg-success);"></div>
                                <div class="rpg-progress-text" style="font-size: 10px;">12</div>
                            </div>
                        </div>
                        <div class="rpg-stat-bar">
                            <span style="min-width: 80px;">Intelligence:</span>
                            <div class="rpg-progress-bar" style="height: 16px;">
                                <div class="rpg-progress-fill" style="width: 85%; background: var(--rpg-info);"></div>
                                <div class="rpg-progress-text" style="font-size: 10px;">17</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 style="color: var(--rpg-accent); margin-bottom: 15px;">Équipement</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                        <div class="rpg-action-slot" style="width: 50px; height: 50px;"><i class="fas fa-helmet-battle"></i></div>
                        <div class="rpg-action-slot" style="width: 50px; height: 50px;"></div>
                        <div class="rpg-action-slot" style="width: 50px; height: 50px;"><i class="fas fa-ring"></i></div>
                        <div class="rpg-action-slot" style="width: 50px; height: 50px;"><i class="fas fa-shirt"></i></div>
                        <div class="rpg-action-slot" style="width: 50px; height: 50px;"><i class="fas fa-sword"></i></div>
                        <div class="rpg-action-slot" style="width: 50px; height: 50px;"><i class="fas fa-shield"></i></div>
                        <div class="rpg-action-slot" style="width: 50px; height: 50px;"><i class="fas fa-boot"></i></div>
                        <div class="rpg-action-slot" style="width: 50px; height: 50px;"></div>
                        <div class="rpg-action-slot" style="width: 50px; height: 50px;"><i class="fas fa-ring"></i></div>
                    </div>
                </div>
            </div>
        `;
    }

    generateQuestContent() {
        return `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div style="background: var(--rpg-bg-light); padding: 15px; border-radius: 8px; border-left: 4px solid var(--rpg-accent);">
                    <h4 style="color: var(--rpg-accent); margin: 0 0 10px 0;"><i class="fas fa-star"></i> Quête Divine</h4>
                    <p style="margin: 0 0 10px 0; color: var(--rpg-text-secondary);">Retrouver l'Archange Gabriel dans les Pics Divins</p>
                    <div class="rpg-progress-bar" style="height: 12px;">
                        <div class="rpg-progress-fill" style="width: 65%; background: var(--rpg-accent);"></div>
                        <div class="rpg-progress-text" style="font-size: 10px;">65%</div>
                    </div>
                </div>
                
                <div style="background: var(--rpg-bg-light); padding: 15px; border-radius: 8px; border-left: 4px solid var(--rpg-danger);">
                    <h4 style="color: var(--rpg-danger); margin: 0 0 10px 0;"><i class="fas fa-fire"></i> Quête Infernale</h4>
                    <p style="margin: 0 0 10px 0; color: var(--rpg-text-secondary);">Vaincre le Démon des Profondeurs</p>
                    <div class="rpg-progress-bar" style="height: 12px;">
                        <div class="rpg-progress-fill" style="width: 25%; background: var(--rpg-danger);"></div>
                        <div class="rpg-progress-text" style="font-size: 10px;">25%</div>
                    </div>
                </div>
                
                <div style="background: var(--rpg-bg-light); padding: 15px; border-radius: 8px; border-left: 4px solid var(--rpg-success);">
                    <h4 style="color: var(--rpg-success); margin: 0 0 10px 0;"><i class="fas fa-leaf"></i> Quête de Collection</h4>
                    <p style="margin: 0 0 10px 0; color: var(--rpg-text-secondary);">Collecter 50 Cristaux de Vie</p>
                    <div class="rpg-progress-bar" style="height: 12px;">
                        <div class="rpg-progress-fill" style="width: 80%; background: var(--rpg-success);"></div>
                        <div class="rpg-progress-text" style="font-size: 10px;">40/50</div>
                    </div>
                </div>
            </div>
        `;
    }

    generateMapContent() {
        return `
            <div style="width: 100%; height: 100%; background: linear-gradient(180deg, 
                #FFE4B5 0%,    /* Paradis */
                #87CEEB 15%,   /* Ciel */
                #32CD32 30%,   /* Forêts */
                #9370DB 45%,   /* Cristaux */
                #DAA520 60%,   /* Plaines */
                #8B4513 75%,   /* Terres sombres */
                #8B0000 90%,   /* Enfer */
                #000000 100%   /* Abysse */
            ); position: relative; border-radius: 4px; overflow: hidden;">
                <div style="position: absolute; top: 10%; left: 50%; transform: translateX(-50%); color: #000; font-weight: bold; text-shadow: 1px 1px 2px #fff;">
                    <i class="fas fa-church"></i> Paradis
                </div>
                <div style="position: absolute; top: 30%; left: 30%; color: #000; font-weight: bold; text-shadow: 1px 1px 2px #fff;">
                    <i class="fas fa-tree"></i> Forêt Enchantée
                </div>
                <div style="position: absolute; top: 45%; left: 70%; color: #fff; font-weight: bold; text-shadow: 1px 1px 2px #000;">
                    <i class="fas fa-gem"></i> Cavernes de Cristal
                </div>
                <div style="position: absolute; top: 60%; left: 40%; color: #000; font-weight: bold; text-shadow: 1px 1px 2px #fff;">
                    <i class="fas fa-mountain"></i> Plaines Dorées
                </div>
                <div style="position: absolute; top: 80%; left: 60%; color: #fff; font-weight: bold; text-shadow: 1px 1px 2px #000;">
                    <i class="fas fa-fire"></i> Terres Infernales
                </div>
                <div style="position: absolute; top: 95%; left: 50%; transform: translateX(-50%); color: #fff; font-weight: bold; text-shadow: 1px 1px 2px #000;">
                    <i class="fas fa-skull"></i> Abysse
                </div>
                
                <!-- Marqueur joueur -->
                <div style="position: absolute; top: 50%; left: 45%; width: 12px; height: 12px; background: var(--rpg-accent); border: 2px solid #fff; border-radius: 50%; animation: rpg-glow 2s infinite;">
                </div>
            </div>
        `;
    }

    generateCraftingContent() {
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 100%;">
                <div>
                    <h3 style="color: var(--rpg-accent); margin-bottom: 15px;">Station d'Artisanat</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-bottom: 20px;">
                        ${Array.from({length: 9}, (_, i) => `
                            <div class="rpg-action-slot" style="width: 50px; height: 50px;">
                                ${i === 4 ? '<i class="fas fa-arrow-right"></i>' : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div style="text-align: center;">
                        <div class="rpg-action-slot" style="width: 60px; height: 60px; margin: 0 auto;">
                            <i class="fas fa-sword" style="color: var(--rpg-accent);"></i>
                        </div>
                        <p style="margin: 10px 0; color: var(--rpg-text-secondary);">Épée de Fer</p>
                    </div>
                </div>
                <div>
                    <h3 style="color: var(--rpg-accent); margin-bottom: 15px;">Recettes</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px; max-height: 200px; overflow-y: auto;">
                        <div style="background: var(--rpg-bg-light); padding: 10px; border-radius: 4px; cursor: pointer;" onclick="this.style.background='var(--rpg-accent)'; this.style.color='var(--rpg-primary)';">
                            <i class="fas fa-sword"></i> Épée de Fer
                        </div>
                        <div style="background: var(--rpg-bg-light); padding: 10px; border-radius: 4px; cursor: pointer;" onclick="this.style.background='var(--rpg-accent)'; this.style.color='var(--rpg-primary)';">
                            <i class="fas fa-shield"></i> Bouclier de Bois
                        </div>
                        <div style="background: var(--rpg-bg-light); padding: 10px; border-radius: 4px; cursor: pointer;" onclick="this.style.background='var(--rpg-accent)'; this.style.color='var(--rpg-primary)';">
                            <i class="fas fa-helmet-battle"></i> Casque de Cuir
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateJournalContent() {
        return `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <div style="display: flex; gap: 10px; border-bottom: 1px solid var(--rpg-border); padding-bottom: 10px;">
                    <button style="background: var(--rpg-accent); color: var(--rpg-primary); border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Découvertes</button>
                    <button style="background: var(--rpg-bg-light); color: var(--rpg-text); border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Lore</button>
                    <button style="background: var(--rpg-bg-light); color: var(--rpg-text); border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Succès</button>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="background: var(--rpg-bg-light); padding: 12px; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: var(--rpg-accent); font-weight: bold;">Première Rencontre</span>
                            <span style="color: var(--rpg-text-secondary); font-size: 12px;">Il y a 2h</span>
                        </div>
                        <p style="margin: 0; color: var(--rpg-text-secondary); font-size: 14px;">Vous avez rencontré Gabriel l'Archange dans les Pics Divins.</p>
                    </div>
                    
                    <div style="background: var(--rpg-bg-light); padding: 12px; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: var(--rpg-accent); font-weight: bold;">Cristal Découvert</span>
                            <span style="color: var(--rpg-text-secondary); font-size: 12px;">Il y a 1h</span>
                        </div>
                        <p style="margin: 0; color: var(--rpg-text-secondary); font-size: 14px;">Un cristal de vie rare a été trouvé dans les cavernes.</p>
                    </div>
                </div>
            </div>
        `;
    }

    generateSettingsContent() {
        return `
            <div style="display: flex; flex-direction: column; gap: 20px;">
                <div>
                    <h3 style="color: var(--rpg-accent); margin-bottom: 15px;">Audio</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Volume Principal</span>
                            <input type="range" min="0" max="100" value="80" style="width: 120px;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Effets Sonores</span>
                            <input type="range" min="0" max="100" value="70" style="width: 120px;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Musique</span>
                            <input type="range" min="0" max="100" value="60" style="width: 120px;">
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 style="color: var(--rpg-accent); margin-bottom: 15px;">Affichage</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <label style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" checked>
                            <span>Afficher les dégâts</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" checked>
                            <span>Minimap visible</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox">
                            <span>Mode plein écran</span>
                        </label>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button style="background: var(--rpg-accent); color: var(--rpg-primary); border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; flex: 1;">
                        Sauvegarder
                    </button>
                    <button style="background: var(--rpg-bg-light); color: var(--rpg-text); border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; flex: 1;">
                        Annuler
                    </button>
                </div>
            </div>
        `;
    }

    setupHUD() {
        // Mise à jour périodique du HUD
        setInterval(() => {
            this.updateHUD();
        }, 1000);
    }

    updateHUD() {
        // Mettre à jour les barres de vie/mana/etc.
        if (window.game && window.game.player) {
            const player = window.game.player;
            
            // Mise à jour de la vie
            const healthFill = document.querySelector('.rpg-progress-fill.health');
            const healthText = healthFill?.parentElement.querySelector('.rpg-progress-text');
            if (healthFill && healthText) {
                const healthPercent = (player.health / player.maxHealth) * 100;
                healthFill.style.width = healthPercent + '%';
                healthText.textContent = `${player.health}/${player.maxHealth}`;
            }
            
            // Mise à jour de la mana
            const manaFill = document.querySelector('.rpg-progress-fill.mana');
            const manaText = manaFill?.parentElement.querySelector('.rpg-progress-text');
            if (manaFill && manaText) {
                const manaPercent = (player.mana / player.maxMana) * 100;
                manaFill.style.width = manaPercent + '%';
                manaText.textContent = `${player.mana}/${player.maxMana}`;
            }
            
            // Mise à jour de l'or
            const goldElement = document.querySelector('.rpg-player-gold span');
            if (goldElement && player.gold !== undefined) {
                goldElement.textContent = player.gold.toLocaleString();
            }
            
            // Mise à jour du niveau
            const levelElement = document.querySelector('.rpg-player-level');
            if (levelElement && player.level !== undefined) {
                levelElement.textContent = `Niveau ${player.level}`;
            }
        }
    }

    setupMinimap() {
        // Configuration de la minimap
        const minimapContent = document.getElementById('minimapContent');
        if (minimapContent) {
            // Générer la minimap basique
            minimapContent.innerHTML = `
                <div style="width: 100%; height: 100%; background: radial-gradient(circle, #2c1810, #4a3728); position: relative;">
                    <div style="position: absolute; top: 50%; left: 50%; width: 4px; height: 4px; background: var(--rpg-accent); border-radius: 50%; transform: translate(-50%, -50%);"></div>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `rpg-notification ${type}`;
        notification.textContent = message;
        
        document.getElementById('rpgInterface').appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => {
            notification.classList.add('active');
        }, 100);
        
        // Suppression automatique
        setTimeout(() => {
            notification.classList.remove('active');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    showContextMenu(x, y, items) {
        this.hideContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'rpg-context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'rpg-context-item';
            menuItem.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;
            menuItem.onclick = () => {
                item.action();
                this.hideContextMenu();
            };
            menu.appendChild(menuItem);
        });
        
        document.getElementById('rpgInterface').appendChild(menu);
        this.contextMenu = menu;
        
        setTimeout(() => {
            menu.classList.add('active');
        }, 10);
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.classList.remove('active');
            setTimeout(() => {
                this.contextMenu?.remove();
                this.contextMenu = null;
            }, 200);
        }
    }
}

// Rendre accessible globalement
window.RPGInterfaceManager = RPGInterfaceManager;