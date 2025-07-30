// Chargement des images depuis /assets
const spritePlayer = new Image();
const spriteCoin = new Image();
const spriteEnemy = new Image();
spritePlayer.src = "assets/player.png";
spriteCoin.src = "assets/coin.png";
spriteEnemy.src = "assets/enemy.png";

// Chargement JSON
let config, level;

// Sons (optionnel)
const catchSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_115b7bbd48.mp3');
const loseSound = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12a47e5270.mp3');

// Attendre images + jsons
let loaded = 0;
function checkReady() {
  loaded++;
  if (loaded === 5) document.getElementById('startButton').style.display = 'block';
}
spritePlayer.onload = checkReady;
spriteCoin.onload = checkReady;
spriteEnemy.onload = checkReady;

fetch('config.json').then(r=>r.json()).then(c=>{ config = c; checkReady(); });
fetch('level1.json').then(r=>r.json()).then(l=>{ level = l; checkReady(); });

// --- DOM
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreBoard = document.getElementById('scoreBoard');
const scoreValue = document.getElementById('scoreValue');
const gameOverMenu = document.getElementById('gameOver');
canvas.style.display = 'none';
scoreBoard.style.display = 'none';
gameOverMenu.style.display = 'none';

// --- Game vars
let player = {}, coin = {}, enemies = [], score = 0, playing = false;

// --- Game init
function initGame() {
  player = { x: level.playerStart.x, y: level.playerStart.y, size: config.playerSize };
  coin = { x: level.coinStart.x, y: level.coinStart.y, size: config.coinSize };
  enemies = (level.enemies || []).map(e => ({
    x: e.x,
    y: e.y,
    size: config.enemySize,
    dx: e.dx ? Math.sign(e.dx) : 1,
    dy: e.dy ? Math.sign(e.dy) : 0
  }));
  score = 0;
  updateScore();
}

// --- Menus
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
    loseSound.currentTime = 0; loseSound.play();
  } else {
    gameOverMenu.innerHTML = 'VICTOIRE !<br><button id="restartButton">REJOUER</button>';
  }
  gameOverMenu.style.display = 'block';
  canvas.style.display = 'none';
  document.removeEventListener('keydown', onKeyDown);
  document.getElementById('restartButton').onclick = restartGame;
}
function restartGame() { startGame(); }

// --- Controls
function onKeyDown(e) {
  if (!playing) return;
  let k = e.key.toLowerCase();
  if (k === "arrowup" || k === "z") player.y -= 1;
  if (k === "arrowdown" || k === "s") player.y += 1;
  if (k === "arrowleft" || k === "q") player.x -= 1;
  if (k === "arrowright" || k === "d") player.x += 1;
  player.x = Math.max(0, Math.min(32 - player.size, player.x));
  player.y = Math.max(0, Math.min(32 - player.size, player.y));
}

// --- Affichage score
function updateScore() { scoreValue.textContent = score; }

// --- Collision
function isColliding(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

// --- Mouvements ennemis
function moveEnemies() {
  for (let enemy of enemies) {
    enemy.x += enemy.dx;
    enemy.y += enemy.dy;
    if (enemy.x < 0 || enemy.x > 32 - enemy.size) enemy.dx *= -1;
    if (enemy.y < 0 || enemy.y > 32 - enemy.size) enemy.dy *= -1;
  }
}

// --- Game loop
function gameLoop() {
  if (!playing) return;
  ctx.clearRect(0, 0, 32, 32);
  ctx.fillStyle = "#23272e";
  ctx.fillRect(0, 0, 32, 32);
  ctx.drawImage(spriteCoin, coin.x, coin.y, coin.size, coin.size);
  ctx.drawImage(spritePlayer, player.x, player.y, player.size, player.size);
  for (let enemy of enemies) ctx.drawImage(spriteEnemy, enemy.x, enemy.y, enemy.size, enemy.size);

  // Collision pièce
  if (isColliding(player, coin)) {
    score += config.coinScore || 10; updateScore();
    catchSound.currentTime = 0; catchSound.play();
    if (level.coinSpawns && level.coinSpawns.length) {
      const sp = level.coinSpawns[Math.floor(Math.random() * level.coinSpawns.length)];
      coin.x = sp.x; coin.y = sp.y;
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
    setTimeout(() => endGame(false), 200); return;
  }
  moveEnemies();
  requestAnimationFrame(gameLoop);
}

// --- Start
startButton.addEventListener('click', startGame);
