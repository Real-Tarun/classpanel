(function() {
    'use strict';
    let use24 = false;
    let autoIntervalId = null;
    let isSpeaking = false;

    const clockDisplay = document.getElementById('clock-display');
    const clockAmpm = document.getElementById('clock-ampm');
    const clockDate = document.getElementById('clock-date');
    const speakIndicator = document.getElementById('speak-indicator');
    const autoStatus = document.getElementById('auto-status');
    const autoMinDisplay = document.getElementById('auto-min-display');

    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    function updateClock() {
      const now = new Date();
      let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
      let ampm = h >= 12 ? 'PM' : 'AM';
      if (!use24) { h = h % 12 || 12; }
      clockDisplay.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
      clockAmpm.textContent = use24 ? '' : ampm;
      clockDate.textContent = DAYS[now.getDay()] + ', ' + MONTHS[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
    }

    function getTimeString() {
      const now = new Date();
      let h = now.getHours(), m = now.getMinutes();
      let suffix = '';
      if (!use24) {
        suffix = h >= 12 ? ' PM' : ' AM';
        h = h % 12 || 12;
      }
      return `The time is ${h}:${String(m).padStart(2,'0')}${suffix}`;
    }

    function speakTime() {
      if (!('speechSynthesis' in window)) {
        if (window.ClassPanel) window.ClassPanel.showToast('Text-to-speech not supported in this browser.');
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(getTimeString());
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => {
        isSpeaking = true;
        speakIndicator.classList.add('is-speaking');
      };
      utterance.onend = utterance.onerror = () => {
        isSpeaking = false;
        speakIndicator.classList.remove('is-speaking');
      };
      window.speechSynthesis.speak(utterance);
    }

    document.getElementById('btn-speak').addEventListener('click', speakTime);

    // Format toggle
    document.getElementById('btn-12h').addEventListener('click', () => {
      use24 = false;
      document.getElementById('btn-12h').classList.add('active');
      document.getElementById('btn-24h').classList.remove('active');
      updateClock();
    });
    document.getElementById('btn-24h').addEventListener('click', () => {
      use24 = true;
      document.getElementById('btn-24h').classList.add('active');
      document.getElementById('btn-12h').classList.remove('active');
      updateClock();
    });

    // Auto-announce
    document.getElementById('auto-interval').addEventListener('change', function() {
      clearInterval(autoIntervalId);
      const mins = parseInt(this.value);
      if (mins > 0) {
        autoIntervalId = setInterval(speakTime, mins * 60 * 1000);
        autoStatus.style.display = 'block';
        autoMinDisplay.textContent = mins;
      } else {
        autoStatus.style.display = 'none';
      }
    });

    // Init
    updateClock();
    setInterval(updateClock, 1000);
  })();