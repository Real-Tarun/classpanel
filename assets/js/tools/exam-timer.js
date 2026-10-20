(function () {
      let examDuration = 3600; // 60 min
      let readingDuration = 0;
      let state = 'idle'; // 'idle', 'reading', 'writing', 'ended'
      let currentRemaining = 3600;
      let interval = null;

      const wallClock = document.getElementById('exam-wall-clock');
      const dateStr = document.getElementById('exam-date-str');
      const countdown = document.getElementById('exam-countdown');
      const banner = document.getElementById('exam-status-banner');
      const progressFill = document.getElementById('exam-progress-fill');
      const btnStart = document.getElementById('btn-exam-start');
      const btnReset = document.getElementById('btn-exam-reset');
      const selectReading = document.getElementById('select-reading-time');
      const endTimeEstimate = document.getElementById('end-time-estimate');
      const countdownLabel = document.getElementById('countdown-label');

      // Live wall clock
      function updateWallClock() {
        const now = new Date();
        wallClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        dateStr.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
      setInterval(updateWallClock, 1000);
      updateWallClock();

      function formatTime(s) {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      }

      function updateEndTimeEstimate() {
        const now = new Date();
        const totalRemaining = currentRemaining + (state === 'reading' ? examDuration : 0);
        const end = new Date(now.getTime() + totalRemaining * 1000);
        endTimeEstimate.textContent = `Scheduled End: ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      function renderCountdown() {
        countdown.textContent = formatTime(currentRemaining);
        const total = state === 'reading' ? readingDuration : examDuration;
        const ratio = total > 0 ? (currentRemaining / total) : 0;
        progressFill.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;

        if (state === 'writing') {
          if (currentRemaining <= 300) {
            banner.className = 'status-banner status-ended';
            banner.textContent = '⚠️ 5 MINUTES REMAINING — CHECK WORK';
          } else if (currentRemaining <= 900) {
            banner.className = 'status-banner status-reading';
            banner.textContent = '15 MINUTES REMAINING';
          }
        }
      }

      function start() {
        if (state === 'idle') {
          readingDuration = parseInt(selectReading.value, 10);
          if (readingDuration > 0) {
            state = 'reading';
            currentRemaining = readingDuration;
            countdownLabel.textContent = 'Reading Period Remaining';
            banner.className = 'status-banner status-reading';
            banner.textContent = 'READING TIME ONLY • DO NOT OPEN TEST OR WRITE';
          } else {
            state = 'writing';
            currentRemaining = examDuration;
            countdownLabel.textContent = 'Exam Time Remaining';
            banner.className = 'status-banner status-exam';
            banner.textContent = 'EXAM IN PROGRESS • SILENCE REQUIRED';
          }
        }

        btnStart.classList.add('is-running');
        btnStart.innerHTML = `<span>Pause</span>`;
        if (window.SoundFX) window.SoundFX.playClick();
        updateEndTimeEstimate();

        interval = setInterval(() => {
          if (currentRemaining > 0) {
            currentRemaining--;
            renderCountdown();
          } else {
            if (state === 'reading') {
              // Transition from reading to writing
              state = 'writing';
              currentRemaining = examDuration;
              countdownLabel.textContent = 'Exam Time Remaining';
              banner.className = 'status-banner status-exam';
              banner.textContent = 'WRITING COMMENCES • YOU MAY BEGIN';
              if (window.SoundFX) window.SoundFX.playGentleChime();
              updateEndTimeEstimate();
              renderCountdown();
            } else {
              // Exam ended
              state = 'ended';
              clearInterval(interval);
              banner.className = 'status-banner status-ended';
              banner.textContent = '🛑 EXAM CONCLUDED • CEASE WRITING IMMEDIATELY (Click to Stop Alarm)';
              if (window.SoundFX && window.SoundFX.playCompletionAlarm) {
                window.SoundFX.playCompletionAlarm();
              } else if (window.SoundFX) {
                window.SoundFX.playSchoolBell();
              }
              btnStart.innerHTML = `<span>Completed</span>`;
            }
          }
        }, 1000);
      }

      function pause() {
        clearInterval(interval);
        interval = null;
        btnStart.classList.remove('is-running');
        btnStart.innerHTML = `<span>Resume</span>`;
        if (window.SoundFX) window.SoundFX.playClick();
      }

      function reset() {
        pause();
        if (window.SoundFX && window.SoundFX.stopAlarm) {
          window.SoundFX.stopAlarm();
        }
        state = 'idle';
        currentRemaining = examDuration;
        countdownLabel.textContent = 'Time Remaining';
        banner.className = 'status-banner status-exam';
        banner.textContent = 'EXAM READY • CLICK START';
        btnStart.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Start Exam</span>
        `;
        renderCountdown();
        updateEndTimeEstimate();
      }

      btnStart.addEventListener('click', () => {
        if (interval) pause();
        else start();
      });

      btnReset.addEventListener('click', reset);

      const presetChips = document.querySelectorAll('#exam-presets-group .preset-chip');
      const btnCustomTime = document.getElementById('btn-custom-time');
      const customModal = document.getElementById('modal-custom-time');
      const inputCustomHours = document.getElementById('input-custom-hours');
      const inputCustomMinutes = document.getElementById('input-custom-minutes');
      const btnSaveCustomModal = document.getElementById('btn-save-custom-modal');
      const btnCancelCustomModal = document.getElementById('btn-cancel-custom-modal');
      const btnCloseCustomModal = document.getElementById('btn-close-custom-modal');
      const countdownPanel = document.getElementById('exam-countdown-panel');

      function setActivePreset(durationSeconds, isCustom = false) {
        presetChips.forEach(chip => {
          chip.classList.remove('active');
          chip.removeAttribute('style'); // Clear any legacy inline styles
        });

        if (isCustom) {
          btnCustomTime.classList.add('active');
          const h = Math.floor(durationSeconds / 3600);
          const m = Math.floor((durationSeconds % 3600) / 60);
          let label = 'Custom';
          if (h > 0 && m > 0) label = `Custom (${h}h ${m}m)`;
          else if (h > 0) label = `Custom (${h}h)`;
          else label = `Custom (${m}m)`;
          btnCustomTime.textContent = label;
        } else {
          btnCustomTime.textContent = '⏱️ Custom Duration';
          const match = Array.from(presetChips).find(c => {
            const timeAttr = c.getAttribute('data-time');
            const minsAttr = c.getAttribute('data-mins');
            const secs = timeAttr ? parseInt(timeAttr, 10) : (minsAttr ? parseInt(minsAttr, 10) * 60 : null);
            return secs === durationSeconds;
          });
          if (match) {
            match.classList.add('active');
          }
        }
      }

      function openCustomModal() {
        if (state === 'writing' || state === 'reading') {
          pause();
        }
        const h = Math.floor(examDuration / 3600);
        const m = Math.floor((examDuration % 3600) / 60);
        inputCustomHours.value = h;
        inputCustomMinutes.value = m;
        customModal.style.display = 'flex';
        customModal.classList.add('is-open');
        inputCustomMinutes.focus();
        inputCustomMinutes.select();
      }

      function closeCustomModal() {
        customModal.classList.remove('is-open');
        customModal.style.display = 'none';
      }

      function applyCustomDuration() {
        const h = Math.max(0, Math.min(12, parseInt(inputCustomHours.value, 10) || 0));
        const m = Math.max(0, Math.min(59, parseInt(inputCustomMinutes.value, 10) || 0));
        const total = h * 3600 + m * 60;
        if (total <= 0) {
          if (window.ClassPanel) window.ClassPanel.showToast('Please enter an exam duration greater than 0 minutes.');
          return;
        }

        examDuration = total;
        setActivePreset(total, true);
        reset();
        closeCustomModal();
        if (window.ClassPanel) window.ClassPanel.showToast(`Exam duration set to ${formatTime(total)}!`);
      }

      btnCustomTime.addEventListener('click', openCustomModal);
      if (countdownPanel) countdownPanel.addEventListener('click', openCustomModal);
      btnCancelCustomModal.addEventListener('click', closeCustomModal);
      btnCloseCustomModal.addEventListener('click', closeCustomModal);
      btnSaveCustomModal.addEventListener('click', applyCustomDuration);

      if (selectReading) {
        selectReading.addEventListener('change', () => {
          if (state === 'idle') {
            readingDuration = parseInt(selectReading.value, 10);
            updateEndTimeEstimate();
          }
        });
      }

      // Quick duration buttons in modal
      document.querySelectorAll('.modal-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          inputCustomHours.value = btn.getAttribute('data-h');
          inputCustomMinutes.value = btn.getAttribute('data-m');
        });
      });

      // Enter and Escape inside custom modal
      [inputCustomHours, inputCustomMinutes].forEach(inp => {
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            applyCustomDuration();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            closeCustomModal();
          }
        });
      });

      // Preset click listeners
      document.querySelectorAll('#exam-presets-group .preset-chip').forEach(chip => {
        if (chip === btnCustomTime) return;
        chip.addEventListener('click', () => {
          const timeAttr = chip.getAttribute('data-time');
          const minsAttr = chip.getAttribute('data-mins');
          const secs = timeAttr ? parseInt(timeAttr, 10) : (minsAttr ? parseInt(minsAttr, 10) * 60 : null);
          if (secs) {
            examDuration = secs;
            setActivePreset(secs, false);
            reset();
          }
        });
      });

      // Close modal when clicking backdrop
      customModal.addEventListener('click', (e) => {
        if (e.target === customModal) closeCustomModal();
      });

      banner.addEventListener('click', () => {
        if (state === 'ended' && window.SoundFX && window.SoundFX.stopAlarm) {
          window.SoundFX.stopAlarm();
          banner.textContent = '🛑 EXAM CONCLUDED • CEASE WRITING IMMEDIATELY';
        }
      });

      // Global keyboard shortcuts: Space to toggle, R to reset
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
        if (state === 'ended') {
          if (window.SoundFX && window.SoundFX.stopAlarm) window.SoundFX.stopAlarm();
          banner.textContent = '🛑 EXAM CONCLUDED • CEASE WRITING IMMEDIATELY';
          return;
        }
        if (e.code === 'Space') {
          e.preventDefault();
          btnStart.click();
        } else if (e.code === 'KeyR') {
          btnReset.click();
        }
      });

      reset();
      setActivePreset(3600, false);
    })();