export function drawIcon(obj, ctx) {
  ctx.clearRect(0,0,32,32);
  ctx.save();
  ctx.translate(16,16);
  ctx.scale(2.2,2.2);
  
  // --- DESSIN DES ICÔNES POUR CHAQUE OBJET ---
  switch(obj) {
    // --- ARMES TRANCHANTES ---
    case "Couteau": case "Couteau à cran d'arrêt": case "Couteau suisse": case "Serpe":
        ctx.fillStyle="#bbb"; ctx.fillRect(-2,0,9,2); ctx.fillStyle="#823f12"; ctx.fillRect(-6,-1,4,4); break;
    case "Machette": ctx.fillStyle="#bbb"; ctx.fillRect(-4,0,12,3); ctx.fillStyle="#823f12"; ctx.fillRect(-8,-1,4,5); break;
    case "Bouteille cassée": ctx.fillStyle="rgba(100,200,100,0.7)"; ctx.beginPath(); ctx.moveTo(-4,8); ctx.lineTo(-3,-8); ctx.lineTo(0,-5); ctx.lineTo(3,-8); ctx.lineTo(4,8); ctx.closePath(); ctx.fill(); break;
    case "Shuriken": ctx.fillStyle="#444"; ctx.save(); ctx.rotate(Math.PI/4); ctx.fillRect(-5,-1,10,2); ctx.fillRect(-1,-5,2,10); ctx.restore(); break;

    // --- ARMES CONTONDANTES ---
    case "Batte de baseball": case "Batte cloutée": case "Massue": case "Matraque":
        ctx.fillStyle="#a0773c"; ctx.fillRect(-7,-1,14,3);
        if (obj === "Batte cloutée") { ctx.fillStyle="#555"; ctx.fillRect(0,0,1,1); ctx.fillRect(2,0,1,1); ctx.fillRect(4,0,1,1); }
        break;
    case "Poing américain": ctx.fillStyle="#888"; ctx.fillRect(-4,-3,8,6); ctx.fillStyle="black"; ctx.fillRect(-3,-2,2,4); ctx.fillRect(1,-2,2,4); break;
    case "Barre à mine": case "Pied de biche":
        ctx.fillStyle="#d44"; ctx.fillRect(-8,-1,16,2);
        if(obj === "Pied de biche") { ctx.fillRect(6,-3,2,4); }
        break;
    case "Râteau": ctx.fillStyle="#555"; ctx.fillRect(-1,-8,2,16); ctx.fillStyle="#888"; ctx.fillRect(-6,6,12,2); break;

    // --- ARMES D'AST ---
    case "Lance": case "Épieu": case "Piquet en bois":
        ctx.fillStyle="#ca8b36"; ctx.fillRect(-9,-1,16,3); 
        ctx.fillStyle= obj === "Piquet en bois" ? "#ca8b36" : "#eee"; ctx.beginPath(); ctx.moveTo(7,0); ctx.lineTo(11,-2); ctx.lineTo(11,2); ctx.closePath(); ctx.fill(); 
        break;

    // --- ARMES À DISTANCE ---
    case "Arc": case "Arc électrique":
        ctx.strokeStyle="#965f36"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,9,Math.PI*0.9,Math.PI*2.1); ctx.stroke();
        if (obj === "Arc électrique") { ctx.strokeStyle="#70d1f7"; ctx.lineWidth=1; ctx.moveTo(0,-9); ctx.lineTo(0,9); ctx.stroke(); }
        break;
    case "Arbalète": ctx.fillStyle="#684727"; ctx.fillRect(-6,2,12,2); ctx.strokeStyle="#333"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-6,-4); ctx.lineTo(6,-4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,8); ctx.stroke(); break;
    case "Pistolet": case "Revolver": case "Pistolet à plomb":
        ctx.fillStyle="#888"; ctx.fillRect(-6,2,10,3); ctx.fillStyle="#333"; ctx.fillRect(4,2,3,8); 
        if (obj === "Revolver") { ctx.fillRect(-2, 2, 3, 3); }
        break;
    case "Fusil de chasse": case "Fusil d’assaut": case "Mitraillette":
        ctx.fillStyle="#b97e4e"; ctx.fillRect(-9,-1,17,3); ctx.fillStyle="#555"; ctx.fillRect(6,0,7,3); 
        break;
    case "Fronde": case "Lance-pierre":
        ctx.fillStyle="#823f12"; ctx.beginPath(); ctx.moveTo(-4,8); ctx.lineTo(-6,0); ctx.lineTo(-2,-2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(4,8); ctx.lineTo(6,0); ctx.lineTo(2,-2); ctx.closePath(); ctx.fill();
        break;

    // --- EXPLOSIFS & MUNITIONS ---
    case "Grenade": case "Bombe fumigène": case "Bombe artisanale":
        ctx.fillStyle= obj === "Grenade" ? "#484" : "#888"; ctx.beginPath(); ctx.arc(0,0,6,0,2*Math.PI); ctx.fill(); ctx.strokeStyle="#222"; ctx.strokeRect(-3,-8,6,4); 
        break;
    case "Dynamite": ctx.fillStyle = "#d52"; ctx.fillRect(-6,-2,12,4); ctx.fillStyle="#fff"; ctx.fillRect(6,-1,2,2); break;
    case "Cocktail molotov": ctx.fillStyle="rgba(100,200,100,0.7)"; ctx.fillRect(-3,-4,6,10); ctx.fillStyle="#ffb300"; ctx.fillRect(-4, -8, 8, 4); break;
    case "Flèches": ctx.fillStyle="#ca8b36"; ctx.fillRect(-1,-8,2,16); ctx.fillStyle="#eee"; ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(-2,-6); ctx.lineTo(2,-6); ctx.closePath(); ctx.fill(); break;
    case "Caisse de munitions": ctx.fillStyle="#484"; ctx.fillRect(-7,-5,14,10); ctx.strokeStyle="#222"; ctx.strokeRect(-7,-5,14,10); break;

    // --- ÉQUIPEMENT DE TÊTE ---
    case "Masque à gaz": ctx.fillStyle="#222"; ctx.beginPath(); ctx.arc(0,3,7,0,2*Math.PI); ctx.fill(); ctx.fillStyle="#888"; ctx.beginPath(); ctx.arc(-3,8,2,0,2*Math.PI); ctx.fill(); ctx.beginPath(); ctx.arc(3,8,2,0,2*Math.PI); ctx.fill(); break;
    case "Casque militaire": case "Casque chantier":
        ctx.fillStyle= obj === "Casque militaire" ? "#495" : "#ffe01b"; ctx.beginPath(); ctx.arc(0,-2,8,Math.PI*1.1,Math.PI*2.1); ctx.fill(); ctx.fillStyle="#222"; ctx.fillRect(-7,2,14,6); 
        break;
    case "Lunettes protection": case "Lunettes nuit":
        ctx.fillStyle = obj === "Lunettes nuit" ? "#2f2" : "#fff"; ctx.beginPath(); ctx.arc(-4,0,4,0,2*Math.PI); ctx.fill(); ctx.beginPath(); ctx.arc(4,0,4,0,2*Math.PI); ctx.fill(); ctx.fillRect(-1,-1,2,2);
        break;
    case "Cagoule": case "Masque tissu":
        ctx.fillStyle="#333"; ctx.beginPath(); ctx.arc(0,0,8,0,2*Math.PI); ctx.fill(); ctx.fillStyle="black"; ctx.beginPath(); ctx.arc(-3,-1,2,0,2*Math.PI); ctx.fill(); ctx.beginPath(); ctx.arc(3,-1,2,0,2*Math.PI); ctx.fill();
        break;

    // --- ÉQUIPEMENT CORPOREL ---
    case "Gilet pare-balles": case "Gilet en cuir": case "Veste camouflage":
        ctx.fillStyle= obj === "Gilet en cuir" ? "#823f12" : (obj === "Veste camouflage" ? "#556B2F" : "#333"); ctx.fillRect(-7,0,14,10); ctx.fillStyle="#666"; ctx.fillRect(-5,7,10,4); 
        break;
    case "Poncho pluie": ctx.fillStyle="#2b6ca3"; ctx.fillRect(-6,0,12,8); ctx.strokeStyle="#104085"; ctx.strokeRect(-6,0,12,8); ctx.fillStyle="#6da0e8"; ctx.fillRect(-5,1,10,3); break;
    case "Bottes": ctx.fillStyle="#36271d"; ctx.fillRect(-6,7,5,7); ctx.fillRect(2,7,5,7); ctx.fillStyle="#a98b6a"; ctx.fillRect(-6,13,5,3); ctx.fillRect(2,13,5,3); break;
    case "Gants cuir": ctx.fillStyle="#823f12"; ctx.fillRect(-6,-4,12,8); break;
    case "Genouillères": ctx.fillStyle="#444"; ctx.fillRect(-6,-3,12,6); break;

    // --- OUTILS & LUMIÈRE ---
    case "Lampe torche": case "Lampe frontale":
        ctx.fillStyle="#222"; ctx.fillRect(-2,5,4,7); ctx.fillStyle = "#ffe01b"; ctx.beginPath(); ctx.arc(0,4,4,0,2*Math.PI); ctx.fill(); 
        if (obj === "Lampe frontale") { ctx.strokeStyle="#555"; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,8,6,Math.PI*0.2, Math.PI*0.8); ctx.stroke(); }
        break;
    case "Briquet": ctx.fillStyle="#d52"; ctx.fillRect(-2,3,4,6); ctx.fillStyle="#ffb300"; ctx.beginPath(); ctx.arc(0,2,2,0,Math.PI*2); ctx.fill(); break;
    case "Marteau": ctx.fillStyle="#bbb"; ctx.fillRect(-2,-6,4,10); ctx.fillStyle="#333"; ctx.fillRect(-6,-6,12,4); break;
    case "Pelle": case "Pelle pliante":
        ctx.fillStyle="#bbb"; ctx.fillRect(-1,-9,2,11); ctx.fillStyle="#444"; ctx.beginPath(); ctx.arc(0,-9,3,0,Math.PI); ctx.fill(); 
        break;
    case "Corde": ctx.strokeStyle="#a0773c"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*1.5); ctx.stroke(); ctx.arc(0,0,3,0,Math.PI*1.2); ctx.stroke(); break;
    case "Scie": case "Scie pliante":
        ctx.fillStyle="#bbb"; ctx.fillRect(-8,-1,16,3); ctx.strokeStyle="#444"; ctx.beginPath(); ctx.moveTo(-6,2); ctx.lineTo(6,2); ctx.stroke(); 
        break;
    case "Pinces": case "Pince coupante":
        ctx.fillStyle="#d52"; ctx.fillRect(-6,-2,4,4); ctx.fillRect(2,-2,4,4); ctx.fillStyle="#888"; ctx.fillRect(-2,0,4,8);
        break;
    case "Boite à outils": ctx.fillStyle="#d52"; ctx.fillRect(-7,-5,14,10); ctx.fillStyle="#333"; ctx.fillRect(-8,-3,16,2); break;

    // --- CONSOMMABLES (NOURRITURE & EAU) ---
    case "Bouteille d’eau": ctx.fillStyle="#70d1f7"; ctx.fillRect(-3,-6,6,12); ctx.fillStyle="#328bbf"; ctx.fillRect(-2,5,4,3); break;
    case "Gourde": ctx.fillStyle="#826447"; ctx.fillRect(-5,-4,10,12); ctx.strokeStyle="#4d3920"; ctx.lineWidth=1; ctx.strokeRect(-5,-4,10,12); ctx.beginPath(); ctx.arc(0,-5,4,Math.PI,0); ctx.fill(); break;
    case "Ration de survie": ctx.fillStyle="#a7c7a3"; ctx.fillRect(-6,-6,12,12); ctx.fillStyle="#6e976b"; ctx.fillRect(-4,-2,8,4); break;
    case "Conserve": case "Boite de sardines": case "Boîte de thon":
        ctx.fillStyle="#bbb"; ctx.fillRect(-6,-5,12,10); ctx.strokeStyle="#444"; ctx.strokeRect(-6,-5,12,10); 
        break;
    case "Chocolat": ctx.fillStyle="#4d3920"; ctx.fillRect(-5,-3,10,6); break;
    case "Barre énergétique": ctx.fillStyle="#ffe01b"; ctx.fillRect(-7,-2,14,4); ctx.fillStyle="#d52"; ctx.fillRect(-5,-1,10,2); break;
    
    // --- CONSOMMABLES (SOINS) ---
    case "Bandage": ctx.fillStyle="#eee"; ctx.fillRect(-6,-3,12,6); ctx.strokeStyle="#c99"; ctx.strokeRect(-6,-3,12,6); break;
    case "Trousse de secours": ctx.fillStyle="#a22"; ctx.fillRect(-7,-4,14,8); ctx.fillStyle="#fff"; ctx.fillRect(-2,-1,4,2); ctx.fillRect(-1,-2,2,4); break;
    case "Antibiotique": case "Capsule iodée": case "Médicaments": case "Antalgique":
        ctx.fillStyle="#fff"; ctx.fillRect(-4,-2,4,4); ctx.fillStyle="#d52"; ctx.fillRect(0,-2,4,4);
        break;
    case "Couverture de survie": ctx.fillStyle="#c0c0c0"; ctx.fillRect(-8,-6,16,12); break;

    // --- NAVIGATION & DIVERS ---
    case "Boussole": ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(0,0,9,0,2*Math.PI); ctx.fill(); ctx.strokeStyle="#222"; ctx.strokeRect(-2,-9,4,18); ctx.fillStyle="#d22"; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-7); ctx.lineTo(2,-2); ctx.closePath(); ctx.fill(); break;
    case "Carte papier": ctx.fillStyle="#ffe8b7"; ctx.fillRect(-6,-5,12,10); ctx.strokeStyle="#b8986b"; ctx.strokeRect(-6,-5,12,10); ctx.fillStyle="#b8986b"; ctx.fillRect(-3,-2,7,2); break;
    case "Clé": ctx.fillStyle="#ffd700"; ctx.beginPath(); ctx.arc(-4,0,3,0,2*Math.PI); ctx.fill(); ctx.fillRect(-1,-1,8,2); break;
    case "Pile AA": ctx.fillStyle="#bbb"; ctx.fillRect(-3,-7,6,14); ctx.fillStyle="#ffe01b"; ctx.fillRect(-2,6,4,2); ctx.strokeStyle="#222"; ctx.strokeRect(-3,-7,6,14); break;
    case "Tente": ctx.fillStyle="#246c34"; ctx.beginPath(); ctx.moveTo(-8,7); ctx.lineTo(0,-8); ctx.lineTo(8,7); ctx.closePath(); ctx.fill(); break;
    case "Sac à dos blindé": ctx.fillStyle="#444"; ctx.fillRect(-6,-8,12,16); ctx.fillStyle="#888"; ctx.fillRect(-5,-7,10,2); break;
    
    // --- Icône générique pour le reste ---
    default:
      let h = 0; for (let i=0;i<obj.length;i++) h = (h*31+obj.charCodeAt(i))&255;
      ctx.fillStyle=`hsl(${h*1.4}, 50%, 60%)`;
      ctx.fillRect(-8,-8,16,16);
      ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.strokeRect(-8,-8,16,16);
      ctx.font="bold 11px monospace";
      ctx.fillStyle="rgba(0,0,0,0.6)";
      ctx.textAlign="center";
      ctx.fillText(obj.substring(0, 2).toUpperCase(), 0, 4);
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
