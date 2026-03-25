const form = document.getElementById('authForm');
const toggleAuth = document.getElementById('toggleAuth');
const nameInput = document.getElementById('name');
const title = document.getElementById('authTitle');
const submitBtn = document.getElementById('submitBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

let isLogin = true;

// Already logged in → go home
if (localStorage.getItem('token')) {
    window.location.href = 'index.html';
}

toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    clearError();

    if (isLogin) {
        title.textContent = 'Welcome Back';
        submitBtn.textContent = 'Login';
        nameInput.classList.add('hidden');
        nameInput.required = false;
        toggleAuth.textContent = 'Need an account? Register';
    } else {
        title.textContent = 'Create Account';
        submitBtn.textContent = 'Register';
        nameInput.classList.remove('hidden');
        nameInput.required = true;
        toggleAuth.textContent = 'Already have an account? Login';
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Frontend validation
    if (!isLogin && !name) { showError('Please enter your full name'); return; }
    if (!email) { showError('Please enter your email'); return; }
    if (!password) { showError('Please enter your password'); return; }
    if (!isLogin && password.length < 6) { showError('Password must be at least 6 characters'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = isLogin ? 'Logging in...' : 'Creating account...';

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin ? { email, password } : { name, email, password };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
            if (isLogin) {
                localStorage.setItem('token', data.token);
                // Store user info for greeting
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'index.html';
            } else {
                showSuccess(data.message || 'Registered! Please login.');
                // Auto switch to login
                setTimeout(() => toggleAuth.click(), 1500);
            }
        } else {
            showError(data.message || 'Something went wrong');
        }
    } catch (err) {
        showError('Network error. Is the server running?');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? 'Login' : 'Register';
    }
});

function showError(msg) {
    let el = document.getElementById('authMsg');
    if (!el) {
        el = document.createElement('p');
        el.id = 'authMsg';
        el.style.cssText = 'text-align:center; font-size:13px; margin-top:10px; padding:8px; border-radius:6px;';
        form.after(el);
    }
    el.style.background = '#fdecea';
    el.style.color = '#c0392b';
    el.textContent = msg;
}

function showSuccess(msg) {
    let el = document.getElementById('authMsg');
    if (!el) {
        el = document.createElement('p');
        el.id = 'authMsg';
        el.style.cssText = 'text-align:center; font-size:13px; margin-top:10px; padding:8px; border-radius:6px;';
        form.after(el);
    }
    el.style.background = '#d5f5e3';
    el.style.color = '#1e8449';
    el.textContent = msg;
}

function clearError() {
    const el = document.getElementById('authMsg');
    if (el) el.remove();
}
