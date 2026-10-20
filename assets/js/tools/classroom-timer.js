(function () {
      let mode = 'countdown'; // 'countdown' or 'stopwatch'
      let initialSeconds = 300;
      let remainingSeconds = 300;
      let stopwatchSeconds = 0;
      let isRunning = false;
      let timerInterval = null;

      const display = document.getElementById('display-time');
      const timeEditHint = document.getElementById('time-edit-hint');
      const inlineEditor = document.getElementById('inline-time-editor');
      const editHh = document.getElementById('edit-hh');
      const editMm = document.getElementById('edit-mm');
      const editSs = document.getElementById('edit-ss');
      const btnSaveInline = document.getElementById('btn-save-inline');
      const btnCancelInline = document.getElementById('btn-cancel-inline');

      const progressFill = document.getElementById('progress-fill');
      const progressTrack = document.getElementById('progress-track');
      const btnStart = document.getElementById('btn-start');
      const btnReset = document.getElementById('btn-reset');
      const btnCountdown = document.getElementById('btn-mode-countdown');
      const btnPomodoro = document.getElementById('btn-mode-pomodoro');
      const btnStopwatch = document.getElementById('btn-mode-stopwatch');
      const modeSubtitle = document.getElementById('timer-mode-subtitle');
      const presetContainer = document.getElementById('countdown-presets');
      const presetButtons = document.querySelectorAll('#countdown-presets [data-seconds]');
      const timeAdjustButtons = document.getElementById('time-adjust-buttons');

      const pomodoroBanner = document.getElementById('pomodoro-banner');
      const pomodoroPhaseIcon = document.getElementById('pomodoro-phase-icon');
      const pomodoroPhaseText = document.getElementById('pomodoro-phase-text');
      const pomodoroCycleText = document.getElementById('pomodoro-cycle-text');

      const selectAmbient = document.getElementById('select-ambient-track');
      const btnPreviewMusic = document.getElementById('btn-preview-music');
      const btnToggleAlarmMode = document.getElementById('btn-toggle-alarm-mode');
      const btnTestAlarm = document.getElementById('btn-test-alarm');
      const alarmBanner = document.getElementById('alarm-banner');
      const btnStopAlarm = document.getElementById('btn-stop-alarm');

      let pomodoroPhase = 'work'; // 'work' | 'break'
      let pomodoroCycle = 1;

      function updatePomodoroUI() {
        if (mode !== 'pomodoro') {
          pomodoroBanner.style.display = 'none';
          return;
        }
        pomodoroBanner.style.display = 'inline-flex';
        if (pomodoroPhase === 'work') {
          pomodoroPhaseIcon.textContent = '🍅';
          pomodoroPhaseText.textContent = 'Focus Session (25:00)';
          pomodoroBanner.style.borderColor = 'var(--primary)';
        } else {
          pomodoroPhaseIcon.textContent = '?';
          pomodoroPhaseText.textContent = pomodoroCycle === 4 ? 'Long Rest Break (15:00)' : 'Short Rest Break (05:00)';
          pomodoroBanner.style.borderColor = 'var(--accent-emerald)';
        }
        pomodoroCycleText.textContent = `Cycle ${pomodoroCycle} of 4`;
      }

      function formatTime(totalSecs) {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        const ss = String(s).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
      }

      function updateDisplay() {
        if (mode === 'countdown' || mode === 'pomodoro') {
          display.textContent = formatTime(remainingSeconds);
          const ratio = initialSeconds > 0 ? (remainingSeconds / initialSeconds) : 0;
          progressFill.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;

          // Color progress
          progressFill.classList.remove('warning', 'danger');
          if (ratio <= 0.15) {
            progressFill.classList.add('danger');
          } else if (ratio <= 0.35) {
            progressFill.classList.add('warning');
          }
        } else {
          display.textContent = formatTime(stopwatchSeconds);
          progressFill.style.width = '100%';
          progressFill.classList.remove('warning', 'danger');
        }
      }

      function updateActivePresetChip(secs) {
        let matched = false;
        presetButtons.forEach(btn => {
          if (parseInt(btn.getAttribute('data-seconds'), 10) === secs) {
            btn.classList.add('active');
            matched = true;
          } else {
            btn.classList.remove('active');
          }
        });
        const btnCustom = document.getElementById('btn-custom-time');
        if (btnCustom) {
          if (!matched) btnCustom.classList.add('active');
          else btnCustom.classList.remove('active');
        }
      }

      function openInlineEditor() {
        if (mode === 'stopwatch') return;
        pauseTimer();

        const cur = remainingSeconds > 0 ? remainingSeconds : initialSeconds;
        const h = Math.floor(cur / 3600);
        const m = Math.floor((cur % 3600) / 60);
        const s = cur % 60;

        editHh.value = String(h).padStart(2, '0');
        editMm.value = String(m).padStart(2, '0');
        editSs.value = String(s).padStart(2, '0');

        display.style.display = 'none';
        timeEditHint.style.display = 'none';
        inlineEditor.style.display = 'flex';

        // Select minutes field for quick typing
        editMm.focus();
        editMm.select();
      }

      function closeInlineEditor(applyChanges) {
        if (applyChanges) {
          let h = parseInt(editHh.value, 10) || 0;
          let m = parseInt(editMm.value, 10) || 0;
          let s = parseInt(editSs.value, 10) || 0;

          h = Math.max(0, Math.min(99, h));
          m = Math.max(0, Math.min(59, m));
          s = Math.max(0, Math.min(59, s));

          const total = h * 3600 + m * 60 + s;
          if (total <= 0) {
            if (window.ClassPanel) window.ClassPanel.showToast('Please enter a time greater than 0 seconds.');
            return;
          }

          initialSeconds = total;
          remainingSeconds = total;
          updateActivePresetChip(total);
          resetTimer();
          if (window.ClassPanel) window.ClassPanel.showToast(`Countdown set to ${formatTime(total)}!`);
        }

        inlineEditor.style.display = 'none';
        display.style.display = 'inline-block';
        timeEditHint.style.display = 'inline-flex';
      }

      // Time Click / Interaction Listeners
      const btnCustomTimer = document.getElementById('btn-custom-time');
      if (btnCustomTimer) btnCustomTimer.addEventListener('click', openInlineEditor);
      display.addEventListener('click', openInlineEditor);
      timeEditHint.addEventListener('click', openInlineEditor);
      display.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openInlineEditor();
        }
      });

      btnSaveInline.addEventListener('click', () => closeInlineEditor(true));
      btnCancelInline.addEventListener('click', () => closeInlineEditor(false));

      [editHh, editMm, editSs].forEach(input => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            closeInlineEditor(true);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            closeInlineEditor(false);
          }
        });
      });

      // Alarm Loop Mode ('loop' default or 'ting')
      let alarmLoopMode = localStorage.getItem('classpanel_alarm_loop_mode') || 'loop'; // 'loop' (default) or 'ting'

      function updateAlarmModeUI() {
        if (!btnToggleAlarmMode) return;
        if (alarmLoopMode === 'ting') {
          btnToggleAlarmMode.textContent = '🔔 Short Ting (2-3s)';
          btnToggleAlarmMode.classList.remove('active');
        } else {
          btnToggleAlarmMode.textContent = '🔁 Loop Alarm (Default)';
          btnToggleAlarmMode.classList.add('active');
        }
      }
      updateAlarmModeUI();

      if (btnToggleAlarmMode) {
        btnToggleAlarmMode.addEventListener('click', () => {
          alarmLoopMode = alarmLoopMode === 'loop' ? 'ting' : 'loop';
          if (window.SoundFX && window.SoundFX.setAlarmLoopMode) {
            window.SoundFX.setAlarmLoopMode(alarmLoopMode);
          } else {
            localStorage.setItem('classpanel_alarm_loop_mode', alarmLoopMode);
          }
          updateAlarmModeUI();
          if (window.ClassPanel) {
            window.ClassPanel.showToast(alarmLoopMode === 'loop' ? 'End alarm set to Continuous Loop' : 'End alarm set to Short 2-3s Ting');
          }
        });
      }

      // Music Preview button
      if (btnPreviewMusic) {
        btnPreviewMusic.addEventListener('click', () => {
          if (selectAmbient.value === 'none') {
            selectAmbient.value = 'calm';
          }
          const isPlaying = window.SoundFX && window.SoundFX.previewMusic ? window.SoundFX.previewMusic(selectAmbient.value, 0.6) : false;
          if (isPlaying) {
            btnPreviewMusic.classList.add('is-playing');
            btnPreviewMusic.innerHTML = '<span>⏹ Stop</span>';
          } else {
            btnPreviewMusic.classList.remove('is-playing');
            btnPreviewMusic.innerHTML = '<span>▶ Preview</span>';
          }
        });
      }

      // Alarm Test button (Plays user's digital alarm sound)
      if (btnTestAlarm) {
        btnTestAlarm.addEventListener('click', () => {
          if (window.SoundFX && window.SoundFX.isAlarmRinging) {
            dismissAlarm();
            return;
          }
          if (window.SoundFX && window.SoundFX.playCompletionAlarm) {
            window.SoundFX.playCompletionAlarm(alarmLoopMode);
            btnTestAlarm.classList.add('is-playing');
            btnTestAlarm.innerHTML = '<span>🛑 Stop</span>';
            if (alarmLoopMode === 'ting') {
              setTimeout(() => {
                btnTestAlarm.classList.remove('is-playing');
                btnTestAlarm.innerHTML = '<span>🔊 Test Alarm</span>';
              }, 2600);
            }
          }
        });
      }

      // Ambient Music track change
      if (selectAmbient) {
        selectAmbient.addEventListener('change', () => {
          if (btnPreviewMusic) {
            btnPreviewMusic.classList.remove('is-playing');
            btnPreviewMusic.innerHTML = '<span>▶ Preview</span>';
          }
          if (isRunning) {
            if (selectAmbient.value !== 'none' && window.SoundFX && window.SoundFX.startMusic) {
              window.SoundFX.startMusic(selectAmbient.value, 0.6);
            } else if (window.SoundFX && window.SoundFX.stopMusic) {
              window.SoundFX.stopMusic();
            }
          }
        });
      }

      function showAlarmBanner() {
        if (alarmBanner) alarmBanner.style.display = 'inline-flex';
      }

      function dismissAlarm() {
        if (window.SoundFX && window.SoundFX.stopAlarm) {
          window.SoundFX.stopAlarm();
        }
        if (alarmBanner) alarmBanner.style.display = 'none';
        if (btnTestAlarm) {
          btnTestAlarm.classList.remove('is-playing');
          btnTestAlarm.innerHTML = '<span>🔊 Test Alarm</span>';
        }
      }

      if (btnStopAlarm) btnStopAlarm.addEventListener('click', dismissAlarm);
      if (alarmBanner) alarmBanner.addEventListener('click', dismissAlarm);

      window.addEventListener('classpanel-alarm-stopped', () => {
        if (btnTestAlarm) {
          btnTestAlarm.classList.remove('is-playing');
          btnTestAlarm.innerHTML = '<span>🔊 Test Alarm</span>';
        }
        if (alarmBanner) alarmBanner.style.display = 'none';
      });

      // Keyboard & Display Click dismiss for ringing alarm
      window.addEventListener('keydown', (e) => {
        if (window.SoundFX && window.SoundFX.isAlarmRinging) {
          if (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter') {
            e.preventDefault();
            dismissAlarm();
          }
        }
      });
      display.addEventListener('click', () => {
        if (window.SoundFX && window.SoundFX.isAlarmRinging) {
          dismissAlarm();
        }
      });

      function startTimer() {
        if (isRunning) return;
        dismissAlarm();
        if (btnPreviewMusic) {
          btnPreviewMusic.classList.remove('is-playing');
          btnPreviewMusic.innerHTML = '<span>▶ Preview</span>';
        }
        isRunning = true;
        btnStart.classList.add('is-running');
        btnStart.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
          <span>Pause</span>
        `;
        if (window.SoundFX) {
          if (window.SoundFX.playButtonClick) window.SoundFX.playButtonClick();
          else window.SoundFX.playClick();
        }

        // Loop background music during active timer
        if (selectAmbient && selectAmbient.value !== 'none' && window.SoundFX && window.SoundFX.startMusic) {
          window.SoundFX.startMusic(selectAmbient.value, 0.6);
        }

        timerInterval = setInterval(() => {
          if (mode === 'countdown' || mode === 'pomodoro') {
            if (remainingSeconds > 0) {
              remainingSeconds--;
              updateDisplay();
              if (remainingSeconds === 0) {
                completeCountdown();
              }
            }
          } else {
            stopwatchSeconds++;
            updateDisplay();
          }
        }, 1000);
      }

      function pauseTimer() {
        if (!isRunning) return;
        isRunning = false;
        clearInterval(timerInterval);
        btnStart.classList.remove('is-running');
        btnStart.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span>Resume</span>
        `;
        if (window.SoundFX) {
          if (window.SoundFX.playButtonClick) window.SoundFX.playButtonClick();
          else window.SoundFX.playClick();

          // Pause music while timer is paused
          if (window.SoundFX.pauseMusic) window.SoundFX.pauseMusic();
          else if (window.SoundFX.stopAmbient) window.SoundFX.stopAmbient();
        }
      }

      function resetTimer() {
        pauseTimer();
        dismissAlarm();
        btnStart.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span>Start</span>
        `;
        if (mode === 'countdown' || mode === 'pomodoro') {
          remainingSeconds = initialSeconds;
        } else {
          stopwatchSeconds = 0;
        }
        updateDisplay();
        if (window.SoundFX) {
          if (window.SoundFX.playButtonClick) window.SoundFX.playButtonClick();
          else window.SoundFX.playClick();

          if (window.SoundFX.stopMusic) window.SoundFX.stopMusic();
          else if (window.SoundFX.stopAmbient) window.SoundFX.stopAmbient();
        }
      }

      function completeCountdown() {
        pauseTimer();
        if (window.SoundFX) {
          if (window.SoundFX.stopMusic) window.SoundFX.stopMusic();
          else if (window.SoundFX.stopAmbient) window.SoundFX.stopAmbient();

          // Continuous loop by default, or short ting if user selected
          if (window.SoundFX.playCompletionAlarm) {
            window.SoundFX.playCompletionAlarm(alarmLoopMode);
          } else {
            window.SoundFX.playAlarm(soundSelect.value);
          }
        }

        if (alarmLoopMode === 'loop') {
          showAlarmBanner();
        }

        if (window.Confetti) {
          window.Confetti.fire({ count: 140 });
        }

        if (mode === 'pomodoro') {
          if (pomodoroPhase === 'work') {
            const isLong = pomodoroCycle === 4;
            pomodoroPhase = 'break';
            initialSeconds = isLong ? 15 * 60 : 5 * 60;
            remainingSeconds = initialSeconds;
            updatePomodoroUI();
            updateDisplay();
            if (window.ClassPanel) {
              window.ClassPanel.showToast(isLong ? "🌟 Great work! Enjoy your 15-min long break." : "☕ Work session complete! Take a 5-minute break.");
            }
          } else {
            pomodoroPhase = 'work';
            if (pomodoroCycle === 4) pomodoroCycle = 1;
            else pomodoroCycle++;
            initialSeconds = 25 * 60;
            remainingSeconds = initialSeconds;
            updatePomodoroUI();
            updateDisplay();
            if (window.ClassPanel) {
              window.ClassPanel.showToast("🍅 Break over! Ready for Focus Session #" + pomodoroCycle);
            }
          }
        } else {
          if (window.ClassPanel) {
            window.ClassPanel.showToast("? Time's up!");
          }
        }
      }

      // Button listeners
      btnStart.addEventListener('click', () => {
        if (isRunning) pauseTimer();
        else startTimer();
      });

      btnReset.addEventListener('click', resetTimer);

      // Adjustments (Hours + Minutes)
      document.getElementById('btn-add-1h').addEventListener('click', () => {
        if (mode === 'countdown' || mode === 'pomodoro') {
          initialSeconds += 3600;
          remainingSeconds += 3600;
          updateActivePresetChip(initialSeconds);
          updateDisplay();
        }
      });
      document.getElementById('btn-add-5m').addEventListener('click', () => {
        if (mode === 'countdown' || mode === 'pomodoro') {
          initialSeconds += 300;
          remainingSeconds += 300;
          updateActivePresetChip(initialSeconds);
          updateDisplay();
        }
      });
      document.getElementById('btn-add-1m').addEventListener('click', () => {
        if (mode === 'countdown' || mode === 'pomodoro') {
          initialSeconds += 60;
          remainingSeconds += 60;
          updateActivePresetChip(initialSeconds);
          updateDisplay();
        }
      });
      document.getElementById('btn-sub-1m').addEventListener('click', () => {
        if ((mode === 'countdown' || mode === 'pomodoro') && remainingSeconds > 60) {
          initialSeconds = Math.max(60, initialSeconds - 60);
          remainingSeconds = Math.max(1, remainingSeconds - 60);
          updateActivePresetChip(initialSeconds);
          updateDisplay();
        }
      });

      // Presets
      presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const secs = parseInt(btn.getAttribute('data-seconds'), 10);
          initialSeconds = secs;
          remainingSeconds = secs;
          updateActivePresetChip(secs);
          resetTimer();
        });
      });

      // Mode toggles
      btnCountdown.addEventListener('click', () => {
        if (mode === 'countdown') return;
        mode = 'countdown';
        btnCountdown.style.background = 'var(--primary)';
        btnCountdown.style.color = '#FFF';
        btnPomodoro.style.background = 'transparent';
        btnPomodoro.style.color = 'inherit';
        btnStopwatch.style.background = 'transparent';
        btnStopwatch.style.color = 'inherit';
        modeSubtitle.textContent = 'Countdown Mode • Designed for Projectors, Smartboards & Study Sprints';
        progressTrack.style.display = 'block';
        presetContainer.style.display = 'flex';
        timeEditHint.style.display = 'inline-flex';
        display.style.cursor = 'pointer';
        display.title = 'Click to edit time directly';
        if (timeAdjustButtons) timeAdjustButtons.style.display = 'inline-flex';
        updatePomodoroUI();
        resetTimer();
      });

      btnPomodoro.addEventListener('click', () => {
        if (mode === 'pomodoro') return;
        mode = 'pomodoro';
        btnPomodoro.style.background = 'var(--primary)';
        btnPomodoro.style.color = '#FFF';
        btnCountdown.style.background = 'transparent';
        btnCountdown.style.color = 'inherit';
        btnStopwatch.style.background = 'transparent';
        btnStopwatch.style.color = 'inherit';
        modeSubtitle.textContent = 'Pomodoro Study Mode • 25m Focus / 5m Rest Cycles';
        progressTrack.style.display = 'block';
        presetContainer.style.display = 'none';
        timeEditHint.style.display = 'inline-flex';
        display.style.cursor = 'pointer';
        display.title = 'Click to edit time directly';
        if (timeAdjustButtons) timeAdjustButtons.style.display = 'inline-flex';

        pomodoroPhase = 'work';
        pomodoroCycle = 1;
        initialSeconds = 25 * 60;
        remainingSeconds = 25 * 60;
        updatePomodoroUI();
        resetTimer();
      });

      btnStopwatch.addEventListener('click', () => {
        if (mode === 'stopwatch') return;
        mode = 'stopwatch';
        closeInlineEditor(false);
        btnStopwatch.style.background = 'var(--primary)';
        btnStopwatch.style.color = '#FFF';
        btnCountdown.style.background = 'transparent';
        btnCountdown.style.color = 'inherit';
        btnPomodoro.style.background = 'transparent';
        btnPomodoro.style.color = 'inherit';
        modeSubtitle.textContent = 'Stopwatch Mode • Track elapsed time';
        progressTrack.style.display = 'none';
        presetContainer.style.display = 'none';
        timeEditHint.style.display = 'none';
        display.style.cursor = 'default';
        display.title = '';
        if (timeAdjustButtons) timeAdjustButtons.style.display = 'none';
        updatePomodoroUI();
        resetTimer();
      });

      // Keyboard shortcuts: Space to toggle, R to reset
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
          e.preventDefault();
          btnStart.click();
        } else if (e.code === 'KeyR') {
          btnReset.click();
        }
      });

      updateDisplay();
    })();