// ----- Sprites pixel art (en base64) -----
const spritePlayer = new Image();
spritePlayer.src =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAABiFBMVEUAAABX9vrU+PbU+PXU+PXU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbU+PbX///9h8ruuAAAAxHRSTlMAAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzU3ODk6Ozw9P0BBQkNERUdISUpLTE1QUVJTVFVWV1hZWltcXV5gYWJjZGdmZ2hobG1ub3BxcnN0dXZ3eHh5enx8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3uDh4uPk5ebn6Onq6+zt7vDx8vP09fb3+Pn6+/z9l08gWQAAAKpJREFUGJVjYAADY2BgZGJg5GRgYGBk4GBgaWxgZEFGBkYGRhZGBgYQmBkbGZgYGRgYGcgcmRgYGAGiwULIKoxF3USpA7E2TICgNCrEN9EyJ0Sm5UQCg7kGZmAEVHo9EA5l3YUEjR8CsLqhIxJUAGQG8S9AAL+BQXQAygnCRSoHqEQkTQwAbGRCkGJxChA0Ik4GIAACKDQLR1dQlmAAAAABJRU5ErkJggg==";
const spriteCoin = new Image();
spriteCoin.src =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAVFBMVEUAAABmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmbfZ5hAAAAAXRSTlMAQObYZgAAAEZJREFUGJVjYEADMjAwYGBgaGRgYGBwZGAgBgYGdgAAowgAEYwYJgGUyDTWwZDAYDCrKAAAvlQwA8ZAS9QAAAABJRU5ErkJggg==";
const spriteEnemy = new Image();
spriteEnemy.src =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAABXFBMVEUAAADr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eLr4eL///8jEabxAAAAe3RSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNTc4OTo7PD0/QEFCQ0RFRkdISUpLTE1QUVJTVFVWV1hZWltcXV5gYWJjZGdmZ2hobG1ub3BxcnN0dXZ3eHh5enx8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3uDh4uPk5ebn6Onq6+zt7vDx8vP09fb3+Pn6+/z9IpdLwQAAAKFJREFUGJVjYIADMiZGNgYDAwMjAwYGBkYGZgZGBgZGNgYGQwZ2BgZGJg5KBgZ2BgZGpgYGQwZ2BgZGJg4JY2OgE5SRDCkoDZkZjkmYKBmQZkZmCwIGhFoA4gYlZlQDoRgDggZiY0QzoToICQvYIzQiAwoJUw4iEBFgtpLgYg1o5AeC8wTAwMAAAJ0pwN9kRnjUAAAAASUVORK5CYII=";

// ----- Config -----
let config, level;

// ----- HTML refs -----
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreBoard = document.getElementById('scoreBoard');
const scoreValue = document.getElementById('scoreValue');
const gameOverMenu = document.getElementById('gameOver');

canvas.style.display = 'none';
scoreBoard.style.display = 'none';
gameOverMenu.style.display = 'none';

// Sons retro (8bits)
const catchSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_115b7bbd48.mp3');
const loseSound = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12a47e5270.mp3');

// Chargement des assets (images) et fichiers JSON AVANT d'activer le bouton démarrer
let imagesReady = 0;
[spritePlayer, spriteCoin, spriteEnemy].forEach(img => {
  img.onload = () => {
    imagesReady++;
    showButtonIfReady();
  };
});

let configReady = false, levelReady = false;

fetch('config.json').then(r=>r.json()).then(c=>{
  config = c;
  configReady = true;
  showButtonIfReady();
});
fetch('level1.json').then(r=>r.json()).then(l=>{
  level = l;
  levelReady = true;
  showButtonIfReady();
});

function showButtonIfReady() {
  if (imagesReady === 3 && configReady && levelReady) {
    startButton.style.display = 'block';
  }
}

// ----- Variables de jeu -----
let player = {}, coin = {}, enemies = [], score = 0, playing = false;

// ----- Initialisation -----
function initGame() {
  player = {
    x: level.playerStart.x,
    y: level.playerStart.y,
    size: config.playerSize || 3
  };
  coin = {
    x: level.coinStart.x,
    y: level.coinStart.y,
    size: config.coinSize || 3
  };
  enemies = (level.enemies || []).map(e => ({
    x: e.x,
    y: e.y,
    size: config.enemySize || 3,
    dx: e.dx ? Math.sign(e.dx) : 1,
    dy: e.dy ? Math.sign(e.dy) : 0
  }));
  score = 0;
  updateScore();
}

// ----- Gestion menus -----
function startGame() {
  document.getElementById('startMenu').style.display = 'none';
  gameOverMenu.style.display = 'none';
  canvas.style.display = 'block';
  scoreBoard.style.display = 'block';
  playing = true;
  initGame();
  window.focus();
  document.addEventListener('keydown', onKeyDown);
  requestAnimationFrame(gameLoop);
}

function endGame(lost = false) {
  playing = false;
  if (lost) {
    gameOverMenu.innerHTML = 'GAME OVER !<br><button id="restartButton">REJOUER</button>';
    loseSound.currentTime = 0;
    loseSound.play();
  } else {
    gameOverMenu.innerHTML = 'VICTOIRE !<br><button id="restartButton">REJOUER</button>';
  }
  gameOverMenu.style.display = 'block';
  canvas.style.display = 'none';
  document.removeEventListener('keydown', onKeyDown);
  document.getElementById('restartButton').onclick = restartGame;
}

function restartGame() {
  startGame();
}

// ----- Déplacements -----
function onKeyDown(e) {
  if (!playing) return;
  let k = e.key.toLowerCase();
  if (k === "arrowup" || k === "z") player.y -= 1;
  if (k === "arrowdown" || k === "s") player.y += 1;
  if (k === "arrowleft" || k === "q") player.x -= 1;
  if (k === "arrowright" || k === "d") player.x += 1;
  // Empêcher de sortir du canvas
  player.x = Math.max(0, Math.min(32 - player.size, player.x));
  player.y = Math.max(0, Math.min(32 - player.size, player.y));
}

// ----- Affichage score -----
function updateScore() {
  scoreValue.textContent = score;
}

// ----- Collision -----
function isColliding(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

// ----- Mouvements ennemis -----
function moveEnemies() {
  for (let enemy of enemies) {
    enemy.x += enemy.dx;
    enemy.y += enemy.dy;
    // Rebond horizontal/vertical pixelisé
    if (enemy.x < 0 || enemy.x > 32 - enemy.size) enemy.dx *= -1;
    if (enemy.y < 0 || enemy.y > 32 - enemy.size) enemy.dy *= -1;
  }
}

// ----- GAME LOOP -----
function gameLoop() {
  if (!playing) return;

  // Effacer canvas
  ctx.clearRect(0, 0, 32, 32);
  // Fond rétro
  ctx.fillStyle = "#23272e";
  ctx.fillRect(0, 0, 32, 32);

  // Pièce
  ctx.drawImage(spriteCoin, coin.x, coin.y, coin.size, coin.size);

  // Joueur
  ctx.drawImage(spritePlayer, player.x, player.y, player.size, player.size);

  // Ennemis
  for (let enemy of enemies) {
    ctx.drawImage(spriteEnemy, enemy.x, enemy.y, enemy.size, enemy.size);
  }

  // Collision pièce
  if (isColliding(player, coin)) {
    score += config.coinScore || 10;
    updateScore();
    catchSound.currentTime = 0;
    catchSound.play();
    // Nouvelle position aléatoire (sur la grille)
    if (level.coinSpawns && level.coinSpawns.length) {
      const sp = level.coinSpawns[Math.floor(Math.random() * level.coinSpawns.length)];
      coin.x = sp.x;
      coin.y = sp.y;
    } else {
      coin.x = Math.floor(Math.random() * (32 - coin.size));
      coin.y = Math.floor(Math.random() * (32 - coin.size));
    }
  }

  // Collision ennemis
  for (let enemy of enemies) {
    if (isColliding(player, enemy)) {
      setTimeout(() => endGame(true), 120);
      return;
    }
  }

  // Victoire
  if (score >= (config.winScore || 50)) {
    setTimeout(() => endGame(false), 200);
    return;
  }

  moveEnemies();
  requestAnimationFrame(gameLoop);
}

// ----- Listeners -----
startButton.addEventListener('click', startGame);
