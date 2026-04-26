document.addEventListener('DOMContentLoaded', () => {
  api.requireAuth();
  const user = api.getUser();

  document.getElementById('authorAvatar').innerHTML = avatarHTML(user, 'avatar-md');
  document.getElementById('authorName').textContent = user.username;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    api.clearSession();
    window.location.href = '/index.html';
  });

  const contentInput     = document.getElementById('postContent');
  const charCount        = document.getElementById('charCount');
  const imageFileInput   = document.getElementById('imageFile');
  const mediaUrlInput    = document.getElementById('mediaUrl');
  const mediaPreview     = document.getElementById('mediaPreview');
  const previewImg       = document.getElementById('previewImg');
  const removeMediaBtn   = document.getElementById('removeMedia');
  const resolvedMediaUrl = document.getElementById('resolvedMediaUrl');
  const form             = document.getElementById('createPostForm');
  const alertEl          = document.getElementById('postAlert');
  const submitBtn        = document.getElementById('submitPostBtn');
  const dropzone         = document.getElementById('dropzone');
  const uploadProgress   = document.getElementById('uploadProgress');
  const progressFill     = document.getElementById('uploadProgressFill');
  const progressText     = document.getElementById('uploadProgressText');
  const tabUpload        = document.getElementById('tabUpload');
  const tabUrl           = document.getElementById('tabUrl');
  const fileUploadZone   = document.getElementById('fileUploadZone');
  const urlUploadZone    = document.getElementById('urlUploadZone');

  /* ===========================
     MODE TABS  (Upload File / Use URL)
  =========================== */
  function setMode(mode) {
    if (mode === 'upload') {
      fileUploadZone.style.display = 'block';
      urlUploadZone.style.display  = 'none';
      tabUpload.className = 'btn btn-primary btn-sm';
      tabUrl.className    = 'btn btn-secondary btn-sm';
    } else {
      fileUploadZone.style.display = 'none';
      urlUploadZone.style.display  = 'block';
      tabUpload.className = 'btn btn-secondary btn-sm';
      tabUrl.className    = 'btn btn-primary btn-sm';
    }
    clearMedia();
  }

  tabUpload.addEventListener('click', () => setMode('upload'));
  tabUrl.addEventListener('click', () => setMode('url'));

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
     CLEAR MEDIA HELPER
  =========================== */
  function clearMedia() {
    resolvedMediaUrl.value = '';
    mediaPreview.style.display = 'none';
    previewImg.src = '';
    imageFileInput.value = '';
    if (mediaUrlInput) mediaUrlInput.value = '';
    uploadProgress.style.display = 'none';
    progressFill.style.width = '0%';
  }

  removeMediaBtn.addEventListener('click', clearMedia);

  /* ===========================
     SHOW PREVIEW
  =========================== */
  function showPreview(url) {
    resolvedMediaUrl.value = url;
    previewImg.src = url;
    mediaPreview.style.display = 'block';
    previewImg.onerror = () => {
      toast('Could not load image. Check the URL.', 'warning');
      clearMedia();
    };
  }

  /* ===========================
     URL-MODE LIVE PREVIEW
  =========================== */
  let urlTimer;
  if (mediaUrlInput) {
    mediaUrlInput.addEventListener('input', () => {
      clearTimeout(urlTimer);
      const url = mediaUrlInput.value.trim();
      if (!url) { clearMedia(); return; }
      urlTimer = setTimeout(() => showPreview(url), 700);
    });
  }

  /* ===========================
     FILE SELECTION
  =========================== */
  imageFileInput.addEventListener('change', () => {
    if (imageFileInput.files[0]) uploadFile(imageFileInput.files[0]);
  });

  /* ===========================
     DRAG & DROP
  =========================== */
  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  });

  /* ===========================
     UPLOAD FILE → /api/upload/post-image
     Uses XMLHttpRequest for a real progress bar
  =========================== */
  function uploadFile(file) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const MAX_MB  = 5;

    if (!ALLOWED.includes(file.type)) {
      toast('Invalid file type. Use JPEG, PNG, GIF or WEBP.', 'danger');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast(`File too large. Maximum size is ${MAX_MB}MB.`, 'danger');
      return;
    }

    // Local instant preview while uploading
    const localUrl = URL.createObjectURL(file);
    previewImg.src = localUrl;
    mediaPreview.style.display = 'block';

    // Show progress UI
    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent  = 'Uploading...';

    const formData = new FormData();
    formData.append('image', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload/post-image');
    xhr.setRequestHeader('Authorization', `Bearer ${api.getToken()}`);

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        progressFill.style.width = `${pct}%`;
        progressText.textContent  = `Uploading... ${pct}%`;
      }
    });

    xhr.addEventListener('load', () => {
      uploadProgress.style.display = 'none';
      URL.revokeObjectURL(localUrl);
      let data;
      try { data = JSON.parse(xhr.responseText); } catch (_) {}
      if (xhr.status === 200 && data && data.success) {
        resolvedMediaUrl.value = data.image_url;
        previewImg.src = data.image_url;
        toast('Image uploaded! ✅', 'success');
      } else {
        const msg = (data && data.message) || 'Upload failed.';
        toast(msg, 'danger');
        clearMedia();
      }
    });

    xhr.addEventListener('error', () => {
      uploadProgress.style.display = 'none';
      toast('Network error during upload.', 'danger');
      clearMedia();
    });

    xhr.send(formData);
  }

  /* ===========================
     SUBMIT POST
  =========================== */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    hideAlert(alertEl);

    const content   = contentInput.value.trim();
    const media_url = resolvedMediaUrl.value.trim() || null;

    if (!content && !media_url) {
      showAlert(alertEl, 'Please add some content or an image.', 'danger');
      contentInput.focus();
      return;
    }

    // Block submit if upload is still in progress
    if (uploadProgress.style.display !== 'none') {
      toast('Please wait for the image to finish uploading.', 'warning');
      return;
    }

    btnLoading(submitBtn, 'Publishing...');

    try {
      await api.post('/posts', { content: content || null, media_url });
      localStorage.removeItem('nexus_draft_post');
      toast('Post published! 🚀', 'success');
      showAlert(alertEl, 'Post published! Redirecting...', 'success');
      setTimeout(() => { window.location.href = '/feed.html'; }, 1100);
    } catch (err) {
      showAlert(alertEl, err.message, 'danger');
      btnReset(submitBtn);
    }
  });

  /* ===========================
     DRAFT AUTO-SAVE (text only)
  =========================== */
  const DRAFT_KEY = 'nexus_draft_post';
  const saved = localStorage.getItem(DRAFT_KEY);
  if (saved) {
    try {
      const { content } = JSON.parse(saved);
      if (content) {
        contentInput.value = content;
        contentInput.dispatchEvent(new Event('input'));
        toast('📝 Draft restored.', 'info', 2500);
      }
    } catch (_) {}
  }

  let draftTimer;
  contentInput.addEventListener('input', () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const content = contentInput.value.trim();
      if (content) localStorage.setItem(DRAFT_KEY, JSON.stringify({ content }));
      else localStorage.removeItem(DRAFT_KEY);
    }, 800);
  });
});
