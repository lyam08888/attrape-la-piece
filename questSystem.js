// questSystem.js - Système de quêtes pour le jeu RPG

export class Quest {
    constructor(id, data) {
        this.id = id;
        this.title = data.title;
        this.description = data.description;
        this.type = data.type; // 'kill', 'collect', 'explore', 'talk'
        this.objectives = data.objectives || [];
        this.rewards = data.rewards || {};
        this.status = 'available'; // 'available', 'active', 'completed', 'failed'
        this.progress = {};
        this.level = data.level || 1;
        this.prerequisites = data.prerequisites || [];
        
        // Initialiser le progrès
        this.objectives.forEach(obj => {
            this.progress[obj.id] = 0;
        });
    }

    // Vérifier si la quête peut être acceptée
    canAccept(player) {
        if (this.status !== 'available') return false;
        if (player.stats.level < this.level) return false;
        
        // Vérifier les prérequis
        return this.prerequisites.every(prereq => {
            if (prereq.type === 'quest') {
                return window.game?.questManager?.isQuestCompleted(prereq.id);
            }
            if (prereq.type === 'level') {
                return player.stats.level >= prereq.value;
            }
            if (prereq.type === 'item') {
                return window.game?.equipmentManager?.inventory.has(prereq.id);
            }
            return true;
        });
    }

    // Accepter la quête
    accept() {
        if (this.status === 'available') {
            this.status = 'active';
            return true;
        }
        return false;
    }

    // Mettre à jour le progrès
    updateProgress(type, target, amount = 1) {
        if (this.status !== 'active') return false;

        let updated = false;
        this.objectives.forEach(obj => {
            if (obj.type === type && obj.target === target) {
                this.progress[obj.id] = Math.min(
                    this.progress[obj.id] + amount,
                    obj.count
                );
                updated = true;
            }
        });

        // Vérifier si la quête est terminée
        if (this.isCompleted()) {
            this.status = 'completed';
        }

        return updated;
    }

    // Vérifier si la quête est terminée
    isCompleted() {
        return this.objectives.every(obj => 
            this.progress[obj.id] >= obj.count
        );
    }

    // Obtenir le progrès en pourcentage
    getProgressPercentage() {
        if (this.objectives.length === 0) return 100;
        
        const totalProgress = this.objectives.reduce((sum, obj) => 
            sum + (this.progress[obj.id] / obj.count), 0
        );
        
        return Math.floor((totalProgress / this.objectives.length) * 100);
    }

    // Obtenir la description du progrès
    getProgressDescription() {
        return this.objectives.map(obj => {
            const current = this.progress[obj.id];
            const total = obj.count;
            return `${obj.description}: ${current}/${total}`;
        }).join('\n');
    }

    // Réclamer les récompenses
    claimRewards(player, game) {
        if (this.status !== 'completed') return false;

        // XP
        if (this.rewards.xp) {
            player.gainXP(this.rewards.xp, game);
        }

        // Objets
        if (this.rewards.items) {
            this.rewards.items.forEach(item => {
                game.equipmentManager?.addToInventory(item.id, item.quantity || 1);
            });
        }

        // Or (si implémenté)
        if (this.rewards.gold) {
            player.gold = (player.gold || 0) + this.rewards.gold;
        }

        return true;
    }
}

export class QuestManager {
    constructor() {
        this.quests = new Map();
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        
        this.initializeQuests();
    }

    initializeQuests() {
        // Quête de démarrage
        this.addQuest('starter_quest', {
            title: 'Première Aventure',
            description: 'Explorez le monde et découvrez vos premières ressources.',
            type: 'tutorial',
            level: 1,
            objectives: [
                {
                    id: 'move',
                    type: 'move',
                    target: 'any',
                    count: 100,
                    description: 'Déplacez-vous de 100 pixels'
                }
            ],
            rewards: {
                xp: 50,
                items: [
                    { id: 'health_potion', quantity: 2 }
                ]
            }
        });

        // Quête de combat
        this.addQuest('first_blood', {
            title: 'Premier Sang',
            description: 'Éliminez vos premiers ennemis pour prouver votre valeur.',
            type: 'kill',
            level: 1,
            objectives: [
                {
                    id: 'kill_goblins',
                    type: 'kill',
                    target: 'goblin',
                    count: 3,
                    description: 'Éliminer 3 gobelins'
                }
            ],
            rewards: {
                xp: 100,
                items: [
                    { id: 'steel_sword', quantity: 1 },
                    { id: 'health_potion', quantity: 3 }
                ]
            },
            prerequisites: [
                { type: 'quest', id: 'starter_quest' }
            ]
        });

        // Quête de collection
        this.addQuest('collector', {
            title: 'Collectionneur',
            description: 'Rassemblez des ressources pour votre équipement.',
            type: 'collect',
            level: 2,
            objectives: [
                {
                    id: 'collect_potions',
                    type: 'collect',
                    target: 'health_potion',
                    count: 5,
                    description: 'Collecter 5 potions de vie'
                }
            ],
            rewards: {
                xp: 75,
                items: [
                    { id: 'mana_potion', quantity: 5 }
                ]
            }
        });

        // Quête de niveau
        this.addQuest('level_up', {
            title: 'Montée en Puissance',
            description: 'Atteignez le niveau 3 pour débloquer de nouvelles capacités.',
            type: 'level',
            level: 1,
            objectives: [
                {
                    id: 'reach_level_3',
                    type: 'level',
                    target: 3,
                    count: 1,
                    description: 'Atteindre le niveau 3'
                }
            ],
            rewards: {
                xp: 150,
                items: [
                    { id: 'chain_mail', quantity: 1 }
                ]
            }
        });

        // Quête de boss
        this.addQuest('dragon_slayer', {
            title: 'Tueur de Dragon',
            description: 'Affrontez le redoutable dragon qui terrorise la région.',
            type: 'boss',
            level: 5,
            objectives: [
                {
                    id: 'kill_dragon',
                    type: 'kill',
                    target: 'dragon',
                    count: 1,
                    description: 'Éliminer le dragon'
                }
            ],
            rewards: {
                xp: 500,
                items: [
                    { id: 'holy_mace', quantity: 1 },
                    { id: 'plate_armor', quantity: 1 }
                ]
            },
            prerequisites: [
                { type: 'level', value: 5 },
                { type: 'quest', id: 'first_blood' }
            ]
        });
    }

    addQuest(id, data) {
        const quest = new Quest(id, data);
        this.quests.set(id, quest);
    }

    getAvailableQuests(player) {
        return Array.from(this.quests.values()).filter(quest => 
            quest.canAccept(player)
        );
    }

    getActiveQuests() {
        return Array.from(this.activeQuests.values());
    }

    getCompletedQuests() {
        return Array.from(this.completedQuests).map(id => this.quests.get(id));
    }

    acceptQuest(questId, player) {
        const quest = this.quests.get(questId);
        if (!quest || !quest.canAccept(player)) return false;

        if (quest.accept()) {
            this.activeQuests.set(questId, quest);
            return true;
        }
        return false;
    }

    updateQuestProgress(type, target, amount = 1) {
        let updated = false;
        
        this.activeQuests.forEach(quest => {
            if (quest.updateProgress(type, target, amount)) {
                updated = true;
                
                if (quest.status === 'completed') {
                    window.game?.modularInterface?.showNotification(
                        `Quête terminée: ${quest.title}`, 
                        'success', 
                        4000
                    );
                }
            }
        });

        return updated;
    }

    completeQuest(questId, player, game) {
        const quest = this.activeQuests.get(questId);
        if (!quest || !quest.isCompleted()) return false;

        // Réclamer les récompenses
        quest.claimRewards(player, game);
        
        // Déplacer vers les quêtes terminées
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);

        // Notification
        game.modularInterface?.showNotification(
            `Quête terminée: ${quest.title}`, 
            'success', 
            4000
        );

        return true;
    }

    isQuestCompleted(questId) {
        return this.completedQuests.has(questId);
    }

    isQuestActive(questId) {
        return this.activeQuests.has(questId);
    }

    getQuest(questId) {
        return this.quests.get(questId);
    }

    // Mettre à jour automatiquement certaines quêtes
    update(player, game, delta) {
        // Quête de mouvement
        if (Math.abs(player.vx) > 0.1) {
            this.updateQuestProgress('move', 'any', Math.abs(player.vx) * delta * 60);
        }

        // Quête de niveau
        this.updateQuestProgress('level', player.stats.level, 0);
        if (this.activeQuests.has('reach_level_3') && player.stats.level >= 3) {
            this.updateQuestProgress('level', 3, 1);
        }

        // Vérifier les quêtes terminées automatiquement
        this.activeQuests.forEach((quest, questId) => {
            if (quest.isCompleted() && quest.status === 'completed') {
                // Auto-compléter certaines quêtes
                if (quest.type === 'tutorial' || quest.type === 'level') {
                    setTimeout(() => {
                        this.completeQuest(questId, player, game);
                    }, 1000);
                }
            }
        });
    }

    // Obtenir les statistiques des quêtes
    getQuestStats() {
        return {
            total: this.quests.size,
            available: this.getAvailableQuests(window.game?.player || {}).length,
            active: this.activeQuests.size,
            completed: this.completedQuests.size
        };
    }
}