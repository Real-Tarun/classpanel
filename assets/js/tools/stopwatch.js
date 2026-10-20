(function() {
      let isRunning = false;
      let startTime = 0;
      let elapsedPausedTime = 0;
      let animFrameId = null;
      let laps = [];
      let lastLapTime = 0;

      const display = document.getElementById('display-time');
      const btnStart = document.getElementById('btn-start');
      const btnLap = document.getElementById('btn-lap');
      const btnReset = document.getElementById('btn-reset');
      const lapsContainer = document.getElementById('laps-container');
      const lapsBody = document.getElementById('laps-body');
      const lapsCount = document.getElementById('laps-count');
      const btnCopyLaps = document.getElementById('btn-copy-laps');
      const btnClearLaps = document.getElementById('btn-clear-laps');

      function formatTimeParts(ms) {
        const totalSecs = Math.floor(ms / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        const millis = Math.floor((ms % 1000) / 10);

        const hh = String(hours).padStart(2, '0');
        const mm = String(minutes).padStart(2, '0');
        const ss = String(seconds).padStart(2, '0');
        const msStr = String(millis).padStart(2, '0');

        return { main: `${hh}:${mm}:${ss}`, ms: `.${msStr}`, full: `${hh}:${mm}:${ss}.${msStr}` };
      }

      function updateDisplay() {
        const now = isRunning ? (performance.now() - startTime + elapsedPausedTime) : elapsedPausedTime;
        const formatted = formatTimeParts(now);
        display.innerHTML = `${formatted.main}<span class="stopwatch-millis">${formatted.ms}</span>`;

        if (isRunning) {
          animFrameId = requestAnimationFrame(updateDisplay);
        }
      }

      function start() {
        if (isRunning) return;
        isRunning = true;
        startTime = performance.now();
        btnLap.disabled = false;
        btnStart.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          <span>Pause</span>
        `;
        btnStart.classList.replace('btn-giant-primary', 'btn-giant-secondary');
        if (window.SoundFX) window.SoundFX.playClick();
        animFrameId = requestAnimationFrame(updateDisplay);
      }

      function pause() {
        if (!isRunning) return;
        isRunning = false;
        elapsedPausedTime += performance.now() - startTime;
        cancelAnimationFrame(animFrameId);
        btnLap.disabled = true;
        btnStart.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Resume</span>
        `;
        btnStart.classList.replace('btn-giant-secondary', 'btn-giant-primary');
        if (window.SoundFX) window.SoundFX.playClick();
      }

      function reset() {
        pause();
        elapsedPausedTime = 0;
        startTime = 0;
        lastLapTime = 0;
        btnStart.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Start</span>
        `;
        btnStart.classList.replace('btn-giant-secondary', 'btn-giant-primary');
        btnLap.disabled = true;
        display.innerHTML = `00:00:00<span class="stopwatch-millis">.00</span>`;
        if (window.SoundFX) window.SoundFX.playClick();
      }

      function renderLaps() {
        if (laps.length === 0) {
          lapsContainer.style.display = 'none';
          return;
        }
        lapsContainer.style.display = 'block';
        lapsCount.textContent = laps.length;

        let fastestIdx = -1, slowestIdx = -1;
        if (laps.length > 1) {
          let minSplit = Infinity, maxSplit = -Infinity;
          laps.forEach((l, idx) => {
            if (l.splitMs < minSplit) { minSplit = l.splitMs; fastestIdx = idx; }
            if (l.splitMs > maxSplit) { maxSplit = l.splitMs; slowestIdx = idx; }
          });
        }

        lapsBody.innerHTML = laps.map((lap, idx) => {
          let cls = '';
          let badge = '';
          if (idx === fastestIdx) {
            cls = 'lap-fastest';
            badge = '<span class="lap-badge lap-badge-fastest">Fastest</span>';
          } else if (idx === slowestIdx) {
            cls = 'lap-slowest';
            badge = '<span class="lap-badge lap-badge-slowest">Slowest</span>';
          }
          return `
            <tr class="${cls}">
              <td>#${lap.num}</td>
              <td>+${formatTimeParts(lap.splitMs).full}</td>
              <td>${formatTimeParts(lap.totalMs).full}</td>
              <td style="text-align: right;">${badge}</td>
            </tr>
          `;
        }).join('');
      }

      function recordLap() {
        if (!isRunning) return;
        const currentTotal = performance.now() - startTime + elapsedPausedTime;
        const split = currentTotal - lastLapTime;
        lastLapTime = currentTotal;

        laps.unshift({
          num: laps.length + 1,
          splitMs: split,
          totalMs: currentTotal
        });

        renderLaps();
        if (window.SoundFX) window.SoundFX.playClick();
      }

      btnStart.addEventListener('click', () => {
        if (isRunning) pause();
        else start();
      });

      btnLap.addEventListener('click', recordLap);
      btnReset.addEventListener('click', reset);

      btnClearLaps.addEventListener('click', () => {
        laps = [];
        lastLapTime = isRunning ? (performance.now() - startTime + elapsedPausedTime) : elapsedPausedTime;
        renderLaps();
      });

      btnCopyLaps.addEventListener('click', () => {
        if (laps.length === 0) return;
        const text = laps.map(l => `Lap #${l.num}: Split +${formatTimeParts(l.splitMs).full} | Total: ${formatTimeParts(l.totalMs).full}`).join('\n');
        navigator.clipboard.writeText(text).then(() => {
          if (window.ClassPanel) window.ClassPanel.showToast('Copied lap splits to clipboard!');
        });
      });

      document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea, select')) return;
        if (e.code === 'Space') {
          e.preventDefault();
          if (isRunning) pause();
          else start();
        } else if (e.key === 'l' || e.key === 'L') {
          recordLap();
        } else if (e.key === 'r' || e.key === 'R') {
          reset();
        }
      });
    })();