document.addEventListener('DOMContentLoaded', () => {
  api.requireAuth();
  const user = api.getUser();

  document.getElementById('authorAvatar').innerHTML = avatarHTML(user, 'avatar-md');
  document.getElementById('authorName').textContent = user.username;

  const contentInput = document.getElementById('postContent');
  const charCount = document.getElementById('charCount');
  const mediaUrlInput = document.getElementById('mediaUrl');
  const mediaPreview = document.getElementById('mediaPreview');
  const previewImg = document.getElementById('previewImg');
  const removeMediaBtn = document.getElementById('removeMedia');
  const form = document.getElementById('createPostForm');
  const alert = document.getElementById('postAlert');
  const submitBtn = document.getElementById('submitPostBtn');

  // ---- Logout ----
  document.getElementById('logoutBtn').addEventListener('click', () => {
    api.clearSession();
    window.location.href = '/index.html';
  });

  // ---- Char counter ----
  contentInput.addEventListener('input', () => {
    const len = contentInput.value.length;
    charCount.textContent = `${len} / 500`;
    charCount.style.color = len > 450 ? 'var(--danger)' : 'var(--text-muted)';
  });

  // ---- Media URL Preview ----
  let previewTimer;
  mediaUrlInput.addEventListener('input', () => {
    clearTimeout(previewTimer);
    const url = mediaUrlInput.value.trim();
    if (!url) { mediaPreview.style.display = 'none'; return; }
    previewTimer = setTimeout(() => {
      previewImg.src = url;
      previewImg.onload = () => { mediaPreview.style.display = 'block'; };
      previewImg.onerror = () => { mediaPreview.style.display = 'none'; };
    }, 600);
  });

  removeMediaBtn.addEventListener('click', () => {
    mediaUrlInput.value = '';
    mediaPreview.style.display = 'none';
    previewImg.src = '';
  });

  // ---- Submit ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(alert);

    const content = contentInput.value.trim();
    const media_url = mediaUrlInput.value.trim() || null;

    if (!content && !media_url) {
      showAlert(alert, 'Please add some content or a media URL.', 'danger');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Publishing...';

    try {
      await api.post('/posts', { content: content || null, media_url });
      showAlert(alert, 'Post published successfully! Redirecting...', 'success');
      setTimeout(() => { window.location.href = '/feed.html'; }, 1200);
    } catch (err) {
      showAlert(alert, err.message, 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-send"></i> Publish Post';
    }
  });
});
