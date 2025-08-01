const fs = require("fs");
const { PNG } = require("pngjs");
const W = 24, H = 24;
const COLORS = {
  light: [70,177,242,255],
  dark: [24,58,124,255],
  mid: [35,81,124,255],
  white: [255,255,255,255],
  red: [200,40,40,255]
};
function blank() {
  const png = new PNG({width: W, height: H});
  for(let i=0;i<png.data.length;i++) png.data[i]=0;
  return png;
}
function drawRect(png,x,y,w,h,color){
  for(let iy=0;iy<h;iy++){
    for(let ix=0;ix<w;ix++){
      const idx=((y+iy)*W+(x+ix))*4;
      png.data[idx]=color[0];
      png.data[idx+1]=color[1];
      png.data[idx+2]=color[2];
      png.data[idx+3]=color[3];
    }
  }
}
function save(png,name){png.pack().pipe(fs.createWriteStream('assets/'+name));}

function drawBase(pose){
  const p=blank();
  // head
  drawRect(p,9,2,6,6,COLORS.light);
  // body
  let bodyY=8;
  if(pose==='crouch') bodyY=12;
  if(pose==='prone'){bodyY=16; drawRect(p,4,bodyY,16,4,COLORS.mid); return p;}
  drawRect(p,8,bodyY,8,8,COLORS.mid);
  // arms
  if(pose==='fly'){ drawRect(p,6,bodyY-4,4,8,COLORS.dark); drawRect(p,14,bodyY-4,4,8,COLORS.dark); }
  else {drawRect(p,6,bodyY,4,8,COLORS.dark); drawRect(p,14,bodyY,4,8,COLORS.dark);}
  // legs
  let legY=bodyY+8;
  if(pose==='crouch') legY=bodyY+4;
  drawRect(p,8,legY,3,6,COLORS.mid);
  drawRect(p,13,legY,3,6,COLORS.mid);
  // cape for flying
  if(pose==='fly'){ drawRect(p,4,bodyY-2,4,12,COLORS.red); }
  return p;
}

// simple frame variations
const frames={
  player_idle1: drawBase('stand'),
  player_idle2: drawBase('stand'),
  player_walk1: drawBase('stand'),
  player_walk2: drawBase('stand'),
  player_run1: drawBase('stand'),
  player_run2: drawBase('stand'),
  player_jump: drawBase('stand'),
  player_double_jump1: drawBase('stand'),
  player_double_jump2: drawBase('stand'),
  player_fly1: drawBase('fly'),
  player_fly2: drawBase('fly'),
  player_crouch: drawBase('crouch'),
  player_crouch_walk1: drawBase('crouch'),
  player_crouch_walk2: drawBase('crouch'),
  player_prone: drawBase('prone'),
  player_prone_walk1: drawBase('prone'),
  player_prone_walk2: drawBase('prone')
};

for(const [name,png] of Object.entries(frames)){
  save(png,name+'.png');
}
