const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hudScore = document.getElementById('score');
const btnRestart = document.getElementById('btnRestart');
const btnStart = document.getElementById('btnStart');
const menuDiv = document.getElementById('menu');
const skinList = document.getElementById('skinlist');
const gameoverDiv = document.getElementById('gameover');
const msgEnd = document.getElementById('message');
const hudDiv = document.getElementById('hud');
const controlsDiv = document.getElementById('controls');

const GRAVITY = 0.32, JUMP = 5.2, SPEED = 2.3, FRICTION = 0.81;
const WORLD_W = 3000, WORLD_H = 224;
let PAUSED = false, IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

let skinNames = ["player1","player2","player3"];
let skinImgs = {}, images = {}, allImagesLoaded = 0;
let imagesToLoad = 7;

skinNames.forEach(name => {
  skinImgs[name] = new Image();
  skinImgs[name].src = `assets/${name}.png`;
  skinImgs[name].onload = countLoaded;
});
["coin","enemy","flag"].forEach(name => {
  images[name] = new Image();
  images[name].src = `assets/${name}.png`;
  images[name].onload = countLoaded;
});

function countLoaded(){ allImagesLoaded++; if(allImagesLoaded>=imagesToLoad) prepareMenu(); }

let currentSkin = 0;
function prepareMenu(){
  skinList.innerHTML = '';
  skinNames.forEach((name, i) => {
    let img = document.createElement("img");
    img.src = skinImgs[name].src;
    img.onclick = ()=>selectSkin(i);
    img.id = "skin" + i;
    if(i==currentSkin) img.classList.add("selected");
    skinList.appendChild(img);
  });
}
function selectSkin(i){
  currentSkin = i;
  [...document.querySelectorAll("#skinlist img")].forEach(im=>im.classList.remove("selected"));
  document.getElementById('skin'+i).classList.add("selected");
}

let PARALLAX_COUNT = 7;
let game, keys = {};
document.addEventListener('keydown', function(e){
  if(e.code==="KeyP"){PAUSED=!PAUSED;}
  else keys[e.code]=true;
});
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

if(IS_MOBILE) controlsDiv.style.display="flex";
function mobileKey(k){ keys[k]=true; setTimeout(()=>{keys[k]=false},150); }

btnStart.onclick = ()=>{
  menuDiv.style.display="none";
  hudDiv.style.display="block";
  startGame();
  if(IS_MOBILE) controlsDiv.style.display="flex";
}
btnRestart.onclick = ()=>{
  gameoverDiv.style.display="none";
  hudDiv.style.display="block";
  startGame();
  if(IS_MOBILE) controlsDiv.style.display="flex";
};

function startGame() {
  PAUSED = false;
  game = {
    camX: 0,
    player: {x:30, y:160, vx:0, vy:0, w:24, h:24, grounded:false, frame:0, dir:1, dead:false, win:false},
    coins: [],
    enemies: [],
    platforms: [],
    score: 0,
    over: false,
    flag: {x:WORLD_W-50, y:175, w:24, h:24},
    flagAnim: 0
  };
  game.platforms.push({x:0, y:204, w:WORLD_W, h:24});
  game.platforms.push(
    {x:70, y:170, w:40, h:7},{x:155, y:140, w:44, h:7},{x:320, y:120, w:40, h:7},
    {x:440, y:80, w:30, h:7},{x:600, y:160, w:30, h:7},{x:880, y:108, w:40, h:7},
    {x:1200, y:140, w:36, h:7},{x:1400, y:90, w:35, h:7},
    {x:1700, y:145, w:32, h:7},{x:2000, y:110, w:40, h:7},{x:2450, y:180, w:40, h:7}
  );
  game.coins = [
    {x:82, y:140},{x:330, y:90},{x:610, y:130},{x:900, y:78},{x:1215, y:110},{x:1440, y:65},
    {x:1715, y:115},{x:2020, y:80},{x:2470, y:150},{x:1800, y:95},{x:200, y:40}
  ];
  game.enemies = [
    {x:420, y:188, w:24, h:24, dir:1, vx:0.7},
    {x:1200, y:124, w:24, h:24, dir:-1, vx:0.9},
    {x:2100, y:188, w:24, h:24, dir:1, vx:0.9}
  ];
  game.camX = 0;
  hudScore.textContent = 0;
  gameoverDiv.style.display = "none";
  msgEnd.innerHTML = "";
  requestAnimationFrame(loop);
}

function loop() {
  if (game.over) return;
  if(PAUSED) { drawPause(); requestAnimationFrame(loop); return; }
  update();
  draw();
  requestAnimationFrame(loop);
}
function update() {
  let p = game.player;
  if (keys["ArrowLeft"]) { p.vx = -SPEED; p.dir = -1; }
  else if (keys["ArrowRight"]) { p.vx = SPEED; p.dir = 1; }
  else p.vx *= FRICTION;
  if ((keys["Space"] || keys["ArrowUp"]) && p.grounded) {
    p.vy = -JUMP; p.grounded = false;
  }
  p.vy += GRAVITY;
  p.x += p.vx;
  p.y += p.vy;
  p.grounded = false;
  for(let plat of game.platforms){
    if (rectCollide(p, plat)) {
      if (p.vy > 0 && p.y + p.h - p.vy <= plat.y+3) {
        p.y = plat.y - p.h; p.vy = 0; p.grounded = true;
      } else if (p.y < plat.y + plat.h && p.vy < 0) {
        p.y = plat.y + plat.h; p.vy = 0;
      }
    }
  }
  if (p.x < 0) p.x = 0;
  if (p.x > WORLD_W-p.w) p.x = WORLD_W-p.w;
  if (p.y > 600 && !p.win) die(false);
  game.camX = Math.max(0, Math.min(p.x - 120, WORLD_W-canvas.width));
  for(let i=game.coins.length-1;i>=0;i--) {
    let c = game.coins[i];
    if (rectCollide({x:c.x,y:c.y,w:24,h:24}, p)) {
      playCoinSound();
      game.score += 10;
      hudScore.textContent = game.score;
      game.coins.splice(i,1);
    }
  }
  if (Math.abs(p.vx)>0.4 && p.grounded) p.frame = (p.frame+1)%20;
  else p.frame = 0;
  for(let e of game.enemies){
    e.x += e.vx*e.dir;
    let plat = game.platforms.find(pl=>rectCollide({...e,y:e.y+1},pl));
    if (!plat) e.dir*=-1;
    if (e.x < 0) e.dir = 1;
    if (e.x > WORLD_W-e.w) e.dir = -1;
    if (rectCollide(e,p) && !p.dead && !p.win) {
      if (p.vy > 0 && p.y+0.7*p.h < e.y+8) {
        game.enemies.splice(game.enemies.indexOf(e),1);
        p.vy = -3.5;
      } else die(false);
    }
  }
  // Drapeau animé
  game.flagAnim++;
  if (!p.win && rectCollide(game.flag, p)) {
    p.win = true; win();
  }
}
function die(win) {
  game.player.dead = true;
  game.over = true;
  msgEnd.innerHTML = win ? "Bravo, tu as gagné ! <br>Score final : " + game.score : "Perdu !";
  setTimeout(()=>{ gameoverDiv.style.display="block"; hudDiv.style.display="none"; controlsDiv.style.display="none"; },450);
}
function win() { die(true); }

function drawPause(){
  draw();
  ctx.save();
  ctx.fillStyle="#111b";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#ffe01b";
  ctx.font="bold 40px monospace";
  ctx.fillText("PAUSE",canvas.width/2-70,canvas.height/2-10);
  ctx.restore();
}
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let layer=0; layer<PARALLAX_COUNT; layer++){
    let speed = 0.15 + 0.13*layer;
    ctx.save();
    ctx.translate(-game.camX*speed,0);
    if(layer==0){ for(let i=0;i<WORLD_W;i+=130){ ctx.fillStyle="#cee3f7";
      ctx.beginPath();ctx.moveTo(i,184);ctx.lineTo(i+55,90);ctx.lineTo(i+110,184);ctx.closePath();ctx.fill();
    }}
    else if(layer==1){ for(let i=0;i<WORLD_W;i+=110){ ctx.fillStyle="#7fd0e7";
      ctx.beginPath();ctx.arc(i+38,175,38,Math.PI,2*Math.PI);ctx.fill();
    }}
    else if(layer==2){ for(let i=0;i<WORLD_W;i+=42){ ctx.fillStyle="#176c32";
      ctx.beginPath();ctx.arc(i+19,196,16,Math.PI,2*Math.PI);ctx.arc(i+36,193,10,Math.PI,2*Math.PI);ctx.fill();
    }}
    else if(layer==3){ for(let i=0;i<WORLD_W;i+=55){ ctx.fillStyle="#35c77e";
      ctx.beginPath();ctx.arc(i+22,191,10,Math.PI,2*Math.PI);ctx.arc(i+30,189,8,Math.PI,2*Math.PI);ctx.fill();
    }}
    else if(layer==4){ for(let i=0;i<WORLD_W;i+=110){
      let cy=42+13*(i%3);ctx.globalAlpha=0.70;
      ctx.beginPath();ctx.arc(i+32,cy,14,0,2*Math.PI);ctx.arc(i+48,cy+8,8,0,2*Math.PI);ctx.arc(i+64,cy-4,7,0,2*Math.PI);ctx.fillStyle="#fff";ctx.fill();ctx.globalAlpha=1;
    }}
    else { for(let i=0;i<WORLD_W;i+=135){ let cy=65+(i%19); ctx.globalAlpha=0.5+0.2*((layer-5)%2);
      ctx.fillStyle="#000";ctx.beginPath();ctx.moveTo(i+7,cy);ctx.lineTo(i+11,cy-4);ctx.lineTo(i+15,cy);ctx.strokeStyle="#000";ctx.stroke();ctx.globalAlpha=1;
    }}
    ctx.restore();
  }
  ctx.save();
  ctx.translate(-game.camX,0);
  ctx.fillStyle="#46b138"; ctx.fillRect(0,204,WORLD_W,20);
  ctx.strokeStyle="#1e651e";ctx.lineWidth=2;
  for(let x=0;x<WORLD_W;x+=4) ctx.strokeRect(x,204,4,20);
  for(let plat of game.platforms) if(plat.y<203){
    ctx.fillStyle="#9f7b4d";ctx.fillRect(plat.x,plat.y,plat.w,plat.h);
    ctx.fillStyle="#e7cf6d";ctx.fillRect(plat.x,plat.y,plat.w,2);
  }
  for(let c of game.coins){
    ctx.drawImage(images.coin, c.x, c.y, 24, 24);
  }
  for(let e of game.enemies){
    ctx.drawImage(images.enemy, e.x, e.y, 24, 24);
  }
  // Drapeau animé
  let f = game.flag, anim = Math.sin(game.flagAnim/12)*5;
  ctx.drawImage(images.flag, f.x, f.y+anim, 24, 24);
  let p = game.player;
  ctx.save();
  ctx.translate(p.x + p.w/2, p.y + p.h/2);
  ctx.scale(p.dir,1);
  ctx.drawImage(skinImgs[skinNames[currentSkin]], -12, -12, 24, 24);
  ctx.restore();
  ctx.restore();
}

// Génère un petit son "coin" dynamiquement (WebAudio)
function playCoinSound(){
  try {
    let ctxx = window.AudioContext ? new window.AudioContext() : null;
    if(!ctxx) return;
    let o = ctxx.createOscillator(), g = ctxx.createGain();
    o.type="triangle"; o.frequency.value=880;
    o.connect(g); g.connect(ctxx.destination);
    g.gain.setValueAtTime(0.12,ctxx.currentTime);
    o.start();
    o.frequency.linearRampToValueAtTime(1660,ctxx.currentTime+0.08);
    g.gain.linearRampToValueAtTime(0,ctxx.currentTime+0.15);
    o.stop(ctxx.currentTime+0.15);
  } catch(e){}
}

function rectCollide(a,b) {
  return a.x+a.w > b.x && a.x < b.x+b.w && a.y+a.h > b.y && a.y < b.y+b.h;
}
