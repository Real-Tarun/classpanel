(function () {
    'use strict';
    const MIN_BPM = 40, MAX_BPM = 208;
    let bpm = 120;
    let isRunning = false;
    let timerId = null;
    let currentBeat = 0;
    let beatsPerBar = 4;
    let volume = 0.8;
    let audioCtx = null;
    let tapTimes = [];

    const bpmDisplay = document.getElementById('bpm-display');
    const bpmSlider = document.getElementById('bpm-slider');
    const beatIndicator = document.getElementById('beat-indicator');
    const beatNum = document.getElementById('beat-num');
    const beatDotsEl = document.getElementById('beat-dots');
    const btnStart = document.getElementById('btn-start');
    const btnTap = document.getElementById('btn-tap');
    const volSlider = document.getElementById('vol-slider');
    const volValue = document.getElementById('vol-value');

    const TEMPO_MARKS = [
      { max: 60, name: 'Largo', desc: 'Very slow, expressive' },
      { max: 66, name: 'Larghetto', desc: 'Rather slow' },
      { max: 76, name: 'Adagio', desc: 'Slow and stately' },
      { max: 108, name: 'Andante', desc: 'Walking pace' },
      { max: 120, name: 'Moderato', desc: 'Moderate speed' },
      { max: 156, name: 'Allegro', desc: 'Fast, lively' },
      { max: 176, name: 'Vivace', desc: 'Lively and fast' },
      { max: 200, name: 'Presto', desc: 'Very fast' },
      { max: 999, name: 'Prestissimo', desc: 'Extremely fast' },
    ];

    function getTempoName(b) {
      return TEMPO_MARKS.find(m => b <= m.max) || TEMPO_MARKS[TEMPO_MARKS.length - 1];
    }

    function updateTempoLabel() {
      const t = getTempoName(bpm);
      const el = document.getElementById('tempo-name');
      const desc = el.nextElementSibling;
      if (el) el.textContent = t.name;
      if (desc) desc.textContent = `${bpm} BPM — ${t.desc}`;
    }

    function setBPM(val) {
      bpm = Math.min(MAX_BPM, Math.max(MIN_BPM, val));
      bpmDisplay.textContent = bpm;
      bpmSlider.value = bpm;
      updateTempoLabel();
      if (isRunning) restartTicker();
    }

    function buildDots() {
      beatDotsEl.innerHTML = '';
      for (let i = 0; i < beatsPerBar; i++) {
        const dot = document.createElement('div');
        dot.className = 'beat-dot';
        dot.id = `dot-${i}`;
        beatDotsEl.appendChild(dot);
      }
    }

    function flashBeat(isAccent) {
      beatIndicator.classList.remove('beat-accent', 'beat-normal');
      void beatIndicator.offsetWidth; // force reflow
      beatIndicator.classList.add(isAccent ? 'beat-accent' : 'beat-normal');
      setTimeout(() => {
        beatIndicator.classList.remove('beat-accent', 'beat-normal');
      }, 120);

      // Dots
      document.querySelectorAll('.beat-dot').forEach((d, i) => {
        d.classList.remove('active-accent', 'active-normal');
        if (i === currentBeat) {
          d.classList.add(isAccent ? 'active-accent' : 'active-normal');
          setTimeout(() => d.classList.remove('active-accent', 'active-normal'), 120);
        }
      });
    }

    function getAudioCtx() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    }

    function playClick(accent) {
      try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = accent ? 1200 : 800;
        osc.type = 'square';
        gain.gain.setValueAtTime(volume * (accent ? 0.5 : 0.3), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
      } catch(e) {}
    }

    function tick() {
      const isAccent = currentBeat === 0;
      beatNum.textContent = currentBeat + 1;
      flashBeat(isAccent);
      playClick(isAccent);
      currentBeat = (currentBeat + 1) % beatsPerBar;
    }

    function startTicker() {
      if (timerId) clearInterval(timerId);
      const interval = Math.round(60000 / bpm);
      tick(); // immediate first tick
      timerId = setInterval(tick, interval);
    }

    function restartTicker() {
      if (timerId) clearInterval(timerId);
      if (isRunning) startTicker();
    }

    function start() {
      isRunning = true;
      currentBeat = 0;
      btnStart.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg><span>Stop</span>`;
      btnStart.classList.replace('btn-giant-primary', 'btn-giant-secondary');
      startTicker();
    }

    function stop() {
      isRunning = false;
      if (timerId) clearInterval(timerId);
      timerId = null;
      beatIndicator.classList.remove('beat-accent', 'beat-normal');
      document.querySelectorAll('.beat-dot').forEach(d => d.classList.remove('active-accent', 'active-normal'));
      btnStart.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Start Metronome</span>`;
      btnStart.classList.replace('btn-giant-secondary', 'btn-giant-primary');
    }

    btnStart.addEventListener('click', () => { if (isRunning) stop(); else start(); });

    document.getElementById('bpm-minus').addEventListener('click', () => setBPM(bpm - 1));
    document.getElementById('bpm-plus').addEventListener('click', () => setBPM(bpm + 1));

    // Long-press support for +/- buttons
    let holdTimer;
    ['bpm-minus', 'bpm-plus'].forEach(id => {
      const btn = document.getElementById(id);
      const dir = id === 'bpm-plus' ? 1 : -1;
      btn.addEventListener('mousedown', () => { holdTimer = setInterval(() => setBPM(bpm + dir), 80); });
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); holdTimer = setInterval(() => setBPM(bpm + dir), 80); }, { passive: false });
      ['mouseup', 'mouseleave', 'touchend'].forEach(ev => btn.addEventListener(ev, () => clearInterval(holdTimer)));
    });

    bpmSlider.addEventListener('input', () => setBPM(parseInt(bpmSlider.value)));

    // Time signature
    document.querySelectorAll('[data-beats]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-beats]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        beatsPerBar = parseInt(btn.getAttribute('data-beats'));
        currentBeat = 0;
        buildDots();
        if (isRunning) restartTicker();
      });
    });

    // Volume
    volSlider.addEventListener('input', () => {
      volume = parseInt(volSlider.value) / 100;
      volValue.textContent = volSlider.value + '%';
    });

    // Tap Tempo
    btnTap.addEventListener('click', () => {
      const now = Date.now();
      tapTimes = tapTimes.filter(t => now - t < 3000);
      tapTimes.push(now);
      if (tapTimes.length >= 2) {
        const gaps = tapTimes.slice(1).map((t, i) => t - tapTimes[i]);
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        setBPM(Math.round(60000 / avgGap));
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.code === 'Space') { e.preventDefault(); if (isRunning) stop(); else start(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setBPM(bpm + 1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setBPM(bpm - 1); }
      else if (e.key === 't' || e.key === 'T') btnTap.click();
    });

    // Init
    buildDots();
    updateTempoLabel();
  })();