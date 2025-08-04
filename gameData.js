// gameData.js - Système de données pour les menus du jeu
export class GameData {
    constructor(game) {
        this.game = game;
        this.player = game.player;
        this.init();
    }

    init() {
        // Initialiser les données par défaut
        this.initializeInventory();
        this.initializeCharacter();
        this.initializeQuests();
        this.initializeSkills();
        this.initializeCrafting();
        this.initializeJournal();
        this.initializeAchievements();
    }

    // === SYSTÈME D'INVENTAIRE ===
    initializeInventory() {
        this.inventory = {
            slots: new Array(40).fill(null),
            maxWeight: 100,
            currentWeight: 0,
            categories: {
                all: 'Tous les objets',
                weapons: 'Armes',
                armor: 'Armures',
                tools: 'Outils',
                consumables: 'Consommables',
                materials: 'Matériaux',
                quest: 'Objets de quête',
                misc: 'Divers'
            }
        };

        // Ajouter quelques objets de démo
        this.addItemToInventory({
            id: 'iron_sword',
            name: 'Épée en Fer',
            category: 'weapons',
            quantity: 1,
            weight: 3.5,
            value: 150,
            quality: 'common',
            description: 'Une épée solide forgée en fer. Parfaite pour les aventuriers débutants.',
            stats: {
                damage: 25,
                durability: 100,
                maxDurability: 100
            },
            icon: 'fas fa-sword'
        });

        this.addItemToInventory({
            id: 'health_potion',
            name: 'Potion de Soin',
            category: 'consumables',
            quantity: 5,
            weight: 0.5,
            value: 25,
            quality: 'common',
            description: 'Restaure 50 points de vie instantanément.',
            effects: {
                heal: 50
            },
            icon: 'fas fa-flask'
        });

        this.addItemToInventory({
            id: 'iron_ore',
            name: 'Minerai de Fer',
            category: 'materials',
            quantity: 15,
            weight: 1.0,
            value: 10,
            quality: 'common',
            description: 'Minerai brut qui peut être fondu pour créer des lingots de fer.',
            icon: 'fas fa-cube'
        });
    }

    addItemToInventory(item) {
        // Chercher un slot vide ou stackable
        for (let i = 0; i < this.inventory.slots.length; i++) {
            const slot = this.inventory.slots[i];
            
            if (!slot) {
                // Slot vide
                this.inventory.slots[i] = { ...item };
                this.updateInventoryWeight();
                return true;
            } else if (slot.id === item.id && this.canStackItem(item)) {
                // Stackable
                slot.quantity += item.quantity;
                this.updateInventoryWeight();
                return true;
            }
        }
        return false; // Inventaire plein
    }

    removeItemFromInventory(slotIndex, quantity = 1) {
        const slot = this.inventory.slots[slotIndex];
        if (!slot) return false;

        if (slot.quantity <= quantity) {
            this.inventory.slots[slotIndex] = null;
        } else {
            slot.quantity -= quantity;
        }
        
        this.updateInventoryWeight();
        return true;
    }

    canStackItem(item) {
        return item.category === 'consumables' || item.category === 'materials';
    }

    updateInventoryWeight() {
        this.inventory.currentWeight = 0;
        this.inventory.slots.forEach(slot => {
            if (slot) {
                this.inventory.currentWeight += slot.weight * slot.quantity;
            }
        });
    }

    getInventoryValue() {
        let totalValue = 0;
        this.inventory.slots.forEach(slot => {
            if (slot) {
                totalValue += slot.value * slot.quantity;
            }
        });
        return totalValue;
    }

    // === SYSTÈME DE PERSONNAGE ===
    initializeCharacter() {
        this.character = {
            name: 'Aventurier',
            level: 1,
            experience: 0,
            experienceToNext: 100,
            availablePoints: 0,
            
            // Statistiques principales
            stats: {
                strength: 10,
                agility: 10,
                intelligence: 10,
                endurance: 10,
                luck: 10
            },
            
            // Statistiques dérivées
            derivedStats: {
                health: { current: 100, max: 100 },
                mana: { current: 50, max: 50 },
                stamina: { current: 100, max: 100 },
                attackPower: 15,
                defense: 5,
                criticalChance: 5,
                moveSpeed: 100
            },
            
            // Équipement
            equipment: {
                helmet: null,
                chestplate: null,
                leggings: null,
                boots: null,
                weapon: null,
                shield: null,
                ring1: null,
                ring2: null,
                necklace: null
            },
            
            // Résistances
            resistances: {
                fire: 0,
                ice: 0,
                lightning: 0,
                poison: 0,
                physical: 0
            }
        };
        
        this.updateDerivedStats();
    }

    updateDerivedStats() {
        const stats = this.character.stats;
        const derived = this.character.derivedStats;
        
        // Calculer les stats dérivées basées sur les stats principales
        derived.health.max = 100 + (stats.endurance * 10);
        derived.mana.max = 50 + (stats.intelligence * 5);
        derived.stamina.max = 100 + (stats.endurance * 5);
        derived.attackPower = 15 + (stats.strength * 2);
        derived.defense = 5 + (stats.endurance * 1);
        derived.criticalChance = 5 + (stats.luck * 0.5);
        derived.moveSpeed = 100 + (stats.agility * 2);
        
        // S'assurer que les valeurs actuelles ne dépassent pas les maximums
        derived.health.current = Math.min(derived.health.current, derived.health.max);
        derived.mana.current = Math.min(derived.mana.current, derived.mana.max);
        derived.stamina.current = Math.min(derived.stamina.current, derived.stamina.max);
    }

    increaseStat(statName) {
        if (this.character.availablePoints > 0 && this.character.stats[statName] < 100) {
            this.character.stats[statName]++;
            this.character.availablePoints--;
            this.updateDerivedStats();
            return true;
        }
        return false;
    }

    gainExperience(amount) {
        this.character.experience += amount;
        
        while (this.character.experience >= this.character.experienceToNext) {
            this.levelUp();
        }
    }

    levelUp() {
        this.character.experience -= this.character.experienceToNext;
        this.character.level++;
        this.character.availablePoints += 3;
        this.character.experienceToNext = Math.floor(this.character.experienceToNext * 1.2);
        
        // Bonus de niveau
        this.character.derivedStats.health.max += 10;
        this.character.derivedStats.health.current = this.character.derivedStats.health.max;
        this.character.derivedStats.mana.max += 5;
        this.character.derivedStats.mana.current = this.character.derivedStats.mana.max;
        
        if (this.game.uiManager) {
            this.game.uiManager.showNotification(`Niveau ${this.character.level} atteint!`, 'success');
        }
    }

    // === SYSTÈME DE QUÊTES ===
    initializeQuests() {
        this.quests = {
            active: [],
            completed: [],
            failed: [],
            available: []
        };

        // Ajouter des quêtes de démo
        this.addQuest({
            id: 'first_steps',
            title: 'Premiers Pas',
            type: 'main',
            description: 'Explorez le monde et découvrez ses secrets.',
            objectives: [
                { id: 'explore', description: 'Explorer 5 zones différentes', progress: 2, target: 5, completed: false },
                { id: 'collect', description: 'Collecter 10 ressources', progress: 7, target: 10, completed: false }
            ],
            rewards: {
                experience: 100,
                gold: 50,
                items: [{ id: 'iron_sword', quantity: 1 }]
            },
            status: 'active'
        });

        this.addQuest({
            id: 'resource_collector',
            title: 'Collecteur de Ressources',
            type: 'side',
            description: 'Collectez différents types de minerais pour le forgeron.',
            objectives: [
                { id: 'iron_ore', description: 'Collecter 10 minerais de fer', progress: 5, target: 10, completed: false },
                { id: 'copper_ore', description: 'Collecter 5 minerais de cuivre', progress: 0, target: 5, completed: false }
            ],
            rewards: {
                experience: 75,
                gold: 100,
                items: [{ id: 'pickaxe_upgrade', quantity: 1 }]
            },
            status: 'active'
        });

        this.addQuest({
            id: 'master_crafter',
            title: 'Maître Artisan',
            type: 'craft',
            description: 'Créez votre premier objet pour débloquer l\'artisanat avancé.',
            objectives: [
                { id: 'craft_item', description: 'Créer un objet', progress: 1, target: 1, completed: true }
            ],
            rewards: {
                experience: 50,
                gold: 25
            },
            status: 'completed'
        });
    }

    addQuest(quest) {
        this.quests[quest.status].push(quest);
    }

    updateQuestProgress(questId, objectiveId, progress) {
        const quest = this.findQuest(questId);
        if (!quest) return false;

        const objective = quest.objectives.find(obj => obj.id === objectiveId);
        if (!objective) return false;

        objective.progress = Math.min(progress, objective.target);
        objective.completed = objective.progress >= objective.target;

        // Vérifier si la quête est terminée
        const allCompleted = quest.objectives.every(obj => obj.completed);
        if (allCompleted && quest.status === 'active') {
            this.completeQuest(questId);
        }

        return true;
    }

    completeQuest(questId) {
        const questIndex = this.quests.active.findIndex(q => q.id === questId);
        if (questIndex === -1) return false;

        const quest = this.quests.active.splice(questIndex, 1)[0];
        quest.status = 'completed';
        this.quests.completed.push(quest);

        // Donner les récompenses
        if (quest.rewards) {
            if (quest.rewards.experience) {
                this.gainExperience(quest.rewards.experience);
            }
            if (quest.rewards.gold) {
                // Ajouter l'or (à implémenter)
            }
            if (quest.rewards.items) {
                quest.rewards.items.forEach(item => {
                    // Ajouter les objets à l'inventaire
                });
            }
        }

        if (this.game.uiManager) {
            this.game.uiManager.showNotification(`Quête "${quest.title}" terminée!`, 'success');
        }

        return true;
    }

    findQuest(questId) {
        for (const category of Object.values(this.quests)) {
            const quest = category.find(q => q.id === questId);
            if (quest) return quest;
        }
        return null;
    }

    // === SYSTÈME DE COMPÉTENCES ===
    initializeSkills() {
        this.skills = {
            availablePoints: 5,
            trees: {
                combat: {
                    name: 'Combat',
                    skills: {
                        power_attack: { name: 'Attaque Puissante', level: 0, maxLevel: 5, cost: 1, description: 'Augmente les dégâts de 10% par niveau' },
                        defense_boost: { name: 'Défense Renforcée', level: 0, maxLevel: 3, cost: 1, description: 'Réduit les dégâts reçus de 5% par niveau' },
                        critical_strike: { name: 'Frappe Critique', level: 0, maxLevel: 5, cost: 2, description: 'Augmente les chances de critique de 5% par niveau' },
                        berserker: { name: 'Berserker', level: 0, maxLevel: 1, cost: 3, description: 'Attaque plus rapidement quand la vie est faible' }
                    }
                },
                crafting: {
                    name: 'Artisanat',
                    skills: {
                        expert_crafter: { name: 'Artisan Expert', level: 0, maxLevel: 3, cost: 1, description: 'Réduit les matériaux requis de 10% par niveau' },
                        efficiency: { name: 'Efficacité', level: 0, maxLevel: 5, cost: 1, description: 'Augmente la vitesse de création de 20% par niveau' },
                        master_creator: { name: 'Maître Créateur', level: 0, maxLevel: 1, cost: 3, description: 'Débloque des recettes légendaires' },
                        recycling: { name: 'Recyclage', level: 0, maxLevel: 3, cost: 2, description: 'Récupère des matériaux en détruisant des objets' }
                    }
                },
                exploration: {
                    name: 'Exploration',
                    skills: {
                        treasure_hunter: { name: 'Chasseur de Trésors', level: 0, maxLevel: 3, cost: 1, description: 'Augmente les chances de trouver des objets rares' },
                        speed_boost: { name: 'Vitesse Accrue', level: 0, maxLevel: 5, cost: 1, description: 'Augmente la vitesse de déplacement de 10% par niveau' },
                        night_vision: { name: 'Vision Nocturne', level: 0, maxLevel: 1, cost: 2, description: 'Permet de voir dans l\'obscurité' },
                        pathfinding: { name: 'Orientation', level: 0, maxLevel: 3, cost: 1, description: 'Révèle des points d\'intérêt sur la carte' }
                    }
                }
            }
        };
    }

    upgradeSkill(treeId, skillId) {
        const skill = this.skills.trees[treeId]?.skills[skillId];
        if (!skill) return false;

        if (this.skills.availablePoints >= skill.cost && skill.level < skill.maxLevel) {
            skill.level++;
            this.skills.availablePoints -= skill.cost;
            
            if (this.game.uiManager) {
                this.game.uiManager.showNotification(`${skill.name} amélioré au niveau ${skill.level}!`, 'success');
            }
            
            return true;
        }
        return false;
    }

    // === SYSTÈME D'ARTISANAT ===
    initializeCrafting() {
        this.crafting = {
            recipes: {
                iron_sword: {
                    name: 'Épée en Fer',
                    category: 'weapons',
                    materials: [
                        { id: 'iron_ingot', quantity: 3 },
                        { id: 'wood', quantity: 1 }
                    ],
                    result: { id: 'iron_sword', quantity: 1 },
                    requiredLevel: 1,
                    craftingTime: 5000
                },
                leather_armor: {
                    name: 'Armure de Cuir',
                    category: 'armor',
                    materials: [
                        { id: 'leather', quantity: 5 },
                        { id: 'thread', quantity: 2 }
                    ],
                    result: { id: 'leather_armor', quantity: 1 },
                    requiredLevel: 2,
                    craftingTime: 8000
                },
                health_potion: {
                    name: 'Potion de Soin',
                    category: 'consumables',
                    materials: [
                        { id: 'herb', quantity: 2 },
                        { id: 'water', quantity: 1 }
                    ],
                    result: { id: 'health_potion', quantity: 3 },
                    requiredLevel: 1,
                    craftingTime: 3000
                }
            },
            currentCraft: null,
            craftingProgress: 0
        };
    }

    canCraftRecipe(recipeId) {
        const recipe = this.crafting.recipes[recipeId];
        if (!recipe) return false;

        // Vérifier le niveau requis
        if (this.character.level < recipe.requiredLevel) return false;

        // Vérifier les matériaux
        return recipe.materials.every(material => {
            const inventoryCount = this.getItemQuantityInInventory(material.id);
            return inventoryCount >= material.quantity;
        });
    }

    startCrafting(recipeId) {
        if (!this.canCraftRecipe(recipeId) || this.crafting.currentCraft) return false;

        const recipe = this.crafting.recipes[recipeId];
        
        // Consommer les matériaux
        recipe.materials.forEach(material => {
            this.removeItemFromInventoryById(material.id, material.quantity);
        });

        this.crafting.currentCraft = {
            recipeId: recipeId,
            startTime: Date.now(),
            duration: recipe.craftingTime
        };

        this.crafting.craftingProgress = 0;
        return true;
    }

    updateCrafting() {
        if (!this.crafting.currentCraft) return;

        const elapsed = Date.now() - this.crafting.currentCraft.startTime;
        this.crafting.craftingProgress = Math.min(elapsed / this.crafting.currentCraft.duration, 1);

        if (this.crafting.craftingProgress >= 1) {
            this.completeCrafting();
        }
    }

    completeCrafting() {
        if (!this.crafting.currentCraft) return;

        const recipe = this.crafting.recipes[this.crafting.currentCraft.recipeId];
        
        // Ajouter le résultat à l'inventaire
        this.addItemToInventory({
            ...this.getItemTemplate(recipe.result.id),
            quantity: recipe.result.quantity
        });

        if (this.game.uiManager) {
            this.game.uiManager.showNotification(`${recipe.name} créé avec succès!`, 'success');
        }

        this.crafting.currentCraft = null;
        this.crafting.craftingProgress = 0;
    }

    // === SYSTÈME DE JOURNAL ===
    initializeJournal() {
        this.journal = {
            entries: [
                {
                    id: 1,
                    date: new Date(),
                    title: 'Début de l\'aventure',
                    content: 'Je me réveille dans un monde inconnu. L\'air est frais et je peux entendre les oiseaux chanter au loin. Il est temps d\'explorer ce nouveau monde et de découvrir ses secrets.',
                    type: 'story'
                },
                {
                    id: 2,
                    date: new Date(Date.now() - 3600000),
                    title: 'Première découverte',
                    content: 'J\'ai trouvé un coffre caché derrière un arbre ancien. Il contenait quelques pièces d\'or et un outil de base. Cette découverte me donne espoir pour la suite de mon aventure.',
                    type: 'discovery'
                }
            ],
            discoveries: [
                {
                    id: 'ancient_tree',
                    name: 'Arbre Ancien',
                    description: 'Un arbre millénaire qui semble garder des secrets',
                    location: { x: 150, y: 200 },
                    discovered: true
                },
                {
                    id: 'hidden_cave',
                    name: 'Grotte Cachée',
                    description: 'Une grotte mystérieuse découverte derrière une cascade',
                    location: { x: 300, y: 150 },
                    discovered: false
                }
            ],
            achievements: [
                {
                    id: 'first_steps',
                    name: 'Premiers Pas',
                    description: 'Commencer votre aventure',
                    icon: 'fas fa-baby',
                    unlocked: true,
                    unlockedDate: new Date()
                },
                {
                    id: 'treasure_hunter',
                    name: 'Chasseur de Trésors',
                    description: 'Trouver votre premier coffre au trésor',
                    icon: 'fas fa-treasure-chest',
                    unlocked: true,
                    unlockedDate: new Date(Date.now() - 3600000)
                },
                {
                    id: 'level_up',
                    name: 'Montée en Puissance',
                    description: 'Atteindre le niveau 5',
                    icon: 'fas fa-arrow-up',
                    unlocked: false,
                    progress: 1,
                    target: 5
                }
            ]
        };
    }

    addJournalEntry(title, content, type = 'story') {
        const entry = {
            id: this.journal.entries.length + 1,
            date: new Date(),
            title: title,
            content: content,
            type: type
        };
        
        this.journal.entries.unshift(entry);
        
        if (this.game.uiManager) {
            this.game.uiManager.showNotification('Nouvelle entrée de journal ajoutée', 'info');
        }
        
        return entry;
    }

    unlockAchievement(achievementId) {
        const achievement = this.journal.achievements.find(a => a.id === achievementId);
        if (!achievement || achievement.unlocked) return false;

        achievement.unlocked = true;
        achievement.unlockedDate = new Date();

        if (this.game.uiManager) {
            this.game.uiManager.showNotification(`Succès débloqué: ${achievement.name}!`, 'success', 8000);
        }

        return true;
    }

    // === MÉTHODES UTILITAIRES ===
    getItemQuantityInInventory(itemId) {
        let total = 0;
        this.inventory.slots.forEach(slot => {
            if (slot && slot.id === itemId) {
                total += slot.quantity;
            }
        });
        return total;
    }

    removeItemFromInventoryById(itemId, quantity) {
        let remaining = quantity;
        for (let i = 0; i < this.inventory.slots.length && remaining > 0; i++) {
            const slot = this.inventory.slots[i];
            if (slot && slot.id === itemId) {
                const toRemove = Math.min(slot.quantity, remaining);
                slot.quantity -= toRemove;
                remaining -= toRemove;
                
                if (slot.quantity <= 0) {
                    this.inventory.slots[i] = null;
                }
            }
        }
        this.updateInventoryWeight();
        return remaining === 0;
    }

    getItemTemplate(itemId) {
        // Base de données des objets (à étendre)
        const itemTemplates = {
            iron_sword: {
                id: 'iron_sword',
                name: 'Épée en Fer',
                category: 'weapons',
                weight: 3.5,
                value: 150,
                quality: 'common',
                description: 'Une épée solide forgée en fer.',
                stats: { damage: 25, durability: 100, maxDurability: 100 },
                icon: 'fas fa-sword'
            },
            health_potion: {
                id: 'health_potion',
                name: 'Potion de Soin',
                category: 'consumables',
                weight: 0.5,
                value: 25,
                quality: 'common',
                description: 'Restaure 50 points de vie.',
                effects: { heal: 50 },
                icon: 'fas fa-flask'
            }
        };
        
        return itemTemplates[itemId] || null;
    }

    // Sauvegarde et chargement
    saveData() {
        const saveData = {
            inventory: this.inventory,
            character: this.character,
            quests: this.quests,
            skills: this.skills,
            crafting: this.crafting,
            journal: this.journal,
            timestamp: Date.now()
        };
        
        localStorage.setItem('gameData', JSON.stringify(saveData));
        return true;
    }

    loadData() {
        try {
            const saveData = localStorage.getItem('gameData');
            if (!saveData) return false;

            const data = JSON.parse(saveData);
            
            this.inventory = data.inventory || this.inventory;
            this.character = data.character || this.character;
            this.quests = data.quests || this.quests;
            this.skills = data.skills || this.skills;
            this.crafting = data.crafting || this.crafting;
            this.journal = data.journal || this.journal;
            
            return true;
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            return false;
        }
    }

    // Mise à jour périodique
    update() {
        this.updateCrafting();
        
        // Régénération passive
        if (this.character.derivedStats.health.current < this.character.derivedStats.health.max) {
            this.character.derivedStats.health.current = Math.min(
                this.character.derivedStats.health.current + 0.1,
                this.character.derivedStats.health.max
            );
        }
        
        if (this.character.derivedStats.mana.current < this.character.derivedStats.mana.max) {
            this.character.derivedStats.mana.current = Math.min(
                this.character.derivedStats.mana.current + 0.2,
                this.character.derivedStats.mana.max
            );
        }
        
        if (this.character.derivedStats.stamina.current < this.character.derivedStats.stamina.max) {
            this.character.derivedStats.stamina.current = Math.min(
                this.character.derivedStats.stamina.current + 0.5,
                this.character.derivedStats.stamina.max
            );
        }
    }
}

export { GameData };