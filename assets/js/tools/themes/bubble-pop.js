(function(){
    let initial=300, remaining=300, isRunning=false, interval=null, bubbleTimer=null;
    const display=document.getElementById('timer-display');
    const status=document.getElementById('bubble-status');
    const fill=document.getElementById('progress-fill');
    const alarmBanner=document.getElementById('alarm-banner');
    const btnStart=document.getElementById('btn-start');
    const btnReset=document.getElementById('btn-reset');
    const btnStopAlarm=document.getElementById('btn-stop-alarm');
    const bubbleCont=document.getElementById('bubble-container');
    const stage=document.getElementById('bubble-stage');

    const BUBBLE_COLORS = [
      'rgba(103,232,249,0.5)', 'rgba(167,243,208,0.5)', 'rgba(196,181,253,0.5)',
      'rgba(253,186,116,0.5)', 'rgba(249,168,212,0.5)', 'rgba(147,197,253,0.5)'
    ];

    function fmt(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');}

    function spawnBubble() {
      if (!isRunning) return;
      const b = document.createElement('div');
      b.className = 'bubble';
      const size = 20 + Math.random() * 50;
      const x = Math.random() * (stage.offsetWidth - size);
      const dur = 4 + Math.random() * 6;
      const h = 2 + Math.random() * 2;
      b.style.cssText = `
        width:${size}px; height:${size}px; left:${x}px; bottom:${Math.random()*60}px;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.65), ${BUBBLE_COLORS[Math.floor(Math.random()*BUBBLE_COLORS.length)]});
        border-color: rgba(255,255,255,0.7);
        animation-duration: ${dur}s;
        --dx1: ${(Math.random()-0.5)*30}px;
        --dx2: ${(Math.random()-0.5)*40}px;
        --dx3: ${(Math.random()-0.5)*25}px;
        --dx4: ${(Math.random()-0.5)*35}px;
        --h: ${h};
      `;
      bubbleCont.appendChild(b);
      // Allow popping on click
      b.addEventListener('click', () => {
        b.style.animationPlayState='paused';
        b.classList.add('popping');
        setTimeout(()=>b.remove(), 300);
      });
      setTimeout(() => { if (b.parentNode) b.remove(); }, dur * 1000);
    }

    function startBubbles() {
      spawnBubble();
      bubbleTimer = setInterval(spawnBubble, 1200);
    }
    function stopBubbles() {
      clearInterval(bubbleTimer); bubbleTimer = null;
    }

    function updateDisplay(){
      display.textContent=fmt(remaining);
      const ratio=initial>0?remaining/initial:0;
      fill.style.width=Math.max(0,Math.min(100,ratio*100))+'%';
      fill.classList.remove('warning','danger');
      display.classList.remove('warning','danger');
      if(ratio<=0.15){ fill.classList.add('danger'); display.classList.add('danger'); status.textContent='⚠️ Almost done! Bubbles are popping fast!'; }
      else if(ratio<=0.35){ fill.classList.add('warning'); display.classList.add('warning'); status.textContent='🟡 Getting close... bubbles are speeding up!'; }
      else if(isRunning){ status.textContent='🫧 Bubbles floating... ' + Math.floor(remaining/60) + 'm ' + (remaining%60) + 's remaining'; }
    }

    function tick(){if(remaining<=0){finish();return;}remaining--;updateDisplay();}

    function start(){
      if(isRunning)return;
      if(remaining<=0)reset();
      isRunning=true;
      btnStart.querySelector('span').textContent='Pause';
      btnStart.classList.add('is-running');
      if(window.SoundFX)window.SoundFX.playClick();
      status.textContent='🫧 Bubbles are floating...';
      startBubbles();
      interval=setInterval(tick,1000);
    }
    function pause(){
      isRunning=false; clearInterval(interval); interval=null; stopBubbles();
      btnStart.querySelector('span').textContent='Resume';
      btnStart.classList.remove('is-running');
      if(window.SoundFX)window.SoundFX.playClick();
      status.textContent='⏸️ Paused — bubbles resting.';
    }
    function reset(){
      isRunning=false; clearInterval(interval); interval=null; stopBubbles();
      remaining=initial; updateDisplay();
      while(bubbleCont.firstChild)bubbleCont.removeChild(bubbleCont.firstChild);
      btnStart.querySelector('span').textContent='Start';
      btnStart.classList.remove('is-running');
      if(alarmBanner)alarmBanner.style.display='none';
      status.textContent='🫧 Ready! Press Start to float the bubbles.';
    }
    function finish(){
      isRunning=false; clearInterval(interval); interval=null; stopBubbles();
      remaining=0; display.textContent=fmt(0); fill.style.width='0%';
      btnStart.querySelector('span').textContent='Start';
      btnStart.classList.remove('is-running');
      status.textContent='🎉 POP! All bubbles popped — time\'s up!';
      if(window.SoundFX)window.SoundFX.playFanfare();
      if(window.Confetti)window.Confetti.fire({count:120,colors:['#67e8f9','#a5f3fc','#c4b5fd','#fbcfe8']});
      if(alarmBanner)alarmBanner.style.display='flex';
      // Pop all remaining bubbles
      Array.from(bubbleCont.children).forEach(b=>{ b.style.animationPlayState='paused'; b.classList.add('popping'); setTimeout(()=>b.remove(),300); });
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
          window.ClassPanel.showToast(`Bubble timer set to ${fmt(s)}!`);
        }
      }
    }

    async function openCustomTime() {
      if (isRunning) pause();
      const cur = fmt(remaining);
      if (window.ClassPanel && window.ClassPanel.prompt) {
        const val = await window.ClassPanel.prompt({
          title: '⏱️ Custom Bubble Timer',
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