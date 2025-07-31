export const CHEST_TYPES = [
  {
    name: "Coffre en Bois",
    palette: {base:"#a0773c",ombre:"#6b4422",bord:"#44290c",fer:"#b3b3b3",clou:"#999"},
    draw(ctx) {
      ctx.fillStyle=this.palette.base; ctx.fillRect(5,10,22,14);
      ctx.fillStyle=this.palette.ombre; ctx.fillRect(5,20,22,4);
      ctx.strokeStyle=this.palette.bord; ctx.lineWidth=2;
      ctx.strokeRect(5,10,22,14);
      ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(5,10); ctx.lineTo(16,3); ctx.lineTo(27,10); ctx.closePath();
      ctx.fillStyle=this.palette.base; ctx.fill();
      ctx.strokeStyle=this.palette.bord; ctx.stroke();
      ctx.fillStyle=this.palette.fer; ctx.fillRect(13,10,6,14);
      ctx.strokeStyle=this.palette.clou; ctx.beginPath(); ctx.arc(16,11,1,0,2*Math.PI); ctx.stroke();
      ctx.fillStyle=this.palette.clou; ctx.beginPath(); ctx.arc(7,12,1,0,2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(25,12,1,0,2*Math.PI); ctx.fill();
    }
  },
  {
    name: "Coffre en Métal",
    palette: {base:"#aaa",ombre:"#888",bord:"#555",fer:"#dde7f6",clou:"#222"},
    draw(ctx) {
      ctx.fillStyle=this.palette.base; ctx.fillRect(5,10,22,14);
      ctx.fillStyle=this.palette.ombre; ctx.fillRect(5,20,22,4);
      ctx.strokeStyle=this.palette.bord; ctx.lineWidth=2;
      ctx.strokeRect(5,10,22,14);
      ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(5,10); ctx.quadraticCurveTo(16,3,27,10);
      ctx.lineTo(27,10); ctx.lineTo(5,10); ctx.closePath();
      ctx.fillStyle=this.palette.base; ctx.fill();
      ctx.strokeStyle=this.palette.bord; ctx.stroke();
      ctx.fillStyle=this.palette.fer; ctx.fillRect(12,10,8,14);
      ctx.strokeStyle=this.palette.clou; ctx.beginPath(); ctx.arc(16,22,1,0,2*Math.PI); ctx.stroke();
      ctx.fillStyle=this.palette.clou; ctx.beginPath(); ctx.arc(7,12,1,0,2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(25,12,1,0,2*Math.PI); ctx.fill();
    }
  },
  {
    name: "Coffre en Or",
    palette: {base:"#ffe066",ombre:"#d4b940",bord:"#9a8226",fer:"#fff0b0",clou:"#f6c700"},
    draw(ctx) {
      ctx.fillStyle=this.palette.base; ctx.fillRect(5,10,22,14);
      ctx.fillStyle=this.palette.ombre; ctx.fillRect(5,20,22,4);
      ctx.strokeStyle=this.palette.bord; ctx.lineWidth=2;
      ctx.strokeRect(5,10,22,14);
      ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(5,10); ctx.quadraticCurveTo(16,3,27,10);
      ctx.lineTo(27,10); ctx.lineTo(5,10); ctx.closePath();
      ctx.fillStyle=this.palette.base; ctx.fill();
      ctx.strokeStyle=this.palette.bord; ctx.stroke();
      ctx.fillStyle=this.palette.fer; ctx.fillRect(13,10,6,14);
      ctx.strokeStyle=this.palette.clou; ctx.beginPath(); ctx.arc(16,11,1,0,2*Math.PI); ctx.stroke();
      ctx.fillStyle="#8fd6ff"; ctx.beginPath(); ctx.arc(16,18,2,0,2*Math.PI); ctx.fill();
    }
  },
  {
    name: "Coffre en Diamant",
    palette: {base:"#8be1e6",ombre:"#41bcc9",bord:"#32768b",fer:"#fff",clou:"#7de0f9"},
    draw(ctx) {
      ctx.fillStyle=this.palette.base; ctx.fillRect(5,10,22,14);
      ctx.fillStyle=this.palette.ombre; ctx.fillRect(5,20,22,4);
      ctx.strokeStyle=this.palette.bord; ctx.lineWidth=2;
      ctx.strokeRect(5,10,22,14);
      ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(5,10); ctx.lineTo(10,5); ctx.lineTo(16,3); ctx.lineTo(22,5); ctx.lineTo(27,10); ctx.closePath();
      ctx.fillStyle=this.palette.base; ctx.fill();
      ctx.strokeStyle=this.palette.bord; ctx.stroke();
      ctx.fillStyle=this.palette.fer; ctx.beginPath(); ctx.arc(11,8,2,0,2*Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc(21,8,2,0,2*Math.PI); ctx.fill();
      ctx.fillStyle="#a5ffe9"; ctx.beginPath(); ctx.arc(16,17,2,0,2*Math.PI); ctx.fill();
    }
  }
];

const cache = new Map();

export function randomChestType() {
  return Math.floor(Math.random() * CHEST_TYPES.length);
}

export function getChestImage(typeIndex) {
  const idx = (typeIndex + CHEST_TYPES.length) % CHEST_TYPES.length;
  if (!cache.has(idx)) {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const ctx = c.getContext('2d');
    CHEST_TYPES[idx].draw(ctx);
    const img = new Image();
    img.src = c.toDataURL();
    cache.set(idx, img);
  }
  return cache.get(idx);
}
