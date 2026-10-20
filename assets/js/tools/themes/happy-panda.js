(function(){
    let initial = 300, remaining = 300, isRunning = false, interval = null;
    const display = document.getElementById('timer-display');
    const pandaWrap = document.getElementById('panda-mascot-wrap');
    const pandaEyes = document.getElementById('panda-eyes');
    const pandaMouth = document.getElementById('panda-mouth');
    const speech = document.getElementById('panda-speech');
    const fill = document.getElementById('progress-fill');
    const alarmBanner = document.getElementById('alarm-banner');
    const btnStart = document.getElementById('btn-start');
    const btnReset = document.getElementById('btn-reset');
    const btnStopAlarm = document.getElementById('btn-stop-alarm');

    const PANDA_STATES = {
      idle:    { cls: 'idle',    emoji: '🐼', speeches: ['Ready to go! Press Start 🎋','Take a deep breath... 🎍','Panda is ready! 🐼'] },
      running: { cls: 'running', emoji: '🐼', speeches: ['You\'re doing great! 🌟','Keep going! 💪','Panda is cheering for you! 🎉'] },
      warning: { cls: 'warning', emoji: '😟', speeches: ['Getting close... 😟','Almost there! ⚡','Time is ticking! ⏰'] },
      danger:  { cls: 'danger',  emoji: '😱', speeches: ['ALMOST DONE! 😱','Hurry hurry! 🔥','Final seconds! 🚨'] },
      done:    { cls: 'done',    emoji: '🎉', speeches: ['TIME\'S UP! Amazing work! 🎉','WELL DONE! 🏆','Panda is so proud of you! 🐼✨'] }
    };

    function fmt(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');}

    function setPandaState(state) {
      const st = PANDA_STATES[state];
      if (!st) return;
      if (pandaWrap) pandaWrap.className = 'panda-mascot-container ' + st.cls;
      speech.textContent = st.speeches[Math.floor(Math.random() * st.speeches.length)];
      
      // Update SVG facial expression
      if (pandaEyes && pandaMouth) {
        if (state === 'done') {
          // Happy celebration curved eyes
          pandaEyes.innerHTML = `
            <path d="M48,77 Q56,70 64,77" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <path d="M96,77 Q104,70 112,77" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
          `;
          pandaMouth.setAttribute('d', 'M72,93 Q80,103 88,93');
        } else if (state === 'danger') {
          pandaEyes.innerHTML = `
            <circle cx="56" cy="76" r="6" fill="#ffffff"/>
            <circle cx="56" cy="76" r="3" fill="#0f172a"/>
            <circle cx="104" cy="76" r="6" fill="#ffffff"/>
            <circle cx="104" cy="76" r="3" fill="#0f172a"/>
          `;
          pandaMouth.setAttribute('d', 'M74,97 Q80,92 86,97');
        } else {
          // Standard / focus eyes
          pandaEyes.innerHTML = `
            <ellipse cx="56" cy="76" rx="6.5" ry="7.5" fill="#ffffff"/>
            <circle cx="56" cy="76" r="4.5" fill="#0f172a"/>
            <circle cx="54.5" cy="74" r="1.8" fill="#ffffff"/>
            <ellipse cx="104" cy="76" rx="6.5" ry="7.5" fill="#ffffff"/>
            <circle cx="104" cy="76" r="4.5" fill="#0f172a"/>
            <circle cx="102.5" cy="74" r="1.8" fill="#ffffff"/>
          `;
          pandaMouth.setAttribute('d', 'M74,94 Q80,99 86,94');
        }
      }
    }

    function updateDisplay() {
      display.textContent = fmt(remaining);
      const ratio = initial > 0 ? remaining / initial : 0;
      fill.style.width = Math.max(0, Math.min(100, ratio * 100)) + '%';
      // Color
      fill.classList.remove('warning','danger');
      display.classList.remove('warning','danger');
      if (ratio <= 0.15) {
        fill.classList.add('danger'); display.classList.add('danger');
        if (isRunning) setPandaState('danger');
      } else if (ratio <= 0.35) {
        fill.classList.add('warning'); display.classList.add('warning');
        if (isRunning) setPandaState('warning');
      } else if (isRunning) {
        // Only set running if we haven't already
        if (pandaWrap && !pandaWrap.classList.contains('running')) setPandaState('running');
      }
    }

    function tick() {
      if (remaining <= 0) { finish(); return; }
      remaining--;
      updateDisplay();
    }

    function start() {
      if (isRunning) return;
      if (remaining <= 0) reset();
      isRunning = true;
      setPandaState('running');
      btnStart.querySelector('span').textContent = 'Pause';
      btnStart.classList.add('is-running');
      if (window.SoundFX) window.SoundFX.playClick();
      interval = setInterval(tick, 1000);
    }

    function pause() {
      isRunning = false;
      clearInterval(interval); interval = null;
      setPandaState('idle');
      btnStart.querySelector('span').textContent = 'Resume';
      btnStart.classList.remove('is-running');
      if (window.SoundFX) window.SoundFX.playClick();
    }

    function reset() {
      isRunning = false;
      clearInterval(interval); interval = null;
      remaining = initial;
      updateDisplay();
      setPandaState('idle');
      btnStart.querySelector('span').textContent = 'Start';
      btnStart.classList.remove('is-running');
      if (alarmBanner) alarmBanner.style.display = 'none';
    }

    function finish() {
      isRunning = false;
      clearInterval(interval); interval = null;
      remaining = 0;
      display.textContent = fmt(0);
      fill.style.width = '0%';
      setPandaState('done');
      btnStart.querySelector('span').textContent = 'Start';
      btnStart.classList.remove('is-running');
      if (window.SoundFX) window.SoundFX.playFanfare();
      if (window.Confetti) window.Confetti.fire({ count: 120 });
      if (alarmBanner) alarmBanner.style.display = 'flex';
    }

    const btnCustomTime = document.getElementById('btn-custom-time');

    function parseDuration(val) {
      if (!val) return null;
      let s = 0;
      const str = String(val).trim().toLowerCase();
      const mMatch = str.match(/(\d+)\s*(?:m|min)/);
      const sMatch = str.match(/(\d+)\s*(?:s|sec)/);
      if (mMatch || sMatch) {
        if (mMatch) s += parseInt(mMatch[1], 10) * 60;
        if (sMatch) s += parseInt(sMatch[1], 10);
      } else if (str.includes(':')) {
        const parts = str.split(':').map(Number);
        if (parts.length === 3) s = (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
        else if (parts.length === 2) s = (parts[0] || 0) * 60 + (parts[1] || 0);
      } else {
        s = parseInt(str, 10);
      }
      return (!isNaN(s) && s > 0 && s <= 99 * 3600) ? s : null;
    }

    function applyCustomDuration(val) {
      const s = parseDuration(val);
      if (s !== null) {
        initial = s;
        remaining = s;
        document.querySelectorAll('.presets-group .preset-chip').forEach(x => x.classList.remove('active'));
        if (btnCustomTime) btnCustomTime.classList.add('active');
        updateDisplay();
        reset();
        if (window.ClassPanel && window.ClassPanel.showToast) {
          window.ClassPanel.showToast(`Panda timer set to ${fmt(s)}!`);
        }
      }
    }

    async function openCustomTime() {
      if (isRunning) pause();
      const cur = fmt(remaining);
      if (window.ClassPanel && window.ClassPanel.prompt) {
        const val = await window.ClassPanel.prompt({
          title: '⏱️ Custom Panda Timer',
          label: 'Enter duration (e.g. "2:30", "90s", "10 min", or seconds):',
          defaultValue: cur,
          placeholder: 'e.g. 05:00 or 90s',
          confirmText: 'Set Countdown'
        });
        if (val !== null && val !== undefined) applyCustomDuration(val);
      } else {
        const val = window.prompt('Enter countdown time (e.g. 2:30, 90s, or seconds):', cur);
        if (val) applyCustomDuration(val);
      }
    }

    btnStart.addEventListener('click', () => { if (isRunning) pause(); else start(); });
    btnReset.addEventListener('click', reset);
    if (btnStopAlarm) btnStopAlarm.addEventListener('click', () => { if (alarmBanner) alarmBanner.style.display = 'none'; reset(); });
    if (alarmBanner) alarmBanner.addEventListener('click', (e) => { if (e.target !== btnStopAlarm) { alarmBanner.style.display='none'; reset(); } });
    if (btnCustomTime) btnCustomTime.addEventListener('click', openCustomTime);
    display.addEventListener('click', openCustomTime);

    document.querySelectorAll('.presets-group .preset-chip[data-seconds]').forEach(c => {
      c.addEventListener('click', () => {
        initial = parseInt(c.getAttribute('data-seconds'), 10);
        remaining = initial;
        document.querySelectorAll('.presets-group .preset-chip').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        reset();
      });
    });

    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
      if (e.code === 'Space') { e.preventDefault(); if (isRunning) pause(); else start(); }
      if (e.code === 'KeyR') reset();
    });

    reset();
  })();