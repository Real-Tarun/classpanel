(function () {
      let elapsedSeconds = 0;
      let isRunning = false;
      let timerInterval = null;

      let greenSec = 180;
      let yellowSec = 240;
      let redSec = 300;

      const display = document.getElementById('speech-time');
      const lightGreen = document.getElementById('light-green');
      const lightYellow = document.getElementById('light-yellow');
      const lightRed = document.getElementById('light-red');
      const statusMsg = document.getElementById('status-msg');
      const btnStart = document.getElementById('btn-speech-start');
      const btnReset = document.getElementById('btn-speech-reset');
      const selectPreset = document.getElementById('select-speech-preset');

      function parsePreset() {
        if (selectPreset.value === 'custom') return;
        const parts = selectPreset.value.split(',').map(n => parseInt(n, 10));
        greenSec = parts[0];
        yellowSec = parts[1];
        redSec = parts[2];
      }

      async function promptCustomPacing() {
        if (isRunning) pause();
        const curG = (greenSec / 60).toFixed(1).replace('.0','');
        const curY = (yellowSec / 60).toFixed(1).replace('.0','');
        const curR = (redSec / 60).toFixed(1).replace('.0','');
        let val;
        if (window.ClassPanel && window.ClassPanel.prompt) {
          val = await window.ClassPanel.prompt({
            title: 'Custom Speech Pacing (Minutes)',
            message: 'Enter Green (qualify), Yellow (warning), and Red (stop) minutes separated by commas:',
            defaultValue: `${curG}, ${curY}, ${curR}`,
            placeholder: 'e.g. 2, 3, 5'
          });
        } else {
          val = window.prompt('Enter Green, Yellow, Red minutes separated by commas (e.g. 2, 3, 5):', `${curG}, ${curY}, ${curR}`);
        }
        if (!val) return;
        const nums = val.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n) && n > 0);
        if (nums.length >= 3) {
          greenSec = Math.round(nums[0] * 60);
          yellowSec = Math.round(nums[1] * 60);
          redSec = Math.round(nums[2] * 60);
          const opt = document.getElementById('opt-custom-preset');
          if (opt) {
            opt.textContent = `Custom (${nums[0]}m / ${nums[1]}m / ${nums[2]}m)`;
            opt.value = `${greenSec},${yellowSec},${redSec}`;
          }
          selectPreset.value = opt ? opt.value : 'custom';
          reset();
        }
      }

      const btnCustomPacing = document.getElementById('btn-custom-pacing');
      if (btnCustomPacing) btnCustomPacing.addEventListener('click', promptCustomPacing);

      function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      }

      function updateUI() {
        display.textContent = formatTime(elapsedSeconds);

        lightGreen.classList.remove('active');
        lightYellow.classList.remove('active');
        lightRed.classList.remove('active');

        if (elapsedSeconds >= redSec) {
          lightRed.classList.add('active');
          statusMsg.textContent = "🛑 Red: Time Limit Reached (Wrap Up!)";
          statusMsg.style.color = "#EF4444";
        } else if (elapsedSeconds >= yellowSec) {
          lightYellow.classList.add('active');
          statusMsg.textContent = "⚠️ Yellow: Concluding Remarks";
          statusMsg.style.color = "#F59E0B";
        } else if (elapsedSeconds >= greenSec) {
          lightGreen.classList.add('active');
          statusMsg.textContent = "✅ Green: Target Time Reached";
          statusMsg.style.color = "#10B981";
        } else if (isRunning) {
          statusMsg.textContent = "Speaking...";
          statusMsg.style.color = "var(--text-primary)";
        } else {
          statusMsg.textContent = "Ready to Start";
          statusMsg.style.color = "var(--text-muted)";
        }
      }

      function start() {
        if (isRunning) return;
        isRunning = true;
        btnStart.classList.add('is-running');
        btnStart.innerHTML = `<span>Pause</span>`;
        if (window.SoundFX) window.SoundFX.playClick();

        timerInterval = setInterval(() => {
          elapsedSeconds++;
          if (elapsedSeconds === greenSec) {
            if (window.SoundFX) window.SoundFX.playGentleChime();
          } else if (elapsedSeconds === yellowSec) {
            if (window.SoundFX) window.SoundFX.playBeep();
          } else if (elapsedSeconds === redSec) {
            if (window.SoundFX) window.SoundFX.playSchoolBell();
          }
          updateUI();
        }, 1000);
      }

      function pause() {
        isRunning = false;
        clearInterval(timerInterval);
        btnStart.classList.remove('is-running');
        btnStart.innerHTML = `<span>Resume</span>`;
        if (window.SoundFX) window.SoundFX.playClick();
      }

      function reset() {
        pause();
        elapsedSeconds = 0;
        btnStart.innerHTML = `<span>Start Speech</span>`;
        updateUI();
      }

      btnStart.addEventListener('click', () => {
        if (isRunning) pause();
        else start();
      });

      btnReset.addEventListener('click', reset);

      selectPreset.addEventListener('change', () => {
        if (selectPreset.value === 'custom') {
          promptCustomPacing();
        } else {
          parsePreset();
          reset();
        }
      });

      parsePreset();
      updateUI();
    })();