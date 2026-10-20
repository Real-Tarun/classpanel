(function () {
      let currentRosterName = '';
      let currentRoster = [];
      let currentGroups = [];

      const selectStrategy = document.getElementById('select-strategy');
      const inputCount = document.getElementById('input-count');
      const labelCount = document.getElementById('label-count');
      const btnShuffle = document.getElementById('btn-shuffle');
      const btnCopy = document.getElementById('btn-copy');
      const container = document.getElementById('groups-container');
      const subtitle = document.getElementById('group-subtitle');
      const btnEditRoster = document.getElementById('btn-edit-roster');
      const emptyCard = document.getElementById('group-empty-state');
      const controlsBar = document.getElementById('group-controls-bar');
      const btnEmptyAdd = document.getElementById('btn-empty-add-names');
      const btnEmptySample = document.getElementById('btn-empty-load-sample');
      const activeClassBadge = document.getElementById('active-class-badge');
      const activeClassBadgeText = document.getElementById('active-class-badge-text');
      const btnToggleAdvanced = document.getElementById('btn-toggle-advanced');
      const advancedSettingsRow = document.getElementById('advanced-settings-row');
      const rosterCountSummary = document.getElementById('group-roster-count-summary');
      const quickPresetButtons = document.querySelectorAll('#quick-presets-container [data-quick]');

      // Modal elements
      const modal = document.getElementById('roster-modal');
      const btnCloseRoster = document.getElementById('btn-close-roster');
      const selectRoster = document.getElementById('select-roster');
      const inputRosterName = document.getElementById('input-roster-name');
      const textareaNames = document.getElementById('textarea-names');
      const btnSaveRoster = document.getElementById('btn-save-roster');
      const btnDeleteRoster = document.getElementById('btn-delete-roster');
      const btnLoadSample = document.getElementById('btn-load-sample');
      const rosterError = document.getElementById('roster-form-error');

      function init() {
        currentRosterName = window.StorageHub ? window.StorageHub.getActiveRosterName() || '' : '';
        currentRoster = window.StorageHub ? window.StorageHub.getActiveRosterList() : [];
        
        if (currentRoster.length === 0) {
          emptyCard.style.display = 'block';
          controlsBar.style.display = 'none';
          container.style.display = 'none';
          subtitle.textContent = 'No Class List Added Yet';
          if (activeClassBadgeText) activeClassBadgeText.textContent = '📚 (No active class)';
          if (rosterCountSummary) rosterCountSummary.textContent = '0 students';
        } else {
          emptyCard.style.display = 'none';
          controlsBar.style.display = 'flex';
          container.style.display = 'grid';
          subtitle.textContent = `Active Class: ${currentRosterName} • ${currentRoster.length} students enrolled`;
          if (activeClassBadgeText) activeClassBadgeText.textContent = `📚 Class: ${currentRosterName} (${currentRoster.length})`;
          if (rosterCountSummary) rosterCountSummary.textContent = `${currentRoster.length} students total`;
          generateGroups();
        }
      }

      function shuffleArray(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      }

      function generateGroups() {
        if (currentRoster.length === 0) return;

        const shuffled = shuffleArray(currentRoster);
        const strategy = selectStrategy.value;
        const count = Math.max(1, parseInt(inputCount.value, 10) || 4);

        currentGroups = [];

        if (strategy === 'by-groups') {
          const numGroups = Math.min(count, shuffled.length);
          for (let i = 0; i < numGroups; i++) {
            currentGroups.push([]);
          }
          shuffled.forEach((student, idx) => {
            currentGroups[idx % numGroups].push(student);
          });
        } else {
          // by size
          const size = count;
          for (let i = 0; i < shuffled.length; i += size) {
            currentGroups.push(shuffled.slice(i, i + size));
          }
        }

        renderGroups();
      }

      function renderGroups() {
        container.innerHTML = '';
        const GROUP_COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#059669', '#0284C7', '#D97706', '#E11D48', '#0D9488'];

        currentGroups.forEach((grp, gIdx) => {
          const card = document.createElement('div');
          card.className = 'group-card';
          const color = GROUP_COLORS[gIdx % GROUP_COLORS.length];
          card.style.borderTop = `4px solid ${color}`;

          card.innerHTML = `
            <div class="group-card-header">
              <div class="group-title">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
                <span contenteditable="true" class="group-name-editable" title="Click to rename team">Team ${gIdx + 1}</span>
              </div>
              <span class="group-card-count" style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${grp.length} students</span>
            </div>
            <div class="group-students-list" style="display: flex; flex-direction: column; gap: 0.45rem;">
              ${grp.map((s, sIdx) => `
                <div class="student-pill" data-group="${gIdx}" data-student="${sIdx}" title="Click to edit name directly">
                  <span class="student-name-text">${s}</span>
                  <div class="student-pill-actions">
                    <button class="student-btn-action" title="Click to edit name" aria-label="Edit name">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="student-btn-action student-btn-remove" data-action="remove-student" data-group="${gIdx}" data-student="${sIdx}" title="Remove student from this group" aria-label="Remove student">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
          container.appendChild(card);
        });

        // Update badge and summary
        const totalCount = currentRoster ? currentRoster.length : 0;
        if (activeClassBadgeText) {
          activeClassBadgeText.textContent = `📚 Class: ${currentRosterName || 'Class'} (${totalCount})`;
        }
        if (rosterCountSummary) {
          rosterCountSummary.textContent = `${totalCount} students total`;
        }
      }

      // Inline student name editing and removing
      container.addEventListener('click', (e) => {
        // 1. Remove student action
        const btnRemove = e.target.closest('[data-action="remove-student"]');
        if (btnRemove) {
          e.stopPropagation();
          const gIdx = parseInt(btnRemove.getAttribute('data-group'), 10);
          const sIdx = parseInt(btnRemove.getAttribute('data-student'), 10);
          if (currentGroups[gIdx] && currentGroups[gIdx][sIdx]) {
            const removedName = currentGroups[gIdx].splice(sIdx, 1)[0];
            renderGroups();
            if (window.ClassPanel) window.ClassPanel.showToast(`Removed "${removedName}" from Team ${gIdx + 1}.`);
          }
          return;
        }

        // 2. Click student pill to edit name inline
        const pill = e.target.closest('.student-pill');
        if (!pill || pill.classList.contains('is-editing')) return;

        const gIdx = parseInt(pill.getAttribute('data-group'), 10);
        const sIdx = parseInt(pill.getAttribute('data-student'), 10);
        const currentName = currentGroups[gIdx][sIdx];

        pill.classList.add('is-editing');
        pill.innerHTML = `
          <input type="text" class="student-inline-input" value="${currentName.replace(/"/g, '&quot;')}" aria-label="Edit student name">
        `;
        const input = pill.querySelector('.student-inline-input');
        input.focus();
        input.select();

        let isSaved = false;
        function saveEdit() {
          if (isSaved) return;
          isSaved = true;
          const newName = input.value.trim();
          if (newName && newName !== currentName) {
            currentGroups[gIdx][sIdx] = newName;

            // Update in StorageHub active roster list so it persists!
            if (window.StorageHub) {
              const activeName = window.StorageHub.getActiveRosterName();
              const fullRoster = window.StorageHub.getActiveRosterList();
              const rIdx = fullRoster.indexOf(currentName);
              if (rIdx !== -1) {
                fullRoster[rIdx] = newName;
                window.StorageHub.saveRoster(activeName, fullRoster);
                currentRoster = fullRoster;
              }
            }
            if (window.ClassPanel) window.ClassPanel.showToast(`Updated student name to "${newName}".`);
          }
          renderGroups();
        }

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (ke) => {
          if (ke.key === 'Enter') {
            ke.preventDefault();
            input.blur();
          } else if (ke.key === 'Escape') {
            ke.preventDefault();
            renderGroups();
          }
        });
      });

      // Quick presets setup
      quickPresetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          quickPresetButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const val = btn.getAttribute('data-quick');
          if (val === 'pairs') {
            selectStrategy.value = 'by-size';
            inputCount.value = '2';
            labelCount.textContent = 'Students Per Group:';
          } else {
            selectStrategy.value = 'by-groups';
            inputCount.value = val;
            labelCount.textContent = 'Number of Groups:';
          }

          if (window.SoundFX) window.SoundFX.playClick();
          generateGroups();
          if (window.Confetti) window.Confetti.fire({ count: 60 });
        });
      });

      // Toggle advanced / custom settings
      if (btnToggleAdvanced && advancedSettingsRow) {
        btnToggleAdvanced.addEventListener('click', () => {
          const isHidden = advancedSettingsRow.style.display === 'none';
          advancedSettingsRow.style.display = isHidden ? 'flex' : 'none';
          btnToggleAdvanced.textContent = isHidden ? '▲ Hide Custom' : '⚙️ Custom Split';
        });
      }

      selectStrategy.addEventListener('change', () => {
        if (selectStrategy.value === 'by-groups') {
          labelCount.textContent = 'Number of Groups:';
          inputCount.value = '4';
        } else {
          labelCount.textContent = 'Students Per Group:';
          inputCount.value = '4';
        }
        quickPresetButtons.forEach(b => b.classList.remove('active'));
        generateGroups();
      });

      inputCount.addEventListener('input', () => {
        quickPresetButtons.forEach(b => b.classList.remove('active'));
        generateGroups();
      });

      btnShuffle.addEventListener('click', () => {
        if (window.SoundFX) window.SoundFX.playClick();
        generateGroups();
        if (window.Confetti) window.Confetti.fire({ count: 70 });
      });

      btnCopy.addEventListener('click', () => {
        let text = `Class Groups (${currentRosterName}):\n\n`;
        currentGroups.forEach((grp, idx) => {
          text += `Team ${idx + 1} (${grp.length} students):\n${grp.map(s => `• ${s}`).join('\n')}\n\n`;
        });
        navigator.clipboard.writeText(text).then(() => {
          if (window.ClassPanel) window.ClassPanel.showToast('Copied teams to clipboard!');
        });
      });

      // Populate Roster Modal
      function populateRosterModal() {
        const rosters = window.StorageHub ? window.StorageHub.getRosters() : {};
        selectRoster.innerHTML = '';
        const names = Object.keys(rosters);
        if (names.length === 0) {
          selectRoster.innerHTML = '<option value="">(No saved classes)</option>';
        } else {
          names.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = `${name} (${rosters[name].length} students)`;
            if (name === currentRosterName) opt.selected = true;
            selectRoster.appendChild(opt);
          });
        }

        textareaNames.value = currentRoster.join('\n');
        inputRosterName.value = currentRosterName;
        if (rosterError) rosterError.style.display = 'none';
      }

      btnEditRoster.addEventListener('click', () => {
        populateRosterModal();
        modal.classList.add('is-open');
      });

      if (activeClassBadge) {
        activeClassBadge.addEventListener('click', () => {
          populateRosterModal();
          modal.classList.add('is-open');
        });
      }

      if (btnEmptyAdd) {
        btnEmptyAdd.addEventListener('click', () => {
          populateRosterModal();
          modal.classList.add('is-open');
        });
      }

      if (btnEmptySample) {
        btnEmptySample.addEventListener('click', () => {
          window.StorageHub.initDefaults();
          init();
          if (window.ClassPanel) window.ClassPanel.showToast('Loaded sample class!');
        });
      }

      btnCloseRoster.addEventListener('click', () => {
        modal.classList.remove('is-open');
      });

      selectRoster.addEventListener('change', () => {
        if (!selectRoster.value) return;
        window.StorageHub.setActiveRosterName(selectRoster.value);
        init();
        populateRosterModal();
      });

      btnSaveRoster.addEventListener('click', () => {
        if (rosterError) rosterError.style.display = 'none';
        const name = inputRosterName.value.trim();
        const names = window.StorageHub.parseNamesFromText(textareaNames.value);
        if (!name) {
          if (rosterError) {
            rosterError.textContent = 'Please enter a name for your class list.';
            rosterError.style.display = 'block';
          }
          inputRosterName.focus();
          return;
        }
        if (names.length === 0) {
          if (rosterError) {
            rosterError.textContent = 'Please enter at least one student name.';
            rosterError.style.display = 'block';
          }
          textareaNames.focus();
          return;
        }
        window.StorageHub.saveRoster(name, names);
        init();
        modal.classList.remove('is-open');
        if (window.ClassPanel) window.ClassPanel.showToast(`Saved ${names.length} students to "${name}"!`);
      });

      btnDeleteRoster.addEventListener('click', async () => {
        const rosterToDelete = selectRoster.value;
        if (!rosterToDelete) return;
        const confirmed = await window.ClassPanel.confirm({
          title: 'Delete Class List?',
          message: `Are you sure you want to delete "${rosterToDelete}"?`,
          confirmText: 'Delete Roster',
          danger: true
        });
        if (confirmed) {
          window.StorageHub.deleteRoster(rosterToDelete);
          init();
          populateRosterModal();
          if (window.ClassPanel) window.ClassPanel.showToast(`Deleted class "${rosterToDelete}".`);
        }
      });

      btnLoadSample.addEventListener('click', () => {
        window.StorageHub.initDefaults();
        init();
        populateRosterModal();
        if (window.ClassPanel) window.ClassPanel.showToast('Loaded sample class!');
      });

      init();
    })();