(function () {
      let currentRosterName = '';
      let allStudents = [];
      let pool = [];
      let isSpinning = false;
      let currentAngle = 0;

      const canvas = document.getElementById('wheel-canvas');
      const ctx = canvas.getContext('2d');
      const btnSpin = document.getElementById('btn-spin');
      const wheelCap = document.getElementById('wheel-cap');
      const winnerName = document.getElementById('winner-name');
      const countRemaining = document.getElementById('count-remaining');
      const checkRemove = document.getElementById('check-remove-picked');
      const btnResetPool = document.getElementById('btn-reset-pool');
      const subtitle = document.getElementById('roster-info-subtitle');

      // Modal elements
      const modal = document.getElementById('roster-modal');
      const btnOpenRoster = document.getElementById('btn-open-roster');
      const btnCloseRoster = document.getElementById('btn-close-roster');
      const selectRoster = document.getElementById('select-roster');
      const inputRosterName = document.getElementById('input-roster-name');
      const textareaNames = document.getElementById('textarea-names');
      const btnSaveRoster = document.getElementById('btn-save-roster');
      const btnDeleteRoster = document.getElementById('btn-delete-roster');
      const btnLoadSample = document.getElementById('btn-load-sample');

      // Quick preset buttons
      const btnPresetClass = document.getElementById('btn-preset-class');
      const btnPresetFood = document.getElementById('btn-preset-food');
      const btnPresetFirst = document.getElementById('btn-preset-first');
      const btnPresetYesNo = document.getElementById('btn-preset-yesno');

      const COLORS = [
        '#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', 
        '#10B981', '#06B6D4', '#EF4444', '#8B5CF6',
        '#3B82F6', '#14B8A6', '#F97316', '#6366F1'
      ];

      const emptyCard = document.getElementById('empty-state-card');
      const wheelActiveArea = document.getElementById('wheel-active-area');
      const countTotal = document.getElementById('count-total');
      const btnBottomEdit = document.getElementById('btn-bottom-edit');
      const btnEmptyAdd = document.getElementById('btn-empty-add-names');
      const btnEmptySample = document.getElementById('btn-empty-load-sample');
      const rosterError = document.getElementById('roster-form-error');

      function loadRosterData() {
        currentRosterName = window.StorageHub.getActiveRosterName() || '';
        allStudents = window.StorageHub.getActiveRosterList();
        pool = [...allStudents];
        updateUI();
        drawWheel();
      }

      function updateUI() {
        countRemaining.textContent = pool.length;
        if (countTotal) countTotal.textContent = allStudents.length;

        if (allStudents.length === 0) {
          emptyCard.style.display = 'block';
          wheelActiveArea.style.display = 'none';
          subtitle.textContent = 'No Items Added Yet';
        } else {
          emptyCard.style.display = 'none';
          wheelActiveArea.style.display = 'block';
          subtitle.textContent = `Active List: ${currentRosterName} • ${pool.length} of ${allStudents.length} Choices Left`;
        }
      }

      function drawWheel() {
        const numSlices = pool.length;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = centerX - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (numSlices === 0) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.fillStyle = '#E2E8F0';
          ctx.fill();
          ctx.fillStyle = '#64748B';
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('All choices picked! Click Reset.', centerX, centerY);
          return;
        }

        const sliceAngle = (2 * Math.PI) / numSlices;

        for (let i = 0; i < numSlices; i++) {
          const angle = currentAngle + i * sliceAngle;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
          ctx.closePath();
          ctx.fillStyle = COLORS[i % COLORS.length];
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Slice Label
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(angle + sliceAngle / 2);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 18px system-ui, sans-serif';
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 4;
          
          let name = pool[i];
          if (name.length > 15) name = name.substring(0, 13) + '...';
          ctx.fillText(name, radius - 24, 6);
          ctx.restore();
        }
      }

      function spinWheel() {
        if (isSpinning || pool.length === 0) {
          if (pool.length === 0) resetPool();
          return;
        }

        isSpinning = true;
        winnerName.textContent = "Spinning...";
        winnerName.style.color = "var(--text-muted)";

        const spinTime = 3800; // ms
        const startAngle = currentAngle;
        const randomRotations = 5 + Math.random() * 5;
        const targetAngle = startAngle + randomRotations * 2 * Math.PI + Math.random() * (2 * Math.PI);
        const startTime = performance.now();
        let lastTickSlice = -1;

        function animate(now) {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / spinTime);
          
          // Ease out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          currentAngle = startAngle + (targetAngle - startAngle) * ease;

          // Sound tick on passing slices
          const sliceAngle = (2 * Math.PI) / pool.length;
          const normAngle = (currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
          const currentSlice = Math.floor(normAngle / sliceAngle);
          if (currentSlice !== lastTickSlice) {
            lastTickSlice = currentSlice;
            if (window.SoundFX) window.SoundFX.playClick();
          }

          drawWheel();

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            finalizeSpin();
          }
        }

        requestAnimationFrame(animate);
      }

      function finalizeSpin() {
        isSpinning = false;
        const numSlices = pool.length;
        const sliceAngle = (2 * Math.PI) / numSlices;
        
        // Pointer is at top (-PI/2)
        const pointerAngle = (3 * Math.PI) / 2;
        let relativeAngle = (pointerAngle - currentAngle) % (2 * Math.PI);
        if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

        const winningIndex = Math.floor(relativeAngle / sliceAngle) % numSlices;
        const winner = pool[winningIndex];

        winnerName.textContent = `🎉 ${winner}!`;
        winnerName.style.color = "var(--primary)";

        if (window.SoundFX) window.SoundFX.playFanfare();
        if (window.Confetti) window.Confetti.fire({ count: 150 });
        if (window.ClassPanel) window.ClassPanel.showToast(`Selected: ${winner}`);

        if (checkRemove.checked) {
          pool.splice(winningIndex, 1);
          setTimeout(() => {
            updateUI();
            drawWheel();
          }, 1200);
        }
      }

      function resetPool() {
        pool = [...allStudents];
        updateUI();
        drawWheel();
        winnerName.textContent = "Ready to Spin!";
        winnerName.style.color = "var(--primary)";
        if (window.SoundFX) window.SoundFX.playClick();
      }

      // Populate Roster Modal
      function populateRosterModal() {
        const rosters = window.StorageHub.getRosters();
        selectRoster.innerHTML = '';
        const names = Object.keys(rosters);
        if (names.length === 0) {
          selectRoster.innerHTML = '<option value="">(No saved lists)</option>';
        } else {
          names.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = `${name} (${rosters[name].length} entries)`;
            if (name === currentRosterName) opt.selected = true;
            selectRoster.appendChild(opt);
          });
        }

        textareaNames.value = allStudents.join('\n');
        inputRosterName.value = currentRosterName;
        if (rosterError) rosterError.style.display = 'none';
      }

      // Event Listeners
      btnSpin.addEventListener('click', spinWheel);
      wheelCap.addEventListener('click', spinWheel);
      btnResetPool.addEventListener('click', resetPool);

      btnOpenRoster.addEventListener('click', () => {
        populateRosterModal();
        modal.classList.add('is-open');
      });

      if (btnBottomEdit) {
        btnBottomEdit.addEventListener('click', () => {
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
          loadRosterData();
          if (window.ClassPanel) window.ClassPanel.showToast('Sample Class loaded!');
        });
      }

      btnCloseRoster.addEventListener('click', () => {
        modal.classList.remove('is-open');
      });

      selectRoster.addEventListener('change', () => {
        if (!selectRoster.value) return;
        window.StorageHub.setActiveRosterName(selectRoster.value);
        loadRosterData();
        populateRosterModal();
      });

      btnSaveRoster.addEventListener('click', () => {
        if (rosterError) rosterError.style.display = 'none';
        const name = inputRosterName.value.trim();
        const names = window.StorageHub.parseNamesFromText(textareaNames.value);
        if (!name) {
          if (rosterError) {
            rosterError.textContent = 'Please enter a name for your list.';
            rosterError.style.display = 'block';
          }
          inputRosterName.focus();
          return;
        }
        if (names.length === 0) {
          if (rosterError) {
            rosterError.textContent = 'Please enter at least one item.';
            rosterError.style.display = 'block';
          }
          textareaNames.focus();
          return;
        }
        window.StorageHub.saveRoster(name, names);
        loadRosterData();
        modal.classList.remove('is-open');
        if (window.ClassPanel) window.ClassPanel.showToast(`Saved ${names.length} entries to "${name}"!`);
      });

      btnDeleteRoster.addEventListener('click', async () => {
        const rosterToDelete = selectRoster.value;
        if (!rosterToDelete) return;
        const confirmed = await window.ClassPanel.confirm({
          title: 'Delete List?',
          message: `Are you sure you want to delete "${rosterToDelete}"?`,
          confirmText: 'Delete List',
          danger: true
        });
        if (confirmed) {
          window.StorageHub.deleteRoster(rosterToDelete);
          loadRosterData();
          populateRosterModal();
          if (window.ClassPanel) window.ClassPanel.showToast(`Deleted list "${rosterToDelete}".`);
        }
      });

      btnLoadSample.addEventListener('click', () => {
        window.StorageHub.initDefaults();
        loadRosterData();
        populateRosterModal();
        if (window.ClassPanel) window.ClassPanel.showToast('Loaded sample class!');
      });

      // Quick preset fillers
      if (btnPresetClass) {
        btnPresetClass.addEventListener('click', () => {
          inputRosterName.value = 'Period 1 (Classroom)';
          textareaNames.value = 'Alex Rivera\nBella Chen\nCarlos Gomez\nDavid Kim\nEmma Watson\nFatima Al-Sayed\nGabriel Santos\nHannah Abbott\nIan Malcolm\nJulia Roberts\nKevin Zhang\nLayla Vance\nMarcus Brody\nNadia Coman\nOliver Queen\nPenny Lane';
        });
      }

      if (btnPresetFood) {
        btnPresetFood.addEventListener('click', () => {
          inputRosterName.value = 'What to Eat Tonight?';
          textareaNames.value = 'Pizza 🍕\nTacos 🌮\nSushi 🍣\nBurgers & Fries 🍔\nThai Curry 🍛\nPasta 🍝\nFresh Salad Bowl 🥗\nChinese Takeout 🥡';
        });
      }

      if (btnPresetFirst) {
        btnPresetFirst.addEventListener('click', () => {
          inputRosterName.value = 'Who Goes First?';
          textareaNames.value = 'Player 1 🔴\nPlayer 2 🔵\nPlayer 3 🟢\nPlayer 4 🟡';
        });
      }

      if (btnPresetYesNo) {
        btnPresetYesNo.addEventListener('click', () => {
          inputRosterName.value = 'Yes / No / Maybe';
          textareaNames.value = 'Definitely YES! ✅\nNo Way ❌\nAsk Again Later ⏳\nMaybe 🤔\n100% Absolutely! 🚀';
        });
      }

      // Spacebar to spin
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') {
          e.preventDefault();
          spinWheel();
        }
      });

      loadRosterData();
    })();