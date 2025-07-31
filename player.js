import { TILE } from './world.js';

const TILE_HARDNESS = {
    [TILE.GRASS]: 1, [TILE.DIRT]: 1,
    [TILE.LEAVES]: 0.5, [TILE.WOOD]: 2,
    [TILE.STONE]: 3, [TILE.COAL]: 3.5, [TILE.IRON]: 4
};

const TOOL_EFFECTIVENESS = {
    'shovel': [TILE.GRASS, TILE.DIRT],
    'axe': [TILE.WOOD, TILE.LEAVES],
    'pickaxe': [TILE.STONE, TILE.COAL, TILE.IRON]
};

export class Player {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.w = config.player.width;
        this.h = config.player.height;
        this.config = config;
        this.grounded = false;
        this.canDoubleJump = true;
        this.dir = 1;
        this.invulnerable = 0;
        this.swingTimer = 0;
        this.tools = ['pickaxe', 'shovel', 'axe', 'sword', 'bow', 'fishing_rod'];
        this.selectedToolIndex = 0;
        this.inventory = {};
        this.miningTarget = null;
        this.miningProgress = 0;
    }

    update(keys, mouse, game) {
        // ... (code de mouvement inchangé)
        
        this.handleActions(keys, mouse, game);
        this.handleTileCollisions(game);
        this.checkEnemyCollisions(game);
        this.checkObjectCollisions(game); // NOUVEAU

        if (this.invulnerable > 0) this.invulnerable--;
        if (this.swingTimer > 0) this.swingTimer--;
    }

    checkObjectCollisions(game) {
        // Pièces
        game.coins.forEach((coin, index) => {
            if (this.rectCollide(coin)) {
                game.score += 10;
                game.coins.splice(index, 1);
            }
        });
        // Bonus
        game.bonuses.forEach((bonus, index) => {
            if (this.rectCollide(bonus)) {
                game.score += 100;
                game.bonuses.splice(index, 1);
            }
        });
        // Checkpoints
        game.checkpoints.forEach(cp => {
            if (!cp.activated && this.rectCollide(cp)) {
                cp.activated = true;
                game.lastCheckpoint = { x: cp.x, y: cp.y };
            }
        });
    }
    
    // ... (le reste des fonctions de player.js reste ici)
}
