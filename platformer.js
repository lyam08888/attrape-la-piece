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
const timerSpan = document.getElementById('timer');
const bonusBar = document.getElementById('bonuslist');

const GRAVITY = 0.32, JUMP = 5.2, SPEED = 2.4, FRICTION = 0.81;
const WORLD_W = 3000, WORLD_H = 224;
const GAME_TIME = 60; // secondes

let PAUSED = false;

let skinNames = ["player1","player2","player3"];
let skinImgs = {}, images = {}, allImagesLoaded = 0;
let imagesToLoad = 8; // bonus.png inclus

skinNames.forEach(name => {
  skinImgs[name] = new Image();
  skinImgs[name].src = `assets/${name}.png`;
  skinImgs[name].onload = countLoaded;
});
["coin","enemy","flag","bonus"].forEach(name => {
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

document.getElementById('btnLeft').ontouchstart = ()=>{keys["ArrowLeft"]=true};
document.getElementById('btnLeft').ontouchend = ()=>{keys["ArrowLeft"]=false};
document.getElementById('btnRight').ontouchstart = ()=>{keys["ArrowRight"]=true};
document.getElementById('btnRight').ontouchend = ()=>{keys["ArrowRight"]=false};
document.getElementById('btnJump').ontouchstart = ()=>{keys["ArrowUp"]=true};
document.getElementById('btnJump').ontouchend = ()=>{keys["ArrowUp"]=false};
document.getElementById('btnJump2').ontouchstart = ()=>{keys["ArrowUp"]=true; setTimeout(()=>{keys["ArrowUp"]=false;keys["ArrowUp"]=true;setTimeout(()=>{keys["ArrowUp"]=false},80)},80)};
document.getElementById('btnJump2').ontouchend = ()=>{keys["ArrowUp"]=false};
document.getElementById('btnPause').onclick = ()=>{PAUSED=!PAUSED};

btnStart.onclick = ()=>{
  menuDiv.style.display="none";
  hudDiv.style.display="flex";
  startGame();
  controlsDiv.style.display="flex";
}
btnRestart.onclick = ()=>{
  gameoverDiv.style.display="none";
  hudDiv.style.display="flex";
  startGame();
  controlsDiv.style.display="flex";
};

function startGame() {
  PAUSED = false;
  game = {
    camX: 0,
    player: {x:30, y:160, vx:0, vy:0, w:24, h:24, grounded:false, doubleJump:true, frame:0, dir:1, dead:false, win:false},
    coins: [],
    enemies: [],
    platforms: [],
    holes: [],
    score: 0,
    over: false,
    flag: {x:WORLD_W-50, y:175, w:24, h:24},
    flagAnim: 0,
    time: GAME_TIME,
    timeLast: Date.now(),
    bonus: null,
    bonusPhys: {x:0,y:0,vy:0,active:false},
    bonusObtained: []
  };
  // Sol principal
  game.platforms.push({x:0, y:204, w:400, h:24});
  // Trous, plateformes variées
  game.holes = [
    {x:420, w:45},{x:920, w:45},{x:1900, w:70},{x:1600, w:28}
  ];
  let platBase = 400;
  let pfpos = [
    // x, y, w
    [platBase+20, 178, 90],
    [platBase+180, 135, 65],
    [900, 100, 90],
    [1200, 50, 55],
    [1460, 90, 90],
    [1700, 60, 110],
    [2000, 135, 65],
    [2200, 110, 90],
    [2400, 178, 150]
  ];
  pfpos.forEach(([x,y,w])=>game.platforms.push({x:x, y:y, w:w, h:10}));
  // Sol de droite
  game.platforms.push({x:2500, y:204, w:500, h:24});
  // Ajout de trous dans le sol
  game.platforms = game.platforms.concat(game.holes.map(h=>({x:h.x+h.w, y:204, w: (WORLD_W-h.x-h.w), h:24})));

  // Pièces : placées sur les plateformes (jamais en l'air)
  function addCoinsOnPlatform(plat, n=2) {
    for(let i=0;i<n;i++) {
      let px = plat.x+10+i*(plat.w-20)/(n-1);
      let py = plat.y-24;
      game.coins.push({x:px,y:py});
    }
  }
  // Sol et chaque plateforme (pas dans les trous)
  addCoinsOnPlatform({x:0,y:204,w:400}, 4);
  pfpos.forEach((p)=>addCoinsOnPlatform({x:p[0],y:p[1],w:p[2]},2));
  addCoinsOnPlatform({x:2500,y:204,w:500},3);

  // Ennemis
  game.enemies = [
    {x:520, y:188, w:24, h:24, dir:1, vx:0.7},
    {x:1220, y:124, w:24, h:24, dir:-1, vx:0.9},
    {x:2100, y:188, w:24, h:24, dir:1, vx:0.9}
  ];
  game.camX = 0;
  hudScore.textContent = 0;
  gameoverDiv.style.display = "none";
  msgEnd.innerHTML = "";
  timerSpan.textContent = "⏰ "+GAME_TIME;
  bonusBar.innerHTML = "Aucun";
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
  // Timer
  let now = Date.now();
  if(now - game.timeLast > 990) {
    game.time -= 1; game.timeLast = now;
    timerSpan.textContent = "⏰ "+game.time;
    if(game.time<=0) {die(false); return;}
  }
  // Déplacement
  if (keys["ArrowLeft"]) { p.vx = -SPEED; p.dir = -1; }
  else if (keys["ArrowRight"]) { p.vx = SPEED; p.dir = 1; }
  else p.vx *= FRICTION;
  // Double saut
  let wantsJump = (keys["Space"]||keys["ArrowUp"]);
  if (wantsJump && (p.grounded || p.doubleJump)) {
    if(!p.grounded && p.doubleJump){
      p.doubleJump = false;
      p.vy = -JUMP*0.93;
    } else if(p.grounded) {
      p.vy = -JUMP; p.grounded = false; p.doubleJump = true;
    }
  }
  p.vy += GRAVITY;
  p.x += p.vx;
  p.y += p.vy;
  // Plateformes
  p.grounded = false;
  for(let plat of game.platforms){
    if (rectCollide(p, plat)) {
      if (p.vy > 0 && p.y + p.h - p.vy <= plat.y+3) {
        p.y = plat.y - p.h; p.vy = 0; p.grounded = true; p.doubleJump = true;
      } else if (p.y < plat.y + plat.h && p.vy < 0) {
        p.y = plat.y + plat.h; p.vy = 0;
      }
    }
  }
  // Trous
  let inHole = game.holes.some(h=>p.x+p.w/2>h.x && p.x+p.w/2<h.x+h.w && p.y>=200);
  if (inHole) { die(false); return; }
  if (p.x < 0) p.x = 0;
  if (p.x > WORLD_W-p.w) p.x = WORLD_W-p.w;
  if (p.y > 600 && !p.win) die(false);
  game.camX = Math.max(0, Math.min(p.x - 120, WORLD_W-canvas.width));
  // Pièces normales : PAS de physique
  for(let i=game.coins.length-1;i>=0;i--) {
    let c = game.coins[i];
    if (rectCollide({x:c.x,y:c.y,w:24,h:24}, p)) {
      playCoinSound();
      game.score += 10;
      hudScore.textContent = game.score;
      game.coins.splice(i,1);
    }
  }
  // Bonus apparition et "rebond" dynamique
  if(!game.bonus && Math.random()<0.003){
    let plats = game.platforms.filter(pl=>pl.y<204 && pl.w>35);
    let plat = plats[Math.floor(Math.random()*plats.length)];
    let bx = plat.x + 12 + Math.random()*(plat.w-32);
    game.bonus = {x:bx, y:plat.y-25, got:false, vy:3+Math.random()*1.8, frame:0, id: Date.now()%3};
    game.bonusPhys = {x:bx, y:plat.y-55, vy:game.bonus.vy};
  }
  if(game.bonus && !game.bonus.got){
    game.bonusPhys.vy += 0.38;
    game.bonusPhys.y += game.bonusPhys.vy;
    let plat = game.platforms.find(pl=>game.bonusPhys.x>pl.x-12&&game.bonusPhys.x<pl.x+pl.w+12&&pl.y<204);
    if(game.bonusPhys.y > plat.y-24) {
      game.bonusPhys.y = plat.y-24;
      game.bonusPhys.vy*=-0.42;
      if(Math.abs(game.bonusPhys.vy)<0.8) game.bonusPhys.vy = 0;
    }
    game.bonus.x = game.bonusPhys.x;
    game.bonus.y = game.bonusPhys.y;
    if(rectCollide({x:game.bonus.x,y:game.bonus.y,w:24,h:24},p)){
      game.bonus.got = true;
      let bonusType = ["Double Score","Super Saut","+15s Temps"][game.bonus.id];
      game.bonusObtained = [{type:bonusType, ts: Date.now()}];
      updateBonusBar(game.bonusObtained);
      if(game.bonus.id===0) game.score+=30;
      if(game.bonus.id===1) {p.vy = -JUMP*1.38;}
      if(game.bonus.id===2) {game.time+=15;}
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
  game.flagAnim++;
  if (!p.win && rectCollide(game.flag, p)) {
    p.win = true; win();
  }
}
function updateBonusBar(arr){
  if(!arr || arr.length==0) { bonusBar.innerHTML="Aucun"; return;}
  bonusBar.innerHTML = arr.map(b=>
    `<img src="assets/bonus.png" title="${b.type}"/> <span>${b.type}</span>`
  ).join(" ");
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
  // Affichage des trous (sol manquant)
  for(let h of game.holes){
    ctx.clearRect(h.x,204,h.w,24);
    ctx.fillStyle="#18391a"; ctx.fillRect(h.x,224,h.w,10);
  }
  // Pièces sur plateforme/sol
  for(let c of game.coins){
    ctx.drawImage(images.coin, c.x, c.y, 24, 24);
  }
  for(let e of game.enemies){
    ctx.drawImage(images.enemy, e.x, e.y, 24, 24);
  }
  // Bonus avec animation rebond/dynamique
  if(game.bonus && !game.bonus.got){
    ctx.save();
    ctx.translate(game.bonus.x+12, game.bonus.y+12);
    ctx.rotate(Math.sin(Date.now()/350)*0.25);
    ctx.drawImage(images.bonus, -12,-12, 24,24);
    ctx.restore();
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
