(function() {
    'use strict';
    let totalSeconds = 180;
    let remaining = 180;
    let isRunning = false;
    let timerId = null;
    let audioCtx = null;

    const bombDisplay = document.getElementById('bomb-display');
    const bombBody = document.getElementById('bomb-body');
    const fuseBurnt = document.getElementById('fuse-burnt');
    const fuseSpark = document.getElementById('fuse-spark');
    const btnArm = document.getElementById('btn-arm');
    const btnDefuse = document.getElementById('btn-defuse');
    const boomOverlay = document.getElementById('boom-overlay');

    // Fuse path total length (approximate for our SVG)
    const FUSE_LEN = 60;

    function fmt(secs) {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    }

    function updateFuse() {
      const ratio = remaining / totalSeconds;
      // burnt = how much fuse is gone (from end/top of fuse)
      const offset = FUSE_LEN * ratio; // remaining fuse
      fuseBurnt.style.strokeDashoffset = String(offset);
      // Move spark along path (simplified: spark at top if fresh, bottom if burnt)
      const sparkY = 50 - (50 * (1 - ratio)); // moves from 50 to 0
      const sparkX = 20 + Math.sin((1-ratio) * Math.PI) * 10;
      fuseSpark.setAttribute('cx', sparkX.toFixed(1));
      fuseSpark.setAttribute('cy', sparkY.toFixed(1));
    }

    function updateColors() {
      const ratio = remaining / totalSeconds;
      bombDisplay.classList.remove('warning','danger');
      bombBody.classList.remove('warning','danger');
      if (ratio <= 0.1) {
        bombDisplay.classList.add('danger');
        bombBody.classList.add('danger');
      } else if (ratio <= 0.3) {
        bombDisplay.classList.add('warning');
        bombBody.classList.add('warning');
      }
    }

    function tick() {
      remaining--;
      bombDisplay.textContent = fmt(remaining);
      updateFuse();
      updateColors();
      if (remaining <= 0) {
        clearInterval(timerId);
        isRunning = false;
        explode();
      } else if (remaining <= 10) {
        playBeep(remaining <= 5 ? 800 : 600);
      }
    }

    function getAudioCtx() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    }

    function playBeep(freq) {
      try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } catch(e) {}
    }

    function playExplosionSound() {
      // 1. Audio file playback
      try {
        const audio = new Audio('/assets/audio/explosion.ogg');
        audio.volume = 1.0;
        const p = audio.play();
        if (p !== undefined) p.catch(() => {});
      } catch (e) {}

      // 2. Cinematic Web Audio deep sub-bass shockwave + noise rumble layer
      try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;

        // Sub-bass frequency drop (160Hz -> 32Hz)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(160, now);
        subOsc.frequency.exponentialRampToValueAtTime(32, now + 1.2);
        subGain.gain.setValueAtTime(0.9, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 1.65);

        // White noise through lowpass filter sweep (explosive rumble)
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(55, now + 1.8);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.85, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + 2.0);
      } catch (e) {}
    }

    function explode() {
      boomOverlay.classList.add('is-boom');
      fuseSpark.style.display = 'none';
      playExplosionSound();
    }

    function arm() {
      const mins = parseInt(document.getElementById('input-min').value) || 0;
      const secs = parseInt(document.getElementById('input-sec').value) || 0;
      totalSeconds = mins * 60 + secs;
      if (totalSeconds <= 0) { alert('Please set a duration.'); return; }
      remaining = totalSeconds;
      isRunning = true;
      fuseSpark.style.display = '';
      fuseBurnt.style.strokeDashoffset = FUSE_LEN;
      bombDisplay.textContent = fmt(remaining);
      bombDisplay.classList.remove('warning','danger');
      bombBody.classList.remove('warning','danger');
      btnArm.querySelector('span').textContent = '💣 Running...';
      btnArm.disabled = true;
      document.getElementById('input-min').disabled = true;
      document.getElementById('input-sec').disabled = true;
      timerId = setInterval(tick, 1000);
    }

    function defuse() {
      clearInterval(timerId);
      isRunning = false;
      boomOverlay.classList.remove('is-boom');
      const mins = parseInt(document.getElementById('input-min').value) || 3;
      const secs = parseInt(document.getElementById('input-sec').value) || 0;
      remaining = mins * 60 + secs;
      totalSeconds = remaining;
      bombDisplay.textContent = fmt(remaining);
      bombDisplay.classList.remove('warning','danger');
      bombBody.classList.remove('warning','danger');
      fuseBurnt.style.strokeDashoffset = FUSE_LEN;
      fuseSpark.setAttribute('cx','20'); fuseSpark.setAttribute('cy','0'); fuseSpark.style.display = '';
      btnArm.querySelector('span').textContent = '💣 Arm the Bomb!';
      btnArm.disabled = false;
      document.getElementById('input-min').disabled = false;
      document.getElementById('input-sec').disabled = false;
    }

    function setDuration(totalSecs, fromPreset = false) {
      if (isRunning) return;
      totalSeconds = Math.max(5, Math.min(3600, totalSecs));
      remaining = totalSeconds;
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      const minEl = document.getElementById('input-min');
      const secEl = document.getElementById('input-sec');
      if (minEl) minEl.value = m;
      if (secEl) secEl.value = s;
      bombDisplay.textContent = fmt(remaining);
      updateFuse();
      updateColors();
      
      document.querySelectorAll('[data-sec], #btn-custom-bomb').forEach(b => b.classList.remove('active'));
      if (fromPreset) {
        const matching = document.querySelector(`[data-sec="${totalSeconds}"]`);
        if (matching) matching.classList.add('active');
        else {
          const btnCust = document.getElementById('btn-custom-bomb');
          if (btnCust) btnCust.classList.add('active');
        }
      } else {
        const btnCust = document.getElementById('btn-custom-bomb');
        if (btnCust) btnCust.classList.add('active');
      }
    }

    const btnApply = document.getElementById('btn-apply-time');
    if (btnApply) {
      btnApply.addEventListener('click', () => {
        const mins = parseInt(document.getElementById('input-min').value) || 0;
        const secs = parseInt(document.getElementById('input-sec').value) || 0;
        setDuration(mins * 60 + secs, false);
      });
    }

    async function promptCustomBombTime() {
      if (isRunning) return;
      const curM = Math.floor(totalSeconds / 60);
      const curS = totalSeconds % 60;
      const defVal = curM > 0 ? (curS > 0 ? `${curM}m ${curS}s` : `${curM}m`) : `${curS}s`;
      let val;
      if (window.ClassPanel && window.ClassPanel.prompt) {
        val = await window.ClassPanel.prompt({
          title: 'Custom Bomb Countdown',
          message: 'Enter countdown time (e.g. "45s", "2m", "5m 30s", or seconds):',
          defaultValue: defVal,
          placeholder: 'e.g. 2m 30s'
        });
      } else {
        val = window.prompt('Enter countdown time (e.g. 2m 30s or 90):', defVal);
      }
      if (!val) return;
      val = val.trim().toLowerCase();
      let total = 0;
      const mMatch = val.match(/(\d+)\s*(?:m|min|minute)/);
      const sMatch = val.match(/(\d+)\s*(?:s|sec|second)/);
      if (mMatch || sMatch) {
        if (mMatch) total += parseInt(mMatch[1], 10) * 60;
        if (sMatch) total += parseInt(sMatch[1], 10);
      } else if (val.includes(':')) {
        const parts = val.split(':');
        total = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
      } else {
        const n = parseInt(val, 10);
        if (!isNaN(n)) total = n > 60 ? n : n * 60;
      }
      if (total > 0) {
        setDuration(total, false);
      }
    }

    const btnCustomBomb = document.getElementById('btn-custom-bomb');
    if (btnCustomBomb) btnCustomBomb.addEventListener('click', promptCustomBombTime);
    if (bombDisplay) {
      bombDisplay.style.cursor = 'pointer';
      bombDisplay.setAttribute('title', 'Click to set custom countdown time');
      bombDisplay.addEventListener('click', promptCustomBombTime);
    }

    btnArm.addEventListener('click', () => { if (!isRunning) arm(); });
    btnDefuse.addEventListener('click', defuse);

    // Quick presets
    document.querySelectorAll('[data-sec]').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = parseInt(btn.getAttribute('data-sec'), 10);
        setDuration(s, true);
      });
    });

    // Init display
    setDuration(180, true);
  })();