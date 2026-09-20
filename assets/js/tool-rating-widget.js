/**
 * ClassPanel Tool Rating Widget
 * Injects a "Was this tool helpful?" section on tool pages.
 * Uses thumbs up/down + optional comment text.
 * Reads tool slug from URL path automatically.
 */
(function () {
  'use strict';

  // Only inject on /tools/* pages
  const toolMatch = window.location.pathname.match(/\/tools\/([^\/]+)/);
  if (!toolMatch) return;
  const toolSlug = toolMatch[1];

  // Prevent double-injection
  if (document.getElementById('cp-rating-widget')) return;

  const STORAGE_KEY = 'cp_rated_' + toolSlug;

  // Check if already rated in this session
  function hasRated() {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  }

  function markRated() {
    sessionStorage.setItem(STORAGE_KEY, '1');
  }

  // ── Build Widget HTML ──────────────────────────────────────────────────────
  function buildWidget() {
    const widget = document.createElement('section');
    widget.id = 'cp-rating-widget';
    widget.setAttribute('aria-label', 'Rate this tool');
    widget.innerHTML = `
      <div class="cp-rw-inner">
        <div class="cp-rw-question" id="cp-rw-question">
          <p class="cp-rw-label">Was this tool helpful?</p>
          <div class="cp-rw-buttons">
            <button class="cp-rw-btn cp-rw-yes" id="cp-rw-yes" aria-label="Yes, it was helpful" title="Yes, loved it!">
              <span class="cp-rw-emoji">👍</span>
              <span>Loved it!</span>
            </button>
            <button class="cp-rw-btn cp-rw-no" id="cp-rw-no" aria-label="Needs improvement" title="Needs improvement">
              <span class="cp-rw-emoji">👎</span>
              <span>Needs work</span>
            </button>
            <button class="cp-rw-btn cp-rw-suggest" id="cp-rw-suggest" aria-label="Suggest a feature">
              <span class="cp-rw-emoji">💡</span>
              <span>Suggest</span>
            </button>
          </div>
        </div>

        <div class="cp-rw-comment-box" id="cp-rw-comment-box" hidden>
          <label for="cp-rw-comment" class="cp-rw-label" id="cp-rw-comment-label">What could be better?</label>
          <textarea
            id="cp-rw-comment"
            class="cp-rw-textarea"
            placeholder="Tell us what you'd like to see improved..."
            maxlength="500"
            rows="3"
            aria-labelledby="cp-rw-comment-label"
          ></textarea>
          <div class="cp-rw-actions">
            <button class="cp-rw-skip" id="cp-rw-skip">Skip</button>
            <button class="cp-rw-submit" id="cp-rw-submit">Send Feedback →</button>
          </div>
        </div>

        <div class="cp-rw-thankyou" id="cp-rw-thankyou" hidden>
          <span class="cp-rw-ty-emoji" id="cp-rw-ty-emoji">🎉</span>
          <p class="cp-rw-ty-text" id="cp-rw-ty-text">Thanks for the love!</p>
        </div>
      </div>
    `;
    return widget;
  }

  // ── Inject Styles ─────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('cp-rw-styles')) return;
    const style = document.createElement('style');
    style.id = 'cp-rw-styles';
    style.textContent = `
      #cp-rating-widget {
        margin: 2.5rem auto 1rem;
        max-width: 720px;
        padding: 0 1rem;
      }

      .cp-rw-inner {
        background: var(--surface-raised, #f8fafc);
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: var(--radius-xl, 18px);
        padding: 1.5rem 2rem;
        text-align: center;
        transition: box-shadow 0.2s ease;
      }

      [data-theme="dark"] .cp-rw-inner {
        background: rgba(255,255,255,0.05);
        border-color: rgba(255,255,255,0.1);
      }

      .cp-rw-label {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--text-secondary, #64748b);
        margin: 0 0 1rem;
        letter-spacing: 0.01em;
        text-transform: uppercase;
        font-size: 0.78rem;
      }

      .cp-rw-buttons {
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .cp-rw-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.6rem 1.2rem;
        border-radius: 999px;
        border: 2px solid var(--border-color, #e2e8f0);
        background: var(--surface-base, #fff);
        color: var(--text-primary, #1e293b);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-family: inherit;
        line-height: 1;
      }

      [data-theme="dark"] .cp-rw-btn {
        background: rgba(255,255,255,0.07);
        border-color: rgba(255,255,255,0.15);
        color: var(--text-primary, #f1f5f9);
      }

      .cp-rw-btn:hover {
        transform: translateY(-2px) scale(1.04);
        box-shadow: 0 4px 14px rgba(0,0,0,0.12);
      }

      .cp-rw-btn:active {
        transform: translateY(0) scale(0.97);
      }

      .cp-rw-yes:hover { border-color: #22c55e; color: #16a34a; background: #f0fdf4; }
      .cp-rw-no:hover  { border-color: #f97316; color: #ea580c; background: #fff7ed; }
      .cp-rw-suggest:hover { border-color: #a855f7; color: #9333ea; background: #faf5ff; }

      [data-theme="dark"] .cp-rw-yes:hover    { background: rgba(34,197,94,0.12); }
      [data-theme="dark"] .cp-rw-no:hover     { background: rgba(249,115,22,0.12); }
      [data-theme="dark"] .cp-rw-suggest:hover { background: rgba(168,85,247,0.12); }

      .cp-rw-emoji {
        font-size: 1.1rem;
        line-height: 1;
      }

      /* Comment Box */
      .cp-rw-comment-box {
        animation: cp-rw-slide-in 0.25s ease;
      }

      @keyframes cp-rw-slide-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .cp-rw-textarea {
        width: 100%;
        box-sizing: border-box;
        border: 2px solid var(--border-color, #e2e8f0);
        border-radius: var(--radius-md, 12px);
        padding: 0.75rem 1rem;
        font-size: 0.95rem;
        font-family: inherit;
        color: var(--text-primary, #1e293b);
        background: var(--surface-base, #fff);
        resize: vertical;
        min-height: 80px;
        margin-bottom: 0.75rem;
        transition: border-color 0.15s;
        outline: none;
      }

      [data-theme="dark"] .cp-rw-textarea {
        background: rgba(255,255,255,0.07);
        border-color: rgba(255,255,255,0.15);
        color: var(--text-primary, #f1f5f9);
      }

      .cp-rw-textarea:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
      }

      .cp-rw-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
      }

      .cp-rw-skip {
        background: none;
        border: none;
        color: var(--text-secondary, #64748b);
        font-size: 0.88rem;
        cursor: pointer;
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        font-family: inherit;
        font-weight: 600;
        transition: color 0.15s;
      }

      .cp-rw-skip:hover { color: var(--text-primary, #1e293b); }

      .cp-rw-submit {
        background: var(--accent-purple, #4f46e5);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 0.55rem 1.3rem;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.18s ease;
      }

      .cp-rw-submit:hover {
        background: #4338ca;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79,70,229,0.35);
      }

      /* Thank You State */
      .cp-rw-thankyou {
        animation: cp-rw-slide-in 0.3s ease;
        padding: 0.5rem 0;
      }

      .cp-rw-ty-emoji {
        font-size: 2.2rem;
        display: block;
        margin-bottom: 0.5rem;
        animation: cp-rw-bounce 0.4s ease;
      }

      @keyframes cp-rw-bounce {
        0%   { transform: scale(0.6); }
        70%  { transform: scale(1.15); }
        100% { transform: scale(1); }
      }

      .cp-rw-ty-text {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary, #1e293b);
        margin: 0;
      }

      @media (max-width: 500px) {
        .cp-rw-inner { padding: 1.2rem 1rem; }
        .cp-rw-btn { padding: 0.55rem 0.9rem; font-size: 0.85rem; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Send Rating to API ─────────────────────────────────────────────────────
  async function sendRating(rating, comment) {
    try {
      await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          tool_name: toolSlug,
          page_url: window.location.pathname,
          comment: comment || ''
        }),
        keepalive: true
      });
    } catch (_) {
      // Silently fail — never break the page
    }
  }

  // ── Show Thank You State ──────────────────────────────────────────────────
  function showThankYou(isPositive, isSuggest) {
    const questionDiv = document.getElementById('cp-rw-question');
    const commentBox  = document.getElementById('cp-rw-comment-box');
    const thankYou    = document.getElementById('cp-rw-thankyou');
    const emoji       = document.getElementById('cp-rw-ty-emoji');
    const text        = document.getElementById('cp-rw-ty-text');

    if (questionDiv) questionDiv.hidden = true;
    if (commentBox)  commentBox.hidden  = true;
    if (thankYou)    thankYou.hidden    = false;

    if (isSuggest) {
      emoji.textContent = '💡';
      text.textContent  = 'Thanks for the suggestion! We read every idea.';
    } else if (isPositive) {
      emoji.textContent = '🎉';
      text.textContent  = 'Thanks for the love! Glad it helped.';
    } else {
      emoji.textContent = '🙏';
      text.textContent  = "Thanks for the honest feedback — we'll improve this!";
    }

    markRated();
  }

  // ── Show Comment Box ──────────────────────────────────────────────────────
  function showCommentBox(labelText) {
    const questionDiv = document.getElementById('cp-rw-question');
    const commentBox  = document.getElementById('cp-rw-comment-box');
    const label       = document.getElementById('cp-rw-comment-label');
    const textarea    = document.getElementById('cp-rw-comment');

    if (questionDiv) questionDiv.hidden = true;
    if (commentBox)  commentBox.hidden  = false;
    if (label)       label.textContent  = labelText;

    // Focus textarea after animation
    setTimeout(() => { if (textarea) textarea.focus(); }, 100);
  }

  // ── Wire up Events ────────────────────────────────────────────────────────
  function attachEvents(widget) {
    let currentRating = null;

    // 👍 Thumbs Up — instant thank you
    widget.querySelector('#cp-rw-yes').addEventListener('click', async () => {
      currentRating = 'thumbs_up';
      await sendRating('thumbs_up', '');
      showThankYou(true, false);
    });

    // 👎 Thumbs Down — show comment box
    widget.querySelector('#cp-rw-no').addEventListener('click', () => {
      currentRating = 'thumbs_down';
      showCommentBox('What could be better?');
    });

    // 💡 Suggest — show comment box with different label
    widget.querySelector('#cp-rw-suggest').addEventListener('click', () => {
      currentRating = 'suggest';
      showCommentBox('What feature would you like to see?');
    });

    // Skip — skip comment, just log the thumbs_down
    widget.querySelector('#cp-rw-skip').addEventListener('click', async () => {
      if (currentRating === 'suggest') {
        showThankYou(false, true);
      } else {
        await sendRating('thumbs_down', '');
        showThankYou(false, false);
      }
    });

    // Submit comment
    widget.querySelector('#cp-rw-submit').addEventListener('click', async () => {
      const comment = (widget.querySelector('#cp-rw-comment').value || '').trim();
      const rating  = currentRating === 'suggest' ? 'thumbs_up' : 'thumbs_down';
      await sendRating(rating, comment);
      showThankYou(currentRating === 'suggest', currentRating === 'suggest');
    });

    // Enter key on textarea submits
    widget.querySelector('#cp-rw-comment').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        widget.querySelector('#cp-rw-submit').click();
      }
    });
  }

  // ── Find best injection point ──────────────────────────────────────────────
  function findInjectionPoint() {
    // Try to find the tool's main content footer (before site footer)
    const selectors = [
      '.tool-footer',
      '.tool-section:last-of-type',
      '.tool-container > *:last-child',
      'main > *:last-child',
      'main',
      'body'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el !== document.body) {
        return { parent: el.parentNode || document.body, insertBefore: el.nextSibling || null, appendTo: null };
      }
    }
    return { parent: document.body, insertBefore: null, appendTo: null };
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Don't show if already rated in this session
    if (hasRated()) return;

    injectStyles();

    const widget = buildWidget();
    attachEvents(widget);

    // Find the footer to insert before it
    const siteFooter = document.querySelector('footer, .site-footer, #site-footer');
    if (siteFooter) {
      siteFooter.parentNode.insertBefore(widget, siteFooter);
    } else {
      const { parent, insertBefore } = findInjectionPoint();
      if (insertBefore) {
        parent.insertBefore(widget, insertBefore);
      } else {
        parent.appendChild(widget);
      }
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
