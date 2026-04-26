/* ===========================
   SHARED API HELPER
   =========================== */
const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('nexus_token');
  },
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
  isLoggedIn() {
    return !!this.getToken();
  },
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/index.html';
    }
  },
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = '/feed.html';
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },
};

// ---- Helper Utilities ----
function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getInitials(username) {
  return username ? username.slice(0, 2).toUpperCase() : 'U';
}

function avatarHTML(user, sizeClass = 'avatar-md', url = null) {
  const src = url || (user && user.avatar_url) || null;
  if (src) {
    return `<img src="${escapeHTML(src)}" alt="avatar" class="avatar ${sizeClass}">`;
  }
  const sizeMap = { 'avatar-sm': '36px', 'avatar-md': '48px', 'avatar-lg': '72px', 'avatar-xl': '100px' };
  const sz = sizeMap[sizeClass] || '48px';
  return `<div class="avatar-placeholder ${sizeClass}" style="width:${sz};height:${sz};font-size:calc(${sz} * 0.38)">
    ${getInitials((user && user.username) || 'U')}
  </div>`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showAlert(el, message, type = 'danger') {
  el.className = `alert alert-${type} show`;
  el.textContent = message;
}
function hideAlert(el) {
  el.className = 'alert';
  el.textContent = '';
}
