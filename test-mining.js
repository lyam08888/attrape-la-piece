import { updateMining } from './miningEngine.js';
import { TILE } from './world.js';

// Minimal mock game and player setup
const mockGame = {
    config: { tileSize: 16 },
    tileMap: [[TILE.STONE]],
    player: {
        tools: ['pickaxe', 'bow'],
        selectedToolIndex: 0,
        miningTarget: { x: 0, y: 0, type: TILE.STONE },
        miningProgress: 0,
        durability: { pickaxe: 100, bow: 100 }
    },
    miningEffect: null
};

const mouse = { left: true };
const keys = {};

// Test with a pickaxe - progress should increase
updateMining(mockGame, keys, mouse, 0.1);
if (mockGame.player.miningProgress <= 0) {
    console.error('❌ Pickaxe did not increase mining progress');
    process.exit(1);
}

// Test mining of a block without specific efficiency (e.g., COPPER)
mockGame.tileMap = [[TILE.COPPER]];
mockGame.player.miningTarget = { x: 0, y: 0, type: TILE.COPPER };
mockGame.player.miningProgress = 0;
mockGame.player.selectedToolIndex = 0; // pickaxe
updateMining(mockGame, keys, mouse, 0.1);
if (mockGame.player.miningProgress <= 0) {
    console.error('❌ Pickaxe should mine unknown block types');
    process.exit(1);
}

// Reset and test with a non-mining tool (bow) - progress should stay at 0
mockGame.player.selectedToolIndex = 1; // bow
mockGame.player.miningTarget = { x: 0, y: 0, type: TILE.STONE };
mockGame.player.miningProgress = 0;
updateMining(mockGame, keys, mouse, 0.1);
if (mockGame.player.miningProgress !== 0) {
    console.error('❌ Non-mining tool should not progress mining');
    process.exit(1);
}

console.log('✅ All mining tests passed');
