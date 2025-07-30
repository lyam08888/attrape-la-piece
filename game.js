// Config
const TAILLE_GRILLE = 64;

// Chargement des images
const spritePlayer = new Image();
const spriteCoin = new Image();
const spriteEnemy = new Image();
const spriteBonus = new Image();
spritePlayer.src = "assets/player.png";
spriteCoin.src = "assets/coin.png";
spriteEnemy.src = "assets/enemy.png";
spriteBonus.src = "assets/bonus.png";

let config, level;

// Sons
const catchSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_115b7bbd48.mp3');
const bonusSound = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_1114e9d6bc.mp3');
const loseSound = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12a47e5270.mp3');

// Attente chargement
let loaded = 0;
function checkReady() {
  loaded++;
  if (loaded === 6) document.getElementById('startButton').style.display = 'block';
}
spritePlayer.onload = checkReady;
spriteCoin.onload = checkReady;
spriteEnemy.onload = checkReady;
spriteBonus.onload = checkReady;

fetch('config.json').then(r=>r.json()).then(c=>{ config = c; checkReady(); });
fetch('level1.json').then(r=>r.json()).then(l=>{ level = l; checkReady(); });

// DOM refs
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreBoard = document.getElementById('scoreBoard');
const scoreValue = document.getElementById('scoreValue');
const highScoreElem = document.getElementById('highScore');
const gameOverMenu = document.getElementById('gameOver');
canvas.style.display = 'none'; scoreBoard.style.display = 'none'; gameOverMenu.style.display = 'none';

// Vars jeu
let player = {}, coin = {}, enemies = [], bonus = null, score = 0, playing = false, bonusTimer = 0;
let highScore = localStorage.getItem("attrape_highscore") || 0;

// --- Game init
function initGame() {
  player = { x: level.playerStart.x, y: level.playerStart.y, size: config.playerSize };
  coin = { x: level.coinStart.x, y: level.coinStart.y, size: config.coinSize };
  enemies = (level.enemies || []).map(e => ({
    x: e.x, y: e.y, size: config.enemySize,
    dx: e.dx ? Math.sign(e.dx) : 1,
    dy: e.dy ? Math.sign(e.dy) : 0,
    speed: config.enemySpeed + Math.random()
  }));
  bonus = null;
  score = 0;
  bonusTimer = 0;
  updateScore();
  updateHighScore();
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
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("attrape_highscore", highScore);
    updateHighScore();
  }
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
function updateScore() { scoreValue.textContent = score; }
function updateHighScore() { highScoreElem.textContent = highScore; }

// --- Déplacement
function onKeyDown(e) {
  if (!playing) return;
  let k = e.key.toLowerCase();
  if (k === "arrowup" || k === "z") player.y -= config.playerSpeed;
  if (k === "arrowdown" || k === "s") player.y += config.playerSpeed;
  if (k === "arrowleft" || k === "q") player.x -= config.playerSpeed;
  if (k === "arrowright" || k === "d") player.x += config.playerSpeed;
  player.x = Math.max(0, Math.min(TAILLE_GRILLE - player.size, player.x));
  player.y = Math.max(0, Math.min(TAILLE_GRILLE - player.size, player.y));
}

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
    enemy.x += enemy.dx * enemy.speed;
    enemy.y += enemy.dy * enemy.speed;
    if (enemy.x < 0 || enemy.x > TAILLE_GRILLE - enemy.size) enemy.dx *= -1;
    if (enemy.y < 0 || enemy.y > TAILLE_GRILLE - enemy.size) enemy.dy *= -1;
  }
}

// --- Bonus gestion
function handleBonus() {
  if (!bonus && Math.random() < (config.bonusFreq || 0.01)) {
    const spawn = (level.bonusSpawns || level.coinSpawns)[Math.floor(Math.random() * (level.bonusSpawns || level.coinSpawns).length)];
    bonus = { x: spawn.x, y: spawn.y, size: config.bonusSize, timer: 180 };
  }
  if (bonus) {
    bonus.timer--;
    if (bonus.timer <= 0) bonus = null;
  }
}

// --- Game loop
function gameLoop() {
  if (!playing) return;
  ctx.clearRect(0, 0, TAILLE_GRILLE, TAILLE_GRILLE);
  ctx.fillStyle = "#23272e";
  ctx.fillRect(0, 0, TAILLE_GRILLE, TAILLE_GRILLE);

  // Pièce
  ctx.drawImage(spriteCoin, coin.x, coin.y, coin.size, coin.size);
  // Bonus
  if (bonus) ctx.drawImage(spriteBonus, bonus.x, bonus.y, bonus.size, bonus.size);
  // Joueur
  ctx.drawImage(spritePlayer, player.x, player.y, player.size, player.size);
  // Ennemis
  for (let enemy of enemies) ctx.drawImage(spriteEnemy, enemy.x, enemy.y, enemy.size, enemy.size);

  // Collision pièce
  if (isColliding(player, coin)) {
    score += config.coinScore || 10; updateScore();
    catchSound.currentTime = 0; catchSound.play();
    if (level.coinSpawns && level.coinSpawns.length) {
      const sp = level.coinSpawns[Math.floor(Math.random() * level.coinSpawns.length)];
      coin.x = sp.x; coin.y = sp.y;
    } else {
      coin.x = Math.floor(Math.random() * (TAILLE_GRILLE - coin.size));
      coin.y = Math.floor(Math.random() * (TAILLE_GRILLE - coin.size));
    }
  }

  // Collision bonus
  if (bonus && isColliding(player, bonus)) {
    score += config.bonusScore || 50; updateScore();
    bonusSound.currentTime = 0; bonusSound.play();
    bonus = null;
  }

  // Collision ennemis
  for (let enemy of enemies) {
    if (isColliding(player, enemy)) {
      setTimeout(() => endGame(true), 120);
      return;
    }
  }
  // Victoire
  if (score >= (config.winScore || 120)) {
    setTimeout(() => endGame(false), 200); return;
  }
  moveEnemies();
  handleBonus();
  requestAnimationFrame(gameLoop);
}

// --- Start
startButton.addEventListener('click', startGame);
