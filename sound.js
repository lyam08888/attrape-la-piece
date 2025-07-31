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

    update() { if (this.stepCooldown > 0) this.stepCooldown--; }
}
