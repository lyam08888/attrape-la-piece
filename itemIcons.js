export function drawIcon(obj, ctx) {
  ctx.clearRect(0,0,32,32);
  ctx.save();
  ctx.translate(16,16);
  ctx.scale(2.2,2.2);
  switch(obj) {
    case "Couteau": ctx.fillStyle="#bbb"; ctx.fillRect(-2,0,9,2); ctx.fillStyle="#823f12"; ctx.fillRect(-6,-1,4,4); break;
    case "Hache": ctx.fillStyle="#af8555"; ctx.fillRect(-7,2,13,2); ctx.fillStyle="#eee"; ctx.fillRect(2,-3,5,9); break;
    case "Batte de baseball": ctx.fillStyle="#ddb970"; ctx.fillRect(-7,-1,14,3); break;
    case "Pied de biche": ctx.strokeStyle="#888"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(-2,2,8,0.9,2.7); ctx.stroke(); ctx.fillStyle="#888"; ctx.fillRect(2,-1,7,3); break;
    case "Lance": ctx.fillStyle="#ca8b36"; ctx.fillRect(-9,-1,16,3); ctx.fillStyle="#eee"; ctx.beginPath(); ctx.moveTo(7,0); ctx.lineTo(11,-2); ctx.lineTo(11,2); ctx.closePath(); ctx.fill(); break;
    case "Arbalète": ctx.fillStyle="#684727"; ctx.fillRect(-6,2,12,2); ctx.strokeStyle="#333"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-6,-4); ctx.lineTo(6,-4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,8); ctx.stroke(); break;
    case "Arc": ctx.strokeStyle="#965f36"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,9,Math.PI*0.9,Math.PI*2.1); ctx.stroke(); break;
    case "Pistolet": ctx.fillStyle="#888"; ctx.fillRect(-6,2,10,3); ctx.fillStyle="#333"; ctx.fillRect(4,2,3,8); break;
    case "Fusil de chasse": ctx.fillStyle="#b97e4e"; ctx.fillRect(-9,-1,17,3); ctx.fillStyle="#555"; ctx.fillRect(6,0,7,3); break;
    case "Grenade": ctx.fillStyle="#484"; ctx.beginPath(); ctx.arc(0,0,6,0,2*Math.PI); ctx.fill(); ctx.strokeStyle="#222"; ctx.strokeRect(-3,-8,6,4); break;
    case "Masque à gaz": ctx.fillStyle="#222"; ctx.beginPath(); ctx.arc(0,3,7,0,2*Math.PI); ctx.fill(); ctx.fillStyle="#888"; ctx.beginPath(); ctx.arc(-3,8,2,0,2*Math.PI); ctx.fill(); ctx.beginPath(); ctx.arc(3,8,2,0,2*Math.PI); ctx.fill(); break;
    case "Casque militaire": ctx.fillStyle="#495"; ctx.beginPath(); ctx.arc(0,-2,8,Math.PI*1.1,Math.PI*2.1); ctx.fill(); ctx.fillStyle="#222"; ctx.fillRect(-7,2,14,6); break;
    case "Gilet pare-balles": ctx.fillStyle="#333"; ctx.fillRect(-7,0,14,10); ctx.fillStyle="#666"; ctx.fillRect(-5,7,10,4); break;
    case "Poncho pluie": ctx.fillStyle="#2b6ca3"; ctx.fillRect(-6,0,12,8); ctx.strokeStyle="#104085"; ctx.strokeRect(-6,0,12,8); ctx.fillStyle="#6da0e8"; ctx.fillRect(-5,1,10,3); break;
    case "Bottes": ctx.fillStyle="#36271d"; ctx.fillRect(-6,7,5,7); ctx.fillRect(2,7,5,7); ctx.fillStyle="#a98b6a"; ctx.fillRect(-6,13,5,3); ctx.fillRect(2,13,5,3); break;
    case "Lampe torche": ctx.fillStyle="#222"; ctx.fillRect(-2,5,4,7); ctx.fillStyle = "#ffe01b"; ctx.beginPath(); ctx.arc(0,4,4,0,2*Math.PI); ctx.fill(); break;
    case "Briquet": ctx.fillStyle="#d52"; ctx.fillRect(-2,3,4,6); ctx.fillStyle="#ffb300"; ctx.beginPath(); ctx.arc(0,2,2,0,Math.PI*2); ctx.fill(); break;
    case "Bougie": ctx.fillStyle="#eee"; ctx.fillRect(-1,-7,2,10); ctx.fillStyle="#ffe01b"; ctx.beginPath(); ctx.arc(0,-7,2,0,Math.PI*2); ctx.fill(); break;
    case "Tournevis": ctx.fillStyle="#e6e07a"; ctx.fillRect(-6,-1,7,2); ctx.fillStyle="#8b572a"; ctx.fillRect(1,-2,3,4); break;
    case "Marteau": ctx.fillStyle="#bbb"; ctx.fillRect(-2,-6,4,10); ctx.fillStyle="#333"; ctx.fillRect(-6,-6,12,4); break;
    case "Pelle": ctx.fillStyle="#bbb"; ctx.fillRect(-1,-9,2,11); ctx.fillStyle="#444"; ctx.beginPath(); ctx.arc(0,-9,3,0,Math.PI); ctx.fill(); break;
    case "Bouteille d’eau": ctx.fillStyle="#70d1f7"; ctx.fillRect(-3,-6,6,12); ctx.fillStyle="#328bbf"; ctx.fillRect(-2,5,4,3); break;
    case "Gourde": ctx.fillStyle="#826447"; ctx.fillRect(-5,-4,10,12); ctx.strokeStyle="#4d3920"; ctx.lineWidth=1; ctx.strokeRect(-5,-4,10,12); ctx.beginPath(); ctx.arc(0,-5,4,Math.PI,0); ctx.fill(); break;
    case "Bidon": ctx.fillStyle="#aaa"; ctx.fillRect(-7,-4,14,10); ctx.fillStyle="#d44"; ctx.fillRect(-2,-6,4,2); break;
    case "Ration de survie": ctx.fillStyle="#a7c7a3"; ctx.fillRect(-6,-6,12,12); ctx.fillStyle="#6e976b"; ctx.fillRect(-4,-2,8,4); break;
    case "Conserve": ctx.fillStyle="#bbb"; ctx.fillRect(-6,-5,12,10); ctx.strokeStyle="#444"; ctx.strokeRect(-6,-5,12,10); break;
    case "Bandage": ctx.fillStyle="#eee"; ctx.fillRect(-6,-3,12,6); ctx.strokeStyle="#c99"; ctx.strokeRect(-6,-3,12,6); break;
    case "Trousse de secours": ctx.fillStyle="#a22"; ctx.fillRect(-7,-4,14,8); ctx.fillStyle="#fff"; ctx.fillRect(-2,-1,4,2); ctx.fillRect(-1,-2,2,4); break;
    case "Boussole": ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(0,0,9,0,2*Math.PI); ctx.fill(); ctx.strokeStyle="#222"; ctx.strokeRect(-2,-9,4,18); ctx.fillStyle="#d22"; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-7); ctx.lineTo(2,-2); ctx.closePath(); ctx.fill(); break;
    case "Carte papier": ctx.fillStyle="#ffe8b7"; ctx.fillRect(-6,-5,12,10); ctx.strokeStyle="#b8986b"; ctx.strokeRect(-6,-5,12,10); ctx.fillStyle="#b8986b"; ctx.fillRect(-3,-2,7,2); break;
    case "Radio": ctx.fillStyle="#222"; ctx.fillRect(-5,-8,10,16); ctx.fillStyle="#d55"; ctx.fillRect(-2,-7,4,8); break;
    case "Talkie-walkie": ctx.fillStyle="#444"; ctx.fillRect(-3,-7,6,12); ctx.fillStyle="#bbb"; ctx.fillRect(-2,-4,4,4); ctx.strokeStyle="#777"; ctx.strokeRect(-3,-7,6,12); break;
    case "Sac de couchage": ctx.fillStyle="#21777b"; ctx.fillRect(-8,-4,16,12); ctx.fillStyle="#fff"; ctx.fillRect(-5,-1,10,2); break;
    case "Tente": ctx.fillStyle="#246c34"; ctx.beginPath(); ctx.moveTo(-8,7); ctx.lineTo(0,-8); ctx.lineTo(8,7); ctx.closePath(); ctx.fill(); break;
    case "Casserole": ctx.fillStyle="#ccc"; ctx.fillRect(-7,3,14,4); ctx.fillStyle="#888"; ctx.fillRect(-4,-3,8,6); break;
    case "Dentifrice": ctx.fillStyle="#fff"; ctx.fillRect(-5,2,10,4); ctx.fillStyle="#4bbf6b"; ctx.fillRect(-5,-3,10,5); break;
    case "Brosse à dents": ctx.fillStyle="#1ac0e0"; ctx.fillRect(-8,-2,16,2); ctx.fillStyle="#eee"; ctx.fillRect(6,-4,6,5); break;
    case "Pile AA": ctx.fillStyle="#bbb"; ctx.fillRect(-3,-7,6,14); ctx.fillStyle="#ffe01b"; ctx.fillRect(-2,6,4,2); ctx.strokeStyle="#222"; ctx.strokeRect(-3,-7,6,14); break;
    case "Bâton lumineux": ctx.fillStyle="#ee2"; ctx.fillRect(-7,-1,14,3); ctx.strokeStyle="#777"; ctx.strokeRect(-7,-1,14,3); break;
    case "Scie": ctx.fillStyle="#bbb"; ctx.fillRect(-8,-1,16,3); ctx.strokeStyle="#444"; ctx.beginPath(); ctx.moveTo(-6,2); ctx.lineTo(6,2); ctx.stroke(); break;
    case "Miroir de signalisation": ctx.fillStyle="#ddd"; ctx.fillRect(-8,-8,16,16); ctx.strokeStyle="#fff"; ctx.strokeRect(-8,-8,16,16); break;
    case "Rasoir": ctx.fillStyle="#444"; ctx.fillRect(-7,-2,14,4); ctx.fillStyle="#bbb"; ctx.fillRect(-2,0,4,8); break;
    case "Compteur Geiger": ctx.fillStyle="#111"; ctx.fillRect(-5,-8,10,16); ctx.fillStyle="#ffe01b"; ctx.fillRect(-3,-4,6,8); break;
    case "Capsule iodée": ctx.fillStyle="#ffd300"; ctx.beginPath(); ctx.arc(0,2,6,0,2*Math.PI); ctx.fill(); break;
    default:
      let h = 0; for (let i=0;i<obj.length;i++) h = (h*31+obj.charCodeAt(i))&255;
      ctx.fillStyle=`hsl(${h*1.2},60%,${60-(h%10)*2}%)`;
      ctx.fillRect(-8,-8,16,16);
      ctx.strokeStyle="#111"; ctx.strokeRect(-8,-8,16,16);
      ctx.font="8px monospace";
      ctx.fillStyle="#222";
      ctx.textAlign="center";
      ctx.fillText(obj[0],0,3);
  }
  ctx.restore();
}

const cache=new Map();
export function getItemIcon(name){
  if(!cache.has(name)){
    const c=document.createElement('canvas');
    c.width=c.height=32;
    drawIcon(name,c.getContext('2d'));
    const img=new Image();
    img.src=c.toDataURL();
    cache.set(name,img);
  }
  return cache.get(name);
}

export function getChestIcon(){
  return getItemIcon('Coffre');
}
