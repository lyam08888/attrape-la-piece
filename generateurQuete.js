// generateurQuete.js

// --- BASES DE DONNÉES POUR LA GÉNÉRATION ---

const RESOURCES = {
    basic: [{ id: 'wood', name: 'Bois' }, { id: 'stone', name: 'Pierre' }],
    rare: [{ id: 'coal', name: 'Charbon' }, { id: 'iron', name: 'Fer' }]
};

const MONSTERS = [{ id: 'monster', name: 'Monstre' }];

const TOOLS = [{ id: 'pickaxe', name: 'Pioche' }, { id: 'axe', name: 'Hache' }];

// --- MODÈLES DE QUÊTES PAR ARCHÉTYPE ---

const QUEST_BLUEPRINTS = {
    // Le forgeron demande des minerais et offre des outils/métaux.
    Forgeron: [
        {
            type: 'gather',
            actionText: 'récupérer',
            targets: [...RESOURCES.basic, ...RESOURCES.rare],
            amountRange: [5, 15],
            rewardPool: [...TOOLS, ...RESOURCES.rare]
        },
        {
            type: 'craft',
            actionText: 'fabriquer',
            targets: TOOLS,
            amountRange: [1, 1],
            rewardPool: [...RESOURCES.rare]
        }
    ],
    // Le chasseur demande de chasser des monstres et offre des récompenses liées au combat.
    Chasseur: [
        {
            type: 'hunt',
            actionText: 'éliminer',
            targets: MONSTERS,
            amountRange: [3, 8],
            rewardPool: [{ id: 'sword', name: 'Épée' }, { id: 'bow', name: 'Arc' }]
        }
    ],
    // L'herboriste demande des ressources naturelles.
    Herboriste: [
        {
            type: 'gather',
            actionText: 'cueillir',
            targets: [{ id: 'leaves', name: 'Feuilles' }],
            amountRange: [10, 20],
            rewardPool: [{ id: 'potion', name: 'Potion' }] // Nouvel objet possible
        }
    ]
};

// --- MODÈLES DE DIALOGUES ---

const DIALOGUE_TEMPLATES = {
    greeting: [
        "Bonjour, aventurier.",
        "Quelle journée...",
        "Besoin de quelque chose ?"
    ],
    offer: [
        "J'aurais bien besoin d'un coup de main. Pourriez-vous m'aider à {actionText} {amount} {targetName} ?",
        "Si vous avez un moment, j'ai une tâche pour vous. Il me faudrait {amount} {targetName}.",
        "Le destin vous amène à moi. Aidez-moi à {actionText} {amount} {targetName} et vous serez récompensé."
    ],
    incomplete: [
        "Vous n'avez pas encore terminé ? J'ai toujours besoin de {amount} {targetName}.",
        "Revenez me voir quand vous aurez ce que je vous ai demandé."
    ],
    complete: [
        "Excellent travail ! Voici votre récompense comme promis.",
        "Vous l'avez fait ! Tenez, ceci est pour vous.",
        "Merci infiniment. Prenez ceci pour votre peine."
    ]
};

// --- FONCTION PRINCIPALE DE GÉNÉRATION ---

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function generateQuest(archetype) {
    const blueprints = QUEST_BLUEPRINTS[archetype] || QUEST_BLUEPRINTS['Chasseur'];
    const blueprint = getRandom(blueprints);
    const target = getRandom(blueprint.targets);
    const amount = Math.floor(Math.random() * (blueprint.amountRange[1] - blueprint.amountRange[0] + 1)) + blueprint.amountRange[0];

    const quest = {
        id: `quest_${Date.now()}_${Math.random()}`,
        archetype: archetype,
        type: blueprint.type,
        objective: {
            targetId: target.id,
            targetName: target.name,
            amount: amount,
            currentAmount: 0
        },
        title: `${blueprint.actionText.charAt(0).toUpperCase() + blueprint.actionText.slice(1)} ${amount} ${target.name}`,
        reward: {
            xp: 50 + amount * 10,
            item: getRandom(blueprint.rewardPool)
        },
        dialogues: {}
    };

    // Générer les dialogues
    quest.dialogues.greeting = getRandom(DIALOGUE_TEMPLATES.greeting);
    quest.dialogues.offer = getRandom(DIALOGUE_TEMPLATES.offer)
        .replace('{actionText}', blueprint.actionText)
        .replace('{amount}', amount)
        .replace('{targetName}', target.name);
    quest.dialogues.incomplete = getRandom(DIALOGUE_TEMPLATES.incomplete)
        .replace('{amount}', amount)
        .replace('{targetName}', target.name);
    quest.dialogues.complete = getRandom(DIALOGUE_TEMPLATES.complete);

    return quest;
}
