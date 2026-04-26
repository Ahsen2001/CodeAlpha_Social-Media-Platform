/* ===========================
   SHARED API HELPER + UTILITIES
   Full integration: JWT, error handling, loading states, toasts
   =========================== */
const API_BASE = '/api';

/* ========== SESSION MANAGEMENT ========== */
const api = {
  getToken() { return localStorage.getItem('nexus_token'); },
  getUser() {
    const u = localStorage.getItem('nexus_user');
    return u ? JSON.parse(u) : null;
  },
  setSession(token, user) {
    localStorage.setItem('nexus_token', token);
    localStorage.setItem('nexus_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
  },
  isLoggedIn() { return !!this.getToken(); },
  requireAuth() {
    if (!this.isLoggedIn()) window.location.href = '/index.html';
  },
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) window.location.href = '/feed.html';
  },

  /* ========== CORE HTTP ========== */
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    } catch (_) {
      throw new Error('Network error – check your connection.');
    }

    // Token expired or invalid
    if (res.status === 401) {
      this.clearSession();
      toast('Session expired. Please sign in again.', 'warning');
      setTimeout(() => { window.location.href = '/index.html'; }, 1500);
      throw new Error('Unauthorized');
    }

    let data;
    try { data = await res.json(); } catch (_) { data = {}; }

    if (!res.ok) {
      const msg = (data.errors && data.errors[0]?.msg) || data.message || 'Something went wrong.';
      throw new Error(msg);
    }
    return data;
  },

  get(endpoint)        { return this.request(endpoint, { method: 'GET' }); },
  post(endpoint, body) { return this.request(endpoint, { method: 'POST',   body: JSON.stringify(body) }); },
  put(endpoint, body)  { return this.request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }); },
  delete(endpoint)     { return this.request(endpoint, { method: 'DELETE' }); },
};

/* ========== TOAST NOTIFICATION SYSTEM ========== */
function toast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  const el = document.createElement('div');
  el.className = `toast toast-${type} toast-enter`;
  el.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i><span>${escapeHTML(message)}</span>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="bi bi-x"></i></button>`;
  container.appendChild(el);

  requestAnimationFrame(() => { el.classList.remove('toast-enter'); el.classList.add('toast-show'); });

  setTimeout(() => {
    el.classList.add('toast-exit');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, duration);
}

/* ========== SKELETON LOADER HELPERS ========== */
function skeletonPostCard() {
  return `<div class="post-card skeleton-card" aria-hidden="true">
    <div class="post-header">
      <div class="skeleton-row" style="gap:0.75rem;display:flex;align-items:center">
        <div class="skeleton skeleton-avatar-sm"></div>
        <div style="flex:1">
          <div class="skeleton skeleton-text" style="width:120px;height:12px;margin-bottom:6px"></div>
          <div class="skeleton skeleton-text" style="width:70px;height:10px"></div>
        </div>
      </div>
    </div>
    <div class="skeleton skeleton-text" style="width:100%;height:14px;margin:1rem 0 0.5rem"></div>
    <div class="skeleton skeleton-text" style="width:80%;height:14px;margin-bottom:0.5rem"></div>
    <div class="skeleton skeleton-text" style="width:60%;height:14px;margin-bottom:1.25rem"></div>
    <div style="display:flex;gap:1rem;padding-top:0.75rem;border-top:1px solid var(--border)">
      <div class="skeleton skeleton-text" style="width:60px;height:28px;border-radius:8px"></div>
      <div class="skeleton skeleton-text" style="width:60px;height:28px;border-radius:8px"></div>
    </div>
  </div>`;
}

function skeletonProfileHeader() {
  return `<div class="profile-header-card skeleton-card" aria-hidden="true">
    <div class="profile-cover"></div>
    <div class="profile-avatar-wrap">
      <div class="skeleton" style="width:100px;height:100px;border-radius:50%"></div>
    </div>
    <div style="text-align:center;padding-top:0.75rem">
      <div class="skeleton skeleton-text" style="width:140px;height:18px;margin:0 auto 8px"></div>
      <div class="skeleton skeleton-text" style="width:90px;height:12px;margin:0 auto"></div>
    </div>
  </div>`;
}

/* ========== BUTTON LOADING STATE ========== */
function btnLoading(btn, text = 'Loading...') {
  btn._origHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width:16px;height:16px;border-width:2px"></span> ${text}`;
}
function btnReset(btn) {
  btn.disabled = false;
  btn.innerHTML = btn._origHTML || 'Submit';
}

/* ========== HELPERS ========== */
function formatRelativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(username) {
  if (!username) return 'U';
  return username.slice(0, 2).toUpperCase();
}

function avatarHTML(user, sizeClass = 'avatar-md') {
  const src = (user && user.avatar_url) || null;
  if (src) return `<img src="${escapeHTML(src)}" alt="${escapeHTML((user && user.username) || '')}" class="avatar ${sizeClass}">`;
  const sizeMap = { 'avatar-sm': '36px', 'avatar-md': '48px', 'avatar-lg': '72px', 'avatar-xl': '100px' };
  const sz = sizeMap[sizeClass] || '48px';
  return `<div class="avatar-placeholder ${sizeClass}" style="width:${sz};height:${sz};font-size:calc(${sz} * 0.38)">${getInitials(user && user.username)}</div>`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showAlert(el, message, type = 'danger') {
  el.className = `alert alert-${type} show`;
  el.innerHTML = `<i class="bi ${type === 'danger' ? 'bi-exclamation-circle' : 'bi-check-circle'}"></i> ${escapeHTML(message)}`;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideAlert(el) {
  el.className = 'alert';
  el.innerHTML = '';
}
