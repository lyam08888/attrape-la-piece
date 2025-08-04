// advancedNPCSystem.js - Système de PNJ avancé avec IA et interactions complexes
export class AdvancedNPCSystem {
    constructor(game) {
        this.game = game;
        this.npcs = new Map();
        this.dialogueSystem = new DialogueSystem();
        this.questSystem = new QuestSystem();
        this.relationshipSystem = new RelationshipSystem();
        this.aiSystem = new NPCAISystem();
        
        this.initializeNPCTemplates();
    }

    initializeNPCTemplates() {
        this.npcTemplates = {
            // === PNJ DIVINS ===
            ARCHANGEL_GABRIEL: {
                name: "Gabriel l'Archange",
                title: "Messager Divin",
                biome: "DIVINE_PEAKS",
                appearance: {
                    sprite: "archangel_gabriel",
                    height: 2.5,
                    aura: "divine_golden",
                    wings: "six_golden_wings",
                    eyes: "brilliant_blue"
                },
                personality: {
                    wisdom: 10,
                    compassion: 10,
                    authority: 9,
                    patience: 8,
                    humor: 3
                },
                voice: {
                    tone: "majestic",
                    volume: "resonant",
                    accent: "celestial"
                },
                abilities: [
                    "divine_blessing",
                    "heal_wounds",
                    "purify_corruption",
                    "grant_visions",
                    "summon_light"
                ],
                knowledge: {
                    divine_lore: 10,
                    prophecies: 10,
                    world_history: 9,
                    player_destiny: 8
                },
                relationships: {
                    player_initial: "curious",
                    demons: "hostile",
                    angels: "leader",
                    mortals: "protective"
                },
                schedule: {
                    dawn: "prayer_meditation",
                    morning: "blessing_ceremony",
                    afternoon: "guidance_seekers",
                    evening: "divine_council",
                    night: "celestial_watch"
                },
                dialogue_themes: [
                    "divine_purpose",
                    "moral_guidance",
                    "prophecy_revelation",
                    "blessing_bestowment",
                    "cosmic_balance"
                ],
                quests: [
                    "purify_corrupted_shrine",
                    "retrieve_lost_relic",
                    "guide_lost_soul",
                    "prevent_apocalypse"
                ],
                shop: null, // Les archanges ne commercent pas
                special_interactions: [
                    "divine_trial",
                    "blessing_ceremony",
                    "prophecy_vision",
                    "moral_judgment"
                ]
            },

            CELESTIAL_ORACLE: {
                name: "Séraphine la Voyante",
                title: "Oracle Céleste",
                biome: "CELESTIAL_GARDENS",
                appearance: {
                    sprite: "celestial_oracle",
                    height: 1.8,
                    aura: "shimmering_silver",
                    eyes: "starlight_white",
                    hair: "flowing_ethereal"
                },
                personality: {
                    wisdom: 9,
                    mystery: 10,
                    intuition: 10,
                    serenity: 9,
                    cryptic: 8
                },
                voice: {
                    tone: "ethereal",
                    volume: "whispered",
                    accent: "ancient"
                },
                abilities: [
                    "see_future",
                    "read_souls",
                    "divine_visions",
                    "fate_manipulation",
                    "astral_projection"
                ],
                knowledge: {
                    future_events: 10,
                    soul_reading: 10,
                    cosmic_patterns: 9,
                    hidden_truths: 8
                },
                dialogue_themes: [
                    "cryptic_prophecies",
                    "soul_insights",
                    "destiny_paths",
                    "cosmic_warnings",
                    "hidden_knowledge"
                ],
                special_interactions: [
                    "fortune_telling",
                    "soul_reading",
                    "prophecy_interpretation",
                    "destiny_guidance"
                ]
            },

            // === PNJ NATURELS ===
            ANCIENT_DRUID: {
                name: "Eldrin Racine-Ancienne",
                title: "Gardien de la Forêt Éternelle",
                biome: "ENCHANTED_FOREST",
                appearance: {
                    sprite: "ancient_druid",
                    height: 1.9,
                    aura: "nature_green",
                    beard: "moss_covered",
                    staff: "living_wood",
                    eyes: "forest_green"
                },
                personality: {
                    wisdom: 9,
                    nature_bond: 10,
                    patience: 10,
                    protectiveness: 9,
                    ancient_knowledge: 8
                },
                voice: {
                    tone: "deep_earthy",
                    volume: "calm",
                    accent: "forest_whisper"
                },
                abilities: [
                    "speak_with_trees",
                    "control_nature",
                    "animal_communion",
                    "weather_influence",
                    "plant_growth"
                ],
                knowledge: {
                    nature_lore: 10,
                    ancient_magic: 9,
                    forest_secrets: 10,
                    herbal_wisdom: 9
                },
                dialogue_themes: [
                    "nature_balance",
                    "ancient_wisdom",
                    "forest_protection",
                    "natural_magic",
                    "ecological_harmony"
                ],
                quests: [
                    "heal_corrupted_grove",
                    "find_rare_herbs",
                    "protect_sacred_tree",
                    "restore_forest_balance"
                ],
                shop: {
                    type: "herbal_remedies",
                    items: [
                        "healing_potions",
                        "nature_scrolls",
                        "magical_seeds",
                        "druid_equipment"
                    ]
                }
            },

            CRYSTAL_SAGE: {
                name: "Maître Prisme",
                title: "Gardien des Cristaux",
                biome: "CRYSTAL_CAVERNS",
                appearance: {
                    sprite: "crystal_sage",
                    height: 1.7,
                    aura: "prismatic_rainbow",
                    robes: "crystal_embedded",
                    eyes: "multifaceted"
                },
                personality: {
                    intelligence: 10,
                    precision: 9,
                    curiosity: 8,
                    analytical: 9,
                    perfectionist: 7
                },
                abilities: [
                    "crystal_manipulation",
                    "energy_channeling",
                    "gem_identification",
                    "light_refraction",
                    "resonance_tuning"
                ],
                knowledge: {
                    crystal_lore: 10,
                    energy_patterns: 9,
                    magical_theory: 8,
                    gem_properties: 10
                },
                dialogue_themes: [
                    "crystal_properties",
                    "energy_theory",
                    "magical_research",
                    "precision_crafting",
                    "harmonic_resonance"
                ],
                shop: {
                    type: "crystal_emporium",
                    items: [
                        "magical_crystals",
                        "energy_focuses",
                        "prismatic_gems",
                        "crystal_tools"
                    ]
                }
            },

            // === PNJ INFERNAUX ===
            DEMON_LORD_BAAL: {
                name: "Baal le Destructeur",
                title: "Seigneur des Flammes Éternelles",
                biome: "INFERNAL_DEPTHS",
                appearance: {
                    sprite: "demon_lord_baal",
                    height: 3.0,
                    aura: "hellfire_red",
                    horns: "massive_curved",
                    eyes: "burning_coals",
                    wings: "tattered_leather"
                },
                personality: {
                    cruelty: 10,
                    cunning: 9,
                    pride: 10,
                    wrath: 9,
                    charisma: 7
                },
                voice: {
                    tone: "thunderous",
                    volume: "booming",
                    accent: "infernal"
                },
                abilities: [
                    "hellfire_control",
                    "soul_corruption",
                    "demon_summoning",
                    "fear_inducement",
                    "reality_burning"
                ],
                knowledge: {
                    infernal_lore: 10,
                    soul_magic: 9,
                    corruption_arts: 10,
                    demon_hierarchy: 10
                },
                dialogue_themes: [
                    "power_temptation",
                    "soul_bargains",
                    "infernal_politics",
                    "corruption_offers",
                    "apocalyptic_plans"
                ],
                quests: [
                    "corrupt_holy_shrine",
                    "collect_mortal_souls",
                    "spread_chaos",
                    "summon_greater_demon"
                ],
                shop: {
                    type: "infernal_contracts",
                    currency: "souls",
                    items: [
                        "cursed_weapons",
                        "demonic_armor",
                        "soul_gems",
                        "corruption_scrolls"
                    ]
                },
                special_interactions: [
                    "soul_contract",
                    "power_bargain",
                    "corruption_ritual",
                    "infernal_challenge"
                ]
            },

            SHADOW_MERCHANT: {
                name: "Umbra Sans-Nom",
                title: "Marchand des Ombres",
                biome: "SHADOW_REALM",
                appearance: {
                    sprite: "shadow_merchant",
                    height: 1.8,
                    aura: "shifting_darkness",
                    form: "semi_transparent",
                    eyes: "void_black"
                },
                personality: {
                    mystery: 10,
                    cunning: 9,
                    neutrality: 8,
                    greed: 7,
                    knowledge: 9
                },
                abilities: [
                    "shadow_travel",
                    "void_storage",
                    "soul_appraisal",
                    "darkness_manipulation",
                    "memory_trade"
                ],
                dialogue_themes: [
                    "forbidden_knowledge",
                    "shadow_secrets",
                    "memory_trading",
                    "void_mysteries",
                    "dark_bargains"
                ],
                shop: {
                    type: "shadow_emporium",
                    currency: "memories_souls",
                    items: [
                        "forbidden_artifacts",
                        "shadow_weapons",
                        "void_crystals",
                        "memory_vials"
                    ]
                }
            },

            // === PNJ MORTELS SPÉCIAUX ===
            GOLDEN_MERCHANT: {
                name: "Aureus le Prospère",
                title: "Roi des Marchands",
                biome: "GOLDEN_PLAINS",
                appearance: {
                    sprite: "golden_merchant",
                    height: 1.6,
                    aura: "golden_shimmer",
                    clothes: "silk_and_gold",
                    jewelry: "abundant"
                },
                personality: {
                    charisma: 9,
                    greed: 8,
                    business_acumen: 10,
                    generosity: 6,
                    ambition: 9
                },
                abilities: [
                    "value_assessment",
                    "trade_negotiation",
                    "wealth_magic",
                    "market_prediction",
                    "golden_touch"
                ],
                dialogue_themes: [
                    "trade_opportunities",
                    "market_trends",
                    "wealth_accumulation",
                    "business_ventures",
                    "economic_wisdom"
                ],
                shop: {
                    type: "luxury_emporium",
                    items: [
                        "rare_artifacts",
                        "luxury_goods",
                        "precious_gems",
                        "exotic_items"
                    ]
                }
            },

            SWAMP_WITCH: {
                name: "Morgana Brume-Verte",
                title: "Sorcière des Marécages",
                biome: "MYSTIC_SWAMPS",
                appearance: {
                    sprite: "swamp_witch",
                    height: 1.7,
                    aura: "sickly_green",
                    hair: "moss_tangled",
                    eyes: "glowing_yellow"
                },
                personality: {
                    cunning: 9,
                    malice: 7,
                    wisdom: 8,
                    isolation: 9,
                    bitterness: 6
                },
                abilities: [
                    "potion_brewing",
                    "curse_casting",
                    "swamp_control",
                    "poison_magic",
                    "spirit_summoning"
                ],
                dialogue_themes: [
                    "dark_magic",
                    "potion_recipes",
                    "curse_removal",
                    "swamp_lore",
                    "bitter_wisdom"
                ],
                shop: {
                    type: "witch_apothecary",
                    items: [
                        "dark_potions",
                        "curse_scrolls",
                        "poison_ingredients",
                        "witch_tools"
                    ]
                }
            }
        };
    }

    createNPC(templateId, x, y, customizations = {}) {
        const template = this.npcTemplates[templateId];
        if (!template) {
            console.error(`Template NPC non trouvé: ${templateId}`);
            return null;
        }

        const npc = {
            id: `${templateId}_${Date.now()}`,
            templateId: templateId,
            x: x,
            y: y,
            ...template,
            ...customizations,
            
            // État dynamique
            state: {
                health: 100,
                mood: "neutral",
                energy: 100,
                busy: false,
                currentActivity: null,
                lastInteraction: 0,
                reputation: 0
            },
            
            // Mémoire et relations
            memory: {
                playerInteractions: [],
                recentEvents: [],
                personalHistory: []
            },
            
            relationships: new Map(),
            
            // Inventaire et économie
            inventory: this.generateNPCInventory(template),
            gold: this.generateNPCWealth(template),
            
            // IA et comportement
            ai: {
                currentGoal: null,
                pathfinding: null,
                decisionTree: this.createDecisionTree(template),
                emotionalState: "neutral"
            }
        };

        // Initialiser les relations
        this.relationshipSystem.initializeNPCRelationships(npc);
        
        // Configurer l'IA
        this.aiSystem.initializeNPCAI(npc);
        
        this.npcs.set(npc.id, npc);
        return npc;
    }

    generateNPCInventory(template) {
        const inventory = [];
        
        if (template.shop) {
            template.shop.items.forEach(itemType => {
                const items = this.generateShopItems(itemType, template);
                inventory.push(...items);
            });
        }
        
        // Objets personnels
        const personalItems = this.generatePersonalItems(template);
        inventory.push(...personalItems);
        
        return inventory;
    }

    generateShopItems(itemType, template) {
        const items = [];
        const itemDatabase = {
            healing_potions: [
                { id: "minor_healing", name: "Potion de Soin Mineure", price: 50, quantity: 10 },
                { id: "major_healing", name: "Potion de Soin Majeure", price: 200, quantity: 5 },
                { id: "full_restore", name: "Élixir de Restauration", price: 500, quantity: 2 }
            ],
            magical_crystals: [
                { id: "mana_crystal", name: "Cristal de Mana", price: 100, quantity: 8 },
                { id: "power_crystal", name: "Cristal de Puissance", price: 300, quantity: 4 },
                { id: "prismatic_gem", name: "Gemme Prismatique", price: 1000, quantity: 1 }
            ],
            cursed_weapons: [
                { id: "soul_blade", name: "Lame des Âmes", price: 2000, quantity: 1 },
                { id: "hellfire_sword", name: "Épée de Feu Infernal", price: 1500, quantity: 1 },
                { id: "corruption_dagger", name: "Dague de Corruption", price: 800, quantity: 2 }
            ]
        };
        
        const itemList = itemDatabase[itemType] || [];
        return itemList.map(item => ({
            ...item,
            quality: this.determineItemQuality(template, item),
            enchantments: this.generateItemEnchantments(template, item)
        }));
    }

    generatePersonalItems(template) {
        const items = [];
        
        // Objets basés sur la personnalité et le rôle
        if (template.abilities.includes("divine_blessing")) {
            items.push({
                id: "holy_symbol",
                name: "Symbole Sacré",
                type: "personal",
                description: "Un symbole divin personnel"
            });
        }
        
        if (template.abilities.includes("potion_brewing")) {
            items.push({
                id: "brewing_kit",
                name: "Kit d'Alchimie",
                type: "tool",
                description: "Outils pour préparer des potions"
            });
        }
        
        return items;
    }

    generateNPCWealth(template) {
        const baseWealth = {
            ARCHANGEL_GABRIEL: 0, // Les êtres divins n'ont pas besoin d'or
            GOLDEN_MERCHANT: 10000,
            DEMON_LORD_BAAL: 5000,
            ANCIENT_DRUID: 500,
            CRYSTAL_SAGE: 2000,
            SWAMP_WITCH: 800
        };
        
        return baseWealth[template.name] || 100;
    }

    createDecisionTree(template) {
        return {
            // Arbre de décision basé sur la personnalité
            greetPlayer: () => {
                if (template.personality.compassion > 7) {
                    return "warm_greeting";
                } else if (template.personality.cruelty > 7) {
                    return "threatening_greeting";
                } else {
                    return "neutral_greeting";
                }
            },
            
            respondToRequest: (request) => {
                // Logique de réponse basée sur la personnalité
                return "consider_request";
            },
            
            offerQuest: () => {
                return template.quests && template.quests.length > 0;
            }
        };
    }

    // === SYSTÈME D'INTERACTION ===
    interactWithNPC(npcId, playerId, interactionType = "talk") {
        const npc = this.npcs.get(npcId);
        if (!npc) return null;

        // Mettre à jour la mémoire du NPC
        this.updateNPCMemory(npc, playerId, interactionType);
        
        // Déterminer la réponse basée sur l'état et les relations
        const response = this.generateInteractionResponse(npc, playerId, interactionType);
        
        // Mettre à jour l'état du NPC
        this.updateNPCState(npc, interactionType);
        
        return response;
    }

    generateInteractionResponse(npc, playerId, interactionType) {
        const relationship = this.relationshipSystem.getRelationship(npc.id, playerId);
        const mood = npc.state.mood;
        const personality = npc.personality;
        
        switch (interactionType) {
            case "talk":
                return this.generateDialogue(npc, playerId, relationship);
            case "trade":
                return this.generateTradeResponse(npc, playerId, relationship);
            case "quest":
                return this.generateQuestResponse(npc, playerId, relationship);
            default:
                return this.generateDefaultResponse(npc, playerId);
        }
    }

    generateDialogue(npc, playerId, relationship) {
        const dialogues = this.dialogueSystem.getDialogues(npc, relationship);
        const selectedDialogue = this.selectAppropriateDialogue(dialogues, npc, relationship);
        
        return {
            type: "dialogue",
            npcId: npc.id,
            npcName: npc.name,
            text: selectedDialogue.text,
            options: selectedDialogue.options,
            mood: npc.state.mood,
            voice: npc.voice
        };
    }

    // === SYSTÈME DE DIALOGUE AVANCÉ ===
    selectAppropriateDialogue(dialogues, npc, relationship) {
        // Sélectionner le dialogue le plus approprié
        const scored = dialogues.map(dialogue => ({
            dialogue,
            score: this.scoreDialogue(dialogue, npc, relationship)
        }));
        
        scored.sort((a, b) => b.score - a.score);
        return scored[0].dialogue;
    }

    scoreDialogue(dialogue, npc, relationship) {
        let score = 0;
        
        // Score basé sur la relation
        if (relationship.level > 5 && dialogue.type === "friendly") score += 10;
        if (relationship.level < -5 && dialogue.type === "hostile") score += 10;
        
        // Score basé sur l'humeur
        if (npc.state.mood === "happy" && dialogue.mood === "cheerful") score += 5;
        if (npc.state.mood === "angry" && dialogue.mood === "aggressive") score += 5;
        
        // Score basé sur la personnalité
        if (npc.personality.wisdom > 8 && dialogue.theme === "wisdom") score += 8;
        if (npc.personality.humor > 6 && dialogue.theme === "humor") score += 6;
        
        return score;
    }

    // === SYSTÈME DE QUÊTES DYNAMIQUES ===
    generateQuestResponse(npc, playerId, relationship) {
        const availableQuests = this.questSystem.getAvailableQuests(npc, playerId, relationship);
        
        if (availableQuests.length === 0) {
            return {
                type: "no_quest",
                text: this.getNoQuestDialogue(npc)
            };
        }
        
        const quest = this.selectBestQuest(availableQuests, npc, relationship);
        
        return {
            type: "quest_offer",
            quest: quest,
            text: this.generateQuestOfferText(npc, quest),
            requirements: quest.requirements,
            rewards: quest.rewards
        };
    }

    selectBestQuest(quests, npc, relationship) {
        // Sélectionner la quête la plus appropriée
        return quests.reduce((best, current) => {
            const bestScore = this.scoreQuest(best, npc, relationship);
            const currentScore = this.scoreQuest(current, npc, relationship);
            return currentScore > bestScore ? current : best;
        });
    }

    scoreQuest(quest, npc, relationship) {
        let score = quest.basePriority || 0;
        
        // Ajuster selon la relation
        if (relationship.level >= quest.minRelationship) score += 10;
        
        // Ajuster selon l'urgence
        if (quest.urgent) score += 15;
        
        // Ajuster selon la personnalité du NPC
        if (npc.personality.compassion > 7 && quest.type === "help") score += 8;
        if (npc.personality.greed > 6 && quest.rewards.gold > 1000) score += 6;
        
        return score;
    }

    // === SYSTÈME DE COMMERCE AVANCÉ ===
    generateTradeResponse(npc, playerId, relationship) {
        if (!npc.shop) {
            return {
                type: "no_trade",
                text: "Je ne suis pas marchand, voyageur."
            };
        }
        
        const priceModifier = this.calculatePriceModifier(npc, relationship);
        const availableItems = this.getAvailableShopItems(npc, playerId);
        
        return {
            type: "trade_menu",
            shopName: npc.shop.type,
            items: availableItems.map(item => ({
                ...item,
                price: Math.floor(item.price * priceModifier)
            })),
            priceModifier: priceModifier,
            currency: npc.shop.currency || "gold"
        };
    }

    calculatePriceModifier(npc, relationship) {
        let modifier = 1.0;
        
        // Modification basée sur la relation
        const relationLevel = relationship.level;
        if (relationLevel > 10) modifier *= 0.8; // 20% de réduction
        else if (relationLevel > 5) modifier *= 0.9; // 10% de réduction
        else if (relationLevel < -5) modifier *= 1.2; // 20% d'augmentation
        else if (relationLevel < -10) modifier *= 1.5; // 50% d'augmentation
        
        // Modification basée sur la personnalité
        if (npc.personality.greed > 8) modifier *= 1.1;
        if (npc.personality.generosity > 7) modifier *= 0.95;
        
        // Modification basée sur l'humeur
        if (npc.state.mood === "happy") modifier *= 0.95;
        if (npc.state.mood === "angry") modifier *= 1.1;
        
        return Math.max(0.5, Math.min(2.0, modifier)); // Limiter entre 50% et 200%
    }

    // === SYSTÈME DE MÉMOIRE ET APPRENTISSAGE ===
    updateNPCMemory(npc, playerId, interactionType) {
        const interaction = {
            playerId: playerId,
            type: interactionType,
            timestamp: Date.now(),
            location: { x: npc.x, y: npc.y },
            npcMood: npc.state.mood
        };
        
        npc.memory.playerInteractions.push(interaction);
        
        // Limiter la mémoire pour éviter la surcharge
        if (npc.memory.playerInteractions.length > 100) {
            npc.memory.playerInteractions.shift();
        }
        
        // Analyser les patterns d'interaction
        this.analyzeInteractionPatterns(npc, playerId);
    }

    analyzeInteractionPatterns(npc, playerId) {
        const recentInteractions = npc.memory.playerInteractions
            .filter(i => i.playerId === playerId)
            .slice(-10); // 10 dernières interactions
        
        if (recentInteractions.length >= 3) {
            // Détecter des patterns
            const tradeCount = recentInteractions.filter(i => i.type === "trade").length;
            const questCount = recentInteractions.filter(i => i.type === "quest").length;
            
            // Ajuster la relation basée sur les patterns
            if (tradeCount > questCount) {
                this.relationshipSystem.adjustRelationship(npc.id, playerId, "business_focused", 1);
            } else if (questCount > tradeCount) {
                this.relationshipSystem.adjustRelationship(npc.id, playerId, "quest_focused", 1);
            }
        }
    }

    // === MISE À JOUR ET IA ===
    update(deltaTime) {
        this.npcs.forEach(npc => {
            this.updateNPCAI(npc, deltaTime);
            this.updateNPCState(npc, deltaTime);
            this.updateNPCSchedule(npc);
        });
        
        this.relationshipSystem.update(deltaTime);
        this.questSystem.update(deltaTime);
    }

    updateNPCAI(npc, deltaTime) {
        this.aiSystem.updateNPC(npc, deltaTime);
    }

    updateNPCState(npc, deltaTime) {
        // Régénération d'énergie
        if (npc.state.energy < 100) {
            npc.state.energy = Math.min(100, npc.state.energy + deltaTime * 0.1);
        }
        
        // Évolution de l'humeur
        this.updateNPCMood(npc, deltaTime);
        
        // Vieillissement des souvenirs
        this.ageNPCMemories(npc, deltaTime);
    }

    updateNPCMood(npc, deltaTime) {
        // L'humeur tend vers neutre avec le temps
        const moodDecay = deltaTime * 0.01;
        
        if (npc.state.mood === "happy" && Math.random() < moodDecay) {
            npc.state.mood = "neutral";
        } else if (npc.state.mood === "angry" && Math.random() < moodDecay) {
            npc.state.mood = "neutral";
        }
        
        // Facteurs d'humeur basés sur la personnalité
        if (npc.personality.patience < 5 && npc.state.energy < 30) {
            npc.state.mood = "irritated";
        }
    }

    updateNPCSchedule(npc) {
        const currentHour = new Date().getHours();
        let timeOfDay;
        
        if (currentHour < 6) timeOfDay = "night";
        else if (currentHour < 12) timeOfDay = "morning";
        else if (currentHour < 18) timeOfDay = "afternoon";
        else timeOfDay = "evening";
        
        const scheduledActivity = npc.schedule[timeOfDay];
        if (scheduledActivity !== npc.state.currentActivity) {
            npc.state.currentActivity = scheduledActivity;
            this.onActivityChange(npc, scheduledActivity);
        }
    }

    onActivityChange(npc, newActivity) {
        // Ajuster l'état du NPC selon l'activité
        switch (newActivity) {
            case "prayer_meditation":
                npc.state.mood = "serene";
                break;
            case "blessing_ceremony":
                npc.state.mood = "focused";
                break;
            case "sleep":
                npc.state.energy = Math.min(100, npc.state.energy + 20);
                break;
        }
    }

    // === MÉTHODES UTILITAIRES ===
    getNPC(npcId) {
        return this.npcs.get(npcId);
    }

    getNPCsInArea(x, y, radius) {
        return Array.from(this.npcs.values()).filter(npc => {
            const distance = Math.hypot(npc.x - x, npc.y - y);
            return distance <= radius;
        });
    }

    getNPCsByBiome(biome) {
        return Array.from(this.npcs.values()).filter(npc => npc.biome === biome);
    }

    removeNPC(npcId) {
        const npc = this.npcs.get(npcId);
        if (npc) {
            this.relationshipSystem.removeNPCRelationships(npcId);
            this.npcs.delete(npcId);
            return true;
        }
        return false;
    }

    // === ÉVÉNEMENTS SPÉCIAUX ===
    triggerSpecialInteraction(npcId, interactionType, playerId) {
        const npc = this.npcs.get(npcId);
        if (!npc || !npc.special_interactions.includes(interactionType)) {
            return null;
        }
        
        switch (interactionType) {
            case "divine_trial":
                return this.triggerDivineTrial(npc, playerId);
            case "soul_contract":
                return this.triggerSoulContract(npc, playerId);
            case "fortune_telling":
                return this.triggerFortuneTelling(npc, playerId);
            default:
                return null;
        }
    }

    triggerDivineTrial(npc, playerId) {
        return {
            type: "divine_trial",
            title: "Épreuve Divine",
            description: "L'Archange vous met à l'épreuve pour tester votre valeur.",
            challenges: [
                {
                    type: "moral_choice",
                    description: "Un choix moral difficile vous est présenté."
                },
                {
                    type: "combat_trial",
                    description: "Affrontez les champions célestes."
                },
                {
                    type: "wisdom_test",
                    description: "Répondez aux énigmes divines."
                }
            ],
            rewards: {
                success: ["divine_blessing", "holy_artifact", "celestial_favor"],
                failure: ["divine_disappointment", "temporary_curse"]
            }
        };
    }

    triggerSoulContract(npc, playerId) {
        return {
            type: "soul_contract",
            title: "Contrat Infernal",
            description: "Le Seigneur Démon propose un pacte pour votre âme.",
            offers: [
                {
                    power: "Immense force physique",
                    cost: "50% de votre âme",
                    duration: "permanent"
                },
                {
                    power: "Magie destructrice",
                    cost: "30% de votre âme",
                    duration: "1 an"
                },
                {
                    power: "Immortalité temporaire",
                    cost: "Votre âme entière",
                    duration: "100 ans"
                }
            ],
            warnings: [
                "Les contrats infernaux sont irrévocables",
                "Votre alignement sera affecté",
                "D'autres PNJ réagiront différemment"
            ]
        };
    }

    triggerFortuneTelling(npc, playerId) {
        const predictions = [
            "Je vois un grand danger dans votre futur proche...",
            "Une rencontre importante vous attend dans les terres dorées.",
            "Méfiez-vous de celui qui porte le masque d'argent.",
            "Votre destinée est liée aux cristaux anciens.",
            "Un choix difficile déterminera le sort de nombreuses âmes."
        ];
        
        return {
            type: "fortune_telling",
            title: "Lecture du Destin",
            prediction: predictions[Math.floor(Math.random() * predictions.length)],
            cost: 100,
            accuracy: npc.knowledge.future_events * 10 // Pourcentage de précision
        };
    }
}

// === SYSTÈMES AUXILIAIRES ===

class DialogueSystem {
    constructor() {
        this.dialogueDatabase = new Map();
        this.initializeDialogues();
    }

    initializeDialogues() {
        // Base de données de dialogues par type de NPC
        this.dialogueDatabase.set("ARCHANGEL_GABRIEL", {
            greetings: [
                {
                    text: "Que la lumière divine vous guide, mortel. Votre âme brille d'une lueur particulière.",
                    mood: "serene",
                    type: "friendly",
                    theme: "divine",
                    options: [
                        { text: "Merci pour votre bénédiction", response: "blessing_thanks" },
                        { text: "Que voyez-vous en moi ?", response: "soul_reading" },
                        { text: "J'ai besoin de guidance", response: "seek_guidance" }
                    ]
                }
            ],
            responses: {
                blessing_thanks: "Votre humilité vous honore. Les cieux remarquent ceux qui restent modestes.",
                soul_reading: "Je vois un potentiel immense, mais aussi de grandes épreuves à venir.",
                seek_guidance: "La voie de la lumière n'est jamais facile, mais elle mène à la véritable grandeur."
            }
        });
        
        // Ajouter d'autres dialogues...
    }

    getDialogues(npc, relationship) {
        const npcDialogues = this.dialogueDatabase.get(npc.templateId);
        if (!npcDialogues) return [];
        
        // Filtrer les dialogues appropriés
        return npcDialogues.greetings.filter(dialogue => 
            this.isDialogueAppropriate(dialogue, npc, relationship)
        );
    }

    isDialogueAppropriate(dialogue, npc, relationship) {
        // Vérifier si le dialogue est approprié selon la relation et l'état
        if (dialogue.minRelationship && relationship.level < dialogue.minRelationship) {
            return false;
        }
        
        if (dialogue.requiredMood && npc.state.mood !== dialogue.requiredMood) {
            return false;
        }
        
        return true;
    }
}

class QuestSystem {
    constructor() {
        this.activeQuests = new Map();
        this.questTemplates = new Map();
        this.initializeQuestTemplates();
    }

    initializeQuestTemplates() {
        // Templates de quêtes par NPC
        this.questTemplates.set("ARCHANGEL_GABRIEL", [
            {
                id: "purify_shrine",
                title: "Purification du Sanctuaire Corrompu",
                description: "Un sanctuaire sacré a été souillé par les forces démoniaques.",
                type: "purification",
                objectives: [
                    { type: "travel", target: "corrupted_shrine", description: "Se rendre au sanctuaire" },
                    { type: "combat", target: "shadow_demons", count: 5, description: "Éliminer les démons" },
                    { type: "ritual", target: "purification", description: "Accomplir le rituel de purification" }
                ],
                requirements: {
                    level: 10,
                    alignment: "good",
                    items: ["holy_water"]
                },
                rewards: {
                    experience: 1000,
                    gold: 500,
                    items: ["blessed_weapon"],
                    reputation: { divine: 10 }
                },
                timeLimit: 7200000, // 2 heures
                urgent: true,
                minRelationship: 5
            }
        ]);
    }

    getAvailableQuests(npc, playerId, relationship) {
        const templates = this.questTemplates.get(npc.templateId) || [];
        
        return templates.filter(quest => 
            this.isQuestAvailable(quest, npc, playerId, relationship)
        );
    }

    isQuestAvailable(quest, npc, playerId, relationship) {
        // Vérifier les prérequis
        if (quest.minRelationship && relationship.level < quest.minRelationship) {
            return false;
        }
        
        // Vérifier si la quête n'est pas déjà active
        const questKey = `${npc.id}_${quest.id}`;
        if (this.activeQuests.has(questKey)) {
            return false;
        }
        
        return true;
    }

    update(deltaTime) {
        // Mettre à jour les quêtes actives
        this.activeQuests.forEach((quest, key) => {
            if (quest.timeLimit && Date.now() - quest.startTime > quest.timeLimit) {
                this.expireQuest(key);
            }
        });
    }

    expireQuest(questKey) {
        this.activeQuests.delete(questKey);
        // Notifier le joueur de l'expiration
    }
}

class RelationshipSystem {
    constructor() {
        this.relationships = new Map(); // npcId -> playerId -> relationship
    }

    initializeNPCRelationships(npc) {
        this.relationships.set(npc.id, new Map());
    }

    getRelationship(npcId, playerId) {
        const npcRelationships = this.relationships.get(npcId);
        if (!npcRelationships) return { level: 0, type: "neutral" };
        
        return npcRelationships.get(playerId) || { level: 0, type: "neutral" };
    }

    adjustRelationship(npcId, playerId, reason, amount) {
        const npcRelationships = this.relationships.get(npcId);
        if (!npcRelationships) return;
        
        const current = npcRelationships.get(playerId) || { level: 0, type: "neutral" };
        current.level += amount;
        
        // Déterminer le type de relation
        if (current.level > 20) current.type = "beloved";
        else if (current.level > 10) current.type = "friend";
        else if (current.level > 0) current.type = "friendly";
        else if (current.level < -20) current.type = "enemy";
        else if (current.level < -10) current.type = "hostile";
        else if (current.level < 0) current.type = "unfriendly";
        else current.type = "neutral";
        
        npcRelationships.set(playerId, current);
    }

    removeNPCRelationships(npcId) {
        this.relationships.delete(npcId);
    }

    update(deltaTime) {
        // Les relations peuvent évoluer avec le temps
    }
}

class NPCAISystem {
    initializeNPCAI(npc) {
        npc.ai.behaviorTree = this.createBehaviorTree(npc);
        npc.ai.currentState = "idle";
        npc.ai.stateTimer = 0;
    }

    createBehaviorTree(npc) {
        // Arbre de comportement basé sur la personnalité
        return {
            root: {
                type: "selector",
                children: [
                    { type: "sequence", name: "handle_interaction" },
                    { type: "sequence", name: "follow_schedule" },
                    { type: "action", name: "idle" }
                ]
            }
        };
    }

    updateNPC(npc, deltaTime) {
        npc.ai.stateTimer += deltaTime;
        
        // Exécuter l'arbre de comportement
        this.executeBehaviorTree(npc, npc.ai.behaviorTree.root);
        
        // Mettre à jour l'état émotionnel
        this.updateEmotionalState(npc, deltaTime);
    }

    executeBehaviorTree(npc, node) {
        // Implémentation simplifiée de l'arbre de comportement
        switch (node.type) {
            case "selector":
                return node.children.some(child => this.executeBehaviorTree(npc, child));
            case "sequence":
                return node.children.every(child => this.executeBehaviorTree(npc, child));
            case "action":
                return this.executeAction(npc, node.name);
        }
    }

    executeAction(npc, actionName) {
        switch (actionName) {
            case "idle":
                return this.performIdle(npc);
            case "patrol":
                return this.performPatrol(npc);
            case "interact":
                return this.performInteraction(npc);
        }
    }

    performIdle(npc) {
        // Comportement d'inactivité
        if (npc.ai.stateTimer > 5000) { // 5 secondes
            npc.ai.currentState = "patrol";
            npc.ai.stateTimer = 0;
        }
        return true;
    }

    performPatrol(npc) {
        // Mouvement de patrouille simple
        if (npc.ai.stateTimer > 10000) { // 10 secondes
            npc.ai.currentState = "idle";
            npc.ai.stateTimer = 0;
        }
        return true;
    }

    updateEmotionalState(npc, deltaTime) {
        // L'état émotionnel influence le comportement
        const emotions = ["calm", "excited", "worried", "content"];
        
        if (Math.random() < 0.001) { // Changement rare
            npc.ai.emotionalState = emotions[Math.floor(Math.random() * emotions.length)];
        }
    }

    // === MÉTHODES D'INTÉGRATION AVEC LE JEU PRINCIPAL ===
    
    spawnInitialNPCs(tileMap, config) {
        console.log("👥 Génération des PNJ initiaux...");
        
        const worldHeight = tileMap.length;
        const worldWidth = tileMap[0]?.length || 0;
        
        // Spawner des PNJ selon les biomes
        const npcSpawns = [
            { template: "ARCHANGEL_GABRIEL", biome: "DIVINE_PEAKS", count: 1 },
            { template: "FOREST_DRUID", biome: "ENCHANTED_FOREST", count: 2 },
            { template: "CRYSTAL_SAGE", biome: "CRYSTAL_CAVERNS", count: 1 },
            { template: "DEMON_MERCHANT", biome: "INFERNAL_DEPTHS", count: 1 },
            { template: "SHADOW_ASSASSIN", biome: "ABYSS", count: 1 }
        ];

        npcSpawns.forEach(spawn => {
            for (let i = 0; i < spawn.count; i++) {
                const npc = this.createNPCFromTemplate(spawn.template);
                if (npc) {
                    // Trouver une position appropriée
                    const position = this.findSpawnPosition(tileMap, spawn.biome, worldWidth, worldHeight);
                    if (position) {
                        npc.x = position.x;
                        npc.y = position.y;
                        npc.id = `${spawn.template}_${i}`;
                        
                        // Ajouter le PNJ au système
                        this.npcs.set(npc.id, npc);
                        
                        console.log(`✅ PNJ ${npc.name} spawné en (${npc.x}, ${npc.y})`);
                    }
                }
            }
        });
        
        console.log(`✅ ${this.npcs.size} PNJ générés au total !`);
    }

    createNPCFromTemplate(templateName) {
        const template = this.npcTemplates[templateName];
        if (!template) {
            console.warn(`⚠️ Template PNJ non trouvé: ${templateName}`);
            return null;
        }

        const npc = {
            ...template,
            id: templateName,
            x: 0,
            y: 0,
            health: template.stats?.health || 100,
            mana: template.stats?.mana || 50,
            level: template.stats?.level || 1,
            dialogue: this.generateDialogue(template),
            ai: {
                currentState: "idle",
                stateTimer: 0,
                emotionalState: "calm",
                lastPlayerInteraction: 0
            },
            // Méthodes de base pour la compatibilité
            update: (game, delta) => this.updateNPC(npc, game, delta),
            draw: (ctx) => this.drawNPC(npc, ctx)
        };

        return npc;
    }

    findSpawnPosition(tileMap, biome, worldWidth, worldHeight) {
        // Trouver une position de spawn appropriée selon le biome
        const biomeYRanges = {
            "DIVINE_PEAKS": [0, Math.floor(worldHeight * 0.1)],
            "CELESTIAL_GARDENS": [Math.floor(worldHeight * 0.1), Math.floor(worldHeight * 0.2)],
            "ENCHANTED_FOREST": [Math.floor(worldHeight * 0.2), Math.floor(worldHeight * 0.35)],
            "CRYSTAL_CAVERNS": [Math.floor(worldHeight * 0.35), Math.floor(worldHeight * 0.5)],
            "INFERNAL_DEPTHS": [Math.floor(worldHeight * 0.8), Math.floor(worldHeight * 0.95)],
            "ABYSS": [Math.floor(worldHeight * 0.95), worldHeight]
        };

        const yRange = biomeYRanges[biome] || [0, worldHeight];
        
        // Essayer de trouver une position valide
        for (let attempts = 0; attempts < 50; attempts++) {
            const x = Math.floor(Math.random() * worldWidth);
            const y = Math.floor(Math.random() * (yRange[1] - yRange[0])) + yRange[0];
            
            // Vérifier si la position est valide (pas dans un bloc solide)
            if (y < tileMap.length && x < tileMap[y].length && tileMap[y][x] === 0) {
                return { x: x * 16, y: y * 16 }; // Convertir en pixels
            }
        }
        
        // Position par défaut si aucune position valide trouvée
        return { x: worldWidth * 8, y: yRange[0] * 16 };
    }

    generateDialogue(template) {
        // Générer un dialogue de base selon le template
        const dialogues = {
            "ARCHANGEL_GABRIEL": "Que la lumière divine guide tes pas, voyageur.",
            "FOREST_DRUID": "La nature murmure des secrets anciens...",
            "CRYSTAL_SAGE": "Les cristaux révèlent la vérité à ceux qui savent écouter.",
            "DEMON_MERCHANT": "J'ai des objets... particuliers à vendre.",
            "SHADOW_ASSASSIN": "Les ombres cachent bien des mystères..."
        };
        
        return dialogues[template.name] || "Bonjour, voyageur.";
    }

    updateNPC(npc, game, delta) {
        // Mise à jour de base du PNJ
        if (npc.ai) {
            npc.ai.stateTimer += delta;
            this.aiSystem.update([npc], game, delta);
        }
    }

    drawNPC(npc, ctx) {
        // Rendu de base du PNJ
        ctx.save();
        
        // Couleur selon le type de PNJ
        const colors = {
            "ARCHANGEL_GABRIEL": "#FFD700",
            "FOREST_DRUID": "#32CD32",
            "CRYSTAL_SAGE": "#9370DB",
            "DEMON_MERCHANT": "#FF4500",
            "SHADOW_ASSASSIN": "#2F2F2F"
        };
        
        ctx.fillStyle = colors[npc.name] || "#FFFFFF";
        ctx.fillRect(npc.x, npc.y, 32, 32);
        
        // Nom du PNJ
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(npc.name || "PNJ", npc.x + 16, npc.y - 5);
        
        ctx.restore();
    }
}

export { AdvancedNPCSystem };