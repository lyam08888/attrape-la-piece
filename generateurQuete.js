// --- BASES DE DONNÉES POUR LA GÉNÉRATION ---

const RESOURCES = {
    surface: [{ id: 'oak_wood', name: 'Bois de Chêne' }, { id: 'sand', name: 'Sable' }],
    underground: [{ id: 'stone', name: 'Pierre' }, { id: 'coal', name: 'Charbon' }, { id: 'iron', name: 'Fer' }],
    deep_underground: [{ id: 'gold', name: 'Or' }, { id: 'lapis', name: 'Lapis' }, { id: 'diamond', name: 'Diamant' }],
    core: [{ id: 'crystal', name: 'Cristal' }, { id: 'amethyst', name: 'Améthyste' }],
    hell: [{ id: 'hellstone', name: 'Pierre Infernale' }, { id: 'soul_sand', name: 'Sable des Âmes' }],
    paradise: [{ id: 'cloud', name: 'Nuage' }, { id: 'heavenly_stone', name: 'Pierre Céleste' }],
};

const MONSTERS = {
    surface: [{ id: 'monster_surface', name: 'Monstre de la surface' }],
    underground: [{ id: 'monster_underground', name: 'Créature des cavernes' }],
    hell: [{ id: 'monster_hell', name: 'Démon' }],
};

const TOOLS = [{ id: 'stone_pickaxe', name: 'Pioche en Pierre' }, { id: 'iron_axe', name: 'Hache en Fer' }];

// --- MODÈLES DE QUÊTES PAR ARCHÉTYPE ---

const QUEST_BLUEPRINTS = {
    Forgeron: [
        {
            type: 'gather', actionText: 'récupérer',
            targets: [...RESOURCES.underground, ...RESOURCES.deep_underground],
            amountRange: [8, 20],
            rewardPool: [...TOOLS, {id: 'iron', name: 'Lingot de Fer'}]
        },
        {
            type: 'gather', actionText: 'rapporter',
            targets: [...RESOURCES.hell],
            amountRange: [5, 10],
            rewardPool: [{id: 'diamond', name: 'Diamant'}, {id: 'obsidian', name: 'Obsidienne'}]
        }
    ],
    Chasseur: [
        {
            type: 'hunt', actionText: 'éliminer',
            targets: MONSTERS.surface,
            amountRange: [5, 10],
            rewardPool: [{ id: 'sword', name: 'Épée' }, { id: 'bow', name: 'Arc' }]
        },
        {
            type: 'hunt', actionText: 'chasser',
            targets: MONSTERS.underground,
            amountRange: [3, 7],
            rewardPool: [{ id: 'gold', name: 'Pépites d\'Or' }]
        }
    ],
    Herboriste: [
        {
            type: 'gather', actionText: 'cueillir',
            targets: [{ id: 'leaves', name: 'Feuilles' }, { id: 'flower_red', name: 'Fleur Rouge' }],
            amountRange: [10, 20],
            rewardPool: [{ id: 'potion', name: 'Potion de Soin' }]
        },
        {
            type: 'gather', actionText: 'trouver',
            targets: [...RESOURCES.core],
            amountRange: [3, 5],
            rewardPool: [{ id: 'potion_xp', name: 'Potion d\'Expérience' }]
        }
    ]
};

// --- MODÈLES DE DIALOGUES ---

const DIALOGUE_TEMPLATES = {
    greeting: ["Bonjour, aventurier.", "Quelle journée...", "Besoin de quelque chose ?"],
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
        status: 'available', // available, active, complete
        dialogues: {}
    };

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
