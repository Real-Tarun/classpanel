(function () {
      let mode = 'breathing'; // 'breathing' or 'liquid'
      let activeRhythm = 'box';
      let totalSeconds = 180;
      let remainingSeconds = 180;
      let isRunning = false;
      let timerInterval = null;
      let breathTimeoutId = null;

      const sensoryTime = document.getElementById('sensory-time');
      const btnStart = document.getElementById('btn-sensory-start');
      const btnReset = document.getElementById('btn-sensory-reset');
      const btnBreathing = document.getElementById('btn-mode-breathing');
      const btnLiquid = document.getElementById('btn-mode-liquid');
      const breathingContainer = document.getElementById('breathing-container');
      const rhythmSelectorBar = document.getElementById('rhythm-selector-bar');
      const circle = document.getElementById('circle');
      const breathingText = document.getElementById('breathing-text');
      const canvas = document.getElementById('liquid-canvas');
      const ctx = canvas.getContext('2d');
      const rhythmButtons = document.querySelectorAll('#rhythm-selector-bar [data-rhythm]');

      // Breathing rhythm step sequences
      const RHYTHMS = {
        box: [
          { text: 'Inhale gently (4s)...', duration: 4, scale: 1.85, bg: 'radial-gradient(circle, #38BDF8, #818CF8)' },
          { text: 'Hold your breath (4s)...', duration: 4, scale: 1.85, bg: 'radial-gradient(circle, #818CF8, #6366F1)' },
          { text: 'Exhale slowly (4s)...', duration: 4, scale: 1.0, bg: 'radial-gradient(circle, #34D399, #059669)' },
          { text: 'Rest and pause (4s)...', duration: 4, scale: 1.0, bg: 'radial-gradient(circle, #6EE7B7, #10B981)' }
        ],
        478: [
          { text: 'Inhale through nose (4s)...', duration: 4, scale: 1.85, bg: 'radial-gradient(circle, #38BDF8, #818CF8)' },
          { text: 'Hold your breath (7s)...', duration: 7, scale: 1.85, bg: 'radial-gradient(circle, #818CF8, #6366F1)' },
          { text: 'Exhale fully (8s)...', duration: 8, scale: 1.0, bg: 'radial-gradient(circle, #34D399, #059669)' }
        ],
        coherence: [
          { text: 'Inhale smoothly (5s)...', duration: 5, scale: 1.85, bg: 'radial-gradient(circle, #38BDF8, #818CF8)' },
          { text: 'Exhale smoothly (5s)...', duration: 5, scale: 1.0, bg: 'radial-gradient(circle, #34D399, #059669)' }
        ]
      };
      let stepIndex = 0;

      function runNextBreathStep() {
        if (!isRunning || mode !== 'breathing') return;
        const steps = RHYTHMS[activeRhythm] || RHYTHMS.box;
        const step = steps[stepIndex];

        circle.style.transition = `transform ${step.duration}s ease-in-out, background ${step.duration}s ease-in-out`;
        breathingText.textContent = step.text;
        circle.style.transform = `scale(${step.scale})`;
        circle.style.background = step.bg;

        stepIndex = (stepIndex + 1) % steps.length;
        breathTimeoutId = setTimeout(runNextBreathStep, step.duration * 1000);
      }

      function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      }

      function renderTime() {
        sensoryTime.textContent = formatTime(remainingSeconds);
      }

      // Liquid droplet animation
      let droplets = [];
      let liquidAnimId = null;

      function initLiquidCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        droplets = [];
      }

      function addDroplet() {
        droplets.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.4),
          y: 20,
          radius: 12 + Math.random() * 8,
          speed: 1.5 + Math.random() * 2,
          color: Math.random() > 0.5 ? '#38BDF8' : '#818CF8'
        });
      }

      function renderLiquid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Progress fill in bottom chamber
        const ratio = 1 - (remainingSeconds / totalSeconds);
        const fillHeight = canvas.height * 0.35 * Math.min(1, Math.max(0, ratio));
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.fillRect(0, canvas.height - fillHeight, canvas.width, fillHeight);

        // Update droplets
        for (let i = droplets.length - 1; i >= 0; i--) {
          const d = droplets[i];
          d.y += d.speed;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
          ctx.fillStyle = d.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = d.color;
          ctx.fill();
          ctx.shadowBlur = 0;

          if (d.y >= canvas.height - fillHeight) {
            droplets.splice(i, 1);
          }
        }

        if (isRunning && Math.random() < 0.05) {
          addDroplet();
        }

        if (mode === 'liquid') {
          liquidAnimId = requestAnimationFrame(renderLiquid);
        }
      }

      const selectAmbient = document.getElementById('select-sensory-ambient');
      const btnPreviewSensory = document.getElementById('btn-preview-sensory-music');

      if (btnPreviewSensory) {
        btnPreviewSensory.addEventListener('click', () => {
          if (selectAmbient.value === 'none') selectAmbient.value = 'calm';
          const isPlaying = window.SoundFX && window.SoundFX.previewMusic ? window.SoundFX.previewMusic(selectAmbient.value, 0.5) : false;
          if (isPlaying) {
            btnPreviewSensory.classList.add('is-playing');
            btnPreviewSensory.innerHTML = '<span>⏹ Stop</span>';
          } else {
            btnPreviewSensory.classList.remove('is-playing');
            btnPreviewSensory.innerHTML = '<span>▶ Preview</span>';
          }
        });
      }

      if (selectAmbient) {
        selectAmbient.addEventListener('change', () => {
          if (btnPreviewSensory) {
            btnPreviewSensory.classList.remove('is-playing');
            btnPreviewSensory.innerHTML = '<span>▶ Preview</span>';
          }
          if (isRunning) {
            if (selectAmbient.value !== 'none' && window.SoundFX && window.SoundFX.startMusic) {
              window.SoundFX.startMusic(selectAmbient.value, 0.5);
            } else if (window.SoundFX && window.SoundFX.stopMusic) {
              window.SoundFX.stopMusic();
            }
          }
        });
      }

      function start() {
        if (isRunning) return;
        isRunning = true;
        btnStart.classList.add('is-running');
        btnStart.innerHTML = `<span>Pause Calm</span>`;
        if (btnPreviewSensory) {
          btnPreviewSensory.classList.remove('is-playing');
          btnPreviewSensory.innerHTML = '<span>▶ Preview</span>';
        }

        // Start ambient music loop
        if (selectAmbient && selectAmbient.value !== 'none' && window.SoundFX && window.SoundFX.startMusic) {
          window.SoundFX.startMusic(selectAmbient.value, 0.5);
        } else if (window.SoundFX && window.SoundFX.playGentleChime) {
          window.SoundFX.playGentleChime();
        }

        if (mode === 'breathing') {
          runNextBreathStep();
        } else {
          initLiquidCanvas();
          renderLiquid();
        }

        timerInterval = setInterval(() => {
          if (remainingSeconds > 0) {
            remainingSeconds--;
            renderTime();
          } else {
            finish();
          }
        }, 1000);
      }

      function pause() {
        isRunning = false;
        clearInterval(timerInterval);
        clearTimeout(breathTimeoutId);
        if (liquidAnimId) cancelAnimationFrame(liquidAnimId);
        btnStart.classList.remove('is-running');
        btnStart.innerHTML = `<span>Resume</span>`;
        if (window.SoundFX && window.SoundFX.pauseMusic) {
          window.SoundFX.pauseMusic();
        }
      }

      function reset() {
        pause();
        if (btnPreviewSensory) {
          btnPreviewSensory.classList.remove('is-playing');
          btnPreviewSensory.innerHTML = '<span>▶ Preview</span>';
        }
        if (window.SoundFX && window.SoundFX.stopMusic) {
          window.SoundFX.stopMusic();
        }
        remainingSeconds = totalSeconds;
        renderTime();
        stepIndex = 0;
        circle.style.transform = 'scale(1)';
        breathingText.textContent = 'Inhale gently...';
        btnStart.innerHTML = `<span>Start Calm Timer</span>`;
        if (mode === 'liquid') {
          initLiquidCanvas();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      function finish() {
        pause();
        if (window.SoundFX && window.SoundFX.stopMusic) {
          window.SoundFX.stopMusic();
        }
        // Peaceful ending chime for meditation
        if (window.SoundFX && window.SoundFX.playGentleChime) {
          window.SoundFX.playGentleChime();
        }
        if (window.ClassPanel) window.ClassPanel.showToast('Mindfulness session complete 🌿');
      }

      btnStart.addEventListener('click', () => {
        if (isRunning) pause();
        else start();
      });

      btnReset.addEventListener('click', reset);

      const sensoryChips = document.querySelectorAll('#sensory-presets-group .preset-chip');
      const btnCustomSensory = document.getElementById('btn-custom-sensory');

      function setActiveSensoryPreset(secs, isCustom = false) {
        sensoryChips.forEach(c => {
          c.classList.remove('active');
          c.removeAttribute('style');
        });
        if (isCustom) {
          if (btnCustomSensory) {
            btnCustomSensory.classList.add('active');
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            btnCustomSensory.textContent = s > 0 ? `Custom (${m}m ${s}s)` : `Custom (${m}m)`;
          }
        } else {
          if (btnCustomSensory) btnCustomSensory.textContent = '⏱️ Custom Time';
          const match = Array.from(sensoryChips).find(c => parseInt(c.getAttribute('data-time'), 10) === secs);
          if (match) match.classList.add('active');
        }
      }

      document.querySelectorAll('#sensory-presets-group [data-time]').forEach(chip => {
        chip.addEventListener('click', () => {
          totalSeconds = parseInt(chip.getAttribute('data-time'), 10);
          setActiveSensoryPreset(totalSeconds, false);
          reset();
        });
      });

      function parseAndSetSensoryDuration(input) {
        if (!input) return;
        const str = String(input).trim().toLowerCase();
        let secs = 0;
        if (str.includes(':')) {
          const parts = str.split(':').map(p => parseInt(p.trim(), 10) || 0);
          if (parts.length === 2) {
            secs = parts[0] * 60 + parts[1];
          }
        } else if (str.endsWith('s')) {
          secs = parseInt(str, 10);
        } else {
          const parsed = parseFloat(str);
          if (!isNaN(parsed)) {
            secs = Math.round(parsed * 60);
          }
        }

        if (!isNaN(secs) && secs >= 10 && secs <= 3600) {
          totalSeconds = secs;
          setActiveSensoryPreset(totalSeconds, true);
          reset();
          const m = Math.floor(secs / 60);
          const s = secs % 60;
          const label = m > 0 ? (s > 0 ? `${m}m ${s}s` : `${m} minutes`) : `${s} seconds`;
          if (window.ClassPanel) window.ClassPanel.showToast(`Calm timer set to ${label}!`);
        } else {
          if (window.ClassPanel) window.ClassPanel.showToast('Please enter a valid duration (e.g. 4, 2.5, or 03:00).');
        }
      }

      async function openCustomSensoryModal() {
        if (window.ClassPanel && window.ClassPanel.prompt) {
          const currentMins = (totalSeconds / 60).toFixed(1).replace(/\.0$/, '');
          const res = await window.ClassPanel.prompt({
            title: 'Set Custom Calm Time',
            label: 'Enter duration in minutes (e.g. 4, 7.5) or MM:SS (e.g. 02:30):',
            defaultValue: currentMins,
            placeholder: 'e.g. 4 or 02:30',
            confirmText: 'Set Time'
          });
          if (res !== null && res !== undefined) {
            parseAndSetSensoryDuration(res);
          }
        } else {
          const userMins = prompt('Enter calm timer duration in minutes (e.g. 4, 7, 15) or MM:SS:', Math.round(totalSeconds / 60));
          if (userMins) parseAndSetSensoryDuration(userMins);
        }
      }

      if (btnCustomSensory) {
        btnCustomSensory.addEventListener('click', openCustomSensoryModal);
      }

      if (sensoryTime) {
        sensoryTime.addEventListener('click', openCustomSensoryModal);
      }

      rhythmButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          rhythmButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeRhythm = btn.dataset.rhythm;
          stepIndex = 0;
          reset();
          if (window.SoundFX) window.SoundFX.playClick();
        });
      });

      btnBreathing.addEventListener('click', () => {
        if (mode === 'breathing') return;
        mode = 'breathing';
        btnBreathing.style.background = 'var(--primary)';
        btnBreathing.style.color = '#FFF';
        btnLiquid.style.background = 'transparent';
        btnLiquid.style.color = 'inherit';
        breathingContainer.style.display = 'flex';
        rhythmSelectorBar.style.display = 'flex';
        canvas.style.display = 'none';
        reset();
      });

      btnLiquid.addEventListener('click', () => {
        if (mode === 'liquid') return;
        mode = 'liquid';
        btnLiquid.style.background = 'var(--primary)';
        btnLiquid.style.color = '#FFF';
        btnBreathing.style.background = 'transparent';
        btnBreathing.style.color = 'inherit';
        breathingContainer.style.display = 'none';
        rhythmSelectorBar.style.display = 'none';
        canvas.style.display = 'block';
        initLiquidCanvas();
        reset();
      });

      window.addEventListener('resize', () => {
        if (mode === 'liquid') initLiquidCanvas();
      });

      renderTime();
    })();