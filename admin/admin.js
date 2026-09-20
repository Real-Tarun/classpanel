/**
 * ClassPanel Admin Dashboard Controller
 * Connects directly to Cloudflare D1 via /api/admin/* endpoints
 * Features:
 *  - Token-invalidating security (changing passcode destroys all previous sessions)
 *  - Real D1 Analytics & Leaderboard
 *  - Merged Feedback & In-Page Widget Ratings
 *  - Blog & Guides CMS (Full CRUD)
 *  - Site Settings & Announcement Banner Broadcast
 */

class AdminApp {
  constructor(token) {
    this.token = token || localStorage.getItem('cp_admin_token') || '';
    this.currentRange = '7d';
    this.currentPage = 'overview';
    this.posts = [];
    this.feedback = [];
    this.ratingsData = null;
    this.settings = {};
    this.toastTimer = null;
  }

  init() {
    this.initNav();
    this.initRangeSelector();
    this.initEditorPreview();
    this.loadOverview();
    this.loadSettings();
    this.updateUnreadBadge();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  initNav() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.getAttribute('data-page');
        this.navigateTo(page);
      });
    });
  }

  navigateTo(page) {
    this.currentPage = page;

    // Update sidebar buttons
    document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-page') === page);
    });

    // Switch page visibility
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add('active');

    // Update topbar title
    const titles = {
      overview: 'Overview & Analytics',
      feedback: 'Feedback & User Signals',
      blog: 'Blog & Guides CMS',
      settings: 'Settings & Security'
    };
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = titles[page] || 'Admin Dashboard';

    // Lazy-load page data
    if (page === 'overview') this.loadOverview();
    else if (page === 'feedback') {
      this.loadFeedback();
      this.loadRatings();
    } else if (page === 'blog') this.loadBlogPosts();
    else if (page === 'settings') this.loadSettings();
  }

  initRangeSelector() {
    const rangeBtns = document.querySelectorAll('#range-btns .range-btn');
    rangeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        rangeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentRange = btn.getAttribute('data-range') || '7d';
        this.loadOverview(this.currentRange);
      });
    });
  }

  // ── API Fetch Wrapper with Security Check ─────────────────────────────────
  async apiFetch(url, options = {}) {
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        this.showToast('Session expired or invalidated. Logging out...', 'danger');
        setTimeout(() => {
          if (typeof adminLogout === 'function') adminLogout();
        }, 800);
        throw new Error('Unauthorized');
      }
      return res;
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        this.showToast(err.message || 'Network request failed', 'danger');
      }
      throw err;
    }
  }

  // ── Overview & Analytics ──────────────────────────────────────────────────
  async loadOverview(range = this.currentRange) {
    try {
      const [analyticsRes, ratingsRes, unreadRes] = await Promise.allSettled([
        this.apiFetch(`/api/admin/analytics?range=${range}`).then(r => r.json()),
        this.apiFetch(`/api/admin/feedback?view=ratings&range=${range}`).then(r => r.json()),
        this.apiFetch('/api/admin/feedback?status=unread').then(r => r.json())
      ]);

      // Visits & Sessions
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
        const d = analyticsRes.value;
        const totalVisits = d.summary?.totalVisits ?? 0;
        const uniqueSessions = d.summary?.uniqueSessions ?? 0;

        const vEl = document.getElementById('kpi-visits');
        if (vEl) vEl.textContent = Number(totalVisits).toLocaleString();

        const sEl = document.getElementById('kpi-sessions');
        if (sEl) sEl.textContent = Number(uniqueSessions).toLocaleString();

        this.renderLeaderboard(d.topTools || []);
      }

      // Ratings KPI
      if (ratingsRes.status === 'fulfilled' && ratingsRes.value) {
        const r = ratingsRes.value;
        const approval = r.summary?.overallApproval;
        const appEl = document.getElementById('kpi-approval');
        if (appEl) {
          appEl.textContent = approval !== null && approval !== undefined ? `${approval}%` : '—';
        }
      }

      // Unread KPI
      if (unreadRes.status === 'fulfilled' && unreadRes.value) {
        const count = (unreadRes.value.feedback || []).length;
        const unEl = document.getElementById('kpi-unread');
        if (unEl) unEl.textContent = count;
        this.setUnreadBadge(count);
      }

    } catch (err) {
      console.error('Failed to load overview data:', err);
    }
  }

  renderLeaderboard(tools) {
    const container = document.getElementById('leaderboard');
    if (!container) return;

    if (!tools || tools.length === 0) {
      container.innerHTML = `
        <div class="empty">
          <span class="empty-icon">📊</span>
          <p>No tool telemetry logged for this time period yet.</p>
        </div>
      `;
      return;
    }

    const maxCount = Math.max(...tools.map(t => t.count || 0), 1);

    container.innerHTML = tools.slice(0, 10).map((tool, idx) => {
      const pct = Math.round(((tool.count || 0) / maxCount) * 100);
      const toolName = tool.tool_name || tool.slug;
      const rankColor = idx === 0 ? 'var(--amber)' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : 'var(--text3)';

      return `
        <div class="lb-row">
          <div class="lb-top">
            <div style="display:flex;align-items:center;gap:.6rem;">
              <span style="font-weight:800;font-size:.8rem;color:${rankColor};min-width:18px;">#${idx + 1}</span>
              <a href="${tool.path || `/tools/${tool.slug}/`}" target="_blank" style="color:var(--text);text-decoration:none;font-weight:600;">
                ${toolName}
              </a>
            </div>
            <div style="font-size:.78rem;font-weight:700;color:var(--text2);">
              ${(tool.count || 0).toLocaleString()} <span style="font-size:.68rem;color:var(--text3);font-weight:500;">actions</span>
            </div>
          </div>
          <div class="prog-wrap">
            <div class="prog-fill" style="width:${pct}%;background:linear-gradient(90deg,var(--purple),#818cf8);"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Feedback (Messages) ───────────────────────────────────────────────────
  async loadFeedback() {
    const tbody = document.getElementById('fb-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6"><div class="empty">Loading feedback messages...</div></td></tr>';

    try {
      const res = await this.apiFetch('/api/admin/feedback');
      const data = await res.json();
      this.feedback = data.feedback || [];

      // Update badge
      const unreadCount = this.feedback.filter(f => f.status === 'unread').length;
      this.setUnreadBadge(unreadCount);

      if (this.feedback.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><span class="empty-icon">📬</span>Inbox is clear. No teacher messages yet.</div></td></tr>';
        return;
      }

      tbody.innerHTML = this.feedback.map(item => {
        const catBadge = this.getCategoryBadge(item.category);
        const statusBadge = this.getStatusBadge(item.status);
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
        const senderName = this.escapeHtml(item.name || 'Anonymous Teacher');
        const senderEmail = item.email ? `<a href="mailto:${encodeURIComponent(item.email)}" style="color:var(--text3);text-decoration:none;font-size:.74rem;">${this.escapeHtml(item.email)}</a>` : '<span style="color:var(--text3);font-size:.74rem;">No email</span>';

        return `
          <tr>
            <td style="white-space:nowrap;">
              <div style="font-weight:700;color:var(--text);">${senderName}</div>
              <div>${senderEmail}</div>
            </td>
            <td>${catBadge}</td>
            <td>
              <div class="feed-msg">${this.escapeHtml(item.message || '')}</div>
              ${item.page_url ? `<div style="font-size:.72rem;color:var(--text3);margin-top:.2rem;"><a href="${this.escapeHtml(item.page_url)}" target="_blank" style="color:var(--purple);text-decoration:none;">${this.escapeHtml(item.page_url)}</a></div>` : ''}
            </td>
            <td style="white-space:nowrap;font-size:.78rem;color:var(--text3);">${dateStr}</td>
            <td>${statusBadge}</td>
            <td style="text-align:right;white-space:nowrap;">
              <div class="tbl-actions">
                ${item.status === 'unread' ? `<button class="btn btn-secondary btn-sm" onclick="adminApp.updateFeedbackStatus(${item.id}, 'read')">Read</button>` : ''}
                ${item.status !== 'resolved' ? `<button class="btn btn-secondary btn-sm" style="color:var(--green);border-color:rgba(16,185,129,.3);" onclick="adminApp.updateFeedbackStatus(${item.id}, 'resolved')">Resolve</button>` : ''}
                <button class="btn btn-danger btn-sm" onclick="adminApp.deleteFeedback(${item.id})">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty" style="color:var(--red);">Failed to load feedback: ${err.message}</div></td></tr>`;
    }
  }

  async updateFeedbackStatus(id, newStatus) {
    try {
      const res = await this.apiFetch(`/api/admin/feedback?id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        this.showToast(`Feedback marked as ${newStatus}.`, 'success');
        this.loadFeedback();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async deleteFeedback(id) {
    if (!confirm('Permanently delete this feedback item?')) return;
    try {
      const res = await this.apiFetch(`/api/admin/feedback?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.showToast('Feedback deleted.', 'info');
        this.loadFeedback();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ── Ratings (In-Page Micro Widget Sentiment) ──────────────────────────────
  async loadRatings(range = '7d') {
    try {
      const res = await this.apiFetch(`/api/admin/feedback?view=ratings&range=${range}`);
      const data = await res.json();
      this.ratingsData = data;

      const summary = data.summary || {};
      const totalEl = document.getElementById('rat-total');
      const pctEl = document.getElementById('rat-pct');
      const negEl = document.getElementById('rat-neg');

      if (totalEl) totalEl.textContent = (summary.totalRatings || 0).toLocaleString();
      if (pctEl) pctEl.textContent = summary.overallApproval !== null && summary.overallApproval !== undefined ? `${summary.overallApproval}%` : '—';
      if (negEl) negEl.textContent = (summary.totalNegative || 0).toLocaleString();

      // Per-Tool Bars
      const barsContainer = document.getElementById('rat-bars');
      if (barsContainer) {
        const tools = data.byTool || [];
        if (tools.length === 0) {
          barsContainer.innerHTML = '<div class="empty"><span class="empty-icon">📊</span>No widget ratings collected yet.</div>';
        } else {
          barsContainer.innerHTML = tools.map(t => {
            const pos = t.positive || 0;
            const neg = t.negative || 0;
            const tot = t.total || (pos + neg);
            const approval = tot > 0 ? Math.round((pos / tot) * 100) : 0;
            const barColor = approval >= 80 ? 'var(--green)' : approval >= 50 ? 'var(--amber)' : 'var(--red)';

            return `
              <div class="rat-row">
                <div class="rat-top">
                  <span style="font-weight:700;">${this.formatToolName(t.tool_name)}</span>
                  <div class="rat-counts">
                    <span style="color:var(--green);font-weight:700;">👍 ${pos}</span>
                    <span style="color:var(--red);font-weight:700;">👎 ${neg}</span>
                    <span class="badge ${approval >= 80 ? 'bg' : approval >= 50 ? 'ba' : 'br'}">${approval}% approval</span>
                  </div>
                </div>
                <div class="prog-wrap">
                  <div class="prog-fill" style="width:${approval}%;background:${barColor};"></div>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      // Recent Comments
      const commentsContainer = document.getElementById('rat-comments');
      if (commentsContainer) {
        const comments = data.recentComments || [];
        if (comments.length === 0) {
          commentsContainer.innerHTML = '<div class="empty"><span class="empty-icon">💬</span>No user rating comments yet.</div>';
        } else {
          commentsContainer.innerHTML = comments.map(c => {
            const isPos = c.rating === 'thumbs_up';
            const icon = isPos ? '👍' : '👎';
            const badgeClass = isPos ? 'bg' : 'br';
            const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

            return `
              <div class="feed-item">
                <div class="feed-avatar" style="background:${isPos ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)'};color:${isPos ? 'var(--green)' : 'var(--red)'};">
                  ${icon}
                </div>
                <div class="feed-body">
                  <div class="feed-meta">
                    <span class="badge ${badgeClass}">${this.formatToolName(c.tool_name)}</span>
                    <span>${dateStr}</span>
                  </div>
                  <div class="feed-msg">${this.escapeHtml(c.comment)}</div>
                </div>
              </div>
            `;
          }).join('');
        }
      }

    } catch (err) {
      console.error('Failed to load ratings:', err);
    }
  }

  // ── Blog & Guides CMS ─────────────────────────────────────────────────────
  async loadBlogPosts() {
    const tbody = document.getElementById('blog-tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4"><div class="empty">Loading articles from D1...</div></td></tr>';

    try {
      const res = await this.apiFetch('/api/admin/posts');
      const data = await res.json();
      this.posts = data.posts || [];

      if (this.posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4"><div class="empty"><span class="empty-icon">📝</span>No articles found in D1 database.</div></td></tr>';
        return;
      }

      tbody.innerHTML = this.posts.map(post => {
        const isPublished = post.status === 'published';
        const statusBadge = isPublished
          ? '<span class="badge bg">Published</span>'
          : '<span class="badge ba">Draft</span>';
        const dateStr = post.publish_date || (post.created_at ? post.created_at.slice(0, 10) : '—');

        return `
          <tr>
            <td>
              <div style="font-weight:700;color:var(--text);margin-bottom:.15rem;">${this.escapeHtml(post.title)}</div>
              <div style="font-family:monospace;font-size:.75rem;color:var(--text3);">
                /blog/${this.escapeHtml(post.slug)}/
                <a href="/blog/${encodeURIComponent(post.slug)}/" target="_blank" style="color:var(--purple);margin-left:.35rem;text-decoration:none;">↗</a>
              </div>
            </td>
            <td>${statusBadge}</td>
            <td style="white-space:nowrap;font-size:.78rem;color:var(--text3);">${dateStr}</td>
            <td style="text-align:right;white-space:nowrap;">
              <div class="tbl-actions">
                <button class="btn btn-secondary btn-sm" onclick="adminApp.openEditPost(${post.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="adminApp.deletePost(${post.id})">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="empty" style="color:var(--red);">Failed to load posts: ${err.message}</div></td></tr>`;
    }
  }

  openNewPost() {
    document.getElementById('modal-title').textContent = 'New Article';
    document.getElementById('edit-post-id').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-slug').value = '';
    document.getElementById('post-excerpt').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-preview').innerHTML = '<p style="color:var(--text3);font-style:italic;">Preview will appear here as you type...</p>';
    document.getElementById('btn-del-post').style.display = 'none';

    document.getElementById('post-modal').classList.add('open');
    document.getElementById('post-title').focus();
  }

  openEditPost(id) {
    const post = this.posts.find(p => p.id === id);
    if (!post) return;

    document.getElementById('modal-title').textContent = 'Edit Article';
    document.getElementById('edit-post-id').value = post.id;
    document.getElementById('post-title').value = post.title || '';
    document.getElementById('post-slug').value = post.slug || '';
    document.getElementById('post-excerpt').value = post.description || '';
    document.getElementById('post-content').value = post.content || '';
    this.updatePreview(post.content || '');

    document.getElementById('btn-del-post').style.display = 'inline-flex';
    document.getElementById('post-modal').classList.add('open');
  }

  closeModal() {
    document.getElementById('post-modal').classList.remove('open');
  }

  initEditorPreview() {
    const contentInput = document.getElementById('post-content');
    const titleInput = document.getElementById('post-title');
    const slugInput = document.getElementById('post-slug');

    if (contentInput) {
      contentInput.addEventListener('input', () => {
        this.updatePreview(contentInput.value);
      });
    }

    if (titleInput && slugInput) {
      titleInput.addEventListener('input', () => {
        const id = document.getElementById('edit-post-id').value;
        if (!id) {
          slugInput.value = this.slugify(titleInput.value);
        }
      });
    }
  }

  updatePreview(markdown) {
    const previewEl = document.getElementById('post-preview');
    if (!previewEl) return;
    if (!markdown.trim()) {
      previewEl.innerHTML = '<p style="color:var(--text3);font-style:italic;">Preview will appear here as you type...</p>';
      return;
    }
    previewEl.innerHTML = this.renderMarkdown(markdown);
  }

  async savePost() {
    const id = document.getElementById('edit-post-id').value;
    const title = document.getElementById('post-title').value.trim();
    const slug = document.getElementById('post-slug').value.trim();
    const description = document.getElementById('post-excerpt').value.trim();
    const content = document.getElementById('post-content').value.trim();

    if (!title || !slug || !content) {
      this.showToast('Please fill in title, slug, and content.', 'danger');
      return;
    }

    const payload = { title, slug, description, content, status: 'published' };
    const method = id ? 'PUT' : 'POST';
    if (id) payload.id = id;

    try {
      const res = await this.apiFetch('/api/admin/posts', {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        this.showToast('Article saved to D1 successfully!', 'success');
        this.closeModal();
        this.loadBlogPosts();
      } else {
        this.showToast(data.error || 'Failed to save post', 'danger');
      }
    } catch (err) {
      console.error(err);
    }
  }

  async deletePost(id) {
    const targetId = id || document.getElementById('edit-post-id').value;
    if (!targetId) return;

    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const res = await this.apiFetch(`/api/admin/posts?id=${targetId}`, { method: 'DELETE' });
      if (res.ok) {
        this.showToast('Article deleted.', 'info');
        this.closeModal();
        this.loadBlogPosts();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ── Settings, Security & Announcement Banner ──────────────────────────────
  async loadSettings() {
    try {
      const res = await this.apiFetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) {
        this.settings = data.settings;

        // Announcement Banner
        const annActive = document.getElementById('ann-active');
        const annText = document.getElementById('ann-text');
        const annType = document.getElementById('ann-type');
        const annLink = document.getElementById('ann-link');

        if (annActive) annActive.checked = this.settings.announcement_active === 'true' || this.settings.announcement_active === true;
        if (annText) annText.value = this.settings.announcement_text || '';
        if (annType) annType.value = this.settings.announcement_type || 'info';
        if (annLink) annLink.value = this.settings.announcement_link || '';
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  async saveAnnouncement() {
    const active = document.getElementById('ann-active')?.checked || false;
    const text = document.getElementById('ann-text')?.value.trim() || '';
    const type = document.getElementById('ann-type')?.value || 'info';
    const link = document.getElementById('ann-link')?.value.trim() || '';

    const payload = {
      announcement_active: String(active),
      announcement_text: text,
      announcement_type: type,
      announcement_link: link
    };

    try {
      const res = await this.apiFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.showToast('Announcement banner updated and broadcast!', 'success');
      }
    } catch (err) {
      console.error(err);
    }
  }

  disableAnn() {
    const annActive = document.getElementById('ann-active');
    if (annActive) annActive.checked = false;
    this.saveAnnouncement();
  }

  // ── Passcode Change (Security: Invalidates all old tokens) ─────────────────
  async changePasscode() {
    const newPass = document.getElementById('new-pass')?.value.trim();
    const confPass = document.getElementById('conf-pass')?.value.trim();
    const errEl = document.getElementById('pass-err');
    const saveBtn = document.getElementById('btn-save-pass');

    if (errEl) errEl.style.display = 'none';

    if (!newPass || newPass.length < 6) {
      if (errEl) {
        errEl.textContent = 'Passcode must be at least 6 characters long.';
        errEl.style.display = 'block';
      }
      return;
    }

    if (newPass !== confPass) {
      if (errEl) {
        errEl.textContent = 'Passcodes do not match.';
        errEl.style.display = 'block';
      }
      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Updating security key...</span>';
    }

    try {
      const res = await this.apiFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ new_passcode: newPass })
      });
      const data = await res.json();

      if (res.ok) {
        this.showToast('Passcode changed! All previous sessions have been invalidated. Logging out...', 'success');
        document.getElementById('new-pass').value = '';
        document.getElementById('conf-pass').value = '';

        // Immediately logout to force re-authentication with new passcode
        setTimeout(() => {
          if (typeof adminLogout === 'function') adminLogout();
        }, 1800);
      } else {
        if (errEl) {
          errEl.textContent = data.error || 'Failed to update passcode.';
          errEl.style.display = 'block';
        }
      }
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message || 'Connection error';
        errEl.style.display = 'block';
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Save &amp; Invalidate Old Sessions
        `;
      }
    }
  }

  // ── D1 Diagnostics ────────────────────────────────────────────────────────
  async testDb() {
    const btn = document.getElementById('btn-test-db');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Testing latency...';
    }

    const t0 = performance.now();
    try {
      const res = await this.apiFetch('/api/admin/analytics?range=today');
      const ms = Math.round(performance.now() - t0);
      if (res.ok) {
        this.showToast(`Cloudflare D1 query responded in ${ms}ms. Connection active and healthy!`, 'success');
      } else {
        this.showToast(`D1 returned HTTP status ${res.status}`, 'danger');
      }
    } catch (err) {
      this.showToast(`D1 latency test failed: ${err.message}`, 'danger');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⚡ Test DB Latency';
      }
    }
  }

  refreshAll() {
    this.showToast('Refreshing live data from D1...', 'info');
    if (this.currentPage === 'overview') this.loadOverview();
    else if (this.currentPage === 'feedback') {
      this.loadFeedback();
      this.loadRatings();
    } else if (this.currentPage === 'blog') this.loadBlogPosts();
    else if (this.currentPage === 'settings') this.loadSettings();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  async updateUnreadBadge() {
    try {
      const res = await this.apiFetch('/api/admin/feedback?status=unread');
      const data = await res.json();
      const unreadCount = (data.feedback || []).length;
      this.setUnreadBadge(unreadCount);
    } catch (_) {}
  }

  setUnreadBadge(count) {
    const badge = document.getElementById('unread-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  getCategoryBadge(cat) {
    const map = {
      improvement: '<span class="badge bp">Improvement</span>',
      'new-tool': '<span class="badge ba">New Tool Request</span>',
      bug: '<span class="badge br">Bug Report</span>',
      compliment: '<span class="badge bg">Compliment</span>',
      general: '<span class="badge bw">General</span>'
    };
    return map[cat] || `<span class="badge bw">${this.escapeHtml(cat || 'General')}</span>`;
  }

  getStatusBadge(status) {
    const map = {
      unread: '<span class="badge ba">Unread</span>',
      read: '<span class="badge bp">Read</span>',
      resolved: '<span class="badge bg">Resolved</span>'
    };
    return map[status] || `<span class="badge bw">${this.escapeHtml(status || '')}</span>`;
  }

  formatToolName(slug) {
    if (!slug) return 'Unknown Tool';
    return slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  renderMarkdown(md) {
    // Lightweight safe Markdown renderer for previews
    let html = this.escapeHtml(md)
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold & Italic
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Inline Code
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      // Line breaks & paragraphs
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');

    return `<p>${html}</p>`;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    if (this.toastTimer) clearTimeout(this.toastTimer);

    const icons = {
      success: '✅',
      danger: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> <span>${this.escapeHtml(message)}</span>`;
    toast.style.display = 'flex';

    this.toastTimer = setTimeout(() => {
      toast.style.display = 'none';
    }, 3200);
  }
}

// Attach globally
window.AdminApp = AdminApp;
