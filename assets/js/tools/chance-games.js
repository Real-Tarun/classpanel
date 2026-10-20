(function () {
      // ----------------------------------------------------
      // Tabs Navigation
      // ----------------------------------------------------
      const tabWheel = document.getElementById('tab-wheel');
      const tabChests = document.getElementById('tab-chests');
      const tabEightball = document.getElementById('tab-eightball');

      const secWheel = document.getElementById('wheel-section');
      const secChests = document.getElementById('chests-section');
      const secEightball = document.getElementById('eightball-section');

      const actWheel = document.getElementById('wheel-actions');
      const actChests = document.getElementById('chests-actions');
      const actEightball = document.getElementById('eightball-actions');

      function switchTab(activeTab, activeSec, activeAct) {
        [tabWheel, tabChests, tabEightball].forEach(t => t.classList.remove('active'));
        [secWheel, secChests, secEightball].forEach(s => s.style.display = 'none');
        [actWheel, actChests, actEightball].forEach(a => a.style.display = 'none');

        activeTab.classList.add('active');
        activeSec.style.display = 'flex';
        activeAct.style.display = 'flex';

        if (window.SoundFX && window.SoundFX.playButtonClick) {
          window.SoundFX.playButtonClick();
        } else if (window.SoundFX) {
          window.SoundFX.playClick();
        }
      }

      tabWheel.addEventListener('click', () => switchTab(tabWheel, secWheel, actWheel));
      tabChests.addEventListener('click', () => switchTab(tabChests, secChests, actChests));
      tabEightball.addEventListener('click', () => switchTab(tabEightball, secEightball, actEightball));

      // ----------------------------------------------------
      // 1. LUCKY PRIZE WHEEL LOGIC
      // ----------------------------------------------------
      const canvas = document.getElementById('wheel-canvas');
      const ctx = canvas.getContext('2d');
      const btnSpinWheel = document.getElementById('btn-spin-wheel');
      const wheelCenterBtn = document.getElementById('wheel-center-btn');
      const winnerBanner = document.getElementById('wheel-winner-banner');
      const winnerName = document.getElementById('wheel-winner-name');
      const pointer = document.getElementById('wheel-pointer');
      const btnEditWheel = document.getElementById('btn-edit-wheel-items');

      const WHEEL_PRESETS = {
        rewards: [
          'Homework Pass',
          'Sit With Friend',
          'Extra 5m Recess',
          'Line Leader',
          'Teacher Assistant',
          'Music DJ',
          'Mystery Prize',
          'No Shoes Day'
        ],
        dares: [
          'Tell a Joke',
          'Sing a Song',
          'Do 10 Jumping Jacks',
          'Funny Accent',
          'Robot Voice',
          'Compliment Friend',
          'Freeze for 20s',
          'Dance Moves'
        ],
        lunch: [
          'Pizza 🍕',
          'Tacos 🌮',
          'Burgers 🍔',
          'Sushi 🍣',
          'Pasta 🍝',
          'Sandwiches 🥪',
          'Noodles 🍜',
          'Ice Cream 🍨'
        ]
      };

      const SLICE_COLORS = [
        '#6366F1', '#EC4899', '#3B82F6', '#10B981',
        '#F59E0B', '#8B5CF6', '#14B8A6', '#F43F5E'
      ];

      let wheelItems = [...WHEEL_PRESETS.rewards];
      let currentAngle = 0; // radians
      let isSpinning = false;

      function drawWheel() {
        const dpr = window.devicePixelRatio || 1;
        const width = 720;
        const height = 720;
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const radius = cx - 20;
        const numSlices = wheelItems.length;
        const arc = (2 * Math.PI) / numSlices;

        for (let i = 0; i < numSlices; i++) {
          const sliceAngle = currentAngle + i * arc;

          // Draw slice
          ctx.beginPath();
          ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, radius, sliceAngle, sliceAngle + arc);
          ctx.closePath();
          ctx.fill();

          // Border between slices
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Draw slice text
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(sliceAngle + arc / 2);
          ctx.textAlign = 'right';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 4;

          const text = wheelItems[i];
          const maxTextWidth = radius - 70;
          ctx.fillText(text, radius - 30, 8, maxTextWidth);
          ctx.restore();
        }

        // Outer rim
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#0F172A';
        ctx.stroke();
      }

      function spinWheel() {
        if (isSpinning) return;
        isSpinning = true;
        winnerBanner.style.display = 'none';

        if (window.SoundFX && window.SoundFX.playButtonClick) {
          window.SoundFX.playButtonClick();
        } else if (window.SoundFX) {
          window.SoundFX.playClick();
        }

        const fullSpins = 4 + Math.random() * 3;
        const randomTargetAngle = Math.random() * 2 * Math.PI;
        const totalRotation = fullSpins * 2 * Math.PI + randomTargetAngle;
        const duration = 4000; // ms
        const startTime = performance.now();
        const startAngle = currentAngle;
        let lastTickSlice = -1;

        function animateSpin(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          currentAngle = startAngle + totalRotation * ease;
          drawWheel();

          // Needle tick sound on crossing slices
          const numSlices = wheelItems.length;
          const sliceArc = (2 * Math.PI) / numSlices;
          // Pointer is at top (-PI/2)
          const normalizedAngle = (1.5 * Math.PI - (currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          const currentSlice = Math.floor(normalizedAngle / sliceArc);

          if (currentSlice !== lastTickSlice) {
            lastTickSlice = currentSlice;
            if (pointer) {
              pointer.style.transform = 'translateX(-50%) rotate(18deg)';
              setTimeout(() => { if (pointer) pointer.style.transform = 'translateX(-50%) rotate(0deg)'; }, 60);
            }
            if (window.SoundFX && progress < 0.95) {
              window.SoundFX.playBeep(false);
            }
          }

          if (progress < 1) {
            requestAnimationFrame(animateSpin);
          } else {
            isSpinning = false;
            // Determine winner
            const winningItem = wheelItems[currentSlice % wheelItems.length];
            winnerName.textContent = winningItem;
            winnerBanner.style.display = 'block';

            if (window.SoundFX && window.SoundFX.playFanfare) {
              window.SoundFX.playFanfare();
            }
            if (window.Confetti && window.Confetti.fire) {
              window.Confetti.fire({ count: 90 });
            }
          }
        }

        requestAnimationFrame(animateSpin);
      }

      btnSpinWheel.addEventListener('click', spinWheel);
      wheelCenterBtn.addEventListener('click', spinWheel);

      // Preset buttons
      document.querySelectorAll('.btn-wheel-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          if (isSpinning) return;
          document.querySelectorAll('.btn-wheel-preset').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const presetKey = btn.dataset.preset;
          wheelItems = [...WHEEL_PRESETS[presetKey]];
          drawWheel();
          winnerBanner.style.display = 'none';
        });
      });

      // ----------------------------------------------------
      // Lucky Wheel Modal & Edit Logic
      // ----------------------------------------------------
      const wheelModal = document.getElementById('wheel-edit-modal');
      const btnCloseWheelModal = document.getElementById('btn-close-wheel-modal');
      const btnCancelWheelModal = document.getElementById('btn-cancel-wheel-modal');
      const btnSaveWheelModal = document.getElementById('btn-save-wheel-modal');
      const wheelItemsInput = document.getElementById('wheel-items-input');

      function openWheelModal() {
        wheelItemsInput.value = wheelItems.join('\n');
        wheelModal.classList.add('is-open');
        setTimeout(() => wheelItemsInput.focus(), 50);
      }

      function closeWheelModal() {
        wheelModal.classList.remove('is-open');
      }

      btnEditWheel.addEventListener('click', openWheelModal);
      btnCloseWheelModal.addEventListener('click', closeWheelModal);
      btnCancelWheelModal.addEventListener('click', closeWheelModal);
      wheelModal.addEventListener('click', (e) => {
        if (e.target === wheelModal) closeWheelModal();
      });

      // Modal preset helper buttons
      document.querySelectorAll('.btn-modal-wheel-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = btn.dataset.preset;
          if (preset === 'yesno') {
            wheelItemsInput.value = 'YES\nNO\nYES\nNO';
          } else if (preset === 'numbers') {
            wheelItemsInput.value = '1\n2\n3\n4\n5\n6\n7\n8';
          } else if (WHEEL_PRESETS[preset]) {
            wheelItemsInput.value = WHEEL_PRESETS[preset].join('\n');
          }
        });
      });

      btnSaveWheelModal.addEventListener('click', () => {
        const raw = wheelItemsInput.value;
        const parsed = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        if (parsed.length < 2) {
          if (window.ClassPanel && window.ClassPanel.showToast) {
            window.ClassPanel.showToast('Please enter at least 2 wheel items.', 'error');
          } else {
            alert('Please enter at least 2 wheel items.');
          }
          return;
        }

        wheelItems = parsed;
        document.querySelectorAll('.btn-wheel-preset').forEach(b => b.classList.remove('active'));
        drawWheel();
        winnerBanner.style.display = 'none';
        closeWheelModal();

        if (window.ClassPanel && window.ClassPanel.showToast) {
          window.ClassPanel.showToast(`Lucky Wheel updated with ${parsed.length} options!`, 'success');
        }
      });

      drawWheel();

      // ----------------------------------------------------
      // 2. MYSTERY CHESTS (3D LUCKY BOXES) LOGIC
      // ----------------------------------------------------
      const chestsGrid = document.getElementById('chests-grid');
      const btnShuffleChests = document.getElementById('btn-shuffle-chests');
      const btnResetChests = document.getElementById('btn-reset-chests');
      const btnOpenAll = document.getElementById('btn-open-all-chests');
      const btnOpenAllInline = document.getElementById('btn-open-all-chests-inline');
      const btnEditChests = document.getElementById('btn-edit-chests');

      // Stepper & Quick Count buttons
      const btnChestMinus = document.getElementById('btn-chest-minus');
      const btnChestPlus = document.getElementById('btn-chest-plus');
      const chestCountDisplay = document.getElementById('chest-count-display');
      const quickBoxesBtns = document.querySelectorAll('.btn-quick-boxes');

      // Modal elements
      const chestsModal = document.getElementById('chests-edit-modal');
      const btnCloseChestsModal = document.getElementById('btn-close-chests-modal');
      const btnCancelChestsModal = document.getElementById('btn-cancel-chests-modal');
      const btnSaveChestsModal = document.getElementById('btn-save-chests-modal');
      const btnModalChestMinus = document.getElementById('btn-modal-chest-minus');
      const btnModalChestPlus = document.getElementById('btn-modal-chest-plus');
      const modalChestCountVal = document.getElementById('modal-chest-count-val');
      const modalChestsList = document.getElementById('modal-chests-list');
      const btnAddChestItem = document.getElementById('btn-add-chest-item');

      const CHEST_TEMPLATES = {
        classroom: [
          { icon: '⭐', label: 'Grand Prize: Homework Pass' },
          { icon: '👑', label: 'VIP Teacher Assistant' },
          { icon: '🍬', label: 'Sweet Treat or Sticker' },
          { icon: '🎵', label: 'Pick Today\'s Playlist' },
          { icon: '🌱', label: 'Sit With A Friend' },
          { icon: '🏆', label: 'First In Line Privilege' },
          { icon: '🎮', label: 'Extra 5m Free Time' },
          { icon: '🎒', label: 'No Shoes Day' },
          { icon: '🌟', label: 'Bonus Credit Point' },
          { icon: '🎈', label: 'Class DJ for 1 Song' },
          { icon: '🍀', label: 'Free Pass on 1 Question' },
          { icon: '🎁', label: 'Mystery Desk Surprise' }
        ],
        dares: [
          { icon: '🎭', label: 'Talk In Robot Voice' },
          { icon: '🎤', label: 'Sing First Line of A Song' },
          { icon: '🤸', label: 'Do 10 High Knees' },
          { icon: '😂', label: 'Tell Your Funniest Joke' },
          { icon: '🧊', label: 'Statue Freeze for 20s' },
          { icon: '🦆', label: 'Do The Duck Walk' },
          { icon: '💬', label: 'Compliment 3 Classmates' },
          { icon: '🎩', label: 'Moonwalk Across Room' },
          { icon: '🐱', label: 'Meow Like A Cat' },
          { icon: '🦖', label: 'T-Rex Roar Demonstration' },
          { icon: '🕺', label: 'Show Best Dance Move' },
          { icon: '🤫', label: 'Whisper Only For 3 Mins' }
        ],
        points: [
          { icon: '⭐', label: '⭐ MEGA 100 POINTS' },
          { icon: '✨', label: '+50 Team Points' },
          { icon: '💎', label: '+30 Team Points' },
          { icon: '🌟', label: '+20 Team Points' },
          { icon: '🪙', label: '+10 Team Points' },
          { icon: '🔥', label: '+5 Team Points' },
          { icon: '⚡', label: 'Double Next Round' },
          { icon: '💥', label: 'Swap Team Points' },
          { icon: '🎯', label: 'Precision +15 Points' },
          { icon: '🛡️', label: 'Point Protection Shield' },
          { icon: '🎲', label: 'Roll 1d20 For Points' },
          { icon: '💣', label: 'Zero Points (Oops!)' }
        ],
        treats: [
          { icon: '🍬', label: 'Lollipop / Candy' },
          { icon: '🍫', label: 'Chocolate Bar' },
          { icon: '🍪', label: 'Fresh Cookie' },
          { icon: '🍩', label: 'Glazed Donut' },
          { icon: '🧁', label: 'Mini Cupcake' },
          { icon: '🍿', label: 'Popcorn Snack' },
          { icon: '🍦', label: 'Ice Cream Treat' },
          { icon: '🍎', label: 'Crisp Red Apple' },
          { icon: '🥨', label: 'Pretzel Bag' },
          { icon: '🧃', label: 'Fruit Juice Box' },
          { icon: '🍓', label: 'Fresh Berry Cup' },
          { icon: '🍭', label: 'Rainbow Swirl Candy' }
        ]
      };

      const POOL_ICONS = ['⭐', '🎁', '👑', '🎉', '🌟', '💎', '🔥', '🏆', '🍬', '🎯', '🍀', '✨'];

      let chestRewards = [...CHEST_TEMPLATES.classroom];
      let activeBoxCount = 5;

      function updateBoxCountUI() {
        if (chestCountDisplay) chestCountDisplay.textContent = activeBoxCount;
        if (modalChestCountVal) modalChestCountVal.textContent = activeBoxCount;

        if (btnChestMinus) btnChestMinus.disabled = (activeBoxCount <= 2);
        if (btnChestPlus) btnChestPlus.disabled = (activeBoxCount >= 12);
        if (btnModalChestMinus) btnModalChestMinus.disabled = (activeBoxCount <= 2);
        if (btnModalChestPlus) btnModalChestPlus.disabled = (activeBoxCount >= 12);

        quickBoxesBtns.forEach(btn => {
          btn.classList.toggle('active', parseInt(btn.dataset.count, 10) === activeBoxCount);
        });
      }

      function setBoxCount(newCount) {
        newCount = Math.max(2, Math.min(12, newCount));
        activeBoxCount = newCount;
        
        // If chestRewards has fewer items than activeBoxCount, expand it
        while (chestRewards.length < activeBoxCount) {
          const idx = chestRewards.length;
          chestRewards.push({
            icon: POOL_ICONS[idx % POOL_ICONS.length],
            label: `Surprise Perk #${idx + 1}`
          });
        }

        updateBoxCountUI();
        renderChests();
      }

      function renderChests() {
        chestsGrid.innerHTML = '';
        const currentItems = chestRewards.slice(0, activeBoxCount);

        currentItems.forEach((item, index) => {
          const card = document.createElement('div');
          card.className = 'chest-card';
          card.dataset.index = index;
          card.innerHTML = `
            <div class="chest-box-wrap">
              <img src="/assets/images/mystery-box.png" alt="Mystery Box" class="chest-img">
              <span class="chest-badge">#${index + 1}</span>
            </div>
            <div class="chest-reward">
              <div class="chest-reward-icon">${item.icon}</div>
              <div class="chest-reward-label">${item.label}</div>
            </div>
          `;

          card.addEventListener('click', () => {
            if (card.classList.contains('opened')) return;
            openChest(card, item);
          });

          chestsGrid.appendChild(card);
        });

        updateBoxCountUI();
      }

      function openChest(card, item) {
        if (!card || card.classList.contains('opened')) return;
        card.classList.add('opened');

        if (window.SoundFX && window.SoundFX.playFanfare) {
          window.SoundFX.playFanfare();
        } else if (window.SoundFX) {
          window.SoundFX.playClick();
        }

        if (window.Confetti && window.Confetti.fire) {
          window.Confetti.fire({ count: 40 });
        }
      }

      function shuffleChests() {
        const cards = document.querySelectorAll('.chest-card');
        cards.forEach(c => c.classList.add('shuffling'));

        if (window.SoundFX && window.SoundFX.playButtonClick) {
          window.SoundFX.playButtonClick();
        }

        setTimeout(() => {
          // Shuffle the active slice
          const slice = chestRewards.slice(0, activeBoxCount);
          for (let i = slice.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [slice[i], slice[j]] = [slice[j], slice[i]];
          }
          // Put shuffled slice back
          for (let i = 0; i < activeBoxCount; i++) {
            chestRewards[i] = slice[i];
          }
          renderChests();
        }, 500);
      }

      btnShuffleChests.addEventListener('click', shuffleChests);
      btnResetChests.addEventListener('click', () => {
        renderChests();
        if (window.SoundFX) window.SoundFX.playClick();
      });

      const openAllAction = () => {
        document.querySelectorAll('.chest-card').forEach((card, idx) => {
          if (!card.classList.contains('opened')) {
            setTimeout(() => openChest(card, chestRewards[idx]), idx * 140);
          }
        });
      };
      btnOpenAll.addEventListener('click', openAllAction);
      if (btnOpenAllInline) btnOpenAllInline.addEventListener('click', openAllAction);

      // Box count stepper buttons
      btnChestMinus.addEventListener('click', () => setBoxCount(activeBoxCount - 1));
      btnChestPlus.addEventListener('click', () => setBoxCount(activeBoxCount + 1));
      quickBoxesBtns.forEach(btn => {
        btn.addEventListener('click', () => setBoxCount(parseInt(btn.dataset.count, 10)));
      });

      // --- Mystery Chests Edit Modal Logic ---
      function populateModalChestsList(items) {
        modalChestsList.innerHTML = '';
        items.forEach((item, idx) => {
          const row = document.createElement('div');
          row.className = 'modal-chest-row';
          row.innerHTML = `
            <span style="font-weight: 800; font-size: 0.85rem; color: var(--text-muted); width: 28px;">#${idx + 1}</span>
            <input type="text" class="input-text chest-row-icon" value="${item.icon}" style="width: 48px; text-align: center; font-size: 1.25rem; padding: 0.4rem;" maxlength="3" title="Emoji Icon">
            <input type="text" class="input-text chest-row-label" value="${item.label}" style="flex: 1; padding: 0.4rem 0.75rem;" placeholder="Reward name...">
            <button type="button" class="modal-close-btn btn-delete-chest-row" style="width: 32px; height: 32px; font-size: 0.85rem;" title="Delete this box">✕</button>
          `;

          row.querySelector('.btn-delete-chest-row').addEventListener('click', () => {
            const rows = modalChestsList.querySelectorAll('.modal-chest-row');
            if (rows.length <= 2) {
              if (window.ClassPanel && window.ClassPanel.showToast) {
                window.ClassPanel.showToast('Minimum 2 mystery boxes required.', 'error');
              }
              return;
            }
            row.remove();
            refreshModalRowIndexes();
          });

          modalChestsList.appendChild(row);
        });
        refreshModalRowIndexes();
      }

      function refreshModalRowIndexes() {
        const rows = modalChestsList.querySelectorAll('.modal-chest-row');
        rows.forEach((r, i) => {
          const badge = r.querySelector('span');
          if (badge) badge.textContent = `#${i + 1}`;
        });
        modalChestCountVal.textContent = rows.length;
        if (btnModalChestMinus) btnModalChestMinus.disabled = (rows.length <= 2);
        if (btnModalChestPlus) btnModalChestPlus.disabled = (rows.length >= 12);
      }

      function openChestsModal() {
        populateModalChestsList(chestRewards.slice(0, activeBoxCount));
        modalChestCountVal.textContent = activeBoxCount;
        chestsModal.classList.add('is-open');
      }

      function closeChestsModal() {
        chestsModal.classList.remove('is-open');
      }

      btnEditChests.addEventListener('click', openChestsModal);
      btnCloseChestsModal.addEventListener('click', closeChestsModal);
      btnCancelChestsModal.addEventListener('click', closeChestsModal);
      chestsModal.addEventListener('click', (e) => {
        if (e.target === chestsModal) closeChestsModal();
      });

      btnAddChestItem.addEventListener('click', () => {
        const rows = modalChestsList.querySelectorAll('.modal-chest-row');
        if (rows.length >= 12) {
          if (window.ClassPanel && window.ClassPanel.showToast) {
            window.ClassPanel.showToast('Maximum 12 mystery boxes supported.', 'error');
          }
          return;
        }
        const newIdx = rows.length;
        const icon = POOL_ICONS[newIdx % POOL_ICONS.length];
        const row = document.createElement('div');
        row.className = 'modal-chest-row';
        row.innerHTML = `
          <span style="font-weight: 800; font-size: 0.85rem; color: var(--text-muted); width: 28px;">#${newIdx + 1}</span>
          <input type="text" class="input-text chest-row-icon" value="${icon}" style="width: 48px; text-align: center; font-size: 1.25rem; padding: 0.4rem;" maxlength="3" title="Emoji Icon">
          <input type="text" class="input-text chest-row-label" value="Surprise Mystery Perk #${newIdx + 1}" style="flex: 1; padding: 0.4rem 0.75rem;" placeholder="Reward name...">
          <button type="button" class="modal-close-btn btn-delete-chest-row" style="width: 32px; height: 32px; font-size: 0.85rem;" title="Delete this box">✕</button>
        `;

        row.querySelector('.btn-delete-chest-row').addEventListener('click', () => {
          const current = modalChestsList.querySelectorAll('.modal-chest-row');
          if (current.length <= 2) return;
          row.remove();
          refreshModalRowIndexes();
        });

        modalChestsList.appendChild(row);
        refreshModalRowIndexes();
        modalChestsList.scrollTop = modalChestsList.scrollHeight;
      });

      btnModalChestMinus.addEventListener('click', () => {
        const rows = modalChestsList.querySelectorAll('.modal-chest-row');
        if (rows.length > 2) {
          rows[rows.length - 1].remove();
          refreshModalRowIndexes();
        }
      });

      btnModalChestPlus.addEventListener('click', () => {
        btnAddChestItem.click();
      });

      // Modal template chips
      document.querySelectorAll('.btn-modal-chest-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = btn.dataset.preset;
          if (CHEST_TEMPLATES[preset]) {
            const count = Math.max(2, Math.min(12, parseInt(modalChestCountVal.textContent, 10) || 5));
            populateModalChestsList(CHEST_TEMPLATES[preset].slice(0, count));
          }
        });
      });

      btnSaveChestsModal.addEventListener('click', () => {
        const rows = modalChestsList.querySelectorAll('.modal-chest-row');
        const updated = [];
        rows.forEach(r => {
          const icon = r.querySelector('.chest-row-icon').value.trim() || '🎁';
          const label = r.querySelector('.chest-row-label').value.trim() || 'Mystery Surprise';
          updated.push({ icon, label });
        });

        if (updated.length < 2) {
          if (window.ClassPanel && window.ClassPanel.showToast) {
            window.ClassPanel.showToast('Please provide at least 2 mystery boxes.', 'error');
          }
          return;
        }

        activeBoxCount = updated.length;
        chestRewards = updated;
        renderChests();
        closeChestsModal();

        if (window.ClassPanel && window.ClassPanel.showToast) {
          window.ClassPanel.showToast(`Updated with ${updated.length} mystery boxes!`, 'success');
        }
      });

      // Global Escape listener for modals
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (wheelModal && wheelModal.classList.contains('is-open')) closeWheelModal();
          if (chestsModal && chestsModal.classList.contains('is-open')) closeChestsModal();
        }
      });

      renderChests();

      // ----------------------------------------------------
      // 3. MAGIC 8-BALL ORACLE LOGIC
      // ----------------------------------------------------
      const magicBall = document.getElementById('magic-ball');
      const ballIdle8 = document.getElementById('ball-idle-8');
      const ballWindow = document.getElementById('ball-window');
      const ballTriangle = document.getElementById('ball-triangle');
      const ballOracleText = document.getElementById('ball-oracle-text');
      const btnShake8ball = document.getElementById('btn-shake-8ball');
      const eightballQuestion = document.getElementById('eightball-question');
      const eightballHint = document.getElementById('eightball-hint');

      const EIGHT_BALL_ANSWERS = [
        // Affirmative
        { text: 'IT IS CERTAIN', type: 'yes' },
        { text: 'WITHOUT A DOUBT', type: 'yes' },
        { text: 'DEFINITELY YES', type: 'yes' },
        { text: 'YOU MAY RELY ON IT', type: 'yes' },
        { text: 'AS I SEE IT, YES', type: 'yes' },
        { text: 'MOST LIKELY', type: 'yes' },
        { text: 'OUTLOOK GOOD', type: 'yes' },
        { text: 'YES', type: 'yes' },
        { text: 'SIGNS POINT TO YES', type: 'yes' },
        // Non-committal
        { text: 'REPLY HAZY, TRY AGAIN', type: 'neutral' },
        { text: 'ASK AGAIN LATER', type: 'neutral' },
        { text: 'BETTER NOT TELL YOU NOW', type: 'neutral' },
        { text: 'CANNOT PREDICT NOW', type: 'neutral' },
        { text: 'CONCENTRATE AND ASK AGAIN', type: 'neutral' },
        // Negative
        { text: 'DON\'T COUNT ON IT', type: 'no' },
        { text: 'MY REPLY IS NO', type: 'no' },
        { text: 'MY SOURCES SAY NO', type: 'no' },
        { text: 'OUTLOOK NOT SO GOOD', type: 'no' },
        { text: 'VERY DOUBTFUL', type: 'no' }
      ];

      let isShakingBall = false;

      function shake8Ball() {
        if (isShakingBall) return;
        isShakingBall = true;

        if (window.SoundFX && window.SoundFX.playButtonClick) {
          window.SoundFX.playButtonClick();
        } else if (window.SoundFX) {
          window.SoundFX.playClick();
        }

        magicBall.classList.add('shaking');
        ballTriangle.style.opacity = '0';
        ballTriangle.style.transform = 'scale(0.7) rotate(-15deg)';
        eightballHint.textContent = 'Consulting cosmic oracle...';

        setTimeout(() => {
          magicBall.classList.remove('shaking');
          ballIdle8.style.display = 'none';
          ballWindow.style.display = 'flex';

          const pick = EIGHT_BALL_ANSWERS[Math.floor(Math.random() * EIGHT_BALL_ANSWERS.length)];
          ballOracleText.textContent = pick.text;

          // Float in answer
          setTimeout(() => {
            ballTriangle.style.opacity = '1';
            ballTriangle.style.transform = 'scale(1) rotate(0deg)';
            isShakingBall = false;
            eightballHint.textContent = 'Oracle has spoken! Tap again to ask another.';

            if (pick.type === 'yes' && window.Confetti) {
              window.Confetti.fire({ count: 30 });
            }
            if (window.SoundFX && window.SoundFX.playGentleChime) {
              window.SoundFX.playGentleChime();
            }
          }, 100);
        }, 800);
      }

      magicBall.addEventListener('click', shake8Ball);
      btnShake8ball.addEventListener('click', shake8Ball);
      eightballQuestion.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') shake8Ball();
      });

    })();