(function () {
      let teams = [
        { name: 'Team Red', count: 0, color: '#EF4444' },
        { name: 'Team Blue', count: 0, color: '#3B82F6' },
        { name: 'Team Green', count: 0, color: '#10B981' },
        { name: 'Team Gold', count: 0, color: '#F59E0B' }
      ];

      const grid = document.getElementById('teams-grid');
      const btnAddTeam = document.getElementById('btn-add-team');
      const btnResetAll = document.getElementById('btn-reset-all');

      function render() {
        grid.innerHTML = '';
        teams.forEach((t, i) => {
          const card = document.createElement('div');
          card.className = 'team-counter-card';
          card.style.borderTop = `6px solid ${t.color}`;

          card.innerHTML = `
            <div class="team-card-header">
              <div style="width: 28px;"></div>
              <div class="team-counter-name" contenteditable="true" title="Click to rename team">${t.name}</div>
              <button class="btn-delete-team" data-action="delete" data-idx="${i}" title="Delete ${t.name}" aria-label="Delete ${t.name}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="team-counter-val" style="color: ${t.color};">${t.count}</div>
            <div class="counter-btn-row">
              <button class="btn-step" style="background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-muted);" data-action="sub" data-idx="${i}">-1</button>
              <button class="btn-step" style="background: ${t.color}; color: #FFF;" data-action="add" data-idx="${i}">+1</button>
            </div>
            <div style="display: flex; gap: 0.4rem; margin-top: 0.6rem; width: 100%;">
              <button class="preset-chip" style="flex: 1; padding: 0.3rem;" data-action="add5" data-idx="${i}">+5</button>
              <button class="preset-chip" style="color: var(--accent-rose); padding: 0.3rem;" data-action="reset" data-idx="${i}">0</button>
            </div>
          `;

          // Edit name handler
          const nameEl = card.querySelector('.team-counter-name');
          nameEl.addEventListener('blur', () => {
            teams[i].name = nameEl.textContent.trim() || `Team ${i + 1}`;
          });

          grid.appendChild(card);
        });
      }

      grid.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const idx = parseInt(btn.getAttribute('data-idx'), 10);

        if (action === 'delete') {
          if (teams.length <= 1) {
            if (window.ClassPanel) window.ClassPanel.showToast('You must have at least one team.');
            return;
          }
          const teamName = teams[idx].name;
          if (teams[idx].count > 0) {
            const confirmed = await window.ClassPanel.confirm({
              title: `Delete ${teamName}?`,
              message: `This team currently has ${teams[idx].count} points. Are you sure you want to delete it?`,
              confirmText: 'Delete Team',
              danger: true
            });
            if (!confirmed) return;
          }
          teams.splice(idx, 1);
          render();
          if (window.SoundFX) window.SoundFX.playClick();
          if (window.ClassPanel) window.ClassPanel.showToast(`Deleted ${teamName}.`);
          return;
        }

        if (action === 'add') {
          teams[idx].count++;
          if (window.SoundFX) window.SoundFX.playClick();
        } else if (action === 'sub') {
          teams[idx].count = Math.max(0, teams[idx].count - 1);
          if (window.SoundFX) window.SoundFX.playClick();
        } else if (action === 'add5') {
          teams[idx].count += 5;
          if (window.SoundFX) window.SoundFX.playClick();
          if (window.Confetti) window.Confetti.fire({ count: 50 });
        } else if (action === 'reset') {
          teams[idx].count = 0;
        }

        render();
      });

      btnAddTeam.addEventListener('click', () => {
        const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1'];
        const color = colors[teams.length % colors.length];
        teams.push({ name: `Team ${teams.length + 1}`, count: 0, color });
        render();
      });

      btnResetAll.addEventListener('click', async () => {
        const confirmed = await window.ClassPanel.confirm({
          title: 'Reset All Scores?',
          message: 'Are you sure you want to reset all team points back to 0?',
          confirmText: 'Reset Scores',
          danger: true
        });
        if (confirmed) {
          teams.forEach(t => t.count = 0);
          render();
          if (window.ClassPanel) window.ClassPanel.showToast('All team scores reset to 0.');
        }
      });

      render();
    })();