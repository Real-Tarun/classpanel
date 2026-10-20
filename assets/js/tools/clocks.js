(function () {
      let is24Hour = false;
      let showDigital = true;

      const clockFace = document.getElementById('analog-clock');
      const handHour = document.getElementById('hand-hour');
      const handMinute = document.getElementById('hand-minute');
      const handSecond = document.getElementById('hand-second');
      const digitalTime = document.getElementById('digital-time');
      const clockDate = document.getElementById('clock-date');
      const btnToggleDigital = document.getElementById('btn-toggle-digital');
      const btnToggle24h = document.getElementById('btn-toggle-24h');

      // Place 1-12 numbers on the clock face
      function renderClockNumbers() {
        const radius = 130;
        const centerX = 160;
        const centerY = 160;

        for (let num = 1; num <= 12; num++) {
          const angle = (num * 30) * (Math.PI / 180);
          const x = centerX + radius * Math.sin(angle) - 15;
          const y = centerY - radius * Math.cos(angle) - 15;

          const numEl = document.createElement('div');
          numEl.className = 'clock-number';
          numEl.textContent = num;
          numEl.style.left = `${x}px`;
          numEl.style.top = `${y}px`;
          clockFace.appendChild(numEl);
        }
      }

      function updateClock() {
        const now = new Date();
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();

        // Degrees
        const secondDeg = seconds * 6;
        const minuteDeg = minutes * 6 + seconds * 0.1;
        const hourDeg = (hours % 12) * 30 + minutes * 0.5;

        handSecond.style.transform = `rotate(${secondDeg}deg)`;
        handMinute.style.transform = `rotate(${minuteDeg}deg)`;
        handHour.style.transform = `rotate(${hourDeg}deg)`;

        // Digital display
        if (showDigital) {
          const opt = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: !is24Hour
          };
          digitalTime.textContent = now.toLocaleTimeString([], opt);
        } else {
          digitalTime.textContent = "-- : -- : --";
        }

        clockDate.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }

      btnToggleDigital.addEventListener('click', () => {
        showDigital = !showDigital;
        btnToggleDigital.textContent = showDigital ? 'Hide Digital (Quiz Mode)' : 'Show Digital Readout';
        btnToggleDigital.classList.toggle('active', !showDigital);
        updateClock();
      });

      btnToggle24h.addEventListener('click', () => {
        is24Hour = !is24Hour;
        btnToggle24h.textContent = is24Hour ? '12-Hour Format' : '24-Hour Format';
        btnToggle24h.classList.toggle('active', is24Hour);
        updateClock();
      });

      renderClockNumbers();
      setInterval(updateClock, 1000);
      updateClock();
    })();