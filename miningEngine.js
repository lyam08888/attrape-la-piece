import { TILE } from './world.js';

// Temps de base pour casser chaque type de bloc (en secondes)
const BLOCK_BREAK_TIME = {
    [TILE.AIR]: 0,
    [TILE.GRASS]: 0.5,
    [TILE.DIRT]: 0.5,
    [TILE.STONE]: 2.0,
    [TILE.WOOD]: 1.5,
    [TILE.LEAVES]: 0.3,
    [TILE.COAL]: 2.5,
    [TILE.IRON]: 3.5,
    [TILE.BEDROCK]: Infinity, // Indestructible
    [TILE.WATER]: 0.2,
    [TILE.CRYSTAL]: 1.8,
    [TILE.GLOW_MUSHROOM]: 0.4,
    [TILE.CLOUD]: 0.1,
    [TILE.HELLSTONE]: 4.0,
    [TILE.LAVA]: 0.2,
    [TILE.SAND]: 0.4,
    [TILE.OAK_WOOD]: 1.5,
    [TILE.OAK_LEAVES]: 0.3,
    [TILE.FLOWER_RED]: 0.1,
    [TILE.FLOWER_YELLOW]: 0.1,
    [TILE.GOLD]: 4.0,
    [TILE.DIAMOND]: 6.0,
    [TILE.LAPIS]: 5.0,
    [TILE.GRANITE]: 2.2,
    [TILE.DIORITE]: 2.1,
    [TILE.ANDESITE]: 2.0,
    [TILE.HEAVENLY_STONE]: 3.0,
    [TILE.MOON_ROCK]: 2.8,
    [TILE.SOUL_SAND]: 0.6,
    [TILE.SCORCHED_STONE]: 3.5,
    [TILE.OBSIDIAN]: 8.0,
    [TILE.AMETHYST]: 5.5
};

// Efficacité des outils selon le type de bloc
const TOOL_EFFICIENCY = {
    pickaxe: {
        [TILE.STONE]: 3,
        [TILE.COAL]: 3,
        [TILE.IRON]: 3,
        [TILE.GOLD]: 3,
        [TILE.DIAMOND]: 3,
        [TILE.LAPIS]: 3,
        [TILE.GRANITE]: 3,
        [TILE.DIORITE]: 3,
        [TILE.ANDESITE]: 3,
        [TILE.HEAVENLY_STONE]: 2,
        [TILE.MOON_ROCK]: 2,
        [TILE.SCORCHED_STONE]: 2,
        [TILE.OBSIDIAN]: 1.5,
        [TILE.AMETHYST]: 2.5
    },
    shovel: {
        [TILE.DIRT]: 3,
        [TILE.GRASS]: 3,
        [TILE.SAND]: 3,
        [TILE.SOUL_SAND]: 2
    },
    axe: {
        [TILE.WOOD]: 3,
        [TILE.LEAVES]: 3,
        [TILE.OAK_WOOD]: 3,
        [TILE.OAK_LEAVES]: 3
    },
    sword: {
        [TILE.LEAVES]: 2,
        [TILE.OAK_LEAVES]: 2
    },
    knife: {
        [TILE.LEAVES]: 1.5,
        [TILE.OAK_LEAVES]: 1.5
    }
};

// Tableau des drops spéciaux
const SPECIAL_DROPS = {
    [TILE.COAL]: [
        { item: TILE.COAL, chance: 0.9, min: 1, max: 2 },
        { item: TILE.IRON, chance: 0.1, min: 1, max: 1 }
    ],
    [TILE.IRON]: [
        { item: TILE.IRON, chance: 0.8, min: 1, max: 2 },
        { item: TILE.COAL, chance: 0.2, min: 1, max: 2 }
    ],
    [TILE.GOLD]: [
        { item: TILE.GOLD, chance: 0.7, min: 1, max: 2 },
        { item: TILE.IRON, chance: 0.3, min: 1, max: 1 }
    ],
    [TILE.DIAMOND]: [
        { item: TILE.DIAMOND, chance: 0.6, min: 1, max: 1 },
        { item: TILE.GOLD, chance: 0.4, min: 1, max: 2 }
    ],
    [TILE.LAPIS]: [
        { item: TILE.LAPIS, chance: 0.7, min: 1, max: 3 },
        { item: TILE.DIAMOND, chance: 0.05, min: 1, max: 1 }
    ],
    [TILE.AMETHYST]: [
        { item: TILE.AMETHYST, chance: 0.6, min: 1, max: 1 },
        { item: TILE.LAPIS, chance: 0.4, min: 1, max: 2 }
    ],
    [TILE.OBSIDIAN]: [
        { item: TILE.OBSIDIAN, chance: 0.5, min: 1, max: 1 },
        { item: TILE.DIAMOND, chance: 0.3, min: 1, max: 1 },
        { item: TILE.LAVA, chance: 0.2, min: 1, max: 1 }
    ],
    [TILE.HELLSTONE]: [
        { item: TILE.HELLSTONE, chance: 0.6, min: 1, max: 1 },
        { item: TILE.OBSIDIAN, chance: 0.2, min: 1, max: 1 },
        { item: TILE.SOUL_SAND, chance: 0.2, min: 1, max: 2 }
    ]
};

export function updateMining(game, keys, mouse, delta) {
    const player = game.player;
    if (!player || !(mouse.left || keys?.action) || !player.miningTarget) {
        if (player) player.miningProgress = 0;
        game.miningEffect = null;
        return;
    }
    
    const target = player.miningTarget;
    const currentType = game.tileMap[target.y]?.[target.x];
    if (currentType !== target.type || currentType === TILE.AIR) {
        player.miningTarget = null;
        player.miningProgress = 0;
        game.miningEffect = null;
        return;
    }

    const toolName = player.tools[player.selectedToolIndex] || 'hand';
    const breakTime = BLOCK_BREAK_TIME[currentType] || 1;
    const efficiency = TOOL_EFFICIENCY[toolName]?.[currentType] || 0.5;

    const timeToBreak = breakTime / efficiency;
    player.miningProgress += delta / timeToBreak;
    game.miningEffect = { x: target.x, y: target.y, progress: player.miningProgress };

    // Créer des particules de minage selon le type de bloc
    if (Math.random() < 0.3) {
        createMiningParticles(game, target.x, target.y, currentType);
    }

    if (player.miningProgress >= 1) {
        destroyBlock(game, target.x, target.y, currentType);
        player.miningProgress = 0;
        player.miningTarget = null;
        game.miningEffect = null;
    }
}

function createMiningParticles(game, x, y, blockType) {
    if (!game.particles) game.particles = [];
    
    const { tileSize } = game.config;
    const worldX = x * tileSize + tileSize / 2;
    const worldY = y * tileSize + tileSize / 2;
    
    // Couleur des particules selon le type de bloc
    let particleColor = '#666666';
    switch (blockType) {
        case TILE.STONE: particleColor = '#808080'; break;
        case TILE.DIRT: particleColor = '#8B4513'; break;
        case TILE.GRASS: particleColor = '#228B22'; break;
        case TILE.SAND: particleColor = '#F4A460'; break;
        case TILE.COAL: particleColor = '#2F2F2F'; break;
        case TILE.IRON: particleColor = '#CD853F'; break;
        case TILE.GOLD: particleColor = '#FFD700'; break;
        case TILE.DIAMOND: particleColor = '#87CEEB'; break;
        case TILE.OAK_WOOD: particleColor = '#8B4513'; break;
        case TILE.OAK_LEAVES: particleColor = '#228B22'; break;
        case TILE.LAVA: particleColor = '#FF5722'; break;
        case TILE.OBSIDIAN: particleColor = '#263238'; break;
        case TILE.HELLSTONE: particleColor = '#D32F2F'; break;
        case TILE.SOUL_SAND: particleColor = '#5D4037'; break;
        default: particleColor = '#666666';
    }
    
    // Créer 2-4 particules
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        game.particles.push({
            x: worldX + (Math.random() - 0.5) * tileSize,
            y: worldY + (Math.random() - 0.5) * tileSize,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            color: particleColor,
            life: 30 + Math.floor(Math.random() * 20),
            maxLife: 50,
            size: 2 + Math.random() * 3
        });
    }
}

function destroyBlock(game, x, y, type) {
    const { tileSize } = game.config;
    
    // Effets spéciaux selon le type de bloc
    if (type === TILE.LAVA && game.tileMap[y-1]?.[x] === TILE.WATER) {
        // Lave + Eau = Obsidienne
        game.tileMap[y][x] = TILE.OBSIDIAN;
        game.sound?.play('lava_convert');
        game.createParticles(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, 15, '#263238');
        return;
    }
    
    // Destruction normale
    game.tileMap[y][x] = TILE.AIR;
    
    // Ajouter des statistiques
    if (game.player && game.player.stats) {
        game.player.stats.addBlockMined();
    }
    
    // Mettre à jour les quêtes
    if (game.questSystem) {
        game.questSystem.updateQuestProgress('mine_blocks', { amount: 1 });
        
        // Quêtes spécifiques selon le type de bloc
        if (type === TILE.WOOD || type === TILE.OAK_WOOD) {
            game.questSystem.updateQuestProgress('collect_wood', { amount: 1 });
        }
    }
    
    game.sound?.play('break_block');
    game.createParticles(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, 10, '#ccc');

    // Création d'objets à ramasser avec drops spéciaux
    const drops = getBlockDrops(type);
    drops.forEach(drop => {
        for (let i = 0; i < drop.quantity; i++) {
            game.collectibles.push({
                x: x * tileSize + Math.random() * tileSize,
                y: y * tileSize + Math.random() * tileSize,
                w: tileSize/2,
                h: tileSize/2,
                vy: -2 - Math.random() * 3,
                tileType: drop.item
            });
        }
    });

    // Logique de physique des blocs
    checkBlockSupport(game, x, y - 1);
}

function getBlockDrops(type) {
    // Drops spéciaux
    if (SPECIAL_DROPS[type]) {
        const drops = [];
        SPECIAL_DROPS[type].forEach(dropConfig => {
            if (Math.random() < dropConfig.chance) {
                const quantity = Math.floor(
                    Math.random() * (dropConfig.max - dropConfig.min + 1) + dropConfig.min
                );
                if (quantity > 0) {
                    drops.push({ item: dropConfig.item, quantity });
                }
            }
        });
        return drops;
    }
    
    // Drop par défaut
    return [{ item: type, quantity: 1 }];
}

function checkBlockSupport(game, x, y) {
    // Vérifier si un bloc a besoin de support
    const blockAbove = game.tileMap[y]?.[x];
    if (!blockAbove) return;
    
    // Blocs qui nécessitent un support
    const needsSupport = [
        TILE.SAND, TILE.GRAVEL, TILE.SOUL_SAND
    ];
    
    if (needsSupport.includes(blockAbove)) {
        // Faire tomber le bloc
        game.tileMap[y][x] = TILE.AIR;
        game.collectibles.push({
            x: x * game.config.tileSize,
            y: y * game.config.tileSize,
            w: game.config.tileSize,
            h: game.config.tileSize,
            vy: 0,
            tileType: blockAbove
        });
    }
}
