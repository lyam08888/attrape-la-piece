const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hudScore = document.getElementById('score');
const btnRestart = document.getElementById('btnRestart');
const gameoverDiv = document.getElementById('gameover');

// --- PHYSIQUE ---
const GRAVITY = 0.6, JUMP_POWER = 12, MOVE_SPEED = 4, FRICTION = 0.8;
let game, keys = {};
document.addEventListener('keydown', e=>{ keys[e.code]=true; });
document.addEventListener('keyup', e=>{ keys[e.code]=false; });

function startGame() {
  game = {
    camX: 0,
    player: {x:60, y:260, vx:0, vy:0, w:32, h:42, grounded:false, frame:0, dir:1, dead:false},
    coins: [],
    enemies: [],
    platforms: [
      {x:0, y:350, w:1200, h:50}, // sol principal
      {x:200, y:280, w:90, h:15},
      {x:370, y:220, w:70, h:15},
      {x:530, y:300, w:70, h:15},
      {x:690, y:230, w:90, h:15},
      {x:940, y:340, w:70, h:15}
    ],
    score: 0,
    over: false
  };
  // Ajoute pièces
  game.coins = [
    {x:215, y:250, r:11}, {x:385, y:190, r:11}, {x:550, y:270, r:11}, {x:710, y:200, r:11},
    {x:970, y:310, r:11}
  ];
  // Ajoute ennemis
  game.enemies = [
    {x:420, y:332, w:26, h:16, dir:1, vx:1.2}
  ];
  game.camX = 0;
  hudScore.textContent = 0;
  gameoverDiv.style.display = "none";
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
  // Déplacement horizontal
  if (keys["ArrowLeft"]) { p.vx = -MOVE_SPEED; p.dir = -1; }
  else if (keys["ArrowRight"]) { p.vx = MOVE_SPEED; p.dir = 1; }
  else p.vx *= FRICTION;

  // Saut
  if ((keys["Space"] || keys["ArrowUp"]) && p.grounded) {
    p.vy = -JUMP_POWER;
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
      // Arrive d'en haut
      if (p.vy > 0 && p.y + p.h - p.vy <= plat.y+5) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.grounded = true;
      } else if (p.y < plat.y + plat.h && p.vy < 0) {
        p.y = plat.y + plat.h;
        p.vy = 0;
      }
    }
  }
  // Empêche de tomber sous le niveau
  if (p.y > 600) die();
  // Caméra suit le joueur
  game.camX = Math.max(0, p.x - 150);

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
  if (Math.abs(p.vx)>0.5 && p.grounded) p.frame = (p.frame+1)%20;
  else p.frame = 0;

  // Ennemis : va-et-vient
  for(let e of game.enemies){
    e.x += e.vx*e.dir;
    // Retourne à gauche/droite sur les bords des plateformes
    let plat = game.platforms.find(pl=>rectCollide(e,pl));
    if (!plat) e.dir*=-1;
    if (e.x < 0) e.dir = 1;
    if (e.x > 1200-e.w) e.dir = -1;
    // Collision avec joueur : mort
    if (rectCollide(e,p) && !p.dead) die();
  }
}

function die() {
  game.player.dead = true;
  game.over = true;
  setTimeout(()=>gameoverDiv.style.display="block",500);
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Background ciel
  ctx.fillStyle = "#7ce7ff";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Sol
  ctx.fillStyle = "#91e66b";
  ctx.fillRect(0,350-game.camX/10,canvas.width,60);

  // Plateformes
  ctx.save();
  ctx.translate(-game.camX,0);
  for(let plat of game.platforms){
    ctx.fillStyle="#68543a";
    ctx.fillRect(plat.x,plat.y,plat.w,plat.h);
    ctx.fillStyle="#a0875b";
    ctx.fillRect(plat.x,plat.y,plat.w,8);
  }
  // Pièces
  for(let c of game.coins){
    ctx.beginPath();
    ctx.arc(c.x+12,c.y+12,11,0,2*Math.PI);
    ctx.fillStyle="#ffe338";
    ctx.fill();
    ctx.strokeStyle="#e4b318";ctx.lineWidth=3;ctx.stroke();
  }
  // Ennemis
  for(let e of game.enemies){
    ctx.fillStyle="#e8352b";
    ctx.fillRect(e.x,e.y,e.w,e.h);
    ctx.fillStyle="#fff"; ctx.fillRect(e.x+6,e.y+4,5,5);
  }
  // Joueur (sprite simple)
  let p = game.player;
  ctx.save();
  ctx.translate(p.x + p.w/2, p.y + p.h/2);
  ctx.scale(p.dir,1);
  // Corps
  ctx.fillStyle="#1791f5";
  ctx.fillRect(-16,-18,32,36);
  // Tête
  ctx.fillStyle="#ffd38d";
  ctx.fillRect(-14,-38,28,20);
  // Jambes (marche)
  if (p.frame<10) ctx.fillStyle="#3748a2", ctx.fillRect(-10,18,7,13), ctx.fillRect(5,18,7,13);
  else ctx.fillStyle="#3748a2", ctx.fillRect(-7,18,7,13), ctx.fillRect(3,18,7,13);
  ctx.restore();
  ctx.restore();
}

function rectCollide(a,b) {
  return a.x+a.w > b.x && a.x < b.x+b.w && a.y+a.h > b.y && a.y < b.y+b.h;
}
function circRectCollide(c, r) {
  let distX = Math.abs(c.x+12 - (r.x+r.w/2));
  let distY = Math.abs(c.y+12 - (r.y+r.h/2));
  if (distX > (r.w/2 + c.r)) return false;
  if (distY > (r.h/2 + c.r)) return false;
  if (distX <= (r.w/2)) return true;
  if (distY <= (r.h/2)) return true;
  let dx=distX-r.w/2, dy=distY-r.h/2;
  return dx*dx+dy*dy <= c.r*c.r;
}
btnRestart.onclick = startGame;
startGame();
