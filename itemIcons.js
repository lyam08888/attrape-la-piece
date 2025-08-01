// --- Cache pour les icônes ---
const iconCache = new Map();

// Fonction principale pour dessiner une icône sur un canvas donné
function drawIcon(objName, ctx) {
  ctx.clearRect(0,0,32,32);
  ctx.save();
  ctx.translate(16,16);
  ctx.scale(1.2, 1.2); // Légère réduction pour mieux voir les bords
  
  // La logique de dessin reste la vôtre, elle est très bien !
  switch(objName) {
    // --- ARMES TRANCHANTES ---
    case "Couteau": case "Couteau à cran d'arrêt": case "Couteau suisse": case "Serpe":
        ctx.fillStyle="#bbb"; ctx.fillRect(-2,0,9,2); ctx.fillStyle="#823f12"; ctx.fillRect(-6,-1,4,4); break;
    case "Machette": ctx.fillStyle="#bbb"; ctx.fillRect(-4,0,12,3); ctx.fillStyle="#823f12"; ctx.fillRect(-8,-1,4,5); break;
    // ... (tous vos autres cas de switch)
    
    // --- Outils ---
    case "pickaxe": ctx.fillStyle="#888"; ctx.fillRect(-2,-8,4,16); ctx.fillStyle="#543"; ctx.fillRect(-8,-8,16,4); break;
    case "shovel": ctx.fillStyle="#888"; ctx.fillRect(-1,-8,2,16); ctx.fillStyle="#444"; ctx.beginPath(); ctx.arc(0, -8, 5, Math.PI, 2*Math.PI); ctx.fill(); break;
    case "axe": ctx.fillStyle="#888"; ctx.fillRect(-1,-8,2,16); ctx.fillStyle="#ccc"; ctx.beginPath(); ctx.moveTo(-2,-8); ctx.lineTo(-8,-8); ctx.lineTo(6, -2); ctx.closePath(); ctx.fill(); break;
    case "sword": ctx.fillStyle="#ccc"; ctx.fillRect(-1,-10,2,16); ctx.fillStyle="#a65"; ctx.fillRect(-4,6,8,2); break;
    case "knife": ctx.fillStyle="#ccc"; ctx.fillRect(-1,-5,2,8); ctx.fillStyle="#a65"; ctx.fillRect(-2,3,4,2); break;
    
    // --- Icône générique pour le reste ---
    default:
      let h = 0; for (let i=0;i<objName.length;i++) h = (h*31+objName.charCodeAt(i))&255;
      ctx.fillStyle=`hsl(${h*1.4}, 50%, 60%)`;
      ctx.fillRect(-12,-12,24,24);
      ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.strokeRect(-12,-12,24,24);
      ctx.font="bold 11px monospace";
      ctx.fillStyle="rgba(0,0,0,0.6)";
      ctx.textAlign="center";
      ctx.fillText(objName.substring(0, 2).toUpperCase(), 0, 4);
  }
  ctx.restore();
}

// Fonction exportée qui utilise le cache
export function getItemIcon(name, assets) {
  // Si l'icône est déjà dans le cache, on la retourne directement
  if (iconCache.has(name)) {
    return iconCache.get(name);
  }
  
  // On vérifie d'abord si un asset direct existe (pour les outils)
  const assetKey = `tool_${name}`;
  if (assets && assets[assetKey]) {
      iconCache.set(name, assets[assetKey]);
      return assets[assetKey];
  }

  // Sinon, on la génère, on la met en cache et on la retourne
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  drawIcon(name, ctx);
  
  const img = new Image();
  img.src = canvas.toDataURL();
  iconCache.set(name, img);
  
  return img;
}
