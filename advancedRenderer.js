// advancedRenderer.js - Système de rendu avancé pour le monde complexe
export class AdvancedRenderer {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assets = assets;
        this.particleSystem = new ParticleSystemAdvanced();
        this.lightingSystem = new LightingSystemAdvanced();
        this.weatherRenderer = new WeatherRendererAdvanced();
        this.animationSystem = new AnimationSystemAdvanced();
        
        // Cache pour optimiser le rendu
        this.tileCache = new Map();
        this.spriteCache = new Map();
        this.lightCache = new Map();
        
        // Paramètres de rendu
        this.renderDistance = 50;
        this.detailLevel = 1.0;
        this.enableLighting = true;
        this.enableParticles = true;
        this.enableWeather = true;
        this.enableAnimations = true;
        
        this.initializeShaders();
    }

    initializeShaders() {
        // Simulation de shaders avec des filtres canvas
        this.shaders = {
            divine: (ctx) => {
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 10;
            },
            infernal: (ctx) => {
                ctx.shadowColor = '#FF4500';
                ctx.shadowBlur = 15;
            },
            crystal: (ctx) => {
                ctx.shadowColor = '#9370DB';
                ctx.shadowBlur = 8;
            },
            nature: (ctx) => {
                ctx.shadowColor = '#32CD32';
                ctx.shadowBlur = 5;
            }
        };
    }

    renderWorld(world, camera, config) {
        const { ctx, canvas } = this;
        const { tileSize, zoom } = config;
        
        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculer la zone visible
        const viewBounds = this.calculateViewBounds(camera, canvas, tileSize, zoom);
        
        // Rendu par couches
        this.renderBackground(world, viewBounds, config);
        this.renderTerrain(world, viewBounds, config);
        this.renderStructures(world, viewBounds, config);
        this.renderVegetation(world, viewBounds, config);
        this.renderCreatures(world, viewBounds, config);
        this.renderNPCs(world, viewBounds, config);
        this.renderParticles(world, viewBounds, config);
        this.renderWeather(world, viewBounds, config);
        this.renderLighting(world, viewBounds, config);
        this.renderUI(world, viewBounds, config);
    }

    calculateViewBounds(camera, canvas, tileSize, zoom) {
        return {
            left: Math.floor((camera.x - 100) / tileSize),
            right: Math.ceil((camera.x + canvas.width / zoom + 100) / tileSize),
            top: Math.floor((camera.y - 100) / tileSize),
            bottom: Math.ceil((camera.y + canvas.height / zoom + 100) / tileSize)
        };
    }

    renderBackground(world, bounds, config) {
        const { ctx, canvas } = this;
        
        // Rendu du ciel basé sur les biomes visibles
        const dominantBiome = this.getDominantBiome(world, bounds);
        const skyGradient = this.createSkyGradient(dominantBiome, canvas);
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Éléments de fond (soleil, lune, étoiles)
        this.renderCelestialBodies(world, bounds, config);
        
        // Parallax pour les montagnes lointaines
        this.renderParallaxLayers(world, bounds, config);
    }

    createSkyGradient(biome, canvas) {
        const { ctx } = this;
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        
        const skyColors = {
            DIVINE_PEAKS: ['#FFE4B5', '#F0F8FF', '#E6E6FA'],
            CELESTIAL_GARDENS: ['#E6E6FA', '#F0F8FF', '#98FB98'],
            CLOUD_REALM: ['#B0E0E6', '#87CEEB', '#F5F5F5'],
            ENCHANTED_FOREST: ['#228B22', '#32CD32', '#8FBC8F'],
            CRYSTAL_CAVERNS: ['#4B0082', '#9370DB', '#8A2BE2'],
            GOLDEN_PLAINS: ['#FFD700', '#F0E68C', '#DAA520'],
            MYSTIC_SWAMPS: ['#556B2F', '#6B8E23', '#9ACD32'],
            DESERT_RUINS: ['#F4A460', '#DEB887', '#CD853F'],
            VOLCANIC_LANDS: ['#8B0000', '#A0522D', '#FF4500'],
            SHADOW_REALM: ['#2F2F2F', '#1C1C1C', '#8B008B'],
            INFERNAL_DEPTHS: ['#800000', '#8B0000', '#FF0000'],
            ABYSS: ['#000000', '#0D0D0D', '#4B0000']
        };
        
        const colors = skyColors[biome] || skyColors.ENCHANTED_FOREST;
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(0.5, colors[1]);
        gradient.addColorStop(1, colors[2]);
        
        return gradient;
    }

    getDominantBiome(world, bounds) {
        const biomeCount = {};
        
        for (let y = bounds.top; y < bounds.bottom; y++) {
            for (let x = bounds.left; x < bounds.right; x++) {
                if (world.biomeMap[y] && world.biomeMap[y][x]) {
                    const biome = world.biomeMap[y][x];
                    biomeCount[biome] = (biomeCount[biome] || 0) + 1;
                }
            }
        }
        
        return Object.keys(biomeCount).reduce((a, b) => 
            biomeCount[a] > biomeCount[b] ? a : b, 'ENCHANTED_FOREST');
    }

    renderCelestialBodies(world, bounds, config) {
        const { ctx, canvas } = this;
        const time = Date.now() * 0.0001;
        
        // Soleil
        const sunX = canvas.width * 0.8 + Math.cos(time) * 100;
        const sunY = canvas.height * 0.2 + Math.sin(time) * 50;
        
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Lune
        const moonX = canvas.width * 0.2 + Math.cos(time + Math.PI) * 80;
        const moonY = canvas.height * 0.3 + Math.sin(time + Math.PI) * 40;
        
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#F0F0F0';
        ctx.shadowColor = '#F0F0F0';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Étoiles pour les biomes sombres
        const dominantBiome = this.getDominantBiome(world, bounds);
        if (['SHADOW_REALM', 'ABYSS', 'INFERNAL_DEPTHS'].includes(dominantBiome)) {
            this.renderStars(canvas);
        }
    }

    renderStars(canvas) {
        const { ctx } = this;
        const starCount = 50;
        
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        
        for (let i = 0; i < starCount; i++) {
            const x = (i * 137.5) % canvas.width;
            const y = (i * 73.3) % (canvas.height * 0.6);
            const size = Math.random() * 2 + 1;
            const twinkle = Math.sin(Date.now() * 0.01 + i) * 0.3 + 0.7;
            
            ctx.globalAlpha = twinkle;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    renderParallaxLayers(world, bounds, config) {
        const { ctx, canvas } = this;
        const { camera } = config;
        
        // Montagnes lointaines
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#4A4A4A';
        
        const mountainPoints = [];
        for (let i = 0; i < canvas.width + 100; i += 50) {
            const height = Math.sin(i * 0.01) * 100 + 150;
            mountainPoints.push({ x: i - camera.x * 0.1, y: canvas.height - height });
        }
        
        ctx.beginPath();
        ctx.moveTo(mountainPoints[0].x, mountainPoints[0].y);
        mountainPoints.forEach(point => ctx.lineTo(point.x, point.y));
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    renderTerrain(world, bounds, config) {
        const { ctx } = this;
        const { tileSize, zoom, camera } = config;
        
        ctx.save();
        ctx.scale(zoom, zoom);
        ctx.translate(-camera.x, -camera.y);
        
        for (let y = Math.max(0, bounds.top); y < Math.min(world.tiles.length, bounds.bottom); y++) {
            for (let x = Math.max(0, bounds.left); x < Math.min(world.tiles[0].length, bounds.right); x++) {
                const tileId = world.tiles[y][x];
                const biome = world.biomeMap[y][x];
                
                if (tileId > 0) {
                    this.renderTile(x, y, tileId, biome, tileSize);
                }
            }
        }
        
        ctx.restore();
    }

    renderTile(x, y, tileId, biome, tileSize) {
        const { ctx } = this;
        const cacheKey = `${tileId}_${biome}`;
        
        // Vérifier le cache
        if (!this.tileCache.has(cacheKey)) {
            this.generateTileSprite(tileId, biome, tileSize);
        }
        
        const tileSprite = this.tileCache.get(cacheKey);
        if (tileSprite) {
            ctx.drawImage(tileSprite, x * tileSize, y * tileSize);
        } else {
            // Rendu de base si pas de sprite
            this.renderBasicTile(x, y, tileId, biome, tileSize);
        }
        
        // Effets spéciaux pour certains blocs
        this.renderTileEffects(x, y, tileId, biome, tileSize);
    }

    generateTileSprite(tileId, biome, tileSize) {
        const canvas = document.createElement('canvas');
        canvas.width = tileSize;
        canvas.height = tileSize;
        const ctx = canvas.getContext('2d');
        
        // Couleurs basées sur le type de bloc et le biome
        const color = this.getTileColor(tileId, biome);
        const texture = this.getTileTexture(tileId);
        
        // Rendu de base
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, tileSize, tileSize);
        
        // Ajouter de la texture
        this.applyTileTexture(ctx, texture, tileSize);
        
        // Bordures et détails
        this.addTileDetails(ctx, tileId, biome, tileSize);
        
        this.tileCache.set(`${tileId}_${biome}`, canvas);
    }

    getTileColor(tileId, biome) {
        const colors = {
            // Blocs divins
            100: '#F0F8FF', // DIVINE_STONE
            101: '#FFE4B5', // BLESSED_EARTH
            102: '#FFD700', // CELESTIAL_CRYSTAL
            
            // Blocs naturels
            109: '#8FBC8F', // MOSS_STONE
            110: '#8B4513', // RICH_EARTH
            111: '#32CD32', // NATURE_CRYSTAL
            
            // Blocs de cristal
            112: '#9370DB', // CRYSTAL_STONE
            113: '#8A2BE2', // AMETHYST
            114: '#FF69B4', // PRISMATIC_CRYSTAL
            
            // Blocs infernaux
            130: '#8B0000', // HELLSTONE
            131: '#FF4500', // BRIMSTONE
            132: '#DC143C', // SOUL_CRYSTAL
            
            // Blocs du vide
            133: '#2F2F2F', // VOID_STONE
            134: '#1C1C1C', // CHAOS_ROCK
            135: '#4B0000'  // PRIMORDIAL_CRYSTAL
        };
        
        return colors[tileId] || '#808080';
    }

    getTileTexture(tileId) {
        const textures = {
            100: 'smooth',      // DIVINE_STONE
            109: 'mossy',       // MOSS_STONE
            112: 'crystalline', // CRYSTAL_STONE
            121: 'sandy',       // SAND
            124: 'rough',       // VOLCANIC_ROCK
            130: 'cracked',     // HELLSTONE
            133: 'void'         // VOID_STONE
        };
        
        return textures[tileId] || 'basic';
    }

    applyTileTexture(ctx, texture, tileSize) {
        const { canvas } = ctx;
        
        switch (texture) {
            case 'mossy':
                // Ajouter des points verts pour la mousse
                ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
                for (let i = 0; i < 10; i++) {
                    const x = Math.random() * tileSize;
                    const y = Math.random() * tileSize;
                    ctx.beginPath();
                    ctx.arc(x, y, Math.random() * 2 + 1, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'crystalline':
                // Ajouter des reflets cristallins
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(Math.random() * tileSize, Math.random() * tileSize);
                    ctx.lineTo(Math.random() * tileSize, Math.random() * tileSize);
                    ctx.stroke();
                }
                break;
                
            case 'sandy':
                // Texture granuleuse
                const imageData = ctx.getImageData(0, 0, tileSize, tileSize);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const noise = Math.random() * 30 - 15;
                    imageData.data[i] += noise;     // R
                    imageData.data[i + 1] += noise; // G
                    imageData.data[i + 2] += noise; // B
                }
                ctx.putImageData(imageData, 0, 0);
                break;
                
            case 'cracked':
                // Ajouter des fissures
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, Math.random() * tileSize);
                    ctx.quadraticCurveTo(
                        tileSize / 2, Math.random() * tileSize,
                        tileSize, Math.random() * tileSize
                    );
                    ctx.stroke();
                }
                break;
        }
    }

    addTileDetails(ctx, tileId, biome, tileSize) {
        // Ajouter des détails spécifiques au biome
        if (biome === 'DIVINE_PEAKS') {
            // Aura dorée
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 3;
        } else if (biome === 'INFERNAL_DEPTHS') {
            // Lueur rouge
            ctx.shadowColor = '#FF4500';
            ctx.shadowBlur = 2;
        }
        
        // Bordures subtiles
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(0, 0, tileSize, tileSize);
    }

    renderBasicTile(x, y, tileId, biome, tileSize) {
        const { ctx } = this;
        const color = this.getTileColor(tileId, biome);
        
        ctx.fillStyle = color;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        
        // Bordure simple
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }

    renderTileEffects(x, y, tileId, biome, tileSize) {
        const { ctx } = this;
        
        // Effets spéciaux pour certains blocs
        if (tileId === 102 || tileId === 114) { // Cristaux
            this.renderCrystalGlow(x * tileSize, y * tileSize, tileSize);
        } else if (tileId === 131) { // Brimstone
            this.renderLavaGlow(x * tileSize, y * tileSize, tileSize);
        } else if (tileId === 135) { // Primordial Crystal
            this.renderVoidEffect(x * tileSize, y * tileSize, tileSize);
        }
    }

    renderCrystalGlow(x, y, size) {
        const { ctx } = this;
        const time = Date.now() * 0.005;
        const intensity = Math.sin(time) * 0.3 + 0.7;
        
        ctx.save();
        ctx.globalAlpha = intensity * 0.3;
        ctx.fillStyle = '#9370DB';
        ctx.shadowColor = '#9370DB';
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, size, size);
        ctx.restore();
    }

    renderLavaGlow(x, y, size) {
        const { ctx } = this;
        const time = Date.now() * 0.008;
        const intensity = Math.sin(time) * 0.4 + 0.6;
        
        ctx.save();
        ctx.globalAlpha = intensity * 0.4;
        ctx.fillStyle = '#FF4500';
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, size, size);
        ctx.restore();
    }

    renderVoidEffect(x, y, size) {
        const { ctx } = this;
        const time = Date.now() * 0.003;
        
        ctx.save();
        ctx.globalAlpha = 0.5;
        
        // Effet de distorsion
        const gradient = ctx.createRadialGradient(
            x + size/2, y + size/2, 0,
            x + size/2, y + size/2, size/2
        );
        gradient.addColorStop(0, 'rgba(75, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, size, size);
        ctx.restore();
    }

    renderStructures(world, bounds, config) {
        const { ctx } = this;
        const { tileSize, zoom, camera } = config;
        
        ctx.save();
        ctx.scale(zoom, zoom);
        ctx.translate(-camera.x, -camera.y);
        
        world.structures.forEach(structure => {
            if (this.isInBounds(structure, bounds)) {
                this.renderStructure(structure, tileSize);
            }
        });
        
        ctx.restore();
    }

    renderStructure(structure, tileSize) {
        const { ctx } = this;
        const { x, y, width, height, type } = structure;
        
        // Rendu spécialisé selon le type de structure
        switch (type) {
            case 'DIVINE_TEMPLE':
                this.renderDivineTemple(x, y, width, height, tileSize);
                break;
            case 'DEMON_FORTRESS':
                this.renderDemonFortress(x, y, width, height, tileSize);
                break;
            case 'CRYSTAL_FORMATION':
                this.renderCrystalFormation(x, y, width, height, tileSize);
                break;
            default:
                this.renderGenericStructure(x, y, width, height, tileSize, type);
        }
    }

    renderDivineTemple(x, y, width, height, tileSize) {
        const { ctx } = this;
        
        // Base du temple
        ctx.fillStyle = '#F0F8FF';
        ctx.fillRect(x * tileSize, y * tileSize, width * tileSize, height * tileSize);
        
        // Colonnes
        ctx.fillStyle = '#FFD700';
        for (let i = 1; i < width - 1; i += 3) {
            ctx.fillRect(
                (x + i) * tileSize, 
                (y + 2) * tileSize, 
                tileSize, 
                (height - 4) * tileSize
            );
        }
        
        // Aura divine
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x * tileSize, y * tileSize, width * tileSize, height * tileSize);
        ctx.restore();
    }

    renderDemonFortress(x, y, width, height, tileSize) {
        const { ctx } = this;
        
        // Murs de la forteresse
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(x * tileSize, y * tileSize, width * tileSize, height * tileSize);
        
        // Tours
        ctx.fillStyle = '#4B0000';
        ctx.fillRect(x * tileSize, y * tileSize, tileSize * 3, height * tileSize);
        ctx.fillRect((x + width - 3) * tileSize, y * tileSize, tileSize * 3, height * tileSize);
        
        // Flammes
        const time = Date.now() * 0.01;
        for (let i = 0; i < width; i += 4) {
            const flameHeight = Math.sin(time + i) * 10 + 20;
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(
                (x + i) * tileSize, 
                (y - flameHeight/tileSize) * tileSize, 
                tileSize, 
                flameHeight
            );
        }
    }

    renderCrystalFormation(x, y, width, height, tileSize) {
        const { ctx } = this;
        const time = Date.now() * 0.005;
        
        // Cristaux de différentes tailles
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const crystalHeight = Math.sin(i + j + time) * 5 + 10;
                const hue = (i * j + time * 50) % 360;
                
                ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
                ctx.fillRect(
                    (x + i) * tileSize + tileSize/4,
                    (y + j) * tileSize + tileSize - crystalHeight,
                    tileSize/2,
                    crystalHeight
                );
                
                // Reflets
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(
                    (x + i) * tileSize + tileSize/4,
                    (y + j) * tileSize + tileSize - crystalHeight,
                    tileSize/8,
                    crystalHeight
                );
            }
        }
    }

    renderGenericStructure(x, y, width, height, tileSize, type) {
        const { ctx } = this;
        
        // Rendu générique
        ctx.fillStyle = '#666666';
        ctx.fillRect(x * tileSize, y * tileSize, width * tileSize, height * tileSize);
        
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * tileSize, y * tileSize, width * tileSize, height * tileSize);
    }

    renderVegetation(world, bounds, config) {
        const { ctx } = this;
        const { tileSize, zoom, camera } = config;
        
        ctx.save();
        ctx.scale(zoom, zoom);
        ctx.translate(-camera.x, -camera.y);
        
        world.vegetation.forEach(plant => {
            if (this.isInBounds(plant, bounds)) {
                this.renderPlant(plant, tileSize);
            }
        });
        
        ctx.restore();
    }

    renderPlant(plant, tileSize) {
        const { ctx } = this;
        const { x, y, type, stage } = plant;
        
        switch (type) {
            case 'GOLDEN_TREE':
                this.renderGoldenTree(x, y, stage, tileSize);
                break;
            case 'CRYSTAL_FLOWER':
                this.renderCrystalFlower(x, y, stage, tileSize);
                break;
            case 'ANCIENT_OAK':
                this.renderAncientOak(x, y, stage, tileSize);
                break;
            default:
                this.renderGenericPlant(x, y, type, stage, tileSize);
        }
    }

    renderGoldenTree(x, y, stage, tileSize) {
        const { ctx } = this;
        const time = Date.now() * 0.002;
        
        // Tronc
        ctx.fillStyle = '#8B4513';
        const trunkWidth = tileSize * 0.3;
        const trunkHeight = tileSize * (2 + stage);
        ctx.fillRect(
            x * tileSize + tileSize/2 - trunkWidth/2,
            (y + 5 - stage) * tileSize,
            trunkWidth,
            trunkHeight
        );
        
        // Feuillage doré
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        
        const crownSize = tileSize * (1 + stage * 0.5);
        ctx.beginPath();
        ctx.arc(
            x * tileSize + tileSize/2,
            (y + 3 - stage) * tileSize,
            crownSize,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // Particules dorées
        if (this.enableParticles) {
            for (let i = 0; i < 3; i++) {
                const particleX = x * tileSize + tileSize/2 + Math.sin(time + i) * crownSize;
                const particleY = (y + 3 - stage) * tileSize + Math.cos(time + i) * crownSize;
                
                ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
                ctx.beginPath();
                ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    renderCrystalFlower(x, y, stage, tileSize) {
        const { ctx } = this;
        const time = Date.now() * 0.01;
        
        // Tige
        ctx.strokeStyle = '#32CD32';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x * tileSize + tileSize/2, (y + 1) * tileSize);
        ctx.lineTo(x * tileSize + tileSize/2, (y + 1 - stage * 0.5) * tileSize);
        ctx.stroke();
        
        // Fleur cristalline
        const petalCount = 6;
        const petalSize = tileSize * 0.2 * (stage + 1);
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2 + time;
            const petalX = x * tileSize + tileSize/2 + Math.cos(angle) * petalSize;
            const petalY = (y + 1 - stage * 0.5) * tileSize + Math.sin(angle) * petalSize;
            
            ctx.fillStyle = `hsl(${(time * 50 + i * 60) % 360}, 70%, 60%)`;
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 5;
            
            ctx.beginPath();
            ctx.arc(petalX, petalY, petalSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderAncientOak(x, y, stage, tileSize) {
        const { ctx } = this;
        
        // Tronc massif
        ctx.fillStyle = '#654321';
        const trunkWidth = tileSize * (0.5 + stage * 0.1);
        const trunkHeight = tileSize * (3 + stage * 2);
        
        ctx.fillRect(
            x * tileSize + tileSize/2 - trunkWidth/2,
            (y + 8 - stage * 2) * tileSize,
            trunkWidth,
            trunkHeight
        );
        
        // Branches
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = tileSize * 0.1;
        
        for (let i = 0; i < stage + 2; i++) {
            const branchY = (y + 6 - i) * tileSize;
            const branchLength = tileSize * (2 + Math.sin(i) * 1);
            
            ctx.beginPath();
            ctx.moveTo(x * tileSize + tileSize/2, branchY);
            ctx.lineTo(x * tileSize + tileSize/2 + branchLength, branchY - tileSize);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x * tileSize + tileSize/2, branchY);
            ctx.lineTo(x * tileSize + tileSize/2 - branchLength, branchY - tileSize);
            ctx.stroke();
        }
        
        // Feuillage dense
        ctx.fillStyle = '#228B22';
        const crownSize = tileSize * (2 + stage);
        
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
                x * tileSize + tileSize/2 + (i - 1) * tileSize,
                (y + 4 - stage) * tileSize,
                crownSize * (0.8 + i * 0.1),
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }

    renderGenericPlant(x, y, type, stage, tileSize) {
        const { ctx } = this;
        
        // Rendu générique simple
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(
            x * tileSize,
            (y + 1 - stage * 0.5) * tileSize,
            tileSize,
            tileSize * (stage + 1)
        );
    }

    renderCreatures(world, bounds, config) {
        const { ctx } = this;
        const { tileSize, zoom, camera } = config;
        
        ctx.save();
        ctx.scale(zoom, zoom);
        ctx.translate(-camera.x, -camera.y);
        
        world.creatures.forEach(creature => {
            if (this.isInBounds(creature, bounds)) {
                this.renderCreature(creature, tileSize);
            }
        });
        
        ctx.restore();
    }

    renderCreature(creature, tileSize) {
        const { ctx } = this;
        const { x, y, type, health, maxHealth, sprite } = creature;
        
        // Animation de base
        const time = Date.now() * 0.005;
        const bobOffset = Math.sin(time + x) * 2;
        
        // Rendu spécialisé selon le type
        switch (type) {
            case 'SERAPH':
                this.renderSeraph(x, y + bobOffset, tileSize);
                break;
            case 'PHOENIX':
                this.renderPhoenix(x, y + bobOffset, tileSize);
                break;
            case 'FIRE_DEMON':
                this.renderFireDemon(x, y, tileSize);
                break;
            default:
                this.renderGenericCreature(x, y + bobOffset, type, tileSize);
        }
        
        // Barre de vie
        if (health < maxHealth) {
            this.renderHealthBar(x, y - 10, health, maxHealth, tileSize);
        }
    }

    renderSeraph(x, y, tileSize) {
        const { ctx } = this;
        const time = Date.now() * 0.01;
        
        // Corps angélique
        ctx.fillStyle = '#F0F8FF';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(x, y, tileSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Ailes
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        const wingSpan = Math.sin(time) * 5 + 15;
        
        // Aile gauche
        ctx.beginPath();
        ctx.ellipse(x - wingSpan, y, tileSize * 0.3, tileSize * 0.6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Aile droite
        ctx.beginPath();
        ctx.ellipse(x + wingSpan, y, tileSize * 0.3, tileSize * 0.6, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Halo
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y - tileSize * 0.6, tileSize * 0.2, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderPhoenix(x, y, tileSize) {
        const { ctx } = this;
        const time = Date.now() * 0.02;
        
        // Corps du phénix
        ctx.fillStyle = '#FF4500';
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.ellipse(x, y, tileSize * 0.3, tileSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Flammes
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time;
            const flameX = x + Math.cos(angle) * tileSize * 0.4;
            const flameY = y + Math.sin(angle) * tileSize * 0.4;
            const flameSize = Math.sin(time + i) * 3 + 5;
            
            ctx.fillStyle = i % 2 ? '#FF6347' : '#FFD700';
            ctx.beginPath();
            ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderFireDemon(x, y, tileSize) {
        const { ctx } = this;
        
        // Corps démoniaque
        ctx.fillStyle = '#8B0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(x, y, tileSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Cornes
        ctx.fillStyle = '#4B0000';
        ctx.beginPath();
        ctx.moveTo(x - tileSize * 0.2, y - tileSize * 0.4);
        ctx.lineTo(x - tileSize * 0.1, y - tileSize * 0.6);
        ctx.lineTo(x - tileSize * 0.05, y - tileSize * 0.4);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + tileSize * 0.2, y - tileSize * 0.4);
        ctx.lineTo(x + tileSize * 0.1, y - tileSize * 0.6);
        ctx.lineTo(x + tileSize * 0.05, y - tileSize * 0.4);
        ctx.closePath();
        ctx.fill();
        
        // Yeux ardents
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x - tileSize * 0.1, y - tileSize * 0.1, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + tileSize * 0.1, y - tileSize * 0.1, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderGenericCreature(x, y, type, tileSize) {
        const { ctx } = this;
        
        // Rendu générique
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.arc(x, y, tileSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    renderHealthBar(x, y, health, maxHealth, tileSize) {
        const { ctx } = this;
        const barWidth = tileSize;
        const barHeight = 4;
        const healthPercent = health / maxHealth;
        
        // Fond de la barre
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(x - barWidth/2, y, barWidth, barHeight);
        
        // Barre de vie
        ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : 
                       healthPercent > 0.2 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(x - barWidth/2, y, barWidth * healthPercent, barHeight);
        
        // Bordure
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - barWidth/2, y, barWidth, barHeight);
    }

    renderNPCs(world, bounds, config) {
        const { ctx } = this;
        const { tileSize, zoom, camera } = config;
        
        ctx.save();
        ctx.scale(zoom, zoom);
        ctx.translate(-camera.x, -camera.y);
        
        world.npcs.forEach(npc => {
            if (this.isInBounds(npc, bounds)) {
                this.renderNPC(npc, tileSize);
            }
        });
        
        ctx.restore();
    }

    renderNPC(npc, tileSize) {
        const { ctx } = this;
        const { x, y, type, name, mood } = npc;
        
        // Animation de respiration
        const time = Date.now() * 0.003;
        const breathe = Math.sin(time) * 0.05 + 1;
        
        ctx.save();
        ctx.scale(breathe, breathe);
        
        // Rendu spécialisé selon le type
        switch (type) {
            case 'archangel':
                this.renderArchangel(x / breathe, y / breathe, tileSize);
                break;
            case 'demon_lord':
                this.renderDemonLord(x / breathe, y / breathe, tileSize);
                break;
            case 'forest_druid':
                this.renderForestDruid(x / breathe, y / breathe, tileSize);
                break;
            default:
                this.renderGenericNPC(x / breathe, y / breathe, type, tileSize);
        }
        
        ctx.restore();
        
        // Nom du PNJ
        this.renderNPCName(x, y - tileSize, name);
        
        // Indicateur d'humeur
        this.renderMoodIndicator(x, y - tileSize * 0.8, mood);
    }

    renderArchangel(x, y, tileSize) {
        const { ctx } = this;
        
        // Corps majestueux
        ctx.fillStyle = '#F8F8FF';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        
        // Robe
        ctx.beginPath();
        ctx.ellipse(x, y + tileSize * 0.2, tileSize * 0.4, tileSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Torse
        ctx.beginPath();
        ctx.arc(x, y - tileSize * 0.1, tileSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Tête
        ctx.fillStyle = '#FFEFD5';
        ctx.beginPath();
        ctx.arc(x, y - tileSize * 0.4, tileSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Ailes majestueuses
        const time = Date.now() * 0.005;
        const wingMovement = Math.sin(time) * 0.1;
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        
        // Aile gauche
        ctx.save();
        ctx.translate(x - tileSize * 0.3, y - tileSize * 0.2);
        ctx.rotate(-0.2 + wingMovement);
        ctx.beginPath();
        ctx.ellipse(0, 0, tileSize * 0.4, tileSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Aile droite
        ctx.save();
        ctx.translate(x + tileSize * 0.3, y - tileSize * 0.2);
        ctx.rotate(0.2 - wingMovement);
        ctx.beginPath();
        ctx.ellipse(0, 0, tileSize * 0.4, tileSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Halo divin
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y - tileSize * 0.7, tileSize * 0.2, 0, Math.PI * 2);
        ctx.stroke();
    }

    renderDemonLord(x, y, tileSize) {
        const { ctx } = this;
        
        // Corps démoniaque imposant
        ctx.fillStyle = '#4B0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 15;
        
        // Corps
        ctx.beginPath();
        ctx.ellipse(x, y, tileSize * 0.5, tileSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tête
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.arc(x, y - tileSize * 0.6, tileSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Cornes imposantes
        ctx.fillStyle = '#2F2F2F';
        ctx.beginPath();
        ctx.moveTo(x - tileSize * 0.15, y - tileSize * 0.6);
        ctx.lineTo(x - tileSize * 0.25, y - tileSize * 1.0);
        ctx.lineTo(x - tileSize * 0.1, y - tileSize * 0.8);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(x + tileSize * 0.15, y - tileSize * 0.6);
        ctx.lineTo(x + tileSize * 0.25, y - tileSize * 1.0);
        ctx.lineTo(x + tileSize * 0.1, y - tileSize * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // Yeux ardents
        ctx.fillStyle = '#FF0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x - tileSize * 0.08, y - tileSize * 0.65, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + tileSize * 0.08, y - tileSize * 0.65, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Aura maléfique
        const time = Date.now() * 0.01;
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, tileSize * (0.6 + Math.sin(time) * 0.1), 0, Math.PI * 2);
        ctx.stroke();
    }

    renderForestDruid(x, y, tileSize) {
        const { ctx } = this;
        
        // Robe naturelle
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(x, y + tileSize * 0.1, tileSize * 0.35, tileSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Corps
        ctx.fillStyle = '#8FBC8F';
        ctx.beginPath();
        ctx.arc(x, y - tileSize * 0.2, tileSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Tête
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.arc(x, y - tileSize * 0.5, tileSize * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Barbe de mousse
        ctx.fillStyle = '#9ACD32';
        ctx.beginPath();
        ctx.ellipse(x, y - tileSize * 0.4, tileSize * 0.08, tileSize * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bâton de druide
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + tileSize * 0.2, y + tileSize * 0.5);
        ctx.lineTo(x + tileSize * 0.15, y - tileSize * 0.8);
        ctx.stroke();
        
        // Cristal au bout du bâton
        ctx.fillStyle = '#32CD32';
        ctx.shadowColor = '#32CD32';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x + tileSize * 0.15, y - tileSize * 0.8, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Aura naturelle
        const time = Date.now() * 0.005;
        for (let i = 0; i < 5; i++) {
            const leafX = x + Math.cos(time + i) * tileSize * 0.4;
            const leafY = y + Math.sin(time + i) * tileSize * 0.4;
            
            ctx.fillStyle = 'rgba(50, 205, 50, 0.6)';
            ctx.beginPath();
            ctx.arc(leafX, leafY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderGenericNPC(x, y, type, tileSize) {
        const { ctx } = this;
        
        // Corps générique
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x, y, tileSize * 0.3, tileSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tête
        ctx.fillStyle = '#FDBCB4';
        ctx.beginPath();
        ctx.arc(x, y - tileSize * 0.4, tileSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    renderNPCName(x, y, name) {
        const { ctx } = this;
        
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        ctx.strokeText(name, x, y);
        ctx.fillText(name, x, y);
        ctx.restore();
    }

    renderMoodIndicator(x, y, mood) {
        const { ctx } = this;
        
        const moodColors = {
            happy: '#00FF00',
            neutral: '#FFFF00',
            angry: '#FF0000',
            sad: '#0000FF',
            excited: '#FF69B4'
        };
        
        ctx.fillStyle = moodColors[mood] || moodColors.neutral;
        ctx.beginPath();
        ctx.arc(x + 15, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    renderParticles(world, bounds, config) {
        if (!this.enableParticles) return;
        
        // Le système de particules sera rendu ici
        this.particleSystem.render(this.ctx, bounds, config);
    }

    renderWeather(world, bounds, config) {
        if (!this.enableWeather) return;
        
        world.weather.forEach(weather => {
            if (weather.active) {
                this.weatherRenderer.render(weather, this.ctx, bounds, config);
            }
        });
    }

    renderLighting(world, bounds, config) {
        if (!this.enableLighting) return;
        
        this.lightingSystem.render(world, this.ctx, bounds, config);
    }

    renderUI(world, bounds, config) {
        // Interface utilisateur par-dessus le monde
        // Sera intégrée avec le système d'interface modulaire
    }

    isInBounds(entity, bounds) {
        return entity.x >= bounds.left && entity.x <= bounds.right &&
               entity.y >= bounds.top && entity.y <= bounds.bottom;
    }

    // Méthodes d'optimisation
    clearCache() {
        this.tileCache.clear();
        this.spriteCache.clear();
        this.lightCache.clear();
    }

    setRenderQuality(quality) {
        this.detailLevel = quality;
        this.renderDistance = Math.floor(50 * quality);
        this.enableLighting = quality > 0.5;
        this.enableParticles = quality > 0.3;
        this.enableWeather = quality > 0.7;
    }
}

// Systèmes auxiliaires
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    render(ctx, bounds, config) {
        // Rendu des particules
        this.particles.forEach(particle => {
            if (this.isParticleInBounds(particle, bounds)) {
                this.renderParticle(ctx, particle);
            }
        });
    }

    renderParticle(ctx, particle) {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isParticleInBounds(particle, bounds) {
        return true; // Implémentation simplifiée
    }
}

class LightingSystem {
    render(world, ctx, bounds, config) {
        // Système d'éclairage avancé
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        
        // Créer une couche d'ombre de base
        const gradient = ctx.createRadialGradient(
            bounds.left + (bounds.right - bounds.left) / 2,
            bounds.top + (bounds.bottom - bounds.top) / 2,
            0,
            bounds.left + (bounds.right - bounds.left) / 2,
            bounds.top + (bounds.bottom - bounds.top) / 2,
            Math.max(bounds.right - bounds.left, bounds.bottom - bounds.top)
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0.8)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.restore();
    }
}

class WeatherRenderer {
    render(weather, ctx, bounds, config) {
        switch (weather.type) {
            case 'DIVINE_AURORA':
                this.renderDivineAurora(ctx, bounds);
                break;
            case 'CRYSTAL_RAIN':
                this.renderCrystalRain(ctx, bounds);
                break;
            case 'HELLSTORM':
                this.renderHellstorm(ctx, bounds);
                break;
        }
    }

    renderDivineAurora(ctx, bounds) {
        const time = Date.now() * 0.002;
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        for (let i = 0; i < 5; i++) {
            const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.5, `hsl(${(time * 50 + i * 60) % 360}, 70%, 60%)`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, i * 50 + Math.sin(time + i) * 20, ctx.canvas.width, 30);
        }
        
        ctx.restore();
    }

    renderCrystalRain(ctx, bounds) {
        const time = Date.now() * 0.01;
        
        ctx.save();
        ctx.fillStyle = '#9370DB';
        ctx.globalAlpha = 0.6;
        
        for (let i = 0; i < 100; i++) {
            const x = (i * 137.5 + time * 100) % ctx.canvas.width;
            const y = (i * 73.3 + time * 200) % ctx.canvas.height;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    renderHellstorm(ctx, bounds) {
        const time = Date.now() * 0.02;
        
        ctx.save();
        ctx.globalAlpha = 0.4;
        
        // Éclairs rouges
        for (let i = 0; i < 3; i++) {
            if (Math.sin(time + i) > 0.8) {
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(Math.random() * ctx.canvas.width, 0);
                ctx.lineTo(Math.random() * ctx.canvas.width, ctx.canvas.height);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
}

class AnimationSystem {
    constructor() {
        this.animations = new Map();
    }

    update(deltaTime) {
        // Mise à jour des animations
    }

    addAnimation(id, animation) {
        this.animations.set(id, animation);
    }

    removeAnimation(id) {
        this.animations.delete(id);
    }
}

// Ajout des méthodes d'intégration pour le jeu principal
AdvancedRenderer.prototype.renderEntities = function(player, enemies, pnjs, collectibles) {
    const { ctx } = this;
    
    ctx.save();
    
    // Rendu des collectibles
    if (collectibles) {
        collectibles.forEach(c => {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(c.x, c.y, c.w || 16, c.h || 16);
        });
    }
    
    // Rendu des PNJ
    if (pnjs) {
        pnjs.forEach(pnj => {
            if (pnj.draw) {
                pnj.draw(ctx);
            } else {
                // Rendu de base pour les PNJ
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(pnj.x || 0, pnj.y || 0, 32, 32);
            }
        });
    }
    
    // Rendu des ennemis
    if (enemies) {
        enemies.forEach(enemy => {
            if (enemy.draw) {
                enemy.draw(ctx, this.assets);
            } else {
                // Rendu de base pour les ennemis
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(enemy.x || 0, enemy.y || 0, 32, 32);
            }
        });
    }
    
    // Rendu du joueur
    if (player && player.draw) {
        player.draw(ctx, this.assets);
    }
    
    ctx.restore();
};

AdvancedRenderer.prototype.renderEffects = function(particleSystem, miningEffect) {
    const { ctx } = this;
    
    ctx.save();
    
    // Rendu du système de particules
    if (particleSystem && particleSystem.draw) {
        particleSystem.draw(ctx);
    }
    
    // Rendu de l'effet de minage
    if (miningEffect) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'white';
        const crackSize = 16 * miningEffect.progress;
        ctx.fillRect(
            miningEffect.x * 16 + (16 - crackSize) / 2,
            miningEffect.y * 16 + (16 - crackSize) / 2,
            crackSize, crackSize
        );
        ctx.globalAlpha = 1;
    }
    
    ctx.restore();
};

AdvancedRenderer.prototype.renderUI = function(logger, canvas) {
    const { ctx } = this;
    
    // Rendu du logger si disponible
    if (logger && logger.draw) {
        logger.draw(ctx, canvas);
    }
};

export { AdvancedRenderer };