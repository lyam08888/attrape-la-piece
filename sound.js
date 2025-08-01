export class SoundManager {
    constructor(volume = 1) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = volume;
        this.master.connect(this.ctx.destination);
        this.volume = volume;
        this.stepCooldown = 0;
        this.ambient = null;
        this.musicInterval = null;
    }

    setVolume(v) {
        this.volume = v;
        this.master.gain.value = v;
    }

    playTone(freq, duration = 0.1, type = 'square', gainValue = 0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = gainValue;
        osc.connect(gain);
        gain.connect(this.master);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playStep() {
        if (this.stepCooldown <= 0) {
            this.playTone(220, 0.05);
            this.stepCooldown = 10;
        }
    }

    playJump() { this.playTone(600, 0.15); }
    playBreak() { this.playTone(180, 0.15); }
    playHit() { this.playTone(120, 0.1); }

    startAmbient() {
        if (this.ambient) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 50;
        gain.gain.value = 0.02;
        osc.connect(gain);
        gain.connect(this.master);
        osc.start();
        this.ambient = { osc, gain };
    }

    stopAmbient() {
        if (this.ambient) {
            this.ambient.osc.stop();
            this.ambient = null;
        }
    }

    startMusic() {
        if (this.musicInterval) return;
        const notes = [261.63, 329.63, 392.0, 523.25];
        let index = 0;
        this.musicInterval = setInterval(() => {
            this.playTone(notes[index % notes.length], 0.3, 'square', 0.05);
            index++;
        }, 400);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    /**
     * Generic play method used by the rest of the game. Since this project
     * only uses synthesized tones, map known effect names to a short tone.
     * Unknown names are ignored to avoid runtime errors.
     */
    play(name, opts = {}) {
        const volume = opts.volume ?? 1;
        switch (name) {
            case 'enemy_die':
                this.playTone(200, 0.2, 'square', 0.1 * volume);
                break;
            case 'break_block':
                this.playTone(180, 0.15, 'square', 0.1 * volume);
                break;
            default:
                console.warn(`Unknown sound: ${name}`);
        }
    }

    update() { if (this.stepCooldown > 0) this.stepCooldown--; }
}
