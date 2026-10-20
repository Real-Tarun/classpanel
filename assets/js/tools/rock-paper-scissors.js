(function() {
      const CHOICES = ['rock', 'paper', 'scissors'];
      const EMOJIS = { rock: '✊', paper: '✋', scissors: '✌️' };
      
      let wins = 0;
      let losses = 0;
      let ties = 0;
      let isPlaying = false;

      const playerHand = document.getElementById('player-hand');
      const computerHand = document.getElementById('computer-hand');
      const resultBanner = document.getElementById('result-banner');
      const selectMode = document.getElementById('select-game-mode');
      const modeSubtitle = document.getElementById('rps-mode-subtitle');
      const btnReset = document.getElementById('btn-reset-scores');
      const choiceButtons = document.querySelectorAll('.rps-choice-btn');

      const scoreWins = document.getElementById('score-wins');
      const scoreLosses = document.getElementById('score-losses');
      const scoreTies = document.getElementById('score-ties');
      const scoreRate = document.getElementById('score-rate');

      function updateStats() {
        scoreWins.textContent = wins;
        scoreLosses.textContent = losses;
        scoreTies.textContent = ties;
        const total = wins + losses + ties;
        const rate = total > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0;
        scoreRate.textContent = `${rate}%`;
      }

      function resetScores() {
        wins = 0;
        losses = 0;
        ties = 0;
        updateStats();
        playerHand.textContent = '✊';
        computerHand.textContent = '✊';
        resultBanner.textContent = 'Choose Rock, Paper, or Scissors to Play!';
        resultBanner.style.color = 'var(--text-primary)';
        choiceButtons.forEach(b => b.disabled = false);
        if (window.ClassPanel) window.ClassPanel.showToast('Scores reset!');
      }

      function checkSeriesWinner() {
        const mode = selectMode.value;
        if (mode === 'free') return;
        const target = Math.ceil(parseInt(mode, 10) / 2);

        if (wins >= target) {
          resultBanner.innerHTML = `🏆 <strong>Series Champion! You won the Best of ${mode}!</strong>`;
          resultBanner.style.color = 'var(--accent-emerald)';
          if (window.Confetti) window.Confetti.fire({ count: 180 });
          if (window.SoundFX) window.SoundFX.playFanfare();
          choiceButtons.forEach(b => b.disabled = true);
        } else if (losses >= target) {
          resultBanner.innerHTML = `🤖 <strong>Computer Won the Best of ${mode}!</strong>`;
          resultBanner.style.color = 'var(--accent-rose)';
          if (window.SoundFX) window.SoundFX.playBeep(true);
          choiceButtons.forEach(b => b.disabled = true);
        }
      }

      function playRound(playerChoice) {
        if (isPlaying) return;
        isPlaying = true;
        choiceButtons.forEach(b => b.disabled = true);

        // Reset to initial fist position and shake
        playerHand.textContent = '✊';
        computerHand.textContent = '✊';
        playerHand.classList.add('is-shaking');
        computerHand.classList.add('is-shaking');

        resultBanner.textContent = 'Rock... Paper... Scissors... Shoot!';
        resultBanner.style.color = 'var(--text-primary)';

        if (window.SoundFX) window.SoundFX.playClick();

        setTimeout(() => {
          playerHand.classList.remove('is-shaking');
          computerHand.classList.remove('is-shaking');

          const randIndex = Math.floor(Math.random() * 3);
          const computerChoice = CHOICES[randIndex];

          playerHand.textContent = EMOJIS[playerChoice];
          computerHand.textContent = EMOJIS[computerChoice];

          if (playerChoice === computerChoice) {
            ties++;
            resultBanner.textContent = `It's a Tie! Both picked ${playerChoice.toUpperCase()}`;
            resultBanner.style.color = 'var(--accent-amber)';
            if (window.SoundFX) window.SoundFX.playBeep(false);
          } else if (
            (playerChoice === 'rock' && computerChoice === 'scissors') ||
            (playerChoice === 'paper' && computerChoice === 'rock') ||
            (playerChoice === 'scissors' && computerChoice === 'paper')
          ) {
            wins++;
            resultBanner.textContent = `You Win! ${playerChoice.toUpperCase()} beats ${computerChoice.toUpperCase()}! 🎉`;
            resultBanner.style.color = 'var(--accent-emerald)';
            if (window.Confetti) window.Confetti.fire({ count: 80 });
            if (window.SoundFX) window.SoundFX.playFanfare();
          } else {
            losses++;
            resultBanner.textContent = `Computer Wins! ${computerChoice.toUpperCase()} beats ${playerChoice.toUpperCase()}`;
            resultBanner.style.color = 'var(--accent-rose)';
            if (window.SoundFX) window.SoundFX.playBeep(true);
          }

          updateStats();
          isPlaying = false;
          choiceButtons.forEach(b => b.disabled = false);
          checkSeriesWinner();
        }, 1200);
      }

      choiceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          playRound(btn.dataset.choice);
        });
      });

      selectMode.addEventListener('change', () => {
        const mode = selectMode.value;
        if (mode === 'free') {
          modeSubtitle.textContent = 'Free Play Mode • Unlimited Rounds';
        } else {
          modeSubtitle.textContent = `Tournament Series • Best of ${mode} Rounds (First to ${Math.ceil(parseInt(mode, 10) / 2)} wins)`;
        }
        resetScores();
      });

      btnReset.addEventListener('click', resetScores);
    })();