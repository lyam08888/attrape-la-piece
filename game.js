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

// WebAudio context pour sons dynamiques
let audioCtx;
function playSound(type) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let o = audioCtx.createOscillator();
  let g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);

  if (type === "powerup") {
    o.type = "triangle";
    o.frequency.setValueAtTime(700, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.14);
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    o.start(); o.stop(audioCtx.currentTime + 0.16);
  }
  else if (type === "death") {
    o.type = "square";
    o.frequency.setValueAtTime(220, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.30);
    g.gain.setValueAtTime(0.22, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.31);
    o.start(); o.stop(audioCtx.currentTime + 0.33);
  }
  else if (type === "bonus") {
    o.type = "sine";
    o.frequency.setValueAtTime(900, audioCtx.currentTime);
    o.frequency.linearRampToValueAtTime(1800, audioCtx.currentTime + 0.15);
    g.gain.setValueAtTime(0.16, audioCtx.currentTime);
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.18);
    o.start(); o.stop(audioCtx.currentTime + 0.2);
  }
}

// Musique de fond "générée" (arpège boucle simple)
let musicPlaying = false;
function playMusic() {
  if (musicPlaying) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let notes = [440, 587, 784, 587, 659, 523, 698, 523]; // petit air "joyeux"
  let t = audioCtx.currentTime;
  for (let i = 0; i < 48; i++) {
    let o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = "square";
    o.frequency.value = notes[i % notes.length];
    o.connect(g); g.connect(audioCtx.destination);
    let start = t + i * 0.18;
    let end = start + 0.15;
    g.gain.setValueAtTime(0.04, start);
    g.gain.linearRampToValueAtTime(0, end);
    o.start(start); o.stop(end);
  }
  musicPlaying = true;
  setTimeout(() => { musicPlaying = false; playMusic(); }, notes.length * 180);
}

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
  levelDisplay.style.display = "inline-block";
  if(mode=="timed"){timer=40;}
  playMusic();
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
  playing = false; document.removeEventListener('keydown', onKeyDown);
  if(score>highScore){highScore=score;localStorage.setItem("attrape_highscore",highScore);}
  let txt = lost ? (mode=="timed"?"TEMPS ÉCOULÉ !":"GAME OVER !") : 'VICTOIRE !';
  let btn = '<button id="restartButton">REJOUER</button>'; 
  if(!lost && currentLevel<LEVELS.length-1 && mode=="classic") btn += ' <button id="nextLevel">Niveau suivant</button>';
  gameOverMenu.innerHTML = txt+'<br>'+btn; playSound(lost?"death":"powerup");
  gameOverMenu.style.display = 'block'; canvas.style.display = 'none'; 
  document.getElementById('restartButton').onclick = ()=>{ window.location.reload(); };
  let nextBtn = document.getElementById('nextLevel'); if(nextBtn) nextBtn.onclick = nextLevel;
}

function nextLevel() { 
  currentLevel++; fetch(LEVELS[currentLevel].json).then(r=>r.json()).then(l=>{
    level = l; canvas.style.display='block'; scoreBoard.style.display='block'; gameOverMenu.style.display='none'; playing=true;
    initGame(); window.focus
