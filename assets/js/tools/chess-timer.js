(function() {
    'use strict';
    let time1 = 300, time2 = 300;
    let increment = 0;
    let baseTime = 300;
    let activePlayer = null; // 1 or 2, null = not started
    let isRunning = false;
    let isPaused = false;
    let timerId = null;
    let gameOver = false;

    const panel1 = document.getElementById('panel-1');
    const panel2 = document.getElementById('panel-2');
    const disp1 = document.getElementById('time-1');
    const disp2 = document.getElementById('time-2');
    const btnStart = document.getElementById('btn-start');
    const btnPause = document.getElementById('btn-pause');
    const btnReset = document.getElementById('btn-reset');
    const incBadge = document.getElementById('increment-badge');

    function fmt(secs) {
      const m = Math.floor(Math.abs(secs) / 60);
      const s = Math.abs(secs) % 60;
      return (secs < 0 ? '-' : '') + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    }

    function updateDisplays() {
      disp1.textContent = fmt(time1);
      disp2.textContent = fmt(time2);
    }

    function updateStartButton() {
      if (gameOver) {
        btnStart.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg><span>Play Again</span>`;
        btnStart.disabled = false;
        btnStart.style.opacity = '1';
        return;
      }
      if (!isRunning) {
        btnStart.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Start Game</span>`;
        btnStart.disabled = false;
        btnStart.style.opacity = '1';
        btnStart.removeAttribute('title');
        return;
      }
      if (isPaused) {
        btnStart.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>Resume (Space)</span>`;
        btnStart.disabled = false;
        btnStart.style.opacity = '1';
        return;
      }
      // Running - clicking this central button switches clocks!
      const nextP = activePlayer === 1 ? 'Player 2' : 'Player 1';
      const curP = activePlayer === 1 ? 'Player 1' : 'Player 2';
      btnStart.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
        <span>End Move → ${nextP} (Space)</span>
      `;
      btnStart.disabled = false;
      btnStart.style.opacity = '1';
      btnStart.setAttribute('title', `Click to end ${curP}'s turn and switch to ${nextP} (or tap Space)`);
    }

    function setActivePlayer(p) {
      activePlayer = p;
      panel1.classList.toggle('is-active', p === 1);
      panel2.classList.toggle('is-active', p === 2);
      updateStartButton();
    }

    function applyPreset(totalSecs, inc) {
      baseTime = totalSecs;
      increment = inc;
      time1 = totalSecs;
      time2 = totalSecs;
      updateDisplays();
      incBadge.textContent = inc > 0 ? `+${inc}s increment per move (Fischer clock)` : 'No increment (sudden death)';
      resetGame(false);
    }

    function startGame() {
      if (gameOver) return;
      isRunning = true;
      isPaused = false;
      if (activePlayer === null) setActivePlayer(1);
      btnPause.disabled = false;
      updateStartButton();
      timerId = setInterval(tick, 1000);
    }

    function tick() {
      if (!isRunning || isPaused || gameOver) return;
      if (activePlayer === 1) {
        time1--;
        if (time1 <= 0) { time1 = 0; endGame(1); }
      } else if (activePlayer === 2) {
        time2--;
        if (time2 <= 0) { time2 = 0; endGame(2); }
      }
      updateDisplays();
    }

    function switchPlayer() {
      if (!isRunning || isPaused || gameOver) return;
      // Add increment to the player who just moved
      if (activePlayer === 1) { time1 += increment; setActivePlayer(2); }
      else if (activePlayer === 2) { time2 += increment; setActivePlayer(1); }
      updateDisplays();
      if (window.SoundFX) window.SoundFX.playClick();
    }

    function pauseGame() {
      if (!isRunning || gameOver) return;
      isPaused = !isPaused;
      btnPause.querySelector('span').textContent = isPaused ? 'Resume' : 'Pause';
      if (isPaused) {
        panel1.classList.remove('is-active');
        panel2.classList.remove('is-active');
      } else {
        setActivePlayer(activePlayer);
      }
      updateStartButton();
    }

    function endGame(loser) {
      gameOver = true;
      isRunning = false;
      clearInterval(timerId);
      const winner = loser === 1 ? 2 : 1;
      document.getElementById(`panel-${loser}`).classList.add('is-lost');
      document.getElementById(`panel-${loser}`).classList.remove('is-active');
      updateStartButton();
      if (window.ClassPanel) window.ClassPanel.showToast(`Player ${winner} wins on time!`);
    }

    function resetGame(full = true) {
      gameOver = false;
      isRunning = false;
      isPaused = false;
      clearInterval(timerId);
      activePlayer = null;
      time1 = baseTime;
      time2 = baseTime;
      updateDisplays();
      panel1.classList.remove('is-active', 'is-lost');
      panel2.classList.remove('is-active', 'is-lost');
      btnPause.disabled = true;
      btnPause.querySelector('span').textContent = 'Pause';
      updateStartButton();
    }

    // Preset buttons
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.getAttribute('data-preset');
        if (val === 'custom') {
          document.getElementById('custom-input').style.display = 'flex';
        } else {
          document.getElementById('custom-input').style.display = 'none';
          const [secs, inc] = val.split(':').map(Number);
          applyPreset(secs, inc);
        }
      });
    });

    document.getElementById('apply-custom').addEventListener('click', () => {
      const mins = parseInt(document.getElementById('custom-min').value) || 10;
      const inc = parseInt(document.getElementById('custom-inc').value) || 0;
      applyPreset(mins * 60, inc);
    });

    // Panel tap
    panel1.addEventListener('click', () => {
      if (!isRunning && !gameOver) { startGame(); return; }
      if (activePlayer === 1) switchPlayer();
    });
    panel2.addEventListener('click', () => {
      if (!isRunning && !gameOver) { startGame(); setActivePlayer(2); return; }
      if (activePlayer === 2) switchPlayer();
    });
    panel1.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); panel1.click(); }});
    panel2.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); panel2.click(); }});

    function handleStartOrSwitch() {
      if (gameOver) {
        resetGame(true);
        startGame();
        return;
      }
      if (!isRunning) {
        startGame();
        return;
      }
      if (isPaused) {
        pauseGame();
        return;
      }
      switchPlayer();
    }

    btnStart.addEventListener('click', handleStartOrSwitch);
    btnPause.addEventListener('click', pauseGame);
    btnReset.addEventListener('click', () => resetGame(true));

    // Spacebar to start or switch clocks
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input,textarea,select')) return;
      if (e.code === 'Space') { e.preventDefault(); handleStartOrSwitch(); }
    });

    updateDisplays();
  })();