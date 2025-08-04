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
    case "tool_pickaxe":
        ctx.fillStyle="#8B4513"; ctx.fillRect(-1,-8,2,12); // Manche en bois
        ctx.fillStyle="#696969"; ctx.fillRect(-6,-8,12,3); // Tête de pioche
        ctx.fillStyle="#A9A9A9"; ctx.fillRect(-6,-5,12,1); // Reflet
        break;
    case "tool_shovel":
        ctx.fillStyle="#8B4513"; ctx.fillRect(-1,-8,2,12); // Manche
        ctx.fillStyle="#696969"; ctx.beginPath(); ctx.arc(0, -6, 4, 0, Math.PI); ctx.fill(); // Pelle
        ctx.fillStyle="#A9A9A9"; ctx.fillRect(-3,-6,6,1); // Reflet
        break;
    case "tool_axe":
        ctx.fillStyle="#8B4513"; ctx.fillRect(-1,-8,2,12); // Manche
        ctx.fillStyle="#696969"; ctx.beginPath(); ctx.moveTo(-1,-6); ctx.lineTo(-6,-6); ctx.lineTo(-4,-2); ctx.lineTo(4,-2); ctx.lineTo(6,-6); ctx.lineTo(1,-6); ctx.closePath(); ctx.fill(); // Lame
        break;
    case "tool_sword":
        ctx.fillStyle="#C0C0C0"; ctx.fillRect(-1,-10,2,14); // Lame
        ctx.fillStyle="#8B4513"; ctx.fillRect(-3,4,6,3); // Garde
        ctx.fillStyle="#654321"; ctx.fillRect(-1,4,2,4); // Poignée
        break;
    case "tool_knife":
        ctx.fillStyle="#C0C0C0"; ctx.fillRect(-1,-6,2,8); // Lame
        ctx.fillStyle="#654321"; ctx.fillRect(-2,2,4,3); // Poignée
        break;
    case "tool_bow":
        ctx.strokeStyle="#8B4513"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(0,-8); ctx.quadraticCurveTo(-4,-4,0,0); ctx.quadraticCurveTo(4,-4,0,-8); ctx.stroke(); // Arc
        ctx.strokeStyle="#654321"; ctx.lineWidth=1; ctx.moveTo(-3,-6); ctx.lineTo(3,-6); ctx.stroke(); // Corde
        break;
    case "tool_fishing_rod":
        ctx.fillStyle="#8B4513"; ctx.fillRect(-1,-8,2,12); // Canne
        ctx.strokeStyle="#654321"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(4,-4); ctx.stroke(); // Ligne
        ctx.fillStyle="#C0C0C0"; ctx.beginPath(); ctx.arc(4,-4,1,0,2*Math.PI); ctx.fill(); // Hameçon
        break;
    
    // --- Icône générique pour le reste ---
    default:
      let h = 0; for (let i=0;i<objName.length;i++) h = (h*31+objName.charCodeAt(i))&255;
      ctx.fillStyle=`hsl(${h*1.4}, 50%, 60%)`;
      ctx.fillRect(-12,-12,24,24);
      ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.strokeRect(-12,-12,24,24);
      ctx.font='bold 11px "VT323"';
      ctx.fillStyle="rgba(0,0,0,0.6)";
      ctx.textAlign="center";
      ctx.fillText(objName.substring(0, 2).toUpperCase(), 0, 4);
  }
  ctx.restore();
}

// Fonction exportée qui utilise le cache
export function getItemIcon(name, assets) {
  // Créer une clé de cache unique qui inclut si on utilise un asset ou une icône générée
  const cacheKey = `${name}_${assets && assets[name] ? 'asset' : 'generated'}`;
  
  // Si l'icône est déjà dans le cache, on la retourne directement
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }
  
  // On vérifie d'abord si un asset direct existe (pour les outils)
  const assetKey = name;
  if (assets && assets[assetKey]) {
      console.log(`Utilisation de l'asset ${assetKey} pour l'outil ${name}`);
      iconCache.set(cacheKey, assets[assetKey]);
      return assets[assetKey];
  }

  // Sinon, on la génère, on la met en cache et on la retourne
  console.log(`Génération de l'icône pour l'outil ${name}`);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  drawIcon(name, ctx);
  
  const img = new Image();
  img.src = canvas.toDataURL();
  iconCache.set(cacheKey, img);
  
  return img;
}
