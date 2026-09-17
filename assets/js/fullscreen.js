/**
 * ClassPanel Projector & Fullscreen Manager
 * Fullscreen API + Screen Wake Lock API to prevent projector sleep
 */

class FullscreenManager {
  constructor() {
    this.wakeLock = null;
    this.isFullscreen = false;
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

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.ensureWatermark());
    } else {
      this.ensureWatermark();
    }
  }

  ensureWatermark() {
    const stages = document.querySelectorAll('.tool-stage');
    stages.forEach(stage => {
      if (!stage.querySelector('.projector-watermark')) {
        const watermark = document.createElement('a');
        watermark.href = 'https://classpanel.online';
        watermark.target = '_blank';
        watermark.rel = 'noopener';
        watermark.className = 'projector-watermark';
        watermark.title = 'ClassPanel.online — Free Online Classroom Tools & Timers';
        watermark.innerHTML = `
          <img src="/assets/icons/logo.png" alt="ClassPanel" width="15" height="15">
          <span>classpanel<span class="watermark-highlight">.online</span></span>
        `;
        watermark.addEventListener('click', (e) => e.stopPropagation());
        stage.appendChild(watermark);
      }
    });
  }

  handleFullscreenChange() {
    this.ensureWatermark();
    const isNowFs = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    this.isFullscreen = isNowFs;

    const stages = document.querySelectorAll('.tool-stage');
    stages.forEach(stage => {
      if (isNowFs) {
        stage.classList.add('is-fullscreen');
      } else {
        stage.classList.remove('is-fullscreen');
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
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
    } catch (err) {
      console.warn('Native fullscreen request blocked or not supported, using CSS fallback:', err);
      // Fallback: full-bleed CSS class
      if (element) {
        element.classList.toggle('is-fullscreen');
        this.isFullscreen = element.classList.contains('is-fullscreen');
      }
    }
    await this.requestWakeLock();
  }

  async exit() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (err) {
      console.warn('Error exiting native fullscreen:', err);
    }

    const stages = document.querySelectorAll('.tool-stage');
    stages.forEach(s => s.classList.remove('is-fullscreen'));
    this.isFullscreen = false;
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
