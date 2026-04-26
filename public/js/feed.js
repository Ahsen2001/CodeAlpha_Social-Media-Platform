document.addEventListener('DOMContentLoaded', async () => {
  api.requireAuth();
  const user = api.getUser();

  // Populate navbar & sidebar
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
    toast('Signed out. See you soon! 👋', 'info', 2000);
    setTimeout(() => { window.location.href = '/index.html'; }, 1500);
  });

  /* ===========================
     SKELETON LOADING
  =========================== */
  function showSkeletons(count = 3) {
    feedContainer.innerHTML = Array(count).fill(skeletonPostCard()).join('');
  }

  /* ===========================
     FEED LOADING
  =========================== */
  async function loadFeed() {
    if (loading || allLoaded) return;
    loading = true;

    if (page === 0) showSkeletons(3);

    try {
      const data = await api.get(`/posts?limit=${LIMIT}&offset=${page * LIMIT}`);
      const posts = data.posts || [];

      if (page === 0) feedContainer.innerHTML = '';

      if (posts.length === 0 && page === 0) {
        feedContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">✨</div>
            <p>Your feed is empty!</p>
            <p style="font-size:0.85rem;margin-top:0.5rem">Follow some users or <a href="/create-post.html">create a post</a> to get started.</p>
          </div>`;
        allLoaded = true;
        return;
      }

      posts.forEach(post => {
        const card = createPostCard(post);
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        feedContainer.appendChild(card);
        requestAnimationFrame(() => {
          card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
      });

      if (posts.length < LIMIT) {
        allLoaded = true;
        if (page > 0) {
          const endMsg = document.createElement('p');
          endMsg.className = 'text-muted';
          endMsg.style.cssText = 'text-align:center;font-size:0.85rem;padding:1.5rem 0';
          endMsg.textContent = "You're all caught up! 🎉";
          feedContainer.appendChild(endMsg);
        }
      }
      page++;
    } catch (err) {
      if (page === 0) {
        feedContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <p>Couldn't load your feed.</p>
            <button onclick="location.reload()" class="btn btn-secondary btn-sm" style="margin-top:0.75rem">
              <i class="bi bi-arrow-clockwise"></i> Retry
            </button>
          </div>`;
      } else {
        toast('Failed to load more posts.', 'danger');
      }
    } finally {
      loading = false;
    }
  }

  /* ===========================
     POST CARD BUILDER
  =========================== */
  function createPostCard(post) {
    const div = document.createElement('article');
    div.className = 'post-card';
    div.dataset.postId = post.id;

    const isOwner = user.id === post.author_id;

    const mediaHTML = post.media_url
      ? `<img src="${escapeHTML(post.media_url)}" alt="Post media" class="post-media" loading="lazy"
             onerror="this.style.display='none'">`
      : '';

    const deleteBtn = isOwner
      ? `<button class="action-btn delete-post-btn" title="Delete post" style="margin-left:auto;color:var(--text-muted)">
           <i class="bi bi-trash3"></i>
         </button>` : '';

    const liked = false; // Initial state; no server state yet without per-post endpoint

    div.innerHTML = `
      <div class="post-header">
        <a href="/profile.html?user=${escapeHTML(post.author_username)}" class="post-author" style="text-decoration:none">
          ${avatarHTML({ username: post.author_username, avatar_url: post.author_avatar }, 'avatar-sm')}
          <div class="post-author-info">
            <div class="name">${escapeHTML(post.author_username)}</div>
            <div class="username">${formatRelativeTime(post.created_at)}</div>
          </div>
        </a>
        ${deleteBtn}
      </div>
      ${post.content ? `<div class="post-content">${escapeHTML(post.content)}</div>` : ''}
      ${mediaHTML}
      <div class="post-actions">
        <button class="action-btn like-btn" data-liked="${liked}" aria-label="Like post">
          <i class="bi bi-heart"></i>
          <span class="like-count">${post.likes_count || 0}</span>
        </button>
        <button class="action-btn comment-toggle-btn" aria-label="Toggle comments">
          <i class="bi bi-chat"></i>
          <span class="comment-count">${post.comments_count || 0}</span>
        </button>
        <button class="action-btn share-btn" aria-label="Share post" style="margin-left:auto">
          <i class="bi bi-share"></i>
        </button>
      </div>
      <div class="comment-section">
        <div class="comment-input-row">
          ${avatarHTML(user, 'avatar-sm')}
          <input type="text" placeholder="Write a comment..." class="new-comment-input" maxlength="300" aria-label="Add comment">
          <button class="btn btn-primary btn-sm submit-comment-btn">Post</button>
        </div>
        <div class="comments-list"></div>
      </div>`;

    // Like toggle
    const likeBtn = div.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => toggleLike(post.id, likeBtn));

    // Comment section toggle
    const commentSection = div.querySelector('.comment-section');
    div.querySelector('.comment-toggle-btn').addEventListener('click', () => {
      const wasOpen = commentSection.classList.contains('open');
      commentSection.classList.toggle('open');
      if (!wasOpen && !commentSection.dataset.loaded) {
        loadComments(post.id, commentSection);
        commentSection.dataset.loaded = 'true';
      }
    });

    // Submit comment
    const commentInput = div.querySelector('.new-comment-input');
    const submitCommentBtn = div.querySelector('.submit-comment-btn');
    submitCommentBtn.addEventListener('click', () => submitComment(post.id, commentInput, div));
    commentInput.addEventListener('keydown', e => { if (e.key === 'Enter') submitComment(post.id, commentInput, div); });

    // Share
    div.querySelector('.share-btn').addEventListener('click', () => {
      const url = `${location.origin}/post.html?id=${post.id}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => toast('Post link copied! 🔗', 'success'));
      } else {
        toast('Copy: ' + url, 'info');
      }
    });

    // Delete
    if (isOwner) {
      div.querySelector('.delete-post-btn').addEventListener('click', () => deletePost(post.id, div));
    }

    return div;
  }

  /* ===========================
     LIKE SYSTEM
  =========================== */
  async function toggleLike(postId, btn) {
    if (btn.dataset.pending === 'true') return; // prevent double-click
    btn.dataset.pending = 'true';

    const liked = btn.dataset.liked === 'true';
    const countEl = btn.querySelector('.like-count');

    // Optimistic UI update
    const newLiked = !liked;
    const delta = newLiked ? 1 : -1;
    btn.dataset.liked = String(newLiked);
    btn.classList.toggle('liked', newLiked);
    btn.querySelector('i').className = newLiked ? 'bi bi-heart-fill' : 'bi bi-heart';
    countEl.textContent = Math.max(0, parseInt(countEl.textContent) + delta);

    try {
      if (liked) {
        await api.delete(`/likes/post/${postId}`);
      } else {
        await api.post(`/likes/post/${postId}`, {});
      }
    } catch (err) {
      // Revert on failure
      btn.dataset.liked = String(liked);
      btn.classList.toggle('liked', liked);
      btn.querySelector('i').className = liked ? 'bi bi-heart-fill' : 'bi bi-heart';
      countEl.textContent = Math.max(0, parseInt(countEl.textContent) - delta);
      toast(err.message, 'danger');
    } finally {
      btn.dataset.pending = 'false';
    }
  }

  /* ===========================
     COMMENTS
  =========================== */
  async function loadComments(postId, section) {
    const listEl = section.querySelector('.comments-list');
    listEl.innerHTML = `<div class="loading-state" style="padding:0.75rem 0">
      <span class="spinner" style="width:16px;height:16px;border-width:2px"></span>
      <span style="color:var(--text-muted);font-size:0.85rem">Loading comments...</span>
    </div>`;
    try {
      const data = await api.get(`/comments/post/${postId}`);
      renderComments(data.comments, listEl);
    } catch (err) {
      listEl.innerHTML = `<p class="text-muted" style="font-size:0.85rem;padding:0.5rem 0">
        Failed to load comments. <a href="#" onclick="loadComments(${postId}, this.closest('.comment-section'))">Retry</a>
      </p>`;
    }
  }

  function renderComments(comments, listEl) {
    if (!comments || !comments.length) {
      listEl.innerHTML = `<p class="text-muted" style="font-size:0.85rem;padding:0.5rem 0;font-style:italic">No comments yet – be the first! 💬</p>`;
      return;
    }
    listEl.innerHTML = comments.map(c => `
      <div class="comment-item">
        ${avatarHTML({ username: c.author_username, avatar_url: c.author_avatar }, 'avatar-sm')}
        <div class="comment-body">
          <a href="/profile.html?user=${escapeHTML(c.author_username)}" class="comment-author">${escapeHTML(c.author_username)}</a>
          <div class="comment-text">${escapeHTML(c.content)}</div>
          <div class="comment-time">${formatRelativeTime(c.created_at)}</div>
        </div>
      </div>`).join('');
  }

  async function submitComment(postId, input, postEl) {
    const content = input.value.trim();
    if (!content) { input.focus(); return; }

    const btn = postEl.querySelector('.submit-comment-btn');
    btnLoading(btn, '');

    try {
      await api.post(`/comments/post/${postId}`, { content });
      input.value = '';
      const countEl = postEl.querySelector('.comment-count');
      countEl.textContent = parseInt(countEl.textContent) + 1;
      const section = postEl.querySelector('.comment-section');
      section.dataset.loaded = '';
      loadComments(postId, section);
    } catch (err) {
      toast(err.message, 'danger');
    } finally {
      btnReset(btn);
    }
  }

  /* ===========================
     DELETE POST
  =========================== */
  async function deletePost(postId, el) {
    const confirmed = await showConfirmModal('Delete this post?', 'This action cannot be undone.');
    if (!confirmed) return;

    el.style.transition = 'all 0.3s ease';
    el.style.opacity = '0.5';
    el.style.pointerEvents = 'none';

    try {
      await api.delete(`/posts/${postId}`);
      el.style.opacity = '0';
      el.style.transform = 'scale(0.98) translateY(-8px)';
      setTimeout(() => el.remove(), 300);
      toast('Post deleted.', 'success');
    } catch (err) {
      el.style.opacity = '1';
      el.style.pointerEvents = '';
      toast(err.message, 'danger');
    }
  }

  /* ===========================
     CONFIRM MODAL
  =========================== */
  function showConfirmModal(title, body) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-box">
          <div class="modal-title">${escapeHTML(title)}</div>
          <div class="modal-body-text">${escapeHTML(body)}</div>
          <div class="modal-actions">
            <button id="modalCancel" class="btn btn-secondary">Cancel</button>
            <button id="modalConfirm" class="btn btn-danger">Delete</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('modal-open'));

      const close = (result) => {
        overlay.classList.remove('modal-open');
        setTimeout(() => overlay.remove(), 250);
        resolve(result);
      };

      overlay.querySelector('#modalConfirm').addEventListener('click', () => close(true));
      overlay.querySelector('#modalCancel').addEventListener('click', () => close(false));
      overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
    });
  }

  /* ===========================
     INFINITE SCROLL
  =========================== */
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !loading && !allLoaded) loadFeed();
  }, { threshold: 0.1 });
  const sentinel = document.getElementById('loadSentinel');
  if (sentinel) observer.observe(sentinel);

  await loadFeed();
});
