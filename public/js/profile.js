document.addEventListener('DOMContentLoaded', async () => {
  api.requireAuth();
  const currentUser = api.getUser();

  const params = new URLSearchParams(window.location.search);
  const profileUsername = params.get('user') || currentUser.username;
  const isOwnProfile = profileUsername === currentUser.username;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    api.clearSession();
    window.location.href = '/index.html';
  });

  /* ===========================
     LOAD PROFILE
  =========================== */
  const profileContent = document.getElementById('profileContent');

  // Show skeleton while loading
  document.getElementById('profileAvatar').innerHTML =
    `<div class="skeleton" style="width:100px;height:100px;border-radius:50%"></div>`;
  document.getElementById('profileDisplayName').innerHTML =
    `<div class="skeleton skeleton-text" style="width:140px;height:18px;margin:0 auto 8px"></div>`;
  document.getElementById('profileUsername').innerHTML =
    `<div class="skeleton skeleton-text" style="width:90px;height:12px;margin:0 auto"></div>`;
  document.getElementById('profileBio').innerHTML = '';

  let profileUser = null;

  try {
    const data = await api.get(`/users/${profileUsername}`);
    profileUser = data.profile;
    renderProfile(profileUser);
    loadUserPosts();
  } catch (err) {
    profileContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>User <strong>@${escapeHTML(profileUsername)}</strong> not found.</p>
        <a href="/feed.html" class="btn btn-secondary btn-sm" style="margin-top:1rem">← Back to Feed</a>
      </div>`;
  }

  function renderProfile(p) {
    document.title = `@${p.username} · Nexus`;

    document.getElementById('profileAvatar').innerHTML = avatarHTML(p, 'avatar-xl');
    document.getElementById('profileDisplayName').textContent = p.username;
    document.getElementById('profileUsername').textContent = `@${p.username}`;
    document.getElementById('profileBio').textContent = p.bio || 'No bio yet.';
    document.getElementById('profileFollowers').textContent = Number(p.followers_count || 0).toLocaleString();
    document.getElementById('profileFollowing').textContent = Number(p.following_count || 0).toLocaleString();

    const actionArea = document.getElementById('profileActionArea');
    if (isOwnProfile) {
      actionArea.innerHTML = `
        <a href="/create-post.html" class="btn btn-primary">
          <i class="bi bi-plus-lg"></i> New Post
        </a>
        <button id="editProfileBtn" class="btn btn-secondary">
          <i class="bi bi-pencil"></i> Edit Profile
        </button>`;
      document.getElementById('editProfileBtn').addEventListener('click', openEditModal);
    } else {
      actionArea.innerHTML = `
        <button id="followBtn" class="btn btn-primary" data-following="false">
          <i class="bi bi-person-plus"></i> Follow
        </button>
        <a href="mailto:" class="btn btn-secondary">
          <i class="bi bi-chat-dots"></i> Message
        </a>`;
      document.getElementById('followBtn').addEventListener('click', toggleFollow);
    }
  }

  /* ===========================
     FOLLOW / UNFOLLOW
  =========================== */
  async function toggleFollow() {
    const btn = document.getElementById('followBtn');
    const isFollowing = btn.dataset.following === 'true';
    btnLoading(btn, isFollowing ? 'Unfollowing...' : 'Following...');

    try {
      if (isFollowing) {
        await api.delete(`/follows/user/${profileUser.id}`);
        btn.dataset.following = 'false';
        btn.innerHTML = '<i class="bi bi-person-plus"></i> Follow';
        btn.className = 'btn btn-primary';
        toast('Unfollowed.', 'info');
        const el = document.getElementById('profileFollowers');
        el.textContent = Math.max(0, parseInt(el.textContent.replace(/,/g, '')) - 1).toLocaleString();
      } else {
        await api.post(`/follows/user/${profileUser.id}`, {});
        btn.dataset.following = 'true';
        btn.innerHTML = '<i class="bi bi-person-check-fill"></i> Following';
        btn.className = 'btn btn-secondary';
        toast('Following! Their posts will appear in your feed. 🎉', 'success');
        const el = document.getElementById('profileFollowers');
        el.textContent = (parseInt(el.textContent.replace(/,/g, '')) + 1).toLocaleString();
      }
    } catch (err) {
      toast(err.message, 'danger');
      btnReset(btn);
    }
  }

  /* ===========================
     EDIT PROFILE MODAL
  =========================== */
  function openEditModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:460px">
        <div class="modal-title">Edit Profile</div>
        <div id="editAlert" class="alert alert-danger"></div>
        <div class="form-group">
          <label class="form-label">Bio</label>
          <textarea id="editBio" class="form-control" rows="3" maxlength="200" placeholder="Tell people about yourself...">${escapeHTML(profileUser.bio || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Avatar URL</label>
          <input type="url" id="editAvatar" class="form-control" placeholder="https://example.com/avatar.jpg" value="${escapeHTML(profileUser.avatar_url || '')}">
        </div>
        <div class="modal-actions">
          <button id="editCancel" class="btn btn-secondary">Cancel</button>
          <button id="editSave" class="btn btn-primary"><i class="bi bi-check-lg"></i> Save Changes</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-open'));

    const close = () => { overlay.classList.remove('modal-open'); setTimeout(() => overlay.remove(), 250); };
    overlay.querySelector('#editCancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelector('#editSave').addEventListener('click', async () => {
      const bio = overlay.querySelector('#editBio').value.trim();
      const avatar_url = overlay.querySelector('#editAvatar').value.trim() || null;
      const alertEl = overlay.querySelector('#editAlert');
      const saveBtn = overlay.querySelector('#editSave');

      hideAlert(alertEl);
      btnLoading(saveBtn, 'Saving...');
      try {
        const data = await api.put('/users/profile', { bio, avatar_url });
        // Update local session
        const user = api.getUser();
        api.setSession(api.getToken(), { ...user, avatar_url: data.profile.avatar_url });
        // Refresh page data
        profileUser = data.profile;
        document.getElementById('profileAvatar').innerHTML = avatarHTML(data.profile, 'avatar-xl');
        document.getElementById('profileBio').textContent = data.profile.bio || 'No bio yet.';
        toast('Profile updated! ✨', 'success');
        close();
      } catch (err) {
        showAlert(alertEl, err.message);
        btnReset(saveBtn);
      }
    });
  }

  /* ===========================
     USER POSTS
  =========================== */
  async function loadUserPosts() {
    const container = document.getElementById('profilePosts');
    container.innerHTML = Array(3).fill(skeletonPostCard()).join('');

    try {
      const data = await api.get(`/posts?limit=50&offset=0`);
      const posts = (data.posts || []).filter(p => p.author_username === profileUsername);

      document.getElementById('profilePostCount').textContent = posts.length;

      if (!posts.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📸</div>
            <p>${isOwnProfile ? 'You haven\'t posted anything yet.' : 'No posts yet.'}</p>
            ${isOwnProfile ? `<a href="/create-post.html" class="btn btn-primary btn-sm" style="margin-top:1rem"><i class="bi bi-plus-lg"></i> Create First Post</a>` : ''}
          </div>`;
        return;
      }

      container.innerHTML = '';
      posts.forEach((p, i) => {
        const card = document.createElement('article');
        card.className = 'post-card';
        card.style.cssText = 'margin-bottom:1rem;opacity:0;transform:translateY(10px);transition:all 0.3s ease';
        card.innerHTML = `
          <div class="post-header">
            <div class="post-author">
              ${avatarHTML({ username: p.author_username, avatar_url: p.author_avatar }, 'avatar-sm')}
              <div class="post-author-info">
                <div class="name">${escapeHTML(p.author_username)}</div>
                <div class="username">${formatRelativeTime(p.created_at)}</div>
              </div>
            </div>
          </div>
          ${p.content ? `<div class="post-content">${escapeHTML(p.content)}</div>` : ''}
          ${p.media_url ? `<img src="${escapeHTML(p.media_url)}" class="post-media" loading="lazy" onerror="this.style.display='none'">` : ''}
          <div class="post-actions">
            <button class="action-btn"><i class="bi bi-heart"></i> ${p.likes_count || 0}</button>
            <button class="action-btn"><i class="bi bi-chat"></i> ${p.comments_count || 0}</button>
          </div>`;
        container.appendChild(card);
        setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, i * 60);
      });
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Failed to load posts.</p>
          <button onclick="loadUserPosts()" class="btn btn-secondary btn-sm" style="margin-top:0.75rem">
            <i class="bi bi-arrow-clockwise"></i> Retry
          </button>
        </div>`;
    }
  }
});
