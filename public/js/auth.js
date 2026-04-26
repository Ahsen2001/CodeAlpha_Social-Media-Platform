document.addEventListener('DOMContentLoaded', () => {
  api.redirectIfLoggedIn();

  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginAlert = document.getElementById('loginAlert');
  const registerAlert = document.getElementById('registerAlert');

  // ---- Tab Switching ----
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      loginForm.classList.toggle('hidden', target !== 'login');
      registerForm.classList.toggle('hidden', target !== 'register');
    });
  });

  // ---- Login ----
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(loginAlert);
    const submitBtn = loginForm.querySelector('[type=submit]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const data = await api.post('/auth/login', { email, password });
      api.setSession(data.token, data.user);
      window.location.href = '/feed.html';
    } catch (err) {
      showAlert(loginAlert, err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In';
    }
  });

  // ---- Register ----
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(registerAlert);
    const submitBtn = registerForm.querySelector('[type=submit]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Creating account...';

    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;

    if (password !== confirm) {
      showAlert(registerAlert, 'Passwords do not match');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Account';
      return;
    }

    try {
      const data = await api.post('/auth/register', { username, email, password });
      api.setSession(data.token, data.user);
      window.location.href = '/feed.html';
    } catch (err) {
      showAlert(registerAlert, err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Account';
    }
  });
});
