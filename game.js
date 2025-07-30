let config, level;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreBoard = document.getElementById('scoreBoard');
const scoreValue = document.getElementById('scoreValue');
const gameOverMenu = document.getElementById('gameOver');

startButton.style.display = 'none';
canvas.style.display = 'none';
scoreBoard.style.display = 'none';
gameOverMenu.style.display = 'none';

// Sprites
let playerImg = new Image(), coinImg = new Image();
playerImg.onload = checkStart;
coinImg.onload = checkStart;
playerImg.src = 'assets/player.png';
coinImg.src = 'assets/coin.png';

// Son en ligne, pas de fichier local nécessaire
let catchSound = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa94ae.mp3');

// Charger config et niveau
fetch('config.json').then(r=>r.json()).then(c=>{ config = c; checkStart(); });
fetch('level1.json').then(r=>r.json()).then(l=>{ level = l; checkStart(); });

let ready = 0;
function checkStart() {
  ready++;
  if (ready === 4) {
    startButton.style.display = 'block';
  }
}

// --- Game state ---
let player = { x: 0, y: 0, size: 32 };
let coin = { x: 0, y: 0, size: 32 };
let score = 0;
let playing = false;

function startGame() {
  // Reset state
  document.getElementById('startMenu').style.display = 'none';
  gameOverMenu.style.display = 'none';
  canvas.style.display = 'block';
  scoreBoard.style.display = 'block';
  score = 0;
  updateScore();
  player.x = level.playerStart.x;
  player.y = level.playerStart.y;
  coin.x = level.coinStart.x;
  coin.y = level.coinStart.y;
  playing = true;
  window.focus();
  document.addEventListener('keydown', onKeyDown);
  requestAnimationFrame(gameLoop);
}

function endGame() {
  playing = false;
  gameOverMenu.style.display = 'block';
  canvas.style.display = 'none';
  document.removeEventListener('keydown', onKeyDown);
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

function gameLoop() {
  if (!playing) return;
  ctx.clearRect(0, 0, 400, 400);
  ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
  ctx.drawImage(coinImg, coin.x, coin.y, coin.size, coin.size);

  // Collision (améliorée, centre à centre)
  if (
    Math.abs(player.x + player.size / 2 - (coin.x + coin.size / 2)) < player.size &&
    Math.abs(player.y + player.size / 2 - (coin.y + coin.size / 2)) < player.size
  ) {
    score += config.coinScore;
    updateScore();
    catchSound.currentTime = 0;
    catchSound.play();
    // Nouvelle position aléatoire (dans les bords)
    coin.x = Math.floor(Math.random() * (400 - coin.size));
    coin.y = Math.floor(Math.random() * (400 - coin.size));
  }

  // Exemple de condition de fin (score 10)
  if (score >= 10) {
    setTimeout(endGame, 250); // Petite pause avant d’afficher le game over
    return;
  }

  requestAnimationFrame(gameLoop);
}

// --- Event listeners ---
startButton.addEventListener('click', startGame);
if (restartButton) restartButton.addEventListener('click', restartGame);
