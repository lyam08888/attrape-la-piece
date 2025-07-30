// =================================================================================
// SUPER PIXEL ADVENTURE - GAME ENGINE
// =================================================================================

// --- Éléments du DOM ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const elements = {
    score: document.getElementById('score'),
    lives: document.getElementById('lives'),
    timer: document.getElementById('timer'),
    menu: document.getElementById('menu'),
    menuTitle: document.getElementById('menuTitle'),
    skinlist: document.getElementById('skinlist'),
    btnStart: document.getElementById('btnStart'),
    gameover: document.getElementById('gameover'),
    message: document.getElementById('message'),
    btnRestart: document.getElementById('btnRestart'),
    hud: document.getElementById('hud'),
    controls: document.getElementById('controls'),
    btnLeft: document.getElementById('btnLeft'),
    btnJump: document.getElementById('btnJump'),
    btnRight: document.getElementById('btnRight'),
};

// --- Variables globales ---
let config, level, assets = {}, game, keys = {}, currentSkin = 0;

// --- Chargement initial ---
window.onload = async () => {
    try {
        // Charger la configuration et le niveau en parallèle
        const [configRes, levelRes] = await Promise.all([
            fetch('config.json'),
            fetch('level1.json')
        ]);
        config = await configRes.json();
        level = await levelRes.json();
        
        // Appliquer la configuration
        document.title = config.gameTitle;
        canvas.width = config.canvasWidth;
        canvas.height = config.canvasHeight;
        
        // Charger les assets
        await loadAssets();

        // Préparer le menu
        prepareMenu();

    } catch (error) {
        elements.menuTitle.textContent = "Erreur de chargement";
        console.error("Impossible de charger les fichiers du jeu:", error);
    }
};

async function loadAssets() {
    const assetPromises = [];
    const allAssetPaths = [...config.skins, ...Object.values(config.assets)];

    for (const path of allAssetPaths) {
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                assets[path] = img;
                resolve();
            };
            img.onerror = reject;
        });
        assetPromises.push(promise);
    }
    await Promise.all(assetPromises);
}

function prepareMenu() {
    elements.menuTitle.textContent = "Choisissez un héros";
    elements.skinlist.innerHTML = '';
    config.skins.forEach((path, i) => {
        const img = assets[path].cloneNode();
        img.onclick = () => selectSkin(i);
        if (i === currentSkin) img.classList.add("selected");
        elements.skinlist.appendChild(img);
    });
    elements.btnStart.style.display = 'block';
}

function selectSkin(i) {
    currentSkin = i;
    [...elements.skinlist.children].forEach((img, index) => {
        img.classList.toggle("selected", index === i);
    });
}

// --- Logique du jeu ---
function initGame() {
    game = {
        player: {
            x: 50, y: 150, vx: 0, vy: 0,
            w: config.tileSize, h: config.tileSize * 2,
            grounded: false, canDoubleJump: true, dir: 1
        },
        camera: { x: 0 },
        enemies: [],
        tileMap: level.tiles.map(row => row.split('').map(Number)),
        score: 0,
        lives: config.player.maxLives,
        time: config.player.gameTime,
        timeLast: Date.now(),
        over: false,
    };
    
    // Placer les ennemis
    game.tileMap.forEach((row, y) => {
        row.forEach((tile, x) => {
            if (tile === 8) {
                game.enemies.push({ x: x * 16, y: y * 16, w: 16, h: 16, vx: -0.5, vy: 0 });
                game.tileMap[y][x] = 0; // Remplacer la tuile par du vide
            }
        });
    });
    
    updateHUD();
    elements.menu.style.display = "none";
    elements.gameover.style.display = "none";
    elements.hud.style.display = "flex";
    
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (game.over) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Mise à jour et dessin ---
function update() {
    // Logique de mise à jour (joueur, ennemis, etc.)
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Logique de dessin (fond, tuiles, joueur, etc.)
}

function updateHUD() {
    elements.score.textContent = `SCORE: ${game.score}`;
    elements.lives.textContent = `VIES: ${game.lives}`;
    elements.timer.textContent = `TEMPS: ${game.time}`;
}

// --- Gestions des événements ---
elements.btnStart.onclick = initGame;
elements.btnRestart.onclick = initGame;
