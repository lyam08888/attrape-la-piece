// minimap.js - Système de minimap pour la navigation

export class Minimap {
    constructor(config) {
        this.config = config;
        this.size = 150; // Taille de la minimap
        this.scale = 0.1; // Échelle de la minimap
        this.visible = true;
        this.position = { x: 10, y: 10 }; // Position sur l'écran
        this.exploredTiles = new Set(); // Tuiles explorées
    }

    update(game) {
        if (!game.player || !game.tileMap) return;

        // Marquer les tuiles autour du joueur comme explorées
        const playerTileX = Math.floor(game.player.x / this.config.tileSize);
        const playerTileY = Math.floor(game.player.y / this.config.tileSize);
        const exploreRadius = 10;

        for (let dy = -exploreRadius; dy <= exploreRadius; dy++) {
            for (let dx = -exploreRadius; dx <= exploreRadius; dx++) {
                const tileX = playerTileX + dx;
                const tileY = playerTileY + dy;
                
                if (tileX >= 0 && tileX < game.tileMap[0]?.length && 
                    tileY >= 0 && tileY < game.tileMap.length) {
                    this.exploredTiles.add(`${tileX},${tileY}`);
                }
            }
        }
    }

    draw(ctx, game) {
        if (!this.visible || !game.player || !game.tileMap) return;

        ctx.save();

        // Fond de la minimap
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(this.position.x, this.position.y, this.size, this.size);

        // Bordure
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x, this.position.y, this.size, this.size);

        // Calculer la zone à afficher
        const playerTileX = Math.floor(game.player.x / this.config.tileSize);
        const playerTileY = Math.floor(game.player.y / this.config.tileSize);
        const tilesPerSide = Math.floor(this.size / 2);
        
        const startX = Math.max(0, playerTileX - tilesPerSide);
        const endX = Math.min(game.tileMap[0]?.length || 0, playerTileX + tilesPerSide);
        const startY = Math.max(0, playerTileY - tilesPerSide);
        const endY = Math.min(game.tileMap.length, playerTileY + tilesPerSide);

        // Dessiner les tuiles
        const pixelSize = this.size / (tilesPerSide * 2);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tileKey = `${x},${y}`;
                
                // Ne dessiner que les tuiles explorées
                if (!this.exploredTiles.has(tileKey)) continue;

                const tileType = game.tileMap[y]?.[x];
                if (tileType === undefined) continue;

                const screenX = this.position.x + (x - startX) * pixelSize;
                const screenY = this.position.y + (y - startY) * pixelSize;

                // Couleurs des tuiles
                let color = this.getTileColor(tileType);
                
                ctx.fillStyle = color;
                ctx.fillRect(screenX, screenY, pixelSize, pixelSize);
            }
        }

        // Dessiner le joueur
        const playerScreenX = this.position.x + (playerTileX - startX) * pixelSize;
        const playerScreenY = this.position.y + (playerTileY - startY) * pixelSize;
        
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(playerScreenX - 1, playerScreenY - 1, 3, 3);

        // Dessiner les animaux proches
        if (game.faunaSystem) {
            game.faunaSystem.animals.forEach(animal => {
                const animalTileX = Math.floor(animal.x / this.config.tileSize);
                const animalTileY = Math.floor(animal.y / this.config.tileSize);
                
                if (animalTileX >= startX && animalTileX < endX && 
                    animalTileY >= startY && animalTileY < endY) {
                    
                    const animalScreenX = this.position.x + (animalTileX - startX) * pixelSize;
                    const animalScreenY = this.position.y + (animalTileY - startY) * pixelSize;
                    
                    ctx.fillStyle = this.getAnimalColor(animal.type.name);
                    ctx.fillRect(animalScreenX, animalScreenY, 1, 1);
                }
            });
        }

        // Titre
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px VT323, monospace';
        ctx.fillText('Minimap', this.position.x + 5, this.position.y - 5);

        ctx.restore();
    }

    getTileColor(tileType) {
        const colors = {
            0: 'rgba(135, 206, 235, 0.3)', // AIR - bleu clair transparent (ciel/eau)
            1: '#696969', // STONE - gris
            2: '#32CD32', // GRASS - vert
            3: '#8B4513', // DIRT - marron
            100: '#F0F8FF', // DIVINE_STONE - blanc bleuté
            103: '#BFFF00', // autre grass - vert clair
            106: '#E0FFFF', // CLOUD - blanc nuageux
            112: '#9370DB', // CRYSTAL - violet
            121: '#F4E285', // SAND - sable
            130: '#8B0000'  // HELLSTONE - rouge foncé
        };
        
        return colors[tileType] || '#CCCCCC';
    }

    getAnimalColor(animalName) {
        const colors = {
            'rabbit': '#FFFFFF',
            'deer': '#8B4513',
            'fox': '#FF4500',
            'bear': '#654321',
            'wolf': '#708090',
            'squirrel': '#D2691E',
            'boar': '#2F4F4F',
            'bird': '#87CEEB',
            'eagle': '#B8860B',
            'owl': '#8B7355',
            'bat': '#2F2F2F',
            'butterfly': '#FFB6C1',
            'fish': '#00CED1',
            'salmon': '#FA8072',
            'shark': '#2F4F4F',
            'dolphin': '#4682B4',
            'mole': '#8B4513',
            'spider': '#800080',
            'worm': '#9ACD32'
        };
        
        return colors[animalName] || '#FFFF00';
    }

    toggle() {
        this.visible = !this.visible;
    }

    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
    }
}