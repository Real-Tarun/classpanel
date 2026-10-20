(function() {
    'use strict';
    const LS_KEY = 'cp_custom_timer';
    let selectedColor = '#0C294A';
    let remaining = 0, total = 0;
    let isRunning = false, isPaused = false;
    let timerId = null;
    let audioCtx = null;

    // DOM
    const overlay = document.getElementById('timer-run-overlay');
    const runLabel = document.getElementById('run-label');
    const runDisplay = document.getElementById('run-display');
    const endMessage = document.getElementById('end-message');
    const btnRunPause = document.getElementById('run-pause');
    const btnRunStop = document.getElementById('run-stop');

    // Load saved config
    function loadConfig() {
      try {
        const saved = JSON.parse(localStorage.getItem(LS_KEY));
        if (!saved) return;
        if (saved.label) document.getElementById('timer-label').value = saved.label;
        if (saved.hours !== undefined) document.getElementById('dur-hours').value = saved.hours;
        if (saved.min !== undefined) document.getElementById('dur-min').value = saved.min;
        if (saved.sec !== undefined) document.getElementById('dur-sec').value = saved.sec;
        if (saved.color) {
          selectedColor = saved.color;
          document.querySelectorAll('.color-swatch').forEach(s => {
            s.classList.toggle('selected', s.getAttribute('data-color') === selectedColor);
          });
        }
        if (saved.sound) document.getElementById('end-sound').value = saved.sound;
        document.getElementById('save-config').checked = true;
      } catch(e) {}
    }

    function saveConfig() {
      const config = {
        label: document.getElementById('timer-label').value,
        hours: document.getElementById('dur-hours').value,
        min: document.getElementById('dur-min').value,
        sec: document.getElementById('dur-sec').value,
        color: selectedColor,
        sound: document.getElementById('end-sound').value,
      };
      localStorage.setItem(LS_KEY, JSON.stringify(config));
    }

    // Color swatches
    document.querySelectorAll('.color-swatch').forEach(s => {
      s.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('selected'));
        s.classList.add('selected');
        selectedColor = s.getAttribute('data-color');
      });
    });

    function fmt(secs) {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    function getAudioCtx() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    }

    function playEndSound(type) {
      if (type === 'none') return;
      if (type === 'alarm') {
        if (window.SoundFX && window.SoundFX.playCompletionAlarm) {
          window.SoundFX.playCompletionAlarm('loop');
          return;
        }
        try {
          const alarmAud = new Audio('/assets/audio/digital-alarm.mp3');
          alarmAud.volume = 0.9;
          alarmAud.loop = true;
          alarmAud.play().catch(() => {});
          window._activeCustomTimerAlarm = alarmAud;
          return;
        } catch(e) {}
      } else if (type === 'bell') {
        if (window.SoundFX && window.SoundFX.playSchoolBell) {
          window.SoundFX.playSchoolBell();
          return;
        }
      } else if (type === 'chime') {
        if (window.SoundFX && window.SoundFX.playGentleChime) {
          window.SoundFX.playGentleChime();
          return;
        }
      } else if (type === 'horn') {
        if (window.SoundFX && window.SoundFX.playFanfare) {
          window.SoundFX.playFanfare();
          return;
        }
      }

      try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const notes = {
          bell: [880, 660, 440],
          chime: [523, 659, 784, 1047],
          alarm: [440, 880, 440, 880, 440, 880],
          horn: [110, 88]
        };
        const freqs = notes[type] || notes.alarm;
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = f;
          osc.type = type === 'alarm' ? 'square' : 'sine';
          const t = ctx.currentTime + i * 0.25;
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.start(t); osc.stop(t + 0.35);
        });
      } catch(e) {}
    }

    function tick() {
      remaining--;
      runDisplay.textContent = fmt(remaining);
      if (remaining <= 0) {
        clearInterval(timerId);
        isRunning = false;
        endMessage.style.display = 'block';
        runDisplay.style.display = 'none';
        const sound = document.getElementById('end-sound').value;
        playEndSound(sound);
      }
    }

    function startTimer() {
      const h = parseInt(document.getElementById('dur-hours').value) || 0;
      const m = parseInt(document.getElementById('dur-min').value) || 0;
      const s = parseInt(document.getElementById('dur-sec').value) || 0;
      total = h*3600 + m*60 + s;
      if (total <= 0) { alert('Please set a duration greater than zero.'); return; }
      if (document.getElementById('save-config').checked) saveConfig();

      const label = document.getElementById('timer-label').value || 'Timer';
      remaining = total;
      runLabel.textContent = label;
      runDisplay.textContent = fmt(remaining);
      runDisplay.style.display = 'block';
      endMessage.style.display = 'none';
      overlay.style.background = `linear-gradient(135deg, ${selectedColor}dd, ${selectedColor}99)`;
      overlay.classList.add('is-active');
      isRunning = true;
      isPaused = false;
      btnRunPause.textContent = '⏸ Pause';
      timerId = setInterval(tick, 1000);
    }

    function stopTimer() {
      clearInterval(timerId);
      isRunning = false;
      overlay.classList.remove('is-active');
      endMessage.style.display = 'none';
      runDisplay.style.display = 'block';
      if (window.SoundFX && window.SoundFX.stopAlarm) {
        window.SoundFX.stopAlarm();
      }
      if (window._activeCustomTimerAlarm) {
        try {
          window._activeCustomTimerAlarm.pause();
          window._activeCustomTimerAlarm.currentTime = 0;
        } catch(e) {}
        window._activeCustomTimerAlarm = null;
      }
    }

    function pauseTimer() {
      if (!isRunning && !isPaused) return;
      if (!isPaused) {
        clearInterval(timerId);
        isPaused = true;
        btnRunPause.textContent = '▶ Resume';
      } else {
        isPaused = false;
        timerId = setInterval(tick, 1000);
        btnRunPause.textContent = '⏸ Pause';
      }
    }

    document.getElementById('btn-launch-timer').addEventListener('click', startTimer);
    btnRunStop.addEventListener('click', stopTimer);
    btnRunPause.addEventListener('click', pauseTimer);

    // Keyboard shortcuts in overlay
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('is-active')) return;
      if (e.code === 'Space') { e.preventDefault(); pauseTimer(); }
      if (e.key === 'Escape') stopTimer();
    });

    loadConfig();
  })();