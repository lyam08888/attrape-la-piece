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
    [TILE.GRAVEL]: 0.6,
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
        [TILE.GRAVEL]: 3,
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
    if (!player) return;
    
    // Vérifier si le joueur est en train de miner (clic gauche maintenu ou touche action)
    const isMining = mouse.left || keys?.action;
    
    if (!isMining || !player.miningTarget) {
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

    if (!isFinite(breakTime)) {
        player.miningProgress = 0;
        player.miningTarget = null;
        game.miningEffect = null;
        if (game.logger) game.logger.log('Ce bloc est indestructible.');
        return;
    }

    // Vérifier si l'outil actuel peut miner ce type de bloc
    const toolEfficiency = TOOL_EFFICIENCY[toolName]?.[currentType];
    
    // Blocs qui peuvent être minés à la main (avec efficacité réduite)
    const handMineable = [
        TILE.DIRT, TILE.GRASS, TILE.SAND, TILE.GRAVEL, TILE.LEAVES, TILE.OAK_LEAVES, 
        TILE.FLOWER_RED, TILE.FLOWER_YELLOW, TILE.GLOW_MUSHROOM, TILE.CLOUD
    ];
    
    if (toolName !== 'hand' && toolEfficiency === undefined && !handMineable.includes(currentType)) {
        player.miningProgress = 0;
        game.miningEffect = null;
        if (game.logger) game.logger.log(`Impossible de miner ce bloc avec ${toolName}.`);
        if (toolName !== 'pickaxe') return;
        // La pioche peut miner les blocs inconnus avec une efficacité par défaut
    }

    // Vérifier si l'outil a encore de la durabilité
    let efficiency = toolEfficiency ?? (toolName === 'pickaxe' ? 1 : 0.5); // 0.5 = main nue
    
    if (toolName !== 'hand') {
        const durability = player.durability?.[toolName] ?? Infinity;
        if (durability <= 0) {
            if (!handMineable.includes(currentType)) {
                player.miningProgress = 0;
                game.miningEffect = null;
                if (game.logger) game.logger.log(`${toolName} est cassé ! Impossible de miner ce bloc.`);
                return;
            }
            efficiency = 0.3;
            if (game.logger) game.logger.log(`${toolName} est cassé ! Minage très lent.`);
        }
    }
    
    const timeToBreak = breakTime / efficiency;
    player.miningProgress += delta / timeToBreak;
    game.miningEffect = { x: target.x, y: target.y, progress: player.miningProgress };

    // Créer des particules de minage selon le type de bloc
    if (Math.random() < 0.3) {
        createMiningParticles(game, target.x, target.y, currentType);
    }

    if (player.miningProgress >= 1) {
        destroyBlock(game, target.x, target.y, currentType);
        
        // Réduire la durabilité de l'outil (sauf pour la main)
        if (toolName !== 'hand' && player.durability && player.durability[toolName] > 0) {
            player.durability[toolName] = Math.max(0, player.durability[toolName] - 1);

            // Si l'outil est cassé, le remplacer par la main
            if (player.durability[toolName] <= 0) {
                if (game.logger) game.logger.log(`${toolName} est cassé !`);
                // L'outil reste dans l'inventaire mais ne peut plus être utilisé
            }

            // Mettre à jour la barre d'outils pour refléter la durabilité
            if (game.updateToolbar) game.updateToolbar();
        }
        
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
        case TILE.GRAVEL: particleColor = '#A0A0A0'; break;
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
    
    // Vérifier les blocs adjacents pour la gravité
    checkBlockSupport(game, x - 1, y);
    checkBlockSupport(game, x + 1, y);
    checkBlockSupport(game, x, y + 1);
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

// Blocs qui ont de la gravité (tombent lorsqu'ils n'ont plus de support)
const GRAVITY_BLOCKS = [
    TILE.SAND, TILE.GRAVEL, TILE.SOUL_SAND
];

function checkBlockSupport(game, x, y) {
    // Vérifier si un bloc a besoin de support
    const block = game.tileMap[y]?.[x];
    if (!block) return;
    
    if (GRAVITY_BLOCKS.includes(block)) {
        // Vérifier si le bloc a un support en dessous
        const blockBelow = game.tileMap[y + 1]?.[x];
        
        // Si le bloc en dessous est de l'air ou n'existe pas, le bloc tombe
        if (!blockBelow || blockBelow === TILE.AIR) {
            // Faire tomber le bloc
            game.tileMap[y][x] = TILE.AIR;
            game.collectibles.push({
                x: x * game.config.tileSize,
                y: y * game.config.tileSize,
                w: game.config.tileSize,
                h: game.config.tileSize,
                vy: 0,
                tileType: block
            });
        }
    }
    
    // Vérifier également les blocs adjacents pour la gravité
    // Vérifier le bloc à gauche
    const blockLeft = game.tileMap[y]?.[x - 1];
    if (blockLeft && GRAVITY_BLOCKS.includes(blockLeft)) {
        const blockLeftBelow = game.tileMap[y + 1]?.[x - 1];
        if (!blockLeftBelow || blockLeftBelow === TILE.AIR) {
            game.tileMap[y][x - 1] = TILE.AIR;
            game.collectibles.push({
                x: (x - 1) * game.config.tileSize,
                y: y * game.config.tileSize,
                w: game.config.tileSize,
                h: game.config.tileSize,
                vy: 0,
                tileType: blockLeft
            });
        }
    }
    
    // Vérifier le bloc à droite
    const blockRight = game.tileMap[y]?.[x + 1];
    if (blockRight && GRAVITY_BLOCKS.includes(blockRight)) {
        const blockRightBelow = game.tileMap[y + 1]?.[x + 1];
        if (!blockRightBelow || blockRightBelow === TILE.AIR) {
            game.tileMap[y][x + 1] = TILE.AIR;
            game.collectibles.push({
                x: (x + 1) * game.config.tileSize,
                y: y * game.config.tileSize,
                w: game.config.tileSize,
                h: game.config.tileSize,
                vy: 0,
                tileType: blockRight
            });
        }
    }
    
    // Vérifier le bloc au-dessus
    const blockAbove = game.tileMap[y - 1]?.[x];
    if (blockAbove && GRAVITY_BLOCKS.includes(blockAbove)) {
        const blockAboveBelow = game.tileMap[y]?.[x];
        if (!blockAboveBelow || blockAboveBelow === TILE.AIR) {
            game.tileMap[y - 1][x] = TILE.AIR;
            game.collectibles.push({
                x: x * game.config.tileSize,
                y: (y - 1) * game.config.tileSize,
                w: game.config.tileSize,
                h: game.config.tileSize,
                vy: 0,
                tileType: blockAbove
            });
        }
    }
}

// Fonction pour vérifier et faire tomber tous les blocs avec gravité qui n'ont plus de support
export function updateGravity(game) {
    // Limiter la fréquence de vérification de la gravité pour les performances
    if (!game.gravityTimer) game.gravityTimer = 0;
    game.gravityTimer++;
    
    // Vérifier la gravité seulement toutes les 5 frames
    if (game.gravityTimer < 5) return;
    game.gravityTimer = 0;
    
    const { tileSize } = game.config;
    const map = game.tileMap;
    
    // Parcourir la carte de haut en bas pour éviter les problèmes de décalage
    for (let y = map.length - 2; y >= 0; y--) {
        for (let x = 0; x < map[y].length; x++) {
            const blockType = map[y][x];
            
            // Vérifier si le bloc a de la gravité
            if (GRAVITY_BLOCKS.includes(blockType)) {
                // Vérifier si le bloc a un support en dessous
                const blockBelow = map[y + 1]?.[x];
                
                // Si le bloc en dessous est de l'air ou n'existe pas, le bloc tombe
                if (!blockBelow || blockBelow === TILE.AIR) {
                    // Faire tomber le bloc
                    map[y][x] = TILE.AIR;
                    game.collectibles.push({
                        x: x * tileSize,
                        y: y * tileSize,
                        w: tileSize,
                        h: tileSize,
                        vy: 0.5, // Donner une vélocité initiale pour la chute
                        tileType: blockType
                    });
                }
            }
        }
    }
}
