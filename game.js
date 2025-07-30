let config, level;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreBoard = document.getElementById('scoreBoard');
const scoreValue = document.getElementById('scoreValue');
const gameOverMenu = document.getElementById('gameOver');

// Sprites
let playerImg = new Image(), coinImg = new Image(), enemyImg = new Image();
playerImg.onload = checkStart;
coinImg.onload = checkStart;
enemyImg.onload = checkStart;
playerImg.src = 'assets/player.png';
coinImg.src = 'assets/coin.png';
enemyImg.src = 'assets/enemy.png';

// Son
let catchSound = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa94ae.mp3');
let loseSound = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12a47e5270.mp3'); // Son de défaite (exemple)

// Charger config et niveau
fetch('config.json').then(r=>r.json()).then(c=>{ config = c; checkStart(); });
fetch('level1.json').then(r=>r.json()).then(l=>{ level = l; checkStart(); });

let ready = 0;
function checkStart() {
  ready++;
  if (ready === 5) startButton.style.display = 'block';
}

// --- État du jeu ---
let player = {}, coin = {}, enemies = [], score = 0, playing = false;

function initGame() {
  player = {
    x: level.playerStart.x,
    y: level.playerStart.y,
    size: config.playerSize || 32
  };
  coin = {
    x: level.coinStart.x,
    y: level.coinStart.y,
    size: config.coinSize || 32
  };
  // Générer les ennemis depuis le niveau
  enemies = (level.enemies || []).map(e => ({
    x: e.x,
    y: e.y,
    size: config.enemySize || 32,
    dx: e.dx || config.enemySpeed || 2, // Vitesse horizontale initiale
    dy: e.dy || 0 // Optionnel, tu peux ajouter des ennemis verticaux dans le JSON
  }));
  score = 0;
  updateScore();
}

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
    gameOverMenu.innerHTML = 'Game Over !<br>Tu as été touché !<br><button id="restartButton">Rejouer</button>';
    loseSound.currentTime = 0;
    loseSound.play();
  } else {
    gameOverMenu.innerHTML = 'Félicitations !<br>Tu as gagné !<br><button id="restartButton">Rejouer</button>';
  }
  gameOverMenu.style.display = 'block';
  canvas.style.display = 'none';
  document.removeEventListener('keydown', onKeyDown);
  // Remettre le listener sur le bouton rejouer
  document.getElementById('restartButton').addEventListener('click', restartGame);
}

function restartGame() {
  startGame();
}

function onKeyDown(e) {
  if (!playing) return;
  let k = e.key.toLowerCase();
  if (k === "arrowup" || k === "z") player.y -= config.playerSpeed;
  if (k === "arrowdown" || k === "s") player.y += config.playerSpeed;
  if (k === "arrowleft" || k === "q") player.x -= config.playerSpeed;
  if (k === "arrowright" || k === "d") player.x += config.playerSpeed;
  // Empêcher de sortir du canvas
  player.x = Math.max(0, Math.min(400 - player.size, player.x));
  player.y = Math.max(0, Math.min(400 - player.size, player.y));
}

function updateScore() {
  scoreValue.textContent = score;
}

// Fonction collision rectangulaire (rapide)
function isColliding(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

function moveEnemies() {
  for (let enemy of enemies) {
    // Mouvement horizontal simple : rebond sur les bords
    enemy.x += enemy.dx;
    enemy.y += enemy.dy;
    if (enemy.x < 0 || enemy.x > 400 - enemy.size) enemy.dx *= -1;
    if (enemy.y < 0 || enemy.y > 400 - enemy.size) enemy.dy *= -1;
  }
}

function gameLoop() {
  if (!playing) return;
  ctx.clearRect(0, 0, 400, 400);
  ctx.fillStyle = config.bgColor || "#171d29";
  ctx.fillRect(0, 0, 400, 400);

  // Pièce
  ctx.drawImage(coinImg, coin.x, coin.y, coin.size, coin.size);

  // Joueur
  ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);

  // Ennemis
  for (let enemy of enemies) {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.size, enemy.size);
  }

  // Collisions
  if (isColliding(player, coin)) {
    score += config.coinScore;
    updateScore();
    catchSound.currentTime = 0;
    catchSound.play();
    // Nouvelle position pour la pièce
    if (level.coinSpawns && level.coinSpawns.length) {
      const sp = level.coinSpawns[Math.floor(Math.random() * level.coinSpawns.length)];
      coin.x = sp.x;
      coin.y = sp.y;
    } else {
      coin.x = Math.floor(Math.random() * (400 - coin.size));
      coin.y = Math.floor(Math.random() * (400 - coin.size));
    }
  }

  // Collision avec un ennemi = Game Over
  for (let enemy of enemies) {
    if (isColliding(player, enemy)) {
      setTimeout(() => endGame(true), 200);
      return;
    }
  }

  // Gagner la partie
  if (score >= (config.winScore || 100)) {
    setTimeout(() => endGame(false), 350);
    return;
  }

  moveEnemies();
  requestAnimationFrame(gameLoop);
}

// Listeners
startButton.addEventListener('click', startGame);
