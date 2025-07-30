let mode = "classic";
let skinIndex = 0;
const skinPaths = [
  "assets/player.png",
  "assets/skin1.png",
  "assets/skin2.png"
];
let LEVELS = [
  { grid: 80, json: 'level1.json' },
  { grid: 100, json: 'level1.json' },
  { grid: 120, json: 'level1.json' }
];
let currentLevel = 0, TAILLE_GRILLE = LEVELS[0].grid, config, level;
let powers = { invincible: 0, slow: 0 };

// SPRITES
let spritePlayer = new Image();
const spriteCoin = new Image(), spriteEnemy = new Image(), spriteBonus = new Image(), spriteWall = new Image();
spritePlayer.src = skinPaths[skinIndex];
spriteCoin.src = "assets/coin.png";
spriteEnemy.src = "assets/enemy.png";
spriteBonus.src = "assets/bonus.png";
spriteWall.src = "assets/wall.png";

// SONS/MUSIQUE
const catchSound = new Audio('assets/powerup.wav'), deathSound = new Audio('assets/death.wav'), bonusSound = new Audio('assets/powerup.wav');
const bgMusic = document.getElementById('bgMusic');

// DOM
const canvas = document.getElementById('pixelCanvas'), ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton'), scoreBoard = document.getElementById('scoreBoard'), scoreValue = document.getElementById('scoreValue');
const highScoreElem = document.getElementById('highScore'), gameOverMenu = document.getElementById('gameOver'), lifeCountElem = document.getElementById('lifeCount'), levelNumElem = document.getElementById('levelNum');
const xpBar = document.getElementById('xpbar-inner'), shopMsg = document.getElementById('shopMsg');
const levelDisplay = document.getElementById('levelDisplay');
canvas.style.display = 'none'; scoreBoard.style.display = 'none'; gameOverMenu.style.display = 'none'; levelDisplay.style.display = 'none';

let loaded = 0, assetsToLoad = 8;
function checkReady() {
  loaded++; 
  if (loaded >= assetsToLoad + 2) startButton.disabled = false;
}
[spritePlayer, spriteCoin, spriteEnemy, spriteBonus, spriteWall].forEach(img => { img.onload = checkReady; img.onerror = checkReady; });
for(let i=1;i<skinPaths.length;i++) {
  let tmp=new Image();
  tmp.src=skinPaths[i];
  tmp.onload=checkReady; tmp.onerror=checkReady;
}
fetch('config.json').then(r=>r.json()).then(c=>{ config = c; checkReady(); });
fetch(LEVELS[0].json).then(r=>r.json()).then(l=>{ level = l; checkReady(); });

let player = {}, coin = {}, enemies = [], bonus = null, score = 0, playing = false, lives = 3, xp = 0, highScore = 0, timer=60;
if(localStorage.getItem("attrape_highscore")) highScore = parseInt(localStorage.getItem("attrape_highscore"));

// MODES DE JEU
function selectMode(m) {
  mode = m;
  document.querySelectorAll("#modes button").forEach(btn=>btn.classList.remove("selected"));
  document.getElementById("mode_" + m).classList.add("selected");
}

// SKINS
function chooseSkin(idx) {
  skinIndex = idx;
  spritePlayer.src = skinPaths[skinIndex];
  document.querySelectorAll('#skins img').forEach((img,i)=>img.classList.toggle("selected", i===skinIndex));
}

// SHOP/XP
function updateXP(val=0) { xp += val; xpBar.style.width = (Math.min(100, (xp%100))) + "%"; }
function buyPower(type) {
  if(type==="invincible" && xp>=30){powers.invincible+=1; xp-=30; shopMsg.innerText="Pouvoir acheté !"; setTimeout(()=>shopMsg.innerText="",1000);}
  else if(type==="slow" && xp>=15){powers.slow+=1; xp-=15; shopMsg.innerText="Pouvoir acheté !"; setTimeout(()=>shopMsg.innerText="",1000);}
  else shopMsg.innerText="Pas assez d'XP !";
  updateXP(0);
}

// DÉCOR MARIO
let bgCloudOffset = 0;
function drawBackground() {
  // Ciel dégradé bleu clair
  let grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0, "#77cfff");
  grad.addColorStop(1, "#e9f5ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Sol (vert)
  ctx.fillStyle = "#79e065";
  ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

  // Buissons arrondis
  for(let i=0; i<canvas.width; i+=120) {
    ctx.beginPath();
    ctx.arc(i+40, canvas.height-40, 25, Math.PI, 2*Math.PI);
    ctx.arc(i+65, canvas.height-40, 20, Math.PI, 2*Math.PI);
    ctx.arc(i+90, canvas.height-40, 15, Math.PI, 2*Math.PI);
    ctx.fillStyle = "#57b54b";
    ctx.fill();
  }
  // Nuages animés
  for(let i=0;i<canvas.width;i+=200){
    let x = (i + 60 + bgCloudOffset) % (canvas.width + 200) - 100;
    ctx.beginPath();
    ctx.arc(x,60,24,Math.PI,2*Math.PI);
    ctx.arc(x+20,64,18,Math.PI,2*Math.PI);
    ctx.arc(x+38,58,15,Math.PI,2*Math.PI);
    ctx.fillStyle="#fff"; ctx.globalAlpha=0.7; ctx.fill(); ctx.globalAlpha=1;
  }
  // Fleurs sur l'herbe
  for(let i=0; i<canvas.width; i+=70) {
    ctx.beginPath();
    ctx.arc(i+25, canvas.height-20, 3, 0, 2*Math.PI);
    ctx.arc(i+30, canvas.height-22, 2, 0, 2*Math.PI);
    ctx.fillStyle = "#ffe";
    ctx.fill();
  }
}

// INIT
function initGame(first=false) {
  TAILLE_GRILLE = LEVELS[currentLevel].grid;
  canvas.width = canvas.height = TAILLE_GRILLE*7;
  player = {...level.playerStart, size: config.playerSize*7};
  coin = {...level.coinStart, size: config.coinSize*7};
  enemies = (level.enemies||[]).map(e=>({...e, size: config.enemySize*7, speed: config.enemySpeed + (currentLevel*0.11)}));
  bonus = null; score = 0; lives = config.lives; timer=60;
  updateScore(); updateHighScore(); updateLives(); updateXP(0); levelNumElem.textContent = currentLevel+1;
  bgMusic.volume=0.20; bgMusic.currentTime=0; bgMusic.play();
  levelDisplay.style.display = "inline-block";
  if(mode=="timed"){timer=40;}
}

function startGame() {
  document.getElementById('mainMenu').style.display = 'none';
  scoreBoard.style.display = 'block'; canvas.style.display = 'block'; gameOverMenu.style.display = 'none';
  playing = true; currentLevel = 0;
  fetch(LEVELS[0].json).then(r=>r.json()).then(l=>{
    level = l; initGame(true); window.focus(); document.addEventListener('keydown', onKeyDown); requestAnimationFrame(gameLoop);
    if(mode=="timed") setTimeout(()=>{playing=false;endGame(true);},timer*1000);
  });
}

function endGame(lost=false) {
  playing = false; bgMusic.pause(); document.removeEventListener('keydown', onKeyDown);
  if(score>highScore){highScore=score;localStorage.setItem("attrape_highscore",highScore);}
  let txt = lost ? (mode=="timed"?"TEMPS ÉCOULÉ !":"GAME OVER !") : 'VICTOIRE !';
  let btn = '<button id="restartButton">REJOUER</button>'; 
  if(!lost && currentLevel<LEVELS.length-1 && mode=="classic") btn += ' <button id="nextLevel">Niveau suivant</button>';
  gameOverMenu.innerHTML = txt+'<br>'+btn; (lost?deathSound:catchSound).play();
  gameOverMenu.style.display = 'block'; canvas.style.display = 'none'; 
  document.getElementById('restartButton').onclick = ()=>{ window.location.reload(); };
  let nextBtn = document.getElementById('nextLevel'); if(nextBtn) nextBtn.onclick = nextLevel;
}

function nextLevel() { 
  currentLevel++; fetch(LEVELS[currentLevel].json).then(r=>r.json()).then(l=>{
    level = l; canvas.style.display='block'; scoreBoard.style.display='block'; gameOverMenu.style.display='none'; playing=true;
    initGame(); window.focus(); document.addEventListener('keydown', onKeyDown); requestAnimationFrame(gameLoop); 
  }); 
}
function updateScore() { scoreValue.textContent=score; }
function updateHighScore() { highScoreElem.textContent=highScore; }
function updateLives() { lifeCountElem.textContent=lives; }

function onKeyDown(e){movePlayer(e.key);}
function movePlayer(k) {
  if(!playing)return; let nx=player.x, ny=player.y;
  if (["ArrowUp","z","Z"].includes(k)) ny -= config.playerSpeed*7;
  if (["ArrowDown","s","S"].includes(k)) ny += config.playerSpeed*7;
  if (["ArrowLeft","q","Q"].includes(k)) nx -= config.playerSpeed*7;
  if (["ArrowRight","d","D"].includes(k)) nx += config.playerSpeed*7;
  if (!isInObstacle(nx,ny,player.size)) {player.x=nx;player.y=ny;}
}
function isColliding(a,b) {return a.x<b.x+b.size && a.x+a.size>b.x && a.y<b.y+b.size && a.y+a.size>b.y;}
function isInObstacle(x,y,size){
  if(!level.obstacles)return false;
  return level.obstacles.some(o=>x+size>o.x*7&&x<o.x*7+o.w*7&&y+size>o.y*7&&y<o.y*7+o.h*7);
}

function moveEnemies() {
  for(let enemy of enemies){
    let speed = enemy.speed*7;
    if(powers.slow>0) speed *= 0.4;
    enemy.x += enemy.dx * speed;
    enemy.y += enemy.dy * speed;
    if (enemy.x<0||enemy.x>canvas.width-enemy.size) enemy.dx*=-1;
    if (enemy.y<0||enemy.y>canvas.height-enemy.size) enemy.dy*=-1;
    if(isInObstacle(enemy.x,enemy.y,enemy.size)) {enemy.dx*=-1;enemy.dy*=-1;}
  }
}

let invincibleFrames=0;
function handleBonus() {
  if (!bonus && Math.random() < (config.bonusFreq || 0.01)) {
    const spawns = (level.bonusSpawns || level.coinSpawns);
    const spawn = spawns[Math.floor(Math.random() * spawns.length)];
    bonus = { x: spawn.x*7, y: spawn.y*7, size: config.bonusSize*7, timer: 250 };
  }
  if (bonus) { bonus.timer--; if (bonus.timer <= 0) bonus = null;}
  if(invincibleFrames>0){invincibleFrames--; if(invincibleFrames==0)powers.invincible=0;}
}

function playerHit() {
  if (powers.invincible || invincibleFrames>0) return;
  lives--; updateLives(); invincibleFrames=60; powers.invincible=0;
  if (lives <= 0) { setTimeout(() => endGame(true), 250); return;}
}
function gameLoop() {
  if(!playing)return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();
  if(level.obstacles){ctx.fillStyle=config.obstacleColor;for(let o of level.obstacles){ctx.fillRect(o.x*7,o.y*7,o.w*7,o.h*7);}}
  ctx.drawImage(spriteCoin,coin.x,coin.y,coin.size,coin.size);
  if(bonus)ctx.drawImage(spriteBonus,bonus.x,bonus.y,bonus.size,bonus.size);
  if(invincibleFrames%8<4) ctx.drawImage(spritePlayer,player.x,player.y,player.size,player.size);
  for(let enemy of enemies) ctx.drawImage(spriteEnemy,enemy.x,enemy.y,enemy.size,enemy.size);

  if(isColliding(player,coin)){
    score+=config.coinScore;updateScore();updateXP(config.xpPerCoin);catchSound.play();
    let sp=level.coinSpawns[Math.floor(Math.random()*level.coinSpawns.length)];
    coin.x=sp.x*7;coin.y=sp.y*7;
  }
  if(bonus && isColliding(player,bonus)){
    score+=config.bonusScore;updateScore();updateXP(config.xpPerBonus);bonusSound.play();bonus=null;
  }
  for(let enemy of enemies) {if(isColliding(player,enemy)) playerHit();}
  if(mode==="classic" && score>=(config.winScore||100)){setTimeout(()=>endGame(false),350);return;}
  moveEnemies(); handleBonus();
  bgCloudOffset += 0.3;
  requestAnimationFrame(gameLoop);
}

startButton.addEventListener('click', startGame);
