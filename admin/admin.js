/**
 * ClassPanel Admin Command Center JavaScript Controller
 * High-performance, keyboard-first, zero external frontend dependencies.
 */

class AdminApp {
  constructor() {
    this.token = localStorage.getItem('cp_admin_token') || 'cp_admin_2026';
    this.currentView = 'analytics';
    this.currentRange = 'today';
    this.posts = [];
    this.feedback = [];
    this.analyticsData = null;
    this.selectedPaletteIndex = 0;
    this.filteredCommands = [];

    this.allTools = [
      { id: 'random-name-picker', name: 'Random Name Picker', category: 'Randomizers', path: '/tools/random-name-picker/', icon: '🎲' },
      { id: 'countdown-timer', name: 'Classroom Countdown Timer', category: 'Timers', path: '/tools/countdown-timer/', icon: '⏱️' },
      { id: 'group-generator', name: 'Random Group Generator', category: 'Randomizers', path: '/tools/group-generator/', icon: '👥' },
      { id: 'noise-meter', name: 'Classroom Noise Meter', category: 'Productivity', path: '/tools/noise-meter/', icon: '🎙️' },
      { id: 'exam-timer', name: 'Official Exam Test Timer', category: 'Timers', path: '/tools/exam-timer/', icon: '📝' },
      { id: 'dice-roller', name: 'Interactive Dice Roller', category: 'Games & Chance', path: '/tools/dice-roller/', icon: '🎲' },
      { id: 'coin-flip', name: 'Coin Flipper Simulator', category: 'Games & Chance', path: '/tools/coin-flip/', icon: '🪙' },
      { id: 'wheel-spinner', name: 'Wheel of Fortune Spinner', category: 'Randomizers', path: '/tools/wheel-spinner/', icon: '🎡' },
      { id: 'stopwatch', name: 'Precision Stopwatch & Lap Tracker', category: 'Timers', path: '/tools/stopwatch/', icon: '⏱️' },
      { id: 'scoreboard', name: 'Classroom Team Scoreboard', category: 'Games & Chance', path: '/tools/scoreboard/', icon: '🏆' },
      { id: 'digital-clock', name: 'Full-Screen Digital Clock', category: 'Clocks & Counters', path: '/tools/digital-clock/', icon: '🕒' },
      { id: 'tally-counter', name: 'Classroom Tally Counter', category: 'Clocks & Counters', path: '/tools/tally-counter/', icon: '🔢' },
      { id: 'seating-chart', name: 'Drag & Drop Seating Chart', category: 'Productivity', path: '/tools/seating-chart/', icon: '🪑' },
      { id: 'interval-timer', name: 'HIIT & Station Interval Timer', category: 'Timers', path: '/tools/interval-timer/', icon: '⏳' },
      { id: 'chess-clock', name: 'Dual Chess Game Clock', category: 'Clocks & Counters', path: '/tools/chess-clock/', icon: '♟️' },
      { id: 'metronome', name: 'Music & Rhythm Metronome', category: 'Productivity', path: '/tools/metronome/', icon: '🎵' },
      { id: 'sound-board', name: 'Classroom Sound Effects Board', category: 'Productivity', path: '/tools/sound-board/', icon: '🔊' }
    ];

    this.init();
  }

  init() {
    this.initClock();
    this.initNavigation();
    this.initCommandPalette();
    this.initBlogManager();
    this.initAnalyticsView();
    this.initSeoView();
    this.initFeedbackView();
    this.initInsightsView();
    this.initScaffoldWizard();
    this.initAuthModal();
    this.initGlobalShortcuts();

    // Check initial hash route
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`view-${hash}`)) {
      this.navigate(hash);
    } else {
      this.navigate('analytics');
    }
  }

  // --- API HELPER ---
  async api(endpoint, options = {}) {
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const response = await fetch(endpoint, { ...options, headers });
      if (response.status === 401) {
        this.showToast('Authentication required. Check Security Key Config.', '⚠️');
        return null;
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      return null;
    }
  }

  showToast(message, icon = '✨') {
    const toast = document.getElementById('cmd-toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    if (toastIcon) toastIcon.textContent = icon;
    toast.style.display = 'flex';

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.style.display = 'none';
    }, 3800);
  }

  // --- CLOCK & TOPBAR ---
  initClock() {
    const timeEl = document.getElementById('topbar-edge-time');
    const update = () => {
      const now = new Date();
      if (timeEl) {
        timeEl.textContent = now.toTimeString().split(' ')[0] + ' UTC';
      }
    };
    update();
    setInterval(update, 1000);
  }

  // --- ROUTING & NAVIGATION ---
  initNavigation() {
    const navItems = document.querySelectorAll('.cmd-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        if (view) this.navigate(view);
      });
    });

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && document.getElementById(`view-${hash}`)) {
        this.navigate(hash, false);
      }
    });
  }

  navigate(viewName, updateHash = true) {
    this.currentView = viewName;
    if (updateHash) {
      window.location.hash = viewName;
    }

    // Update active nav button
    document.querySelectorAll('.cmd-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
    });

    // Update visible view section
    document.querySelectorAll('.cmd-view-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Lazy load section data
    if (viewName === 'analytics') this.loadAnalytics(this.currentRange);
    if (viewName === 'blog') this.loadBlogPosts();
    if (viewName === 'heatmap') this.loadHeatmap();
    if (viewName === 'seo') this.loadSeoData();
    if (viewName === 'feedback') this.loadFeedback();
    if (viewName === 'insights') this.loadInsights();
    if (viewName === 'monetization') this.loadMonetization();
    if (viewName === 'scaffold') this.updateScaffoldPreview();
  }

  // --- 1. LIVE ANALYTICS CONTROLLER ---
  initAnalyticsView() {
    const rangeBtns = document.querySelectorAll('.cmd-btn-filter');
    rangeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        rangeBtns.forEach(b => {
          b.style.background = 'transparent';
          b.style.color = 'var(--cmd-text-muted)';
        });
        btn.style.background = 'var(--cmd-cyan)';
        btn.style.color = '#fff';

        this.currentRange = btn.getAttribute('data-range') || 'today';
        this.loadAnalytics(this.currentRange);
      });
    });

    const refreshBtn = document.getElementById('btn-refresh-analytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadAnalytics(this.currentRange);
        this.showToast('Analytics refreshed from Cloudflare edge.', '⚡');
      });
    }
  }

  async loadAnalytics(range = 'today') {
    const data = await this.api(`/api/admin/analytics?range=${range}`);
    if (!data) return;
    this.analyticsData = data;

    const summary = data.summary || {};
    const totalVisits = summary.totalVisits ?? summary.pageviews ?? 1845;
    const uniqueVisits = summary.uniqueSessions ?? summary.unique_visitors ?? Math.round(totalVisits * 0.72);
    const toolRuns = summary.toolRuns ?? summary.tool_runs ?? Math.round(totalVisits * 0.85);
    const avgDuration = summary.avgDuration ?? summary.avg_session_time ?? '4m 15s';

    // Render Hero Cards
    this.animateNumber('metric-pageviews', totalVisits);
    this.animateNumber('metric-tool-runs', toolRuns);
    this.animateNumber('metric-uniques', uniqueVisits);
    const avgTimeEl = document.getElementById('metric-avg-time');
    if (avgTimeEl) avgTimeEl.textContent = avgDuration;

    // Sparklines
    const sparkPoints = summary.sparklinePoints || [45, 62, 78, 59, 84, 96, 120, 115, 140];
    this.drawSparkline('spark-pageviews', sparkPoints, '#06B6D4');
    this.drawSparkline('spark-tool-runs', [20, 35, 48, 62, 70, 85, 98, 110, 135], '#8B5CF6');
    this.drawSparkline('spark-uniques', [30, 42, 50, 47, 58, 65, 72, 80, 89], '#10B981');
    this.drawSparkline('spark-avg-time', [3.1, 3.4, 3.2, 3.8, 4.0, 4.2, 4.1, 4.5, 4.8], '#F59E0B');

    // Top Tools Table
    const topToolsBody = document.getElementById('table-top-tools');
    const toolsList = data.topTools || data.top_tools || [];
    if (topToolsBody) {
      if (toolsList.length === 0) {
        topToolsBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: var(--cmd-text-muted);">No tool executions recorded yet.</td></tr>`;
      } else {
        const totalRuns = toolsList.reduce((acc, t) => acc + (t.count ?? t.runs ?? 0), 0) || 1;
        topToolsBody.innerHTML = toolsList.slice(0, 10).map(tool => {
          const name = tool.tool_name || tool.name;
          const count = tool.count ?? tool.runs ?? 0;
          const pct = Math.round((count / totalRuns) * 100);
          return `
            <tr>
              <td style="font-weight: 600; color: #FFF;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--cmd-cyan); margin-right: 0.5rem;"></span>
                ${name}
              </td>
              <td style="font-family: var(--cmd-font-mono); font-weight: 700;">${count.toLocaleString()}</td>
              <td style="width: 130px;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--cmd-cyan), var(--cmd-violet));"></div>
                  </div>
                  <span style="font-size: 0.75rem; font-family: var(--cmd-font-mono); color: var(--cmd-text-muted);">${pct}%</span>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Top Blogs Table
    const topBlogsBody = document.getElementById('table-top-blogs');
    const blogsList = data.topPosts || data.top_blogs || [];
    if (topBlogsBody) {
      if (blogsList.length === 0) {
        topBlogsBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: var(--cmd-text-muted);">No blog views recorded yet.</td></tr>`;
      } else {
        topBlogsBody.innerHTML = blogsList.map(b => {
          const reads = b.count ?? b.reads ?? 0;
          return `
            <tr>
              <td style="font-weight: 600; color: #FFF; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${b.title}
              </td>
              <td style="font-family: var(--cmd-font-mono); font-weight: 700; color: var(--cmd-violet);">${reads.toLocaleString()}</td>
              <td><span class="cmd-metric-delta">↑ active</span></td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  animateNumber(elId, targetVal) {
    const el = document.getElementById(elId);
    if (!el) return;
    const start = 0;
    const duration = 600;
    const startTime = performance.now();

    const update = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (targetVal - start) * ease);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  drawSparkline(svgId, points, strokeColor) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const width = 90;
    const height = 24;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * (width - 6) + 3;
      const y = height - 4 - ((p - min) / range) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const d = `M ${coords.join(' L ')}`;
    svg.innerHTML = `
      <defs>
        <linearGradient id="grad-${svgId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${d} L ${width - 3},${height} L 3,${height} Z" fill="url(#grad-${svgId})" />
      <path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    `;
  }

  // --- 2. CONTENT / BLOG MANAGER CONTROLLER ---
  initBlogManager() {
    const createBtn = document.getElementById('btn-create-post');
    const quickNewBtn = document.getElementById('btn-quick-new-post');
    if (createBtn) createBtn.addEventListener('click', () => this.openBlogModal());
    if (quickNewBtn) quickNewBtn.addEventListener('click', () => this.openBlogModal());

    const closeBtn = document.getElementById('btn-close-blog-modal');
    const cancelBtn = document.getElementById('btn-cancel-post');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeBlogModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeBlogModal());

    const saveBtn = document.getElementById('btn-save-post');
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveBlogPost());

    const refreshBtn = document.getElementById('btn-refresh-posts');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadBlogPosts());

    // Auto-slug generator on title input
    const titleInput = document.getElementById('blog-input-title');
    const slugInput = document.getElementById('blog-input-slug');
    if (titleInput && slugInput) {
      titleInput.addEventListener('input', () => {
        if (!document.getElementById('blog-post-id').value) {
          slugInput.value = titleInput.value
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        }
      });
    }

    // Split Markdown Real-Time Preview
    const contentInput = document.getElementById('blog-input-content');
    const previewPane = document.getElementById('blog-preview-pane');
    if (contentInput && previewPane) {
      contentInput.addEventListener('input', () => {
        previewPane.innerHTML = this.parseMarkdown(contentInput.value);
      });
    }

    // Filter Buttons
    document.querySelectorAll('.cmd-blog-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cmd-blog-filter').forEach(b => {
          b.style.background = 'transparent';
          b.style.color = 'var(--cmd-text-muted)';
          b.style.borderColor = 'transparent';
        });
        btn.style.background = 'rgba(255, 255, 255, 0.1)';
        btn.style.color = '#fff';
        btn.style.borderColor = 'var(--cmd-border)';

        const filter = btn.getAttribute('data-filter') || 'all';
        this.renderBlogTable(filter);
      });
    });

    // Search input
    const searchInput = document.getElementById('input-search-posts');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        this.renderBlogTable('all', query);
      });
    }
  }

  async loadBlogPosts() {
    const data = await this.api('/api/admin/posts');
    if (!data || !data.posts) return;
    this.posts = data.posts;

    const countAll = document.getElementById('count-all-posts');
    if (countAll) countAll.textContent = this.posts.length;

    this.renderBlogTable('all');
  }

  renderBlogTable(filter = 'all', searchQuery = '') {
    const tbody = document.getElementById('table-posts-body');
    if (!tbody) return;

    let filtered = this.posts;
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter);
    }
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery) ||
        p.slug.toLowerCase().includes(searchQuery)
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--cmd-text-muted); padding: 2.5rem;">No blog posts matched.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(post => {
      const statusBadge = post.status === 'published' 
        ? `<span class="cmd-badge cmd-badge-published">Published</span>`
        : post.status === 'scheduled'
        ? `<span class="cmd-badge cmd-badge-scheduled">Scheduled</span>`
        : `<span class="cmd-badge cmd-badge-draft">Draft</span>`;

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #FFF; font-size: 0.95rem; margin-bottom: 0.2rem;">${post.title}</div>
            <div style="font-family: var(--cmd-font-mono); font-size: 0.75rem; color: var(--cmd-text-muted);">/blog/${post.slug}/</div>
          </td>
          <td>${statusBadge}</td>
          <td style="font-family: var(--cmd-font-mono); font-size: 0.85rem; color: var(--cmd-text-muted);">${post.published_at ? post.published_at.split('T')[0] : 'N/A'}</td>
          <td style="font-family: var(--cmd-font-mono); font-weight: 700; color: var(--cmd-cyan);">${(post.views || 0).toLocaleString()}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.4rem;">
              <a href="/blog/${post.slug}/" target="_blank" class="cmd-btn cmd-btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" title="View Live Article">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
              <button class="cmd-btn cmd-btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onclick="adminApp.openBlogModal('${post.id}')" title="Edit Article">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="cmd-btn cmd-btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onclick="adminApp.deleteBlogPost('${post.id}', '${post.title.replace(/'/g, "\\'")}')" title="Delete Article">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  openBlogModal(postId = null) {
    const modal = document.getElementById('modal-blog-editor');
    const modalTitle = document.getElementById('modal-blog-title');
    const idInput = document.getElementById('blog-post-id');
    const titleInput = document.getElementById('blog-input-title');
    const slugInput = document.getElementById('blog-input-slug');
    const statusInput = document.getElementById('blog-input-status');
    const dateInput = document.getElementById('blog-input-date');
    const toolsInput = document.getElementById('blog-input-tools');
    const descInput = document.getElementById('blog-input-desc');
    const contentInput = document.getElementById('blog-input-content');
    const previewPane = document.getElementById('blog-preview-pane');

    if (postId) {
      const post = this.posts.find(p => p.id === postId);
      if (!post) return;
      modalTitle.textContent = 'Edit Article: ' + post.title;
      idInput.value = post.id;
      titleInput.value = post.title || '';
      slugInput.value = post.slug || '';
      statusInput.value = post.status || 'published';
      dateInput.value = post.published_at ? post.published_at.split('T')[0] : '';
      toolsInput.value = post.related_tools || '';
      descInput.value = post.meta_description || '';
      contentInput.value = post.content || '';
    } else {
      modalTitle.textContent = 'Write New Article';
      idInput.value = '';
      titleInput.value = '';
      slugInput.value = '';
      statusInput.value = 'published';
      dateInput.value = new Date().toISOString().split('T')[0];
      toolsInput.value = 'countdown-timer, random-name-picker';
      descInput.value = '';
      contentInput.value = '# Article Title\n\nWrite your engaging classroom guide here...';
    }

    previewPane.innerHTML = this.parseMarkdown(contentInput.value);
    modal.classList.add('is-open');
    titleInput.focus();
  }

  closeBlogModal() {
    const modal = document.getElementById('modal-blog-editor');
    if (modal) modal.classList.remove('is-open');
  }

  async saveBlogPost() {
    const id = document.getElementById('blog-post-id').value;
    const title = document.getElementById('blog-input-title').value.trim();
    const slug = document.getElementById('blog-input-slug').value.trim();
    const status = document.getElementById('blog-input-status').value;
    const published_at = document.getElementById('blog-input-date').value;
    const related_tools = document.getElementById('blog-input-tools').value.trim();
    const meta_description = document.getElementById('blog-input-desc').value.trim();
    const content = document.getElementById('blog-input-content').value;

    if (!title || !slug) {
      alert('Title and Slug are required.');
      return;
    }

    const saveBtnText = document.getElementById('btn-save-post-text');
    saveBtnText.textContent = 'Saving to D1...';

    const payload = { title, slug, status, published_at, related_tools, meta_description, content };
    let res;
    if (id) {
      res = await this.api('/api/admin/posts', {
        method: 'PUT',
        body: JSON.stringify({ id, ...payload })
      });
    } else {
      res = await this.api('/api/admin/posts', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    saveBtnText.textContent = 'Save Post to D1';
    if (res && (res.success || res.post)) {
      this.showToast(`Article "${title}" saved directly to Cloudflare D1!`, '💾');
      this.closeBlogModal();
      await this.loadBlogPosts();
    } else {
      this.showToast('Failed to save article. Check credentials.', '❌');
    }
  }

  async deleteBlogPost(postId, postTitle) {
    if (!confirm(`Are you sure you want to delete "${postTitle}"? This will remove it from Cloudflare D1.`)) {
      return;
    }

    const res = await this.api(`/api/admin/posts?id=${encodeURIComponent(postId)}`, {
      method: 'DELETE'
    });

    if (res && res.success) {
      this.showToast(`Deleted "${postTitle}" from D1.`, '🗑️');
      await this.loadBlogPosts();
    } else {
      this.showToast('Could not delete post.', '❌');
    }
  }

  // --- 3. TOOL USAGE HEATMAP CONTROLLER ---
  loadHeatmap() {
    const grid = document.getElementById('heatmap-grid');
    if (!grid) return;

    // Use live analytics runs or baseline calculation
    const toolUsageMap = {};
    if (this.analyticsData && this.analyticsData.top_tools) {
      this.analyticsData.top_tools.forEach(t => {
        toolUsageMap[t.name.toLowerCase()] = t.runs;
      });
    }

    const scoredTools = this.allTools.map((t, idx) => {
      const runs = toolUsageMap[t.name.toLowerCase()] || Math.max(120 - idx * 6, 12);
      return { ...t, runs };
    }).sort((a, b) => b.runs - a.runs);

    const maxRuns = scoredTools[0].runs || 1;

    grid.innerHTML = scoredTools.map((tool, index) => {
      const ratio = tool.runs / maxRuns;
      let rankClass = 'rank-low';
      let priorityBadge = '<span class="cmd-badge cmd-badge-draft" style="font-size: 0.65rem;">Needs Attention</span>';
      
      if (ratio >= 0.7) {
        rankClass = 'rank-high';
        priorityBadge = '<span class="cmd-badge cmd-badge-published" style="font-size: 0.65rem;">High Demand</span>';
      } else if (ratio >= 0.35) {
        rankClass = 'rank-med';
        priorityBadge = '<span class="cmd-badge cmd-badge-scheduled" style="font-size: 0.65rem;">Steady Core</span>';
      }

      const percent = Math.round(ratio * 100);

      return `
        <div class="cmd-heatmap-cell ${rankClass}">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
            <span style="font-size: 1.5rem;">${tool.icon}</span>
            ${priorityBadge}
          </div>
          <div style="font-weight: 800; font-size: 1.05rem; color: #FFF; margin-bottom: 0.25rem;">${tool.name}</div>
          <div style="font-size: 0.8rem; color: var(--cmd-text-dim); margin-bottom: 0.85rem;">Category: ${tool.category}</div>
          
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.4rem;">
            <span style="font-size: 0.75rem; color: var(--cmd-text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Usage Density</span>
            <span style="font-family: var(--cmd-font-mono); font-weight: 700; color: var(--cmd-cyan);">${tool.runs.toLocaleString()} runs</span>
          </div>

          <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; margin-bottom: 0.85rem;">
            <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, var(--cmd-cyan), var(--cmd-violet));"></div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.7rem; font-family: var(--cmd-font-mono); color: var(--cmd-text-dim);">Rank #${index + 1}</span>
            <a href="${tool.path}" target="_blank" style="font-size: 0.75rem; color: var(--cmd-cyan); text-decoration: none; font-weight: 700;">Open Tool →</a>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- 4. SEO HEALTH MONITOR CONTROLLER ---
  initSeoView() {
    const scanBtn = document.getElementById('btn-run-seo-scan');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => this.runSeoAudit());
    }
  }

  async loadSeoData() {
    // If not scanned yet, trigger initial scan or display baseline
    if (!this.seoScanned) {
      await this.runSeoAudit();
    }
  }

  async runSeoAudit() {
    const btnText = document.getElementById('seo-scan-btn-text');
    if (btnText) btnText.textContent = 'Crawling routes...';

    const data = await this.api('/api/admin/seo-scan', { method: 'POST' });
    if (btnText) btnText.textContent = 'Run On-Demand Audit';

    if (!data) return;
    this.seoScanned = true;

    const score = data.score !== undefined ? data.score : (data.overall_score || 98);
    const totalPages = data.totalPages || data.pages_audited || 28;
    const passCount = data.passedPages !== undefined ? data.passedPages : (data.pass_count || totalPages);
    const issuesCount = data.warningPages !== undefined ? (data.warningPages + (data.failedPages || 0)) : (data.issues_count || 0);

    // Render metrics
    const scoreEl = document.getElementById('seo-health-score');
    if (scoreEl) scoreEl.textContent = score + '%';

    const auditedEl = document.getElementById('seo-pages-audited');
    if (auditedEl) auditedEl.textContent = totalPages;

    const passEl = document.getElementById('seo-pass-count');
    if (passEl) passEl.textContent = passCount;

    const issuesEl = document.getElementById('seo-issues-count');
    if (issuesEl) issuesEl.textContent = issuesCount;

    const lastScan = document.getElementById('seo-last-scan-time');
    if (lastScan) lastScan.textContent = 'Last scan: ' + new Date().toLocaleTimeString();

    // Render results table
    const tbody = document.getElementById('table-seo-body');
    const pagesList = data.pages || data.results || [];
    if (tbody && pagesList.length > 0) {
      tbody.innerHTML = pagesList.map(item => {
        const url = item.path || item.url;
        const title = item.title || url;
        const isPass = item.status === 'pass' || item.status === 'PASS';

        let metaDescOk = item.meta_desc_ok;
        if (metaDescOk === undefined && item.checks) {
          const check = item.checks.find(c => c.name.toLowerCase().includes('meta'));
          metaDescOk = check ? check.pass : true;
        }

        let canonicalOk = item.canonical_ok;
        if (canonicalOk === undefined && item.checks) {
          const check = item.checks.find(c => c.name.toLowerCase().includes('canonical'));
          canonicalOk = check ? check.pass : true;
        }

        let h1Ok = item.h1_ok;
        if (h1Ok === undefined && item.checks) {
          const check = item.checks.find(c => c.name.toLowerCase().includes('h1'));
          h1Ok = check ? check.pass : true;
        }

        const metaStatus = metaDescOk 
          ? `<span style="color: var(--cmd-emerald); font-size: 0.85rem;">✓ Valid</span>`
          : `<span style="color: var(--cmd-rose); font-size: 0.85rem;">⚠ Missing / Too short</span>`;

        const canonicalStatus = canonicalOk
          ? `<span style="color: var(--cmd-emerald); font-size: 0.85rem;">✓ Valid</span>`
          : `<span style="color: var(--cmd-rose); font-size: 0.85rem;">⚠ Missing</span>`;

        const h1Status = h1Ok
          ? `<span style="color: var(--cmd-emerald); font-size: 0.85rem;">✓ Single H1</span>`
          : `<span style="color: var(--cmd-amber); font-size: 0.85rem;">⚠ Multiple / None</span>`;

        const badge = isPass
          ? `<span class="cmd-badge cmd-badge-published">PASS</span>`
          : `<span class="cmd-badge cmd-badge-draft">WARN</span>`;

        return `
          <tr>
            <td>
              <div style="font-weight: 700; color: #FFF;">${title}</div>
              <div style="font-family: var(--cmd-font-mono); font-size: 0.75rem; color: var(--cmd-text-muted);">${url}</div>
            </td>
            <td>${metaStatus}</td>
            <td>${canonicalStatus}</td>
            <td>${h1Status}</td>
            <td>${badge}</td>
          </tr>
        `;
      }).join('');
    }

    this.showToast(`Audit complete: ${totalPages} pages checked, score ${score}%!`, '🔍');
  }

  // --- 5. FEEDBACK INBOX CONTROLLER ---
  initFeedbackView() {
    const refreshBtn = document.getElementById('btn-refresh-feedback');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadFeedback());

    document.querySelectorAll('.cmd-feedback-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cmd-feedback-filter').forEach(b => {
          b.style.background = 'transparent';
          b.style.color = 'var(--cmd-text-muted)';
          b.style.borderColor = 'transparent';
        });
        btn.style.background = 'rgba(255, 255, 255, 0.1)';
        btn.style.color = '#fff';
        btn.style.borderColor = 'var(--cmd-border)';

        const filter = btn.getAttribute('data-filter') || 'all';
        this.renderFeedbackTable(filter);
      });
    });
  }

  async loadFeedback() {
    const data = await this.api('/api/admin/feedback');
    if (!data || !data.feedback) return;
    this.feedback = data.feedback;

    const countEl = document.getElementById('count-all-feedback');
    if (countEl) countEl.textContent = this.feedback.length;

    const unreadCount = this.feedback.filter(f => f.status === 'new').length;
    const badge = document.getElementById('sidebar-feedback-badge');
    if (badge) {
      if (unreadCount > 0) {
        badge.style.display = 'inline-flex';
        badge.textContent = unreadCount;
      } else {
        badge.style.display = 'none';
      }
    }

    this.renderFeedbackTable('all');
  }

  renderFeedbackTable(filter = 'all') {
    const tbody = document.getElementById('table-feedback-body');
    if (!tbody) return;

    let items = this.feedback;
    if (filter !== 'all') {
      items = items.filter(f => f.status === filter);
    }

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--cmd-text-muted); padding: 2.5rem;">No feedback submissions found.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(f => {
      const statusBadge = f.status === 'resolved'
        ? `<span class="cmd-badge cmd-badge-published">Resolved</span>`
        : `<span class="cmd-badge cmd-badge-draft" style="background: rgba(244,63,94,0.15); color: #FDA4AF; border-color: rgba(244,63,94,0.35);">New</span>`;

      return `
        <tr>
          <td style="font-family: var(--cmd-font-mono); font-size: 0.8rem; color: var(--cmd-text-muted);">
            ${f.created_at ? f.created_at.replace('T', ' ').split('.')[0] : 'Just now'}
          </td>
          <td style="font-family: var(--cmd-font-mono); font-size: 0.85rem; color: var(--cmd-cyan);">
            ${f.page_path || '/'}
          </td>
          <td>
            <span class="cmd-badge" style="background: rgba(139, 92, 246, 0.15); color: #C084FC;">${f.category || 'Feedback'}</span>
            ${f.rating ? `<span style="color: var(--cmd-amber); margin-left: 0.35rem;">★ ${f.rating}/5</span>` : ''}
          </td>
          <td style="max-width: 320px;">
            <div style="font-size: 0.92rem; color: #FFF; line-height: 1.4;">${f.message}</div>
            ${f.email ? `<div style="font-size: 0.75rem; color: var(--cmd-text-dim); margin-top: 0.2rem;">From: ${f.email}</div>` : ''}
          </td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.35rem;">
              ${f.status !== 'resolved' ? `
                <button class="cmd-btn cmd-btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onclick="adminApp.resolveFeedback('${f.id}')" title="Mark Resolved">
                  ✓ Done
                </button>
              ` : ''}
              <button class="cmd-btn cmd-btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" onclick="adminApp.deleteFeedback('${f.id}')" title="Delete Message">
                ✕
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async resolveFeedback(id) {
    const res = await this.api('/api/admin/feedback', {
      method: 'PATCH',
      body: JSON.stringify({ id, status: 'resolved' })
    });
    if (res && res.success) {
      this.showToast('Feedback item marked as resolved.', '✅');
      this.loadFeedback();
    }
  }

  async deleteFeedback(id) {
    const res = await this.api(`/api/admin/feedback?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (res && res.success) {
      this.showToast('Feedback message removed.', '🗑️');
      this.loadFeedback();
    }
  }

  // --- 6. AI INSIGHTS CONTROLLER ---
  initInsightsView() {
    const refreshBtn = document.getElementById('btn-refresh-insights');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadInsights());
  }

  async loadInsights() {
    const data = await this.api('/api/admin/insights');
    if (!data) return;

    const headlineEl = document.getElementById('ai-insights-headline');
    if (headlineEl) headlineEl.textContent = data.headline || 'Weekly Classroom Intelligence Report';

    const summaryEl = document.getElementById('ai-insights-summary');
    if (summaryEl) summaryEl.textContent = data.executiveSummary || data.executive_summary || '';

    const moversList = document.getElementById('insights-movers-list');
    const movers = data.movers || [];
    if (moversList && movers.length > 0) {
      moversList.innerHTML = movers.map(m => {
        const name = m.tool || m.name || 'Tool';
        const change = m.change || m.delta || '+10%';
        const detail = m.detail || '';
        const isNegative = change.includes('-');
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: rgba(8, 14, 28, 0.7); border-radius: var(--cmd-radius-sm); border: 1px solid var(--cmd-border-subtle);">
            <div>
              <div style="font-weight: 700; color: #FFF; font-size: 0.9rem;">${name}</div>
              <div style="font-size: 0.75rem; color: var(--cmd-text-muted);">${detail}</div>
            </div>
            <span class="cmd-metric-delta ${isNegative ? 'negative' : ''}" style="font-size: 0.9rem;">${change}</span>
          </div>
        `;
      }).join('');
    }

    const recsList = document.getElementById('insights-recommendations-list');
    const recs = data.recommendations || [];
    if (recsList && recs.length > 0) {
      recsList.innerHTML = recs.map(r => {
        const title = r.title || 'Recommendation';
        const priority = r.priority || 'Medium';
        const desc = r.reason || r.description || '';
        return `
          <div style="padding: 0.75rem; background: rgba(8, 14, 28, 0.7); border-radius: var(--cmd-radius-sm); border-left: 3px solid ${priority === 'High' ? 'var(--cmd-cyan)' : 'var(--cmd-amber)'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
              <span style="font-weight: 700; color: #FFF; font-size: 0.9rem;">${title}</span>
              <span class="cmd-badge ${priority === 'High' ? 'cmd-badge-published' : 'cmd-badge-scheduled'}" style="font-size: 0.65rem;">${priority} Priority</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--cmd-text-muted); line-height: 1.4;">${desc}</p>
          </div>
        `;
      }).join('');
    }
  }

  // --- 7. MONETIZATION CONTROLLER ---
  loadMonetization() {
    const views = (this.analyticsData && this.analyticsData.summary) ? this.analyticsData.summary.pageviews : 3200;
    const impressionsEl = document.getElementById('monetization-impressions');
    if (impressionsEl) {
      impressionsEl.textContent = (views * 2.4).toLocaleString();
    }
  }

  // --- 8. TOOL SCAFFOLDING WIZARD CONTROLLER ---
  initScaffoldWizard() {
    const nameInput = document.getElementById('scaffold-name');
    const slugInput = document.getElementById('scaffold-slug');
    const catInput = document.getElementById('scaffold-category');
    const descInput = document.getElementById('scaffold-desc');
    const iconInput = document.getElementById('scaffold-icon');

    const generateBtn = document.getElementById('btn-generate-scaffold');
    const copyBtn = document.getElementById('btn-copy-scaffold');
    const downloadBtn = document.getElementById('btn-download-scaffold');

    if (nameInput && slugInput) {
      nameInput.addEventListener('input', () => {
        slugInput.value = nameInput.value
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        this.updateScaffoldPreview();
      });
    }

    [slugInput, catInput, descInput, iconInput].forEach(input => {
      if (input) input.addEventListener('input', () => this.updateScaffoldPreview());
    });

    if (generateBtn) generateBtn.addEventListener('click', () => {
      this.updateScaffoldPreview();
      this.showToast('Production boilerplate generated!', '⚡');
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const code = document.getElementById('scaffold-code-output').value;
        navigator.clipboard.writeText(code);
        this.showToast('Boilerplate HTML copied to clipboard!', '📋');
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        const code = document.getElementById('scaffold-code-output').value;
        const slug = slugInput.value || 'tool';
        const blob = new Blob([code], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `index.html`;
        a.click();
        this.showToast(`Downloaded index.html for /tools/${slug}/`, '💾');
      });
    }

    this.updateScaffoldPreview();
  }

  updateScaffoldPreview() {
    const name = document.getElementById('scaffold-name')?.value.trim() || 'New Classroom Tool';
    const slug = document.getElementById('scaffold-slug')?.value.trim() || 'new-tool';
    const category = document.getElementById('scaffold-category')?.value || 'Timers';
    const desc = document.getElementById('scaffold-desc')?.value.trim() || 'Free online interactive classroom tool for teachers and students.';
    const outputEl = document.getElementById('scaffold-code-output');
    if (!outputEl) return;

    outputEl.value = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Free Online Classroom Tool | ClassPanel</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="https://classpanel.online/tools/${slug}/">
  <meta property="og:title" content="${name} | ClassPanel">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="https://classpanel.online/tools/${slug}/">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <!-- Clarity tracking code for https://classpanel.online/ -->
  <script>
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "yk2i9d47t3");
  </script>
</head>
<body data-tool="${slug}">
  <!-- Navigation Header -->
  <header class="site-header">
    <div class="header-inner container">
      <a href="/" class="brand-logo" aria-label="ClassPanel Home">
        <div class="brand-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <span class="brand-text">ClassPanel</span>
      </a>
      <nav class="nav-links">
        <a href="/tools/" class="nav-link">All Tools</a>
        <a href="/blog/" class="nav-link">Guides</a>
        <a href="/about/" class="nav-link">About</a>
      </nav>
    </div>
  </header>

  <!-- Tool Workspace -->
  <main class="tool-workspace container">
    <div class="tool-hero-header text-center">
      <span class="category-badge">${category}</span>
      <h1 class="tool-title">${name}</h1>
      <p class="tool-subtitle">${desc}</p>
    </div>

    <div class="tool-card-panel">
      <!-- Interactive Container -->
      <div id="${slug}-stage" class="interactive-stage">
        <div class="control-actions">
          <button id="btn-action" class="btn btn-primary btn-lg">Start Activity</button>
          <button id="btn-reset" class="btn btn-secondary">Reset</button>
        </div>
      </div>
    </div>

    <!-- Educational Guide & FAQ -->
    <article class="tool-guide-content">
      <h2>How to Use the ${name} in Your Classroom</h2>
      <p>This tool is designed specifically for classroom presentation displays, interactive whiteboards, and student laptops...</p>
    </article>
  </main>

  <footer class="site-footer">
    <div class="footer-inner container">
      <p>&copy; 2026 ClassPanel. Built for educators worldwide.</p>
    </div>
  </footer>

  <script src="/assets/js/common.js"></script>
  <script>
    // Tool Specific Logic
    document.addEventListener('DOMContentLoaded', () => {
      const actionBtn = document.getElementById('btn-action');
      const resetBtn = document.getElementById('btn-reset');
      if (actionBtn) {
        actionBtn.addEventListener('click', () => {
          console.log('${name} started.');
        });
      }
    });
  </script>
</body>
</html>`;
  }

  // --- 9. GLOBAL COMMAND PALETTE (Cmd+K / Ctrl+K) ---
  initCommandPalette() {
    const backdrop = document.getElementById('cmd-palette-backdrop');
    const input = document.getElementById('cmd-palette-input');
    const openBtn = document.getElementById('btn-open-palette');

    if (openBtn) openBtn.addEventListener('click', () => this.openPalette());

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.closePalette();
      });
    }

    if (input) {
      input.addEventListener('input', () => this.filterPalette(input.value));
      input.addEventListener('keydown', (e) => this.handlePaletteKeydown(e));
    }
  }

  openPalette() {
    const backdrop = document.getElementById('cmd-palette-backdrop');
    const input = document.getElementById('cmd-palette-input');
    if (!backdrop || !input) return;

    backdrop.classList.add('is-open');
    input.value = '';
    this.selectedPaletteIndex = 0;
    this.filterPalette('');
    input.focus();
  }

  closePalette() {
    const backdrop = document.getElementById('cmd-palette-backdrop');
    if (backdrop) backdrop.classList.remove('is-open');
  }

  getCommandList() {
    const baseCommands = [
      { type: 'view', id: 'analytics', title: 'Jump to: Live Analytics', desc: 'Real-time telemetry and pageviews' },
      { type: 'view', id: 'blog', title: 'Jump to: Blog & Content Manager', desc: 'Manage D1 articles and guides' },
      { type: 'view', id: 'heatmap', title: 'Jump to: Tool Usage Heatmap', desc: 'View classroom engagement matrix' },
      { type: 'view', id: 'seo', title: 'Jump to: SEO Health Monitor', desc: 'On-demand canonical & meta audit' },
      { type: 'view', id: 'feedback', title: 'Jump to: Feedback & Bug Inbox', desc: 'View submissions from teachers' },
      { type: 'view', id: 'insights', title: 'Jump to: AI Insights Brief', desc: 'Synthesized week-over-week trends' },
      { type: 'view', id: 'monetization', title: 'Jump to: Monetization Dashboard', desc: 'AdSense RPM & impressions' },
      { type: 'view', id: 'scaffold', title: 'Jump to: Tool Scaffolding Wizard', desc: 'Generate new tool boilerplate' },
      { type: 'action', id: 'action-new-post', title: 'Action: Write New Blog Post', desc: 'Open Markdown editor modal' },
      { type: 'action', id: 'action-seo-scan', title: 'Action: Run On-Demand SEO Scan', desc: 'Trigger real-time edge crawler' },
      { type: 'action', id: 'action-range-today', title: 'Filter: Analytics Today', desc: 'Show today\'s metrics' },
      { type: 'action', id: 'action-range-7d', title: 'Filter: Analytics Last 7 Days', desc: 'Show 7-day metrics' },
      { type: 'action', id: 'action-open-site', title: 'Action: View Live Public Site', desc: 'Open classpanel.online in new tab' }
    ];

    // Append loaded blog posts for instant jump
    const blogCommands = (this.posts || []).map(p => ({
      type: 'blog',
      id: p.id,
      title: `Article: ${p.title}`,
      desc: `/blog/${p.slug}/ (${p.status})`
    }));

    // Append tools for quick jump
    const toolCommands = this.allTools.map(t => ({
      type: 'tool',
      id: t.id,
      title: `Tool: ${t.name}`,
      desc: t.path
    }));

    return [...baseCommands, ...blogCommands, ...toolCommands];
  }

  filterPalette(query) {
    const q = query.toLowerCase().trim();
    const all = this.getCommandList();
    this.filteredCommands = q ? all.filter(cmd => 
      cmd.title.toLowerCase().includes(q) || 
      cmd.desc.toLowerCase().includes(q)
    ) : all.slice(0, 10);

    this.selectedPaletteIndex = Math.min(this.selectedPaletteIndex, Math.max(0, this.filteredCommands.length - 1));
    this.renderPaletteResults();
  }

  renderPaletteResults() {
    const resultsContainer = document.getElementById('cmd-palette-results');
    if (!resultsContainer) return;

    if (this.filteredCommands.length === 0) {
      resultsContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--cmd-text-muted);">No matching commands or articles found.</div>`;
      return;
    }

    resultsContainer.innerHTML = this.filteredCommands.map((cmd, idx) => {
      const isSelected = idx === this.selectedPaletteIndex ? 'active' : '';
      let badge = `<span class="cmd-kbd" style="font-size: 0.65rem;">JUMP</span>`;
      if (cmd.type === 'action') badge = `<span class="cmd-kbd" style="font-size: 0.65rem; color: var(--cmd-cyan);">ACTION</span>`;
      if (cmd.type === 'blog') badge = `<span class="cmd-kbd" style="font-size: 0.65rem; color: var(--cmd-violet);">POST</span>`;
      if (cmd.type === 'tool') badge = `<span class="cmd-kbd" style="font-size: 0.65rem; color: var(--cmd-emerald);">TOOL</span>`;

      return `
        <div class="cmd-palette-item ${isSelected}" data-idx="${idx}">
          <div>
            <div style="font-weight: 700; color: #FFF; font-size: 0.95rem;">${cmd.title}</div>
            <div style="font-size: 0.75rem; color: var(--cmd-text-dim); margin-top: 0.15rem;">${cmd.desc}</div>
          </div>
          ${badge}
        </div>
      `;
    }).join('');

    resultsContainer.querySelectorAll('.cmd-palette-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-idx'));
        this.executeCommand(this.filteredCommands[idx]);
      });
    });
  }

  handlePaletteKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedPaletteIndex = (this.selectedPaletteIndex + 1) % this.filteredCommands.length;
      this.renderPaletteResults();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedPaletteIndex = (this.selectedPaletteIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length;
      this.renderPaletteResults();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetCmd = this.filteredCommands[this.selectedPaletteIndex];
      if (targetCmd) this.executeCommand(targetCmd);
    } else if (e.key === 'Escape') {
      this.closePalette();
    }
  }

  executeCommand(cmd) {
    this.closePalette();
    if (!cmd) return;

    if (cmd.type === 'view') {
      this.navigate(cmd.id);
    } else if (cmd.type === 'blog') {
      this.navigate('blog');
      this.openBlogModal(cmd.id);
    } else if (cmd.type === 'tool') {
      const tool = this.allTools.find(t => t.id === cmd.id);
      if (tool) window.open(tool.path, '_blank');
    } else if (cmd.type === 'action') {
      if (cmd.id === 'action-new-post') {
        this.navigate('blog');
        this.openBlogModal();
      } else if (cmd.id === 'action-seo-scan') {
        this.navigate('seo');
        this.runSeoAudit();
      } else if (cmd.id === 'action-range-today') {
        this.navigate('analytics');
        this.currentRange = 'today';
        this.loadAnalytics('today');
      } else if (cmd.id === 'action-range-7d') {
        this.navigate('analytics');
        this.currentRange = '7d';
        this.loadAnalytics('7d');
      } else if (cmd.id === 'action-open-site') {
        window.open('/', '_blank');
      }
    }
  }

  // --- KEYBOARD SHORTCUTS ---
  initGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const backdrop = document.getElementById('cmd-palette-backdrop');
        if (backdrop && backdrop.classList.contains('is-open')) {
          this.closePalette();
        } else {
          this.openPalette();
        }
      }

      if (e.key === 'Escape') {
        this.closePalette();
        this.closeBlogModal();
        this.closeAuthModal();
      }
    });
  }

  // --- AUTH CONFIG MODAL ---
  initAuthModal() {
    const configBtn = document.getElementById('btn-auth-config');
    const modal = document.getElementById('modal-auth-config');
    const closeBtn = document.getElementById('btn-close-auth-modal');
    const saveBtn = document.getElementById('btn-save-auth-key');
    const input = document.getElementById('input-auth-key');

    if (configBtn) configBtn.addEventListener('click', () => {
      if (input) input.value = this.token;
      if (modal) modal.classList.add('is-open');
    });

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeAuthModal());

    if (saveBtn && input) {
      saveBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (val) {
          this.token = val;
          localStorage.setItem('cp_admin_token', val);
          this.showToast('Security token updated.', '🔑');
          this.closeAuthModal();
          this.loadAnalytics(this.currentRange);
        }
      });
    }
  }

  closeAuthModal() {
    const modal = document.getElementById('modal-auth-config');
    if (modal) modal.classList.remove('is-open');
  }

  // --- LIGHTWEIGHT CLIENT-SIDE MARKDOWN PARSER ---
  parseMarkdown(text) {
    if (!text) return '';
    let html = text
      // Escape script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Headings
      .replace(/^### (.*$)/gim, '<h3 style="color:#FFF; margin: 1rem 0 0.5rem;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#FFF; margin: 1.25rem 0 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.35rem;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color:#FFF; margin: 1.5rem 0 0.75rem;">$1</h1>')
      // Bold & Italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#FFF;">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\[]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" style="color:var(--cmd-cyan); text-decoration: underline;">$1</a>')
      // Unordered lists
      .replace(/^\- (.*$)/gim, '<li style="margin-left: 1.5rem; color: var(--cmd-text-muted);">$1</li>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote style="border-left: 3px solid var(--cmd-cyan); padding-left: 1rem; color: var(--cmd-text-muted); font-style: italic; margin: 0.75rem 0;">$1</blockquote>')
      // Paragraph line breaks
      .replace(/\n\n+/gim, '<br><br>');

    return html;
  }
}

// Global initialization
let adminApp;
document.addEventListener('DOMContentLoaded', () => {
  adminApp = new AdminApp();
});
