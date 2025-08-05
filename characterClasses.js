// characterClasses.js - Système de classes de personnage RPG

export const CHARACTER_CLASSES = {
    WARRIOR: 'warrior',
    MAGE: 'mage',
    ROGUE: 'rogue',
    PALADIN: 'paladin'
};

export class CharacterClass {
    constructor(type) {
        this.type = type;
        this.data = this.getClassData(type);
    }

    getClassData(type) {
        const classes = {
            [CHARACTER_CLASSES.WARRIOR]: {
                name: "Guerrier",
                description: "Maître des armes et de la défense, le guerrier excelle au combat rapproché.",
                icon: "⚔️",
                color: "#D32F2F",
                baseStats: {
                    health: 120,
                    mana: 30,
                    stamina: 100,
                    strength: 15,
                    defense: 12,
                    agility: 8,
                    intelligence: 5,
                    luck: 7
                },
                statGrowth: {
                    health: 8,
                    mana: 2,
                    stamina: 6,
                    strength: 3,
                    defense: 2,
                    agility: 1,
                    intelligence: 1,
                    luck: 1
                },
                skills: [
                    { name: "Charge", level: 1, description: "Attaque puissante qui inflige +50% de dégâts" },
                    { name: "Défense", level: 3, description: "Réduit les dégâts reçus de 30% pendant 10s" },
                    { name: "Rage", level: 5, description: "Augmente l'attaque de 40% mais réduit la défense" },
                    { name: "Coup Critique", level: 8, description: "Chance de coup critique +25%" }
                ],
                equipment: {
                    weapon: ["sword", "axe", "mace", "hammer"],
                    armor: ["heavy_armor", "medium_armor"],
                    accessory: ["strength_ring", "defense_amulet"]
                }
            },
            [CHARACTER_CLASSES.MAGE]: {
                name: "Mage",
                description: "Maître des arts magiques, capable de lancer des sorts dévastateurs.",
                icon: "🔮",
                color: "#3F51B5",
                baseStats: {
                    health: 80,
                    mana: 120,
                    stamina: 60,
                    strength: 6,
                    defense: 5,
                    agility: 7,
                    intelligence: 15,
                    luck: 9
                },
                statGrowth: {
                    health: 4,
                    mana: 8,
                    stamina: 3,
                    strength: 1,
                    defense: 1,
                    agility: 1,
                    intelligence: 3,
                    luck: 2
                },
                skills: [
                    { name: "Boule de Feu", level: 1, description: "Lance une boule de feu qui inflige des dégâts magiques" },
                    { name: "Bouclier Magique", level: 2, description: "Crée un bouclier qui absorbe les dégâts" },
                    { name: "Éclair", level: 4, description: "Attaque électrique qui peut paralyser" },
                    { name: "Téléportation", level: 6, description: "Se téléporte instantanément vers la souris" },
                    { name: "Météore", level: 10, description: "Invoque un météore dévastateur" }
                ],
                equipment: {
                    weapon: ["staff", "wand", "orb"],
                    armor: ["robe", "light_armor"],
                    accessory: ["mana_ring", "intelligence_amulet", "spell_focus"]
                }
            },
            [CHARACTER_CLASSES.ROGUE]: {
                name: "Voleur",
                description: "Agile et furtif, le voleur frappe vite et fort depuis les ombres.",
                icon: "🗡️",
                color: "#388E3C",
                baseStats: {
                    health: 90,
                    mana: 50,
                    stamina: 120,
                    strength: 10,
                    defense: 7,
                    agility: 15,
                    intelligence: 8,
                    luck: 12
                },
                statGrowth: {
                    health: 5,
                    mana: 3,
                    stamina: 7,
                    strength: 2,
                    defense: 1,
                    agility: 3,
                    intelligence: 1,
                    luck: 2
                },
                skills: [
                    { name: "Attaque Sournoise", level: 1, description: "Attaque par derrière pour +100% de dégâts" },
                    { name: "Furtivité", level: 2, description: "Devient invisible pendant 5 secondes" },
                    { name: "Lancer de Dague", level: 3, description: "Lance une dague à distance" },
                    { name: "Esquive", level: 5, description: "Chance d'esquiver +30% pendant 8s" },
                    { name: "Poison", level: 7, description: "Les attaques empoisonnent l'ennemi" }
                ],
                equipment: {
                    weapon: ["dagger", "short_sword", "bow", "crossbow"],
                    armor: ["leather_armor", "light_armor"],
                    accessory: ["agility_ring", "luck_amulet", "stealth_cloak"]
                }
            },
            [CHARACTER_CLASSES.PALADIN]: {
                name: "Paladin",
                description: "Guerrier saint qui combine combat et magie de guérison.",
                icon: "🛡️",
                color: "#FF9800",
                baseStats: {
                    health: 110,
                    mana: 80,
                    stamina: 90,
                    strength: 12,
                    defense: 10,
                    agility: 6,
                    intelligence: 10,
                    luck: 10
                },
                statGrowth: {
                    health: 6,
                    mana: 5,
                    stamina: 5,
                    strength: 2,
                    defense: 2,
                    agility: 1,
                    intelligence: 2,
                    luck: 2
                },
                skills: [
                    { name: "Soin", level: 1, description: "Restaure 50 points de vie" },
                    { name: "Frappe Sacrée", level: 2, description: "Attaque bénie qui inflige des dégâts bonus aux morts-vivants" },
                    { name: "Aura de Protection", level: 4, description: "Augmente la défense de tous les alliés proches" },
                    { name: "Résurrection", level: 8, description: "Revient à la vie avec 50% de vie après la mort" },
                    { name: "Jugement Divin", level: 12, description: "Attaque dévastatrice contre les ennemis maléfiques" }
                ],
                equipment: {
                    weapon: ["sword", "mace", "holy_staff"],
                    armor: ["plate_armor", "holy_armor", "medium_armor"],
                    accessory: ["holy_symbol", "protection_ring", "healing_amulet"]
                }
            }
        };

        return classes[type] || classes[CHARACTER_CLASSES.WARRIOR];
    }

    // Calcule les stats finales en fonction du niveau
    calculateStats(level) {
        const stats = { ...this.data.baseStats };
        const growth = this.data.statGrowth;
        
        for (const stat in growth) {
            stats[stat] += Math.floor(growth[stat] * (level - 1));
        }
        
        return stats;
    }

    // Obtient les compétences disponibles à un niveau donné
    getAvailableSkills(level) {
        return this.data.skills.filter(skill => skill.level <= level);
    }

    // Vérifie si un équipement peut être utilisé par cette classe
    canUseEquipment(equipmentType, equipmentCategory) {
        return this.data.equipment[equipmentCategory]?.includes(equipmentType) || false;
    }
}

// Gestionnaire de sélection de classe
export class CharacterClassManager {
    constructor() {
        this.selectedClass = null;
        this.isSelecting = false;
    }

    // Affiche l'écran de sélection de classe
    showClassSelection() {
        this.isSelecting = true;
        this.createClassSelectionUI();
    }

    createClassSelectionUI() {
        // Supprimer l'UI existante si elle existe
        const existingUI = document.getElementById('classSelectionUI');
        if (existingUI) {
            existingUI.remove();
        }

        const ui = document.createElement('div');
        ui.id = 'classSelectionUI';
        ui.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 3000;
            font-family: 'VT323', monospace;
            color: white;
        `;

        ui.innerHTML = `
            <h1 style="font-size: 3em; margin-bottom: 30px; color: #4CAF50;">Choisissez votre Classe</h1>
            <div id="classGrid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 800px;">
                ${Object.values(CHARACTER_CLASSES).map(classType => {
                    const classData = new CharacterClass(classType).data;
                    return `
                        <div class="class-card" data-class="${classType}" style="
                            background: linear-gradient(135deg, ${classData.color}22, ${classData.color}44);
                            border: 2px solid ${classData.color};
                            border-radius: 10px;
                            padding: 20px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            text-align: center;
                            min-height: 200px;
                        ">
                            <div style="font-size: 4em; margin-bottom: 10px;">${classData.icon}</div>
                            <h2 style="color: ${classData.color}; margin: 10px 0;">${classData.name}</h2>
                            <p style="font-size: 1.2em; margin-bottom: 15px;">${classData.description}</p>
                            <div style="font-size: 1em; text-align: left;">
                                <strong>Stats de base:</strong><br>
                                ❤️ Vie: ${classData.baseStats.health}<br>
                                🔮 Mana: ${classData.baseStats.mana}<br>
                                ⚡ Endurance: ${classData.baseStats.stamina}<br>
                                💪 Force: ${classData.baseStats.strength}<br>
                                🛡️ Défense: ${classData.baseStats.defense}<br>
                                🏃 Agilité: ${classData.baseStats.agility}<br>
                                🧠 Intelligence: ${classData.baseStats.intelligence}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <p style="margin-top: 30px; font-size: 1.5em; color: #aaa;">Cliquez sur une classe pour commencer votre aventure</p>
        `;

        document.body.appendChild(ui);

        // Ajouter les événements de clic
        document.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = `0 0 20px ${card.dataset.class === 'warrior' ? '#D32F2F' : 
                                                   card.dataset.class === 'mage' ? '#3F51B5' :
                                                   card.dataset.class === 'rogue' ? '#388E3C' : '#FF9800'}66`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = 'none';
            });

            card.addEventListener('click', () => {
                this.selectClass(card.dataset.class);
            });
        });
    }

    selectClass(classType) {
        this.selectedClass = new CharacterClass(classType);
        this.isSelecting = false;
        
        // Supprimer l'UI de sélection
        const ui = document.getElementById('classSelectionUI');
        if (ui) {
            ui.remove();
        }

        // Déclencher l'événement de sélection de classe
        window.dispatchEvent(new CustomEvent('classSelected', { 
            detail: { 
                classType: classType,
                classData: this.selectedClass 
            } 
        }));
    }

    getSelectedClass() {
        return this.selectedClass;
    }
}