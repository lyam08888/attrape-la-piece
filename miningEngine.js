import { TILE } from './world.js';

const BLOCK_BREAK_TIME = {
    [TILE.GRASS]: 0.5, [TILE.DIRT]: 0.5, [TILE.STONE]: 2,
    [TILE.WOOD]: 1.5, [TILE.LEAVES]: 0.3, [TILE.COAL]: 2.5, [TILE.IRON]: 3.5,
    [TILE.OAK_WOOD]: 1.5, [TILE.OAK_LEAVES]: 0.3, [TILE.SAND]: 0.4
};
const TOOL_EFFICIENCY = {
    pickaxe: { [TILE.STONE]: 3, [TILE.COAL]: 3, [TILE.IRON]: 3 },
    shovel: { [TILE.DIRT]: 3, [TILE.GRASS]: 3, [TILE.SAND]: 3 },
    axe:    { [TILE.WOOD]: 3, [TILE.LEAVES]: 3, [TILE.OAK_WOOD]: 3, [TILE.OAK_LEAVES]: 3 },
};

export function updateMining(game, mouse, delta) {
    const player = game.player;
    if (!player || !mouse.left || !player.miningTarget) {
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

    if (player.miningProgress >= 1) {
        destroyBlock(game, target.x, target.y, currentType);
        player.miningProgress = 0;
        player.miningTarget = null;
        game.miningEffect = null;
    }
}

function destroyBlock(game, x, y, type) {
    const { tileSize } = game.config;
    game.tileMap[y][x] = TILE.AIR;
    game.sound?.play('break_block');
    game.createParticles(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, 10, '#ccc');

    // Création d'un objet à ramasser
    game.collectibles.push({
        x: x * tileSize,
        y: y * tileSize,
        w: tileSize,
        h: tileSize,
        vy: -2, // Petit saut initial
        tileType: type
    });

    // Logique future pour la physique des blocs
    // if ((type === TILE.WOOD || type === TILE.LEAVES) && game.propagateTreeCollapse) {
    //     game.propagateTreeCollapse(x, y);
    // }
    // if (game.checkBlockSupport) {
    //     game.checkBlockSupport(x, y - 1);
    // }
}
