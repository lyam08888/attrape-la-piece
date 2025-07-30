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

// Configuration améliorée
const GRAVITY = 0.45;
const JUMP = 7.5;
const SPEED = 3.2;
const FRICTION = 0.88;
const WATER_FRICTION = 0.65;
const WORLD_W = 4800;
const WORLD_H = 540;
const GAME_TIME = 120;
const MAX_LIVES = 5;

// Système de particules
let particles = [];
let waterSplashes = [];
let footsteps = [];
let weatherParticles = [];

// Variables globales améliorées
let PAUSED = false;
let JUMP_FRAMES = 0;
let DOUBLE_JUMP_FRAMES = 0;
let wantJump = false;
let dayNightCycle = 0;
let weatherType = 'clear'; // clear, rain, snow
let windForce = 0;

// Skins et images
let skinNames = ["player1","player2","player3"];
let skinImgs = {}, images = {}, allImagesLoaded = 0;
let imagesToLoad = 10; // Plus d'images

// Chargement des images
skinNames.forEach(name => {
  skinImgs[name] = new Image();
  skinImgs[name].src = `assets/${name}.png`;
  skinImgs[name].onload = countLoaded;
});

["coin","enemy","flag","bonus","heart","enemy2","enemy3","water","grass"].forEach(name => {
  images[name] = new Image();
  images[name].src = `assets/${name}.png`;
  images[name].onload = countLoaded;
});

function countLoaded(){ 
  allImagesLoaded++; 
  if(allImagesLoaded >= imagesToLoad) prepareMenu(); 
}

let currentSkin = 0;
function prepareMenu(){
  skinList.innerHTML = '';
  skinNames.forEach((name, i) => {
    let img = document.createElement("img");
    img.src = skinImgs[name].src;
    img.onclick = () => selectSkin(i);
    img.id = "skin" + i;
    if(i == currentSkin) img.classList.add("selected");
    skinList.appendChild(img);
  });
}

function selectSkin(i){
  currentSkin = i;
  [...document.querySelectorAll("#skinlist img")].forEach(im => im.classList.remove("selected"));
  document.getElementById('skin' + i).classList.add("selected");
}

let PARALLAX_COUNT = 9;
let game, keys = {};

// Contrôles améliorés
document.addEventListener('keydown', function(e){
  if(e.code === "KeyP") { PAUSED = !PAUSED; }
  if(["ArrowUp", "Space", "KeyW"].includes(e.code)){
    wantJump = true;
    JUMP_FRAMES++;
    setTimeout(() => wantJump = false, 100);
  } else {
    keys[e.code] = true;
  }
});

document.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Contrôles tactiles
document.getElementById('btnLeft').ontouchstart = () => { keys["ArrowLeft"] = true };
document.getElementById('btnLeft').ontouchend = () => { keys["ArrowLeft"] = false };
document.getElementById('btnRight').ontouchstart = () => { keys["ArrowRight"] = true };
document.getElementById('btnRight').ontouchend = () => { keys["ArrowRight"] = false };
document.getElementById('btnJump').ontouchstart = () => { 
  wantJump = true; 
  JUMP_FRAMES++; 
  setTimeout(() => wantJump = false, 110) 
};
document.getElementById('btnJump').ontouchend = () => {};
document.getElementById('btnJump2').ontouchstart = () => { 
  wantJump = true; 
  JUMP_FRAMES += 2; 
  setTimeout(() => wantJump = false, 200) 
};
document.getElementById('btnJump2').ontouchend = () => {};
document.getElementById('btnPause').onclick = () => { PAUSED = !PAUSED };

btnStart.onclick = () => {
  menuDiv.style.display = "none";
  hudDiv.style.display = "flex";
  startGame();
  controlsDiv.style.display = "flex";
}

btnRestart.onclick = () => {
  gameoverDiv.style.display = "none";
  hudDiv.style.display = "flex";
  startGame();
  controlsDiv.style.display = "flex";
};

function startGame() {
  PAUSED = false;
  JUMP_FRAMES = 0;
  DOUBLE_JUMP_FRAMES = 0;
  dayNightCycle = 0;
  particles = [];
  waterSplashes = [];
  footsteps = [];
  weatherParticles = [];
  
  game = {
    camX: 0,
    camY: 0,
    player: {
      x: 50, 
      y: 300, 
      vx: 0, 
      vy: 0, 
      w: 32, 
      h: 32, 
      grounded: false, 
      canDouble: true, 
      frame: 0, 
      dir: 1, 
      dead: false, 
      win: false,
      lives: MAX_LIVES,
      invulnerable: 0,
      inWater: false,
      jumpPower: JUMP,
      footstepTimer: 0
    },
    coins: [],
    enemies: [],
    platforms: [],
    water: [],
    decorations: [],
    checkpoints: [],
    lastCheckpoint: {x: 50, y: 300},
    score: 0,
    over: false,
    flag: {x: WORLD_W - 100, y: 350, w: 32, h: 48},
    flagAnim: 0,
    time: GAME_TIME,
    timeLast: Date.now(),
    bonus: null,
    bonusPhys: {x: 0, y: 0, vy: 0, active: false},
    bonusObtained: []
  };
  
  generateLevel();
  
  game.camX = 0;
  game.camY = 0;
  hudScore.textContent = 0;
  gameoverDiv.style.display = "none";
  msgEnd.innerHTML = "";
  timerSpan.textContent = "⏰ " + GAME_TIME;
  bonusBar.innerHTML = "Aucun";
  updateLivesDisplay();
  
  requestAnimationFrame(loop);
}

function generateLevel() {
  // Génération procédurale du niveau
  let currentX = 0;
  let currentY = WORLD_H - 120;
  let lastPlatformEnd = 0;
  
  // Sol principal avec variations
  for(let x = 0; x < WORLD_W; x += 200) {
    let height = 80 + Math.sin(x / 300) * 40;
    let y = WORLD_H - height;
    
    // Créer des trous aléatoires
    if(x > 400 && Math.random() < 0.3) {
      let gapWidth = 80 + Math.random() * 120;
      x += gapWidth;
      
      // Ajouter de l'eau dans certains trous
      if(Math.random() < 0.5) {
        game.water.push({
          x: x - gapWidth,
          y: WORLD_H - 60,
          w: gapWidth,
          h: 60
        });
      }
    } else {
      game.platforms.push({
        x: x,
        y: y,
        w: 200,
        h: height,
        type: 'ground'
      });
    }
  }
  
  // Plateformes flottantes avec patterns variés
  for(let i = 0; i < 30; i++) {
    let x = 200 + i * 150 + Math.random() * 100;
    let y = 200 + Math.sin(i * 0.5) * 150 + Math.random() * 100;
    let w = 80 + Math.random() * 120;
    
    // Différents types de plateformes
    let type = Math.random();
    if(type < 0.7) {
      // Plateforme normale
      game.platforms.push({
        x: x,
        y: y,
        w: w,
        h: 16,
        type: 'normal'
      });
    } else if(type < 0.85) {
      // Plateforme mouvante
      game.platforms.push({
        x: x,
        y: y,
        w: w,
        h: 16,
        type: 'moving',
        moveX: x,
        moveY: y,
        moveSpeed: 1 + Math.random(),
        moveRange: 100 + Math.random() * 100,
        moveDir: Math.random() < 0.5 ? 'horizontal' : 'vertical'
      });
    } else {
      // Plateforme fragile
      game.platforms.push({
        x: x,
        y: y,
        w: w,
        h: 16,
        type: 'fragile',
        health: 3
      });
    }
  }
  
  // Pièces sur plateformes et chemins
  game.platforms.forEach(plat => {
    if(Math.random() < 0.6 && plat.type !== 'moving') {
      let numCoins = 2 + Math.floor(Math.random() * 4);
      for(let i = 0; i < numCoins; i++) {
        game.coins.push({
          x: plat.x + 10 + (plat.w - 20) * (i / (numCoins - 1)),
          y: plat.y - 35,
          collected: false,
          value: 10,
          animOffset: Math.random() * Math.PI * 2
        });
      }
    }
  });
  
  // Ennemis variés
  for(let i = 0; i < 25; i++) {
    let platform = game.platforms[Math.floor(Math.random() * game.platforms.length)];
    if(platform && platform.type === 'ground') {
      let enemyType = Math.floor(Math.random() * 3);
      game.enemies.push({
        x: platform.x + Math.random() * (platform.w - 40),
        y: platform.y - 40,
        w: 32,
        h: 32,
        dir: Math.random() < 0.5 ? 1 : -1,
        vx: 0.8 + Math.random() * 1.2,
        vy: 0,
        type: enemyType,
        health: enemyType === 2 ? 2 : 1,
        platform: platform,
        jumpTimer: 0,
        canJump: enemyType === 1
      });
    }
  }
  
  // Checkpoints
  for(let i = 1; i < 4; i++) {
    game.checkpoints.push({
      x: (WORLD_W / 4) * i,
      y: 300,
      w: 40,
      h: 60,
      activated: false
    });
  }
  
  // Décorations
  for(let i = 0; i < WORLD_W; i += 50 + Math.random() * 100) {
    if(Math.random() < 0.7) {
      game.decorations.push({
        type: 'grass',
        x: i,
        y: 0,
        scale: 0.8 + Math.random() * 0.4,
        layer: Math.random() < 0.5 ? 'back' : 'front'
      });
    }
    if(Math.random() < 0.3) {
      game.decorations.push({
        type: 'flower',
        x: i,
        y: 0,
        color: `hsl(${Math.random() * 60 + 300}, 70%, 60%)`,
        scale: 0.6 + Math.random() * 0.4,
        layer: 'front'
      });
    }
  }
}

function loop() {
  if (game.over) return;
  if(PAUSED) { 
    drawPause(); 
    requestAnimationFrame(loop); 
    return; 
  }
  
  update();
  draw();
  requestAnimationFrame(loop);
}

function update() {
  let p = game.player;
  
  // Cycle jour/nuit
  dayNightCycle += 0.0003;
  if(dayNightCycle > Math.PI * 2) dayNightCycle = 0;
  
  // Météo dynamique
  if(Math.random() < 0.001) {
    weatherType = ['clear', 'rain', 'snow'][Math.floor(Math.random() * 3)];
  }
  
  // Vent
  windForce = Math.sin(Date.now() / 3000) * 0.2;
  
  // Timer
  let now = Date.now();
  if(now - game.timeLast > 990) {
    game.time -= 1;
    game.timeLast = now;
    timerSpan.textContent = "⏰ " + game.time;
    if(game.time <= 0) {
      die(false);
      return;
    }
  }
  
  // Invulnérabilité
  if(p.invulnerable > 0) p.invulnerable--;
  
  // Déplacement du joueur
  if (keys["ArrowLeft"] || keys["KeyA"]) { 
    p.vx = -(p.inWater ? SPEED * 0.6 : SPEED); 
    p.dir = -1; 
  } else if (keys["ArrowRight"] || keys["KeyD"]) { 
    p.vx = p.inWater ? SPEED * 0.6 : SPEED; 
    p.dir = 1; 
  } else {
    p.vx *= p.inWater ? WATER_FRICTION : FRICTION;
  }
  
  // Ajouter l'effet du vent
  p.vx += windForce;
  
  // Double saut amélioré
  if (wantJump) {
    if(p.grounded) {
      p.vy = -p.jumpPower;
      p.grounded = false;
      p.canDouble = true;
      wantJump = false;
      createJumpParticles(p.x + p.w/2, p.y + p.h);
      playJumpSound();
    } else if (p.canDouble && !p.inWater) {
      p.vy = -p.jumpPower * 0.85;
      p.canDouble = false;
      wantJump = false;
      createDoubleJumpParticles(p.x + p.w/2, p.y + p.h/2);
      playDoubleJumpSound();
    }
  }
  
  // Gravité avec effet eau
  if(p.inWater) {
    p.vy += GRAVITY * 0.3;
    p.vy = Math.max(p.vy, -3);
    p.vy = Math.min(p.vy, 2);
  } else {
    p.vy += GRAVITY;
  }
  
  p.x += p.vx;
  p.y += p.vy;
  
  // Collision avec plateformes améliorée
  p.grounded = false;
  for(let plat of game.platforms) {
    // Mise à jour des plateformes mouvantes
    if(plat.type === 'moving') {
      if(plat.moveDir === 'horizontal') {
        plat.x = plat.moveX + Math.sin(Date.now() / 1000 * plat.moveSpeed) * plat.moveRange;
      } else {
        plat.y = plat.moveY + Math.sin(Date.now() / 1000 * plat.moveSpeed) * plat.moveRange;
      }
    }
    
    if (rectCollide(p, plat)) {
      // Collision par le haut
      if (p.vy > 0 && p.y + p.h - p.vy <= plat.y + 5) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.grounded = true;
        p.canDouble = true;
        
        // Plateforme fragile
        if(plat.type === 'fragile') {
          plat.health--;
          if(plat.health <= 0) {
            createBreakParticles(plat.x + plat.w/2, plat.y + plat.h/2);
            game.platforms.splice(game.platforms.indexOf(plat), 1);
          }
        }
        
        // Déplacement avec plateforme mouvante
        if(plat.type === 'moving' && plat.moveDir === 'horizontal') {
          p.x += Math.cos(Date.now() / 1000 * plat.moveSpeed) * plat.moveSpeed * 2;
        }
      } 
      // Collision par le bas
      else if (p.y < plat.y + plat.h && p.vy < 0) {
        p.y = plat.y + plat.h;
        p.vy = 0;
      }
      // Collision latérale
      else if (p.vx > 0 && p.x < plat.x) {
        p.x = plat.x - p.w;
        p.vx = 0;
      } else if (p.vx < 0 && p.x > plat.x + plat.w) {
        p.x = plat.x + plat.w;
        p.vx = 0;
      }
    }
  }
  
  // Empreintes de pas
  if(p.grounded && Math.abs(p.vx) > 0.5) {
    p.footstepTimer++;
    if(p.footstepTimer > 10) {
      p.footstepTimer = 0;
      footsteps.push({
        x: p.x + p.w/2,
        y: p.y + p.h,
        dir: p.dir,
        life: 100
      });
    }
  }
  
  // Détection de l'eau
  p.inWater = false;
  for(let water of game.water) {
    if(rectCollide(p, water)) {
      p.inWater = true;
      if(p.vy > 2) {
        createWaterSplash(p.x + p.w/2, water.y);
        playWaterSound();
      }
    }
  }
  
  // Limites du monde
  if (p.x < 0) p.x = 0;
  if (p.x > WORLD_W - p.w) p.x = WORLD_W - p.w;
  if (p.y > WORLD_H + 100 && !p.win) {
    loseLife();
  }
  
  // Caméra smooth
  let targetCamX = Math.max(0, Math.min(p.x - canvas.width/2, WORLD_W - canvas.width));
  let targetCamY = Math.max(0, Math.min(p.y - canvas.height/2, WORLD_H - canvas.height));
  game.camX += (targetCamX - game.camX) * 0.1;
  game.camY += (targetCamY - game.camY) * 0.1;
  
  // Collecte des pièces
  for(let i = game.coins.length - 1; i >= 0; i--) {
    let c = game.coins[i];
    if (!c.collected && rectCollide({x: c.x, y: c.y, w: 24, h: 24}, p)) {
      c.collected = true;
      playCoinSound();
      game.score += c.value;
      hudScore.textContent = game.score;
      createCoinParticles(c.x + 12, c.y + 12);
      game.coins.splice(i, 1);
    }
  }
  
  // Bonus amélioré
  if(!game.bonus && Math.random() < 0.005) {
    let plats = game.platforms.filter(pl => pl.y < WORLD_H - 100 && pl.w > 50);
    if(plats.length > 0) {
      let plat = plats[Math.floor(Math.random() * plats.length)];
      let bx = plat.x + 12 + Math.random() * (plat.w - 32);
      game.bonus = {
        x: bx, 
        y: plat.y - 30, 
        got: false, 
        vy: 3 + Math.random() * 2, 
        frame: 0, 
        id: Math.floor(Math.random() * 5)
      };
      game.bonusPhys = {x: bx, y: plat.y - 60, vy: game.bonus.vy};
    }
  }
  
  if(game.bonus && !game.bonus.got) {
    game.bonusPhys.vy += 0.4;
    game.bonusPhys.y += game.bonusPhys.vy;
    
    // Rebond du bonus
    for(let plat of game.platforms) {
      if(game.bonusPhys.x > plat.x - 12 && 
         game.bonusPhys.x < plat.x + plat.w + 12 && 
         game.bonusPhys.y > plat.y - 24 && 
         game.bonusPhys.y < plat.y) {
        game.bonusPhys.y = plat.y - 24;
        game.bonusPhys.vy *= -0.6;
        if(Math.abs(game.bonusPhys.vy) < 1) game.bonusPhys.vy = 0;
      }
    }
    
    game.bonus.x = game.bonusPhys.x;
    game.bonus.y = game.bonusPhys.y;
    
    if(rectCollide({x: game.bonus.x, y: game.bonus.y, w: 24, h: 24}, p)) {
      game.bonus.got = true;
      let bonusTypes = ["Double Score", "Super Saut", "+30s", "Invincibilité", "Vie +1"];
      let bonusType = bonusTypes[game.bonus.id];
      game.bonusObtained.push({type: bonusType, ts: Date.now()});
      updateBonusBar(game.bonusObtained);
      
      // Effets des bonus
      switch(game.bonus.id) {
        case 0: game.score += 50; break;
        case 1: p.jumpPower = JUMP * 1.5; setTimeout(() => p.jumpPower = JUMP, 10000); break;
        case 2: game.time += 30; break;
        case 3: p.invulnerable = 300; break;
        case 4: if(p.lives < MAX_LIVES) { p.lives++; updateLivesDisplay(); } break;
      }
      
      playBonusSound();
      createBonusParticles(game.bonus.x + 12, game.bonus.y + 12);
    }
  }
  
  // Animation du joueur
  if (Math.abs(p.vx) > 0.5 && p.grounded) {
    p.frame = (p.frame + 1) % 20;
  } else {
    p.frame = 0;
  }
  
  // Mise à jour des ennemis avec IA améliorée
  for(let e of game.enemies) {
    // Gravité pour les ennemis
    e.vy += GRAVITY;
    e.y += e.vy;
    
    // Déplacement horizontal
    e.x += e.vx * e.dir;
    
    // Détection du sol pour les ennemis
    let onGround = false;
    for(let plat of game.platforms) {
      if(e.x + e.w > plat.x && e.x < plat.x + plat.w &&
         e.y + e.h > plat.y && e.y + e.h < plat.y + 20) {
        e.y = plat.y - e.h;
        e.vy = 0;
        onGround = true;
      }
    }
    
    // Détection des bords et changement de direction
    let hasGroundAhead = false;
    for(let plat of game.platforms) {
      let checkX = e.x + (e.dir > 0 ? e.w + 10 : -10);
      if(checkX > plat.x && checkX < plat.x + plat.w && 
         e.y + e.h + 10 > plat.y && e.y + e.h + 10 < plat.y + plat.h) {
        hasGroundAhead = true;
        break;
      }
    }
    
    if(!hasGroundAhead || e.x <= 0 || e.x >= WORLD_W - e.w) {
      e.dir *= -1;
    }
    
    // Ennemis sauteurs
    if(e.canJump && onGround) {
      e.jumpTimer++;
      if(e.jumpTimer > 60 + Math.random() * 60) {
        e.vy = -5;
        e.jumpTimer = 0;
      }
    }
    
    // Collision avec le joueur
    if (rectCollide(e, p) && !p.dead && !p.win && p.invulnerable === 0) {
      if (p.vy > 0 && p.y + p.h * 0.7 < e.y + 8) {
        // Écrasement de l'ennemi
        e.health--;
        if(e.health <= 0) {
          game.enemies.splice(game.enemies.indexOf(e), 1);
          game.score += 20;
          createEnemyDefeatParticles(e.x + e.w/2, e.y + e.h/2);
          playEnemyDefeatSound();
        }
        p.vy = -4.5;
      } else {
        loseLife();
      }
    }
  }
  
  // Checkpoints
  for(let cp of game.checkpoints) {
    if(!cp.activated && rectCollide(cp, p)) {
      cp.activated = true;
      game.lastCheckpoint = {x: cp.x, y: cp.y - 50};
      createCheckpointParticles(cp.x + cp.w/2, cp.y + cp.h/2);
      playCheckpointSound();
    }
  }
  
  // Animation du drapeau
  game.flagAnim++;
  if (!p.win && rectCollide(game.flag, p)) {
    p.win = true;
    win();
  }
  
  // Mise à jour des particules
  updateParticles();
  updateWeather();
}

function loseLife() {
  let p = game.player;
  p.lives--;
  updateLivesDisplay();
  
  if(p.lives <= 0) {
    die(false);
  } else {
    // Respawn au dernier checkpoint
    p.x = game.lastCheckpoint.x;
    p.y = game.lastCheckpoint.y;
    p.vx = 0;
    p.vy = 0;
    p.invulnerable = 120;
    createRespawnParticles(p.x + p.w/2, p.y + p.h/2);
    playHurtSound();
  }
}

function updateLivesDisplay() {
  let livesHTML = '';
  for(let i = 0; i < game.player.lives; i++) {
    livesHTML += '❤️';
  }
  document.getElementById('lives').innerHTML = livesHTML;
}

function updateBonusBar(arr) {
  if(!arr || arr.length == 0) { 
    bonusBar.innerHTML = "Aucun"; 
    return;
  }
  bonusBar.innerHTML = arr.map(b =>
    `<img src="assets/bonus.png" title="${b.type}"/> <span>${b.type}</span>`
  ).join(" ");
}

function die(win) {
  game.player.dead = true;
  game.over = true;
  msgEnd.innerHTML = win ? 
    `🎉 Victoire! 🎉<br>Score final: ${game.score}<br>Temps: ${GAME_TIME - game.time}s` : 
    `💀 Game Over 💀<br>Score: ${game.score}`;
  setTimeout(() => { 
    gameoverDiv.style.display = "block"; 
    hudDiv.style.display = "none"; 
    controlsDiv.style.display = "none"; 
  }, 1000);
}

function win() { 
  createVictoryParticles();
  playVictorySound();
  die(true); 
}

function drawPause() {
  draw();
  ctx.save();
  ctx.fillStyle = "#000000aa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAUSE", canvas.width/2, canvas.height/2);
  ctx.font = "24px Arial";
  ctx.fillText("Appuyez sur P pour continuer", canvas.width/2, canvas.height/2 + 40);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Cycle jour/nuit - Ciel dynamique
  let timeOfDay = (Math.sin(dayNightCycle) + 1) / 2;
  let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  
  if(timeOfDay < 0.3) { // Nuit
    skyGradient.addColorStop(0, "#0a0a2e");
    skyGradient.addColorStop(1, "#1e1e4e");
  } else if(timeOfDay < 0.5) { // Aube
    skyGradient.addColorStop(0, "#4a5a8e");
    skyGradient.addColorStop(0.5, "#f4a460");
    skyGradient.addColorStop(1, "#ffd4a3");
  } else if(timeOfDay < 0.8) { // Jour
    skyGradient.addColorStop(0, "#87ceeb");
    skyGradient.addColorStop(1, "#98d8e8");
  } else { // Crépuscule
    skyGradient.addColorStop(0, "#ff6b6b");
    skyGradient.addColorStop(0.5, "#ffa500");
    skyGradient.addColorStop(1, "#4a5a8e");
  }
  
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Étoiles la nuit
  if(timeOfDay < 0.3 || timeOfDay > 0.8) {
    ctx.save();
    for(let i = 0; i < 100; i++) {
      let x = (i * 137) % canvas.width;
      let y = (i * 59) % (canvas.height / 2);
      let brightness = 0.3 + Math.sin(Date.now() / 1000 + i) * 0.7;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }
  
  // Soleil/Lune
  ctx.save();
  let celestialX = canvas.width * timeOfDay;
  let celestialY = 100 + Math.sin(dayNightCycle) * 50;
  
  if(timeOfDay > 0.3 && timeOfDay < 0.8) {
    // Soleil
    ctx.beginPath();
    ctx.arc(celestialX, celestialY, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.strokeStyle = "#FFA500";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    // Lune
    ctx.beginPath();
    ctx.arc(celestialX, celestialY, 30, 0, Math.PI * 2);
    ctx.fillStyle = "#F0F0F0";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(celestialX + 10, celestialY - 5, 25, 0, Math.PI * 2);
    ctx.fillStyle = skyGradient;
    ctx.fill();
  }
  ctx.restore();
  
  // Nuages parallaxe
  for(let i = 0; i < 5; i++) {
    let cloudX = (i * 200 + Date.now() / (50 + i * 10)) % (canvas.width + 200) - 100;
    let cloudY = 50 + i * 30;
    drawCloud(cloudX, cloudY, 1 + i * 0.2);
  }
  
  // Montagnes en arrière-plan
  ctx.save();
  ctx.translate(-game.camX * 0.1, -game.camY * 0.05);
  for(let i = 0; i < WORLD_W; i += 300) {
    ctx.fillStyle = `rgba(100, 100, 150, ${0.3 + timeOfDay * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(i, canvas.height);
    ctx.lineTo(i + 150, 200 + Math.sin(i / 300) * 50);
    ctx.lineTo(i + 300, canvas.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  
  // Arbres de fond (parallaxe)
  ctx.save();
  ctx.translate(-game.camX * 0.3, -game.camY * 0.1);
  for(let i = 0; i < WORLD_W; i += 150) {
    drawTree(i, canvas.height - 150, 0.8, 'back');
  }
  ctx.restore();
  
  // Décorations arrière-plan
  ctx.save();
  ctx.translate(-game.camX, -game.camY);
  game.decorations.filter(d => d.layer === 'back').forEach(dec => {
    drawDecoration(dec);
  });
  ctx.restore();
  
  // Plateformes avec détails
  ctx.save();
  ctx.translate(-game.camX, -game.camY);
  
  for(let plat of game.platforms) {
    // Ombre de la plateforme
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(plat.x + 5, plat.y + 5, plat.w, plat.h);
    
    if(plat.type === 'ground') {
      // Sol avec texture
      let gradient = ctx.createLinearGradient(0, plat.y, 0, plat.y + plat.h);
      gradient.addColorStop(0, "#3e7c17");
      gradient.addColorStop(0.1, "#52a447");
      gradient.addColorStop(0.5, "#4a5d3a");
      gradient.addColorStop(1, "#2d3a1f");
      ctx.fillStyle = gradient;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      
      // Herbe sur le dessus
      for(let x = plat.x; x < plat.x + plat.w; x += 10) {
        drawGrass(x + Math.random() * 10, plat.y, 10 + Math.random() * 15);
      }
    } else if(plat.type === 'normal') {
      // Plateforme normale
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.strokeStyle = "#654321";
      ctx.lineWidth = 2;
      ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    } else if(plat.type === 'moving') {
      // Plateforme mouvante
      ctx.fillStyle = "#4169E1";
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.strokeStyle = "#1E90FF";
      ctx.lineWidth = 2;
      ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      // Flèches indicatrices
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "16px Arial";
      ctx.fillText(plat.moveDir === 'horizontal' ? "↔" : "↕", plat.x + plat.w/2 - 8, plat.y + plat.h/2 + 6);
    } else if(plat.type === 'fragile') {
      // Plateforme fragile
      ctx.fillStyle = plat.health === 3 ? "#CD853F" : plat.health === 2 ? "#D2691E" : "#8B4513";
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      // Fissures
      ctx.strokeStyle = "#654321";
      ctx.lineWidth = 1;
      for(let i = 0; i < 4 - plat.health; i++) {
        ctx.beginPath();
        ctx.moveTo(plat.x + Math.random() * plat.w, plat.y);
        ctx.lineTo(plat.x + Math.random() * plat.w, plat.y + plat.h);
        ctx.stroke();
      }
    }
  }
  
  // Eau avec animation
  ctx.fillStyle = "rgba(0, 100, 200, 0.6)";
  for(let water of game.water) {
    ctx.fillRect(water.x, water.y, water.w, water.h);
    
    // Vagues animées
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let x = water.x; x < water.x + water.w; x += 10) {
      let waveY = water.y + Math.sin((x + Date.now() / 200) / 30) * 5;
      ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }
  
  // Empreintes de pas
  footsteps.forEach(footstep => {
    ctx.save();
    ctx.globalAlpha = footstep.life / 100;
    ctx.fillStyle = "rgba(139, 69, 19, 0.3)";
    ctx.translate(footstep.x, footstep.y);
    ctx.scale(footstep.dir, 1);
    ctx.fillRect(-4, -2, 8, 4);
    ctx.restore();
    footstep.life--;
  });
  footsteps = footsteps.filter(f => f.life > 0);
  
  // Pièces animées
  for(let c of game.coins) {
    if(!c.collected) {
      ctx.save();
      ctx.translate(c.x + 12, c.y + 12);
      ctx.rotate(Date.now() / 500 + c.animOffset);
      ctx.scale(Math.cos(Date.now() / 300 + c.animOffset), 1);
      
      // Pièce dorée avec reflet
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#FFD700";
      ctx.fill();
      ctx.strokeStyle = "#FFA500";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Reflet
      ctx.beginPath();
      ctx.arc(-4, -4, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fill();
      
      ctx.restore();
    }
  }
  
  // Ennemis avec animations
  for(let e of game.enemies) {
    ctx.save();
    ctx.translate(e.x + e.w/2, e.y + e.h/2);
    ctx.scale(e.dir, 1);
    
    // Corps de l'ennemi selon son type
    if(e.type === 0) {
      // Ennemi basique - Slime
      ctx.fillStyle = "#8B008B";
      ctx.beginPath();
      ctx.ellipse(0, 0, e.w/2, e.h/2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Yeux
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(-8, -5, 5, 5);
      ctx.fillRect(3, -5, 5, 5);
      ctx.fillStyle = "#000000";
      ctx.fillRect(-6, -3, 2, 2);
      ctx.fillRect(5, -3, 2, 2);
    } else if(e.type === 1) {
      // Ennemi sauteur - Grenouille
      ctx.fillStyle = "#228B22";
      ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h * 0.8);
      ctx.fillStyle = "#32CD32";
      ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h * 0.3);
      
      // Pattes
      ctx.fillStyle = "#228B22";
      ctx.fillRect(-e.w/2, e.h * 0.3, 6, 6);
      ctx.fillRect(e.w/2 - 6, e.h * 0.3, 6, 6);
    } else {
      // Ennemi résistant - Golem
      ctx.fillStyle = "#696969";
      ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);
      ctx.strokeStyle = "#2F4F4F";
      ctx.lineWidth = 2;
      ctx.strokeRect(-e.w/2, -e.h/2, e.w, e.h);
      
      // Fissures si endommagé
      if(e.health < 2) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-e.w/3, -e.h/3);
        ctx.lineTo(e.w/3, e.h/3);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }
  
  // Bonus animé
  if(game.bonus && !game.bonus.got) {
    ctx.save();
    ctx.translate(game.bonus.x + 12, game.bonus.y + 12);
    ctx.rotate(Date.now() / 300);
    
    // Aura magique
    let auraGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    auraGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    auraGradient.addColorStop(0.5, "rgba(255, 215, 0, 0.5)");
    auraGradient.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = auraGradient;
    ctx.fillRect(-30, -30, 60, 60);
    
    // Icône du bonus
    ctx.fillStyle = ["#FFD700", "#FF1493", "#00CED1", "#FF4500", "#32CD32"][game.bonus.id];
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -10, 20, 20);
    
    ctx.restore();
  }
  
  // Checkpoints
  for(let cp of game.checkpoints) {
    ctx.fillStyle = cp.activated ? "#00FF00" : "#FFFF00";
    ctx.fillRect(cp.x, cp.y, cp.w, cp.h);
    ctx.strokeStyle = cp.activated ? "#008000" : "#FFD700";
    ctx.lineWidth = 3;
    ctx.strokeRect(cp.x, cp.y, cp.w, cp.h);
    
    // Drapeau du checkpoint
    ctx.fillStyle = cp.activated ? "#00FF00" : "#FF0000";
    ctx.beginPath();
    ctx.moveTo(cp.x + cp.w/2, cp.y);
    ctx.lineTo(cp.x + cp.w - 5, cp.y + 15);
    ctx.lineTo(cp.x + cp.w/2, cp.y + 30);
    ctx.closePath();
    ctx.fill();
  }
  
  // Drapeau final animé
  let f = game.flag;
  ctx.save();
  ctx.translate(f.x + f.w/2, f.y);
  
  // Mât
  ctx.fillStyle = "#8B4513";
  ctx.fillRect(-2, 0, 4, f.h);
  
  // Drapeau ondulant
  ctx.fillStyle = "#FF0000";
  ctx.beginPath();
  ctx.moveTo(2, 5);
  for(let i = 0; i <= 20; i++) {
    let x = 2 + i * 1.5;
    let y = 5 + Math.sin((i + game.flagAnim / 10) / 3) * 5;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(32, 20);
  ctx.lineTo(2, 20);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
  
  // Joueur avec animations
  let p = game.player;
  ctx.save();
  ctx.translate(p.x + p.w/2, p.y + p.h/2);
  
  // Effet d'invulnérabilité
  if(p.invulnerable > 0 && p.invulnerable % 10 < 5) {
    ctx.globalAlpha = 0.5;
  }
  
  ctx.scale(p.dir, 1);
  
  // Personnage détaillé
  if(skinImgs[skinNames[currentSkin]].complete) {
    ctx.drawImage(skinImgs[skinNames[currentSkin]], -16, -16, 32, 32);
  } else {
    // Fallback si l'image n'est pas chargée
    ctx.fillStyle = "#FF6B6B";
    ctx.fillRect(-16, -16, 32, 32);
    ctx.fillStyle = "#FFDFBA";
    ctx.fillRect(-12, -12, 24, 12);
    ctx.fillStyle = "#000000";
    ctx.fillRect(-8, -8, 4, 4);
    ctx.fillRect(4, -8, 4, 4);
  }
  
  // Bulles sous l'eau
  if(p.inWater) {
    for(let i = 0; i < 3; i++) {
      let bubbleY = -20 - i * 10 - (Date.now() / 50) % 30;
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(Math.sin(i) * 10, bubbleY, 3 + i, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.restore();
  
  // Particules
  drawParticles();
  
  // Décorations premier plan
  ctx.save();
  ctx.translate(-game.camX, -game.camY);
  game.decorations.filter(d => d.layer === 'front').forEach(dec => {
    drawDecoration(dec);
  });
  ctx.restore();
  
  // Arbres de premier plan (parallaxe)
  ctx.save();
  ctx.translate(-game.camX * 1.2, -game.camY);
  for(let i = 0; i < WORLD_W; i += 200) {
    drawTree(i, canvas.height - 100, 1.2, 'front');
  }
  ctx.restore();
  
  // Météo
  drawWeather();
  
  // Effet de lumière global selon l'heure
  if(timeOfDay < 0.3 || timeOfDay > 0.8) {
    ctx.fillStyle = "rgba(0, 0, 50, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  ctx.restore();
}

// Fonctions de dessin auxiliaires
function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  
  for(let i = 0; i < 5; i++) {
    let offsetX = Math.cos(i * 1.2) * 20;
    let offsetY = Math.sin(i * 0.8) * 10;
    let radius = 15 + Math.sin(i) * 10;
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawTree(x, y, scale, layer) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  
  // Tronc
  ctx.fillStyle = "#654321";
  ctx.fillRect(-10, -60, 20, 60);
  
  // Feuillage
  ctx.fillStyle = layer === 'back' ? "#228B22" : "#006400";
  for(let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-30 + i * 10, -60 - i * 20);
    ctx.lineTo(0, -80 - i * 25);
    ctx.lineTo(30 - i * 10, -60 - i * 20);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.restore();
}

function drawGrass(x, y, height) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#3CB371";
  
  for(let i = 0; i < 5; i++) {
    let grassHeight = height * (0.5 + Math.random() * 0.5);
    let grassX = (i - 2) * 2;
    let grassCurve = Math.sin(Date.now() / 1000 + i) * 2;
    
    ctx.beginPath();
    ctx.moveTo(grassX, 0);
    ctx.quadraticCurveTo(grassX + grassCurve, -grassHeight/2, grassX + grassCurve * 2, -grassHeight);
    ctx.lineTo(grassX + 1, 0);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.restore();
}

function drawDecoration(dec) {
  ctx.save();
  
  // Trouver la plateforme sous la décoration
  let groundY = WORLD_H;
  for(let plat of game.platforms) {
    if(dec.x >= plat.x && dec.x <= plat.x + plat.w && plat.y < groundY) {
      groundY = plat.y;
    }
  }
  
  ctx.translate(dec.x, groundY);
  ctx.scale(dec.scale, dec.scale);
  
  if(dec.type === 'grass') {
    drawGrass(0, 0, 20);
  } else if(dec.type === 'flower') {
    // Tige
    ctx.strokeStyle = "#228B22";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -20);
    ctx.stroke();
    
    // Pétales
    ctx.fillStyle = dec.color;
    for(let i = 0; i < 6; i++) {
      ctx.save();
      ctx.translate(0, -20);
      ctx.rotate((i * 60 + Date.now() / 50) * Math.PI / 180);
      ctx.beginPath();
      ctx.ellipse(0, -8, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // Centre
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(0, -20, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

// Système de particules
function createParticle(x, y, vx, vy, color, life, type) {
  particles.push({x, y, vx, vy, color, life, maxLife: life, type});
}

function createJumpParticles(x, y) {
  for(let i = 0; i < 10; i++) {
    let angle = (Math.PI / 4) + (Math.PI / 2) * (i / 10);
    let speed = 2 + Math.random() * 2;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 
                   "#8B7355", 20 + Math.random() * 10, 'dust');
  }
}

function createDoubleJumpParticles(x, y) {
  for(let i = 0; i < 15; i++) {
    let angle = Math.random() * Math.PI * 2;
    let speed = 3 + Math.random() * 3;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 
                   "#87CEEB", 25 + Math.random() * 15, 'magic');
  }
}

function createCoinParticles(x, y) {
  for(let i = 0; i < 20; i++) {
    let angle = Math.random() * Math.PI * 2;
    let speed = 2 + Math.random() * 4;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 
                   "#FFD700", 30 + Math.random() * 20, 'sparkle');
  }
}

function createWaterSplash(x, y) {
  for(let i = 0; i < 15; i++) {
    let angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI/2;
    let speed = 3 + Math.random() * 3;
    waterSplashes.push({
      x: x, 
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30
    });
  }
}

function createEnemyDefeatParticles(x, y) {
  for(let i = 0; i < 25; i++) {
    let angle = Math.random() * Math.PI * 2;
    let speed = 3 + Math.random() * 4;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 
                   "#FF00FF", 40 + Math.random() * 20, 'enemy');
  }
}

function createBreakParticles(x, y) {
  for(let i = 0; i < 15; i++) {
    let angle = Math.random() * Math.PI * 2;
    let speed = 2 + Math.random() * 3;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 
                   "#8B4513", 30 + Math.random() * 20, 'debris');
  }
}

function createCheckpointParticles(x, y) {
  for(let i = 0; i < 30; i++) {
    let angle = Math.random() * Math.PI * 2;
    let speed = 1 + Math.random() * 3;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 
                   "#00FF00", 50 + Math.random() * 30, 'checkpoint');
  }
}

function createRespawnParticles(x, y) {
  for(let i = 0; i < 20; i++) {
    let angle = Math.random() * Math.PI * 2;
    let radius = 40;
    let px = x + Math.cos(angle) * radius;
    let py = y + Math.sin(angle) * radius;
    createParticle(px, py, -Math.cos(angle) * 2, -Math.sin(angle) * 2, 
                   "#FFFFFF", 40, 'respawn');
  }
}

function createBonusParticles(x, y) {
  for(let i = 0; i < 30; i++) {
    let angle = (i / 30) * Math.PI * 2;
    let speed = 4;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 
                   `hsl(${i * 12}, 100%, 50%)`, 60, 'bonus');
  }
}

function createVictoryParticles() {
  for(let i = 0; i < 100; i++) {
    let x = Math.random() * canvas.width;
    let y = canvas.height;
    let vx = (Math.random() - 0.5) * 4;
    let vy = -5 - Math.random() * 10;
    createParticle(x, y, vx, vy, 
                   `hsl(${Math.random() * 360}, 100%, 50%)`, 100, 'victory');
  }
}

function updateParticles() {
  // Particules générales
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3;
    p.life--;
    return p.life > 0;
  });
  
  // Éclaboussures d'eau
  waterSplashes = waterSplashes.filter(s => {
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.5;
    s.life--;
    return s.life > 0;
  });
}

function drawParticles() {
  ctx.save();
  ctx.translate(-game.camX, -game.camY);
  
  // Dessiner les particules
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    
    if(p.type === 'sparkle') {
      // Étoile scintillante
      ctx.fillStyle = p.color;
      drawStar(p.x, p.y, 5, 3, 5);
    } else if(p.type === 'magic') {
      // Particule magique
      let gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 5);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
    } else {
      // Particule normale
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    
    ctx.restore();
  });
  
  // Dessiner les éclaboussures d'eau
  waterSplashes.forEach(s => {
    ctx.save();
    ctx.globalAlpha = s.life / 30;
    ctx.fillStyle = "rgba(100, 150, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  
  ctx.restore();
}

function drawStar(x, y, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let step = Math.PI / spikes;
  
  ctx.beginPath();
  ctx.moveTo(x, y - outerRadius);
  
  for(let i = 0; i < spikes; i++) {
    ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
    rot += step;
    ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
    rot += step;
  }
  
  ctx.lineTo(x, y - outerRadius);
  ctx.closePath();
  ctx.fill();
}

// Système météo
function updateWeather() {
  if(weatherType === 'rain') {
    if(weatherParticles.length < 100) {
      weatherParticles.push({
        x: Math.random() * (canvas.width + 200) - 100,
        y: -10,
        vx: windForce * 10,
        vy: 5 + Math.random() * 3,
        type: 'rain'
      });
    }
  } else if(weatherType === 'snow') {
    if(weatherParticles.length < 50) {
      weatherParticles.push({
        x: Math.random() * (canvas.width + 200) - 100,
        y: -10,
        vx: windForce * 5 + (Math.random() - 0.5),
        vy: 1 + Math.random(),
        size: 2 + Math.random() * 4,
        type: 'snow'
      });
    }
  }
  
  // Mise à jour des particules météo
  weatherParticles = weatherParticles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    
    if(p.type === 'snow') {
      p.x += Math.sin(Date.now() / 1000 + p.y) * 0.5;
    }
    
    return p.y < canvas.height + 10;
  });
}

function drawWeather() {
  weatherParticles.forEach(p => {
    if(p.type === 'rain') {
      ctx.strokeStyle = "rgba(150, 150, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx, p.y + p.vy * 2);
      ctx.stroke();
    } else if(p.type === 'snow') {
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Fonctions audio améliorées
function playCoinSound() {
  try {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch(e) {}
}

function playJumpSound() {
  try {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch(e) {}
}

function playDoubleJumpSound() {
  try {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch(e) {}
}

function playWaterSound() {
  try {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    let filter = audioCtx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch(e) {}
}

function playEnemyDefeatSound() {
  try {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch(e) {}
}

function playHurtSound() {
  try {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch(e) {}
}

function playCheckpointSound() {
  try {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    for(let i = 0; i < 3; i++) {
      let oscillator = audioCtx.createOscillator();
      let gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400 + i * 200, audioCtx.currentTime + i * 0.1);
      
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.1 + 0.2);
      
      oscillator.start(audioCtx.currentTime + i * 0.1);
      oscillator.stop(audioCtx.currentTime + i * 0.1 + 0.2);
    }
  } catch(e) {}
}

function playBonusSound() {
  try {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = audioCtx.createOscillator();
    let gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.2);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch(e) {}
}

function playVictorySound() {
  try {
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let notes = [523, 659, 784, 1047]; // Do, Mi, Sol, Do octave
    
    notes.forEach((freq, i) => {
      let oscillator = audioCtx.createOscillator();
      let gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + i * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.4);
      
      oscillator.start(audioCtx.currentTime + i * 0.15);
      oscillator.stop(audioCtx.currentTime + i * 0.15 + 0.4);
    });
  } catch(e) {}
}

// Fonction de collision
function rectCollide(a, b) {
  return a.x + a.w > b.x && 
         a.x < b.x + b.w && 
         a.y + a.h > b.y && 
         a.y < b.y + b.h;
}

// Initialisation
window.addEventListener('load', () => {
  if(allImagesLoaded >= imagesToLoad) {
    prepareMenu();
  }
});
