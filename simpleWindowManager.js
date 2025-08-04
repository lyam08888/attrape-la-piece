// simpleWindowManager.js - Gestionnaire de fenêtres simplifié pour les fenêtres HTML existantes
export class WindowManager {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.zIndexCounter = 1000;
        this.minimizedWindows = new Set();
        this.maximizedWindows = new Set();
        
        this.initializeWindowSystem();
        this.setupEventListeners();
    }

    initializeWindowSystem() {
        console.log("🪟 Initialisation du système de fenêtres modulaires...");
        
        // Attendre que le DOM soit chargé
        setTimeout(() => {
            // Initialiser toutes les fenêtres
            const windowElements = document.querySelectorAll('.game-window');
            console.log(`🔍 Trouvé ${windowElements.length} fenêtres à initialiser`);
            
            windowElements.forEach(windowEl => {
                this.registerWindow(windowEl.id, {
                    element: windowEl,
                    isVisible: false,
                    isMinimized: false,
                    isMaximized: false,
                    originalPosition: null,
                    originalSize: null
                });
            });
            
            // Rendre les fenêtres déplaçables
            this.makeWindowsDraggable();
            
            // Rendre les fenêtres redimensionnables
            this.makeWindowsResizable();
            
            console.log("✅ Système de fenêtres initialisé");
        }, 100);
    }

    registerWindow(windowId, windowData) {
        this.windows.set(windowId, windowData);
        console.log(`📝 Fenêtre enregistrée: ${windowId}`);
    }

    setupEventListeners() {
        // Clic sur le canvas pour fermer les menus contextuels
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });

        // Clic droit pour menu contextuel
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.game-window-content')) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            }
        });

        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    makeWindowsDraggable() {
        const headers = document.querySelectorAll('.game-window-header');
        
        headers.forEach(header => {
            let isDragging = false;
            let currentX = 0;
            let currentY = 0;
            let initialX = 0;
            let initialY = 0;
            
            const windowEl = header.closest('.game-window');
            
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('.game-window-btn')) return;
                
                isDragging = true;
                this.bringToFront(windowEl);
                
                initialX = e.clientX - windowEl.offsetLeft;
                initialY = e.clientY - windowEl.offsetTop;
                
                header.style.cursor = 'grabbing';
                document.body.style.userSelect = 'none';
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                e.preventDefault();
                
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                // Limiter aux bords de l'écran
                currentX = Math.max(0, Math.min(window.innerWidth - windowEl.offsetWidth, currentX));
                currentY = Math.max(0, Math.min(window.innerHeight - windowEl.offsetHeight, currentY));
                
                windowEl.style.left = currentX + 'px';
                windowEl.style.top = currentY + 'px';
                windowEl.style.transform = 'none';
            });
            
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    header.style.cursor = 'move';
                    document.body.style.userSelect = '';
                }
            });
        });
    }

    makeWindowsResizable() {
        const windows = document.querySelectorAll('.game-window');
        
        windows.forEach(windowEl => {
            // Ajouter les poignées de redimensionnement
            this.addResizeHandles(windowEl);
        });
    }

    addResizeHandles(windowEl) {
        const handles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        
        handles.forEach(handle => {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = `resize-handle resize-${handle}`;
            resizeHandle.style.cssText = `
                position: absolute;
                background: transparent;
                z-index: 10;
            `;
            
            // Positionnement des poignées
            switch (handle) {
                case 'nw':
                    resizeHandle.style.cssText += 'top: 0; left: 0; width: 10px; height: 10px; cursor: nw-resize;';
                    break;
                case 'n':
                    resizeHandle.style.cssText += 'top: 0; left: 10px; right: 10px; height: 5px; cursor: n-resize;';
                    break;
                case 'ne':
                    resizeHandle.style.cssText += 'top: 0; right: 0; width: 10px; height: 10px; cursor: ne-resize;';
                    break;
                case 'w':
                    resizeHandle.style.cssText += 'top: 10px; left: 0; bottom: 10px; width: 5px; cursor: w-resize;';
                    break;
                case 'e':
                    resizeHandle.style.cssText += 'top: 10px; right: 0; bottom: 10px; width: 5px; cursor: e-resize;';
                    break;
                case 'sw':
                    resizeHandle.style.cssText += 'bottom: 0; left: 0; width: 10px; height: 10px; cursor: sw-resize;';
                    break;
                case 's':
                    resizeHandle.style.cssText += 'bottom: 0; left: 10px; right: 10px; height: 5px; cursor: s-resize;';
                    break;
                case 'se':
                    resizeHandle.style.cssText += 'bottom: 0; right: 0; width: 10px; height: 10px; cursor: se-resize;';
                    break;
            }
            
            windowEl.appendChild(resizeHandle);
            
            // Ajouter la logique de redimensionnement
            this.addResizeLogic(resizeHandle, windowEl, handle);
        });
    }

    addResizeLogic(handle, windowEl, direction) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;
        
        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(windowEl).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(windowEl).height, 10);
            startLeft = windowEl.offsetLeft;
            startTop = windowEl.offsetTop;
            
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            // Calculer les nouvelles dimensions selon la direction
            if (direction.includes('e')) newWidth = startWidth + dx;
            if (direction.includes('w')) {
                newWidth = startWidth - dx;
                newLeft = startLeft + dx;
            }
            if (direction.includes('s')) newHeight = startHeight + dy;
            if (direction.includes('n')) {
                newHeight = startHeight - dy;
                newTop = startTop + dy;
            }
            
            // Appliquer les contraintes minimales
            newWidth = Math.max(300, newWidth);
            newHeight = Math.max(200, newHeight);
            
            // Appliquer les changements
            windowEl.style.width = newWidth + 'px';
            windowEl.style.height = newHeight + 'px';
            
            if (direction.includes('w') || direction.includes('n')) {
                windowEl.style.left = newLeft + 'px';
                windowEl.style.top = newTop + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = '';
            }
        });
    }

    // === GESTION DES FENÊTRES ===
    
    showWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) {
            console.warn(`⚠️ Fenêtre non trouvée: ${windowId}`);
            return;
        }
        
        const windowEl = windowData.element;
        
        // Restaurer si minimisée
        if (windowData.isMinimized) {
            this.restoreWindow(windowId);
        }
        
        windowEl.classList.add('visible');
        windowData.isVisible = true;
        
        this.bringToFront(windowEl);
        this.updateTaskbar(windowId, true);
        
        // Générer le contenu
        this.generateWindowContent(windowId);
        
        this.showNotification(`${this.getWindowTitle(windowId)} ouvert`, 'success');
        console.log(`🪟 Fenêtre ouverte: ${windowId}`);
    }

    hideWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        windowData.element.classList.remove('visible');
        windowData.isVisible = false;
        
        this.updateTaskbar(windowId, false);
        console.log(`🪟 Fenêtre fermée: ${windowId}`);
    }

    toggleWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        if (windowData.isVisible) {
            this.hideWindow(windowId);
        } else {
            this.showWindow(windowId);
        }
    }

    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowEl = windowData.element;
        
        // Sauvegarder l'état actuel
        if (!windowData.isMaximized) {
            windowData.originalPosition = {
                left: windowEl.style.left,
                top: windowEl.style.top,
                width: windowEl.style.width,
                height: windowEl.style.height
            };
        }
        
        // Animation de minimisation
        windowEl.style.transition = 'all 0.3s ease';
        windowEl.style.transform = 'scale(0.1)';
        windowEl.style.opacity = '0';
        
        setTimeout(() => {
            windowEl.classList.remove('visible');
            windowEl.style.transition = '';
            windowEl.style.transform = '';
            windowEl.style.opacity = '';
            
            windowData.isVisible = false;
            windowData.isMinimized = true;
            this.minimizedWindows.add(windowId);
            
            this.updateTaskbar(windowId, false);
        }, 300);
        
        this.showNotification(`${this.getWindowTitle(windowId)} minimisé`, 'info');
    }

    maximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowEl = windowData.element;
        
        if (windowData.isMaximized) {
            // Restaurer
            this.restoreWindow(windowId);
        } else {
            // Sauvegarder la position actuelle
            windowData.originalPosition = {
                left: windowEl.style.left,
                top: windowEl.style.top,
                width: windowEl.style.width,
                height: windowEl.style.height
            };
            
            // Maximiser
            windowEl.style.left = '0px';
            windowEl.style.top = '0px';
            windowEl.style.width = '100vw';
            windowEl.style.height = 'calc(100vh - 60px)'; // Moins la taskbar
            windowEl.style.transform = 'none';
            
            windowData.isMaximized = true;
            this.maximizedWindows.add(windowId);
            
            this.showNotification(`${this.getWindowTitle(windowId)} maximisé`, 'info');
        }
    }

    restoreWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowEl = windowData.element;
        
        if (windowData.isMinimized) {
            // Restaurer depuis minimisé
            windowEl.classList.add('visible');
            windowData.isVisible = true;
            windowData.isMinimized = false;
            this.minimizedWindows.delete(windowId);
            
            this.bringToFront(windowEl);
            this.updateTaskbar(windowId, true);
        }
        
        if (windowData.isMaximized && windowData.originalPosition) {
            // Restaurer depuis maximisé
            windowEl.style.left = windowData.originalPosition.left;
            windowEl.style.top = windowData.originalPosition.top;
            windowEl.style.width = windowData.originalPosition.width;
            windowEl.style.height = windowData.originalPosition.height;
            
            windowData.isMaximized = false;
            this.maximizedWindows.delete(windowId);
        }
    }

    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        const windowEl = windowData.element;
        
        // Animation de fermeture
        windowEl.style.transition = 'all 0.2s ease';
        windowEl.style.transform = 'scale(0.9)';
        windowEl.style.opacity = '0';
        
        setTimeout(() => {
            this.hideWindow(windowId);
            windowEl.style.transition = '';
            windowEl.style.transform = '';
            windowEl.style.opacity = '';
            
            // Nettoyer l'état
            windowData.isMinimized = false;
            windowData.isMaximized = false;
            this.minimizedWindows.delete(windowId);
            this.maximizedWindows.delete(windowId);
        }, 200);
        
        this.showNotification(`${this.getWindowTitle(windowId)} fermé`, 'info');
    }

    bringToFront(windowEl) {
        this.zIndexCounter++;
        windowEl.style.zIndex = this.zIndexCounter;
        this.activeWindow = windowEl;
        
        // Mettre à jour l'apparence des fenêtres
        document.querySelectorAll('.game-window').forEach(win => {
            win.classList.remove('active');
        });
        windowEl.classList.add('active');
    }

    updateTaskbar(windowId, isVisible) {
        const taskbarItem = document.getElementById(windowId.replace('Window', 'Task'));
        if (taskbarItem) {
            if (isVisible) {
                taskbarItem.classList.add('active');
            } else {
                taskbarItem.classList.remove('active');
            }
        }
    }

    getWindowTitle(windowId) {
        const windowEl = document.getElementById(windowId);
        const titleEl = windowEl?.querySelector('.game-window-title');
        return titleEl?.textContent.trim() || windowId;
    }

    // === GÉNÉRATION DE CONTENU ===
    
    generateWindowContent(windowId) {
        const contentEl = document.getElementById(windowId.replace('Window', 'Content'));
        if (!contentEl) return;
        
        switch (windowId) {
            case 'inventoryWindow':
                this.generateInventoryContent(contentEl);
                break;
            case 'characterWindow':
                this.generateCharacterContent(contentEl);
                break;
            case 'questWindow':
                this.generateQuestContent(contentEl);
                break;
            case 'mapWindow':
                this.generateMapContent(contentEl);
                break;
            case 'craftingWindow':
                this.generateCraftingContent(contentEl);
                break;
            case 'journalWindow':
                this.generateJournalContent(contentEl);
                break;
            case 'tradeWindow':
                this.generateTradeContent(contentEl);
                break;
        }
    }

    generateInventoryContent(contentEl) {
        contentEl.innerHTML = `
            <div class="inventory-grid" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; margin-bottom: 20px;">
                ${Array.from({length: 40}, (_, i) => `
                    <div class="inventory-slot" style="
                        width: 50px; 
                        height: 50px; 
                        border: 2px solid #FFD700; 
                        border-radius: 8px; 
                        background: linear-gradient(135deg, rgba(0,0,0,0.3), rgba(40,40,40,0.3));
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.2))'" 
                       onmouseout="this.style.background='linear-gradient(135deg, rgba(0,0,0,0.3), rgba(40,40,40,0.3))'">
                        ${i < 5 ? `<i class="fas fa-gem" style="color: #9370DB;"></i>` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="inventory-stats" style="border-top: 1px solid #FFD700; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Poids: <span style="color: #32CD32;">15/100</span></span>
                    <span>Or: <span style="color: #FFD700;">2,547</span></span>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn-primary" onclick="window.windowManager.sortInventory()">Trier</button>
                    <button class="btn-secondary" onclick="window.windowManager.showInventoryFilter()">Filtrer</button>
                </div>
            </div>
        `;
    }

    generateCharacterContent(contentEl) {
        contentEl.innerHTML = `
            <div class="character-panel" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="character-stats">
                    <h3 style="color: #FFD700; margin-bottom: 15px;">Statistiques</h3>
                    <div class="stat-bar" style="margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Vie</span>
                            <span style="color: #FF4500;">100/100</span>
                        </div>
                        <div style="background: rgba(0,0,0,0.5); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #FF4500, #FF6347); height: 100%; width: 100%;"></div>
                        </div>
                    </div>
                    <div class="stat-bar" style="margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Mana</span>
                            <span style="color: #4169E1;">50/50</span>
                        </div>
                        <div style="background: rgba(0,0,0,0.5); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #4169E1, #6495ED); height: 100%; width: 100%;"></div>
                        </div>
                    </div>
                    <div class="stat-list" style="margin-top: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Force</span>
                            <span style="color: #32CD32;">15</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Agilité</span>
                            <span style="color: #32CD32;">12</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Intelligence</span>
                            <span style="color: #32CD32;">18</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Alignement</span>
                            <span style="color: #FFD700;">Neutre</span>
                        </div>
                    </div>
                </div>
                <div class="character-equipment">
                    <h3 style="color: #FFD700; margin-bottom: 15px;">Équipement</h3>
                    <div class="equipment-slots" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        ${['Casque', 'Armure', 'Bottes', 'Arme', 'Bouclier', 'Accessoire'].map(slot => `
                            <div class="equipment-slot" style="
                                border: 2px solid #FFD700;
                                border-radius: 8px;
                                padding: 15px;
                                text-align: center;
                                background: linear-gradient(135deg, rgba(0,0,0,0.3), rgba(40,40,40,0.3));
                                cursor: pointer;
                            ">
                                <div style="font-size: 0.8rem; color: #FFA500; margin-bottom: 5px;">${slot}</div>
                                <i class="fas fa-plus" style="color: #666;"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    generateQuestContent(contentEl) {
        const quests = [
            {
                title: "Purification du Sanctuaire",
                description: "Gabriel l'Archange vous demande de purifier un sanctuaire corrompu.",
                progress: 60,
                type: "divine",
                rewards: ["1000 XP", "Arme Bénie", "Faveur Divine"]
            },
            {
                title: "Collecte de Cristaux",
                description: "Maître Prisme a besoin de cristaux rares pour ses recherches.",
                progress: 30,
                type: "collection",
                rewards: ["500 XP", "Cristal de Mana", "200 Or"]
            },
            {
                title: "Contrat Infernal",
                description: "Baal le Destructeur propose un pacte dangereux mais lucratif.",
                progress: 0,
                type: "infernal",
                rewards: ["Pouvoir Démoniaque", "Âme Corrompue", "Artefact Maudit"]
            }
        ];

        contentEl.innerHTML = `
            <div class="quest-list">
                ${quests.map(quest => `
                    <div class="quest-item" style="
                        border: 2px solid ${quest.type === 'divine' ? '#FFD700' : quest.type === 'infernal' ? '#FF4500' : '#9370DB'};
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 15px;
                        background: linear-gradient(135deg, rgba(0,0,0,0.3), rgba(40,40,40,0.3));
                    ">
                        <div class="quest-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="color: ${quest.type === 'divine' ? '#FFD700' : quest.type === 'infernal' ? '#FF4500' : '#9370DB'}; margin: 0;">
                                ${quest.title}
                            </h4>
                            <span style="color: #32CD32; font-weight: bold;">${quest.progress}%</span>
                        </div>
                        <p style="color: #E0E0E0; margin-bottom: 15px; line-height: 1.4;">${quest.description}</p>
                        <div class="quest-progress" style="background: rgba(0,0,0,0.5); height: 8px; border-radius: 4px; margin-bottom: 15px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #32CD32, #90EE90); height: 100%; width: ${quest.progress}%; transition: width 0.3s ease;"></div>
                        </div>
                        <div class="quest-rewards">
                            <div style="color: #FFA500; font-size: 0.9rem; margin-bottom: 5px;">Récompenses:</div>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                ${quest.rewards.map(reward => `
                                    <span style="
                                        background: rgba(255, 215, 0, 0.2);
                                        border: 1px solid #FFD700;
                                        border-radius: 6px;
                                        padding: 4px 8px;
                                        font-size: 0.8rem;
                                        color: #FFD700;
                                    ">${reward}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    generateMapContent(contentEl) {
        contentEl.innerHTML = `
            <div class="world-map" style="position: relative; width: 100%; height: 400px; background: linear-gradient(180deg, 
                #FFE4B5 0%,    /* Paradis */
                #87CEEB 15%,   /* Ciel */
                #32CD32 30%,   /* Forêts */
                #9370DB 45%,   /* Cristaux */
                #DAA520 60%,   /* Plaines */
                #8B4513 75%,   /* Terres sombres */
                #8B0000 90%,   /* Enfer */
                #000000 100%   /* Abysse */
            ); border-radius: 8px; overflow: hidden;">
                <div class="player-marker" style="
                    position: absolute;
                    top: 10%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 12px;
                    height: 12px;
                    background: #00FF00;
                    border: 2px solid #FFF;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                    z-index: 10;
                "></div>
                
                <!-- Marqueurs de biomes -->
                ${[
                    { name: "Pics Divins", top: "5%", icon: "fas fa-mountain" },
                    { name: "Jardins Célestes", top: "15%", icon: "fas fa-seedling" },
                    { name: "Forêt Enchantée", top: "30%", icon: "fas fa-tree" },
                    { name: "Cavernes de Cristal", top: "45%", icon: "fas fa-gem" },
                    { name: "Plaines Dorées", top: "60%", icon: "fas fa-wheat-awn" },
                    { name: "Marécages Mystiques", top: "70%", icon: "fas fa-frog" },
                    { name: "Profondeurs Infernales", top: "90%", icon: "fas fa-fire" }
                ].map(biome => `
                    <div class="biome-marker" style="
                        position: absolute;
                        top: ${biome.top};
                        right: 20px;
                        background: rgba(0,0,0,0.7);
                        color: #FFD700;
                        padding: 5px 10px;
                        border-radius: 6px;
                        font-size: 0.8rem;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    ">
                        <i class="${biome.icon}"></i>
                        ${biome.name}
                    </div>
                `).join('')}
            </div>
            
            <div class="map-controls" style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
                <button class="btn-primary" onclick="window.windowManager.centerMapOnPlayer()">
                    <i class="fas fa-crosshairs"></i> Centrer sur le joueur
                </button>
                <button class="btn-secondary" onclick="window.windowManager.toggleMapMarkers()">
                    <i class="fas fa-map-pin"></i> Marqueurs
                </button>
            </div>
        `;
    }

    generateCraftingContent(contentEl) {
        contentEl.innerHTML = `
            <div class="crafting-interface" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="crafting-recipes">
                    <h3 style="color: #FFD700; margin-bottom: 15px;">Recettes Disponibles</h3>
                    <div class="recipe-list" style="max-height: 300px; overflow-y: auto;">
                        ${[
                            { name: "Potion de Soin", materials: ["Herbe Curative", "Eau Pure"], result: "Potion de Soin Mineure" },
                            { name: "Épée de Fer", materials: ["Lingot de Fer", "Bois"], result: "Épée de Fer" },
                            { name: "Cristal de Mana", materials: ["Gemme Brute", "Essence Magique"], result: "Cristal de Mana" }
                        ].map(recipe => `
                            <div class="recipe-item" style="
                                border: 1px solid #FFD700;
                                border-radius: 8px;
                                padding: 15px;
                                margin-bottom: 10px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='rgba(255,215,0,0.1)'" 
                               onmouseout="this.style.background='transparent'">
                                <div style="font-weight: bold; color: #FFD700; margin-bottom: 8px;">${recipe.name}</div>
                                <div style="font-size: 0.9rem; color: #FFA500; margin-bottom: 5px;">Matériaux:</div>
                                <div style="color: #E0E0E0; font-size: 0.8rem;">
                                    ${recipe.materials.join(', ')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="crafting-station">
                    <h3 style="color: #FFD700; margin-bottom: 15px;">Station d'Artisanat</h3>
                    <div class="crafting-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
                        ${Array.from({length: 9}, (_, i) => `
                            <div class="crafting-slot" style="
                                width: 60px;
                                height: 60px;
                                border: 2px solid #FFD700;
                                border-radius: 8px;
                                background: linear-gradient(135deg, rgba(0,0,0,0.3), rgba(40,40,40,0.3));
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                cursor: pointer;
                            ">
                                ${i === 4 ? '<i class="fas fa-plus" style="color: #666;"></i>' : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="crafting-result" style="text-align: center; margin-bottom: 20px;">
                        <div style="color: #FFA500; margin-bottom: 10px;">Résultat:</div>
                        <div style="
                            width: 80px;
                            height: 80px;
                            border: 3px solid #32CD32;
                            border-radius: 12px;
                            background: linear-gradient(135deg, rgba(0,0,0,0.3), rgba(40,40,40,0.3));
                            margin: 0 auto;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <i class="fas fa-question" style="color: #666;"></i>
                        </div>
                    </div>
                    
                    <button class="btn-primary" style="width: 100%;" onclick="window.windowManager.craftItem()">
                        <i class="fas fa-hammer"></i> Fabriquer
                    </button>
                </div>
            </div>
        `;
    }

    generateJournalContent(contentEl) {
        contentEl.innerHTML = `
            <div class="journal-tabs" style="display: flex; border-bottom: 2px solid #FFD700; margin-bottom: 20px;">
                ${['Découvertes', 'Lore', 'Succès'].map((tab, index) => `
                    <button class="journal-tab ${index === 0 ? 'active' : ''}" style="
                        background: ${index === 0 ? 'rgba(255,215,0,0.2)' : 'transparent'};
                        border: none;
                        color: ${index === 0 ? '#FFD700' : '#E0E0E0'};
                        padding: 10px 20px;
                        cursor: pointer;
                        border-bottom: 2px solid ${index === 0 ? '#FFD700' : 'transparent'};
                        transition: all 0.2s ease;
                    " onclick="window.windowManager.switchJournalTab(${index})">${tab}</button>
                `).join('')}
            </div>
            
            <div class="journal-content">
                <div class="journal-entry" style="margin-bottom: 20px;">
                    <h4 style="color: #FFD700; margin-bottom: 10px;">
                        <i class="fas fa-map-marked-alt"></i>
                        Première Descente
                    </h4>
                    <p style="color: #E0E0E0; line-height: 1.5; margin-bottom: 10px;">
                        Vous avez commencé votre périple dans les Pics Divins, royaume des Archanges. 
                        La lumière dorée baigne ces terres sacrées d'une aura de paix éternelle.
                    </p>
                    <div style="color: #FFA500; font-size: 0.9rem;">
                        <i class="fas fa-clock"></i> Il y a 5 minutes
                    </div>
                </div>
                
                <div class="journal-entry" style="margin-bottom: 20px;">
                    <h4 style="color: #9370DB; margin-bottom: 10px;">
                        <i class="fas fa-user"></i>
                        Rencontre avec Gabriel
                    </h4>
                    <p style="color: #E0E0E0; line-height: 1.5; margin-bottom: 10px;">
                        L'Archange Gabriel vous a accueilli avec bienveillance. Ses six ailes dorées 
                        scintillent d'une lumière divine, et sa voix résonne comme un chant céleste.
                    </p>
                    <div style="color: #FFA500; font-size: 0.9rem;">
                        <i class="fas fa-clock"></i> Il y a 3 minutes
                    </div>
                </div>
                
                <div class="journal-entry">
                    <h4 style="color: #32CD32; margin-bottom: 10px;">
                        <i class="fas fa-trophy"></i>
                        Premier Succès
                    </h4>
                    <p style="color: #E0E0E0; line-height: 1.5; margin-bottom: 10px;">
                        Vous avez débloqué le succès "Explorateur Céleste" en visitant votre premier biome divin.
                    </p>
                    <div style="color: #FFA500; font-size: 0.9rem;">
                        <i class="fas fa-clock"></i> Il y a 2 minutes
                    </div>
                </div>
            </div>
        `;
    }

    generateTradeContent(contentEl) {
        contentEl.innerHTML = `
            <div class="trade-interface" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="merchant-inventory">
                    <h3 style="color: #FFD700; margin-bottom: 15px;">
                        <i class="fas fa-store"></i>
                        Marchand
                    </h3>
                    <div class="merchant-items" style="max-height: 300px; overflow-y: auto;">
                        ${[
                            { name: "Potion de Soin Majeure", price: 200, icon: "fas fa-flask", rarity: "rare" },
                            { name: "Cristal de Mana", price: 150, icon: "fas fa-gem", rarity: "uncommon" },
                            { name: "Épée Enchantée", price: 500, icon: "fas fa-sword", rarity: "epic" },
                            { name: "Armure de Mailles", price: 300, icon: "fas fa-shield-alt", rarity: "rare" }
                        ].map(item => `
                            <div class="trade-item" style="
                                display: flex;
                                align-items: center;
                                padding: 12px;
                                border: 1px solid ${item.rarity === 'epic' ? '#9370DB' : item.rarity === 'rare' ? '#FFD700' : '#32CD32'};
                                border-radius: 8px;
                                margin-bottom: 10px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='rgba(255,215,0,0.1)'" 
                               onmouseout="this.style.background='transparent'">
                                <i class="${item.icon}" style="color: ${item.rarity === 'epic' ? '#9370DB' : item.rarity === 'rare' ? '#FFD700' : '#32CD32'}; margin-right: 12px; font-size: 1.2rem;"></i>
                                <div style="flex: 1;">
                                    <div style="color: #E0E0E0; font-weight: bold;">${item.name}</div>
                                    <div style="color: #FFA500; font-size: 0.9rem;">${item.price} Or</div>
                                </div>
                                <button class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="window.windowManager.buyItem('${item.name}', ${item.price})">
                                    Acheter
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="player-inventory">
                    <h3 style="color: #32CD32; margin-bottom: 15px;">
                        <i class="fas fa-backpack"></i>
                        Votre Inventaire
                    </h3>
                    <div class="player-items" style="max-height: 300px; overflow-y: auto;">
                        <div class="trade-item" style="
                            display: flex;
                            align-items: center;
                            padding: 12px;
                            border: 1px solid #32CD32;
                            border-radius: 8px;
                            margin-bottom: 10px;
                        ">
                            <i class="fas fa-gem" style="color: #9370DB; margin-right: 12px; font-size: 1.2rem;"></i>
                            <div style="flex: 1;">
                                <div style="color: #E0E0E0; font-weight: bold;">Cristal Rare</div>
                                <div style="color: #FFA500; font-size: 0.9rem;">Valeur: 75 Or</div>
                            </div>
                            <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="window.windowManager.sellItem('Cristal Rare', 75)">
                                Vendre
                            </button>
                        </div>
                    </div>
                    
                    <div class="player-gold" style="
                        background: rgba(255,215,0,0.1);
                        border: 1px solid #FFD700;
                        border-radius: 8px;
                        padding: 15px;
                        text-align: center;
                        margin-top: 20px;
                    ">
                        <i class="fas fa-coins" style="color: #FFD700; margin-right: 8px;"></i>
                        <span style="color: #FFD700; font-size: 1.2rem; font-weight: bold;">2,547 Or</span>
                    </div>
                </div>
            </div>
        `;
    }

    // === MENU CONTEXTUEL ===
    
    showContextMenu(x, y) {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.left = x + 'px';
            contextMenu.style.top = y + 'px';
            contextMenu.style.display = 'block';
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }

    // === NOTIFICATIONS ===
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const content = document.getElementById('notificationContent');
        
        if (notification && content) {
            content.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }

    // === RACCOURCIS CLAVIER ===
    
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
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
                case 'j':
                    e.preventDefault();
                    this.toggleWindow('journalWindow');
                    break;
                case 'o':
                    e.preventDefault();
                    this.toggleWindow('craftingWindow');
                    break;
            }
        }
        
        // Échap pour fermer toutes les fenêtres
        if (e.key === 'Escape') {
            this.closeAllWindows();
        }
    }

    closeAllWindows() {
        this.windows.forEach((windowData, windowId) => {
            if (windowData.isVisible) {
                this.hideWindow(windowId);
            }
        });
    }

    // === MÉTHODES UTILITAIRES ===
    
    sortInventory() {
        this.showNotification('Inventaire trié par type', 'success');
    }

    centerMapOnPlayer() {
        this.showNotification('Carte centrée sur le joueur', 'info');
    }

    craftItem() {
        this.showNotification('Objet fabriqué avec succès!', 'success');
    }

    buyItem(itemName, price) {
        this.showNotification(`${itemName} acheté pour ${price} or`, 'success');
    }

    sellItem(itemName, price) {
        this.showNotification(`${itemName} vendu pour ${price} or`, 'success');
    }

    switchJournalTab(tabIndex) {
        // Logique pour changer d'onglet dans le journal
        this.showNotification(`Onglet ${tabIndex + 1} sélectionné`, 'info');
    }

    toggleMapMarkers() {
        this.showNotification('Marqueurs de carte basculés', 'info');
    }

    showInventoryFilter() {
        this.showNotification('Filtre d\'inventaire ouvert', 'info');
    }
}

// Fonctions globales pour les événements
window.toggleWindow = (windowId) => {
    if (window.windowManager) {
        window.windowManager.toggleWindow(windowId);
    }
};

window.minimizeWindow = (windowId) => {
    if (window.windowManager) {
        window.windowManager.minimizeWindow(windowId);
    }
};

window.maximizeWindow = (windowId) => {
    if (window.windowManager) {
        window.windowManager.maximizeWindow(windowId);
    }
};

window.closeWindow = (windowId) => {
    if (window.windowManager) {
        window.windowManager.closeWindow(windowId);
    }
};

window.contextAction = (action) => {
    if (window.windowManager) {
        window.windowManager.hideContextMenu();
        window.windowManager.showNotification(`Action: ${action}`, 'info');
    }
};

export { WindowManager };