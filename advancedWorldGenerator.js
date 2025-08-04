// advancedWorldGenerator.js - Générateur de monde avancé du Paradis à l'Enfer
export class AdvancedWorldGenerator {
    constructor() {
        this.biomes = this.initializeBiomes();
        this.structures = this.initializeStructures();
        this.creatures = this.initializeCreatures();
        this.vegetation = this.initializeVegetation();
        this.weather = this.initializeWeather();
    }

    // === DÉFINITION DES BIOMES ===
    initializeBiomes() {
        return {
            // === ROYAUME CÉLESTE (Y: 0-200) ===
            DIVINE_PEAKS: {
                name: "Pics Divins",
                yRange: [0, 50],
                temperature: 0.3,
                humidity: 0.4,
                holiness: 1.0,
                colors: {
                    sky: "#FFE4B5",
                    ground: "#F0F8FF",
                    accent: "#FFD700"
                },
                blocks: {
                    surface: "DIVINE_STONE",
                    subsurface: "BLESSED_EARTH",
                    rare: "CELESTIAL_CRYSTAL"
                },
                features: ["floating_islands", "divine_temples", "angel_statues", "golden_trees"],
                creatures: ["angels", "divine_birds", "light_spirits"],
                weather: ["divine_light", "golden_rain", "aurora"]
            },

            CELESTIAL_GARDENS: {
                name: "Jardins Célestes",
                yRange: [50, 100],
                temperature: 0.7,
                humidity: 0.8,
                holiness: 0.9,
                colors: {
                    sky: "#E6E6FA",
                    ground: "#98FB98",
                    accent: "#FFB6C1"
                },
                blocks: {
                    surface: "BLESSED_GRASS",
                    subsurface: "FERTILE_SOIL",
                    rare: "LIFE_CRYSTAL"
                },
                features: ["eternal_flowers", "crystal_streams", "harmony_groves", "healing_springs"],
                creatures: ["unicorns", "fairy_butterflies", "singing_birds", "gentle_deer"],
                weather: ["soft_breeze", "flower_petals", "rainbow_mist"]
            },

            CLOUD_REALM: {
                name: "Royaume des Nuages",
                yRange: [100, 150],
                temperature: 0.5,
                humidity: 0.9,
                holiness: 0.8,
                colors: {
                    sky: "#B0E0E6",
                    ground: "#F5F5F5",
                    accent: "#87CEEB"
                },
                blocks: {
                    surface: "CLOUD_STONE",
                    subsurface: "WIND_CRYSTAL",
                    rare: "SKY_GEM"
                },
                features: ["cloud_bridges", "wind_temples", "sky_gardens", "floating_platforms"],
                creatures: ["wind_spirits", "cloud_dragons", "sky_whales", "storm_eagles"],
                weather: ["gentle_winds", "cloud_formations", "sky_lightning"]
            },

            // === MONDE MORTEL (Y: 150-400) ===
            ENCHANTED_FOREST: {
                name: "Forêt Enchantée",
                yRange: [150, 200],
                temperature: 0.6,
                humidity: 0.8,
                holiness: 0.6,
                colors: {
                    sky: "#228B22",
                    ground: "#8FBC8F",
                    accent: "#32CD32"
                },
                blocks: {
                    surface: "MOSS_STONE",
                    subsurface: "RICH_EARTH",
                    rare: "NATURE_CRYSTAL"
                },
                features: ["ancient_trees", "mushroom_circles", "fairy_rings", "hidden_groves"],
                creatures: ["forest_spirits", "wise_owls", "magical_foxes", "tree_guardians"],
                weather: ["morning_mist", "leaf_fall", "nature_sounds"]
            },

            CRYSTAL_CAVERNS: {
                name: "Cavernes de Cristal",
                yRange: [200, 250],
                temperature: 0.4,
                humidity: 0.3,
                holiness: 0.5,
                colors: {
                    sky: "#4B0082",
                    ground: "#9370DB",
                    accent: "#8A2BE2"
                },
                blocks: {
                    surface: "CRYSTAL_STONE",
                    subsurface: "AMETHYST",
                    rare: "PRISMATIC_CRYSTAL"
                },
                features: ["crystal_formations", "underground_lakes", "gem_veins", "echo_chambers"],
                creatures: ["crystal_spiders", "gem_golems", "cave_spirits", "luminous_bats"],
                weather: ["crystal_resonance", "mineral_dust", "underground_winds"]
            },

            GOLDEN_PLAINS: {
                name: "Plaines Dorées",
                yRange: [250, 300],
                temperature: 0.7,
                humidity: 0.4,
                holiness: 0.4,
                colors: {
                    sky: "#FFD700",
                    ground: "#F0E68C",
                    accent: "#DAA520"
                },
                blocks: {
                    surface: "GOLDEN_GRASS",
                    subsurface: "FERTILE_LOAM",
                    rare: "GOLD_ORE"
                },
                features: ["wheat_fields", "windmills", "stone_circles", "ancient_roads"],
                creatures: ["golden_horses", "harvest_spirits", "field_mice", "grain_birds"],
                weather: ["golden_sunlight", "warm_breeze", "harvest_dust"]
            },

            MYSTIC_SWAMPS: {
                name: "Marécages Mystiques",
                yRange: [300, 350],
                temperature: 0.8,
                humidity: 0.9,
                holiness: 0.3,
                colors: {
                    sky: "#556B2F",
                    ground: "#6B8E23",
                    accent: "#9ACD32"
                },
                blocks: {
                    surface: "SWAMP_MUD",
                    subsurface: "PEAT",
                    rare: "WITCH_STONE"
                },
                features: ["twisted_trees", "bubbling_pools", "will_o_wisps", "ancient_totems"],
                creatures: ["swamp_witches", "bog_monsters", "fireflies", "crocodile_spirits"],
                weather: ["thick_fog", "swamp_gas", "mysterious_lights"]
            },

            DESERT_RUINS: {
                name: "Ruines du Désert",
                yRange: [350, 400],
                temperature: 0.9,
                humidity: 0.1,
                holiness: 0.2,
                colors: {
                    sky: "#F4A460",
                    ground: "#DEB887",
                    accent: "#CD853F"
                },
                blocks: {
                    surface: "SAND",
                    subsurface: "SANDSTONE",
                    rare: "DESERT_GLASS"
                },
                features: ["ancient_pyramids", "buried_temples", "oasis", "sand_dunes"],
                creatures: ["desert_spirits", "sand_worms", "scorpion_guards", "mirage_djinns"],
                weather: ["sandstorms", "heat_waves", "desert_winds"]
            },

            // === ROYAUME INFERNAL (Y: 400-600) ===
            VOLCANIC_LANDS: {
                name: "Terres Volcaniques",
                yRange: [400, 450],
                temperature: 1.0,
                humidity: 0.2,
                holiness: 0.1,
                colors: {
                    sky: "#8B0000",
                    ground: "#A0522D",
                    accent: "#FF4500"
                },
                blocks: {
                    surface: "VOLCANIC_ROCK",
                    subsurface: "OBSIDIAN",
                    rare: "FIRE_CRYSTAL"
                },
                features: ["lava_flows", "volcanic_vents", "ash_storms", "fire_geysers"],
                creatures: ["fire_elementals", "lava_salamanders", "ash_phoenixes", "magma_golems"],
                weather: ["ash_rain", "lava_eruptions", "heat_distortion"]
            },

            SHADOW_REALM: {
                name: "Royaume des Ombres",
                yRange: [450, 500],
                temperature: 0.2,
                humidity: 0.8,
                holiness: 0.0,
                colors: {
                    sky: "#2F2F2F",
                    ground: "#1C1C1C",
                    accent: "#8B008B"
                },
                blocks: {
                    surface: "SHADOW_STONE",
                    subsurface: "VOID_ROCK",
                    rare: "DARK_CRYSTAL"
                },
                features: ["shadow_portals", "twisted_spires", "dark_altars", "nightmare_pools"],
                creatures: ["shadow_demons", "void_wraiths", "nightmare_beasts", "dark_spirits"],
                weather: ["eternal_darkness", "shadow_mist", "whispers"]
            },

            INFERNAL_DEPTHS: {
                name: "Profondeurs Infernales",
                yRange: [500, 550],
                temperature: 1.0,
                humidity: 0.0,
                holiness: -0.5,
                colors: {
                    sky: "#800000",
                    ground: "#8B0000",
                    accent: "#FF0000"
                },
                blocks: {
                    surface: "HELLSTONE",
                    subsurface: "BRIMSTONE",
                    rare: "SOUL_CRYSTAL"
                },
                features: ["torture_chambers", "demon_fortresses", "rivers_of_fire", "bone_bridges"],
                creatures: ["greater_demons", "hell_hounds", "fire_imps", "tormented_souls"],
                weather: ["hellfire", "sulfur_storms", "screaming_winds"]
            },

            ABYSS: {
                name: "L'Abysse",
                yRange: [550, 600],
                temperature: 0.0,
                humidity: 0.0,
                holiness: -1.0,
                colors: {
                    sky: "#000000",
                    ground: "#0D0D0D",
                    accent: "#4B0000"
                },
                blocks: {
                    surface: "VOID_STONE",
                    subsurface: "CHAOS_ROCK",
                    rare: "PRIMORDIAL_CRYSTAL"
                },
                features: ["chaos_rifts", "void_temples", "reality_tears", "ancient_evils"],
                creatures: ["primordial_horrors", "chaos_lords", "void_devourers", "ancient_evils"],
                weather: ["reality_distortion", "chaos_storms", "void_whispers"]
            }
        };
    }

    // === STRUCTURES AVANCÉES ===
    initializeStructures() {
        return {
            // Structures divines
            DIVINE_TEMPLE: {
                size: { w: 15, h: 20 },
                rarity: 0.1,
                biomes: ["DIVINE_PEAKS", "CELESTIAL_GARDENS"],
                blocks: ["DIVINE_STONE", "GOLD_BLOCK", "CRYSTAL_WINDOW"],
                npcs: ["high_priest", "temple_guardian", "divine_oracle"],
                loot: ["divine_artifacts", "blessed_weapons", "holy_scrolls"]
            },

            FLOATING_ISLAND: {
                size: { w: 25, h: 15 },
                rarity: 0.3,
                biomes: ["CLOUD_REALM", "DIVINE_PEAKS"],
                blocks: ["CLOUD_STONE", "SKY_CRYSTAL", "WIND_RUNE"],
                npcs: ["sky_merchant", "wind_sage", "cloud_shepherd"],
                loot: ["sky_gems", "wind_crystals", "levitation_potions"]
            },

            // Structures naturelles
            ANCIENT_TREE: {
                size: { w: 7, h: 25 },
                rarity: 0.4,
                biomes: ["ENCHANTED_FOREST", "CELESTIAL_GARDENS"],
                blocks: ["ANCIENT_WOOD", "LIVING_BARK", "MAGIC_LEAVES"],
                npcs: ["tree_spirit", "forest_druid", "nature_guardian"],
                loot: ["nature_essence", "healing_herbs", "magic_seeds"]
            },

            CRYSTAL_FORMATION: {
                size: { w: 10, h: 12 },
                rarity: 0.5,
                biomes: ["CRYSTAL_CAVERNS", "MYSTIC_SWAMPS"],
                blocks: ["CRYSTAL_CLUSTER", "PRISMATIC_STONE", "ENERGY_CORE"],
                npcs: ["crystal_miner", "gem_cutter", "energy_scholar"],
                loot: ["rare_crystals", "energy_shards", "prismatic_gems"]
            },

            // Structures infernales
            DEMON_FORTRESS: {
                size: { w: 30, h: 25 },
                rarity: 0.2,
                biomes: ["INFERNAL_DEPTHS", "SHADOW_REALM"],
                blocks: ["HELLSTONE", "DEMON_BRICK", "SOUL_FLAME"],
                npcs: ["demon_lord", "hell_guard", "tortured_soul"],
                loot: ["demonic_weapons", "soul_gems", "infernal_armor"]
            },

            CHAOS_RIFT: {
                size: { w: 8, h: 15 },
                rarity: 0.1,
                biomes: ["ABYSS", "SHADOW_REALM"],
                blocks: ["VOID_STONE", "CHAOS_CRYSTAL", "REALITY_TEAR"],
                npcs: ["void_cultist", "chaos_herald", "reality_weaver"],
                loot: ["chaos_artifacts", "void_essence", "reality_shards"]
            }
        };
    }

    // === CRÉATURES AVANCÉES ===
    initializeCreatures() {
        return {
            // === CRÉATURES DIVINES ===
            SERAPH: {
                name: "Séraphin",
                biomes: ["DIVINE_PEAKS"],
                rarity: 0.05,
                health: 500,
                damage: 80,
                speed: 3.0,
                abilities: ["divine_heal", "light_beam", "holy_shield"],
                drops: ["angel_feather", "divine_essence", "holy_crystal"],
                behavior: "peaceful_guardian",
                sprite: "seraph_golden"
            },

            UNICORN: {
                name: "Licorne",
                biomes: ["CELESTIAL_GARDENS", "ENCHANTED_FOREST"],
                rarity: 0.1,
                health: 200,
                damage: 40,
                speed: 2.5,
                abilities: ["healing_touch", "purify", "rainbow_dash"],
                drops: ["unicorn_horn", "pure_mane", "healing_tears"],
                behavior: "shy_healer",
                sprite: "unicorn_white"
            },

            PHOENIX: {
                name: "Phénix",
                biomes: ["VOLCANIC_LANDS", "DIVINE_PEAKS"],
                rarity: 0.08,
                health: 300,
                damage: 60,
                speed: 4.0,
                abilities: ["rebirth", "fire_storm", "healing_flame"],
                drops: ["phoenix_feather", "eternal_flame", "rebirth_ash"],
                behavior: "majestic_flyer",
                sprite: "phoenix_fire"
            },

            // === CRÉATURES NATURELLES ===
            FOREST_GUARDIAN: {
                name: "Gardien de la Forêt",
                biomes: ["ENCHANTED_FOREST"],
                rarity: 0.2,
                health: 400,
                damage: 70,
                speed: 1.5,
                abilities: ["root_bind", "nature_heal", "tree_summon"],
                drops: ["guardian_bark", "nature_crystal", "ancient_seed"],
                behavior: "territorial_protector",
                sprite: "tree_guardian"
            },

            CRYSTAL_SPIDER: {
                name: "Araignée de Cristal",
                biomes: ["CRYSTAL_CAVERNS"],
                rarity: 0.4,
                health: 80,
                damage: 25,
                speed: 2.0,
                abilities: ["crystal_web", "prism_beam", "gem_spit"],
                drops: ["crystal_silk", "gem_shard", "spider_crystal"],
                behavior: "ambush_predator",
                sprite: "crystal_spider"
            },

            GOLDEN_STAG: {
                name: "Cerf Doré",
                biomes: ["GOLDEN_PLAINS"],
                rarity: 0.15,
                health: 150,
                damage: 30,
                speed: 3.5,
                abilities: ["golden_charge", "blessing_aura", "swift_escape"],
                drops: ["golden_antler", "blessed_hide", "prosperity_gem"],
                behavior: "noble_wanderer",
                sprite: "golden_stag"
            },

            // === CRÉATURES MYSTIQUES ===
            SWAMP_WITCH: {
                name: "Sorcière des Marais",
                biomes: ["MYSTIC_SWAMPS"],
                rarity: 0.1,
                health: 250,
                damage: 50,
                speed: 1.8,
                abilities: ["poison_cloud", "curse_hex", "swamp_summon"],
                drops: ["witch_brew", "cursed_herb", "swamp_crystal"],
                behavior: "cunning_caster",
                sprite: "swamp_witch"
            },

            DESERT_DJINN: {
                name: "Djinn du Désert",
                biomes: ["DESERT_RUINS"],
                rarity: 0.12,
                health: 300,
                damage: 65,
                speed: 2.8,
                abilities: ["sandstorm", "mirage", "wish_grant"],
                drops: ["djinn_lamp", "desert_gem", "wish_crystal"],
                behavior: "mysterious_trickster",
                sprite: "desert_djinn"
            },

            // === CRÉATURES INFERNALES ===
            FIRE_DEMON: {
                name: "Démon de Feu",
                biomes: ["VOLCANIC_LANDS", "INFERNAL_DEPTHS"],
                rarity: 0.3,
                health: 350,
                damage: 90,
                speed: 2.2,
                abilities: ["hellfire", "lava_burst", "flame_whip"],
                drops: ["demon_horn", "hellfire_crystal", "molten_core"],
                behavior: "aggressive_hunter",
                sprite: "fire_demon"
            },

            SHADOW_WRAITH: {
                name: "Spectre d'Ombre",
                biomes: ["SHADOW_REALM"],
                rarity: 0.25,
                health: 200,
                damage: 75,
                speed: 3.5,
                abilities: ["shadow_step", "life_drain", "fear_aura"],
                drops: ["shadow_essence", "wraith_cloth", "fear_crystal"],
                behavior: "ethereal_stalker",
                sprite: "shadow_wraith"
            },

            CHAOS_BEAST: {
                name: "Bête du Chaos",
                biomes: ["ABYSS"],
                rarity: 0.08,
                health: 800,
                damage: 120,
                speed: 2.0,
                abilities: ["reality_tear", "chaos_storm", "void_devour"],
                drops: ["chaos_core", "void_crystal", "primordial_essence"],
                behavior: "chaotic_destroyer",
                sprite: "chaos_beast"
            }
        };
    }

    // === VÉGÉTATION AVANCÉE ===
    initializeVegetation() {
        return {
            // Végétation divine
            GOLDEN_TREE: {
                name: "Arbre Doré",
                biomes: ["DIVINE_PEAKS", "CELESTIAL_GARDENS"],
                rarity: 0.3,
                size: { w: 5, h: 12 },
                growth_stages: 4,
                products: ["golden_fruit", "blessed_wood", "divine_sap"],
                effects: ["healing_aura", "blessing_boost"],
                sprite: "golden_tree"
            },

            CRYSTAL_FLOWER: {
                name: "Fleur de Cristal",
                biomes: ["CRYSTAL_CAVERNS", "CELESTIAL_GARDENS"],
                rarity: 0.5,
                size: { w: 1, h: 2 },
                growth_stages: 3,
                products: ["crystal_petal", "energy_nectar"],
                effects: ["mana_regeneration"],
                sprite: "crystal_flower"
            },

            // Végétation naturelle
            ANCIENT_OAK: {
                name: "Chêne Ancien",
                biomes: ["ENCHANTED_FOREST"],
                rarity: 0.2,
                size: { w: 8, h: 20 },
                growth_stages: 5,
                products: ["ancient_acorn", "wise_bark", "druid_wood"],
                effects: ["wisdom_boost", "nature_harmony"],
                sprite: "ancient_oak"
            },

            MUSHROOM_CIRCLE: {
                name: "Cercle de Champignons",
                biomes: ["ENCHANTED_FOREST", "MYSTIC_SWAMPS"],
                rarity: 0.4,
                size: { w: 6, h: 1 },
                growth_stages: 2,
                products: ["magic_mushroom", "fairy_dust"],
                effects: ["teleportation", "size_change"],
                sprite: "mushroom_circle"
            },

            // Végétation infernale
            HELLFIRE_CACTUS: {
                name: "Cactus Infernal",
                biomes: ["VOLCANIC_LANDS", "DESERT_RUINS"],
                rarity: 0.6,
                size: { w: 2, h: 4 },
                growth_stages: 3,
                products: ["fire_spine", "hell_fruit"],
                effects: ["fire_resistance", "heat_generation"],
                sprite: "hellfire_cactus"
            },

            VOID_VINE: {
                name: "Vigne du Vide",
                biomes: ["SHADOW_REALM", "ABYSS"],
                rarity: 0.3,
                size: { w: 3, h: 8 },
                growth_stages: 4,
                products: ["void_berry", "shadow_fiber"],
                effects: ["invisibility", "shadow_step"],
                sprite: "void_vine"
            }
        };
    }

    // === SYSTÈME MÉTÉOROLOGIQUE ===
    initializeWeather() {
        return {
            DIVINE_AURORA: {
                name: "Aurore Divine",
                biomes: ["DIVINE_PEAKS", "CLOUD_REALM"],
                duration: 300,
                effects: ["healing_boost", "mana_regeneration", "blessing_aura"],
                visual: "golden_lights",
                rarity: 0.1
            },

            CRYSTAL_RAIN: {
                name: "Pluie de Cristaux",
                biomes: ["CRYSTAL_CAVERNS", "CELESTIAL_GARDENS"],
                duration: 180,
                effects: ["crystal_growth", "energy_boost"],
                visual: "falling_crystals",
                rarity: 0.2
            },

            NATURE_BLOOM: {
                name: "Floraison Naturelle",
                biomes: ["ENCHANTED_FOREST", "GOLDEN_PLAINS"],
                duration: 240,
                effects: ["plant_growth", "healing_herbs", "animal_happiness"],
                visual: "flower_particles",
                rarity: 0.3
            },

            HELLSTORM: {
                name: "Tempête Infernale",
                biomes: ["VOLCANIC_LANDS", "INFERNAL_DEPTHS"],
                duration: 200,
                effects: ["fire_damage", "lava_rain", "demon_spawn"],
                visual: "fire_storm",
                rarity: 0.25
            },

            VOID_ECLIPSE: {
                name: "Éclipse du Vide",
                biomes: ["SHADOW_REALM", "ABYSS"],
                duration: 360,
                effects: ["darkness", "shadow_boost", "reality_distortion"],
                visual: "dark_eclipse",
                rarity: 0.05
            }
        };
    }

    // === GÉNÉRATION PRINCIPALE ===
    generateAdvancedWorld(width, height, config) {
        console.log("🌍 Génération du monde avancé du Paradis à l'Enfer...");
        
        const world = {
            tiles: new Array(height).fill(null).map(() => new Array(width).fill(0)),
            biomeMap: new Array(height).fill(null).map(() => new Array(width).fill(null)),
            structures: [],
            creatures: [],
            vegetation: [],
            weather: [],
            npcs: [],
            treasures: []
        };

        // Génération par couches verticales
        this.generateBiomeLayers(world, width, height);
        this.generateTerrain(world, width, height);
        this.generateStructures(world, width, height);
        this.generateVegetation(world, width, height);
        this.generateCreatures(world, width, height);
        this.generateNPCs(world, width, height);
        this.generateTreasures(world, width, height);
        this.generateWeatherSystems(world, width, height);

        console.log("✅ Monde avancé généré avec succès!");
        return world;
    }

    generateBiomeLayers(world, width, height) {
        console.log("🏔️ Génération des couches de biomes...");
        
        for (let y = 0; y < height; y++) {
            // Déterminer le biome principal basé sur la hauteur
            const biome = this.getBiomeForHeight(y, height);
            
            for (let x = 0; x < width; x++) {
                // Ajouter de la variation horizontale avec du bruit
                const noise = this.generateNoise(x * 0.01, y * 0.01);
                const variation = noise * 0.3;
                
                // Mélanger les biomes aux frontières
                const finalBiome = this.blendBiomes(biome, x, y, variation);
                world.biomeMap[y][x] = finalBiome;
            }
        }
    }

    getBiomeForHeight(y, totalHeight) {
        const ratio = y / totalHeight;
        
        if (ratio < 0.08) return "DIVINE_PEAKS";
        if (ratio < 0.17) return "CELESTIAL_GARDENS";
        if (ratio < 0.25) return "CLOUD_REALM";
        if (ratio < 0.33) return "ENCHANTED_FOREST";
        if (ratio < 0.42) return "CRYSTAL_CAVERNS";
        if (ratio < 0.50) return "GOLDEN_PLAINS";
        if (ratio < 0.58) return "MYSTIC_SWAMPS";
        if (ratio < 0.67) return "DESERT_RUINS";
        if (ratio < 0.75) return "VOLCANIC_LANDS";
        if (ratio < 0.83) return "SHADOW_REALM";
        if (ratio < 0.92) return "INFERNAL_DEPTHS";
        return "ABYSS";
    }

    generateTerrain(world, width, height) {
        console.log("🗻 Génération du terrain intelligent...");
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const biome = world.biomeMap[y][x];
                const biomeData = this.biomes[biome];
                
                if (!biomeData) continue;
                
                // Génération basée sur le biome
                const tile = this.generateBiomeTile(x, y, biomeData, world);
                world.tiles[y][x] = tile;
            }
        }
        
        // Post-traitement pour les transitions fluides
        this.smoothTerrainTransitions(world, width, height);
    }

    generateBiomeTile(x, y, biomeData, world) {
        const noise = this.generateNoise(x * 0.05, y * 0.05);
        const detailNoise = this.generateNoise(x * 0.2, y * 0.2);
        
        // Sélection du bloc basée sur le bruit et les règles du biome
        if (noise > 0.6) {
            return this.getBlockId(biomeData.blocks.rare);
        } else if (noise > 0.3 || detailNoise > 0.5) {
            return this.getBlockId(biomeData.blocks.surface);
        } else {
            return this.getBlockId(biomeData.blocks.subsurface);
        }
    }

    generateStructures(world, width, height) {
        console.log("🏛️ Génération des structures avancées...");
        
        Object.entries(this.structures).forEach(([structureType, structureData]) => {
            const count = Math.floor(width * height * structureData.rarity / 10000);
            
            for (let i = 0; i < count; i++) {
                const x = Math.floor(Math.random() * (width - structureData.size.w));
                const y = Math.floor(Math.random() * (height - structureData.size.h));
                
                const biome = world.biomeMap[y][x];
                
                if (structureData.biomes.includes(biome)) {
                    this.placeStructure(world, structureType, x, y, structureData);
                }
            }
        });
    }

    placeStructure(world, type, x, y, data) {
        const structure = {
            type: type,
            x: x,
            y: y,
            width: data.size.w,
            height: data.size.h,
            npcs: [...data.npcs],
            loot: [...data.loot],
            blocks: [...data.blocks]
        };
        
        // Placer les blocs de la structure
        for (let dy = 0; dy < data.size.h; dy++) {
            for (let dx = 0; dx < data.size.w; dx++) {
                const worldX = x + dx;
                const worldY = y + dy;
                
                if (worldX < world.tiles[0].length && worldY < world.tiles.length) {
                    const blockType = this.selectStructureBlock(dx, dy, data);
                    world.tiles[worldY][worldX] = this.getBlockId(blockType);
                }
            }
        }
        
        world.structures.push(structure);
    }

    generateVegetation(world, width, height) {
        console.log("🌳 Génération de la végétation avancée...");
        
        Object.entries(this.vegetation).forEach(([vegType, vegData]) => {
            vegData.biomes.forEach(biome => {
                const count = Math.floor(width * height * vegData.rarity / 5000);
                
                for (let i = 0; i < count; i++) {
                    const x = Math.floor(Math.random() * (width - vegData.size.w));
                    const y = Math.floor(Math.random() * (height - vegData.size.h));
                    
                    if (world.biomeMap[y] && world.biomeMap[y][x] === biome) {
                        this.placeVegetation(world, vegType, x, y, vegData);
                    }
                }
            });
        });
    }

    placeVegetation(world, type, x, y, data) {
        const vegetation = {
            type: type,
            x: x,
            y: y,
            width: data.size.w,
            height: data.size.h,
            stage: Math.floor(Math.random() * data.growth_stages),
            products: [...data.products],
            effects: [...data.effects],
            lastHarvest: 0
        };
        
        world.vegetation.push(vegetation);
    }

    generateCreatures(world, width, height) {
        console.log("🐉 Génération des créatures avancées...");
        
        Object.entries(this.creatures).forEach(([creatureType, creatureData]) => {
            creatureData.biomes.forEach(biome => {
                const count = Math.floor(width * height * creatureData.rarity / 2000);
                
                for (let i = 0; i < count; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    
                    const biomeAtPos = world.biomeMap[Math.floor(y)] && 
                                     world.biomeMap[Math.floor(y)][Math.floor(x)];
                    
                    if (biomeAtPos === biome) {
                        this.spawnCreature(world, creatureType, x, y, creatureData);
                    }
                }
            });
        });
    }

    spawnCreature(world, type, x, y, data) {
        const creature = {
            type: type,
            name: data.name,
            x: x,
            y: y,
            health: data.health,
            maxHealth: data.health,
            damage: data.damage,
            speed: data.speed,
            abilities: [...data.abilities],
            drops: [...data.drops],
            behavior: data.behavior,
            sprite: data.sprite,
            ai: this.createCreatureAI(data.behavior),
            lastAction: 0,
            target: null,
            state: "idle"
        };
        
        world.creatures.push(creature);
    }

    generateNPCs(world, width, height) {
        console.log("👥 Génération des PNJ magnifiques...");
        
        // PNJ spéciaux pour chaque biome
        const npcTypes = {
            "DIVINE_PEAKS": [
                { type: "archangel", name: "Gabriel l'Archange", rarity: 0.1 },
                { type: "divine_oracle", name: "Oracle Céleste", rarity: 0.2 },
                { type: "angel_guard", name: "Gardien Angélique", rarity: 0.3 }
            ],
            "CELESTIAL_GARDENS": [
                { type: "garden_keeper", name: "Gardien Éternel", rarity: 0.3 },
                { type: "flower_fairy", name: "Fée des Fleurs", rarity: 0.5 },
                { type: "harmony_sage", name: "Sage de l'Harmonie", rarity: 0.2 }
            ],
            "ENCHANTED_FOREST": [
                { type: "forest_druid", name: "Druide Ancien", rarity: 0.2 },
                { type: "tree_spirit", name: "Esprit de l'Arbre", rarity: 0.4 },
                { type: "woodland_ranger", name: "Rôdeur des Bois", rarity: 0.3 }
            ],
            "INFERNAL_DEPTHS": [
                { type: "demon_lord", name: "Seigneur Démon", rarity: 0.1 },
                { type: "hell_merchant", name: "Marchand Infernal", rarity: 0.2 },
                { type: "tortured_soul", name: "Âme Tourmentée", rarity: 0.4 }
            ]
        };

        Object.entries(npcTypes).forEach(([biome, npcs]) => {
            npcs.forEach(npcData => {
                const count = Math.floor(width * height * npcData.rarity / 8000);
                
                for (let i = 0; i < count; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    
                    const biomeAtPos = world.biomeMap[Math.floor(y)] && 
                                     world.biomeMap[Math.floor(y)][Math.floor(x)];
                    
                    if (biomeAtPos === biome) {
                        this.createAdvancedNPC(world, npcData, x, y, biome);
                    }
                }
            });
        });
    }

    createAdvancedNPC(world, npcData, x, y, biome) {
        const npc = {
            type: npcData.type,
            name: npcData.name,
            x: x,
            y: y,
            biome: biome,
            sprite: this.getNPCSprite(npcData.type, biome),
            dialogue: this.generateNPCDialogue(npcData.type, biome),
            quests: this.generateNPCQuests(npcData.type, biome),
            shop: this.generateNPCShop(npcData.type, biome),
            personality: this.generateNPCPersonality(npcData.type),
            schedule: this.generateNPCSchedule(npcData.type),
            relationships: {},
            mood: "neutral",
            lastInteraction: 0
        };
        
        world.npcs.push(npc);
    }

    // === MÉTHODES UTILITAIRES ===
    generateNoise(x, y, seed = 12345) {
        // Implémentation simple du bruit de Perlin
        const random = (x, y) => {
            const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return n - Math.floor(n);
        };
        
        return random(x + seed, y + seed) * 2 - 1;
    }

    blendBiomes(primaryBiome, x, y, variation) {
        // Logique de mélange des biomes pour des transitions naturelles
        if (Math.abs(variation) < 0.1) {
            return primaryBiome;
        }
        
        // Retourner le biome principal pour l'instant
        return primaryBiome;
    }

    getBlockId(blockName) {
        // Mapping des noms de blocs vers les IDs
        const blockIds = {
            "DIVINE_STONE": 100,
            "BLESSED_EARTH": 101,
            "CELESTIAL_CRYSTAL": 102,
            "BLESSED_GRASS": 103,
            "FERTILE_SOIL": 104,
            "LIFE_CRYSTAL": 105,
            "CLOUD_STONE": 106,
            "WIND_CRYSTAL": 107,
            "SKY_GEM": 108,
            "MOSS_STONE": 109,
            "RICH_EARTH": 110,
            "NATURE_CRYSTAL": 111,
            "CRYSTAL_STONE": 112,
            "AMETHYST": 113,
            "PRISMATIC_CRYSTAL": 114,
            "GOLDEN_GRASS": 115,
            "FERTILE_LOAM": 116,
            "GOLD_ORE": 117,
            "SWAMP_MUD": 118,
            "PEAT": 119,
            "WITCH_STONE": 120,
            "SAND": 121,
            "SANDSTONE": 122,
            "DESERT_GLASS": 123,
            "VOLCANIC_ROCK": 124,
            "OBSIDIAN": 125,
            "FIRE_CRYSTAL": 126,
            "SHADOW_STONE": 127,
            "VOID_ROCK": 128,
            "DARK_CRYSTAL": 129,
            "HELLSTONE": 130,
            "BRIMSTONE": 131,
            "SOUL_CRYSTAL": 132,
            "VOID_STONE": 133,
            "CHAOS_ROCK": 134,
            "PRIMORDIAL_CRYSTAL": 135
        };
        
        return blockIds[blockName] || 1; // Retour par défaut
    }

    smoothTerrainTransitions(world, width, height) {
        // Lissage des transitions entre biomes
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const currentBiome = world.biomeMap[y][x];
                const neighbors = [
                    world.biomeMap[y-1][x], world.biomeMap[y+1][x],
                    world.biomeMap[y][x-1], world.biomeMap[y][x+1]
                ];
                
                // Si entouré de biomes différents, créer une transition
                const differentNeighbors = neighbors.filter(n => n !== currentBiome);
                if (differentNeighbors.length >= 2) {
                    // Appliquer un bloc de transition
                    world.tiles[y][x] = this.getTransitionBlock(currentBiome, differentNeighbors[0]);
                }
            }
        }
    }

    getTransitionBlock(biome1, biome2) {
        // Retourner un bloc de transition approprié
        return this.getBlockId("TRANSITION_STONE") || 50;
    }

    selectStructureBlock(x, y, structureData) {
        // Sélectionner le bon bloc pour la structure
        if (x === 0 || x === structureData.size.w - 1 || 
            y === 0 || y === structureData.size.h - 1) {
            return structureData.blocks[0]; // Murs extérieurs
        } else {
            return structureData.blocks[Math.floor(Math.random() * structureData.blocks.length)];
        }
    }

    createCreatureAI(behaviorType) {
        const behaviors = {
            "peaceful_guardian": {
                idle: () => "patrol",
                patrol: () => Math.random() < 0.1 ? "idle" : "patrol",
                combat: () => "defend"
            },
            "aggressive_hunter": {
                idle: () => "hunt",
                hunt: () => Math.random() < 0.3 ? "idle" : "hunt",
                combat: () => "attack"
            },
            "shy_healer": {
                idle: () => "graze",
                graze: () => Math.random() < 0.2 ? "idle" : "graze",
                threatened: () => "flee"
            }
        };
        
        return behaviors[behaviorType] || behaviors["peaceful_guardian"];
    }

    getNPCSprite(type, biome) {
        return `${type}_${biome.toLowerCase()}`;
    }

    generateNPCDialogue(type, biome) {
        const dialogues = {
            "archangel": [
                "La lumière divine vous guide, voyageur.",
                "Les cieux veillent sur votre quête.",
                "Que la bénédiction céleste vous accompagne."
            ],
            "demon_lord": [
                "Mortel... que cherches-tu dans ces profondeurs ?",
                "Les flammes de l'enfer brûlent éternellement.",
                "Ton âme m'intéresse... parlons affaires."
            ],
            "forest_druid": [
                "La nature murmure des secrets anciens.",
                "Les arbres se souviennent de tout.",
                "L'équilibre doit être préservé."
            ]
        };
        
        return dialogues[type] || ["Bonjour, voyageur."];
    }

    generateNPCQuests(type, biome) {
        // Génération de quêtes spécifiques au type de PNJ
        return [];
    }

    generateNPCShop(type, biome) {
        // Génération de boutique spécifique au type de PNJ
        return null;
    }

    generateNPCPersonality(type) {
        const personalities = {
            "archangel": { wisdom: 10, kindness: 10, power: 9 },
            "demon_lord": { cunning: 10, cruelty: 9, power: 10 },
            "forest_druid": { wisdom: 8, nature_bond: 10, patience: 9 }
        };
        
        return personalities[type] || { neutral: 5 };
    }

    generateNPCSchedule(type) {
        // Génération d'horaires pour les PNJ
        return {
            morning: "active",
            afternoon: "active", 
            evening: "rest",
            night: "sleep"
        };
    }

    generateWeatherSystems(world, width, height) {
        console.log("🌦️ Génération des systèmes météorologiques...");
        
        Object.entries(this.weather).forEach(([weatherType, weatherData]) => {
            weatherData.biomes.forEach(biome => {
                if (Math.random() < weatherData.rarity) {
                    const weather = {
                        type: weatherType,
                        name: weatherData.name,
                        biome: biome,
                        duration: weatherData.duration,
                        effects: [...weatherData.effects],
                        visual: weatherData.visual,
                        startTime: Math.random() * 1000,
                        active: false
                    };
                    
                    world.weather.push(weather);
                }
            });
        });
    }

    generateTreasures(world, width, height) {
        console.log("💎 Génération des trésors...");
        
        const treasureCount = Math.floor(width * height / 1000);
        
        for (let i = 0; i < treasureCount; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const biome = world.biomeMap[y][x];
            
            const treasure = {
                x: x,
                y: y,
                biome: biome,
                type: this.getTreasureType(biome),
                rarity: Math.random(),
                discovered: false,
                contents: this.generateTreasureContents(biome)
            };
            
            world.treasures.push(treasure);
        }
    }

    getTreasureType(biome) {
        const treasureTypes = {
            "DIVINE_PEAKS": "divine_chest",
            "CELESTIAL_GARDENS": "blessed_cache",
            "ENCHANTED_FOREST": "nature_hoard",
            "CRYSTAL_CAVERNS": "crystal_geode",
            "INFERNAL_DEPTHS": "demon_vault",
            "ABYSS": "chaos_relic"
        };
        
        return treasureTypes[biome] || "common_chest";
    }

    generateTreasureContents(biome) {
        // Génération du contenu des trésors basé sur le biome
        return {
            gold: Math.floor(Math.random() * 1000),
            items: [],
            artifacts: []
        };
    }
}

export { AdvancedWorldGenerator };