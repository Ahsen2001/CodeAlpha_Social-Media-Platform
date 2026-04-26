document.addEventListener('DOMContentLoaded', async () => {
  api.requireAuth();
  const currentUser = api.getUser();

  // Determine whose profile to load
  const params = new URLSearchParams(window.location.search);
  const profileUsername = params.get('user') || currentUser.username;
  const isOwnProfile = profileUsername === currentUser.username;

  let profileUser = null;

  // ---- Logout ----
  document.getElementById('logoutBtn').addEventListener('click', () => {
    api.clearSession();
    window.location.href = '/index.html';
  });

  // ---- Load Profile ----
  async function loadProfile() {
    try {
      const data = await api.get(`/users/${profileUsername}`);
      profileUser = data.profile;
      renderProfile(profileUser);
      loadUserPosts();
    } catch (err) {
      document.getElementById('profileContent').innerHTML =
        `<div class="empty-state"><p>User not found.</p></div>`;
    }
  }

  function renderProfile(p) {
    document.title = `${p.username} · Nexus`;
    document.getElementById('profileAvatar').innerHTML = avatarHTML(p, 'avatar-xl');
    document.getElementById('profileDisplayName').textContent = p.username;
    document.getElementById('profileUsername').textContent = `@${p.username}`;
    document.getElementById('profileBio').textContent = p.bio || 'No bio yet.';
    document.getElementById('profileFollowers').textContent = p.followers_count || 0;
    document.getElementById('profileFollowing').textContent = p.following_count || 0;

    const actionArea = document.getElementById('profileActionArea');
    if (isOwnProfile) {
      actionArea.innerHTML = `
        <a href="/create-post.html" class="btn btn-primary">
          <i class="bi bi-plus-lg"></i> New Post
        </a>
        <a href="/settings.html" class="btn btn-secondary">
          <i class="bi bi-pencil"></i> Edit Profile
        </a>`;
    } else {
      actionArea.innerHTML = `
        <button id="followBtn" class="btn btn-primary">
          <i class="bi bi-person-plus"></i> Follow
        </button>`;
      document.getElementById('followBtn').addEventListener('click', toggleFollow);
    }
  }

  async function toggleFollow() {
    const btn = document.getElementById('followBtn');
    const isFollowing = btn.dataset.following === 'true';
    try {
      if (isFollowing) {
        await api.delete(`/follows/user/${profileUser.id}`);
        btn.dataset.following = 'false';
        btn.innerHTML = '<i class="bi bi-person-plus"></i> Follow';
        btn.className = 'btn btn-primary';
        document.getElementById('profileFollowers').textContent =
          Math.max(0, parseInt(document.getElementById('profileFollowers').textContent) - 1);
      } else {
        await api.post(`/follows/user/${profileUser.id}`, {});
        btn.dataset.following = 'true';
        btn.innerHTML = '<i class="bi bi-person-check"></i> Following';
        btn.className = 'btn btn-secondary';
        document.getElementById('profileFollowers').textContent =
          parseInt(document.getElementById('profileFollowers').textContent) + 1;
      }
    } catch (err) {
      alert(err.message);
    }
  }

  // ---- Load User Posts ----
  async function loadUserPosts() {
    const container = document.getElementById('profilePosts');
    container.innerHTML = `<div class="loading-state"><span class="spinner"></span> Loading posts...</div>`;
    try {
      // Use global feed and filter, or ideally later add user-specific post endpoint
      const data = await api.get(`/posts?limit=50&offset=0`);
      const posts = data.posts.filter(p => p.author_username === profileUsername);

      document.getElementById('profilePostCount').textContent = posts.length;

      if (!posts.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📸</div><p>No posts yet.</p></div>`;
        return;
      }
      container.innerHTML = posts.map(p => `
        <article class="post-card" style="margin-bottom:1rem">
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
          ${p.media_url ? `<img src="${escapeHTML(p.media_url)}" class="post-media" loading="lazy">` : ''}
          <div class="post-actions">
            <button class="action-btn"><i class="bi bi-heart"></i> ${p.likes_count || 0}</button>
            <button class="action-btn"><i class="bi bi-chat"></i> ${p.comments_count || 0}</button>
          </div>
        </article>`).join('');
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><p>Failed to load posts.</p></div>`;
    }
  }

  await loadProfile();
});
