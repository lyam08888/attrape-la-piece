import { TILE } from './world.js';

const BLOCK_BREAK_TIME = {
    [TILE.GRASS]: 0.5,
    [TILE.DIRT]: 1,
    [TILE.STONE]: 2,
    [TILE.WOOD]: 1.5,
    [TILE.LEAVES]: 0.3,
    [TILE.COAL]: 2.5,
    [TILE.IRON]: 3.5,
};

const TOOL_EFFICIENCY = {
    pickaxe: { [TILE.STONE]: 3, [TILE.COAL]: 3, [TILE.IRON]: 3 },
    shovel: { [TILE.DIRT]: 3, [TILE.GRASS]: 3 },
    axe:    { [TILE.WOOD]: 3, [TILE.LEAVES]: 3 },
    hand:   { [TILE.GRASS]: 1, [TILE.DIRT]: 0.5 },
};

let lastTime = performance.now();

export function updateMining(game, keys, mouse) {
    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    const player = game.player;
    if (!player) return;

    const isAction = keys.action || mouse.left || mouse.right;
    const target = player.miningTarget;

    if (!isAction || !target) {
        player.miningTarget = isAction ? target : null;
        player.miningProgress = 0;
        game.miningEffect = null;
        return;
    }

    const currentType = game.tileMap[target.y]?.[target.x];
    if (currentType !== target.type || currentType === TILE.AIR) {
        player.miningTarget = null;
        player.miningProgress = 0;
        game.miningEffect = null;
        return;
    }

    const toolName = player.tools[player.selectedToolIndex] || 'hand';
    const breakTime = BLOCK_BREAK_TIME[currentType] || 1;
    const eff = TOOL_EFFICIENCY[toolName]?.[currentType];
    const efficiency = eff !== undefined ? eff : (toolName === 'hand' ? 0.2 : 0.5);
    if (efficiency <= 0) {
        game.miningEffect = null;
        return;
    }

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
    game.sound?.playBreak();
    game.createParticles(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, 5, '#ccc');

    game.collectibles.push({
        x: x * tileSize,
        y: y * tileSize,
        w: tileSize,
        h: tileSize,
        vy: -2,
        tileType: type
    });

    if ((type === TILE.WOOD || type === TILE.LEAVES) && game.propagateTreeCollapse) {
        game.propagateTreeCollapse(x, y);
    }

    if (game.checkBlockSupport) {
        game.checkBlockSupport(x, y - 1);
    }
}
