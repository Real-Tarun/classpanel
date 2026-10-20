(function () {
      const THEMES = {
        animals: [
          { icon: '🐢', name: 'Turtle', color: '#EF4444', trait: 'turtle' },
          { icon: '🐇', name: 'Bunny', color: '#3B82F6', trait: 'bunny' },
          { icon: '🐆', name: 'Cheetah', color: '#10B981', trait: 'cheetah' },
          { icon: '🚀', name: 'Rocket', color: '#F59E0B', trait: 'rocket' }
        ],
        teams: [
          { icon: '🔴', name: 'Red Team', color: '#EF4444', trait: 'cheetah' },
          { icon: '🔵', name: 'Blue Team', color: '#3B82F6', trait: 'bunny' },
          { icon: '🟢', name: 'Green Team', color: '#10B981', trait: 'turtle' },
          { icon: '🟡', name: 'Gold Team', color: '#F59E0B', trait: 'rocket' }
        ],
        vehicles: [
          { icon: '🏎️', name: 'Racecar', color: '#EF4444', trait: 'cheetah' },
          { icon: '🚀', name: 'Rocket', color: '#3B82F6', trait: 'rocket' },
          { icon: '🚁', name: 'Chopper', color: '#10B981', trait: 'turtle' },
          { icon: '⚡', name: 'Speedster', color: '#F59E0B', trait: 'bunny' }
        ]
      };

      let currentTheme = 'animals';
      let racers = JSON.parse(JSON.stringify(THEMES.animals));

      let totalDuration = 60;
      let remainingSeconds = 60;
      let isRunning = false;
      let animFrameId = null;
      let lastTimestamp = null;
      let raceFinished = false;

      // Physics state per racer: progress 0..1, seed for personality curves, turbo flag
      let racerStates = [
        { pos: 0, seed: Math.random() * 50 + 1, isTurbo: false },
        { pos: 0, seed: Math.random() * 50 + 20, isTurbo: false },
        { pos: 0, seed: Math.random() * 50 + 40, isTurbo: false },
        { pos: 0, seed: Math.random() * 50 + 60, isTurbo: false }
      ];

      let lastLeaderIndex = -1;
      let commentaryCooldown = 0;

      const display = document.getElementById('race-timer-display');
      const btnStart = document.getElementById('btn-race-start');
      const btnReset = document.getElementById('btn-race-reset');
      const selectTheme = document.getElementById('select-race-theme');
      const track = document.getElementById('race-track');
      const commentaryText = document.getElementById('race-commentary-text');
      const commentaryBar = document.getElementById('race-commentary');
      const podiumCard = document.getElementById('podium-overlay');
      const podiumGrid = document.getElementById('podium-grid');
      const podiumWinnerTitle = document.getElementById('podium-winner-title');
      const btnPodiumClose = document.getElementById('btn-podium-close');

      // F1 Starting Lights Elements
      const btnModeRace = document.getElementById('btn-mode-race');
      const btnModeF1 = document.getElementById('btn-mode-f1');
      const f1Gantry = document.getElementById('f1-gantry-container');
      const f1Feedback = document.getElementById('f1-feedback-banner');
      const racePresetsGroup = document.getElementById('race-presets-group');
      const raceModeSubtitle = document.getElementById('race-mode-subtitle');
      const f1Lamps = [
        document.getElementById('f1-red-0'),
        document.getElementById('f1-red-1'),
        document.getElementById('f1-red-2'),
        document.getElementById('f1-red-3'),
        document.getElementById('f1-red-4')
      ];

      let currentMode = 'race'; // 'race' | 'f1'
      let f1State = 'idle'; // 'idle' | 'starting' | 'holding' | 'lights_out' | 'finished'
      let f1Timers = [];
      let f1StartTime = null;

      const avatarBoxes = [
        document.getElementById('avatar-box-0'),
        document.getElementById('avatar-box-1'),
        document.getElementById('avatar-box-2'),
        document.getElementById('avatar-box-3')
      ];
      const avatarIcons = [
        document.getElementById('avatar-icon-0'),
        document.getElementById('avatar-icon-1'),
        document.getElementById('avatar-icon-2'),
        document.getElementById('avatar-icon-3')
      ];
      const avatarLabels = [
        document.getElementById('avatar-label-0'),
        document.getElementById('avatar-label-1'),
        document.getElementById('avatar-label-2'),
        document.getElementById('avatar-label-3')
      ];

      function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      }

      function setCommentary(msg) {
        if (commentaryText) commentaryText.textContent = msg;
      }

      function updateTheme(themeKey) {
        currentTheme = themeKey;
        const list = THEMES[themeKey] || THEMES.animals;
        racers = JSON.parse(JSON.stringify(list));
        racers.forEach((r, i) => {
          if (avatarIcons[i]) avatarIcons[i].textContent = r.icon;
          if (avatarLabels[i]) avatarLabels[i].textContent = r.name;
        });
        reset();
      }

      function initRacerLabels() {
        avatarLabels.forEach((lbl, i) => {
          lbl.addEventListener('blur', () => {
            const val = lbl.textContent.trim();
            if (val) racers[i].name = val;
            else lbl.textContent = racers[i].name;
          });
          lbl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              lbl.blur();
            }
          });
        });
      }

      function resetPhysicsSeeds() {
        racerStates = [
          { pos: 0, seed: Math.random() * 80 + 1, isTurbo: false },
          { pos: 0, seed: Math.random() * 80 + 20, isTurbo: false },
          { pos: 0, seed: Math.random() * 80 + 40, isTurbo: false },
          { pos: 0, seed: Math.random() * 80 + 60, isTurbo: false }
        ];
        lastLeaderIndex = -1;
        commentaryCooldown = 0;
      }

      function renderPositions() {
        if (currentMode !== 'race') return;
        const trackWidth = track.clientWidth || track.offsetWidth || 800;
        const startOffset = 54;
        const finishOffset = 48;
        const availableDist = Math.max(100, trackWidth - startOffset - finishOffset);

        racerStates.forEach((st, i) => {
          const px = Math.min(availableDist + 30, st.pos * availableDist);
          if (avatarBoxes[i]) {
            avatarBoxes[i].style.transform = `translateX(${px}px)`;
            if (isRunning) {
              avatarBoxes[i].classList.add('is-running');
              if (st.isTurbo) avatarBoxes[i].classList.add('is-turbo');
              else avatarBoxes[i].classList.remove('is-turbo');
            } else {
              avatarBoxes[i].classList.remove('is-running', 'is-turbo');
            }
          }
        });
      }

      function animationLoop(timestamp) {
        if (!isRunning) return;
        if (!lastTimestamp) lastTimestamp = timestamp;
        const dt = Math.min(0.1, (timestamp - lastTimestamp) / 1000);
        lastTimestamp = timestamp;

        remainingSeconds = Math.max(0, remainingSeconds - dt);
        display.textContent = formatTime(Math.ceil(remainingSeconds));

        const baseProgress = Math.min(1, Math.max(0, 1 - (remainingSeconds / totalDuration)));

        racerStates.forEach((st, i) => {
          const personality = (st.seed * 0.05);
          const wave = Math.sin(baseProgress * Math.PI * 4 + personality) * 0.045
                     + Math.sin(baseProgress * Math.PI * 8 + st.seed) * 0.025;

          st.isTurbo = wave > 0.04 && isRunning;

          if (baseProgress < 0.90) {
            st.pos = Math.max(0, Math.min(0.88, baseProgress + wave * 0.7));
          } else {
            const sprintRatio = (baseProgress - 0.90) / 0.10;
            const finalSeedAdvantage = ((st.seed % 10) - 4.5) * 0.008;
            st.pos = Math.min(1.06, 0.88 + sprintRatio * (0.12 + finalSeedAdvantage));
          }
        });

        let leaderIdx = 0;
        let maxP = -1;
        racerStates.forEach((st, i) => {
          if (st.pos > maxP) {
            maxP = st.pos;
            leaderIdx = i;
          }
        });

        commentaryCooldown -= dt;
        if (leaderIdx !== lastLeaderIndex && commentaryCooldown <= 0 && baseProgress < 0.9) {
          lastLeaderIndex = leaderIdx;
          commentaryCooldown = 3.2;
          const leader = racers[leaderIdx];
          const cheerMsgs = [
            `${leader.icon} ${leader.name} takes the lead!`,
            `${leader.icon} ${leader.name} bursts to the front!`,
            `Cheer on ${leader.name}! Looking strong!`,
            `${leader.icon} ${leader.name} is accelerating ahead!`
          ];
          setCommentary(cheerMsgs[Math.floor(Math.random() * cheerMsgs.length)]);
        } else if (baseProgress >= 0.9 && commentaryCooldown <= 0) {
          commentaryCooldown = 999;
          setCommentary('🔥 FINAL SPRINT! Who will cross first?!');
        }

        renderPositions();

        if (remainingSeconds <= 0) {
          finishRace();
          return;
        }

        animFrameId = requestAnimationFrame(animationLoop);
      }

      function start() {
        if (isRunning) return;
        if (raceFinished || remainingSeconds <= 0) {
          reset();
        }
        isRunning = true;
        raceFinished = false;
        lastTimestamp = null;
        if (podiumCard) podiumCard.style.display = 'none';

        btnStart.classList.add('is-running');
        btnStart.innerHTML = `<span>Pause</span>`;
        if (window.SoundFX) window.SoundFX.playClick();
        setCommentary('🏁 The race is ON! Cheer for your favorite!');

        animFrameId = requestAnimationFrame(animationLoop);
      }

      function pause() {
        isRunning = false;
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
        btnStart.classList.remove('is-running');
        btnStart.innerHTML = `<span>Resume</span>`;
        renderPositions();
        if (window.SoundFX) window.SoundFX.playClick();
        setCommentary('⏸️ Race paused. Click Resume to continue.');
      }

      function reset() {
        isRunning = false;
        raceFinished = false;
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
        lastTimestamp = null;
        remainingSeconds = totalDuration;
        display.textContent = formatTime(remainingSeconds);

        resetPhysicsSeeds();
        renderPositions();

        btnStart.classList.remove('is-running');
        btnStart.innerHTML = `<span>Start Race</span>`;
        if (podiumCard) podiumCard.style.display = 'none';
        setCommentary('🏁 Ready to race! Click Start Race to begin.');
      }

      function finishRace() {
        isRunning = false;
        raceFinished = true;
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
        display.textContent = formatTime(0);
        renderPositions();

        btnStart.classList.remove('is-running');
        btnStart.innerHTML = `<span>Start Race</span>`;

        const ranking = racerStates
          .map((st, i) => ({ index: i, racer: racers[i], pos: st.pos }))
          .sort((a, b) => b.pos - a.pos);

        const winner = ranking[0].racer;
        setCommentary(`🏆 ${winner.icon} ${winner.name} WINS THE RACE!`);

        if (window.SoundFX) window.SoundFX.playFanfare();
        if (window.Confetti) window.Confetti.fire({ count: 180 });
        if (window.ClassPanel) window.ClassPanel.showToast(`🏆 ${winner.icon} ${winner.name} crossed the finish line!`);

        if (podiumWinnerTitle) podiumWinnerTitle.textContent = `🏆 ${winner.icon} ${winner.name} Wins!`;
        const medals = ['🥇 1st Place (Winner)', '🥈 2nd Place', '🥉 3rd Place', '🎖️ 4th Place'];
        if (podiumGrid) {
          podiumGrid.innerHTML = ranking.map((r, rank) => `
            <div class="podium-rank-item ${rank === 0 ? 'winner' : ''}">
              <div style="font-size: 2.2rem;">${r.racer.icon}</div>
              <strong style="font-size: 1rem; color: var(--text-primary);">${r.racer.name}</strong>
              <span class="preset-chip active" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; ${rank === 0 ? 'background: #F59E0B; color: #000; font-weight: 800;' : ''}">${medals[rank]}</span>
            </div>
          `).join('');
        }

        if (podiumCard) podiumCard.style.display = 'block';
      }

      // ==========================================
      // F1 START LIGHTS LOGIC
      // ==========================================
      function clearF1Timers() {
        f1Timers.forEach(t => clearTimeout(t));
        f1Timers = [];
      }

      function resetF1Lamps() {
        f1Lamps.forEach(lamp => {
          if (lamp) {
            lamp.style.background = '#450A0A';
            lamp.style.boxShadow = 'none';
          }
        });
      }

      function turnF1LampOn(index) {
        if (f1Lamps[index]) {
          f1Lamps[index].style.background = '#EF4444';
          f1Lamps[index].style.boxShadow = '0 0 30px #EF4444, inset 0 0 10px #FFF';
        }
      }

      function resetF1() {
        clearF1Timers();
        resetF1Lamps();
        f1State = 'idle';
        f1StartTime = null;
        if (f1Feedback) {
          f1Feedback.textContent = 'Click "Start Lights" below, then tap when lights go OUT!';
          f1Feedback.style.color = '#F8FAFC';
        }
        btnStart.classList.remove('is-running');
        btnStart.innerHTML = '<span>Start Lights</span>';
      }

      function startF1Sequence() {
        clearF1Timers();
        resetF1Lamps();
        f1State = 'starting';
        f1StartTime = null;

        if (f1Feedback) {
          f1Feedback.textContent = 'Get ready... Hold your focus!';
          f1Feedback.style.color = '#F8FAFC';
        }
        btnStart.classList.add('is-running');
        btnStart.innerHTML = '<span>TAP WHEN LIGHTS GO OUT!</span>';

        // Illuminate lamps 0..4 sequentially at 1-second intervals
        for (let i = 0; i < 5; i++) {
          const tid = setTimeout(() => {
            if (f1State !== 'starting') return;
            turnF1LampOn(i);
            if (window.SoundFX) window.SoundFX.playBeep(false);
          }, (i + 1) * 1000);
          f1Timers.push(tid);
        }

        // After all 5 are lit (5s), hold for random suspense duration (0.2s to 2.5s)
        const randomHold = 200 + Math.random() * 2300;
        const holdTid = setTimeout(() => {
          if (f1State !== 'starting') return;
          f1State = 'holding';
          if (f1Feedback) f1Feedback.textContent = 'HOLD... Anticipating the green flag!';

          const extinguishTid = setTimeout(() => {
            if (f1State !== 'holding') return;
            triggerF1LightsOut();
          }, randomHold);
          f1Timers.push(extinguishTid);
        }, 5000);
        f1Timers.push(holdTid);
      }

      function triggerF1LightsOut() {
        f1State = 'lights_out';
        f1StartTime = performance.now();
        resetF1Lamps();

        if (window.SoundFX) window.SoundFX.playBeep(true);
        if (f1Feedback) {
          f1Feedback.textContent = '🟢 LIGHTS OUT! TAP / PRESS SPACE NOW!';
          f1Feedback.style.color = '#22C55E';
        }
      }

      function handleF1Interaction() {
        if (f1State === 'idle') {
          startF1Sequence();
          return;
        }

        if (f1State === 'starting' || f1State === 'holding') {
          // Jump start detected!
          clearF1Timers();
          f1State = 'finished';
          f1Lamps.forEach(lamp => {
            if (lamp) {
              lamp.style.background = '#F59E0B';
              lamp.style.boxShadow = '0 0 20px #F59E0B';
            }
          });
          if (window.SoundFX) window.SoundFX.playBuzzer();
          if (f1Feedback) {
            f1Feedback.textContent = '⚡ JUMP START! False start penalty. You reacted before the lights went out!';
            f1Feedback.style.color = '#EF4444';
          }
          btnStart.classList.remove('is-running');
          btnStart.innerHTML = '<span>Try Again</span>';
          return;
        }

        if (f1State === 'lights_out') {
          const reactionMs = Math.round(performance.now() - f1StartTime);
          f1State = 'finished';

          let rating = '';
          if (reactionMs < 200) {
            rating = `⚡ Sub-200ms! Elite Formula 1 Champion Reflexes! (${reactionMs} ms)`;
            if (window.Confetti) window.Confetti.fire({ count: 150 });
            if (window.SoundFX) window.SoundFX.playFanfare();
          } else if (reactionMs <= 250) {
            rating = `🏎️ Superhuman Speed! Podium Contender! (${reactionMs} ms)`;
            if (window.Confetti) window.Confetti.fire({ count: 80 });
            if (window.SoundFX) window.SoundFX.playFanfare();
          } else if (reactionMs <= 320) {
            rating = `🟢 Sharp & Fast Reaction! Excellent start! (${reactionMs} ms)`;
            if (window.SoundFX) window.SoundFX.playClick();
          } else if (reactionMs <= 450) {
            rating = `🟡 Solid Reaction Time (${reactionMs} ms). Practice for sub-250ms!`;
            if (window.SoundFX) window.SoundFX.playClick();
          } else {
            rating = `🐢 Stalled on the Grid! (${reactionMs} ms). Have some coffee and try again!`;
            if (window.SoundFX) window.SoundFX.playClick();
          }

          if (f1Feedback) {
            f1Feedback.textContent = rating;
            f1Feedback.style.color = reactionMs <= 250 ? '#10B981' : '#F59E0B';
          }
          btnStart.classList.remove('is-running');
          btnStart.innerHTML = '<span>Test Again</span>';
          return;
        }

        if (f1State === 'finished') {
          startF1Sequence();
        }
      }

      function setMode(mode) {
        currentMode = mode;
        if (mode === 'race') {
          btnModeRace.style.background = 'var(--primary)';
          btnModeRace.style.color = '#FFF';
          btnModeF1.style.background = 'transparent';
          btnModeF1.style.color = 'inherit';

          track.style.display = 'block';
          display.style.display = 'block';
          commentaryBar.style.display = 'flex';
          racePresetsGroup.style.display = 'flex';
          if (selectTheme && selectTheme.parentElement) selectTheme.parentElement.style.display = 'inline-flex';
          f1Gantry.style.display = 'none';

          if (raceModeSubtitle) {
            raceModeSubtitle.textContent = 'Animated Track Sprints & Formula 1 Start Lights Reaction Test';
          }
          clearF1Timers();
          reset();
        } else {
          btnModeF1.style.background = 'var(--primary)';
          btnModeF1.style.color = '#FFF';
          btnModeRace.style.background = 'transparent';
          btnModeRace.style.color = 'inherit';

          track.style.display = 'none';
          display.style.display = 'none';
          commentaryBar.style.display = 'none';
          racePresetsGroup.style.display = 'none';
          if (selectTheme && selectTheme.parentElement) selectTheme.parentElement.style.display = 'none';
          f1Gantry.style.display = 'flex';

          if (raceModeSubtitle) {
            raceModeSubtitle.textContent = 'Formula 1 Starting Gantry — Test Your Launch Reaction Time in Milliseconds';
          }
          pause();
          resetF1();
        }
      }

      btnModeRace.addEventListener('click', () => setMode('race'));
      btnModeF1.addEventListener('click', () => setMode('f1'));
      f1Gantry.addEventListener('click', () => {
        if (currentMode === 'f1') handleF1Interaction();
      });

      btnStart.addEventListener('click', () => {
        if (currentMode === 'f1') {
          handleF1Interaction();
        } else {
          if (isRunning) pause();
          else start();
        }
      });

      btnReset.addEventListener('click', () => {
        if (currentMode === 'f1') resetF1();
        else reset();
      });

      if (btnPodiumClose) btnPodiumClose.addEventListener('click', reset);

      if (selectTheme) {
        selectTheme.addEventListener('change', (e) => {
          updateTheme(e.target.value);
        });
      }

      // Presets
      const raceChips = document.querySelectorAll('#race-presets-group .preset-chip');
      const btnCustomRace = document.getElementById('btn-custom-race');

      function setActiveRacePreset(secs, isCustom = false) {
        raceChips.forEach(c => {
          c.classList.remove('active');
          c.removeAttribute('style');
        });
        if (isCustom) {
          if (btnCustomRace) {
            btnCustomRace.classList.add('active');
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            btnCustomRace.textContent = m > 0 ? (s > 0 ? `Custom (${m}m ${s}s)` : `Custom (${m}m)`) : `Custom (${s}s)`;
          }
        } else {
          if (btnCustomRace) btnCustomRace.textContent = '⏱️ Custom Time';
          const match = Array.from(raceChips).find(c => parseInt(c.getAttribute('data-time'), 10) === secs);
          if (match) match.classList.add('active');
        }
      }

      function parseAndSetDuration(input) {
        if (!input) return;
        let secs = 0;
        const str = String(input).trim().toLowerCase();
        const mMatch = str.match(/(\d+)\s*(?:m|min|minute)/);
        const sMatch = str.match(/(\d+)\s*(?:s|sec|second)/);
        if (mMatch || sMatch) {
          if (mMatch) secs += parseInt(mMatch[1], 10) * 60;
          if (sMatch) secs += parseInt(sMatch[1], 10);
        } else if (str.includes(':')) {
          const parts = str.split(':').map(p => parseInt(p.trim(), 10) || 0);
          if (parts.length === 2) {
            secs = parts[0] * 60 + parts[1];
          }
        } else {
          const n = parseInt(str, 10);
          if (!isNaN(n)) {
            secs = (n <= 10) ? n * 60 : n;
          }
        }

        if (!isNaN(secs) && secs >= 5 && secs <= 3600) {
          totalDuration = secs;
          setActiveRacePreset(totalDuration, true);
          reset();
          if (window.ClassPanel && window.ClassPanel.showToast) {
            window.ClassPanel.showToast(`Race duration set to ${formatTime(secs)}!`);
          }
        } else {
          if (window.ClassPanel && window.ClassPanel.showToast) {
            window.ClassPanel.showToast('Please enter a duration like "45s", "2m", "01:30" or 5 to 3600 seconds.');
          }
        }
      }

      async function openCustomDurationModal() {
        if (isRunning) pause();
        const curM = Math.floor(totalDuration / 60);
        const curS = totalDuration % 60;
        const defVal = curM > 0 ? (curS > 0 ? `${curM}m ${curS}s` : `${curM}m`) : `${curS}s`;
        let res = null;
        if (window.ClassPanel && window.ClassPanel.prompt) {
          res = await window.ClassPanel.prompt({
            title: 'Set Custom Race Time',
            label: 'Enter duration (e.g. "45s", "2m", "1m 30s", "90", or MM:SS):',
            defaultValue: defVal,
            placeholder: 'e.g. 2m or 45s',
            confirmText: 'Set Race Time'
          });
        } else {
          res = window.prompt('Enter race duration (e.g. 2m, 45s, 90, or 01:30):', defVal);
        }
        if (res !== null && res !== undefined) {
          parseAndSetDuration(res);
        }
      }

      document.querySelectorAll('#race-presets-group [data-time]').forEach(chip => {
        chip.addEventListener('click', () => {
          totalDuration = parseInt(chip.getAttribute('data-time'), 10);
          setActiveRacePreset(totalDuration, false);
          reset();
        });
      });

      if (btnCustomRace) {
        btnCustomRace.addEventListener('click', openCustomDurationModal);
      }

      display.addEventListener('click', openCustomDurationModal);

      // Keyboard shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.isContentEditable) return;
        if (e.code === 'Space') {
          e.preventDefault();
          if (currentMode === 'f1') {
            handleF1Interaction();
          } else {
            btnStart.click();
          }
        } else if (e.code === 'KeyR') {
          btnReset.click();
        }
      });

      window.addEventListener('resize', renderPositions);
      document.addEventListener('fullscreenchange', () => {
        setTimeout(renderPositions, 50);
        setTimeout(renderPositions, 200);
      });
      document.addEventListener('webkitfullscreenchange', () => {
        setTimeout(renderPositions, 50);
        setTimeout(renderPositions, 200);
      });
      const stageEl = document.getElementById('race-stage');
      if (stageEl && window.MutationObserver) {
        new MutationObserver(() => {
          setTimeout(renderPositions, 50);
          setTimeout(renderPositions, 200);
        }).observe(stageEl, { attributes: true, attributeFilter: ['class'] });
      }

      initRacerLabels();
      reset();
      setActiveRacePreset(60, false);
    })();