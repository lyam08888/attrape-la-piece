let config, level;
let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

// Sprites
let playerImg = new Image(), coinImg = new Image();
playerImg.src = 'assets/player.png';
coinImg.src = 'assets/coin.png';

// Son en ligne, pas de fichier local nécessaire
let catchSound = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa94ae.mp3');

// Charger config et niveau
fetch('config.json').then(r=>r.json()).then(c=>{ config = c; checkStart(); });
fetch('level1.json').then(r=>r.json()).then(l=>{ level = l; checkStart(); });

let ready = 0;
function checkStart() { ready++; if (ready===2) startGame(); }

let player = { x:0, y:0, size:32 }, coin = { x:0, y:0, size:32 }, score=0;
function startGame() {
  player.x = level.playerStart.x;
  player.y = level.playerStart.y;
  coin.x = level.coinStart.x;
  coin.y = level.coinStart.y;
  document.addEventListener('keydown', onKeyDown);
  requestAnimationFrame(gameLoop);
}
function onKeyDown(e) {
  if (e.key==="ArrowUp") player.y -= config.playerSpeed;
  if (e.key==="ArrowDown") player.y += config.playerSpeed;
  if (e.key==="ArrowLeft") player.x -= config.playerSpeed;
  if (e.key==="ArrowRight") player.x += config.playerSpeed;
}
function gameLoop() {
  ctx.clearRect(0,0,400,400);
  ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
  ctx.drawImage(coinImg, coin.x, coin.y, coin.size, coin.size);
  ctx.fillStyle = "#fff";
  ctx.font = "18px Arial";
  ctx.fillText('Score: ' + score, 10, 30);
  // Collision
  if (Math.abs(player.x-coin.x)<32 && Math.abs(player.y-coin.y)<32) {
    score += config.coinScore;
    catchSound.currentTime = 0; catchSound.play();
    coin.x = Math.floor(Math.random()*368);
    coin.y = Math.floor(Math.random()*368);
  }
  requestAnimationFrame(gameLoop);
}
