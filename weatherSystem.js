// weatherSystem.js - Système météorologique et d'éclairage dynamique

export class WeatherSystem {
    constructor(config) {
        this.config = config;
        this.currentWeather = 'clear';
        this.weatherIntensity = 0;
        this.weatherTimer = 0;
        this.weatherDuration = 0;
        this.particles = [];
        this.lightning = [];
        
        this.weatherTypes = {
            'clear': {
                name: 'Clair',
                particleCount: 0,
                lightLevel: 1.0,
                effects: {}
            },
            'rain': {
                name: 'Pluie',
                particleCount: 100,
                lightLevel: 0.7,
                effects: { visibility: -0.2, speed: -1 }
            },
            'storm': {
                name: 'Orage',
                particleCount: 150,
                lightLevel: 0.5,
                effects: { visibility: -0.4, speed: -2 },
                lightning: true
            },
            'snow': {
                name: 'Neige',
                particleCount: 80,
                lightLevel: 0.9,
                effects: { speed: -3, mining: -1 }
            },
            'fog': {
                name: 'Brouillard',
                particleCount: 50,
                lightLevel: 0.6,
                effects: { visibility: -0.6 }
            },
            'sandstorm': {
                name: 'Tempête de sable',
                particleCount: 120,
                lightLevel: 0.4,
                effects: { visibility: -0.5, health: -0.5 }
            }
        };
        
        this.nextWeatherChange = this.getRandomWeatherChangeTime();
    }

    update(game, delta) {
        this.weatherTimer += delta / 1000; // Convertir ms en secondes
        
        // Changer de météo
        if (this.weatherTimer >= this.nextWeatherChange) {
            this.changeWeather();
        }
        
        // Mettre à jour les particules météo
        this.updateWeatherParticles(game, delta);
        
        // Mettre à jour les éclairs
        this.updateLightning(delta);
        
        // Appliquer les effets météo au joueur
        this.applyWeatherEffects(game);
    }

    changeWeather() {
        const weatherTypes = Object.keys(this.weatherTypes);
        const currentIndex = weatherTypes.indexOf(this.currentWeather);
        
        // Probabilités de changement de météo
        const weatherProbabilities = {
            'clear': 0.4,
            'rain': 0.2,
            'storm': 0.1,
            'snow': 0.15,
            'fog': 0.1,
            'sandstorm': 0.05
        };
        
        let newWeather = this.currentWeather;
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [weather, probability] of Object.entries(weatherProbabilities)) {
            cumulative += probability;
            if (rand <= cumulative) {
                newWeather = weather;
                break;
            }
        }
        
        if (newWeather !== this.currentWeather) {
            this.currentWeather = newWeather;
            this.weatherIntensity = 0.5 + Math.random() * 0.5; // Intensité entre 0.5 et 1.0
            this.weatherDuration = 30 + Math.random() * 120; // 30 à 150 secondes
            this.particles = [];
            
            // Créer les particules météo
            this.createWeatherParticles();
            
            console.log(`Météo changée: ${this.weatherTypes[newWeather].name}`);
        }
        
        this.weatherTimer = 0;
        this.nextWeatherChange = this.getRandomWeatherChangeTime();
    }

    getRandomWeatherChangeTime() {
        return 60 + Math.random() * 240; // Entre 1 et 5 minutes
    }

    createWeatherParticles() {
        const weather = this.weatherTypes[this.currentWeather];
        const particleCount = Math.floor(weather.particleCount * this.weatherIntensity);
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(this.createWeatherParticle());
        }
    }

    createWeatherParticle() {
        const particle = {
            x: Math.random() * this.config.worldWidth,
            y: -50 - Math.random() * 100,
            vx: 0,
            vy: 0,
            size: 1,
            alpha: 0.7,
            life: 1.0,
            color: '#ffffff'
        };
        
        switch (this.currentWeather) {
            case 'rain':
                particle.vx = -1 - Math.random() * 2;
                particle.vy = 8 + Math.random() * 4;
                particle.size = 1 + Math.random();
                particle.color = '#4a90e2';
                break;
                
            case 'storm':
                particle.vx = -3 - Math.random() * 6;
                particle.vy = 12 + Math.random() * 8;
                particle.size = 1 + Math.random() * 2;
                particle.color = '#2c5aa0';
                break;
                
            case 'snow':
                particle.vx = -0.5 + Math.random();
                particle.vy = 2 + Math.random() * 3;
                particle.size = 2 + Math.random() * 3;
                particle.color = '#ffffff';
                particle.alpha = 0.8;
                break;
                
            case 'fog':
                particle.vx = -0.2 + Math.random() * 0.4;
                particle.vy = 0.5 + Math.random();
                particle.size = 10 + Math.random() * 20;
                particle.color = '#cccccc';
                particle.alpha = 0.3;
                break;
                
            case 'sandstorm':
                particle.vx = 3 + Math.random() * 4;
                particle.vy = 1 + Math.random() * 2;
                particle.size = 1 + Math.random() * 2;
                particle.color = '#daa520';
                break;
        }
        
        return particle;
    }

    updateWeatherParticles(game, delta) {
        const camera = game.camera;
        const canvas = game.canvas;
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= delta / 10;
            
            // Supprimer les particules hors écran ou mortes
            if (particle.life <= 0 || 
                particle.x < camera.x - 100 || 
                particle.x > camera.x + canvas.clientWidth + 100 ||
                particle.y > camera.y + canvas.clientHeight + 100) {
                this.particles.splice(i, 1);
                
                // Recréer une particule si la météo est active
                if (this.currentWeather !== 'clear') {
                    this.particles.push(this.createWeatherParticle());
                }
            }
        }
    }

    updateLightning(delta) {
        // Mettre à jour les éclairs existants
        for (let i = this.lightning.length - 1; i >= 0; i--) {
            const lightning = this.lightning[i];
            lightning.life -= delta;
            
            if (lightning.life <= 0) {
                this.lightning.splice(i, 1);
            }
        }
        
        // Créer de nouveaux éclairs pour les orages
        if (this.currentWeather === 'storm' && Math.random() < 0.001) {
            this.createLightning();
        }
    }

    createLightning() {
        const lightning = {
            x: Math.random() * this.config.worldWidth,
            y: 0,
            width: 2 + Math.random() * 4,
            height: 200 + Math.random() * 300,
            life: 0.2 + Math.random() * 0.3,
            maxLife: 0.5,
            branches: []
        };
        
        // Créer des branches d'éclair
        const branchCount = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < branchCount; i++) {
            lightning.branches.push({
                x: lightning.x + (Math.random() - 0.5) * 100,
                y: lightning.y + Math.random() * lightning.height,
                width: 1 + Math.random() * 2,
                height: 50 + Math.random() * 100
            });
        }
        
        this.lightning.push(lightning);
    }

    applyWeatherEffects(game) {
        const weather = this.weatherTypes[this.currentWeather];
        const player = game.player;
        
        if (player && player.stats && weather.effects) {
            // Appliquer les effets météo temporaires
            player.stats.removeEffect('weather');
            if (Object.keys(weather.effects).length > 0) {
                player.stats.addEffect('weather', 2000, weather.effects);
            }
        }
    }

    draw(ctx, camera, canvas) {
        if (!this.config.weatherEffects) return;
        
        ctx.save();
        
        // Dessiner les particules météo
        this.particles.forEach(particle => {
            const screenX = particle.x - camera.x;
            const screenY = particle.y - camera.y;
            
            // Ne dessiner que les particules visibles
            if (screenX >= -50 && screenX <= canvas.clientWidth + 50 &&
                screenY >= -50 && screenY <= canvas.clientHeight + 50) {
                
                ctx.globalAlpha = particle.alpha * particle.life;
                ctx.fillStyle = particle.color;
                
                if (this.currentWeather === 'fog') {
                    // Effet de brouillard avec gradient radial
                    const gradient = ctx.createRadialGradient(
                        screenX, screenY, 0,
                        screenX, screenY, particle.size
                    );
                    gradient.addColorStop(0, particle.color);
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(screenX - particle.size, screenY - particle.size, 
                               particle.size * 2, particle.size * 2);
                } else {
                    // Particules normales
                    ctx.beginPath();
                    if (this.currentWeather === 'rain' || this.currentWeather === 'storm') {
                        // Gouttes de pluie (lignes)
                        ctx.moveTo(screenX, screenY);
                        ctx.lineTo(screenX + particle.vx * 2, screenY + particle.vy * 2);
                        ctx.strokeStyle = particle.color;
                        ctx.lineWidth = particle.size;
                        ctx.stroke();
                    } else {
                        // Particules circulaires (neige, sable)
                        ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        });
        
        // Dessiner les éclairs
        this.lightning.forEach(lightning => {
            const screenX = lightning.x - camera.x;
            const screenY = lightning.y - camera.y;
            
            ctx.globalAlpha = lightning.life / lightning.maxLife;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = lightning.width;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            
            // Éclair principal
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenX + (Math.random() - 0.5) * 20, screenY + lightning.height);
            ctx.stroke();
            
            // Branches
            lightning.branches.forEach(branch => {
                const branchScreenX = branch.x - camera.x;
                const branchScreenY = branch.y - camera.y;
                
                ctx.lineWidth = branch.width;
                ctx.beginPath();
                ctx.moveTo(branchScreenX, branchScreenY);
                ctx.lineTo(branchScreenX + (Math.random() - 0.5) * 40, 
                          branchScreenY + branch.height);
                ctx.stroke();
            });
            
            ctx.shadowBlur = 0;
        });
        
        ctx.restore();
    }

    getCurrentWeather() {
        return this.weatherTypes[this.currentWeather];
    }

    getLightLevel() {
        return this.weatherTypes[this.currentWeather].lightLevel;
    }
}

export class LightingSystem {
    constructor(config) {
        this.config = config;
        this.lightSources = [];
        this.ambientLight = 0.3; // Lumière ambiante de base
        this.lightMap = null;
        this.lightMapWidth = 0;
        this.lightMapHeight = 0;
    }

    addLightSource(x, y, radius, intensity, color = '#ffffff') {
        this.lightSources.push({
            x, y, radius, intensity, color,
            id: Date.now() + Math.random()
        });
    }

    removeLightSource(id) {
        this.lightSources = this.lightSources.filter(light => light.id !== id);
    }

    updateLightMap(game) {
        if (!this.config.dynamicLighting) return;
        
        const { tileSize } = this.config;
        const camera = game.camera;
        const canvas = game.canvas;
        
        // Calculer la taille de la lightmap
        this.lightMapWidth = Math.ceil(canvas.clientWidth / tileSize) + 4;
        this.lightMapHeight = Math.ceil(canvas.clientHeight / tileSize) + 4;
        
        // Initialiser la lightmap
        this.lightMap = new Array(this.lightMapHeight);
        for (let y = 0; y < this.lightMapHeight; y++) {
            this.lightMap[y] = new Array(this.lightMapWidth).fill(this.ambientLight);
        }
        
        // Calculer l'éclairage pour chaque source de lumière
        this.lightSources.forEach(light => {
            this.calculateLightContribution(light, game);
        });
        
        // Ajouter l'éclairage du joueur (torche)
        if (game.player) {
            const playerLight = {
                x: game.player.x + game.player.w / 2,
                y: game.player.y + game.player.h / 2,
                radius: 80,
                intensity: 0.8,
                color: '#ffaa44'
            };
            this.calculateLightContribution(playerLight, game);
        }
    }

    calculateLightContribution(light, game) {
        const { tileSize } = this.config;
        const camera = game.camera;
        
        const startX = Math.floor((camera.x - tileSize * 2) / tileSize);
        const startY = Math.floor((camera.y - tileSize * 2) / tileSize);
        
        for (let y = 0; y < this.lightMapHeight; y++) {
            for (let x = 0; x < this.lightMapWidth; x++) {
                const worldX = (startX + x) * tileSize + tileSize / 2;
                const worldY = (startY + y) * tileSize + tileSize / 2;
                
                const distance = Math.sqrt(
                    Math.pow(worldX - light.x, 2) + 
                    Math.pow(worldY - light.y, 2)
                );
                
                if (distance <= light.radius) {
                    const attenuation = 1 - (distance / light.radius);
                    const lightValue = light.intensity * attenuation * attenuation;
                    
                    // Vérifier les obstacles (raycast simplifié)
                    const obstacleAttenuation = this.calculateObstacleAttenuation(
                        light.x, light.y, worldX, worldY, game
                    );
                    
                    this.lightMap[y][x] = Math.max(
                        this.lightMap[y][x],
                        lightValue * obstacleAttenuation
                    );
                }
            }
        }
    }

    calculateObstacleAttenuation(x1, y1, x2, y2, game) {
        const { tileSize } = this.config;
        const steps = Math.floor(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / tileSize);
        
        if (steps === 0) return 1;
        
        const dx = (x2 - x1) / steps;
        const dy = (y2 - y1) / steps;
        
        let attenuation = 1;
        
        for (let i = 1; i < steps; i++) {
            const checkX = x1 + dx * i;
            const checkY = y1 + dy * i;
            
            const tileX = Math.floor(checkX / tileSize);
            const tileY = Math.floor(checkY / tileSize);
            
            if (game.tileMap[tileY] && game.tileMap[tileY][tileX] > 0) {
                attenuation *= 0.7; // Réduction de 30% par bloc solide
            }
        }
        
        return attenuation;
    }

    draw(ctx, camera, canvas) {
        if (!this.config.dynamicLighting || !this.lightMap) return;
        
        const { tileSize } = this.config;
        
        // Créer un overlay sombre
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        
        // Utiliser le mode de mélange pour créer l'éclairage
        ctx.globalCompositeOperation = 'screen';
        
        const startX = Math.floor((camera.x - tileSize * 2) / tileSize);
        const startY = Math.floor((camera.y - tileSize * 2) / tileSize);
        
        for (let y = 0; y < this.lightMapHeight; y++) {
            for (let x = 0; x < this.lightMapWidth; x++) {
                const lightValue = this.lightMap[y][x];
                
                if (lightValue > this.ambientLight) {
                    const screenX = (startX + x) * tileSize - camera.x;
                    const screenY = (startY + y) * tileSize - camera.y;
                    
                    const alpha = Math.min(1, lightValue);
                    ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);
                }
            }
        }
        
        ctx.restore();
    }

    setAmbientLight(level) {
        this.ambientLight = Math.max(0, Math.min(1, level));
    }

    addTorchLight(x, y) {
        return this.addLightSource(x, y, 60, 0.9, '#ffaa44');
    }

    addFireLight(x, y) {
        return this.addLightSource(x, y, 40, 0.7, '#ff6644');
    }

    addMagicLight(x, y) {
        return this.addLightSource(x, y, 80, 1.0, '#4488ff');
    }
}