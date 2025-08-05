// ambianceSystem.js - Système d'ambiance complète pour le jeu RPG

export class AmbianceSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = new Map();
        this.currentMusic = null;
        this.ambientSounds = [];
        this.soundVolume = 0.7;
        this.musicVolume = 0.5;
        this.isEnabled = true;
        
        this.particleSystem = new ParticleSystem();
        this.weatherSystem = new WeatherSystem();
        this.lightingSystem = new LightingSystem();
        
        this.initializeAudio();
        this.createSoundEffects();
    }

    async initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🎵 Système audio initialisé');
        } catch (error) {
            console.warn('⚠️ Impossible d\'initialiser l\'audio:', error);
        }
    }

    createSoundEffects() {
        // Créer des sons synthétiques pour éviter les fichiers externes
        this.createSyntheticSounds();
    }

    createSyntheticSounds() {
        if (!this.audioContext) return;

        // Son de pas
        this.sounds.set('footstep', this.createFootstepSound());
        
        // Son d'attaque
        this.sounds.set('attack', this.createAttackSound());
        
        // Son de collecte d'objet
        this.sounds.set('pickup', this.createPickupSound());
        
        // Son de niveau up
        this.sounds.set('levelup', this.createLevelUpSound());
        
        // Son de dégâts
        this.sounds.set('damage', this.createDamageSound());
        
        // Son de guérison
        this.sounds.set('heal', this.createHealSound());
        
        // Musique d'ambiance
        this.sounds.set('ambient_forest', this.createAmbientForest());
        this.sounds.set('ambient_cave', this.createAmbientCave());
        this.sounds.set('ambient_village', this.createAmbientVillage());
    }

    createFootstepSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1 * this.soundVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
    }

    createAttackSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0.3 * this.soundVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }

    createPickupSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
            oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.2 * this.soundVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }

    createLevelUpSound() {
        return () => {
            if (!this.audioContext) return;
            
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            
            notes.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + index * 0.1);
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + index * 0.1);
                gainNode.gain.linearRampToValueAtTime(0.3 * this.soundVolume, this.audioContext.currentTime + index * 0.1 + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + index * 0.1 + 0.3);
                
                oscillator.start(this.audioContext.currentTime + index * 0.1);
                oscillator.stop(this.audioContext.currentTime + index * 0.1 + 0.3);
            });
        };
    }

    createDamageSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(75, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.4 * this.soundVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }

    createHealSound() {
        return () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.4);
            
            gainNode.gain.setValueAtTime(0.2 * this.soundVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.4);
        };
    }

    createAmbientForest() {
        return () => {
            // Simulation de sons de forêt avec des oscillateurs
            if (!this.audioContext) return;
            
            const createWindSound = () => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                oscillator.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(80 + Math.random() * 40, this.audioContext.currentTime);
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0.05 * this.musicVolume, this.audioContext.currentTime);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 2 + Math.random() * 3);
                
                setTimeout(createWindSound, 1000 + Math.random() * 2000);
            };
            
            createWindSound();
        };
    }

    createAmbientCave() {
        return () => {
            if (!this.audioContext) return;
            
            const createDripSound = () => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.1 * this.musicVolume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
                
                setTimeout(createDripSound, 2000 + Math.random() * 5000);
            };
            
            createDripSound();
        };
    }

    createAmbientVillage() {
        return () => {
            if (!this.audioContext) return;
            
            // Sons de village simulés
            const createBellSound = () => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
                
                gainNode.gain.setValueAtTime(0.1 * this.musicVolume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 2);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 2);
                
                setTimeout(createBellSound, 10000 + Math.random() * 20000);
            };
            
            createBellSound();
        };
    }

    playSound(soundName) {
        if (!this.isEnabled || !this.sounds.has(soundName)) return;
        
        const soundFunction = this.sounds.get(soundName);
        if (typeof soundFunction === 'function') {
            soundFunction();
        }
    }

    setAmbientMusic(musicName) {
        if (this.currentMusic) {
            // Arrêter la musique actuelle
            this.currentMusic = null;
        }
        
        if (this.sounds.has(musicName)) {
            this.currentMusic = musicName;
            this.playSound(musicName);
        }
    }

    update(game, delta) {
        // Mettre à jour les systèmes d'ambiance
        this.particleSystem.update(delta);
        this.weatherSystem.update(delta);
        this.lightingSystem.update(game, delta);
        
        // Jouer des sons contextuels
        this.updateContextualSounds(game);
    }

    updateContextualSounds(game) {
        if (!game.player) return;
        
        // Son de pas quand le joueur bouge
        if (Math.abs(game.player.vx) > 0.1 && game.player.isGrounded) {
            if (!this.lastFootstepTime || Date.now() - this.lastFootstepTime > 300) {
                this.playSound('footstep');
                this.lastFootstepTime = Date.now();
            }
        }
    }

    draw(ctx) {
        // Dessiner les effets visuels d'ambiance
        this.particleSystem.draw(ctx);
        this.weatherSystem.draw(ctx);
        this.lightingSystem.draw(ctx);
    }

    setVolume(soundVolume, musicVolume) {
        this.soundVolume = Math.max(0, Math.min(1, soundVolume));
        this.musicVolume = Math.max(0, Math.min(1, musicVolume));
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }
}

// Système de particules pour les effets visuels
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 100;
    }

    addParticle(x, y, type, options = {}) {
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // Supprimer la plus ancienne
        }

        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * (options.speed || 2),
            vy: (Math.random() - 0.5) * (options.speed || 2),
            life: options.life || 1.0,
            maxLife: options.life || 1.0,
            size: options.size || 2,
            color: options.color || '#FFFFFF',
            type: type,
            gravity: options.gravity || 0
        };

        this.particles.push(particle);
    }

    update(delta) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;
            particle.vy += particle.gravity * delta;
            particle.life -= delta;

            return particle.life > 0;
        });
    }

    draw(ctx) {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            
            if (particle.type === 'spark') {
                ctx.fillStyle = particle.color;
                ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
            } else if (particle.type === 'circle') {
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    createExplosion(x, y, color = '#FF6B6B') {
        for (let i = 0; i < 10; i++) {
            this.addParticle(x, y, 'spark', {
                speed: 5,
                life: 0.5,
                size: 2,
                color: color,
                gravity: 0.1
            });
        }
    }

    createHealEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            this.addParticle(x, y, 'circle', {
                speed: 1,
                life: 1.0,
                size: 3,
                color: '#4CAF50',
                gravity: -0.05
            });
        }
    }

    createLevelUpEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            this.addParticle(x, y, 'spark', {
                speed: 3,
                life: 1.5,
                size: 3,
                color: '#FFD700',
                gravity: -0.02
            });
        }
    }
}

// Système météorologique
class WeatherSystem {
    constructor() {
        this.currentWeather = 'clear';
        this.weatherIntensity = 0;
        this.rainDrops = [];
        this.snowFlakes = [];
        this.weatherTimer = 0;
        this.weatherDuration = 30000; // 30 secondes par météo
    }

    update(delta) {
        this.weatherTimer += delta * 1000;
        
        if (this.weatherTimer > this.weatherDuration) {
            this.changeWeather();
            this.weatherTimer = 0;
        }

        if (this.currentWeather === 'rain') {
            this.updateRain(delta);
        } else if (this.currentWeather === 'snow') {
            this.updateSnow(delta);
        }
    }

    changeWeather() {
        const weathers = ['clear', 'rain', 'snow', 'fog'];
        const newWeather = weathers[Math.floor(Math.random() * weathers.length)];
        
        if (newWeather !== this.currentWeather) {
            this.currentWeather = newWeather;
            this.weatherIntensity = Math.random() * 0.5 + 0.3; // 0.3 à 0.8
            
            // Réinitialiser les effets
            this.rainDrops = [];
            this.snowFlakes = [];
        }
    }

    updateRain(delta) {
        // Ajouter de nouvelles gouttes
        if (Math.random() < this.weatherIntensity) {
            this.rainDrops.push({
                x: Math.random() * window.innerWidth,
                y: -10,
                speed: 200 + Math.random() * 100,
                length: 5 + Math.random() * 10
            });
        }

        // Mettre à jour les gouttes existantes
        this.rainDrops = this.rainDrops.filter(drop => {
            drop.y += drop.speed * delta;
            return drop.y < window.innerHeight + 20;
        });
    }

    updateSnow(delta) {
        // Ajouter de nouveaux flocons
        if (Math.random() < this.weatherIntensity * 0.5) {
            this.snowFlakes.push({
                x: Math.random() * window.innerWidth,
                y: -10,
                speed: 50 + Math.random() * 50,
                size: 2 + Math.random() * 3,
                drift: (Math.random() - 0.5) * 20
            });
        }

        // Mettre à jour les flocons existants
        this.snowFlakes = this.snowFlakes.filter(flake => {
            flake.y += flake.speed * delta;
            flake.x += flake.drift * delta;
            return flake.y < window.innerHeight + 20;
        });
    }

    draw(ctx) {
        if (this.currentWeather === 'rain') {
            ctx.strokeStyle = 'rgba(173, 216, 230, 0.6)';
            ctx.lineWidth = 1;
            
            this.rainDrops.forEach(drop => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x - 2, drop.y - drop.length);
                ctx.stroke();
            });
        } else if (this.currentWeather === 'snow') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            this.snowFlakes.forEach(flake => {
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (this.currentWeather === 'fog') {
            // Effet de brouillard
            const gradient = ctx.createRadialGradient(
                ctx.canvas.width / 2, ctx.canvas.height / 2, 0,
                ctx.canvas.width / 2, ctx.canvas.height / 2, ctx.canvas.width
            );
            gradient.addColorStop(0, 'rgba(200, 200, 200, 0)');
            gradient.addColorStop(1, `rgba(200, 200, 200, ${this.weatherIntensity * 0.3})`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    getCurrentWeather() {
        return {
            type: this.currentWeather,
            intensity: this.weatherIntensity
        };
    }
}

// Système d'éclairage dynamique
class LightingSystem {
    constructor() {
        this.timeOfDay = 0.5; // 0 = minuit, 0.5 = midi, 1 = minuit
        this.lightSources = [];
        this.ambientLight = 0.8;
    }

    update(game, delta) {
        // Cycle jour/nuit (24 minutes = 1 jour)
        this.timeOfDay += delta / (24 * 60);
        if (this.timeOfDay > 1) this.timeOfDay -= 1;

        // Calculer la lumière ambiante basée sur l'heure
        if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
            // Nuit
            this.ambientLight = 0.3;
        } else if (this.timeOfDay > 0.4 && this.timeOfDay < 0.6) {
            // Jour
            this.ambientLight = 1.0;
        } else {
            // Aube/crépuscule
            const factor = this.timeOfDay < 0.5 ? 
                (this.timeOfDay - 0.25) / 0.15 : 
                (0.75 - this.timeOfDay) / 0.15;
            this.ambientLight = 0.3 + (0.7 * Math.max(0, Math.min(1, factor)));
        }
    }

    addLightSource(x, y, radius, intensity, color = '#FFFF88') {
        this.lightSources.push({ x, y, radius, intensity, color });
    }

    draw(ctx) {
        // Appliquer l'éclairage ambiant
        if (this.ambientLight < 1.0) {
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = `rgba(100, 100, 150, ${1 - this.ambientLight})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }

        // Dessiner les sources de lumière
        this.lightSources.forEach(light => {
            const gradient = ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            gradient.addColorStop(0, `${light.color}${Math.floor(light.intensity * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, `${light.color}00`);
            
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = gradient;
            ctx.fillRect(
                light.x - light.radius, light.y - light.radius,
                light.radius * 2, light.radius * 2
            );
            ctx.restore();
        });

        // Nettoyer les sources de lumière temporaires
        this.lightSources = [];
    }

    getTimeOfDay() {
        return this.timeOfDay;
    }

    getSkyColor() {
        if (this.timeOfDay < 0.25 || this.timeOfDay > 0.75) {
            return '#1a1a2e'; // Nuit
        } else if (this.timeOfDay > 0.4 && this.timeOfDay < 0.6) {
            return '#87CEEB'; // Jour
        } else {
            // Aube/crépuscule
            const factor = this.timeOfDay < 0.5 ? 
                (this.timeOfDay - 0.25) / 0.15 : 
                (0.75 - this.timeOfDay) / 0.15;
            
            if (factor < 0.5) {
                // Plus proche de la nuit
                return '#2d1b69';
            } else {
                // Plus proche du jour
                return '#ff7f50';
            }
        }
    }
}