(function () {
      let history = [];
      let isRolling = false;

      const inputMin = document.getElementById('input-min');
      const inputMax = document.getElementById('input-max');
      const inputQty = document.getElementById('input-qty');
      const checkUnique = document.getElementById('check-unique');
      const output = document.getElementById('number-output');
      const btnGenerate = document.getElementById('btn-generate');
      const btnClear = document.getElementById('btn-clear-history');
      const historyChips = document.getElementById('history-chips');
      const historyCount = document.getElementById('history-count');

      function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      function generate() {
        if (isRolling) return;
        const min = parseInt(inputMin.value, 10) || 1;
        const max = parseInt(inputMax.value, 10) || 100;
        const qty = Math.max(1, Math.min(50, parseInt(inputQty.value, 10) || 1));

        if (min >= max) {
          if (window.ClassPanel) window.ClassPanel.alert({ title: 'Invalid Number Range', message: 'The Minimum number must be strictly less than the Maximum number.' });
          return;
        }

        isRolling = true;
        let rollsCount = 0;
        const rollDuration = 700;
        const rollInterval = 40;

        const timer = setInterval(() => {
          rollsCount += rollInterval;
          output.textContent = getRandomInt(min, max);
          if (window.SoundFX) window.SoundFX.playClick();

          if (rollsCount >= rollDuration) {
            clearInterval(timer);
            finalize(min, max, qty);
          }
        }, rollInterval);
      }

      function finalize(min, max, qty) {
        isRolling = false;
        const unique = checkUnique.checked;
        let results = [];

        if (qty === 1) {
          if (unique) {
            const available = [];
            for (let i = min; i <= max; i++) {
              if (!history.includes(i)) available.push(i);
            }
            if (available.length === 0) {
              if (window.ClassPanel) window.ClassPanel.alert({ title: 'All Numbers Drawn', message: 'All unique numbers in this range have already been drawn! Click "Clear History" to start a new round.' });
              output.textContent = 'DONE';
              return;
            }
            results.push(available[Math.floor(Math.random() * available.length)]);
          } else {
            results.push(getRandomInt(min, max));
          }
        } else {
          // Batch qty
          const pool = [];
          for (let i = min; i <= max; i++) pool.push(i);
          for (let i = 0; i < qty; i++) {
            if (unique && pool.length === 0) break;
            const idx = Math.floor(Math.random() * pool.length);
            results.push(pool[idx]);
            if (unique) pool.splice(idx, 1);
          }
        }

        output.textContent = results.join(', ');
        results.forEach(r => history.unshift(r));
        renderHistory();

        if (window.SoundFX) window.SoundFX.playFanfare();
        if (window.Confetti) window.Confetti.fire({ count: 80 });
      }

      function renderHistory() {
        historyCount.textContent = history.length;
        if (history.length === 0) {
          historyChips.innerHTML = `<span style="color: var(--text-muted); font-size: 0.9rem;">No numbers generated yet.</span>`;
          return;
        }

        historyChips.innerHTML = history.slice(0, 30).map(num => `
          <span class="drawn-chip">${num}</span>
        `).join('');
      }

      btnClear.addEventListener('click', () => {
        history = [];
        renderHistory();
        output.textContent = '?';
      });

      btnGenerate.addEventListener('click', generate);

      const rangeBtns = document.querySelectorAll('[data-min]');
      rangeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          rangeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          inputMin.value = btn.getAttribute('data-min');
          inputMax.value = btn.getAttribute('data-max');
        });
      });
      [inputMin, inputMax].forEach(inp => {
        inp.addEventListener('input', () => {
          rangeBtns.forEach(b => {
            if (b.getAttribute('data-min') === inputMin.value && b.getAttribute('data-max') === inputMax.value) {
              b.classList.add('active');
            } else {
              b.classList.remove('active');
            }
          });
        });
      });

      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') {
          e.preventDefault();
          generate();
        }
      });
    })();