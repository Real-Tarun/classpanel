/**
 * ClassPanel Projector & Fullscreen Manager
 * Fullscreen API + Screen Wake Lock API to prevent projector sleep
 */

class FullscreenManager {
  constructor() {
    this.wakeLock = null;
    this.isFullscreen = false;
    this.isFallbackFs = false;
    this.initListeners();
  }

  initListeners() {
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());

    // Automatically re-request wake lock if tab visibility changes
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && this.isFullscreen) {
        await this.requestWakeLock();
      }
    });

    this.ensureWatermark();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.ensureWatermark());
    }
  }

  ensureWatermark() {
    // Watermark temporarily removed as requested
    document.querySelectorAll('.projector-watermark').forEach(el => el.remove());

    // Also attach to each .tool-stage so element-level fullscreen displays exit button
    const stages = document.querySelectorAll('.tool-stage');
    stages.forEach(stage => {
      if (!stage.querySelector('.projector-exit-floating')) {
        const exitBtn = document.createElement('button');
        exitBtn.type = 'button';
        exitBtn.className = 'projector-exit-floating';
        exitBtn.title = 'Exit Projector Mode (Esc)';
        exitBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
          <span>Exit</span>
        `;
        exitBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.exit();
        });
        stage.appendChild(exitBtn);
      }
    });
  }

  handleFullscreenChange() {
    this.ensureWatermark();
    const hasNativeFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    const isNowFs = hasNativeFs || this.isFallbackFs;

    this.isFullscreen = isNowFs;
    document.body.classList.toggle('is-projector-mode', isNowFs);

    const stages = document.querySelectorAll('.tool-stage');
    stages.forEach(stage => {
      if (isNowFs) {
        stage.classList.add('is-fullscreen');
      } else {
        stage.classList.remove('is-fullscreen');
      }
    });

    // Directly control floating exit button
    const exitBtns = document.querySelectorAll('.projector-exit-floating');
    exitBtns.forEach(btn => {
      if (isNowFs) {
        btn.classList.add('is-visible');
        btn.style.display = 'inline-flex';
      } else {
        btn.classList.remove('is-visible');
        btn.style.display = 'none';
      }
    });

    const projectorBtns = document.querySelectorAll('[data-action="toggle-projector"]');
    projectorBtns.forEach(btn => {
      if (isNowFs) {
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
          <span>Exit Projector</span>
        `;
        btn.classList.add('active');
      } else {
        btn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          <span>Projector Mode</span>
        `;
        btn.classList.remove('active');
      }
    });

    if (isNowFs) {
      this.requestWakeLock();
    } else {
      this.releaseWakeLock();
    }
  }

  async toggle(targetElement = null) {
    if (!this.isFullscreen) {
      await this.enter(targetElement || document.querySelector('.tool-stage') || document.documentElement);
    } else {
      await this.exit();
    }
  }

  async enter(element) {
    this.isFallbackFs = false;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      } else {
        this.isFallbackFs = true;
      }
    } catch (err) {
      console.warn('Native fullscreen request blocked or not supported, using CSS fallback:', err);
      this.isFallbackFs = true;
    }
    this.handleFullscreenChange();
    await this.requestWakeLock();
  }

  async exit() {
    this.isFallbackFs = false;
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen && document.mozFullScreenElement) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen && document.msFullscreenElement) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      console.warn('Error exiting native fullscreen:', err);
    }

    const stages = document.querySelectorAll('.tool-stage');
    stages.forEach(s => s.classList.remove('is-fullscreen'));
    this.isFullscreen = false;
    this.handleFullscreenChange();
    this.releaseWakeLock();
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (e) {
        // Can fail if battery saver is on or document not visible
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock !== null) {
      try {
        this.wakeLock.release();
      } catch (e) {}
      this.wakeLock = null;
    }
  }
}

// Global fullscreen singleton
window.Projector = new FullscreenManager();
