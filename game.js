// --- CONFIGURATION GLOBALE ---
let mode = "classic";
let LEVELS = [
  { grid: 80, json: 'level1.json' },
  { grid: 100, json: 'level1.json' },
  { grid: 120, json: 'level1.json' }
];
let currentLevel = 0, TAILLE_GRILLE = LEVELS[0].grid, config, level;
let powers = { invincible: 0, slow: 0 };

// --- SPRITES ---
const skinPaths = ["assets/player.png", "assets/skin1.png", "assets/skin2.png"];
let skinIndex = 0;
const spritePlayer = new Image(), spriteCoin = new Image(), spriteEnemy = new Image(), spriteBonus = new Image(), spriteWall = new Image();
spritePlayer.src = skinPaths[skinIndex]; spriteCoin.src = "assets/coin.png"; spriteEnemy.src = "assets/enemy.png";
spriteBonus.src = "assets/bonus.png"; spriteWall.src = "assets/wall.png";

// --- SONS/MUSIQUE ---
const catchSound = new Audio('assets/powerup.wav'), deathSound = new Audio('assets/death.wav'), bonusSound = new Audio('assets/powerup.wav');
const bgMusic = document.getElementById('bgMusic');

// --- DOM ---
const canvas = document.getElementById('pixelCanvas'), ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton'), scoreBoard = document.getElementById('scoreBoard'), scoreValue = document.getElementById('scoreValue');
const highScoreElem = document.getElementById('highScore'), gameOverMenu = document.getElementById('gameOver'), lifeCountElem = document.getElementById('lifeCount'), levelNumElem = document.getElementById('levelNum');
const xpBar = document.getElementById('xpbar-inner'), leaderboardList = document.getElementById('leaderList');
canvas.style.display = 'none'; scoreBoard.style.display = 'none'; gameOverMenu.style.display = 'none';

// --- MOBILE TOUCHES ---
document.getElementById('mobileControls').style.display = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'block':'none';

let loaded = 0;
function checkReady() { loaded++; if (loaded >= 7) startButton.style.display = 'block'; }
[spritePlayer,spriteCoin,spriteEnemy,spriteBonus,spriteWall].forEach(img=>img.onload=checkReady);
fetch('config.json').then(r=>r.json()).then(c=>{ config = c; checkReady(); });
fetch(LEVELS[0].json).then(r=>r.json()).then(l=>{ level = l; checkReady(); });

// --- JEU VARS ---
let player = {}, coin = {}, enemies = [], bonus = null, score = 0, playing = false, lives = 3, xp = 0, highScore = 0;
if(localStorage.getItem("attrape_highscore")) highScore = parseInt(localStorage.getItem("attrape_highscore"));

// --- MODES DE JEU ---
function selectMode(m) { mode = m; }
function updateXP(val) { xp += val; xpBar.style.width = (Math.min(100, (xp%100))) + "%"; }
function buyPower(type) {
  if(type==="invincible" && xp>=30){powers.invincible+=1; xp-=30;}
  if(type==="slow" && xp>=15){powers.slow+=1; xp-=15;}
  updateXP(0);
}

// --- SKINS ---
function chooseSkin(i) {
  skinIndex = i; spritePlayer.src = skinPaths[skinIndex];
  [...document.querySelectorAll("#skins img")].forEach(img=>img.classList.remove("selected"));
  document.getElementById('skin'+i).classList.add("selected");
}

// --- INIT ---
function initGame(first=false) {
  TAILLE_GRILLE = LEVELS[currentLevel].grid;
  canvas.width = canvas.height = TAILLE_GRILLE;
  player = {...level.playerStart, size: config.playerSize};
  coin = {...level.coinStart, size: config.coinSize};
  enemies = (level.enemies||[]).map(e=>({...e, size: config.enemySize, speed: config.enemySpeed + (currentLevel*0.11)}));
  bonus = null; score = 0; lives = config.lives; updateScore(); updateHighScore(); updateLives(); updateXP(0); levelNumElem.textContent = currentLevel+1;
  bgMusic.volume=0.20; bgMusic.currentTime=0; bgMusic.play();
}

function startGame() {
  currentLevel = 0; fetch(LEVELS[0].json).then(r=>r.json()).then(l=>{
    level = l; document.getElementById('startMenu').style.display = 'none';
    gameOverMenu.style.display = 'none'; canvas.style.display = 'block'; scoreBoard.style.display = 'block'; playing = true;
    initGame(true); window.focus(); document.addEventListener('keydown', onKeyDown); requestAnimationFrame(gameLoop);
  });
}

function endGame(lost=false) {
  playing = false; bgMusic.pause();
  if(score>highScore){highScore=score;localStorage.setItem("attrape_highscore",highScore);}
  let txt = lost ? 'GAME OVER !' : 'VICTOIRE !';
  let btn = '<button id="restartButton">REJOUER</button>'; 
  if(!lost && currentLevel<LEVELS.length-1) btn += ' <button id="nextLevel">Niveau suivant</button>';
  gameOverMenu.innerHTML = txt+'<br>'+btn; (lost?deathSound:catchSound).play();
  gameOverMenu.style.display = 'block'; canvas.style.display = 'none'; document.removeEventListener('keydown', onKeyDown);
  document.getElementById('restartButton').onclick = startGame;
  let nextBtn = document.getElementById('nextLevel'); if(nextBtn) nextBtn.onclick = nextLevel;
}

function nextLevel() { currentLevel++; fetch(LEVELS[currentLevel].json).then(r=>r.json()).then(l=>{ level = l; canvas.width=canvas.height=LEVELS[currentLevel].grid; playing=true; gameOverMenu.style.display='none'; canvas.style.display='block'; scoreBoard.style.display='block'; initGame(); window.focus(); document.addEventListener('keydown', onKeyDown); requestAnimationFrame(gameLoop); }); }
function updateScore() { scoreValue.textContent=score; }
function updateHighScore() { highScoreElem.textContent=highScore; }
function updateLives() { lifeCountElem.textContent=lives; }

// --- CONTROLS & COLLISIONS ---
function onKeyDown(e){movePlayer(e.key);}
function mobileMove(dir){const kmap={up:"ArrowUp",down:"ArrowDown",left:"ArrowLeft",right:"ArrowRight"};movePlayer(kmap[dir]);}
function movePlayer(k) {
  if(!playing)return; let nx=player.x, ny=player.y;
  if (["ArrowUp","z","Z"].includes(k)) ny -= config.playerSpeed;
  if (["ArrowDown","s","S"].includes(k)) ny += config.playerSpeed;
  if (["ArrowLeft","q","Q"].includes(k)) nx -= config.playerSpeed;
  if (["ArrowRight","d","D"].includes(k)) nx += config.playerSpeed;
  if (!isInObstacle(nx,ny,player.size)) {player.x=nx;player.y=ny;}
}
function isColliding(a,b) {return a.x<b.x+b.size && a.x+a.size>b.x && a.y<b.y+b.size && a.y+a.size>b.y;}
function isInObstacle(x,y,size){
  if(!level.obstacles)return false;
  return level.obstacles.some(o=>x+size>o.x&&x<o.x+o.w&&y+size>o.y&&y<o.y+o.h);
}

// --- ENNEMIS + ACCÉLÉRATION ---
function moveEnemies() {
  for(let enemy of enemies){
    let speed = enemy.speed;
    if(powers.slow>0) speed *= 0.4;
    enemy.x += enemy.dx * speed;
    enemy.y += enemy.dy * speed;
    if (enemy.x<0||enemy.x>TAILLE_GRILLE-enemy.size) enemy.dx*=-1;
    if (enemy.y<0||enemy.y>TAILLE_GRILLE-enemy.size) enemy.dy*=-1;
    if(isInObstacle(enemy.x,enemy.y,enemy.size)) {enemy.dx*=-1;enemy.dy*=-1;}
  }
}

// --- BONUS/POUVOIRS TEMPORAIRES ---
let invincibleFrames=0;
function handleBonus() {
  if (!bonus && Math.random() < (config.bonusFreq || 0.01)) {
    const spawns = (level.bonusSpawns || level.coinSpawns);
    const spawn = spawns[Math.floor(Math.random() * spawns.length)];
    bonus = { x: spawn.x, y: spawn.y, size: config.bonusSize, timer: 250 };
  }
  if (bonus) { bonus.timer--; if (bonus.timer <= 0) bonus = null;}
  if(invincibleFrames>0){invincibleFrames--; if(invincibleFrames==0)powers.invincible=0;}
}

// --- JEU PRINCIPAL ---
function playerHit() {
  if (powers.invincible || invincibleFrames>0) return;
  lives--; updateLives(); invincibleFrames=60; powers.invincible=0;
  if (lives <= 0) { setTimeout(() => endGame(true), 250); return;}
  // anim mort : clignote
}
function gameLoop() {
  if(!playing)return;
  ctx.clearRect(0,0,TAILLE_GRILLE,TAILLE_GRILLE);
  ctx.fillStyle="#23272e";ctx.fillRect(0,0,TAILLE_GRILLE,TAILLE_GRILLE);
  // Obstacles/murs
  if(level.obstacles){ctx.fillStyle=config.obstacleColor;for(let o of level.obstacles){ctx.fillRect(o.x,o.y,o.w,o.h);}}
  // Pièce, Bonus, Joueur, Ennemis
  ctx.drawImage(spriteCoin,coin.x,coin.y,coin.size,coin.size);
  if(bonus)ctx.drawImage(spriteBonus,bonus.x,bonus.y,bonus.size,bonus.size);
  if(invincibleFrames%8<4) ctx.drawImage(spritePlayer,player.x,player.y,player.size,player.size); // blink anim mort
  for(let enemy of enemies) ctx.drawImage(spriteEnemy,enemy.x,enemy.y,enemy.size,enemy.size);

  // Collisions
  if(isColliding(player,coin)){score+=config.coinScore;updateScore();updateXP(config.xpPerCoin);catchSound.play();let sp=level.coinSpawns[Math.floor(Math.random()*level.coinSpawns.length)];coin.x=sp.x;coin.y=sp.y;}
  if(bonus && isColliding(player,bonus)){score+=config.bonusScore;updateScore();updateXP(config.xpPerBonus);bonusSound.play();bonus=null;}
  for(let enemy of enemies) {if(isColliding(player,enemy)) playerHit();}
  // Victoire
  if(mode==="classic" && score>=(config.winScore||100)){setTimeout(()=>endGame(false),350);return;}
  moveEnemies(); handleBonus(); requestAnimationFrame(gameLoop);
}

// --- LEADERBOARD (fake data + hook Firebase/Supabase) ---
function loadLeaderboard(){
  // Si tu utilises Firebase/Supabase, récupère ici puis:
  leaderboardList.innerHTML = '<li>Lyes: 400</li><li>Guest: 280</li><li>Toto: 210</li>'; // Exemple
}

// --- UI ---
startButton.addEventListener('click', startGame);
window.onload = loadLeaderboard;
