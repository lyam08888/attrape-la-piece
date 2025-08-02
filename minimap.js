// minimap.js - Système de minimap

export class Minimap {
    constructor(width, height, scale = 4) {
        this.width = width;
        this.height = height;
        this.scale = scale; // Nombre de pixels de jeu par pixel de minimap
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.lastUpdate = 0;
        this.updateInterval = 100; // Mettre à jour toutes les 100ms
    }

    update(game, currentTime) {
        if (currentTime - this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = currentTime;

        const { tileSize } = game.config;
        const player = game.player;
        if (!player) return;

        // Effacer la minimap
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Calculer la zone à afficher autour du joueur
        const centerX = player.x + player.w / 2;
        const centerY = player.y + player.h / 2;
        
        const mapCenterX = this.width / 2;
        const mapCenterY = this.height / 2;
        
        const worldStartX = centerX - (mapCenterX * this.scale);
        const worldStartY = centerY - (mapCenterY * this.scale);

        // Dessiner les tuiles
        for (let mapY = 0; mapY < this.height; mapY++) {
            for (let mapX = 0; mapX < this.width; mapX++) {
                const worldX = worldStartX + (mapX * this.scale);
                const worldY = worldStartY + (mapY * this.scale);
                
                const tileX = Math.floor(worldX / tileSize);
                const tileY = Math.floor(worldY / tileSize);
                
                const tileType = game.tileMap[tileY]?.[tileX];
                if (tileType > 0) {
                    this.ctx.fillStyle = this.getTileColor(tileType);
                    this.ctx.fillRect(mapX, mapY, 1, 1);
                }
            }
        }

        // Dessiner les entités
        this.drawEntities(game, worldStartX, worldStartY);
        
        // Dessiner le joueur (toujours au centre)
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(mapCenterX - 1, mapCenterY - 1, 3, 3);
        
        // Dessiner la direction du joueur
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(mapCenterX, mapCenterY);
        this.ctx.lineTo(mapCenterX + player.dir * 3, mapCenterY);
        this.ctx.stroke();
    }

    getTileColor(tileType) {
        const colors = {
            1: '#4a7c59',  // GRASS - vert
            2: '#8b4513',  // DIRT - marron
            3: '#696969',  // STONE - gris
            4: '#8b4513',  // WOOD - marron
            5: '#228b22',  // LEAVES - vert foncé
            6: '#2f2f2f',  // COAL - noir
            7: '#cd853f',  // IRON - orange
            8: '#1a1a1a',  // BEDROCK - noir profond
            9: '#4682b4',  // WATER - bleu
            10: '#9370db', // CRYSTAL - violet
            11: '#ff69b4', // GLOW_MUSHROOM - rose
            12: '#f0f8ff', // CLOUD - blanc
            13: '#dc143c', // HELLSTONE - rouge
            14: '#ff4500', // LAVA - orange rouge
            15: '#f4a460', // SAND - sable
            16: '#8b4513', // OAK_WOOD - marron
            17: '#228b22', // OAK_LEAVES - vert
            18: '#ff0000', // FLOWER_RED - rouge
            19: '#ffff00', // FLOWER_YELLOW - jaune
            20: '#ffd700', // GOLD - or
            21: '#00ffff', // DIAMOND - cyan
            22: '#0000ff', // LAPIS - bleu
            23: '#a0522d', // GRANITE - marron clair
            24: '#dcdcdc', // DIORITE - gris clair
            25: '#708090', // ANDESITE - gris ardoise
            26: '#fffacd', // HEAVENLY_STONE - crème
            27: '#c0c0c0', // MOON_ROCK - argent
            28: '#8b7355', // SOUL_SAND - marron terne
            29: '#2f1b14', // SCORCHED_STONE - marron très foncé
            30: '#36013f', // OBSIDIAN - violet très foncé
            31: '#9966cc'  // AMETHYST - violet
        };
        
        return colors[tileType] || '#ffffff';
    }

    drawEntities(game, worldStartX, worldStartY) {
        // Dessiner les ennemis
        game.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            const mapX = Math.floor((enemy.x - worldStartX) / this.scale);
            const mapY = Math.floor((enemy.y - worldStartY) / this.scale);
            
            if (mapX >= 0 && mapX < this.width && mapY >= 0 && mapY < this.height) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(mapX, mapY, 2, 2);
            }
        });

        // Dessiner les PNJ
        game.pnjs.forEach(pnj => {
            const mapX = Math.floor((pnj.x - worldStartX) / this.scale);
            const mapY = Math.floor((pnj.y - worldStartY) / this.scale);
            
            if (mapX >= 0 && mapX < this.width && mapY >= 0 && mapY < this.height) {
                this.ctx.fillStyle = '#0000ff';
                this.ctx.fillRect(mapX, mapY, 2, 2);
            }
        });

        // Dessiner les collectibles importants
        game.collectibles.forEach(collectible => {
            // Ne dessiner que les minerais précieux
            if (collectible.tileType >= 6) { // COAL et plus précieux
                const mapX = Math.floor((collectible.x - worldStartX) / this.scale);
                const mapY = Math.floor((collectible.y - worldStartY) / this.scale);
                
                if (mapX >= 0 && mapX < this.width && mapY >= 0 && mapY < this.height) {
                    this.ctx.fillStyle = this.getTileColor(collectible.tileType);
                    this.ctx.fillRect(mapX, mapY, 1, 1);
                }
            }
        });
    }

    draw(targetCtx, x, y) {
        // Dessiner la minimap sur le canvas principal
        targetCtx.save();
        
        // Bordure
        targetCtx.strokeStyle = '#666666';
        targetCtx.lineWidth = 2;
        targetCtx.strokeRect(x - 1, y - 1, this.width + 2, this.height + 2);
        
        // Fond semi-transparent
        targetCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        targetCtx.fillRect(x, y, this.width, this.height);
        
        // Minimap
        targetCtx.drawImage(this.canvas, x, y);
        
        // Légende
        this.drawLegend(targetCtx, x, y + this.height + 5);
        
        targetCtx.restore();
    }

    drawLegend(ctx, x, y) {
        const legendItems = [
            { color: '#00ff00', text: 'Joueur' },
            { color: '#ff0000', text: 'Ennemis' },
            { color: '#0000ff', text: 'PNJ' },
            { color: '#ffd700', text: 'Minerais' }
        ];

        ctx.font = '8px "Press Start 2P"';
        ctx.fillStyle = '#ffffff';
        
        legendItems.forEach((item, index) => {
            const itemY = y + (index * 12);
            
            // Carré de couleur
            ctx.fillStyle = item.color;
            ctx.fillRect(x, itemY, 8, 8);
            
            // Texte
            ctx.fillStyle = '#ffffff';
            ctx.fillText(item.text, x + 12, itemY + 6);
        });
    }

    // Méthodes utilitaires
    worldToMap(worldX, worldY, centerWorldX, centerWorldY) {
        const mapCenterX = this.width / 2;
        const mapCenterY = this.height / 2;
        
        const mapX = mapCenterX + (worldX - centerWorldX) / this.scale;
        const mapY = mapCenterY + (worldY - centerWorldY) / this.scale;
        
        return { x: mapX, y: mapY };
    }

    mapToWorld(mapX, mapY, centerWorldX, centerWorldY) {
        const mapCenterX = this.width / 2;
        const mapCenterY = this.height / 2;
        
        const worldX = centerWorldX + (mapX - mapCenterX) * this.scale;
        const worldY = centerWorldY + (mapY - mapCenterY) * this.scale;
        
        return { x: worldX, y: worldY };
    }

    setScale(newScale) {
        this.scale = Math.max(1, Math.min(10, newScale));
    }

    toggleSize() {
        if (this.width === 150) {
            this.resize(300, 300);
        } else {
            this.resize(150, 150);
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Mettre à jour l'élément DOM si nécessaire
        const minimapElement = document.getElementById('minimap');
        if (minimapElement) {
            minimapElement.style.width = width + 'px';
            minimapElement.style.height = height + 'px';
        }
    }
}

// Fonction pour intégrer la minimap dans l'interface
export function initializeMinimap(game) {
    const minimapElement = document.getElementById('minimap');
    if (!minimapElement) return null;

    const minimap = new Minimap(150, 150, 4);
    
    // Ajouter des contrôles à la minimap
    minimapElement.addEventListener('click', (e) => {
        const rect = minimapElement.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Double-clic pour changer la taille
        if (e.detail === 2) {
            minimap.toggleSize();
        }
    });

    // Molette pour changer le zoom
    minimapElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 : -1;
        minimap.setScale(minimap.scale + delta);
    });

    return minimap;
}

// Fonction pour dessiner la minimap dans l'interface
export function drawMinimapToElement(minimap, game) {
    const minimapElement = document.getElementById('minimap');
    if (!minimapElement || !minimap) return;

    // Créer un canvas temporaire pour dessiner dans l'élément DOM
    let canvas = minimapElement.querySelector('canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = minimap.width;
        canvas.height = minimap.height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        minimapElement.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    minimap.update(game, performance.now());
    
    // Effacer et dessiner
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(minimap.canvas, 0, 0);
}