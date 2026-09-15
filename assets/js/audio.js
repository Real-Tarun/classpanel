/**
 * ClassPanel Web Audio API Synthesizer
 * Zero-dependency, offline-ready, latency-free audio generator.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('classpanel_muted') === 'true';
    this.volume = parseFloat(localStorage.getItem('classpanel_volume') || '0.8');
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    localStorage.setItem('classpanel_muted', this.isMuted ? 'true' : 'false');
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('classpanel_volume', this.volume.toString());
  }

  // Classic School Bell / Two-Tone Chime
  playSchoolBell() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [659.25, 523.25, 659.25, 783.99]; // E5, C5, E5, G5
    const times = [0, 0.28, 0.56, 0.84];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + times[i]);

      gain.gain.setValueAtTime(0, this.ctx.currentTime + times[i]);
      gain.gain.linearRampToValueAtTime(0.45 * this.volume, this.ctx.currentTime + times[i] + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + times[i] + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + times[i]);
      osc.stop(this.ctx.currentTime + times[i] + 0.65);
    });
  }

  // Gentle Soothing Chime
  playGentleChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, this.ctx.currentTime); // 528Hz Solfeggio / Love frequency

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(1056, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.4 * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);

    osc.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    oscHarmonic.start();
    osc.stop(this.ctx.currentTime + 1.85);
    oscHarmonic.stop(this.ctx.currentTime + 1.85);
  }

  // Digital Countdown Beep
  playBeep(isFinal = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(isFinal ? 880 : 440, this.ctx.currentTime);

    const dur = isFinal ? 0.35 : 0.08;
    gain.gain.setValueAtTime(0.25 * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + dur + 0.02);
  }

  // Celebratory Fanfare (Tada / Winner)
  playFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 0.12, t: 0 },    // C5
      { f: 659.25, d: 0.12, t: 0.12 }, // E5
      { f: 783.99, d: 0.12, t: 0.24 }, // G5
      { f: 1046.5, d: 0.45, t: 0.36 }  // C6
    ];

    melody.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, this.ctx.currentTime + n.t);

      gain.gain.setValueAtTime(0.35 * this.volume, this.ctx.currentTime + n.t);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + n.t);
      osc.stop(this.ctx.currentTime + n.t + n.d + 0.05);
    });
  }

  // Tactile Click / Tick for Buttons & Counters
  playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.2 * this.volume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  // Metallic Coin Flip Clink
  playCoinClink() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3 * this.volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }

  // Play alarm according to user selected tone
  playAlarm(soundType = 'bell') {
    if (this.isMuted) return;
    switch (soundType) {
      case 'chime':
        this.playGentleChime();
        break;
      case 'beep':
        this.playBeep(true);
        setTimeout(() => this.playBeep(true), 250);
        setTimeout(() => this.playBeep(true), 500);
        break;
      case 'fanfare':
        this.playFanfare();
        break;
      case 'bell':
      default:
        this.playSchoolBell();
        break;
    }
  }
}

// Global audio singleton
window.SoundFX = new SoundSynthesizer();
