/**
 * ClassPanel.online — Common Site Architecture & Interactivity
 * Theme switcher, Audio controller, Modal system, PWA Registration, Quick Switcher
 */

(function () {
  'use strict';

  // --- 1. Service Worker Registration & Auto-Update ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          if (reg.update) reg.update();

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('ClassPanel: New version installed, auto-applying...');
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch(err => console.debug('ClassPanel ServiceWorker notice:', err));

      let isRefreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!isRefreshing) {
          isRefreshing = true;
          window.location.reload();
        }
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_ACTIVATED') {
          console.log('ClassPanel: Updated to', event.data.cache);
        }
      });

      // When tab is reopened or focused, check for fresh updates automatically
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          navigator.serviceWorker.getRegistration().then(reg => {
            if (reg && reg.update) reg.update();
          });
        }
      });
    });
  }

  // --- 2. Theme Management ---
  // --- 2. Theme Management ---
  const THEME_KEY = 'cp_theme';
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    // Brand-new visitors with no saved preference must ALWAYS see 'light' by default
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme, false);
  }

  function setTheme(theme, save = true) {
    document.documentElement.setAttribute('data-theme', theme);
    if (save) localStorage.setItem(THEME_KEY, theme);
    updateThemeToggleButtons(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next, true);
    if (window.SoundFX) window.SoundFX.playClick();
  }

  function updateThemeToggleButtons(theme) {
    const btns = document.querySelectorAll('[data-action="toggle-theme"]');
    btns.forEach(btn => {
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
      if (theme === 'dark') {
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        `;
      } else {
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        `;
      }
    });
  }

  // --- 3. Sound Mute Controller ---
  function updateAudioToggleButtons() {
    const isMuted = window.SoundFX ? window.SoundFX.isMuted : false;
    const btns = document.querySelectorAll('[data-action="toggle-sound"]');
    btns.forEach(btn => {
      btn.setAttribute('aria-label', isMuted ? 'Unmute audio' : 'Mute audio');
      if (isMuted) {
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        `;
        btn.classList.add('is-muted');
      } else {
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        `;
        btn.classList.remove('is-muted');
      }
    });
  }

  // --- 4. Toast Notification System ---
  function showToast(message, duration = 3200) {
    let container = document.getElementById('cp-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cp-toast-container';
      container.style.cssText = `
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: var(--text-primary);
      color: var(--text-inverse);
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-md, 14px);
      font-size: 0.925rem;
      font-weight: 600;
      box-shadow: var(--shadow-lg, 0 10px 15px rgba(0,0,0,0.2));
      opacity: 0;
      transform: translateY(12px);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
    `;
    toast.textContent = message;
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    // Auto dismiss
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --- 5. Custom In-App Dialog System (Zero Native Browser Popups) ---
  function createModalBackdrop() {
    let backdrop = document.getElementById('cp-global-dialog-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'cp-global-dialog-backdrop';
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  function confirmDialog({ title = 'Please Confirm', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      const backdrop = createModalBackdrop();
      backdrop.innerHTML = `
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="modal-close-btn" data-action="dialog-cancel" aria-label="Close">✕</button>
          </div>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6; font-size: 1rem;">${message}</p>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button class="preset-chip" data-action="dialog-cancel" style="padding: 0.6rem 1.25rem;">${cancelText}</button>
            <button class="btn-primary" data-action="dialog-confirm" style="padding: 0.6rem 1.4rem; border-radius: var(--radius-md); font-weight: 700; ${danger ? 'background: var(--accent-rose); border-color: var(--accent-rose);' : ''}">${confirmText}</button>
          </div>
        </div>
      `;
      backdrop.classList.add('is-open');

      function cleanup(res) {
        backdrop.classList.remove('is-open');
        resolve(res);
      }

      backdrop.onclick = (e) => {
        if (e.target.closest('[data-action="dialog-confirm"]')) {
          cleanup(true);
        } else if (e.target.closest('[data-action="dialog-cancel"]') || e.target === backdrop) {
          cleanup(false);
        }
      };
    });
  }

  function promptDialog({ title = 'Enter Value', message = '', label = '', defaultValue = '', placeholder = '', confirmText = 'Set', cancelText = 'Cancel', inputType = 'text' }) {
    return new Promise((resolve) => {
      const backdrop = createModalBackdrop();
      backdrop.innerHTML = `
        <div class="modal-card" style="max-width: 460px;">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="modal-close-btn" data-action="dialog-cancel" aria-label="Close">✕</button>
          </div>
          ${message ? `<p style="color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">${message}</p>` : ''}
          ${label ? `<label style="display: block; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; color: var(--text-primary);">${label}</label>` : ''}
          <div style="margin-bottom: 1.5rem;">
            <input type="${inputType}" id="cp-dialog-input" class="input-text" value="${defaultValue}" placeholder="${placeholder}">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button class="preset-chip" data-action="dialog-cancel" style="padding: 0.6rem 1.25rem;">${cancelText}</button>
            <button class="btn-primary" data-action="dialog-confirm" style="padding: 0.6rem 1.4rem; border-radius: var(--radius-md); font-weight: 700;">${confirmText}</button>
          </div>
        </div>
      `;
      backdrop.classList.add('is-open');
      const input = document.getElementById('cp-dialog-input');
      if (input) {
        setTimeout(() => { input.focus(); input.select(); }, 50);
        input.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            cleanup(input.value);
          } else if (e.key === 'Escape') {
            cleanup(null);
          }
        };
      }

      function cleanup(res) {
        backdrop.classList.remove('is-open');
        resolve(res);
      }

      backdrop.onclick = (e) => {
        if (e.target.closest('[data-action="dialog-confirm"]')) {
          cleanup(input ? input.value : '');
        } else if (e.target.closest('[data-action="dialog-cancel"]') || e.target === backdrop) {
          cleanup(null);
        }
      };
    });
  }

  function alertDialog({ title = 'Notice', message = '', buttonText = 'OK' }) {
    return new Promise((resolve) => {
      const backdrop = createModalBackdrop();
      backdrop.innerHTML = `
        <div class="modal-card" style="max-width: 440px;">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="modal-close-btn" data-action="dialog-close" aria-label="Close">✕</button>
          </div>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6; font-size: 1rem;">${message}</p>
          <div style="display: flex; justify-content: flex-end;">
            <button class="btn-primary" data-action="dialog-close" style="padding: 0.6rem 1.5rem; border-radius: var(--radius-md); font-weight: 700;">${buttonText}</button>
          </div>
        </div>
      `;
      backdrop.classList.add('is-open');

      function cleanup() {
        backdrop.classList.remove('is-open');
        resolve();
      }

      backdrop.onclick = (e) => {
        if (e.target.closest('[data-action="dialog-close"]') || e.target === backdrop) {
          cleanup();
        }
      };
    });
  }

  // Intercept any accidental browser popup calls
  window.alert = function (msg) {
    alertDialog({ title: 'Notice', message: String(msg) });
  };
  window.confirm = function (msg) {
    console.warn('Native window.confirm is disabled on ClassPanel. Use ClassPanel.confirm() instead:', msg);
    return false;
  };
  window.prompt = function (msg, def) {
    console.warn('Native window.prompt is disabled on ClassPanel. Use ClassPanel.prompt() instead:', msg);
    return null;
  };

  // --- 6. Quick Tools Search / Command Palette ---
  const TOOLS_LIST = [
    { title: 'Classroom Timer', url: '/tools/classroom-timer/', icon: '⏱️', desc: 'Giant countdown timer & stopwatch with audio alarms' },
    { title: 'Random Name Picker', url: '/tools/random-name-picker/', icon: '🎯', desc: 'Pick student names with wheel spin & celebration' },
    { title: 'Group Generator', url: '/tools/group-generator/', icon: '👥', desc: 'Split class roster into balanced teams & tables' },
    { title: 'Official Exam Timer', url: '/tools/exam-timer/', icon: '📝', desc: 'Formal test timer with reading time & milestone warnings' },
    { title: 'Sensory & Calming Timer', url: '/tools/sensory-timer/', icon: '🫧', desc: 'Relaxing visual timers for mindfulness & transitions' },
    { title: 'Classroom Clocks', url: '/tools/clocks/', icon: '🕒', desc: 'Interactive analog & digital clocks for time teaching' },
    { title: 'Random Number Generator', url: '/tools/random-number-generator/', icon: '🎲', desc: 'Generate numbers, ranges, and unique sequences' },
    { title: 'Dice & Chance Games', url: '/tools/chance-games/', icon: '🪙', desc: '3D dice roller, coin flip, and decision spinner' },
    { title: 'Multi-Team Tally Counter', url: '/tools/tally-counter/', icon: '🔢', desc: 'Scoreboard & classroom attendance tally tracker' },
    { title: 'Presentation & Speech Timer', url: '/tools/presentation-timer/', icon: '🚦', desc: 'Speaker timer with green, yellow, red pacing lights' },
    { title: 'Fun Race Timers', url: '/tools/race-timers/', icon: '🏁', desc: 'Animated animal races for timed classroom drills' },
    { title: 'Holiday Countdown Timers', url: '/tools/holiday-timers/', icon: '🎄', desc: 'Seasonal timers for breaks, holidays, and milestones' }
  ];

  function createQuickSearchModal() {
    if (document.getElementById('quick-search-modal')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'quick-search-modal';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal-card" style="max-width: 600px;">
        <div class="modal-header">
          <h3 class="modal-title">Quick Tool Switcher</h3>
          <button class="modal-close-btn" data-action="close-search" aria-label="Close">✕</button>
        </div>
        <div style="position: relative; margin-bottom: 1.25rem;">
          <input type="text" id="quick-search-input" class="input-text" placeholder="Type to find a tool (e.g. Timer, Picker, Dice)..." autofocus>
        </div>
        <div id="quick-search-results" style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem;"></div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const input = document.getElementById('quick-search-input');
    const resultsContainer = document.getElementById('quick-search-results');

    function renderResults(query = '') {
      const q = query.toLowerCase().trim();
      const filtered = TOOLS_LIST.filter(t => 
        t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      );

      if (filtered.length === 0) {
        resultsContainer.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">No matching classroom tools found.</div>`;
        return;
      }

      resultsContainer.innerHTML = filtered.map(t => `
        <a href="${t.url}" style="display: flex; align-items: center; gap: 0.85rem; padding: 0.75rem 1rem; border-radius: var(--radius-md); background: var(--bg-surface-subtle); color: var(--text-primary); text-decoration: none; transition: background 0.15s;">
          <span style="font-size: 1.5rem;">${t.icon}</span>
          <div style="flex: 1;">
            <div style="font-weight: 700;">${t.title}</div>
            <div style="font-size: 0.825rem; color: var(--text-muted);">${t.desc}</div>
          </div>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">Open →</span>
        </a>
      `).join('');
    }

    input.addEventListener('input', (e) => renderResults(e.target.value));
    renderResults();

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop || e.target.closest('[data-action="close-search"]')) {
        closeQuickSearch();
      }
    });
  }

  function openQuickSearch() {
    createQuickSearchModal();
    const modal = document.getElementById('quick-search-modal');
    modal.classList.add('is-open');
    const input = document.getElementById('quick-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  function closeQuickSearch() {
    const modal = document.getElementById('quick-search-modal');
    if (modal) modal.classList.remove('is-open');
  }

  // Hotkey listener (Ctrl+K, Cmd+K, or '/')
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const modal = document.getElementById('quick-search-modal');
      if (modal && modal.classList.contains('is-open')) {
        closeQuickSearch();
      } else {
        openQuickSearch();
      }
    } else if (e.key === 'Escape') {
      closeQuickSearch();
    }
  });

  // --- 7. Global DOM Listeners initialization ---
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Theme Toggle Buttons
    document.addEventListener('click', (e) => {
      const themeBtn = e.target.closest('[data-action="toggle-theme"]');
      if (themeBtn) {
        toggleTheme();
        return;
      }

      const soundBtn = e.target.closest('[data-action="toggle-sound"]');
      if (soundBtn) {
        if (window.SoundFX) {
          window.SoundFX.toggleMute();
          updateAudioToggleButtons();
          if (!window.SoundFX.isMuted) {
            window.SoundFX.playClick();
          }
        }
        return;
      }

      const searchBtn = e.target.closest('[data-action="open-search"]');
      if (searchBtn) {
        openQuickSearch();
        return;
      }

      const projectorBtn = e.target.closest('[data-action="toggle-projector"]');
      if (projectorBtn) {
        if (window.Projector) {
          window.Projector.toggle();
        }
        return;
      }
    });

    updateAudioToggleButtons();
  });

  // Expose global ClassPanel helpers
  window.ClassPanel = {
    showToast,
    openQuickSearch,
    closeQuickSearch,
    setTheme,
    toggleTheme,
    confirm: confirmDialog,
    prompt: promptDialog,
    alert: alertDialog
  };

})();
