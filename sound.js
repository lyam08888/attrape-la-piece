export class SoundManager {
    constructor(volume = 1) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = volume;
        this.master.connect(this.ctx.destination);
        this.volume = volume;
        this.stepCooldown = 0;
        this.ambientNodes = []; // Pour gérer plusieurs sons d'ambiance
        this.musicInterval = null;
    }

    setVolume(v) {
        this.volume = v;
        this.master.gain.value = v;
    }

    playTone(freq, duration = 0.1, type = 'square', gainValue = 0.1, options = {}) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // Appliquer une enveloppe de fréquence (pitch bend) si spécifié
        if (options.freqEnd) {
            osc.frequency.exponentialRampToValueAtTime(options.freqEnd, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.master);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration = 0.1, gainValue = 0.1, filterFreq = 800) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        noise.start();
    }

    startAmbient(biome = 'surface') {
        this.stopAmbient();
        
        switch(biome) {
            case 'surface':
                // Vent léger et chant d'oiseau occasionnel
                const wind = this.ctx.createBufferSource();
                const bufferSize = this.ctx.sampleRate * 5;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
                wind.buffer = buffer;
                wind.loop = true;
                const windFilter = this.ctx.createBiquadFilter();
                windFilter.type = 'lowpass';
                windFilter.frequency.value = 200;
                const windGain = this.ctx.createGain();
                windGain.gain.value = 0.03;
                wind.connect(windFilter);
                windFilter.connect(windGain);
                windGain.connect(this.master);
                wind.start();
                this.ambientNodes.push(wind);
                
                const birdInterval = setInterval(() => this.playTone(2000, 0.1, 'sine', 0.05, { freqEnd: 2500 }), 8000);
                this.ambientNodes.push({ stop: () => clearInterval(birdInterval) });
                break;
            case 'underground':
            case 'core':
                // Drone bas et réverbéré
                const drone = this.ctx.createOscillator();
                drone.type = 'sine';
                drone.frequency.value = 60;
                const droneGain = this.ctx.createGain();
                droneGain.gain.value = 0.04;
                drone.connect(droneGain);
                droneGain.connect(this.master);
                drone.start();
                this.ambientNodes.push(drone);
                break;
            case 'hell':
                // Drone grave et menaçant
                const hellDrone = this.ctx.createOscillator();
                hellDrone.type = 'sawtooth';
                hellDrone.frequency.value = 40;
                const hellGain = this.ctx.createGain();
                hellGain.gain.value = 0.05;
                hellDrone.connect(hellGain);
                hellGain.connect(this.master);
                hellDrone.start();
                this.ambientNodes.push(hellDrone);
                break;
            case 'paradise':
                 const paradiseDrone = this.ctx.createOscillator();
                 paradiseDrone.type = 'sine';
                 paradiseDrone.frequency.value = 800;
                 const paradiseGain = this.ctx.createGain();
                 paradiseGain.gain.value = 0.03;
                 paradiseDrone.connect(paradiseGain);
                 paradiseGain.connect(this.master);
                 paradiseDrone.start();
                 this.ambientNodes.push(paradiseDrone);
                break;
            case 'nucleus':
                // Bruit filtré pour simuler l'eau
                const waterNoise = this.ctx.createBufferSource();
                const waterBufferSize = this.ctx.sampleRate * 5;
                const waterBuffer = this.ctx.createBuffer(1, waterBufferSize, this.ctx.sampleRate);
                const waterData = waterBuffer.getChannelData(0);
                for (let i = 0; i < waterBufferSize; i++) { waterData[i] = Math.random() * 2 - 1; }
                waterNoise.buffer = waterBuffer;
                waterNoise.loop = true;
                const waterFilter = this.ctx.createBiquadFilter();
                waterFilter.type = 'lowpass';
                waterFilter.frequency.value = 400;
                const waterGain = this.ctx.createGain();
                waterGain.gain.value = 0.1;
                waterNoise.connect(waterFilter);
                waterFilter.connect(waterGain);
                waterGain.connect(this.master);
                waterNoise.start();
                this.ambientNodes.push(waterNoise);
                break;
            case 'space':
                // Le silence est une ambiance
                break;
        }
    }

    stopAmbient() {
        this.ambientNodes.forEach(node => {
            if (node.stop) node.stop();
        });
        this.ambientNodes = [];
    }

    startMusic() {
        if (this.musicInterval) return;
        const notes = [261.63, 329.63, 392.0, 523.25];
        let index = 0;
        this.musicInterval = setInterval(() => {
            this.playTone(notes[index % notes.length], 0.3, 'triangle', 0.05);
            index++;
        }, 400);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    play(name, opts = {}) {
        const volume = opts.volume ?? 1;
        switch (name) {
            case 'jump':
                this.playTone(600, 0.15, 'sine', 0.1 * volume, { freqEnd: 800 });
                break;
            case 'enemy_die':
                this.playTone(200, 0.2, 'sawtooth', 0.1 * volume, { freqEnd: 50 });
                break;
            case 'break_block':
                this.playNoise(0.15, 0.2 * volume, 1000);
                break;
            case 'hit_block':
                this.playNoise(0.05, 0.1 * volume, 1500);
                break;
            case 'hit_fail':
                this.playTone(100, 0.1, 'square', 0.08 * volume);
                break;
            default:
                // Ne rien faire pour les sons inconnus pour éviter les erreurs
        }
    }

    update() { 
        if (this.stepCooldown > 0) this.stepCooldown--; 
    }
}
