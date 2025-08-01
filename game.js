import { GameEngine } from './engine.js';
import { Player } from './player.js';

// Charge la configuration du jeu
async function loadConfig() {
    const resp = await fetch('config.json');
    return resp.json();
}

// Charge les options depuis localStorage ou options.json
async function loadOptions() {
    const stored = localStorage.getItem('gameOptions');
    if (stored) return JSON.parse(stored);
    const resp = await fetch('options.json');
    return resp.json();
}

function saveOptions(opts) {
    localStorage.setItem('gameOptions', JSON.stringify(opts));
}

document.addEventListener('DOMContentLoaded', async () => {
    const config = await loadConfig();
    const options = await loadOptions();
    Object.assign(config, options);
    const canvas = document.getElementById('gameCanvas');
    const engine = new GameEngine(canvas, config);

    // Références aux éléments du menu Options
    const optionsMenu = document.getElementById('optionsMenu');
    const renderDistanceSlider = document.getElementById('renderDistanceSlider');
    const renderDistanceValue = document.getElementById('renderDistanceValue');
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    const particlesCheckbox = document.getElementById('particlesCheckbox');
    const weatherCheckbox = document.getElementById('weatherCheckbox');
    const lightingCheckbox = document.getElementById('lightingCheckbox');
    const soundSlider = document.getElementById('soundSlider');
    const volumeValue = document.getElementById('volumeValue');

    // Initialise les valeurs du menu avec les options chargées
    renderDistanceSlider.value = config.renderDistance;
    renderDistanceValue.textContent = `${config.renderDistance} chunks`;
    zoomSlider.value = config.zoom;
    zoomValue.textContent = `x${config.zoom}`;
    particlesCheckbox.checked = config.showParticles;
    weatherCheckbox.checked = config.weatherEffects;
    lightingCheckbox.checked = config.dynamicLighting;
    soundSlider.value = config.soundVolume;
    volumeValue.textContent = `${Math.round(config.soundVolume * 100)}%`;

    // Mise à jour de la configuration quand l'utilisateur modifie une option
    renderDistanceSlider.addEventListener('input', () => {
        config.renderDistance = parseInt(renderDistanceSlider.value);
        renderDistanceValue.textContent = `${config.renderDistance} chunks`;
    });
    zoomSlider.addEventListener('input', () => {
        config.zoom = parseFloat(zoomSlider.value);
        zoomValue.textContent = `x${config.zoom}`;
    });
    particlesCheckbox.addEventListener('change', () => {
        config.showParticles = particlesCheckbox.checked;
    });
    weatherCheckbox.addEventListener('change', () => {
        config.weatherEffects = weatherCheckbox.checked;
    });
    lightingCheckbox.addEventListener('change', () => {
        config.dynamicLighting = lightingCheckbox.checked;
    });
    soundSlider.addEventListener('input', () => {
        config.soundVolume = parseFloat(soundSlider.value);
        volumeValue.textContent = `${Math.round(config.soundVolume * 100)}%`;
    });

    const game = { player: null, camera: { x: 0, y: 0 } };

    // Fonctions globales pour le menu Options
    function openOptionsMenu() {
        optionsMenu.classList.add('active');
    }

    function closeOptionsMenu() {
        optionsMenu.classList.remove('active');
        saveOptions({
            zoom: config.zoom,
            renderDistance: config.renderDistance,
            showParticles: config.showParticles,
            weatherEffects: config.weatherEffects,
            dynamicLighting: config.dynamicLighting,
            soundVolume: config.soundVolume
        });
    }

    // Expose pour l'inclusion via l'autre script
    window.openOptionsMenu = openOptionsMenu;
    window.closeOptionsMenu = closeOptionsMenu;

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
            return optionsMenu.classList.contains('active');
        },
        toggleMenu(menu) {
            if (menu === 'options') {
                if (optionsMenu.classList.contains('active')) {
                    closeOptionsMenu();
                } else {
                    openOptionsMenu();
                }
            }
        }
    };

    engine.start(gameLogic);
});
