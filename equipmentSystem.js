// equipmentSystem.js - Système d'équipement RPG complet

export const EQUIPMENT_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    ACCESSORY: 'accessory',
    CONSUMABLE: 'consumable'
};

export const EQUIPMENT_SLOTS = {
    MAIN_HAND: 'mainHand',
    OFF_HAND: 'offHand',
    HEAD: 'head',
    CHEST: 'chest',
    LEGS: 'legs',
    FEET: 'feet',
    RING1: 'ring1',
    RING2: 'ring2',
    NECKLACE: 'necklace'
};

export const RARITY = {
    COMMON: { name: 'Commun', color: '#FFFFFF', multiplier: 1.0 },
    UNCOMMON: { name: 'Peu Commun', color: '#4CAF50', multiplier: 1.2 },
    RARE: { name: 'Rare', color: '#2196F3', multiplier: 1.5 },
    EPIC: { name: 'Épique', color: '#9C27B0', multiplier: 2.0 },
    LEGENDARY: { name: 'Légendaire', color: '#FF9800', multiplier: 3.0 },
    MYTHIC: { name: 'Mythique', color: '#F44336', multiplier: 5.0 }
};

export class Equipment {
    constructor(id, data) {
        this.id = id;
        this.name = data.name;
        this.type = data.type;
        this.slot = data.slot;
        this.rarity = data.rarity || 'COMMON';
        this.level = data.level || 1;
        this.stats = data.stats || {};
        this.requirements = data.requirements || {};
        this.description = data.description || '';
        this.icon = data.icon || '📦';
        this.enchantments = data.enchantments || [];
        this.durability = data.durability || 100;
        this.maxDurability = data.maxDurability || 100;
        this.value = data.value || 10;
    }

    // Calcule les stats finales avec les bonus de rareté et enchantements
    getFinalStats() {
        const finalStats = { ...this.stats };
        const rarityMultiplier = RARITY[this.rarity]?.multiplier || 1;

        // Appliquer le multiplicateur de rareté
        for (const stat in finalStats) {
            finalStats[stat] = Math.floor(finalStats[stat] * rarityMultiplier);
        }

        // Appliquer les enchantements
        this.enchantments.forEach(enchant => {
            if (enchant.stats) {
                for (const stat in enchant.stats) {
                    finalStats[stat] = (finalStats[stat] || 0) + enchant.stats[stat];
                }
            }
        });

        return finalStats;
    }

    // Vérifie si l'équipement peut être utilisé par le joueur
    canBeUsedBy(player) {
        if (this.requirements.level && player.stats.level < this.requirements.level) {
            return false;
        }
        if (this.requirements.class && !this.requirements.class.includes(player.characterClass?.type)) {
            return false;
        }
        if (this.requirements.stats) {
            for (const stat in this.requirements.stats) {
                if (player.stats[stat] < this.requirements.stats[stat]) {
                    return false;
                }
            }
        }
        return true;
    }

    // Obtient la couleur de rareté
    getRarityColor() {
        return RARITY[this.rarity]?.color || '#FFFFFF';
    }

    // Obtient le nom avec la rareté
    getDisplayName() {
        const rarityName = RARITY[this.rarity]?.name || 'Commun';
        return `${this.name} (${rarityName})`;
    }
}

// Base de données d'équipements
export const EQUIPMENT_DATABASE = {
    // ARMES
    'iron_sword': {
        name: 'Épée de Fer',
        type: EQUIPMENT_TYPES.WEAPON,
        slot: EQUIPMENT_SLOTS.MAIN_HAND,
        stats: { strength: 8, attack: 15 },
        requirements: { level: 1 },
        description: 'Une épée basique mais fiable.',
        icon: '⚔️',
        value: 50
    },
    'steel_sword': {
        name: 'Épée d\'Acier',
        type: EQUIPMENT_TYPES.WEAPON,
        slot: EQUIPMENT_SLOTS.MAIN_HAND,
        stats: { strength: 12, attack: 22 },
        requirements: { level: 5 },
        description: 'Une épée d\'acier trempé, plus tranchante.',
        icon: '⚔️',
        value: 150
    },
    'magic_staff': {
        name: 'Bâton Magique',
        type: EQUIPMENT_TYPES.WEAPON,
        slot: EQUIPMENT_SLOTS.MAIN_HAND,
        stats: { intelligence: 10, magicAttack: 18, mana: 20 },
        requirements: { level: 3, class: ['mage', 'paladin'] },
        description: 'Un bâton imprégné de magie ancienne.',
        icon: '🪄',
        value: 120
    },
    'assassin_dagger': {
        name: 'Dague d\'Assassin',
        type: EQUIPMENT_TYPES.WEAPON,
        slot: EQUIPMENT_SLOTS.MAIN_HAND,
        stats: { agility: 8, attack: 12, criticalChance: 15 },
        requirements: { level: 4, class: ['rogue'] },
        description: 'Une dague légère et mortelle.',
        icon: '🗡️',
        value: 100
    },
    'holy_mace': {
        name: 'Masse Sacrée',
        type: EQUIPMENT_TYPES.WEAPON,
        slot: EQUIPMENT_SLOTS.MAIN_HAND,
        stats: { strength: 10, intelligence: 6, holyDamage: 20 },
        requirements: { level: 6, class: ['paladin'] },
        description: 'Une masse bénie par les dieux.',
        icon: '🔨',
        value: 200
    },

    // ARMURES
    'leather_armor': {
        name: 'Armure de Cuir',
        type: EQUIPMENT_TYPES.ARMOR,
        slot: EQUIPMENT_SLOTS.CHEST,
        stats: { defense: 5, agility: 2 },
        requirements: { level: 1 },
        description: 'Une armure légère en cuir tanné.',
        icon: '🦺',
        value: 40
    },
    'chain_mail': {
        name: 'Cotte de Mailles',
        type: EQUIPMENT_TYPES.ARMOR,
        slot: EQUIPMENT_SLOTS.CHEST,
        stats: { defense: 12, strength: 3 },
        requirements: { level: 4 },
        description: 'Une armure de mailles métalliques.',
        icon: '🦺',
        value: 100
    },
    'plate_armor': {
        name: 'Armure de Plaques',
        type: EQUIPMENT_TYPES.ARMOR,
        slot: EQUIPMENT_SLOTS.CHEST,
        stats: { defense: 20, strength: 5, agility: -2 },
        requirements: { level: 8, class: ['warrior', 'paladin'] },
        description: 'Une armure lourde en plaques d\'acier.',
        icon: '🦺',
        value: 300
    },
    'mage_robe': {
        name: 'Robe de Mage',
        type: EQUIPMENT_TYPES.ARMOR,
        slot: EQUIPMENT_SLOTS.CHEST,
        stats: { intelligence: 8, mana: 30, magicResistance: 10 },
        requirements: { level: 3, class: ['mage'] },
        description: 'Une robe tissée avec des fils magiques.',
        icon: '👘',
        value: 80
    },

    // ACCESSOIRES
    'strength_ring': {
        name: 'Anneau de Force',
        type: EQUIPMENT_TYPES.ACCESSORY,
        slot: EQUIPMENT_SLOTS.RING1,
        stats: { strength: 5 },
        requirements: { level: 2 },
        description: 'Un anneau qui augmente la force physique.',
        icon: '💍',
        value: 60
    },
    'mana_ring': {
        name: 'Anneau de Mana',
        type: EQUIPMENT_TYPES.ACCESSORY,
        slot: EQUIPMENT_SLOTS.RING1,
        stats: { mana: 25, intelligence: 3 },
        requirements: { level: 3 },
        description: 'Un anneau qui augmente les réserves de mana.',
        icon: '💍',
        value: 80
    },
    'agility_boots': {
        name: 'Bottes d\'Agilité',
        type: EQUIPMENT_TYPES.ARMOR,
        slot: EQUIPMENT_SLOTS.FEET,
        stats: { agility: 8, speed: 2 },
        requirements: { level: 5 },
        description: 'Des bottes qui augmentent la vitesse de déplacement.',
        icon: '👢',
        value: 120
    },

    // CONSOMMABLES
    'health_potion': {
        name: 'Potion de Vie',
        type: EQUIPMENT_TYPES.CONSUMABLE,
        stats: { healAmount: 50 },
        description: 'Restaure 50 points de vie.',
        icon: '🧪',
        value: 25,
        stackable: true,
        maxStack: 10
    },
    'mana_potion': {
        name: 'Potion de Mana',
        type: EQUIPMENT_TYPES.CONSUMABLE,
        stats: { manaAmount: 40 },
        description: 'Restaure 40 points de mana.',
        icon: '🧪',
        value: 20,
        stackable: true,
        maxStack: 10
    },
    'stamina_potion': {
        name: 'Potion d\'Endurance',
        type: EQUIPMENT_TYPES.CONSUMABLE,
        stats: { staminaAmount: 60 },
        description: 'Restaure 60 points d\'endurance.',
        icon: '🧪',
        value: 15,
        stackable: true,
        maxStack: 10
    }
};

export class EquipmentManager {
    constructor(player) {
        this.player = player;
        this.equippedItems = {};
        this.inventory = new Map();
        
        // Initialiser les slots d'équipement
        Object.values(EQUIPMENT_SLOTS).forEach(slot => {
            this.equippedItems[slot] = null;
        });
    }

    // Équipe un objet
    equipItem(itemId, slot = null) {
        const equipment = this.createEquipment(itemId);
        if (!equipment) return false;

        // Vérifier si le joueur peut utiliser cet équipement
        if (!equipment.canBeUsedBy(this.player)) {
            return { success: false, message: "Vous ne remplissez pas les conditions requises." };
        }

        const targetSlot = slot || equipment.slot;
        
        // Déséquiper l'objet actuel si il y en a un
        if (this.equippedItems[targetSlot]) {
            this.unequipItem(targetSlot);
        }

        // Équiper le nouvel objet
        this.equippedItems[targetSlot] = equipment;
        this.removeFromInventory(itemId, 1);
        this.updatePlayerStats();

        return { success: true, message: `${equipment.name} équipé avec succès.` };
    }

    // Déséquipe un objet
    unequipItem(slot) {
        const equipment = this.equippedItems[slot];
        if (!equipment) return false;

        this.equippedItems[slot] = null;
        this.addToInventory(equipment.id, 1);
        this.updatePlayerStats();

        return { success: true, message: `${equipment.name} déséquipé.` };
    }

    // Met à jour les stats du joueur en fonction de l'équipement
    updatePlayerStats() {
        // Réinitialiser les bonus d'équipement
        this.player.equipmentBonuses = {
            health: 0, mana: 0, stamina: 0,
            strength: 0, defense: 0, agility: 0, intelligence: 0,
            attack: 0, magicAttack: 0, criticalChance: 0,
            speed: 0, magicResistance: 0, holyDamage: 0
        };

        // Calculer les bonus de tous les objets équipés
        Object.values(this.equippedItems).forEach(equipment => {
            if (equipment) {
                const stats = equipment.getFinalStats();
                for (const stat in stats) {
                    if (this.player.equipmentBonuses.hasOwnProperty(stat)) {
                        this.player.equipmentBonuses[stat] += stats[stat];
                    }
                }
            }
        });

        // Appliquer les bonus aux stats du joueur
        this.applyEquipmentBonuses();
    }

    applyEquipmentBonuses() {
        const bonuses = this.player.equipmentBonuses;
        
        // Augmenter les stats maximales
        this.player.maxHealth = this.player.baseMaxHealth + bonuses.health;
        this.player.maxMana = this.player.baseMaxMana + bonuses.mana;
        this.player.maxStamina = this.player.baseMaxStamina + bonuses.stamina;

        // Appliquer les bonus aux stats de combat
        this.player.totalAttack = (this.player.stats.strength || 0) + bonuses.attack + bonuses.strength;
        this.player.totalDefense = (this.player.stats.defense || 0) + bonuses.defense;
        this.player.totalSpeed = this.player.speed + bonuses.speed + (bonuses.agility * 0.1);
    }

    // Ajoute un objet à l'inventaire
    addToInventory(itemId, quantity = 1) {
        const equipment = this.createEquipment(itemId);
        if (!equipment) return false;

        if (equipment.stackable) {
            const currentAmount = this.inventory.get(itemId) || 0;
            const maxStack = equipment.maxStack || 1;
            const newAmount = Math.min(currentAmount + quantity, maxStack);
            this.inventory.set(itemId, newAmount);
        } else {
            // Pour les objets non empilables, créer des entrées séparées
            for (let i = 0; i < quantity; i++) {
                const uniqueId = `${itemId}_${Date.now()}_${Math.random()}`;
                this.inventory.set(uniqueId, 1);
            }
        }

        // Mettre à jour les quêtes de collection
        window.game?.questManager?.updateQuestProgress('collect', itemId, quantity);

        return true;
    }

    // Retire un objet de l'inventaire
    removeFromInventory(itemId, quantity = 1) {
        if (!this.inventory.has(itemId)) return false;

        const currentAmount = this.inventory.get(itemId);
        if (currentAmount <= quantity) {
            this.inventory.delete(itemId);
        } else {
            this.inventory.set(itemId, currentAmount - quantity);
        }

        return true;
    }

    // Utilise un consommable
    useConsumable(itemId) {
        const equipment = this.createEquipment(itemId);
        if (!equipment || equipment.type !== EQUIPMENT_TYPES.CONSUMABLE) {
            return { success: false, message: "Cet objet ne peut pas être utilisé." };
        }

        if (!this.inventory.has(itemId)) {
            return { success: false, message: "Vous n'avez pas cet objet." };
        }

        const stats = equipment.getFinalStats();
        
        // Appliquer les effets du consommable
        if (stats.healAmount) {
            this.player.health = Math.min(this.player.health + stats.healAmount, this.player.maxHealth);
        }
        if (stats.manaAmount) {
            this.player.mana = Math.min(this.player.mana + stats.manaAmount, this.player.maxMana);
        }
        if (stats.staminaAmount) {
            this.player.stamina = Math.min(this.player.stamina + stats.staminaAmount, this.player.maxStamina);
        }

        // Retirer l'objet de l'inventaire
        this.removeFromInventory(itemId, 1);

        return { success: true, message: `${equipment.name} utilisé avec succès.` };
    }

    // Crée un objet équipement à partir de son ID
    createEquipment(itemId, rarity = 'COMMON') {
        const data = EQUIPMENT_DATABASE[itemId];
        if (!data) return null;

        return new Equipment(itemId, { ...data, rarity });
    }

    // Génère un objet aléatoire avec une rareté aléatoire
    generateRandomEquipment(level = 1) {
        const itemIds = Object.keys(EQUIPMENT_DATABASE);
        const randomId = itemIds[Math.floor(Math.random() * itemIds.length)];
        
        // Calculer la rareté basée sur le niveau
        const rarityChances = {
            'COMMON': 60,
            'UNCOMMON': 25,
            'RARE': 10,
            'EPIC': 4,
            'LEGENDARY': 1,
            'MYTHIC': 0.1
        };

        let rarity = 'COMMON';
        const roll = Math.random() * 100;
        let cumulative = 0;

        for (const [rarityType, chance] of Object.entries(rarityChances)) {
            cumulative += chance;
            if (roll <= cumulative) {
                rarity = rarityType;
                break;
            }
        }

        return this.createEquipment(randomId, rarity);
    }

    // Obtient tous les objets équipés
    getEquippedItems() {
        return this.equippedItems;
    }

    // Obtient l'inventaire
    getInventory() {
        return this.inventory;
    }

    // Calcule la valeur totale de l'équipement
    getTotalEquipmentValue() {
        let total = 0;
        Object.values(this.equippedItems).forEach(equipment => {
            if (equipment) {
                total += equipment.value * RARITY[equipment.rarity].multiplier;
            }
        });
        return Math.floor(total);
    }
}