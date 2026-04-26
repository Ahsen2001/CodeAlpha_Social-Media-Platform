document.addEventListener('DOMContentLoaded', async () => {
  api.requireAuth();
  const user = api.getUser();

  // Inject user info into sidebar
  document.getElementById('navUsername').textContent = user.username;
  document.getElementById('sidebarUserAvatar').innerHTML = avatarHTML(user, 'avatar-md');
  document.getElementById('sidebarUsername').textContent = user.username;

  const feedContainer = document.getElementById('feed');
  let page = 0;
  const LIMIT = 10;
  let loading = false;
  let allLoaded = false;

  // ---- Logout ----
  document.getElementById('logoutBtn').addEventListener('click', () => {
    api.clearSession();
    window.location.href = '/index.html';
  });

  // ---- Load Feed ----
  async function loadFeed() {
    if (loading || allLoaded) return;
    loading = true;

    if (page === 0) {
      feedContainer.innerHTML = `<div class="loading-state"><span class="spinner"></span> Loading feed...</div>`;
    }

    try {
      const data = await api.get(`/posts?limit=${LIMIT}&offset=${page * LIMIT}`);
      const posts = data.posts;

      if (page === 0) feedContainer.innerHTML = '';

      if (posts.length === 0 && page === 0) {
        feedContainer.innerHTML = `<div class="empty-state">
          <div class="empty-icon">✨</div>
          <p>Your feed is empty. Follow some users or <a href="/create-post.html">create a post</a>!</p>
        </div>`;
        allLoaded = true;
        return;
      }

      posts.forEach(post => feedContainer.appendChild(createPostCard(post)));

      if (posts.length < LIMIT) allLoaded = true;
      page++;
    } catch (err) {
      feedContainer.innerHTML = `<div class="empty-state"><p>Failed to load feed. Please try again.</p></div>`;
    } finally {
      loading = false;
    }
  }

  // ---- Post Card Builder ----
  function createPostCard(post) {
    const div = document.createElement('article');
    div.className = 'post-card';
    div.dataset.postId = post.id;

    const mediaHTML = post.media_url
      ? `<img src="${escapeHTML(post.media_url)}" alt="Post media" class="post-media" loading="lazy">`
      : '';

    const isOwner = user.id === post.author_id;
    const deleteBtn = isOwner
      ? `<button class="action-btn delete-post-btn" title="Delete post" style="margin-left:auto">
           <i class="bi bi-trash3"></i>
         </button>` : '';

    div.innerHTML = `
      <div class="post-header">
        <div class="post-author">
          ${avatarHTML({ username: post.author_username, avatar_url: post.author_avatar }, 'avatar-sm')}
          <div class="post-author-info">
            <div class="name">${escapeHTML(post.author_username)}</div>
            <div class="username">${formatRelativeTime(post.created_at)}</div>
          </div>
        </div>
      </div>
      ${post.content ? `<div class="post-content">${escapeHTML(post.content)}</div>` : ''}
      ${mediaHTML}
      <div class="post-actions">
        <button class="action-btn like-btn" data-liked="false">
          <i class="bi bi-heart"></i> <span class="like-count">${post.likes_count || 0}</span>
        </button>
        <button class="action-btn comment-toggle-btn">
          <i class="bi bi-chat"></i> <span class="comment-count">${post.comments_count || 0}</span>
        </button>
        ${deleteBtn}
      </div>
      <div class="comment-section" id="comments-${post.id}">
        <div class="comment-input-row">
          ${avatarHTML(user, 'avatar-sm')}
          <input type="text" placeholder="Write a comment..." class="new-comment-input" maxlength="300">
          <button class="btn btn-primary btn-sm submit-comment-btn">Post</button>
        </div>
        <div class="comments-list"></div>
      </div>`;

    // Like
    const likeBtn = div.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => toggleLike(post.id, likeBtn));

    // Comments toggle
    const commentToggle = div.querySelector('.comment-toggle-btn');
    const commentSection = div.querySelector('.comment-section');
    commentToggle.addEventListener('click', () => {
      const isOpen = commentSection.classList.toggle('open');
      if (isOpen && !commentSection.dataset.loaded) {
        loadComments(post.id, commentSection);
        commentSection.dataset.loaded = 'true';
      }
    });

    // Submit comment
    const submitCommentBtn = div.querySelector('.submit-comment-btn');
    const commentInput = div.querySelector('.new-comment-input');
    submitCommentBtn.addEventListener('click', () => submitComment(post.id, commentInput, div));
    commentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitComment(post.id, commentInput, div);
    });

    // Delete
    if (isOwner) {
      div.querySelector('.delete-post-btn').addEventListener('click', () => deletePost(post.id, div));
    }

    return div;
  }

  // ---- Like ----
  async function toggleLike(postId, btn) {
    const liked = btn.dataset.liked === 'true';
    const countEl = btn.querySelector('.like-count');
    try {
      if (liked) {
        await api.delete(`/likes/post/${postId}`);
        btn.dataset.liked = 'false';
        btn.classList.remove('liked');
        btn.querySelector('i').className = 'bi bi-heart';
        countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
      } else {
        await api.post(`/likes/post/${postId}`, {});
        btn.dataset.liked = 'true';
        btn.classList.add('liked');
        btn.querySelector('i').className = 'bi bi-heart-fill';
        countEl.textContent = parseInt(countEl.textContent) + 1;
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ---- Load Comments ----
  async function loadComments(postId, section) {
    const listEl = section.querySelector('.comments-list');
    listEl.innerHTML = `<div class="loading-state" style="padding:1rem"><span class="spinner"></span></div>`;
    try {
      const data = await api.get(`/comments/post/${postId}`);
      renderComments(data.comments, listEl);
    } catch (err) {
      listEl.innerHTML = `<p class="text-muted" style="font-size:0.85rem;padding:0.5rem">Failed to load comments.</p>`;
    }
  }

  function renderComments(comments, listEl) {
    if (!comments.length) {
      listEl.innerHTML = `<p class="text-muted" style="font-size:0.85rem;padding:0.5rem 0">No comments yet. Be the first!</p>`;
      return;
    }
    listEl.innerHTML = comments.map(c => `
      <div class="comment-item">
        ${avatarHTML({ username: c.author_username, avatar_url: c.author_avatar }, 'avatar-sm')}
        <div class="comment-body">
          <span class="comment-author">${escapeHTML(c.author_username)}</span>
          <div class="comment-text">${escapeHTML(c.content)}</div>
          <div class="comment-time">${formatRelativeTime(c.created_at)}</div>
        </div>
      </div>`).join('');
  }

  // ---- Submit Comment ----
  async function submitComment(postId, input, postEl) {
    const content = input.value.trim();
    if (!content) return;
    try {
      await api.post(`/comments/post/${postId}`, { content });
      input.value = '';
      const countEl = postEl.querySelector('.comment-count');
      countEl.textContent = parseInt(countEl.textContent) + 1;
      const section = postEl.querySelector('.comment-section');
      loadComments(postId, section);
    } catch (err) {
      console.error(err);
    }
  }

  // ---- Delete Post ----
  async function deletePost(postId, el) {
    if (!confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      el.style.opacity = '0';
      el.style.transform = 'translateY(-10px)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.remove(), 300);
    } catch (err) {
      alert(err.message);
    }
  }

  // ---- Infinite Scroll ----
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadFeed();
  }, { threshold: 0.1 });
  const sentinel = document.getElementById('loadSentinel');
  if (sentinel) observer.observe(sentinel);

  await loadFeed();
});
