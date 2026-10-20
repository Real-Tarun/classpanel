(function() {
      let diceCount = 1;
      let diceSides = 6;
      let isRolling = false;
      const history = [];

      const selectSides = document.getElementById('select-dice-sides');
      const diceRack = document.getElementById('dice-rack');
      const diceTotal = document.getElementById('dice-total');
      const btnRoll = document.getElementById('btn-roll');
      const diceHistory = document.getElementById('dice-history');
      const countButtons = document.querySelectorAll('[data-count]');

      const PIP_MAP = {
        1: [4],
        2: [0, 8],
        3: [0, 4, 8],
        4: [0, 2, 6, 8],
        5: [0, 2, 4, 6, 8],
        6: [0, 2, 3, 5, 6, 8]
      };

      function createDieFace(value, sides) {
        const die = document.createElement('div');
        die.className = 'die-face';

        if (sides === 6) {
          const grid = document.createElement('div');
          grid.className = 'die-pip-grid';
          const pips = PIP_MAP[value] || [4];
          for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            if (pips.includes(i)) {
              const pip = document.createElement('div');
              pip.className = 'die-pip';
              cell.appendChild(pip);
            }
            grid.appendChild(cell);
          }
          die.appendChild(grid);
        } else {
          die.style.background = 'var(--bg-surface)';
          die.style.borderColor = 'var(--primary)';
          die.innerHTML = `
            <span class="die-poly-num" style="color: var(--primary);">${value}</span>
            <span class="die-poly-tag">d${sides}</span>
          `;
        }

        die.addEventListener('click', rollDice);
        return die;
      }

      function renderInitialDice() {
        diceRack.innerHTML = '';
        for (let i = 0; i < diceCount; i++) {
          diceRack.appendChild(createDieFace(diceSides === 6 ? 6 : diceSides, diceSides));
        }
        diceTotal.innerHTML = `Total: <strong>${diceCount * (diceSides === 6 ? 6 : diceSides)}</strong>`;
      }

      function rollDice() {
        if (isRolling) return;
        isRolling = true;
        btnRoll.disabled = true;

        if (window.SoundFX && window.SoundFX.playClick) {
          window.SoundFX.playClick();
        }

        const currentFaces = diceRack.querySelectorAll('.die-face');
        currentFaces.forEach(f => f.classList.add('is-rolling'));

        setTimeout(() => {
          diceRack.innerHTML = '';
          const rollValues = [];
          let sum = 0;

          for (let i = 0; i < diceCount; i++) {
            // Cryptographic random
            const arr = new Uint32Array(1);
            window.crypto.getRandomValues(arr);
            const val = (arr[0] % diceSides) + 1;
            rollValues.push(val);
            sum += val;
            diceRack.appendChild(createDieFace(val, diceSides));
          }

          if (diceCount === 1) {
            diceTotal.innerHTML = `Result: <strong style="color: var(--primary); font-size: 1.2em;">${sum}</strong>`;
          } else {
            diceTotal.innerHTML = `Total: <strong style="color: var(--primary);">${sum}</strong> <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">(${rollValues.join(' + ')})</span>`;
          }

          // Update History
          const historyEntry = `${diceCount}d${diceSides} → [${rollValues.join(', ')}] = ${sum}`;
          history.unshift(historyEntry);
          if (history.length > 8) history.pop();

          diceHistory.innerHTML = history.map(h => `<span class="history-chip">${h}</span>`).join('');

          isRolling = false;
          btnRoll.disabled = false;
        }, 500);
      }

      countButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          countButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          diceCount = parseInt(btn.dataset.count, 10);
          renderInitialDice();
        });
      });

      selectSides.addEventListener('change', () => {
        diceSides = parseInt(selectSides.value, 10);
        renderInitialDice();
      });

      btnRoll.addEventListener('click', rollDice);

      document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
          e.preventDefault();
          rollDice();
        }
      });

      renderInitialDice();
    })();