const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hudScore = document.getElementById('score');
const btnRestart = document.getElementById('btnRestart');
const gameoverDiv = document.getElementById('gameover');
const msgEnd = document.getElementById('message');

const GRAVITY = 0.32, JUMP = 5.2, SPEED = 2.2, FRICTION = 0.81;
const WORLD_W = 3000, WORLD_H = 224;
let PARALLAX_COUNT = 5; // Augmente à chaque nouvelle version

let game, keys = {};
document.addEventListener('keydown', e=>{ keys[e.code]=true; });
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

function startGame() {
  // Version suivante = +couches !
  if(window._relaunchs) PARALLAX_COUNT = 5 + Math.floor(Math.random()*3)+window._relaunchs;
  else window._relaunchs = 0;
  window._relaunchs++;

  game = {
    camX: 0,
    player: {x:30, y:160, vx:0, vy:0, w:16, h:20, grounded:false, frame:0, dir:1, dead:false, win:false},
    coins: [],
    enemies: [],
    platforms: [],
    score: 0,
    over: false,
    flag: {x:WORLD_W-50, y:175, w:8, h:36}
  };
  // Sol pixel art
  game.platforms.push({x:0, y:204, w:WORLD_W, h:24});
  // Quelques plateformes flottantes
  game.platforms.push(
    {x:70, y:170, w:40, h:7},{x:155, y:140, w:44, h:7},{x:320, y:120, w:40, h:7},
    {x:440, y:80, w:30, h:7},{x:600, y:160, w:30, h:7},{x:880, y:108, w:40, h:7},
    {x:1200, y:140, w:36, h:7},{x:1400, y:90, w:35, h:7},
    {x:1700, y:145, w:32, h:7},{x:2000, y:110, w:40, h:7},{x:2450, y:180, w:40, h:7}
  );
  // Pièces
  game.coins = [
    {x:82, y:140, r:6},{x:330, y:90, r:6},{x:610, y:130, r:6},
    {x:900, y:78, r:6},{x:1215, y:110, r:6},{x:1440, y:65, r:6},
    {x:1715, y:115, r:6},{x:2020, y:80, r:6},{x:2470, y:150, r:6},
    {x:1800, y:95, r:6},{x:200, y:40, r:6}
  ];
  // Ennemis
  game.enemies = [
    {x:420, y:188, w:16, h:12, dir:1, vx:0.7},
    {x:1200, y:124, w:16, h:12, dir:-1, vx:0.9},
    {x:2100, y:188, w:16, h:12, dir:1, vx:0.9}
  ];
  game.camX = 0;
  hudScore.textContent = 0;
  gameoverDiv.style.display = "none";
  msgEnd.innerHTML = "";
  requestAnimationFrame(loop);
}

function loop() {
  if (game.over) return;
  update();
  draw();
  requestAnimationFrame(loop);
}
function update() {
  let p = game.player;
  // Déplacement
  if (keys["ArrowLeft"]) { p.vx = -SPEED; p.dir = -1; }
  else if (keys["ArrowRight"]) { p.vx = SPEED; p.dir = 1; }
  else p.vx *= FRICTION;

  // Saut
  if ((keys["Space"] || keys["ArrowUp"]) && p.grounded) {
    p.vy = -JUMP;
    p.grounded = false;
  }
  // Gravité
  p.vy += GRAVITY;
  p.x += p.vx;
  p.y += p.vy;

  // Collision plateformes
  p.grounded = false;
  for(let plat of game.platforms){
    if (rectCollide(p, plat)) {
      if (p.vy > 0 && p.y + p.h - p.vy <= plat.y+3) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.grounded = true;
      } else if (p.y < plat.y + plat.h && p.vy < 0) {
        p.y = plat.y + plat.h;
        p.vy = 0;
      }
    }
  }
  // Limites du monde
  if (p.x < 0) p.x = 0;
  if (p.x > WORLD_W-p.w) p.x = WORLD_W-p.w;
  // Mort si chute
  if (p.y > 600 && !p.win) die(false);
  // Caméra suit le joueur (légèrement centré)
  game.camX = Math.max(0, Math.min(p.x - 120, WORLD_W-canvas.width));

  // Collisions pièces
  for(let i=game.coins.length-1;i>=0;i--) {
    let c = game.coins[i];
    if (circRectCollide(c, p)) {
      game.score += 10;
      hudScore.textContent = game.score;
      game.coins.splice(i,1);
    }
  }
  // Animation "marche"
  if (Math.abs(p.vx)>0.4 && p.grounded) p.frame = (p.frame+1)%20;
  else p.frame = 0;

  // Ennemis
  for(let e of game.enemies){
    e.x += e.vx*e.dir;
    // Va-et-vient sur plateformes
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
  // Arrivée (victoire)
  if (!p.win && rectCollide(p, game.flag)) {
    p.win = true; win();
  }
}
function die(win) {
  game.player.dead = true;
  game.over = true;
  msgEnd.innerHTML = win ? "Bravo, tu as gagné ! <br>Score final : " + game.score : "Perdu !";
  setTimeout(()=>gameoverDiv.style.display="block",450);
}
function win() { die(true); }

// --- DESSIN ---
function draw() {
  // Couches parallax du décor
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let layer=0; layer<PARALLAX_COUNT; layer++){
    let speed = 0.15 + 0.13*layer;
    ctx.save();
    ctx.translate(-game.camX*speed,0);
    // Couches
    if(layer==0){ // montagnes lointaines
      for(let i=0;i<WORLD_W;i+=130){
        ctx.fillStyle="#cee3f7";
        ctx.beginPath();ctx.moveTo(i,184);ctx.lineTo(i+55,90);ctx.lineTo(i+110,184);ctx.closePath();ctx.fill();
      }
    } else if(layer==1){ // collines
      for(let i=0;i<WORLD_W;i+=110){
        ctx.fillStyle="#7fd0e7";
        ctx.beginPath();ctx.arc(i+38,175,38,Math.PI,2*Math.PI);ctx.fill();
      }
    } else if(layer==2){ // forêt foncée
      for(let i=0;i<WORLD_W;i+=42){
        ctx.fillStyle="#176c32";
        ctx.beginPath();ctx.arc(i+19,196,16,Math.PI,2*Math.PI);ctx.arc(i+36,193,10,Math.PI,2*Math.PI);ctx.fill();
      }
    } else if(layer==3){ // arbres clairs
      for(let i=0;i<WORLD_W;i+=55){
        ctx.fillStyle="#35c77e";
        ctx.beginPath();ctx.arc(i+22,191,10,Math.PI,2*Math.PI);ctx.arc(i+30,189,8,Math.PI,2*Math.PI);ctx.fill();
      }
    } else if(layer==4){ // nuages
      for(let i=0;i<WORLD_W;i+=110){
        let cy=42+13*(i%3);
        ctx.globalAlpha=0.70;
        ctx.beginPath();ctx.arc(i+32,cy,14,0,2*Math.PI);ctx.arc(i+48,cy+8,8,0,2*Math.PI);ctx.arc(i+64,cy-4,7,0,2*Math.PI);ctx.fillStyle="#fff";ctx.fill();ctx.globalAlpha=1;
      }
    } else { // Bonus : oiseaux/couches fun
      for(let i=0;i<WORLD_W;i+=135){
        let cy=65+(i%19); ctx.globalAlpha=0.5+0.2*((layer-5)%2);
        ctx.fillStyle="#000";
        ctx.beginPath();ctx.moveTo(i+7,cy);ctx.lineTo(i+11,cy-4);ctx.lineTo(i+15,cy);ctx.strokeStyle="#000";ctx.stroke();
        ctx.globalAlpha=1;
      }
    }
    ctx.restore();
  }
  // Sol pixel art
  ctx.save();
  ctx.translate(-game.camX,0);
  ctx.fillStyle="#46b138";
  ctx.fillRect(0,204,WORLD_W,20);
  ctx.strokeStyle="#1e651e";ctx.lineWidth=2;
  for(let x=0;x<WORLD_W;x+=4) ctx.strokeRect(x,204,4,20);
  // Plateformes flottantes
  for(let plat of game.platforms) if(plat.y<203){
    ctx.fillStyle="#9f7b4d";ctx.fillRect(plat.x,plat.y,plat.w,plat.h);
    ctx.fillStyle="#e7cf6d";ctx.fillRect(plat.x,plat.y,plat.w,2);
  }
  // Pièces
  for(let c of game.coins){
    ctx.beginPath(); ctx.arc(c.x+6,c.y+6,6,0,2*Math.PI);
    ctx.fillStyle="#ffe338";ctx.fill(); ctx.strokeStyle="#b7981c";ctx.lineWidth=2;ctx.stroke();
  }
  // Ennemis pixelisés
  for(let e of game.enemies){
    ctx.fillStyle="#a82e23";ctx.fillRect(e.x,e.y,e.w,e.h);
    ctx.fillStyle="#fff"; ctx.fillRect(e.x+3,e.y+2,4,3);ctx.fillRect(e.x+9,e.y+2,4,3);
    ctx.fillStyle="#191919"; ctx.fillRect(e.x+4,e.y+3,2,2);ctx.fillRect(e.x+10,e.y+3,2,2);
  }
  // Drapeau de victoire
  ctx.fillStyle="#fff";
  ctx.fillRect(game.flag.x,game.flag.y,2,36);
  ctx.fillStyle="#ffe01b";
  ctx.beginPath();ctx.moveTo(game.flag.x+2,game.flag.y);ctx.lineTo(game.flag.x+14,game.flag.y+7);ctx.lineTo(game.flag.x+2,game.flag.y+17);ctx.closePath();ctx.fill();
  // Joueur pixel art
  let p = game.player;
  ctx.save();
  ctx.translate(p.x + p.w/2, p.y + p.h/2);
  ctx.scale(p.dir,1);
  // Jambes
  ctx.fillStyle="#3645a7";
  if (p.frame<10) {
    ctx.fillRect(-5,9,5,8); ctx.fillRect(1,9,5,8);
  } else {
    ctx.fillRect(-3,9,5,8); ctx.fillRect(0,9,5,8);
  }
  // Corps
  ctx.fillStyle="#368ce4"; ctx.fillRect(-8,-5,16,14);
  // Tête
  ctx.fillStyle="#ffd38d"; ctx.fillRect(-6,-16,12,11);
  // Yeux
  ctx.fillStyle="#222";ctx.fillRect(-2,-12,2,2);ctx.fillRect(2,-12,2,2);
  ctx.restore();
  ctx.restore();
}
function rectCollide(a,b) {
  return a.x+a.w > b.x && a.x < b.x+b.w && a.y+a.h > b.y && a.y < b.y+b.h;
}
function circRectCollide(c, r) {
  let distX = Math.abs(c.x+6 - (r.x+r.w/2));
  let distY = Math.abs(c.y+6 - (r.y+r.h/2));
  if (distX > (r.w/2 + c.r)) return false;
  if (distY > (r.h/2 + c.r)) return false;
  if (distX <= (r.w/2)) return true;
  if (distY <= (r.h/2)) return true;
  let dx=distX-r.w/2, dy=distY-r.h/2;
  return dx*dx+dy*dy <= c.r*c.r;
}
btnRestart.onclick = startGame;
startGame();
