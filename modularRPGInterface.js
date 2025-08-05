// modularRPGInterface.js - Interface RPG modulaire et déplaçable

export class ModularRPGInterface {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.windowZIndex = 1000;
        this.isVisible = true;
        this.draggedSlot = null;
        
        this.initializeInterface();
        this.setupEventListeners();
    }

    initializeInterface() {
        // Créer le conteneur principal
        this.container = document.createElement('div');
        this.container.id = 'rpgInterface';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 900;
            font-family: 'VT323', monospace;
        `;
        document.body.appendChild(this.container);

        // Créer la barre d'outils principale
        this.createMainToolbar();
        
        // Créer la barre d'outils de jeu (hotbar)
        this.createGameHotbar();
        
        // Créer les fenêtres par défaut
        this.createDefaultWindows();
    }

    createMainToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'mainToolbar';
        toolbar.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border: 2px solid #4CAF50;
            border-radius: 25px;
            padding: 8px 15px;
            display: flex;
            gap: 10px;
            pointer-events: auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;

        const buttons = [
            { id: 'characterBtn', icon: '👤', tooltip: 'Personnage', window: 'character' },
            { id: 'inventoryBtn', icon: '🎒', tooltip: 'Inventaire', window: 'inventory' },
            { id: 'equipmentBtn', icon: '⚔️', tooltip: 'Équipement', window: 'equipment' },
            { id: 'skillsBtn', icon: '📜', tooltip: 'Compétences', window: 'skills' },
            { id: 'questsBtn', icon: '📋', tooltip: 'Quêtes', window: 'quests' },
            { id: 'mapBtn', icon: '🗺️', tooltip: 'Carte', window: 'map' },
            { id: 'settingsBtn', icon: '⚙️', tooltip: 'Options', window: 'settings' }
        ];

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.id = btn.id;
            button.innerHTML = btn.icon;
            button.title = btn.tooltip;
            button.style.cssText = `
                background: transparent;
                border: 2px solid transparent;
                color: white;
                font-size: 1.5em;
                padding: 5px 8px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 35px;
                min-height: 35px;
            `;

            button.addEventListener('mouseenter', () => {
                button.style.background = 'rgba(76, 175, 80, 0.3)';
                button.style.borderColor = '#4CAF50';
                button.style.transform = 'scale(1.1)';
            });

            button.addEventListener('mouseleave', () => {
                button.style.background = 'transparent';
                button.style.borderColor = 'transparent';
                button.style.transform = 'scale(1)';
            });

            button.addEventListener('click', () => {
                this.toggleWindow(btn.window);
            });

            toolbar.appendChild(button);
        });

        this.container.appendChild(toolbar);
    }

    createGameHotbar() {
        const hotbar = document.createElement('div');
        hotbar.id = 'gameHotbar';
        hotbar.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border: 2px solid #4CAF50;
            border-radius: 15px;
            padding: 10px;
            display: flex;
            gap: 5px;
            pointer-events: auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;

        // Créer les slots d'outils
        const tools = [
            { id: 'tool_pickaxe', name: 'Pioche', key: '1' },
            { id: 'tool_axe', name: 'Hache', key: '2' },
            { id: 'tool_shovel', name: 'Pelle', key: '3' },
            { id: 'tool_sword', name: 'Épée', key: '4' },
            { id: 'tool_bow', name: 'Arc', key: '5' },
            { id: 'tool_fishing_rod', name: 'Canne à pêche', key: '6' }
        ];

        tools.forEach((tool, index) => {
            const slot = document.createElement('div');
            slot.className = 'tool-slot';
            slot.style.cssText = `
                width: 50px;
                height: 50px;
                background: rgba(0,0,0,0.5);
                border: 2px solid #666;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                cursor: pointer;
                transition: all 0.3s ease;
            `;

            // Numéro de la touche
            const keyLabel = document.createElement('div');
            keyLabel.textContent = tool.key;
            keyLabel.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                background: #4CAF50;
                color: white;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
            `;

            // Icône de l'outil (placeholder)
            const icon = document.createElement('div');
            icon.textContent = this.getToolIcon(tool.id);
            icon.style.cssText = `
                font-size: 24px;
                color: white;
            `;

            slot.appendChild(icon);
            slot.appendChild(keyLabel);

            // Événements
            slot.addEventListener('mouseenter', () => {
                slot.style.borderColor = '#4CAF50';
                slot.style.background = 'rgba(76, 175, 80, 0.2)';
            });

            slot.addEventListener('mouseleave', () => {
                slot.style.borderColor = '#666';
                slot.style.background = 'rgba(0,0,0,0.5)';
            });

            slot.addEventListener('click', () => {
                this.selectTool(index);
            });

            hotbar.appendChild(slot);
        });

        this.container.appendChild(hotbar);
        this.hotbar = hotbar;
        this.selectedToolIndex = 0;
        this.updateHotbarSelection();
    }

    getToolIcon(toolId) {
        const icons = {
            'tool_pickaxe': '⛏️',
            'tool_axe': '🪓',
            'tool_shovel': '🔨',
            'tool_sword': '⚔️',
            'tool_bow': '🏹',
            'tool_fishing_rod': '🎣'
        };
        return icons[toolId] || '🔧';
    }

    selectTool(index) {
        this.selectedToolIndex = index;
        this.updateHotbarSelection();
        
        // Notifier le joueur du changement d'outil
        if (window.game && window.game.player) {
            window.game.player.selectedToolIndex = index;
        }
    }

    updateHotbarSelection() {
        if (!this.hotbar) return;
        
        const slots = this.hotbar.querySelectorAll('.tool-slot');
        slots.forEach((slot, index) => {
            if (index === this.selectedToolIndex) {
                slot.style.borderColor = '#FFD700';
                slot.style.background = 'rgba(255, 215, 0, 0.3)';
            } else {
                slot.style.borderColor = '#666';
                slot.style.background = 'rgba(0,0,0,0.5)';
            }
        });
    }

    createDefaultWindows() {
        // Fenêtre de personnage
        this.createWindow('character', {
            title: '👤 Personnage',
            position: { x: 50, y: 100 },
            size: { width: 300, height: 400 },
            content: this.createCharacterContent(),
            resizable: true
        });

        // Fenêtre d'inventaire
        this.createWindow('inventory', {
            title: '🎒 Inventaire',
            position: { x: 400, y: 100 },
            size: { width: 350, height: 450 },
            content: this.createInventoryContent(),
            resizable: true
        });

        // Fenêtre d'équipement
        this.createWindow('equipment', {
            title: '⚔️ Équipement',
            position: { x: 800, y: 100 },
            size: { width: 320, height: 480 },
            content: this.createEquipmentContent(),
            resizable: true
        });

        // Fenêtre d'outils
        this.createWindow('tools', {
            title: '🛠️ Outils',
            position: { x: 600, y: 100 },
            size: { width: 320, height: 120 },
            content: this.createToolsContent(),
            resizable: true
        });

        // Fenêtre de compétences
        this.createWindow('skills', {
            title: '📜 Compétences',
            position: { x: 200, y: 200 },
            size: { width: 400, height: 350 },
            content: this.createSkillsContent(),
            resizable: true
        });

        // Fenêtre de quêtes
        this.createWindow('quests', {
            title: '📋 Quêtes',
            position: { x: 600, y: 150 },
            size: { width: 380, height: 420 },
            content: this.createQuestsContent(),
            resizable: true
        });

        // Fenêtre de carte/minimap
        this.createWindow('map', {
            title: '🗺️ Carte',
            position: { x: 100, y: 300 },
            size: { width: 250, height: 250 },
            content: this.createMapContent(),
            resizable: true
        });

        // Fenêtre d'options
        this.createWindow('settings', {
            title: '⚙️ Options',
            position: { x: 300, y: 250 },
            size: { width: 450, height: 500 },
            content: this.createSettingsContent(),
            resizable: true
        });

        // HUD permanent (non déplaçable)
        this.createHUD();

        // Configurer le drag & drop des objets
        this.setupDragAndDrop();
    }

    createWindow(id, options) {
        const window = document.createElement('div');
        window.id = `window_${id}`;
        window.className = 'rpg-window';
        window.style.cssText = `
            position: absolute;
            left: ${options.position.x}px;
            top: ${options.position.y}px;
            width: ${options.size.width}px;
            height: ${options.size.height}px;
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            border: 2px solid #4CAF50;
            border-radius: 8px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.4);
            pointer-events: auto;
            display: none;
            z-index: ${this.windowZIndex++};
            overflow: hidden;
        `;

        // Barre de titre
        const titleBar = document.createElement('div');
        titleBar.className = 'window-titlebar';
        titleBar.style.cssText = `
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 8px 12px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: move;
            user-select: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const title = document.createElement('span');
        title.textContent = options.title;
        titleBar.appendChild(title);

        // Boutons de contrôle
        const controls = document.createElement('div');
        controls.style.cssText = 'display: flex; gap: 5px;';

        const minimizeBtn = document.createElement('button');
        minimizeBtn.innerHTML = '−';
        minimizeBtn.style.cssText = `
            background: #ff9800;
            border: none;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
        `;
        minimizeBtn.addEventListener('click', () => this.minimizeWindow(id));

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: #f44336;
            border: none;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
        `;
        closeBtn.addEventListener('click', () => this.hideWindow(id));

        controls.appendChild(minimizeBtn);
        controls.appendChild(closeBtn);
        titleBar.appendChild(controls);

        // Contenu de la fenêtre
        const content = document.createElement('div');
        content.className = 'window-content';
        content.style.cssText = `
            padding: 15px;
            height: calc(100% - 40px);
            overflow-y: auto;
            color: white;
            font-size: 1.1em;
        `;
        content.innerHTML = options.content;

        window.appendChild(titleBar);
        window.appendChild(content);

        // Ajouter la poignée de redimensionnement si nécessaire
        if (options.resizable) {
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            resizeHandle.style.cssText = `
                position: absolute;
                bottom: 0;
                right: 0;
                width: 15px;
                height: 15px;
                background: #4CAF50;
                cursor: se-resize;
                clip-path: polygon(100% 0%, 0% 100%, 100% 100%);
            `;
            window.appendChild(resizeHandle);
        }

        this.container.appendChild(window);
        this.windows.set(id, {
            element: window,
            titleBar: titleBar,
            content: content,
            isMinimized: false,
            originalHeight: options.size.height
        });

        // Configurer le drag & drop
        this.setupWindowDragging(id);
        if (options.resizable) {
            this.setupWindowResizing(id);
        }
    }

    createHUD() {
        const hud = document.createElement('div');
        hud.id = 'gameHUD';
        hud.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: linear-gradient(135deg, rgba(26,26,26,0.9), rgba(45,45,45,0.9));
            border: 2px solid #4CAF50;
            border-radius: 10px;
            padding: 10px;
            pointer-events: auto;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 20px;
            width: fit-content;
            max-width: calc(100% - 40px);
            resize: both;
            overflow: auto;
            cursor: move;
        `;

        hud.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 5px; min-width: 200px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #e74c3c;">❤️</span>
                    <div style="flex: 1; background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div id="healthBar" style="background: #e74c3c; height: 100%; width: 100%; transition: width 0.3s;"></div>
                    </div>
                    <span id="healthText" style="color: white; font-size: 0.9em;">100/100</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #3498db;">🔮</span>
                    <div style="flex: 1; background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div id="manaBar" style="background: #3498db; height: 100%; width: 100%; transition: width 0.3s;"></div>
                    </div>
                    <span id="manaText" style="color: white; font-size: 0.9em;">50/50</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #f39c12;">⚡</span>
                    <div style="flex: 1; background: #333; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div id="staminaBar" style="background: #f39c12; height: 100%; width: 100%; transition: width 0.3s;"></div>
                    </div>
                    <span id="staminaText" style="color: white; font-size: 0.9em;">80/80</span>
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
                <div id="levelDisplay" style="color: #4CAF50; font-size: 1.2em; font-weight: bold;">Niveau 1</div>
                <div style="background: #333; width: 150px; height: 6px; border-radius: 3px; overflow: hidden;">
                    <div id="xpBar" style="background: #4CAF50; height: 100%; width: 0%; transition: width 0.3s;"></div>
                </div>
                <div id="xpText" style="color: #aaa; font-size: 0.8em;">0 / 100 XP</div>
            </div>

            <div style="display: flex; gap: 10px; margin-left: auto;">
                <div id="quickSlot1" class="quick-slot" style="width: 50px; height: 50px; background: #333; border: 2px solid #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 1.5em; cursor: pointer;">1</div>
                <div id="quickSlot2" class="quick-slot" style="width: 50px; height: 50px; background: #333; border: 2px solid #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 1.5em; cursor: pointer;">2</div>
                <div id="quickSlot3" class="quick-slot" style="width: 50px; height: 50px; background: #333; border: 2px solid #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 1.5em; cursor: pointer;">3</div>
                <div id="quickSlot4" class="quick-slot" style="width: 50px; height: 50px; background: #333; border: 2px solid #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 1.5em; cursor: pointer;">4</div>
            </div>
        `;

        // Rendre la barre déplaçable
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        hud.addEventListener('mousedown', (e) => {
            if (e.target.closest('.quick-slot')) return; // éviter de déplacer lors de l'utilisation des slots
            isDragging = true;
            dragOffsetX = e.clientX - hud.offsetLeft;
            dragOffsetY = e.clientY - hud.offsetTop;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const newX = Math.max(0, Math.min(window.innerWidth - hud.offsetWidth, e.clientX - dragOffsetX));
            const newY = Math.max(0, Math.min(window.innerHeight - hud.offsetHeight, e.clientY - dragOffsetY));

            hud.style.left = newX + 'px';
            hud.style.top = newY + 'px';
            hud.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
            }
        });

        this.container.appendChild(hud);
    }

    createCharacterContent() {
        return `
            <div style="text-align: center; margin-bottom: 20px;">
                <div id="characterAvatar" style="width: 80px; height: 80px; background: #4CAF50; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 2em;">👤</div>
                <h3 id="characterName" style="margin: 0; color: #4CAF50;">Aventurier</h3>
                <p id="characterClass" style="margin: 5px 0; color: #aaa;">Classe non sélectionnée</p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div style="text-align: center;">
                    <div style="color: #4CAF50; font-size: 1.5em; font-weight: bold;" id="playerLevel">1</div>
                    <div style="color: #aaa; font-size: 0.9em;">Niveau</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: #3498db; font-size: 1.5em; font-weight: bold;" id="playerXP">0</div>
                    <div style="color: #aaa; font-size: 0.9em;">Expérience</div>
                </div>
            </div>

            <div id="characterStats">
                <h4 style="color: #4CAF50; margin-bottom: 10px;">📊 Statistiques</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.95em;">
                    <div>💪 Force: <span id="statStrength">10</span></div>
                    <div>🛡️ Défense: <span id="statDefense">5</span></div>
                    <div>🏃 Agilité: <span id="statAgility">10</span></div>
                    <div>🧠 Intelligence: <span id="statIntelligence">5</span></div>
                    <div>🍀 Chance: <span id="statLuck">7</span></div>
                    <div>⚡ Vitesse: <span id="statSpeed">10</span></div>
                </div>
            </div>

            <div style="margin-top: 20px;">
                <h4 style="color: #4CAF50; margin-bottom: 10px;">🏆 Accomplissements</h4>
                <div id="achievements" style="font-size: 0.9em; color: #aaa;">
                    Aucun accomplissement pour le moment...
                </div>
            </div>
        `;
    }

    createInventoryContent() {
        return `
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: #4CAF50; margin: 0;">Objets</h4>
                <div style="color: #aaa; font-size: 0.9em;">
                    <span id="inventoryCount">0</span> / <span id="inventoryMax">50</span>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button class="filter-btn active" data-filter="all" style="background: #4CAF50; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.9em;">Tout</button>
                <button class="filter-btn" data-filter="weapon" style="background: #555; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.9em;">Armes</button>
                <button class="filter-btn" data-filter="armor" style="background: #555; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.9em;">Armures</button>
                <button class="filter-btn" data-filter="consumable" style="background: #555; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.9em;">Consommables</button>
            </div>

            <div id="inventoryGrid" style="
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                gap: 5px;
                max-height: 300px;
                overflow-y: auto;
                padding: 5px;
                background: rgba(0,0,0,0.3);
                border-radius: 5px;
            ">
                <!-- Les objets seront ajoutés dynamiquement ici -->
            </div>

            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #555;">
                <div id="selectedItemInfo" style="min-height: 60px; color: #aaa; font-size: 0.9em;">
                    Sélectionnez un objet pour voir ses détails...
                </div>
            </div>
        `;
    }

    createEquipmentContent() {
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <!-- Ligne 1: Casque -->
                <div></div>
                <div class="equipment-slot" data-slot="head" style="aspect-ratio: 1; background: #333; border: 2px dashed #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.5em;">
                    🪖
                </div>
                <div></div>
                
                <!-- Ligne 2: Arme principale, Torse, Arme secondaire -->
                <div class="equipment-slot" data-slot="mainHand" style="aspect-ratio: 1; background: #333; border: 2px dashed #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.5em;">
                    ⚔️
                </div>
                <div class="equipment-slot" data-slot="chest" style="aspect-ratio: 1; background: #333; border: 2px dashed #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.5em;">
                    🦺
                </div>
                <div class="equipment-slot" data-slot="offHand" style="aspect-ratio: 1; background: #333; border: 2px dashed #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.5em;">
                    🛡️
                </div>
                
                <!-- Ligne 3: Jambes -->
                <div></div>
                <div class="equipment-slot" data-slot="legs" style="aspect-ratio: 1; background: #333; border: 2px dashed #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.5em;">
                    👖
                </div>
                <div></div>
                
                <!-- Ligne 4: Bottes -->
                <div></div>
                <div class="equipment-slot" data-slot="feet" style="aspect-ratio: 1; background: #333; border: 2px dashed #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.5em;">
                    👢
                </div>
                <div></div>
            </div>

            <div style="margin-top: 20px;">
                <h4 style="color: #4CAF50; margin-bottom: 10px;">💍 Accessoires</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="equipment-slot" data-slot="ring1" style="aspect-ratio: 2; background: #333; border: 2px dashed #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.2em;">
                        💍 Anneau 1
                    </div>
                    <div class="equipment-slot" data-slot="ring2" style="aspect-ratio: 2; background: #333; border: 2px dashed #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.2em;">
                        💍 Anneau 2
                    </div>
                </div>
                <div class="equipment-slot" data-slot="necklace" style="aspect-ratio: 3; background: #333; border: 2px dashed #555; border-radius: 5px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.2em; margin-top: 10px;">
                    📿 Collier
                </div>
            </div>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #555;">
                <h4 style="color: #4CAF50; margin-bottom: 10px;">📈 Bonus d'Équipement</h4>
                <div id="equipmentBonuses" style="font-size: 0.9em; color: #aaa;">
                    Aucun bonus actuel...
                </div>
            </div>
        `;
    }

    createToolsContent() {
        const slots = Array.from({ length: 6 }).map((_, i) => `
            <div class="tool-slot" data-slot="${i}" style="width: 50px; height: 50px; background: rgba(0,0,0,0.5); border: 2px solid #666; border-radius: 8px; display: flex; align-items: center; justify-content: center;"></div>
        `).join('');

        return `
            <div style="display: flex; gap: 5px;">${slots}</div>
        `;
    }

    createSkillsContent() {
        return `
            <div style="margin-bottom: 15px;">
                <h4 style="color: #4CAF50; margin: 0 0 10px 0;">Points de Compétence Disponibles</h4>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5em; color: #f39c12;">⭐</span>
                    <span id="skillPoints" style="font-size: 1.3em; color: #f39c12; font-weight: bold;">0</span>
                    <span style="color: #aaa;">points disponibles</span>
                </div>
            </div>

            <div id="skillTrees" style="max-height: 250px; overflow-y: auto;">
                <!-- Les arbres de compétences seront générés dynamiquement -->
            </div>
        `;
    }

    createQuestsContent() {
        return `
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button class="quest-filter active" data-filter="active" style="background: #4CAF50; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.9em;">Actives</button>
                <button class="quest-filter" data-filter="completed" style="background: #555; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.9em;">Terminées</button>
                <button class="quest-filter" data-filter="available" style="background: #555; border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.9em;">Disponibles</button>
            </div>

            <div id="questList" style="max-height: 320px; overflow-y: auto;">
                <div class="quest-item" style="background: rgba(76, 175, 80, 0.1); border: 1px solid #4CAF50; border-radius: 5px; padding: 10px; margin-bottom: 10px;">
                    <h5 style="color: #4CAF50; margin: 0 0 5px 0;">🎯 Première Aventure</h5>
                    <p style="margin: 0 0 8px 0; font-size: 0.9em; color: #ccc;">Explorez le monde et découvrez vos premières ressources.</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #aaa; font-size: 0.8em;">Progression: 0/1</span>
                        <span style="color: #f39c12; font-size: 0.8em;">+100 XP</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleInterface();
            }
            if (e.key === 'i' || e.key === 'I') {
                this.toggleWindow('inventory');
            }
            if (e.key === 'c' || e.key === 'C') {
                this.toggleWindow('character');
            }
            if (e.key === 'e' || e.key === 'E') {
                this.toggleWindow('equipment');
            }
        });
    }

    setupWindowDragging(windowId) {
        const windowData = this.windows.get(windowId);
        const titleBar = windowData.titleBar;
        const windowElement = windowData.element;

        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
            this.isDragging = true;
            this.activeWindow = windowId;
            
            const rect = windowElement.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            windowElement.style.zIndex = this.windowZIndex++;
            titleBar.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.activeWindow === windowId) {
                const x = e.clientX - this.dragOffset.x;
                const y = e.clientY - this.dragOffset.y;
                
                windowElement.style.left = Math.max(0, Math.min(x, window.innerWidth - windowElement.offsetWidth)) + 'px';
                windowElement.style.top = Math.max(0, Math.min(y, window.innerHeight - windowElement.offsetHeight)) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging && this.activeWindow === windowId) {
                this.isDragging = false;
                this.activeWindow = null;
                titleBar.style.cursor = 'move';
            }
        });
    }

    setupWindowResizing(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        const resizeHandle = windowElement.querySelector('.resize-handle');

        if (!resizeHandle) return;

        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = parseInt(document.defaultView.getComputedStyle(windowElement).width, 10);
            startHeight = parseInt(document.defaultView.getComputedStyle(windowElement).height, 10);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const width = startWidth + e.clientX - startX;
            const height = startHeight + e.clientY - startY;
            
            windowElement.style.width = Math.max(200, width) + 'px';
            windowElement.style.height = Math.max(150, height) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    setupDragAndDrop() {
        const slots = this.container.querySelectorAll('.inventory-slot, .equipment-slot, .tool-slot');
        slots.forEach(slot => {
            slot.setAttribute('draggable', 'true');
            slot.addEventListener('dragstart', () => {
                this.draggedSlot = slot;
            });
            slot.addEventListener('dragover', (e) => e.preventDefault());
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.draggedSlot && this.draggedSlot !== slot) {
                    const temp = slot.innerHTML;
                    slot.innerHTML = this.draggedSlot.innerHTML;
                    this.draggedSlot.innerHTML = temp;
                }
            });
        });
    }

    toggleWindow(windowId) {
        if (windowId === 'inventory') {
            ['inventory', 'equipment', 'tools'].forEach(id => {
                const win = this.windows.get(id);
                if (!win) return;
                const visible = win.element.style.display !== 'none';
                if (visible) {
                    this.hideWindow(id);
                } else {
                    this.showWindow(id);
                }
            });
            return;
        }

        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const isVisible = windowData.element.style.display !== 'none';
        if (isVisible) {
            this.hideWindow(windowId);
        } else {
            this.showWindow(windowId);
        }
    }

    showWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.element.style.display = 'block';
        windowData.element.style.zIndex = this.windowZIndex++;

        // Mettre à jour le contenu si nécessaire
        this.updateWindowContent(windowId);
        this.setupDragAndDrop();
    }

    hideWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.element.style.display = 'none';
    }

    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        if (windowData.isMinimized) {
            // Restaurer
            windowData.element.style.height = windowData.originalHeight + 'px';
            windowData.content.style.display = 'block';
            windowData.isMinimized = false;
        } else {
            // Minimiser
            windowData.originalHeight = windowData.element.offsetHeight;
            windowData.element.style.height = '40px';
            windowData.content.style.display = 'none';
            windowData.isMinimized = true;
        }
    }

    toggleInterface() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }

    updateHUD(player) {
        if (!player) return;

        // Mettre à jour les barres de vie, mana, endurance
        const healthPercent = (player.health / player.maxHealth) * 100;
        const manaPercent = (player.mana / player.maxMana) * 100;
        const staminaPercent = (player.stamina / player.maxStamina) * 100;

        const healthBar = document.getElementById('healthBar');
        const manaBar = document.getElementById('manaBar');
        const staminaBar = document.getElementById('staminaBar');

        if (healthBar) healthBar.style.width = healthPercent + '%';
        if (manaBar) manaBar.style.width = manaPercent + '%';
        if (staminaBar) staminaBar.style.width = staminaPercent + '%';

        // Mettre à jour les textes
        const healthText = document.getElementById('healthText');
        const manaText = document.getElementById('manaText');
        const staminaText = document.getElementById('staminaText');

        if (healthText) healthText.textContent = `${Math.floor(player.health)}/${player.maxHealth}`;
        if (manaText) manaText.textContent = `${Math.floor(player.mana)}/${player.maxMana}`;
        if (staminaText) staminaText.textContent = `${Math.floor(player.stamina)}/${player.maxStamina}`;

        // Mettre à jour le niveau et l'XP
        const levelDisplay = document.getElementById('levelDisplay');
        const xpBar = document.getElementById('xpBar');
        const xpText = document.getElementById('xpText');

        if (levelDisplay) levelDisplay.textContent = `Niveau ${player.stats.level}`;
        if (xpBar) {
            const xpPercent = (player.stats.xp / player.stats.xpToNextLevel) * 100;
            xpBar.style.width = xpPercent + '%';
        }
        if (xpText) xpText.textContent = `${player.stats.xp} / ${player.stats.xpToNextLevel} XP`;
    }

    updateWindowContent(windowId) {
        // Cette méthode sera appelée pour mettre à jour le contenu des fenêtres
        // Elle sera implémentée plus tard avec les données du joueur
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            font-family: 'VT323', monospace;
            font-size: 1.1em;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    createMapContent() {
        return `
            <div style="text-align: center;">
                <h3 style="color: #4CAF50; margin-top: 0;">Minimap</h3>
                <div id="minimapContainer" style="width: 200px; height: 200px; margin: 0 auto; border: 2px solid #4CAF50; background: #000;">
                    <p style="color: #aaa; text-align: center; line-height: 200px; margin: 0;">
                        La minimap s'affichera ici
                    </p>
                </div>
                <div style="margin-top: 10px;">
                    <button onclick="window.game?.minimap?.toggle()" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        Activer/Désactiver
                    </button>
                </div>
            </div>
        `;
    }

    createSettingsContent() {
        return `
            <div style="padding: 10px;">
                <h3 style="color: #4CAF50; margin-top: 0;">⚙️ Options du Jeu</h3>
                
                <!-- Contrôles -->
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #FFC107; border-bottom: 1px solid #444; padding-bottom: 5px;">🎮 Contrôles</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                        <div><strong>Se déplacer:</strong> Flèches directionnelles</div>
                        <div><strong>Sauter:</strong> Flèche Haut / Espace</div>
                        <div><strong>Action/Miner:</strong> E / Clic gauche</div>
                        <div><strong>Attaquer:</strong> F</div>
                        <div><strong>Construire:</strong> Clic droit</div>
                        <div><strong>Inventaire:</strong> I</div>
                        <div><strong>Personnage:</strong> P</div>
                        <div><strong>Quêtes:</strong> Q</div>
                        <div><strong>Minimap:</strong> M</div>
                        <div><strong>Debug:</strong> F12</div>
                    </div>
                </div>

                <!-- Audio -->
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #FFC107; border-bottom: 1px solid #444; padding-bottom: 5px;">🔊 Audio</h4>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">Volume Principal:</label>
                        <input type="range" id="masterVolume" min="0" max="100" value="80" style="width: 100%;" onchange="this.nextElementSibling.textContent = this.value + '%'">
                        <span>80%</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">Volume Musique:</label>
                        <input type="range" id="musicVolume" min="0" max="100" value="60" style="width: 100%;" onchange="this.nextElementSibling.textContent = this.value + '%'">
                        <span>60%</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">Volume Effets:</label>
                        <input type="range" id="sfxVolume" min="0" max="100" value="80" style="width: 100%;" onchange="this.nextElementSibling.textContent = this.value + '%'">
                        <span>80%</span>
                    </div>
                </div>

                <!-- Graphiques -->
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #FFC107; border-bottom: 1px solid #444; padding-bottom: 5px;">🎨 Graphiques</h4>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">
                            <input type="checkbox" id="particlesEnabled" checked> Effets de particules
                        </label>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">
                            <input type="checkbox" id="weatherEnabled" checked> Effets météo
                        </label>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">
                            <input type="checkbox" id="lightingEnabled" checked> Éclairage dynamique
                        </label>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">Zoom:</label>
                        <select id="zoomLevel" style="width: 100%; padding: 5px;">
                            <option value="1">1x (Petit)</option>
                            <option value="2">2x (Normal)</option>
                            <option value="3" selected>3x (Grand)</option>
                            <option value="4">4x (Très grand)</option>
                        </select>
                    </div>
                </div>

                <!-- Gameplay -->
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #FFC107; border-bottom: 1px solid #444; padding-bottom: 5px;">🎯 Gameplay</h4>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">Difficulté:</label>
                        <select id="difficulty" style="width: 100%; padding: 5px;">
                            <option value="easy">Facile</option>
                            <option value="normal" selected>Normal</option>
                            <option value="hard">Difficile</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">
                            <input type="checkbox" id="autoSave" checked> Sauvegarde automatique
                        </label>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 5px;">
                            <input type="checkbox" id="showDamageNumbers" checked> Afficher les dégâts
                        </label>
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="window.game?.modularInterface?.saveSettings()" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                        💾 Sauvegarder
                    </button>
                    <button onclick="window.game?.modularInterface?.resetSettings()" style="background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                        🔄 Réinitialiser
                    </button>
                </div>
            </div>
        `;
    }

    saveSettings() {
        // Sauvegarder les paramètres dans localStorage
        const settings = {
            masterVolume: document.getElementById('masterVolume')?.value || 80,
            musicVolume: document.getElementById('musicVolume')?.value || 60,
            sfxVolume: document.getElementById('sfxVolume')?.value || 80,
            particlesEnabled: document.getElementById('particlesEnabled')?.checked || true,
            weatherEnabled: document.getElementById('weatherEnabled')?.checked || true,
            lightingEnabled: document.getElementById('lightingEnabled')?.checked || true,
            zoomLevel: document.getElementById('zoomLevel')?.value || 3,
            difficulty: document.getElementById('difficulty')?.value || 'normal',
            autoSave: document.getElementById('autoSave')?.checked || true,
            showDamageNumbers: document.getElementById('showDamageNumbers')?.checked || true
        };

        localStorage.setItem('gameSettings', JSON.stringify(settings));
        this.showNotification('Paramètres sauvegardés !', 'success', 2000);
        
        // Appliquer les paramètres
        this.applySettings(settings);
    }

    resetSettings() {
        localStorage.removeItem('gameSettings');
        this.showNotification('Paramètres réinitialisés !', 'info', 2000);
        
        // Recharger le contenu de la fenêtre
        const settingsWindow = this.windows.get('settings');
        if (settingsWindow) {
            settingsWindow.content.innerHTML = this.createSettingsContent();
        }
    }

    applySettings(settings) {
        // Appliquer les paramètres au jeu
        if (window.game) {
            if (window.game.config) {
                window.game.config.zoom = parseInt(settings.zoomLevel);
                window.game.config.showParticles = settings.particlesEnabled;
                window.game.config.weatherEffects = settings.weatherEnabled;
                window.game.config.dynamicLighting = settings.lightingEnabled;
                window.game.config.soundVolume = settings.masterVolume / 100;
            }
            
            if (window.game.ambianceSystem) {
                window.game.ambianceSystem.setVolume(settings.masterVolume / 100);
            }
        }
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('gameSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.applySettings(settings);
            } catch (e) {
                console.warn('Erreur lors du chargement des paramètres:', e);
            }
        }
    }
}