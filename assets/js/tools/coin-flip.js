(function() {
      let coinCount = 1;
      let totalFlips = 0;
      let headsCount = 0;
      let tailsCount = 0;
      let isFlipping = false;

      const coinsRack = document.getElementById('coins-rack');
      const btnFlip = document.getElementById('btn-flip');
      const btnResetStats = document.getElementById('btn-reset-stats');
      const resultBanner = document.getElementById('result-banner');
      const statTotal = document.getElementById('stat-total');
      const statHeads = document.getElementById('stat-heads');
      const statTails = document.getElementById('stat-tails');
      const ratioFill = document.getElementById('ratio-fill');
      const countButtons = document.querySelectorAll('[data-count]');

      function renderCoins() {
        coinsRack.innerHTML = '';
        for (let i = 0; i < coinCount; i++) {
          const coin = document.createElement('div');
          coin.className = 'coin-3d';
          coin.id = `coin-${i}`;
          coin.innerHTML = `
            <div class="coin-inner-ring">
              <span class="coin-icon">👑</span>
              <span class="coin-caption">Heads</span>
            </div>
          `;
          coin.addEventListener('click', flipCoins);
          coinsRack.appendChild(coin);
        }
      }

      function updateStatsUI() {
        statTotal.textContent = totalFlips;
        const hPct = totalFlips > 0 ? Math.round((headsCount / totalFlips) * 100) : 0;
        const tPct = totalFlips > 0 ? Math.round((tailsCount / totalFlips) * 100) : 0;
        statHeads.textContent = `${headsCount} (${hPct}%)`;
        statTails.textContent = `${tailsCount} (${tPct}%)`;
        ratioFill.style.width = totalFlips > 0 ? `${hPct}%` : '50%';
      }

      function flipCoins() {
        if (isFlipping) return;
        isFlipping = true;
        btnFlip.disabled = true;

        if (window.SoundFX && window.SoundFX.playCoinClink) {
          window.SoundFX.playCoinClink();
        }

        resultBanner.textContent = 'Flipping...';
        resultBanner.style.color = 'var(--text-primary)';

        const results = [];
        const coinElements = document.querySelectorAll('.coin-3d');

        coinElements.forEach((coin, idx) => {
          coin.classList.remove('is-flipping-heads', 'is-flipping-tails');
          void coin.offsetWidth; // trigger reflow

          // Generate true crypto random 0 or 1
          const array = new Uint32Array(1);
          window.crypto.getRandomValues(array);
          const isHeads = (array[0] % 2 === 0);
          results.push(isHeads);

          if (isHeads) {
            coin.classList.add('is-flipping-heads');
          } else {
            coin.classList.add('is-flipping-tails');
          }
        });

        setTimeout(() => {
          let roundHeads = 0;
          let roundTails = 0;

          coinElements.forEach((coin, idx) => {
            const isHeads = results[idx];
            if (isHeads) {
              roundHeads++;
              headsCount++;
              coin.innerHTML = `
                <div class="coin-inner-ring">
                  <span class="coin-icon">👑</span>
                  <span class="coin-caption">Heads</span>
                </div>
              `;
            } else {
              roundTails++;
              tailsCount++;
              coin.innerHTML = `
                <div class="coin-inner-ring" style="border-color: rgba(255,255,255,0.6);">
                  <span class="coin-icon">🪙</span>
                  <span class="coin-caption">Tails</span>
                </div>
              `;
            }
          });

          totalFlips += coinCount;
          updateStatsUI();

          if (coinCount === 1) {
            const resultName = results[0] ? 'HEADS' : 'TAILS';
            resultBanner.innerHTML = `Result: <strong style="color: ${results[0] ? '#F59E0B' : 'var(--accent-sky)'};">${resultName}!</strong>`;
          } else {
            resultBanner.innerHTML = `Result: <strong>${roundHeads} Heads</strong>, <strong>${roundTails} Tails</strong>`;
          }

          isFlipping = false;
          btnFlip.disabled = false;
        }, 950);
      }

      countButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          countButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          coinCount = parseInt(btn.dataset.count, 10);
          renderCoins();
          resultBanner.textContent = `Ready to flip ${coinCount} coin${coinCount > 1 ? 's' : ''}!`;
        });
      });

      btnFlip.addEventListener('click', flipCoins);

      btnResetStats.addEventListener('click', () => {
        totalFlips = 0;
        headsCount = 0;
        tailsCount = 0;
        updateStatsUI();
        resultBanner.textContent = 'Stats reset! Click to flip.';
        if (window.ClassPanel) window.ClassPanel.showToast('Flip statistics reset!');
      });

      document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !e.target.matches('input, textarea, select')) {
          e.preventDefault();
          flipCoins();
        }
      });

      renderCoins();
      updateStatsUI();
    })();