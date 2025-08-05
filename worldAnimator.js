// worldAnimator.js - Gère les animations de l'environnement (nuages, vent, etc.)
// Utilisation du système avancé : définition TILE compatible
const TILE = {
  AIR: 0,
  STONE: 1,
  GRASS: 2,
  DIRT: 3,
  // Ajoute d'autres blocs si besoin
};

export class WorldAnimator {
    constructor(config, assets) {
        this.config = config;
        this.assets = assets;
        this.time = 0;

        // Configuration pour différentes animations
        this.animationConfig = {
            [TILE.WATER]: { type: 'wave', speed: 0.05, amplitude: 1 },
            [TILE.LAVA]: { type: 'wave', speed: 0.03, amplitude: 1.5 },
            [TILE.LEAVES]: { type: 'sway', speed: 0.1, amplitude: 0.5 },
            [TILE.OAK_LEAVES]: { type: 'sway', speed: 0.1, amplitude: 0.5 },
            [TILE.PINE_LEAVES]: { type: 'sway', speed: 0.08, amplitude: 0.4 },
            [TILE.FLOWER_RED]: { type: 'sway', speed: 0.2, amplitude: 1 },
            [TILE.FLOWER_YELLOW]: { type: 'sway', speed: 0.2, amplitude: 1 },
        };
    }

    update(delta) {
        this.time += delta;
    }

    /**
     * Calcule le décalage d'animation pour une tuile donnée.
     * @param {number} tileType - Le type de la tuile.
     * @param {number} x - La coordonnée x de la tuile.
     * @param {number} y - La coordonnée y de la tuile.
     * @returns {{dx: number, dy: number}} - Le décalage en pixels.
     */
    getTileOffset(tileType, x, y) {
        const anim = this.animationConfig[tileType];
        if (!anim) {
            return { dx: 0, dy: 0 };
        }

        switch (anim.type) {
            case 'wave':
                // Les vagues se déplacent horizontalement, créant un effet d'ondulation
                return {
                    dx: 0,
                    dy: Math.sin(this.time * anim.speed * 10 + x * 0.5) * anim.amplitude,
                };
            case 'sway':
                // Le balancement est subtil et dépend de la position pour ne pas être uniforme
                return {
                    dx: Math.sin(this.time * anim.speed * 5 + y * 0.3) * anim.amplitude,
                    dy: 0,
                };
            default:
                return { dx: 0, dy: 0 };
        }
    }

    /**
     * Dessine les tuiles animées. Cette fonction devrait être appelée dans la boucle de rendu principale.
     * @param {CanvasRenderingContext2D} ctx - Le contexte du canvas.
     * @param {Array<Array<number>>} tileMap - La carte du monde.
     * @param {object} camera - L'objet caméra du jeu.
     */
    draw(ctx, tileMap, camera) {
        const { tileSize, zoom } = this.config;
        const startX = Math.floor(camera.x / tileSize) - 1;
        const endX = startX + Math.ceil(ctx.canvas.width / tileSize / zoom) + 2;
        const startY = Math.floor(camera.y / tileSize) - 1;
        const endY = startY + Math.ceil(ctx.canvas.height / tileSize / zoom) + 2;

        for (let y = Math.max(0, startY); y < Math.min(tileMap.length, endY); y++) {
            for (let x = Math.max(0, startX); x < Math.min(tileMap[y].length, endX); x++) {
                const tileType = tileMap[y]?.[x];
                if (tileType && this.animationConfig[tileType]) {
                    const offset = this.getTileOffset(tileType, x, y);
                    const assetKey = Object.keys(TILE).find(key => TILE[key] === tileType);
                    const img = this.assets[`tile_${assetKey?.toLowerCase()}`];

                    if (img) {
                        // Efface d'abord la tuile statique en dessous pour éviter les superpositions
                        ctx.clearRect(x * tileSize, y * tileSize, tileSize, tileSize);
                        // Redessine le fond (simple pour l'exemple)
                        ctx.fillStyle = '#87CEEB'; // Couleur du ciel
                        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

                        ctx.drawImage(img, x * tileSize + offset.dx, y * tileSize + offset.dy, tileSize, tileSize);
                    }
                }
            }
        }
    }
}