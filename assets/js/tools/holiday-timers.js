(function () {
      let targetDate = new Date();
      let eventName = 'Summer Vacation';
      let hasCelebrated = false;

      const eventTitle = document.getElementById('holiday-event-title');
      const targetDateEl = document.getElementById('holiday-target-date');
      const selectHoliday = document.getElementById('select-holiday');
      const inputEventName = document.getElementById('input-event-name');
      const inputEventDate = document.getElementById('input-event-date');
      const inputEventTime = document.getElementById('input-event-time');
      const btnApplyCustom = document.getElementById('btn-apply-custom');

      const unitDays = document.getElementById('unit-days');
      const unitHours = document.getElementById('unit-hours');
      const unitMinutes = document.getElementById('unit-minutes');
      const unitSeconds = document.getElementById('unit-seconds');

      // Broadcast elements
      const broadcastOverlay = document.getElementById('broadcast-overlay');
      const btnBroadcastMode = document.getElementById('btn-broadcast-mode');
      const btnTriggerBroadcast = document.getElementById('btn-trigger-broadcast');
      const btnCloseBroadcast = document.getElementById('btn-close-broadcast');
      const broadcastTitleText = document.getElementById('broadcast-title-text');
      const broadcastSubText = document.getElementById('broadcast-sub-text');
      const bUnitDays = document.getElementById('b-unit-days');
      const bUnitHours = document.getElementById('b-unit-hours');
      const bUnitMinutes = document.getElementById('b-unit-minutes');
      const bUnitSeconds = document.getElementById('b-unit-seconds');

      const btnCelebrate = document.getElementById('btn-celebrate');
      const btnShareCountdown = document.getElementById('btn-share-countdown');

      // Date helper: format YYYY-MM-DD
      function toDateInputValue(date) {
        const local = new Date(date);
        local.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return local.toISOString().slice(0, 10);
      }

      function getNextOccurrence(monthIndex, dayOfMonth, hour = 0, minute = 0) {
        const now = new Date();
        let target = new Date(now.getFullYear(), monthIndex, dayOfMonth, hour, minute, 0);
        if (target <= now) {
          target = new Date(now.getFullYear() + 1, monthIndex, dayOfMonth, hour, minute, 0);
        }
        return target;
      }

      function getNextFriday5PM() {
        const now = new Date();
        const day = now.getDay(); // 0 Sun, 5 Fri, 6 Sat
        let daysUntilFriday = (5 - day + 7) % 7;
        const target = new Date(now);
        target.setDate(now.getDate() + daysUntilFriday);
        target.setHours(17, 0, 0, 0);
        if (target <= now) {
          target.setDate(target.getDate() + 7);
        }
        return target;
      }

      function setCountdown(name, date) {
        eventName = name;
        targetDate = new Date(date);
        hasCelebrated = false;

        eventTitle.textContent = `${eventName} Countdown`;
        const dateString = targetDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
          ` at ${targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        targetDateEl.textContent = `Target Date: ${dateString}`;

        broadcastTitleText.textContent = `${eventName}`;
        broadcastSubText.textContent = `Counting down to ${dateString}`;

        inputEventName.value = name;
        inputEventDate.value = toDateInputValue(targetDate);
        const hh = String(targetDate.getHours()).padStart(2, '0');
        const mm = String(targetDate.getMinutes()).padStart(2, '0');
        inputEventTime.value = `${hh}:${mm}`;

        updateTicker();
      }

      function handlePresetSelection() {
        const val = selectHoliday.value;
        const year = new Date().getFullYear();

        switch (val) {
          case 'summer':
            setCountdown('☀️ Summer Vacation', getNextOccurrence(5, 15, 15, 0));
            break;
          case 'winter':
            setCountdown('❄️ Winter Break', getNextOccurrence(11, 20, 15, 0));
            break;
          case 'halloween':
            setCountdown('🎃 Halloween', getNextOccurrence(9, 31, 0, 0));
            break;
          case 'thanksgiving':
            setCountdown('🦃 Thanksgiving', getNextOccurrence(10, 26, 0, 0));
            break;
          case 'springbreak':
            setCountdown('🌸 Spring Break', getNextOccurrence(2, 20, 15, 0));
            break;
          case 'newyear':
            setCountdown('🎆 New Year\'s Day', getNextOccurrence(0, 1, 0, 0));
            break;
          case 'weekend':
            setCountdown('🥳 Next Weekend', getNextFriday5PM());
            break;
          case 'custom':
            break;
        }
      }

      function applyCustomEvent() {
        const name = inputEventName.value.trim() || 'Custom Event';
        const dateVal = inputEventDate.value;
        const timeVal = inputEventTime.value || '00:00';

        if (!dateVal) {
          if (window.ClassPanel) window.ClassPanel.showToast('Please select a target date.');
          return;
        }

        const dateObj = new Date(`${dateVal}T${timeVal}:00`);
        if (isNaN(dateObj.getTime())) {
          if (window.ClassPanel) window.ClassPanel.showToast('Invalid date/time format.');
          return;
        }

        setCountdown(name, dateObj);
        selectHoliday.value = 'custom';
        if (window.ClassPanel) window.ClassPanel.showToast(`Countdown set to ${name}!`);
      }

      function updateTicker() {
        const now = new Date().getTime();
        const dist = targetDate.getTime() - now;

        if (dist <= 0) {
          unitDays.textContent = '00';
          unitHours.textContent = '00';
          unitMinutes.textContent = '00';
          unitSeconds.textContent = '00';

          bUnitDays.textContent = '00';
          bUnitHours.textContent = '00';
          bUnitMinutes.textContent = '00';
          bUnitSeconds.textContent = '00';

          if (!hasCelebrated && dist > -10000) {
            hasCelebrated = true;
            if (window.SoundFX) window.SoundFX.playFanfare();
            if (window.Confetti) window.Confetti.fire({ count: 200 });
            if (window.ClassPanel) window.ClassPanel.showToast(`🎉 ${eventName} has arrived!`);
          }
          return;
        }

        const days = Math.floor(dist / (1000 * 60 * 60 * 24));
        const hours = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((dist % (1000 * 60)) / 1000);

        const dStr = String(days).padStart(2, '0');
        const hStr = String(hours).padStart(2, '0');
        const mStr = String(minutes).padStart(2, '0');
        const sStr = String(seconds).padStart(2, '0');

        unitDays.textContent = dStr;
        unitHours.textContent = hStr;
        unitMinutes.textContent = mStr;
        unitSeconds.textContent = sStr;

        bUnitDays.textContent = dStr;
        bUnitHours.textContent = hStr;
        bUnitMinutes.textContent = mStr;
        bUnitSeconds.textContent = sStr;
      }

      function openBroadcastMode() {
        broadcastOverlay.classList.add('active');
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }

      function closeBroadcastMode() {
        broadcastOverlay.classList.remove('active');
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }

      function copyShareLink() {
        const params = new URLSearchParams();
        params.set('title', eventName);
        params.set('date', targetDate.toISOString());
        const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

        navigator.clipboard.writeText(shareUrl).then(() => {
          if (window.ClassPanel) window.ClassPanel.showToast('✅ Shareable link copied to clipboard!');
          else alert('Link copied: ' + shareUrl);
        }).catch(() => {
          prompt('Copy this countdown URL:', shareUrl);
        });
      }

      // Check URL parameters on load
      function parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const titleParam = params.get('title');
        const dateParam = params.get('date');

        if (dateParam) {
          const parsed = new Date(dateParam);
          if (!isNaN(parsed.getTime())) {
            const title = titleParam ? titleParam.trim() : 'Event';
            selectHoliday.value = 'custom';
            setCountdown(title, parsed);
            return true;
          }
        }
        return false;
      }

      selectHoliday.addEventListener('change', handlePresetSelection);
      btnApplyCustom.addEventListener('click', applyCustomEvent);
      if (btnBroadcastMode) btnBroadcastMode.addEventListener('click', openBroadcastMode);
      if (btnTriggerBroadcast) btnTriggerBroadcast.addEventListener('click', openBroadcastMode);
      if (btnCloseBroadcast) btnCloseBroadcast.addEventListener('click', closeBroadcastMode);
      if (btnShareCountdown) btnShareCountdown.addEventListener('click', copyShareLink);

      btnCelebrate.addEventListener('click', () => {
        if (window.SoundFX) window.SoundFX.playFanfare();
        if (window.Confetti) window.Confetti.fire({ count: 180 });
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && broadcastOverlay.classList.contains('active')) {
          closeBroadcastMode();
        }
      });

      // Initialize
      const hadParams = parseUrlParams();
      if (!hadParams) {
        setCountdown('☀️ Summer Vacation', getNextOccurrence(5, 15, 15, 0));
      }

      setInterval(updateTicker, 1000);
    })();