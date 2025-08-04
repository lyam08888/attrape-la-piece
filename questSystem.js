// questSystem.js - Système de quêtes complet

import { getStoryQuests } from './storyQuests.js';

export class Quest {
    constructor(id, title, description, objectives, rewards, prerequisites = [], category = 'side') {
        this.id = id;
        this.title = title;
        this.description = description;
        this.objectives = objectives; // Array d'objectifs
        this.rewards = rewards;
        this.prerequisites = prerequisites;
        this.category = category;
        this.status = 'available'; // available, active, completed, failed
        this.progress = {};
        this.startTime = null;
        this.completionTime = null;
    }

    start() {
        this.status = 'active';
        this.startTime = Date.now();
        this.objectives.forEach(obj => {
            this.progress[obj.id] = { current: 0, target: obj.target, completed: false };
        });
    }

    updateProgress(objectiveId, amount = 1) {
        if (this.status !== 'active') return false;
        
        const progress = this.progress[objectiveId];
        if (!progress || progress.completed) return false;

        progress.current = Math.min(progress.current + amount, progress.target);
        progress.completed = progress.current >= progress.target;

        // Vérifier si toutes les objectives sont complétées
        const allCompleted = this.objectives.every(obj => this.progress[obj.id].completed);
        if (allCompleted) {
            this.complete();
        }

        return true;
    }

    complete() {
        this.status = 'completed';
        this.completionTime = Date.now();
    }

    fail() {
        this.status = 'failed';
    }

    getProgressText() {
        return this.objectives.map(obj => {
            const progress = this.progress[obj.id];
            const current = progress ? progress.current : 0;
            return `${obj.description}: ${current}/${obj.target}`;
        }).join('\n');
    }
}

export class QuestSystem {
    constructor() {
        this.quests = new Map();
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.questProgress = new Map();
        this.questLog = [];
        this.initializeQuests();
    }

    initializeQuests() {
        // Quêtes de démarrage
        this.addQuest(new Quest(
            'first_steps',
            'Premiers Pas',
            'Apprenez les bases de la survie dans ce monde.',
            [
                { id: 'mine_blocks', description: 'Miner des blocs', target: 10 },
                { id: 'collect_wood', description: 'Collecter du bois', target: 5 }
            ],
            { xp: 50, items: [{ name: 'tool_pickaxe', quantity: 1 }] }
        ));

        this.addQuest(new Quest(
            'explorer',
            'Explorateur',
            'Explorez le monde et découvrez de nouveaux biomes.',
            [
                { id: 'visit_biomes', description: 'Visiter différents biomes', target: 3 },
                { id: 'walk_distance', description: 'Marcher 1000 blocs', target: 1000 }
            ],
            { xp: 100, items: [{ name: 'compass', quantity: 1 }] },
            ['first_steps']
        ));

        this.addQuest(new Quest(
            'monster_hunter',
            'Chasseur de Monstres',
            'Éliminez les créatures hostiles qui menacent la paix.',
            [
                { id: 'kill_enemies', description: 'Éliminer des ennemis', target: 20 }
            ],
            { xp: 150, items: [{ name: 'tool_sword', quantity: 1 }] }
        ));

        this.addQuest(new Quest(
            'master_crafter',
            'Maître Artisan',
            'Maîtrisez l\'art de la fabrication d\'objets.',
            [
                { id: 'craft_items', description: 'Fabriquer des objets', target: 50 },
                { id: 'craft_tools', description: 'Fabriquer des outils', target: 10 }
            ],
            { xp: 200, items: [{ name: 'crafting_table', quantity: 1 }] },
            ['first_steps']
        ));

        this.addQuest(new Quest(
            'deep_miner',
            'Mineur des Profondeurs',
            'Descendez dans les profondeurs et trouvez des minerais rares.',
            [
                { id: 'mine_deep', description: 'Atteindre la profondeur 500', target: 1 },
                { id: 'find_rare_ores', description: 'Trouver des minerais rares', target: 5 }
            ],
            { xp: 300, items: [{ name: 'diamond_pickaxe', quantity: 1 }] },
            ['explorer']
        ));

        // Nouvelles quêtes innovantes
        this.addQuest(new Quest(
            'treasure_hunter',
            'Chasseur de Trésors',
            'Trouvez et ouvrez des coffres cachés dans le monde.',
            [
                { id: 'open_chests', description: 'Ouvrir 3 coffres', target: 3 }
            ],
            { xp: 150, items: [{ name: 'gold', quantity: 5 }] },
            ['first_steps']
        ));
        
        this.addQuest(new Quest(
            'animal_observer',
            'Observateur de la Faune',
            'Observez différents types d\'animaux dans leurs habitats naturels.',
            [
                { id: 'observe_animals', description: 'Observer 5 animaux différents', target: 5 }
            ],
            { xp: 100, items: [{ name: 'wood', quantity: 10 }] },
            ['treasure_hunter']
        ));
        
        this.addQuest(new Quest(
            'disaster_survivor',
            'Survivant des Catastrophes',
            'Survivez à une catastrophe naturelle.',
            [
                { id: 'survive_disaster', description: 'Survivre à 1 catastrophe', target: 1 }
            ],
            { xp: 200, items: [{ name: 'diamond', quantity: 2 }] },
            ['animal_observer']
        ));
        
        this.addQuest(new Quest(
            'time_keeper',
            'Gardien du Temps',
            'Passez une journée complète dans le monde.',
            [
                { id: 'survive_day', description: 'Survivre 24h de jeu', target: 1 }
            ],
            { xp: 300, items: [{ name: 'crystal', quantity: 3 }] },
            ['disaster_survivor']
        ));
        
        this.addQuest(new Quest(
            'survival_expert',
            'Expert en Survie',
            'Collectez des objets de survie rares.',
            [
                { id: 'collect_survival_items', description: 'Collecter 3 objets de survie', target: 3 }
            ],
            { xp: 250, items: [{ name: 'gold', quantity: 10 }] },
            ['time_keeper']
        ));

        // Ajout des 150 quêtes principales générées
        getStoryQuests().forEach(data => {
            this.addQuest(new Quest(
                data.id,
                data.title,
                data.description,
                data.objectives,
                data.rewards,
                data.prerequisites,
                data.category
            ));
        });
    }

    addQuest(quest) {
        this.quests.set(quest.id, quest);
    }

    getAvailableQuests() {
        return Array.from(this.quests.values()).filter(quest => {
            if (quest.status !== 'available') return false;
            
            // Vérifier les prérequis
            return quest.prerequisites.every(prereqId => 
                this.completedQuests.has(prereqId)
            );
        });
    }

    startQuest(questId) {
        const quest = this.quests.get(questId);
        if (!quest || quest.status !== 'available') return false;

        // Vérifier les prérequis
        const canStart = quest.prerequisites.every(prereqId => 
            this.completedQuests.has(prereqId)
        );

        if (!canStart) return false;

        quest.start();
        this.activeQuests.set(questId, quest);
        this.questLog.push(`Quête commencée: ${quest.title}`);
        return true;
    }

    abandonQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        this.activeQuests.delete(questId);
        quest.status = 'available';
        quest.progress = {};
        quest.startTime = null;
        quest.completionTime = null;
        this.questLog.push(`Quête abandonnée: ${quest.title}`);
        return true;
    }

    updateQuestProgress(objectiveType, data = {}) {
        this.activeQuests.forEach(quest => {
            quest.objectives.forEach(objective => {
                if (objective.id === objectiveType) {
                    const updated = quest.updateProgress(objective.id, data.amount || 1);
                    if (updated && quest.status === 'completed') {
                        this.completeQuest(quest.id);
                    }
                }
            });
        });
    }

    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;

        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        this.questLog.push(`Quête terminée: ${quest.title}`);

        // Donner les récompenses
        if (quest.rewards.xp) {
            // Le système XP sera géré par le player
            document.dispatchEvent(new CustomEvent('quest-reward', {
                detail: { type: 'xp', amount: quest.rewards.xp }
            }));
        }

        if (quest.rewards.items) {
            quest.rewards.items.forEach(item => {
                document.dispatchEvent(new CustomEvent('quest-reward', {
                    detail: { type: 'item', name: item.name, quantity: item.quantity }
                }));
            });
        }

        return true;
    }

    getActiveQuests() {
        return Array.from(this.activeQuests.values());
    }

    getCompletedQuests() {
        return Array.from(this.quests.values()).filter(quest => 
            this.completedQuests.has(quest.id)
        );
    }

    getQuestLog() {
        return this.questLog.slice(-10); // Derniers 10 messages
    }

    // Méthodes pour sauvegarder/charger l'état des quêtes
    saveState() {
        return {
            activeQuests: Array.from(this.activeQuests.keys()),
            completedQuests: Array.from(this.completedQuests),
            questProgress: Object.fromEntries(
                Array.from(this.activeQuests.entries()).map(([id, quest]) => [
                    id, quest.progress
                ])
            ),
            questLog: this.questLog
        };
    }

    loadState(state) {
        if (!state) return;

        this.completedQuests = new Set(state.completedQuests || []);
        this.questLog = state.questLog || [];

        // Restaurer les quêtes actives
        if (state.activeQuests) {
            state.activeQuests.forEach(questId => {
                const quest = this.quests.get(questId);
                if (quest) {
                    quest.start();
                    if (state.questProgress[questId]) {
                        quest.progress = state.questProgress[questId];
                    }
                    this.activeQuests.set(questId, quest);
                }
            });
        }
    }

    update(game, delta = 0) {
        // Méthode de mise à jour simple pour éviter les erreurs lorsque
        // le moteur tente d'appeler questSystem.update().
        // Les quêtes actuelles n'ont pas de comportement dépendant du temps,
        // mais cette méthode permettra d'en ajouter facilement plus tard.
    }

    draw(ctx, game) {
        // Affiche une superposition basique des quêtes actives et de leur progression.
        const activeQuests = this.getActiveQuests();
        if (activeQuests.length === 0) return;

        ctx.save();
        ctx.font = '12px Arial';
        const padding = 8;
        const lineHeight = 14;
        let width = 0;
        const lines = activeQuests.map(q => {
            const line = `${q.title}: ${q.getProgressText()}`;
            width = Math.max(width, ctx.measureText(line).width);
            return line;
        });

        const boxWidth = width + padding * 2;
        const boxHeight = lineHeight * lines.length + padding * 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, boxWidth, boxHeight);
        ctx.fillStyle = '#fff';
        let y = 10 + padding + lineHeight - 2;
        lines.forEach(line => {
            ctx.fillText(line, 10 + padding, y);
            y += lineHeight;
        });
        ctx.restore();
    }
}

// Fonction utilitaire pour mettre à jour l'interface des quêtes
export function updateQuestUI(questSystem) {
    const questList = document.getElementById('questList');
    if (!questList) return;

    questList.innerHTML = '';

    const formatRewards = (rewards = {}) => {
        const parts = [];
        if (rewards.xp) parts.push(`${rewards.xp} XP`);
        if (rewards.items) {
            rewards.items.forEach(item => parts.push(`${item.quantity}x ${item.name}`));
        }
        return parts.join(', ');
    };

    const createQuestItem = (quest, type) => {
        const item = document.createElement('div');
        item.className = 'quest-item';

        const header = document.createElement('div');
        header.className = 'quest-header';
        header.textContent = quest.title;
        item.appendChild(header);

        const details = document.createElement('div');
        details.className = 'quest-details';
        details.innerHTML = `<div class="quest-description">${quest.description}</div>`;
        item.appendChild(details);

        header.addEventListener('click', () => {
            item.classList.toggle('open');
        });

        if (type === 'active') {
            quest.objectives.forEach(obj => {
                const progress = quest.progress[obj.id];
                const percent = progress.target ? (progress.current / progress.target) * 100 : 0;
                const objDiv = document.createElement('div');
                objDiv.className = 'quest-objective';
                objDiv.innerHTML = `
                    <span>${obj.description} (${progress.current}/${progress.target})</span>
                    <div class="quest-progress-bar"><span style="width:${percent}%"></span></div>
                `;
                details.appendChild(objDiv);
            });
            const rewards = document.createElement('div');
            rewards.className = 'quest-rewards';
            rewards.textContent = `Récompenses: ${formatRewards(quest.rewards)}`;
            details.appendChild(rewards);

            const actions = document.createElement('div');
            actions.className = 'quest-actions';
            const abandonBtn = document.createElement('button');
            abandonBtn.textContent = 'Abandonner';
            abandonBtn.addEventListener('click', e => {
                e.stopPropagation();
                questSystem.abandonQuest(quest.id);
                updateQuestUI(questSystem);
            });
            actions.appendChild(abandonBtn);
            details.appendChild(actions);
        } else if (type === 'available') {
            const rewards = document.createElement('div');
            rewards.className = 'quest-rewards';
            rewards.textContent = `Récompenses: ${formatRewards(quest.rewards)}`;
            details.appendChild(rewards);

            const actions = document.createElement('div');
            actions.className = 'quest-actions';
            const startBtn = document.createElement('button');
            startBtn.textContent = 'Commencer';
            startBtn.addEventListener('click', e => {
                e.stopPropagation();
                if (questSystem.startQuest(quest.id)) {
                    updateQuestUI(questSystem);
                }
            });
            actions.appendChild(startBtn);
            details.appendChild(actions);
        } else if (type === 'completed') {
            const rewards = document.createElement('div');
            rewards.className = 'quest-rewards';
            rewards.textContent = `Récompenses: ${formatRewards(quest.rewards)}`;
            details.appendChild(rewards);

            const done = document.createElement('div');
            done.className = 'quest-progress';
            done.textContent = '✓ Terminée';
            details.appendChild(done);
        }

        return item;
    };

    const groupAndAppend = (quests, type) => {
        const main = quests.filter(q => q.category === 'main');
        const side = quests.filter(q => q.category !== 'main');

        if (main.length > 0) {
            const h = document.createElement('h4');
            h.textContent = 'HISTOIRE PRINCIPALE';
            questList.appendChild(h);
            main.forEach(q => questList.appendChild(createQuestItem(q, type)));
        }
        if (side.length > 0) {
            const h = document.createElement('h4');
            h.textContent = 'QUÊTES SECONDAIRES';
            questList.appendChild(h);
            side.forEach(q => questList.appendChild(createQuestItem(q, type)));
        }
    };

    const activeQuests = questSystem.getActiveQuests();
    if (activeQuests.length > 0) {
        const activeHeader = document.createElement('h3');
        activeHeader.textContent = `QUÊTES ACTIVES (${activeQuests.length})`;
        activeHeader.style.color = '#f9a825';
        questList.appendChild(activeHeader);
        groupAndAppend(activeQuests, 'active');
    }

    const availableQuests = questSystem.getAvailableQuests();
    if (availableQuests.length > 0) {
        const availableHeader = document.createElement('h3');
        availableHeader.textContent = `QUÊTES DISPONIBLES (${availableQuests.length})`;
        availableHeader.style.color = '#27ae60';
        questList.appendChild(availableHeader);
        groupAndAppend(availableQuests, 'available');
    }

    const completedQuests = questSystem.getCompletedQuests();
    if (completedQuests.length > 0) {
        const completedHeader = document.createElement('h3');
        completedHeader.textContent = `QUÊTES TERMINÉES (${completedQuests.length})`;
        completedHeader.style.color = '#95a5a6';
        questList.appendChild(completedHeader);
        groupAndAppend(completedQuests.slice(-5), 'completed');
    }

    if (activeQuests.length === 0 && availableQuests.length === 0 && completedQuests.length === 0) {
        questList.innerHTML = '<div style="text-align: center; color: #666;">Aucune quête disponible</div>';
    }
}

// Ajouter les méthodes de sérialisation à QuestSystem
QuestSystem.prototype.serialize = function() {
    // S'assurer que questProgress existe
    if (!this.questProgress) {
        this.questProgress = new Map();
    }
    
    return {
        activeQuests: Array.from(this.activeQuests?.entries() || []),
        completedQuests: Array.from(this.completedQuests || []),
        questProgress: this.questProgress.size > 0 ? Object.fromEntries(this.questProgress) : {}
    };
};

QuestSystem.prototype.deserialize = function(data) {
    this.activeQuests = new Map(data.activeQuests || []);
    this.completedQuests = new Set(data.completedQuests || []);
    this.questProgress = new Map(Object.entries(data.questProgress || {}));
};