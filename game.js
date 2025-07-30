let config, level;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreBoard = document.getElementById('scoreBoard');
const scoreValue = document.getElementById('scoreValue');
const gameOverMenu = document.getElementById('gameOver');

// Préparer pour plusieurs tailles
let playerImg = new Image(), coinImg = new Image();
playerImg.onload = checkStart;
coinImg.onload = checkStart;
playerImg.src = 'assets/player.png';
coinImg.src = 'assets/coin.png';

// Son
let catchSound = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa94ae.mp3');

// Charger config et niveau
fetch('config.json').then(r=>r.json()).then(c=>{ config = c; checkStart(); });
fetch('level1.json').then(r=>r.json()).then(l=>{ level = l; checkStart(); });

let ready = 0;
function checkStart() {
  ready++;
  if (ready === 4) startButton.style.display = 'block';
}

let player = {}, coin = {}, score = 0, playing = false;

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
  // Fond de canvas personnalisable
  ctx.fillStyle = config.bgColor || "#171d29";
  ctx.fillRect(0, 0, 400, 400);

  ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
  ctx.drawImage(coinImg, coin.x, coin.y, coin.size, coin.size);

  // Collision : centre à centre
  if (
    Math.abs(player.x + player.size / 2 - (coin.x + coin.size / 2)) < player.size &&
    Math.abs(player.y + player.size / 2 - (coin.y + coin.size / 2)) < player.size
  ) {
    score += config.coinScore;
    updateScore();
    catchSound.currentTime = 0;
    catchSound.play();
    // Nouvelle position dans les spawn prévus ou au hasard
    if (level.coinSpawns && level.coinSpawns.length) {
      const sp = level.coinSpawns[Math.floor(Math.random() * level.coinSpawns.length)];
      coin.x = sp.x;
      coin.y = sp.y;
    } else {
      coin.x = Math.floor(Math.random() * (400 - coin.size));
      coin.y = Math.floor(Math.random() * (400 - coin.size));
    }
  }

  // Victoire : score atteint winScore
  if (score >= (config.winScore || 100)) {
    setTimeout(endGame, 350); // Petite pause avant "Bravo"
    return;
  }

  requestAnimationFrame(gameLoop);
}

// Event listeners
startButton.addEventListener('click', startGame);
if (restartButton) restartButton.addEventListener('click', restartGame);
