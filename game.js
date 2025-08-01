import { GameEngine } from './engine.js';
import { Player } from './player.js';

// Charge la configuration du jeu
async function loadConfig() {
    const resp = await fetch('config.json');
    return resp.json();
}

document.addEventListener('DOMContentLoaded', async () => {
    const config = await loadConfig();
    const canvas = document.getElementById('gameCanvas');
    const engine = new GameEngine(canvas, config);

    const game = { player: null, camera: { x: 0, y: 0 } };

    const gameLogic = {
        init(assets) {
            game.player = new Player(50, 50, config, null);
        },
        update(keys, mouse) {
            if (!game.player) return;
            game.player.update(keys, mouse, game);
            game.camera.x = game.player.x - canvas.clientWidth / (2 * config.zoom);
            game.camera.y = game.player.y - canvas.clientHeight / (2 * config.zoom);
        },
        draw(ctx, assets) {
            ctx.fillStyle = '#5c94fc';
            ctx.fillRect(0, 0, canvas.clientWidth / config.zoom, canvas.clientHeight / config.zoom);
            if (game.player) {
                ctx.save();
                ctx.translate(-game.camera.x, -game.camera.y);
                game.player.draw(ctx, assets, 'player1');
                ctx.restore();
            }
        },
        isPaused() {
            return false;
        }
    };

    engine.start(gameLogic);
});
