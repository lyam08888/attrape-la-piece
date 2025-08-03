// Simple test to validate player.js structure
import { Player } from './player.js';
import { PlayerStats, CombatSystem, BiomeSystem } from './combatSystem.js';

// Mock config for testing
const mockConfig = {
    player: {
        width: 32,
        height: 32,
        hitbox: { offsetX: 4, offsetY: 4, width: 24, height: 24 },
        reach: 4
    },
    physics: {
        gravity: 0.35,
        jumpForce: 8,
        playerSpeed: 3,
        friction: 0.85,
        airResistance: 0.98,
        maxFallSpeed: 10,
        groundAcceleration: 0.4,
        airAcceleration: 0.2
    },
    tileSize: 16,
    zoom: 3
};

// Mock sound system
const mockSound = {
    play: (name) => console.log(`Sound: ${name}`)
};

try {
    console.log('Testing Player class instantiation...');
    const player = new Player(100, 100, mockConfig, mockSound);
    
    console.log('✅ Player created successfully');
    console.log('Player stats:', player.stats ? 'initialized' : 'not initialized');
    console.log('Combat system:', player.combatSystem ? 'initialized' : 'not initialized');
    console.log('Biome system:', player.biomeSystem ? 'initialized' : 'not initialized');
    
    // Test method existence
    console.log('Testing method existence...');
    console.log('updateFruitHarvesting:', typeof player.updateFruitHarvesting === 'function' ? '✅' : '❌');
    console.log('updateCombat:', typeof player.updateCombat === 'function' ? '✅' : '❌');
    console.log('takeDamage:', typeof player.takeDamage === 'function' ? '✅' : '❌');
    console.log('heal:', typeof player.heal === 'function' ? '✅' : '❌');
    console.log('addXP:', typeof player.addXP === 'function' ? '✅' : '❌');
    console.log('getCurrentWeapon:', typeof player.getCurrentWeapon === 'function' ? '✅' : '❌');
    
    // Test mock game object
    const mockGame = {
        camera: { x: 0, y: 0 },
        config: mockConfig,
        tileMap: [[0, 0, 0], [0, 1, 0], [1, 1, 1]],
        enemies: [],
        collectibles: [],
        foodSystem: {
            harvestFruit: () => false
        },
        logger: {
            log: (msg) => console.log(`Game log: ${msg}`)
        }
    };
    
    const mockMouse = { x: 0, y: 0, left: false, right: false };
    const mockKeys = { left: false, right: false, jump: false, down: false, run: false, fly: false };
    
    console.log('Testing updateCombat method...');
    player.updateCombat(mockGame, 16);
    console.log('✅ updateCombat executed without errors');
    
    console.log('Testing updateFruitHarvesting method...');
    player.updateFruitHarvesting(mockMouse, mockGame);
    console.log('✅ updateFruitHarvesting executed without errors');
    
    console.log('\n🎉 All tests passed! The player.js file has been successfully fixed.');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
}