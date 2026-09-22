/**
 * ClassPanel i18n Engine v1.0
 * - Defaults to English for all new visitors regardless of browser locale
 * - Persists chosen language in localStorage (key: cp_lang)
 * - Injects a globe-icon language switcher into every page header
 * - Supports adding new languages by adding new dictionary files
 * - Does NOT auto-detect browser language
 */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────────────── */
  const LANG_KEY = 'cp_lang';
  const DEFAULT_LANG = 'en';

  const SUPPORTED_LANGS = {
    en: { label: '🇬🇧 English',  dict: () => window.CP_I18N_EN },
    es: { label: '🇪🇸 Español',  dict: () => window.CP_I18N_ES },
    fr: { label: '🇫🇷 Français', dict: () => window.CP_I18N_FR },
    de: { label: '🇩🇪 Deutsch',  dict: () => window.CP_I18N_DE },
    // To add Portuguese: pt: { label: '🇧🇷 Português', dict: () => window.CP_I18N_PT },
  };

  /* ── URL helpers ─────────────────────────────────────────── */
  // Path prefix for each lang (/en is the root /)
  function getLangPrefix(lang) {
    return lang === 'en' ? '' : '/' + lang;
  }

  // Detect current lang from URL (/es/tools/... → 'es')
  function detectLangFromURL() {
    const path = window.location.pathname;
    for (const code of Object.keys(SUPPORTED_LANGS)) {
      if (code === 'en') continue;
      if (path === '/' + code || path.startsWith('/' + code + '/')) return code;
    }
    return 'en';
  }

  // Strip language prefix from a path (/es/tools/foo/ → /tools/foo/)
  function stripLangPrefix(path) {
    for (const code of Object.keys(SUPPORTED_LANGS)) {
      if (code === 'en') continue;
      if (path === '/' + code) return '/';
      if (path.startsWith('/' + code + '/')) return path.slice(code.length + 1);
    }
    return path;
  }

  // Get the equivalent URL for a given language
  function getUrlForLang(targetLang) {
    const path = window.location.pathname;
    const cleanPath = stripLangPrefix(path);
    const prefix = getLangPrefix(targetLang);
    return prefix + (cleanPath || '/');
  }

  /* ── Current language ────────────────────────────────────── */
  // Priority: URL path > localStorage > default (en)
  const urlLang = detectLangFromURL();
  const storedLang = localStorage.getItem(LANG_KEY);
  const currentLang = SUPPORTED_LANGS[urlLang] ? urlLang
                    : (SUPPORTED_LANGS[storedLang] ? storedLang : DEFAULT_LANG);

  /* ── Translation function ────────────────────────────────── */
  function t(key, fallback) {
    const dict = SUPPORTED_LANGS[currentLang]?.dict?.() || {};
    const enDict = SUPPORTED_LANGS['en']?.dict?.() || {};
    return dict[key] || enDict[key] || fallback || key;
  }

  /* ── Language switcher UI ────────────────────────────────── */
  function buildSwitcher() {
    const wrapper = document.createElement('div');
    wrapper.className = 'cp-lang-switcher';
    wrapper.setAttribute('role', 'navigation');
    wrapper.setAttribute('aria-label', 'Language selector');

    const btn = document.createElement('button');
    btn.className = 'action-btn cp-lang-btn';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('title', 'Change language');
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <span class="cp-lang-label">${SUPPORTED_LANGS[currentLang]?.label?.split(' ')[0] || '🌐'}</span>
    `;

    const dropdown = document.createElement('div');
    dropdown.className = 'cp-lang-dropdown';
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-label', 'Select language');

    Object.entries(SUPPORTED_LANGS).forEach(([code, info]) => {
      const item = document.createElement('a');
      item.href = getUrlForLang(code);
      item.className = 'cp-lang-option' + (code === currentLang ? ' is-active' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', code === currentLang ? 'true' : 'false');
      item.setAttribute('hreflang', code);
      item.textContent = info.label;
      item.addEventListener('click', (e) => {
        e.preventDefault();
        switchLang(code);
      });
      dropdown.appendChild(item);
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(dropdown);

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('is-open');
      wrapper.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });

    // Close on outside click
    document.addEventListener('click', () => {
      wrapper.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        wrapper.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    return wrapper;
  }

  function switchLang(code) {
    if (!SUPPORTED_LANGS[code]) return;
    localStorage.setItem(LANG_KEY, code);
    const targetUrl = getUrlForLang(code);
    window.location.href = targetUrl;
  }

  /* ── Inject switcher into every page header ──────────────── */
  function injectSwitcher() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    // Inject before the first existing action button
    const switcher = buildSwitcher();
    headerActions.insertBefore(switcher, headerActions.firstChild);
  }

  /* ── Sync <html lang=""> attribute ──────────────────────── */
  function syncHtmlLang() {
    if (document.documentElement.getAttribute('lang') !== currentLang) {
      document.documentElement.setAttribute('lang', currentLang);
    }
  }

  /* ── Public API ──────────────────────────────────────────── */
  window.I18n = {
    t,
    currentLang,
    switchLang,
    getUrlForLang,
    SUPPORTED_LANGS,
    DEFAULT_LANG,
  };

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    syncHtmlLang();
    // Save URL-detected lang to localStorage to remember preference
    if (urlLang !== 'en' || !storedLang) {
      localStorage.setItem(LANG_KEY, currentLang);
    }
    injectSwitcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
