document.addEventListener('DOMContentLoaded', () => {
  api.requireAuth();
  const user = api.getUser();

  document.getElementById('authorAvatar').innerHTML = avatarHTML(user, 'avatar-md');
  document.getElementById('authorName').textContent = user.username;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    api.clearSession();
    window.location.href = '/index.html';
  });

  const contentInput = document.getElementById('postContent');
  const charCount = document.getElementById('charCount');
  const mediaUrlInput = document.getElementById('mediaUrl');
  const mediaPreview = document.getElementById('mediaPreview');
  const previewImg = document.getElementById('previewImg');
  const removeMediaBtn = document.getElementById('removeMedia');
  const form = document.getElementById('createPostForm');
  const alertEl = document.getElementById('postAlert');
  const submitBtn = document.getElementById('submitPostBtn');

  /* ===========================
     CHAR COUNTER
  =========================== */
  contentInput.addEventListener('input', () => {
    const len = contentInput.value.length;
    charCount.textContent = `${len} / 500`;
    if (len > 490) charCount.style.color = 'var(--danger)';
    else if (len > 450) charCount.style.color = 'var(--warning)';
    else charCount.style.color = 'var(--text-muted)';
  });

  /* ===========================
     MEDIA PREVIEW
  =========================== */
  let previewTimer;
  mediaUrlInput.addEventListener('input', () => {
    clearTimeout(previewTimer);
    const url = mediaUrlInput.value.trim();
    if (!url) { mediaPreview.style.display = 'none'; return; }
    previewTimer = setTimeout(() => {
      previewImg.src = url;
      previewImg.onload = () => { mediaPreview.style.display = 'block'; };
      previewImg.onerror = () => {
        mediaPreview.style.display = 'none';
        if (url) toast('Could not load image preview. Check the URL.', 'warning');
      };
    }, 700);
  });

  removeMediaBtn.addEventListener('click', () => {
    mediaUrlInput.value = '';
    mediaPreview.style.display = 'none';
    previewImg.src = '';
  });

  /* ===========================
     SUBMIT POST
  =========================== */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(alertEl);

    const content = contentInput.value.trim();
    const media_url = mediaUrlInput.value.trim() || null;

    if (!content && !media_url) {
      showAlert(alertEl, 'Please add some content or a media URL.', 'danger');
      contentInput.focus();
      return;
    }

    btnLoading(submitBtn, 'Publishing...');

    try {
      await api.post('/posts', { content: content || null, media_url });
      toast('Post published! 🚀', 'success');
      showAlert(alertEl, 'Post published! Redirecting to feed...', 'success');
      setTimeout(() => { window.location.href = '/feed.html'; }, 1200);
    } catch (err) {
      showAlert(alertEl, err.message, 'danger');
      btnReset(submitBtn);
    }
  });

  /* ===========================
     DRAFT SAVING (localStorage)
  =========================== */
  const DRAFT_KEY = 'nexus_draft_post';

  // Restore draft
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  if (savedDraft) {
    try {
      const { content, media_url } = JSON.parse(savedDraft);
      if (content) {
        contentInput.value = content;
        contentInput.dispatchEvent(new Event('input'));
      }
      if (media_url) {
        mediaUrlInput.value = media_url;
        mediaUrlInput.dispatchEvent(new Event('input'));
      }
      toast('📝 Draft restored.', 'info', 2500);
    } catch(e) {}
  }

  // Save draft on input
  let draftTimer;
  [contentInput, mediaUrlInput].forEach(el => {
    el.addEventListener('input', () => {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(() => {
        const content = contentInput.value.trim();
        const media_url = mediaUrlInput.value.trim();
        if (content || media_url) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, media_url }));
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }, 800);
    });
  });

  // Clear draft after successful submit
  form.addEventListener('submit', () => { localStorage.removeItem(DRAFT_KEY); });
});
