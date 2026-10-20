(function(){
    const FUEL_CELLS = 8;
    let initial=300, remaining=300, isRunning=false, interval=null;
    const display=document.getElementById('timer-display');
    const rocket=document.getElementById('rocket-emoji');
    const status=document.getElementById('launch-status');
    const fill=document.getElementById('progress-fill');
    const fuelCont=document.getElementById('fuel-cells');
    const alarmBanner=document.getElementById('alarm-banner');
    const btnStart=document.getElementById('btn-start');
    const btnReset=document.getElementById('btn-reset');
    const btnStopAlarm=document.getElementById('btn-stop-alarm');

    // Build fuel cells
    for(let i=0;i<FUEL_CELLS;i++){const c=document.createElement('div');c.className='fuel-cell';c.id='fuel-'+i;fuelCont.appendChild(c);}

    function fmt(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');}

    function updateFuelCells(ratio) {
      const lit = Math.round((1 - ratio) * FUEL_CELLS);
      for(let i=0;i<FUEL_CELLS;i++){
        const c=document.getElementById('fuel-'+i);
        if(c) c.classList.toggle('lit', i < lit);
      }
    }

    function updateDisplay(){
      display.textContent=fmt(remaining);
      const ratio=initial>0?remaining/initial:0;
      fill.style.width=Math.max(0,Math.min(100,ratio*100))+'%';
      fill.classList.remove('warning','danger');
      display.classList.remove('warning','danger');
      updateFuelCells(ratio);
      if(ratio<=0.15){ fill.classList.add('danger'); display.classList.add('danger'); rocket.className='rocket-emoji fueling'; status.textContent='🔥 FINAL COUNTDOWN! Engines at maximum power!'; }
      else if(ratio<=0.35){ fill.classList.add('warning'); display.classList.add('warning'); rocket.className='rocket-emoji fueling'; status.textContent='⚡ Fueling intensifies... Almost ready for launch!'; }
      else if(isRunning){ rocket.className='rocket-emoji idle'; status.textContent='⛽ Loading fuel cells... '+Math.round((1-ratio)*100)+'% fueled'; }
    }

    function tick(){if(remaining<=0){finish();return;}remaining--;updateDisplay();}

    function start(){
      if(isRunning)return;
      if(remaining<=0)reset();
      isRunning=true;
      rocket.className='rocket-emoji idle';
      btnStart.querySelector('span').textContent='Pause';
      btnStart.classList.add('is-running');
      if(window.SoundFX)window.SoundFX.playClick();
      status.textContent='🚀 Engines igniting... Countdown started!';
      interval=setInterval(tick,1000);
    }

    function pause(){
      isRunning=false; clearInterval(interval); interval=null;
      rocket.className='rocket-emoji idle';
      btnStart.querySelector('span').textContent='Resume';
      btnStart.classList.remove('is-running');
      if(window.SoundFX)window.SoundFX.playClick();
      status.textContent='⏸️ Launch paused — resume when ready.';
    }

    function reset(){
      isRunning=false; clearInterval(interval); interval=null;
      remaining=initial; updateDisplay();
      rocket.className='rocket-emoji idle';
      btnStart.querySelector('span').textContent='Start';
      btnStart.classList.remove('is-running');
      if(alarmBanner)alarmBanner.style.display='none';
      status.textContent='🚀 Ready on the launch pad. Press Start to begin fueling!';
    }

    function finish(){
      isRunning=false; clearInterval(interval); interval=null;
      remaining=0; display.textContent=fmt(0); fill.style.width='0%';
      for(let i=0;i<FUEL_CELLS;i++){const c=document.getElementById('fuel-'+i);if(c)c.classList.add('lit');}
      rocket.className='rocket-emoji launched';
      btnStart.querySelector('span').textContent='Start';
      btnStart.classList.remove('is-running');
      status.textContent='🎉 BLASTOFF! Rocket has launched!';
      if(window.SoundFX)window.SoundFX.playFanfare();
      if(window.Confetti)window.Confetti.fire({count:150,colors:['#6366f1','#818cf8','#fb923c','#fbbf24']});
      if(alarmBanner)alarmBanner.style.display='flex';
      // Reset rocket position after animation
      setTimeout(()=>{rocket.className='rocket-emoji idle'; rocket.style.opacity='1';},1200);
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
          window.ClassPanel.showToast(`Rocket timer set to ${fmt(s)}!`);
        }
      }
    }

    async function openCustomTime() {
      if (isRunning) pause();
      const cur = fmt(remaining);
      if (window.ClassPanel && window.ClassPanel.prompt) {
        const val = await window.ClassPanel.prompt({
          title: '⏱️ Custom Rocket Timer',
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