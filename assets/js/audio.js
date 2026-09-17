/**
 * ClassPanel Web Audio API Synthesizer
 * Zero-dependency, offline-ready, latency-free audio generator.
 */

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('classpanel_muted') === 'true';
    this.volume = parseFloat(localStorage.getItem('classpanel_volume') || '0.8');
    this.currentMusicAudio = null;
    this.currentMusicTrack = null;
    this.alarmAudio = null;
    this.isAlarmRinging = false;
    this._proceduralAlarmInterval = null;
    this.alarmLoopMode = localStorage.getItem('classpanel_alarm_loop_mode') || 'loop'; // 'loop' (default) or 'ting'

    this.TRACKS = {
      calm: { name: 'Calm Meditation', src: '/assets/audio/calm.mp3' },
      rain: { name: 'Alpha Beats with Rain', src: '/assets/audio/binaural-rain.mp3' },
      'binaural-rain': { name: 'Alpha Beats with Rain', src: '/assets/audio/binaural-rain.mp3' },
      '5d': { name: '5D Spiritual Journey', src: '/assets/audio/journey-5d.mp3' },
      'journey-5d': { name: '5D Spiritual Journey', src: '/assets/audio/journey-5d.mp3' },
      meditation: { name: 'Deep Meditation Music', src: '/assets/audio/meditation.mp3' }
    };
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

  // --- Procedural Royalty-Free Ambient Music Generator ---
  startAmbient(track = 'focus', userVol = 0.5) {
    this.stopAmbient();
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    this.ambientNodes = [];
    this.ambientGain = this.ctx.createGain();
    const effectiveVol = Math.max(0, Math.min(1, userVol)) * this.volume * 0.35;
    this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(effectiveVol, this.ctx.currentTime + 1.2);
    this.ambientGain.connect(this.ctx.destination);

    if (track === 'focus') {
      // Warm meditative pad chords: C3 (130.81), G3 (196.00), E4 (329.63), B4 (493.88)
      const freqs = [130.81, 196.00, 329.63, 493.88];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const nodeGain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, this.ctx.currentTime);

        // Gentle undulating LFO
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.2 + idx * 0.08, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        nodeGain.gain.value = 0.25;
        osc.connect(filter);
        filter.connect(nodeGain);
        nodeGain.connect(this.ambientGain);

        osc.start();
        this.ambientNodes.push(osc, lfo);
      });
    } else if (track === 'rain') {
      // Procedural calming rain / white noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02; // Pink noise filter
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);
      whiteNoise.start();
      this.ambientNodes.push(whiteNoise);
    } else if (track === 'zen') {
      // Periodic Tibetan singing bowl & chime intervals
      const playZenChime = () => {
        if (!this.ambientGain) return;
        const freqs = [528, 660, 792, 1056];
        const f = freqs[Math.floor(Math.random() * freqs.length)];
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        g.gain.setValueAtTime(0.2, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.5);
        osc.connect(g);
        g.connect(this.ambientGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 3.6);
      };

      playZenChime();
      this.zenInterval = setInterval(playZenChime, 4500);
    }
  }

  stopAmbient() {
    if (this.zenInterval) {
      clearInterval(this.zenInterval);
      this.zenInterval = null;
    }
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          if (this.ambientNodes) {
            this.ambientNodes.forEach(node => {
              try { node.stop(); } catch(e) {}
              try { node.disconnect(); } catch(e) {}
            });
            this.ambientNodes = [];
          }
          if (this.ambientGain) {
            try { this.ambientGain.disconnect(); } catch(e) {}
            this.ambientGain = null;
          }
        }, 550);
      } catch(e) {
        this.ambientGain = null;
      }
    }
  }

  setAmbientVolume(vol) {
    if (this.ambientGain && this.ctx) {
      const effectiveVol = Math.max(0, Math.min(1, vol)) * this.volume * 0.35;
      this.ambientGain.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);
    }
  }

  // --- Real Button Click FX ---
  playButtonClick() {
    if (this.isMuted) return;
    try {
      const audio = new Audio('/assets/audio/button-click.mp3');
      audio.volume = Math.min(1, this.volume * 0.65);
      audio.play().catch(() => this.playPop());
    } catch(e) {
      this.playPop();
    }
  }

  // --- Real Pixabay Background Music Player (Loops during timer) ---
  startMusic(trackKey = 'calm', userVol = 0.5) {
    this.stopMusic();
    if (trackKey === 'none' || !trackKey) return;
    if (this.isMuted) return;

    // Check if it's a real file track
    const track = this.TRACKS[trackKey];
    if (track) {
      this.currentMusicTrack = trackKey;
      try {
        const audio = new Audio(track.src);
        audio.loop = true;
        audio.volume = Math.max(0, Math.min(1, userVol)) * Math.max(0.4, this.volume) * 0.75;
        this.currentMusicAudio = audio;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.warn('ClassPanel Music autoplay/play fallback:', err);
            this.startAmbient('focus', userVol);
          });
        }
      } catch(e) {
        console.warn('Audio creation error:', e);
        this.startAmbient('focus', userVol);
      }
    } else {
      // Fallback to procedural synth track (focus, rain, zen)
      this.startAmbient(trackKey, userVol);
    }
  }

  previewMusic(trackKey = 'calm', userVol = 0.5) {
    if (this.currentMusicAudio && !this.currentMusicAudio.paused && this.currentMusicTrack === trackKey) {
      this.stopMusic();
      return false;
    }
    this.startMusic(trackKey, userVol);
    return true;
  }

  pauseMusic() {
    if (this.currentMusicAudio && !this.currentMusicAudio.paused) {
      this.currentMusicAudio.pause();
    }
  }

  resumeMusic() {
    if (this.isMuted) return;
    if (this.currentMusicAudio && this.currentMusicAudio.paused) {
      this.currentMusicAudio.play().catch(() => {});
    }
  }

  stopMusic() {
    if (this.currentMusicAudio) {
      try {
        this.currentMusicAudio.pause();
        this.currentMusicAudio.currentTime = 0;
      } catch(e) {}
      this.currentMusicAudio = null;
      this.currentMusicTrack = null;
    }
    this.stopAmbient();
  }

  setMusicVolume(vol) {
    const v = Math.max(0, Math.min(1, vol));
    if (this.currentMusicAudio) {
      this.currentMusicAudio.volume = v * this.volume * 0.55;
    }
    this.setAmbientVolume(v);
  }

  // --- Timer Completion Alarm (Uses user's Digital Alarm Clock sound: Loop vs Short 2-3s Ting) ---
  playCompletionAlarm(mode = null) {
    if (this.isMuted) return;
    this.stopAlarm();
    this.stopMusic();

    const activeMode = mode || this.alarmLoopMode || 'loop';

    // 1. Short Ting Mode (2-3s burst of user's digital alarm, then auto stops)
    if (activeMode === 'ting') {
      try {
        const tingAudio = new Audio('/assets/audio/digital-alarm.mp3');
        tingAudio.loop = false;
        tingAudio.volume = Math.min(1, this.volume * 0.85);
        this.alarmAudio = tingAudio;
        tingAudio.play().catch(() => this.playBeep(true));
        setTimeout(() => {
          if (this.alarmAudio === tingAudio) {
            this.stopAlarm();
          }
        }, 2600);
      } catch(e) {
        this.playBeep(true);
      }
      return;
    }

    // 2. Continuous Loop Mode (Default - rings digital alarm continuously until user stops)
    this.isAlarmRinging = true;
    try {
      this.alarmAudio = new Audio('/assets/audio/digital-alarm.mp3');
      this.alarmAudio.loop = true;
      this.alarmAudio.volume = Math.min(1, this.volume * 0.85);
      const p = this.alarmAudio.play();
      if (p !== undefined) {
        p.catch(err => {
          console.warn('Alarm audio fallback to procedural loop:', err);
          this._startProceduralAlarmLoop();
        });
      }
    } catch(e) {
      this._startProceduralAlarmLoop();
    }

    window.dispatchEvent(new CustomEvent('classpanel-alarm-started', { detail: { mode: 'loop' } }));
  }

  previewAlarm(mode = null) {
    if (this.isAlarmRinging) {
      this.stopAlarm();
      return false;
    }
    this.playCompletionAlarm(mode);
    return true;
  }

  _startProceduralAlarmLoop() {
    this._proceduralAlarmInterval = setInterval(() => {
      if (!this.isAlarmRinging) {
        clearInterval(this._proceduralAlarmInterval);
        return;
      }
      this.playSchoolBell();
    }, 2200);
    this.playSchoolBell();
  }

  stopAlarm() {
    this.isAlarmRinging = false;
    if (this.alarmAudio) {
      try {
        this.alarmAudio.pause();
        this.alarmAudio.currentTime = 0;
      } catch(e) {}
      this.alarmAudio = null;
    }
    if (this._proceduralAlarmInterval) {
      clearInterval(this._proceduralAlarmInterval);
      this._proceduralAlarmInterval = null;
    }
    window.dispatchEvent(new CustomEvent('classpanel-alarm-stopped'));
  }

  setAlarmLoopMode(mode) {
    this.alarmLoopMode = mode === 'ting' ? 'ting' : 'loop';
    localStorage.setItem('classpanel_alarm_loop_mode', this.alarmLoopMode);
    return this.alarmLoopMode;
  }
}

// Global audio singleton
window.SoundFX = new SoundSynthesizer();

