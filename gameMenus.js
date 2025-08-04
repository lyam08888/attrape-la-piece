// gameMenus.js - Tous les menus modulaires du jeu
import { windowManager } from './windowManager.js';
import { GameData } from './gameData.js';

export class GameMenus {
    constructor(game) {
        this.game = game;
        this.player = game.player;
        this.gameData = new GameData(game);
        this.windowManager = windowManager; // Exposer le gestionnaire de fenêtres
        window.gameMenus = this; // Rendre accessible globalement
        this.init();
    }

    init() {
        // Créer tous les menus au démarrage
        this.createAllMenus();
        
        // Raccourcis clavier
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey) return; // Éviter les conflits avec les raccourcis système
            
            switch(e.key) {
                case 'i':
                case 'I':
                    this.toggleInventory();
                    break;
                case 'c':
                case 'C':
                    this.toggleCharacter();
                    break;
                case 'q':
                case 'Q':
                    this.toggleQuests();
                    break;
                case 'm':
                case 'M':
                    this.toggleMap();
                    break;
                case 'j':
                case 'J':
                    this.toggleJournal();
                    break;
                case 'o':
                case 'O':
                    this.toggleOptions();
                    break;
                case 'Enter':
                    if (e.shiftKey) {
                        this.toggleChat();
                    }
                    break;
            }
        });
    }

    createAllMenus() {
        // Les menus ne sont pas créés immédiatement, mais préparés
        this.menuDefinitions = {
            inventory: {
                title: 'Inventaire',
                icon: 'fas fa-backpack',
                content: this.createInventoryContent(),
                options: { width: 500, height: 400 }
            },
            character: {
                title: 'Personnage',
                icon: 'fas fa-user',
                content: this.createCharacterContent(),
                options: { width: 450, height: 500 }
            },
            quests: {
                title: 'Quêtes',
                icon: 'fas fa-scroll',
                content: this.createQuestsContent(),
                options: { width: 600, height: 450 }
            },
            map: {
                title: 'Carte du Monde',
                icon: 'fas fa-map',
                content: this.createMapContent(),
                options: { width: 700, height: 500 }
            },
            crafting: {
                title: 'Artisanat',
                icon: 'fas fa-hammer',
                content: this.createCraftingContent(),
                options: { width: 550, height: 400 }
            },
            journal: {
                title: 'Journal de Bord',
                icon: 'fas fa-book',
                content: this.createJournalContent(),
                options: { width: 500, height: 350 }
            },
            chat: {
                title: 'Chat',
                icon: 'fas fa-comments',
                content: this.createChatContent(),
                options: { width: 400, height: 300 }
            },
            trade: {
                title: 'Commerce',
                icon: 'fas fa-coins',
                content: this.createTradeContent(),
                options: { width: 600, height: 400 }
            },
            options: {
                title: 'Options',
                icon: 'fas fa-cog',
                content: this.createOptionsContent(),
                options: { width: 450, height: 400 }
            },
            skills: {
                title: 'Compétences',
                icon: 'fas fa-star',
                content: this.createSkillsContent(),
                options: { width: 500, height: 450 }
            }
        };
    }

    // === INVENTAIRE ===
    createInventoryContent() {
        return `
            <div class="inventory-container">
                <div class="inventory-header">
                    <div class="inventory-tabs">
                        <button class="tab-btn active" data-tab="items">Objets</button>
                        <button class="tab-btn" data-tab="equipment">Équipement</button>
                        <button class="tab-btn" data-tab="consumables">Consommables</button>
                    </div>
                    <div class="inventory-search">
                        <input type="text" placeholder="Rechercher..." id="inventory-search">
                        <i class="fas fa-search"></i>
                    </div>
                </div>
                
                <div class="inventory-content">
                    <div class="inventory-grid" id="inventory-items">
                        ${this.generateInventorySlots(40)}
                    </div>
                    
                    <div class="inventory-sidebar">
                        <div class="item-details" id="item-details">
                            <div class="no-item-selected">
                                <i class="fas fa-mouse-pointer"></i>
                                <p>Sélectionnez un objet pour voir ses détails</p>
                            </div>
                        </div>
                        
                        <div class="inventory-stats">
                            <div class="stat-line">
                                <span>Poids:</span>
                                <span id="inventory-weight">0/100 kg</span>
                            </div>
                            <div class="stat-line">
                                <span>Emplacements:</span>
                                <span id="inventory-slots">0/40</span>
                            </div>
                            <div class="stat-line">
                                <span>Valeur totale:</span>
                                <span id="inventory-value">0 pièces</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="inventory-actions">
                    <button class="action-btn" id="sort-inventory">
                        <i class="fas fa-sort"></i> Trier
                    </button>
                    <button class="action-btn" id="drop-all-junk">
                        <i class="fas fa-trash"></i> Jeter Déchets
                    </button>
                    <button class="action-btn" id="auto-stack">
                        <i class="fas fa-layer-group"></i> Empiler
                    </button>
                </div>
            </div>
        `;
    }

    generateInventorySlots(count) {
        let slots = '';
        for (let i = 0; i < count; i++) {
            const item = this.gameData.inventory.slots[i];
            const hasItem = item !== null;
            
            slots += `
                <div class="inventory-slot ${hasItem ? 'has-item' : ''}" data-slot="${i}" data-context-menu="inventory">
                    <div class="slot-content">
                        <div class="item-icon">${hasItem ? `<i class="${item.icon}"></i>` : ''}</div>
                        <div class="item-quantity">${hasItem && item.quantity > 1 ? item.quantity : ''}</div>
                        <div class="item-quality ${hasItem ? item.quality : ''}"></div>
                    </div>
                </div>
            `;
        }
        return slots;
    }

    // === PERSONNAGE ===
    createCharacterContent() {
        return `
            <div class="character-container">
                <div class="character-tabs">
                    <button class="tab-btn active" data-tab="stats">Statistiques</button>
                    <button class="tab-btn" data-tab="equipment">Équipement</button>
                    <button class="tab-btn" data-tab="attributes">Attributs</button>
                </div>
                
                <div class="character-content">
                    <div class="character-model">
                        <div class="character-avatar">
                            <canvas id="character-preview" width="150" height="200"></canvas>
                        </div>
                        <div class="character-info">
                            <h3 id="character-name">Aventurier</h3>
                            <p class="character-level">Niveau <span id="char-level">1</span></p>
                            <div class="xp-bar">
                                <div class="xp-fill" id="char-xp-fill"></div>
                                <span class="xp-text" id="char-xp-text">0/100 XP</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="character-stats">
                        <div class="stat-category">
                            <h4>Statistiques Principales</h4>
                            <div class="stat-grid">
                                <div class="stat-item">
                                    <span class="stat-name">Force</span>
                                    <span class="stat-value" id="stat-strength">10</span>
                                    <button class="stat-up" data-stat="strength">+</button>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-name">Agilité</span>
                                    <span class="stat-value" id="stat-agility">10</span>
                                    <button class="stat-up" data-stat="agility">+</button>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-name">Intelligence</span>
                                    <span class="stat-value" id="stat-intelligence">10</span>
                                    <button class="stat-up" data-stat="intelligence">+</button>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-name">Endurance</span>
                                    <span class="stat-value" id="stat-endurance">10</span>
                                    <button class="stat-up" data-stat="endurance">+</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="stat-category">
                            <h4>Statistiques Dérivées</h4>
                            <div class="derived-stats">
                                <div class="stat-bar">
                                    <span>Santé</span>
                                    <div class="bar">
                                        <div class="bar-fill health" id="health-bar"></div>
                                        <span class="bar-text" id="health-text">100/100</span>
                                    </div>
                                </div>
                                <div class="stat-bar">
                                    <span>Mana</span>
                                    <div class="bar">
                                        <div class="bar-fill mana" id="mana-bar"></div>
                                        <span class="bar-text" id="mana-text">50/50</span>
                                    </div>
                                </div>
                                <div class="stat-bar">
                                    <span>Stamina</span>
                                    <div class="bar">
                                        <div class="bar-fill stamina" id="stamina-bar"></div>
                                        <span class="bar-text" id="stamina-text">100/100</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="stat-category">
                            <h4>Points Disponibles</h4>
                            <div class="available-points">
                                <span>Points d'attributs: <strong id="available-points">0</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // === QUÊTES ===
    createQuestsContent() {
        return `
            <div class="quests-container">
                <div class="quests-header">
                    <div class="quest-filters">
                        <button class="filter-btn active" data-filter="all">Toutes</button>
                        <button class="filter-btn" data-filter="active">Actives</button>
                        <button class="filter-btn" data-filter="completed">Terminées</button>
                        <button class="filter-btn" data-filter="failed">Échouées</button>
                    </div>
                    <div class="quest-search">
                        <input type="text" placeholder="Rechercher une quête..." id="quest-search">
                    </div>
                </div>
                
                <div class="quests-content">
                    <div class="quest-list" id="quest-list">
                        ${this.generateSampleQuests()}
                    </div>
                    
                    <div class="quest-details" id="quest-details">
                        <div class="no-quest-selected">
                            <i class="fas fa-scroll"></i>
                            <p>Sélectionnez une quête pour voir ses détails</p>
                        </div>
                    </div>
                </div>
                
                <div class="quest-stats">
                    <div class="stat-item">
                        <span>Quêtes terminées:</span>
                        <span id="completed-quests">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Quêtes actives:</span>
                        <span id="active-quests">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Points de quête:</span>
                        <span id="quest-points">0</span>
                    </div>
                </div>
            </div>
        `;
    }

    generateSampleQuests() {
        const quests = [
            {
                id: 1,
                title: "Premier Pas",
                type: "Principale",
                status: "active",
                progress: 50,
                description: "Explorez le monde et découvrez ses secrets."
            },
            {
                id: 2,
                title: "Collecteur de Ressources",
                type: "Secondaire",
                status: "active",
                progress: 25,
                description: "Collectez 10 minerais différents."
            },
            {
                id: 3,
                title: "Maître Artisan",
                type: "Craft",
                status: "completed",
                progress: 100,
                description: "Créez votre premier objet."
            }
        ];

        return quests.map(quest => `
            <div class="quest-item ${quest.status}" data-quest-id="${quest.id}">
                <div class="quest-header">
                    <div class="quest-title">
                        <h4>${quest.title}</h4>
                        <span class="quest-type ${quest.type.toLowerCase()}">${quest.type}</span>
                    </div>
                    <div class="quest-status">
                        <i class="fas ${this.getQuestIcon(quest.status)}"></i>
                    </div>
                </div>
                <div class="quest-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${quest.progress}%"></div>
                    </div>
                    <span class="progress-text">${quest.progress}%</span>
                </div>
                <p class="quest-description">${quest.description}</p>
            </div>
        `).join('');
    }

    getQuestIcon(status) {
        switch(status) {
            case 'active': return 'fa-play';
            case 'completed': return 'fa-check';
            case 'failed': return 'fa-times';
            default: return 'fa-question';
        }
    }

    // === CARTE ===
    createMapContent() {
        return `
            <div class="map-container">
                <div class="map-controls">
                    <div class="map-tools">
                        <button class="tool-btn active" data-tool="navigate">
                            <i class="fas fa-hand-paper"></i> Navigation
                        </button>
                        <button class="tool-btn" data-tool="waypoint">
                            <i class="fas fa-map-pin"></i> Point de Repère
                        </button>
                        <button class="tool-btn" data-tool="measure">
                            <i class="fas fa-ruler"></i> Mesurer
                        </button>
                    </div>
                    <div class="map-zoom">
                        <button id="zoom-in"><i class="fas fa-plus"></i></button>
                        <span id="zoom-level">100%</span>
                        <button id="zoom-out"><i class="fas fa-minus"></i></button>
                    </div>
                </div>
                
                <div class="map-view">
                    <canvas id="world-map" width="600" height="400"></canvas>
                    <div class="map-overlay">
                        <div class="player-position" id="player-marker">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                </div>
                
                <div class="map-legend">
                    <h4>Légende</h4>
                    <div class="legend-items">
                        <div class="legend-item">
                            <div class="legend-color" style="background: #4CAF50;"></div>
                            <span>Forêt</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background: #2196F3;"></div>
                            <span>Eau</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background: #FF9800;"></div>
                            <span>Désert</span>
                        </div>
                        <div class="legend-item">
                            <div class="legend-color" style="background: #9E9E9E;"></div>
                            <span>Montagne</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // === ARTISANAT ===
    createCraftingContent() {
        return `
            <div class="crafting-container">
                <div class="crafting-categories">
                    <button class="category-btn active" data-category="all">Tout</button>
                    <button class="category-btn" data-category="weapons">Armes</button>
                    <button class="category-btn" data-category="armor">Armures</button>
                    <button class="category-btn" data-category="tools">Outils</button>
                    <button class="category-btn" data-category="consumables">Consommables</button>
                </div>
                
                <div class="crafting-content">
                    <div class="recipe-list">
                        <div class="recipe-search">
                            <input type="text" placeholder="Rechercher une recette..." id="recipe-search">
                        </div>
                        <div class="recipes" id="recipe-list">
                            ${this.generateCraftingRecipes()}
                        </div>
                    </div>
                    
                    <div class="crafting-station">
                        <div class="crafting-grid">
                            <div class="craft-slots">
                                ${this.generateCraftingSlots(9)}
                            </div>
                            <div class="craft-result">
                                <div class="result-slot">
                                    <i class="fas fa-arrow-right"></i>
                                    <div class="result-item"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="crafting-info">
                            <div class="required-materials" id="required-materials">
                                <h4>Matériaux requis</h4>
                                <p>Sélectionnez une recette</p>
                            </div>
                            <button class="craft-btn" id="craft-button" disabled>
                                <i class="fas fa-hammer"></i> Créer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateCraftingRecipes() {
        const recipes = [
            { name: "Épée en Fer", category: "weapons", materials: ["Fer x3", "Bois x1"], level: 1 },
            { name: "Armure de Cuir", category: "armor", materials: ["Cuir x5", "Fil x2"], level: 2 },
            { name: "Pioche en Pierre", category: "tools", materials: ["Pierre x2", "Bois x2"], level: 1 },
            { name: "Potion de Soin", category: "consumables", materials: ["Herbe x2", "Eau x1"], level: 1 }
        ];

        return recipes.map(recipe => `
            <div class="recipe-item" data-category="${recipe.category}">
                <div class="recipe-icon">
                    <i class="fas fa-${this.getCraftingIcon(recipe.category)}"></i>
                </div>
                <div class="recipe-info">
                    <h4>${recipe.name}</h4>
                    <p class="recipe-materials">${recipe.materials.join(', ')}</p>
                    <span class="recipe-level">Niveau ${recipe.level}</span>
                </div>
            </div>
        `).join('');
    }

    generateCraftingSlots(count) {
        let slots = '';
        for (let i = 0; i < count; i++) {
            slots += `<div class="craft-slot" data-slot="${i}"></div>`;
        }
        return slots;
    }

    getCraftingIcon(category) {
        switch(category) {
            case 'weapons': return 'sword';
            case 'armor': return 'shield-alt';
            case 'tools': return 'tools';
            case 'consumables': return 'flask';
            default: return 'cube';
        }
    }

    // === JOURNAL ===
    createJournalContent() {
        return `
            <div class="journal-container">
                <div class="journal-tabs">
                    <button class="tab-btn active" data-tab="entries">Entrées</button>
                    <button class="tab-btn" data-tab="discoveries">Découvertes</button>
                    <button class="tab-btn" data-tab="achievements">Succès</button>
                </div>
                
                <div class="journal-content">
                    <div class="journal-entries" id="journal-entries">
                        <div class="entry-item">
                            <div class="entry-date">Jour 1 - 06:00</div>
                            <div class="entry-content">
                                <h4>Début de l'aventure</h4>
                                <p>Je me réveille dans un monde inconnu. L'air est frais et je peux entendre les oiseaux chanter au loin. Il est temps d'explorer...</p>
                            </div>
                        </div>
                        
                        <div class="entry-item">
                            <div class="entry-date">Jour 1 - 08:30</div>
                            <div class="entry-content">
                                <h4>Première découverte</h4>
                                <p>J'ai trouvé un coffre caché derrière un arbre. Il contenait quelques pièces et un outil de base. Cela pourrait être utile.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="journal-actions">
                    <button class="action-btn" id="add-entry">
                        <i class="fas fa-plus"></i> Nouvelle Entrée
                    </button>
                    <button class="action-btn" id="export-journal">
                        <i class="fas fa-download"></i> Exporter
                    </button>
                </div>
            </div>
        `;
    }

    // === CHAT ===
    createChatContent() {
        return `
            <div class="chat-container">
                <div class="chat-tabs">
                    <button class="tab-btn active" data-tab="all">Tout</button>
                    <button class="tab-btn" data-tab="system">Système</button>
                    <button class="tab-btn" data-tab="combat">Combat</button>
                    <button class="tab-btn" data-tab="trade">Commerce</button>
                </div>
                
                <div class="chat-messages" id="chat-messages">
                    <div class="message system">
                        <span class="timestamp">[06:00]</span>
                        <span class="content">Bienvenue dans Super Pixel Adventure 2!</span>
                    </div>
                    <div class="message info">
                        <span class="timestamp">[06:01]</span>
                        <span class="content">Utilisez les touches WASD pour vous déplacer.</span>
                    </div>
                </div>
                
                <div class="chat-input">
                    <input type="text" id="chat-input-field" placeholder="Tapez votre message...">
                    <button id="send-message">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // === COMMERCE ===
    createTradeContent() {
        return `
            <div class="trade-container">
                <div class="trade-header">
                    <h3>Commerce avec <span id="trader-name">Marchand</span></h3>
                    <div class="player-money">
                        <i class="fas fa-coins"></i>
                        <span id="player-money">1000</span> pièces
                    </div>
                </div>
                
                <div class="trade-content">
                    <div class="merchant-inventory">
                        <h4>Marchand</h4>
                        <div class="trade-items" id="merchant-items">
                            ${this.generateTradeItems('sell')}
                        </div>
                    </div>
                    
                    <div class="trade-actions">
                        <div class="trade-summary">
                            <div class="summary-line">
                                <span>Total achat:</span>
                                <span id="buy-total">0 pièces</span>
                            </div>
                            <div class="summary-line">
                                <span>Total vente:</span>
                                <span id="sell-total">0 pièces</span>
                            </div>
                            <div class="summary-line total">
                                <span>Net:</span>
                                <span id="net-total">0 pièces</span>
                            </div>
                        </div>
                        <button class="trade-btn" id="confirm-trade">
                            <i class="fas fa-handshake"></i> Confirmer l'échange
                        </button>
                    </div>
                    
                    <div class="player-inventory">
                        <h4>Votre inventaire</h4>
                        <div class="trade-items" id="player-items">
                            ${this.generateTradeItems('buy')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateTradeItems(type) {
        const items = type === 'sell' ? [
            { name: "Épée en Fer", price: 150, quantity: 1 },
            { name: "Potion de Soin", price: 25, quantity: 5 },
            { name: "Armure de Cuir", price: 200, quantity: 1 }
        ] : [
            { name: "Minerai de Fer", price: 10, quantity: 15 },
            { name: "Bois", price: 5, quantity: 30 },
            { name: "Gemme", price: 100, quantity: 2 }
        ];

        return items.map(item => `
            <div class="trade-item" data-item="${item.name}" data-price="${item.price}">
                <div class="item-icon">
                    <i class="fas fa-cube"></i>
                </div>
                <div class="item-info">
                    <h5>${item.name}</h5>
                    <p>Quantité: ${item.quantity}</p>
                    <p class="item-price">${item.price} pièces</p>
                </div>
                <div class="item-actions">
                    <button class="trade-action" data-action="${type}">
                        ${type === 'sell' ? 'Acheter' : 'Vendre'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // === OPTIONS ===
    createOptionsContent() {
        return `
            <div class="options-container">
                <div class="options-tabs">
                    <button class="tab-btn active" data-tab="graphics">Graphiques</button>
                    <button class="tab-btn" data-tab="audio">Audio</button>
                    <button class="tab-btn" data-tab="controls">Contrôles</button>
                    <button class="tab-btn" data-tab="gameplay">Gameplay</button>
                </div>
                
                <div class="options-content">
                    <div class="option-section" id="graphics-options">
                        <div class="option-group">
                            <h4>Qualité Graphique</h4>
                            <div class="option-item">
                                <label>Résolution:</label>
                                <select id="resolution">
                                    <option value="1920x1080">1920x1080</option>
                                    <option value="1366x768">1366x768</option>
                                    <option value="1280x720">1280x720</option>
                                </select>
                            </div>
                            <div class="option-item">
                                <label>Mode d'affichage:</label>
                                <select id="display-mode">
                                    <option value="windowed">Fenêtré</option>
                                    <option value="fullscreen">Plein écran</option>
                                </select>
                            </div>
                            <div class="option-item">
                                <label>VSync:</label>
                                <input type="checkbox" id="vsync" checked>
                            </div>
                        </div>
                        
                        <div class="option-group">
                            <h4>Effets Visuels</h4>
                            <div class="option-item">
                                <label>Particules:</label>
                                <input type="range" id="particles" min="0" max="100" value="100">
                                <span class="range-value">100%</span>
                            </div>
                            <div class="option-item">
                                <label>Éclairage dynamique:</label>
                                <input type="checkbox" id="dynamic-lighting" checked>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="options-actions">
                    <button class="action-btn" id="apply-options">Appliquer</button>
                    <button class="action-btn" id="reset-options">Réinitialiser</button>
                    <button class="action-btn" id="save-options">Sauvegarder</button>
                </div>
            </div>
        `;
    }

    // === COMPÉTENCES ===
    createSkillsContent() {
        return `
            <div class="skills-container">
                <div class="skills-header">
                    <div class="skill-points">
                        <h3>Points de compétence disponibles: <span id="available-skill-points">5</span></h3>
                    </div>
                </div>
                
                <div class="skills-content">
                    <div class="skill-trees">
                        <div class="skill-tree" data-tree="combat">
                            <h4>Combat</h4>
                            <div class="skill-nodes">
                                ${this.generateSkillNodes('combat')}
                            </div>
                        </div>
                        
                        <div class="skill-tree" data-tree="crafting">
                            <h4>Artisanat</h4>
                            <div class="skill-nodes">
                                ${this.generateSkillNodes('crafting')}
                            </div>
                        </div>
                        
                        <div class="skill-tree" data-tree="exploration">
                            <h4>Exploration</h4>
                            <div class="skill-nodes">
                                ${this.generateSkillNodes('exploration')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="skill-details" id="skill-details">
                    <div class="no-skill-selected">
                        <i class="fas fa-star"></i>
                        <p>Sélectionnez une compétence pour voir ses détails</p>
                    </div>
                </div>
            </div>
        `;
    }

    generateSkillNodes(tree) {
        const skills = {
            combat: [
                { name: "Attaque Puissante", level: 0, maxLevel: 5, cost: 1 },
                { name: "Défense Renforcée", level: 0, maxLevel: 3, cost: 1 },
                { name: "Critique", level: 0, maxLevel: 5, cost: 2 }
            ],
            crafting: [
                { name: "Artisan Expert", level: 0, maxLevel: 3, cost: 1 },
                { name: "Efficacité", level: 0, maxLevel: 5, cost: 1 },
                { name: "Maître Créateur", level: 0, maxLevel: 1, cost: 3 }
            ],
            exploration: [
                { name: "Détection de Trésors", level: 0, maxLevel: 3, cost: 1 },
                { name: "Vitesse de Déplacement", level: 0, maxLevel: 5, cost: 1 },
                { name: "Vision Nocturne", level: 0, maxLevel: 1, cost: 2 }
            ]
        };

        return skills[tree].map(skill => `
            <div class="skill-node ${skill.level > 0 ? 'learned' : ''}" data-skill="${skill.name}">
                <div class="skill-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="skill-info">
                    <h5>${skill.name}</h5>
                    <p>${skill.level}/${skill.maxLevel}</p>
                    <span class="skill-cost">${skill.cost} pts</span>
                </div>
            </div>
        `).join('');
    }

    // === MÉTHODES DE CONTRÔLE DES MENUS ===
    toggleInventory() {
        this.toggleWindow('inventory');
    }

    toggleCharacter() {
        this.toggleWindow('character');
    }

    toggleQuests() {
        this.toggleWindow('quests');
    }

    toggleMap() {
        this.toggleWindow('map');
    }

    toggleCrafting() {
        this.toggleWindow('crafting');
    }

    toggleJournal() {
        this.toggleWindow('journal');
    }

    toggleChat() {
        this.toggleWindow('chat');
    }

    toggleTrade() {
        this.toggleWindow('trade');
    }

    toggleOptions() {
        this.toggleWindow('options');
    }

    toggleSkills() {
        this.toggleWindow('skills');
    }

    toggleWindow(menuId) {
        if (windowManager.isWindowOpen(menuId)) {
            windowManager.closeWindow(menuId);
        } else {
            const menuDef = this.menuDefinitions[menuId];
            if (menuDef) {
                const window = windowManager.createWindow(
                    menuId,
                    menuDef.title,
                    menuDef.content,
                    {
                        ...menuDef.options,
                        icon: menuDef.icon
                    }
                );
                
                // Initialiser les événements spécifiques au menu
                this.initializeMenuEvents(menuId, window);
            }
        }
    }

    initializeMenuEvents(menuId, window) {
        const element = window.element;
        
        switch(menuId) {
            case 'inventory':
                this.initInventoryEvents(element);
                break;
            case 'character':
                this.initCharacterEvents(element);
                break;
            case 'quests':
                this.initQuestEvents(element);
                break;
            case 'crafting':
                this.initCraftingEvents(element);
                break;
            case 'chat':
                this.initChatEvents(element);
                break;
            case 'options':
                this.initOptionsEvents(element);
                break;
            case 'skills':
                this.initSkillsEvents(element);
                break;
        }
    }

    initInventoryEvents(element) {
        // Gestion des onglets
        const tabs = element.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.filterInventoryItems(tab.dataset.tab);
            });
        });

        // Recherche d'objets
        const searchInput = element.querySelector('#inventory-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchInventoryItems(e.target.value);
            });
        }

        // Gestion des clics sur les slots
        const slots = element.querySelectorAll('.inventory-slot');
        slots.forEach(slot => {
            slot.addEventListener('click', () => {
                this.selectInventoryItem(parseInt(slot.dataset.slot));
            });
            
            slot.addEventListener('dblclick', () => {
                this.useInventoryItem(parseInt(slot.dataset.slot));
            });
        });

        // Boutons d'action
        const sortBtn = element.querySelector('#sort-inventory');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => this.sortInventory());
        }

        const dropJunkBtn = element.querySelector('#drop-all-junk');
        if (dropJunkBtn) {
            dropJunkBtn.addEventListener('click', () => this.dropJunkItems());
        }

        const autoStackBtn = element.querySelector('#auto-stack');
        if (autoStackBtn) {
            autoStackBtn.addEventListener('click', () => this.autoStackItems());
        }

        // Mettre à jour les statistiques
        this.updateInventoryStats(element);
    }

    filterInventoryItems(category) {
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            const item = this.gameData.inventory.slots[index];
            if (category === 'items' || !item || item.category === category) {
                slot.style.display = 'flex';
            } else {
                slot.style.display = 'none';
            }
        });
    }

    searchInventoryItems(query) {
        const slots = document.querySelectorAll('.inventory-slot');
        const lowerQuery = query.toLowerCase();
        
        slots.forEach((slot, index) => {
            const item = this.gameData.inventory.slots[index];
            if (!query || !item || item.name.toLowerCase().includes(lowerQuery)) {
                slot.style.display = 'flex';
            } else {
                slot.style.display = 'none';
            }
        });
    }

    selectInventoryItem(slotIndex) {
        const item = this.gameData.inventory.slots[slotIndex];
        const detailsEl = document.querySelector('#item-details');
        
        if (!item || !detailsEl) return;

        detailsEl.innerHTML = `
            <div class="item-details-content">
                <div class="item-header">
                    <div class="item-icon-large">
                        <i class="${item.icon}"></i>
                    </div>
                    <div class="item-info">
                        <h3 class="item-name ${item.quality}">${item.name}</h3>
                        <p class="item-category">${this.gameData.inventory.categories[item.category]}</p>
                        <p class="item-quantity">Quantité: ${item.quantity}</p>
                    </div>
                </div>
                
                <div class="item-description">
                    <p>${item.description}</p>
                </div>
                
                ${item.stats ? `
                    <div class="item-stats">
                        <h4>Statistiques</h4>
                        ${Object.entries(item.stats).map(([stat, value]) => 
                            `<div class="stat-line">
                                <span>${stat}:</span>
                                <span>${value}</span>
                            </div>`
                        ).join('')}
                    </div>
                ` : ''}
                
                ${item.effects ? `
                    <div class="item-effects">
                        <h4>Effets</h4>
                        ${Object.entries(item.effects).map(([effect, value]) => 
                            `<div class="effect-line">
                                <span>${effect}:</span>
                                <span>+${value}</span>
                            </div>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <div class="item-value">
                    <div class="value-line">
                        <span>Valeur unitaire:</span>
                        <span>${item.value} pièces</span>
                    </div>
                    <div class="value-line">
                        <span>Poids unitaire:</span>
                        <span>${item.weight} kg</span>
                    </div>
                </div>
                
                <div class="item-actions">
                    <button class="action-btn primary" onclick="window.gameMenus?.useInventoryItem(${slotIndex})">
                        <i class="fas fa-hand-pointer"></i> Utiliser
                    </button>
                    ${item.category === 'weapons' || item.category === 'armor' ? `
                        <button class="action-btn" onclick="window.gameMenus?.equipItem(${slotIndex})">
                            <i class="fas fa-shield-alt"></i> Équiper
                        </button>
                    ` : ''}
                    <button class="action-btn warning" onclick="window.gameMenus?.dropItem(${slotIndex})">
                        <i class="fas fa-trash"></i> Jeter
                    </button>
                </div>
            </div>
        `;
    }

    useInventoryItem(slotIndex) {
        const item = this.gameData.inventory.slots[slotIndex];
        if (!item) return;

        if (item.category === 'consumables' && item.effects) {
            // Appliquer les effets
            if (item.effects.heal) {
                const character = this.gameData.character;
                const oldHealth = character.derivedStats.health.current;
                character.derivedStats.health.current = Math.min(
                    character.derivedStats.health.current + item.effects.heal,
                    character.derivedStats.health.max
                );
                const healed = character.derivedStats.health.current - oldHealth;
                
                if (this.game.uiManager) {
                    this.game.uiManager.showNotification(`+${healed} PV`, 'success');
                }
            }
            
            // Consommer l'objet
            this.gameData.removeItemFromInventory(slotIndex, 1);
            this.refreshInventory();
        }
    }

    equipItem(slotIndex) {
        const item = this.gameData.inventory.slots[slotIndex];
        if (!item) return;

        // Logique d'équipement (à implémenter selon le type d'objet)
        if (this.game.uiManager) {
            this.game.uiManager.showNotification(`${item.name} équipé`, 'success');
        }
    }

    dropItem(slotIndex) {
        const item = this.gameData.inventory.slots[slotIndex];
        if (!item) return;

        if (confirm(`Êtes-vous sûr de vouloir jeter ${item.name} ?`)) {
            this.gameData.removeItemFromInventory(slotIndex, 1);
            this.refreshInventory();
            
            if (this.game.uiManager) {
                this.game.uiManager.showNotification(`${item.name} jeté`, 'warning');
            }
        }
    }

    sortInventory() {
        // Trier l'inventaire par catégorie puis par nom
        const items = this.gameData.inventory.slots.filter(slot => slot !== null);
        items.sort((a, b) => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
        });

        // Réinitialiser les slots
        this.gameData.inventory.slots.fill(null);
        
        // Replacer les objets triés
        items.forEach((item, index) => {
            this.gameData.inventory.slots[index] = item;
        });

        this.refreshInventory();
        
        if (this.game.uiManager) {
            this.game.uiManager.showNotification('Inventaire trié', 'info');
        }
    }

    dropJunkItems() {
        let droppedCount = 0;
        
        for (let i = this.gameData.inventory.slots.length - 1; i >= 0; i--) {
            const item = this.gameData.inventory.slots[i];
            if (item && item.quality === 'junk') {
                this.gameData.removeItemFromInventory(i, item.quantity);
                droppedCount++;
            }
        }

        this.refreshInventory();
        
        if (this.game.uiManager) {
            this.game.uiManager.showNotification(`${droppedCount} objets de rebut jetés`, 'info');
        }
    }

    autoStackItems() {
        // Logique de regroupement automatique des objets stackables
        const stackableItems = new Map();
        
        // Identifier les objets stackables
        this.gameData.inventory.slots.forEach((item, index) => {
            if (item && this.gameData.canStackItem(item)) {
                if (!stackableItems.has(item.id)) {
                    stackableItems.set(item.id, []);
                }
                stackableItems.get(item.id).push({ item, index });
            }
        });

        let stackedCount = 0;
        
        // Regrouper les objets
        stackableItems.forEach((instances, itemId) => {
            if (instances.length > 1) {
                const totalQuantity = instances.reduce((sum, inst) => sum + inst.item.quantity, 0);
                
                // Garder le premier slot et vider les autres
                instances[0].item.quantity = totalQuantity;
                for (let i = 1; i < instances.length; i++) {
                    this.gameData.inventory.slots[instances[i].index] = null;
                    stackedCount++;
                }
            }
        });

        this.refreshInventory();
        
        if (this.game.uiManager) {
            this.game.uiManager.showNotification(`${stackedCount} objets regroupés`, 'info');
        }
    }

    updateInventoryStats(element) {
        const weightEl = element.querySelector('#inventory-weight');
        const slotsEl = element.querySelector('#inventory-slots');
        const valueEl = element.querySelector('#inventory-value');

        if (weightEl) {
            weightEl.textContent = `${this.gameData.inventory.currentWeight.toFixed(1)}/${this.gameData.inventory.maxWeight} kg`;
        }

        if (slotsEl) {
            const usedSlots = this.gameData.inventory.slots.filter(slot => slot !== null).length;
            slotsEl.textContent = `${usedSlots}/${this.gameData.inventory.slots.length}`;
        }

        if (valueEl) {
            valueEl.textContent = `${this.gameData.getInventoryValue()} pièces`;
        }
    }

    refreshInventory() {
        const window = windowManager.getWindow('inventory');
        if (window) {
            const inventoryGrid = window.element.querySelector('#inventory-items');
            if (inventoryGrid) {
                inventoryGrid.innerHTML = this.generateInventorySlots(this.gameData.inventory.slots.length);
                this.initInventoryEvents(window.element);
            }
        }
    }

    initCharacterEvents(element) {
        // Gestion des boutons d'amélioration des stats
        const statButtons = element.querySelectorAll('.stat-up');
        statButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const stat = btn.dataset.stat;
                if (this.gameData.increaseStat(stat)) {
                    this.refreshCharacterWindow();
                    if (this.game.uiManager) {
                        this.game.uiManager.showNotification(`${stat} amélioré!`, 'success');
                    }
                } else {
                    if (this.game.uiManager) {
                        this.game.uiManager.showNotification('Points insuffisants ou stat au maximum', 'warning');
                    }
                }
            });
        });

        // Mettre à jour les données affichées
        this.updateCharacterDisplay(element);
    }

    updateCharacterDisplay(element) {
        const character = this.gameData.character;
        
        // Nom et niveau
        const nameEl = element.querySelector('#character-name');
        const levelEl = element.querySelector('#char-level');
        const xpFillEl = element.querySelector('#char-xp-fill');
        const xpTextEl = element.querySelector('#char-xp-text');
        
        if (nameEl) nameEl.textContent = character.name;
        if (levelEl) levelEl.textContent = character.level;
        
        if (xpFillEl && xpTextEl) {
            const xpPercent = (character.experience / character.experienceToNext) * 100;
            xpFillEl.style.width = xpPercent + '%';
            xpTextEl.textContent = `${character.experience}/${character.experienceToNext} XP`;
        }

        // Statistiques principales
        Object.entries(character.stats).forEach(([stat, value]) => {
            const statEl = element.querySelector(`#stat-${stat}`);
            if (statEl) statEl.textContent = value;
        });

        // Statistiques dérivées
        const healthBar = element.querySelector('#health-bar');
        const healthText = element.querySelector('#health-text');
        if (healthBar && healthText) {
            const healthPercent = (character.derivedStats.health.current / character.derivedStats.health.max) * 100;
            healthBar.style.width = healthPercent + '%';
            healthText.textContent = `${Math.round(character.derivedStats.health.current)}/${character.derivedStats.health.max}`;
        }

        const manaBar = element.querySelector('#mana-bar');
        const manaText = element.querySelector('#mana-text');
        if (manaBar && manaText) {
            const manaPercent = (character.derivedStats.mana.current / character.derivedStats.mana.max) * 100;
            manaBar.style.width = manaPercent + '%';
            manaText.textContent = `${Math.round(character.derivedStats.mana.current)}/${character.derivedStats.mana.max}`;
        }

        const staminaBar = element.querySelector('#stamina-bar');
        const staminaText = element.querySelector('#stamina-text');
        if (staminaBar && staminaText) {
            const staminaPercent = (character.derivedStats.stamina.current / character.derivedStats.stamina.max) * 100;
            staminaBar.style.width = staminaPercent + '%';
            staminaText.textContent = `${Math.round(character.derivedStats.stamina.current)}/${character.derivedStats.stamina.max}`;
        }

        // Points disponibles
        const pointsEl = element.querySelector('#available-points');
        if (pointsEl) pointsEl.textContent = character.availablePoints;
    }

    refreshCharacterWindow() {
        const window = windowManager.getWindow('character');
        if (window) {
            this.updateCharacterDisplay(window.element);
        }
    }

    initQuestEvents(element) {
        // Gestion de la sélection des quêtes
        const questItems = element.querySelectorAll('.quest-item');
        questItems.forEach(item => {
            item.addEventListener('click', () => {
                questItems.forEach(q => q.classList.remove('selected'));
                item.classList.add('selected');
                // Afficher les détails de la quête
            });
        });
    }

    initCraftingEvents(element) {
        // Gestion des recettes
        const recipes = element.querySelectorAll('.recipe-item');
        recipes.forEach(recipe => {
            recipe.addEventListener('click', () => {
                recipes.forEach(r => r.classList.remove('selected'));
                recipe.classList.add('selected');
                // Afficher les matériaux requis
            });
        });
    }

    initChatEvents(element) {
        // Gestion de l'envoi de messages
        const input = element.querySelector('#chat-input-field');
        const sendBtn = element.querySelector('#send-message');
        
        const sendMessage = () => {
            const message = input.value.trim();
            if (message) {
                this.addChatMessage(element, message, 'player');
                input.value = '';
            }
        };

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        }
    }

    initOptionsEvents(element) {
        // Gestion des sliders
        const ranges = element.querySelectorAll('input[type="range"]');
        ranges.forEach(range => {
            const valueSpan = range.nextElementSibling;
            range.addEventListener('input', () => {
                if (valueSpan) valueSpan.textContent = range.value + '%';
            });
        });
    }

    initSkillsEvents(element) {
        // Gestion des compétences
        const skillNodes = element.querySelectorAll('.skill-node');
        skillNodes.forEach(node => {
            node.addEventListener('click', () => {
                const skillName = node.dataset.skill;
                console.log('Compétence sélectionnée:', skillName);
                // Logique d'amélioration des compétences
            });
        });
    }

    addChatMessage(chatElement, message, type = 'player') {
        const messagesContainer = chatElement.querySelector('#chat-messages');
        if (messagesContainer) {
            const messageEl = document.createElement('div');
            messageEl.className = `message ${type}`;
            
            const now = new Date();
            const timestamp = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
            
            messageEl.innerHTML = `
                <span class="timestamp">${timestamp}</span>
                <span class="content">${message}</span>
            `;
            
            messagesContainer.appendChild(messageEl);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Méthode pour mettre à jour les données des menus
    updateMenuData(menuId, data) {
        const window = windowManager.getWindow(menuId);
        if (window) {
            switch(menuId) {
                case 'character':
                    this.updateCharacterDisplay(window.element);
                    break;
                case 'inventory':
                    this.updateInventoryStats(window.element);
                    break;
                // Ajouter d'autres cas selon les besoins
            }
        }
    }

    // Mise à jour globale de tous les menus ouverts
    updateAllMenus() {
        // Mettre à jour les données du jeu
        this.gameData.update();
        
        // Mettre à jour chaque menu ouvert
        windowManager.windows.forEach((window, menuId) => {
            this.updateMenuData(menuId);
        });
    }

    // Sauvegarder les données du jeu
    saveGameData() {
        return this.gameData.saveData();
    }

    // Charger les données du jeu
    loadGameData() {
        return this.gameData.loadData();
    }

    updateCharacterData(element, data) {
        // Mettre à jour les statistiques du personnage
        if (data.level) {
            const levelEl = element.querySelector('#char-level');
            if (levelEl) levelEl.textContent = data.level;
        }
        
        if (data.health) {
            const healthBar = element.querySelector('#health-bar');
            const healthText = element.querySelector('#health-text');
            if (healthBar && healthText) {
                const percentage = (data.health.current / data.health.max) * 100;
                healthBar.style.width = percentage + '%';
                healthText.textContent = `${data.health.current}/${data.health.max}`;
            }
        }
    }

    updateInventoryData(element, data) {
        // Mettre à jour l'inventaire
        if (data.weight) {
            const weightEl = element.querySelector('#inventory-weight');
            if (weightEl) weightEl.textContent = `${data.weight.current}/${data.weight.max} kg`;
        }
    }
}

// Styles CSS pour les menus
const menuStyles = `
<style>
/* Styles généraux pour les menus */
.game-window .window-content {
    font-family: 'VT323', monospace;
    font-size: 16px;
}

/* Onglets */
.tab-btn {
    padding: 8px 16px;
    background: linear-gradient(to bottom, #4a4a4a, #2a2a2a);
    border: 1px solid #666;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-btn:hover {
    background: linear-gradient(to bottom, #5a5a5a, #3a3a3a);
}

.tab-btn.active {
    background: linear-gradient(to bottom, #FF9800, #F57C00);
    color: #000;
}

/* Inventaire */
.inventory-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.inventory-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #555;
}

.inventory-tabs {
    display: flex;
    gap: 5px;
}

.inventory-search {
    position: relative;
}

.inventory-search input {
    padding: 5px 25px 5px 10px;
    background: rgba(0,0,0,0.5);
    border: 1px solid #666;
    border-radius: 4px;
    color: #fff;
}

.inventory-search i {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
}

.inventory-content {
    display: flex;
    flex: 1;
    gap: 15px;
}

.inventory-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
    flex: 1;
}

.inventory-slot {
    width: 40px;
    height: 40px;
    border: 1px solid #666;
    background: rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.inventory-slot:hover {
    border-color: #FF9800;
    background: rgba(255,152,0,0.1);
}

.inventory-sidebar {
    width: 200px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.item-details {
    flex: 1;
    border: 1px solid #555;
    padding: 10px;
    background: rgba(0,0,0,0.2);
}

.no-item-selected {
    text-align: center;
    color: #999;
    padding: 20px;
}

.inventory-stats {
    border: 1px solid #555;
    padding: 10px;
    background: rgba(0,0,0,0.2);
}

.stat-line {
    display: flex;
    justify-content: space-between;
    margin: 5px 0;
}

.inventory-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px solid #555;
}

.action-btn {
    padding: 8px 12px;
    background: linear-gradient(to bottom, #4a4a4a, #2a2a2a);
    border: 1px solid #666;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s;
}

.action-btn:hover {
    background: linear-gradient(to bottom, #5a5a5a, #3a3a3a);
}

/* Personnage */
.character-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.character-tabs {
    display: flex;
    gap: 5px;
    margin-bottom: 15px;
}

.character-content {
    display: flex;
    gap: 20px;
    flex: 1;
}

.character-model {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.character-avatar {
    border: 2px solid #666;
    background: rgba(0,0,0,0.3);
}

.character-info {
    text-align: center;
}

.character-level {
    color: #FF9800;
    font-weight: bold;
}

.xp-bar {
    width: 150px;
    height: 20px;
    background: rgba(0,0,0,0.5);
    border: 1px solid #666;
    border-radius: 10px;
    position: relative;
    overflow: hidden;
    margin-top: 5px;
}

.xp-fill {
    height: 100%;
    background: linear-gradient(to right, #3498db, #2c3e50);
    transition: width 0.3s;
}

.xp-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    color: #fff;
    text-shadow: 1px 1px 0 #000;
}

.character-stats {
    flex: 1;
}

.stat-category {
    margin-bottom: 20px;
    border: 1px solid #555;
    padding: 10px;
    background: rgba(0,0,0,0.2);
}

.stat-category h4 {
    color: #FF9800;
    margin-bottom: 10px;
    border-bottom: 1px solid #555;
    padding-bottom: 5px;
}

.stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.stat-name {
    flex: 1;
}

.stat-value {
    color: #FF9800;
    font-weight: bold;
    min-width: 30px;
    text-align: center;
}

.stat-up {
    width: 25px;
    height: 25px;
    background: linear-gradient(to bottom, #4CAF50, #388E3C);
    border: 1px solid #4CAF50;
    border-radius: 3px;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition: all 0.2s;
}

.stat-up:hover {
    background: linear-gradient(to bottom, #5CBF60, #4CAF50);
    transform: scale(1.1);
}

.derived-stats {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.stat-bar {
    display: flex;
    align-items: center;
    gap: 10px;
}

.stat-bar span:first-child {
    min-width: 60px;
}

.bar {
    flex: 1;
    height: 20px;
    background: rgba(0,0,0,0.5);
    border: 1px solid #666;
    border-radius: 10px;
    position: relative;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    transition: width 0.3s;
}

.bar-fill.health {
    background: linear-gradient(to right, #e74c3c, #c0392b);
}

.bar-fill.mana {
    background: linear-gradient(to right, #3498db, #2980b9);
}

.bar-fill.stamina {
    background: linear-gradient(to right, #f39c12, #e67e22);
}

.bar-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    color: #fff;
    text-shadow: 1px 1px 0 #000;
}

/* Quêtes */
.quests-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.quests-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #555;
}

.quest-filters {
    display: flex;
    gap: 5px;
}

.filter-btn {
    padding: 6px 12px;
    background: linear-gradient(to bottom, #4a4a4a, #2a2a2a);
    border: 1px solid #666;
    color: #fff;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
}

.filter-btn:hover {
    background: linear-gradient(to bottom, #5a5a5a, #3a3a3a);
}

.filter-btn.active {
    background: linear-gradient(to bottom, #FF9800, #F57C00);
    color: #000;
}

.quest-search input {
    padding: 6px 10px;
    background: rgba(0,0,0,0.5);
    border: 1px solid #666;
    border-radius: 4px;
    color: #fff;
    width: 200px;
}

.quests-content {
    display: flex;
    gap: 15px;
    flex: 1;
}

.quest-list {
    flex: 1;
    max-height: 300px;
    overflow-y: auto;
}

.quest-item {
    border: 1px solid #555;
    margin-bottom: 10px;
    padding: 10px;
    background: rgba(0,0,0,0.2);
    cursor: pointer;
    transition: all 0.2s;
}

.quest-item:hover {
    border-color: #FF9800;
    background: rgba(255,152,0,0.1);
}

.quest-item.selected {
    border-color: #FF9800;
    background: rgba(255,152,0,0.2);
}

.quest-item.completed {
    opacity: 0.7;
    border-color: #4CAF50;
}

.quest-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.quest-title h4 {
    margin: 0;
    color: #fff;
}

.quest-type {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
    margin-left: 10px;
}

.quest-type.principale {
    background: #e74c3c;
    color: #fff;
}

.quest-type.secondaire {
    background: #3498db;
    color: #fff;
}

.quest-type.craft {
    background: #f39c12;
    color: #fff;
}

.quest-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.progress-bar {
    flex: 1;
    height: 8px;
    background: rgba(0,0,0,0.5);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(to right, #4CAF50, #388E3C);
    transition: width 0.3s;
}

.progress-text {
    font-size: 12px;
    color: #999;
    min-width: 35px;
}

.quest-description {
    color: #ccc;
    font-size: 14px;
    margin: 0;
}

.quest-details {
    width: 250px;
    border: 1px solid #555;
    padding: 15px;
    background: rgba(0,0,0,0.2);
}

.quest-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px solid #555;
}

.quest-stats .stat-item {
    text-align: center;
}

.quest-stats .stat-item span:last-child {
    display: block;
    color: #FF9800;
    font-weight: bold;
    font-size: 18px;
}

/* Chat */
.chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.chat-tabs {
    display: flex;
    gap: 5px;
    margin-bottom: 10px;
}

.chat-messages {
    flex: 1;
    background: rgba(0,0,0,0.3);
    border: 1px solid #555;
    padding: 10px;
    overflow-y: auto;
    max-height: 200px;
}

.message {
    margin-bottom: 5px;
    display: flex;
    gap: 8px;
}

.message.system .content {
    color: #4CAF50;
}

.message.info .content {
    color: #2196F3;
}

.message.player .content {
    color: #FF9800;
}

.timestamp {
    color: #999;
    font-size: 12px;
    min-width: 50px;
}

.chat-input {
    display: flex;
    gap: 5px;
    margin-top: 10px;
}

.chat-input input {
    flex: 1;
    padding: 8px;
    background: rgba(0,0,0,0.5);
    border: 1px solid #666;
    border-radius: 4px;
    color: #fff;
}

.chat-input button {
    padding: 8px 12px;
    background: linear-gradient(to bottom, #4CAF50, #388E3C);
    border: 1px solid #4CAF50;
    border-radius: 4px;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
}

.chat-input button:hover {
    background: linear-gradient(to bottom, #5CBF60, #4CAF50);
}

/* Styles responsifs */
@media (max-width: 768px) {
    .inventory-content {
        flex-direction: column;
    }
    
    .inventory-sidebar {
        width: 100%;
    }
    
    .character-content {
        flex-direction: column;
    }
    
    .quests-content {
        flex-direction: column;
    }
    
    .quest-details {
        width: 100%;
    }
}
</style>
`;

// Injecter les styles
document.head.insertAdjacentHTML('beforeend', menuStyles);

export { GameMenus };