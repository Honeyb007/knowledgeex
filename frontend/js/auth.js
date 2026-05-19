/* ============================================================
   auth.js — KnowledgeEx Shared Auth Logic
   Login · Register · Password toggle · Role picker
   ============================================================ */

/* ── Year ── */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ── Password toggle ── */
function togglePass(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    if (!input || !icon) return;
    const isPassword = input.type === 'password';
    input.type       = isPassword ? 'text' : 'password';
    icon.className   = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
}

/* ── Role pill selector (register only) ── */
function selectRole(role) {
    const roleInput = document.getElementById('roleSelect');
    if (roleInput) roleInput.value = role;

    ['learner', 'tutor'].forEach(r => {
        const el = document.getElementById(`pill-${r}`);
        if (el) el.classList.toggle('selected', r === role);
    });
}

/* ── LOGIN ── */
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying…';
    btn.disabled  = true;

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const res  = await fetch('http://localhost:5000/api/auth/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.status === 'ok') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user',  JSON.stringify(data.user));
            window.location.href = data.user.role === 'tutor'
                ? 'tutor_dashboard.html'
                : 'dashboard.html';
        } else {
            showError(data.error || 'Invalid credentials. Please try again.');
            btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Log In';
            btn.disabled  = false;
        }
    } catch {
        showError('Connection error — is the backend running?');
        btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Log In';
        btn.disabled  = false;
    }
}

/* ── REGISTER ── */
async function handleSignup(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account…';
    btn.disabled  = true;

    const firstName  = document.getElementById('firstName').value.trim();
    const lastName   = document.getElementById('lastName').value.trim();
    const email      = document.getElementById('email').value.trim();
    const matricNo   = document.getElementById('matricNo').value.trim();
    const password   = document.getElementById('signupPassword').value;
    const level      = document.getElementById('levelSelect').value;
    const role       = document.getElementById('roleSelect').value;
    const department = document.getElementById('department').value.trim();

    if (!level) {
        showWarning('Please select your level.');
        btn.innerHTML = '<i class="fa-solid fa-rocket"></i> Create Account';
        btn.disabled  = false;
        return;
    }

    try {
        const res  = await fetch('http://localhost:5000/api/auth/register', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ firstName, lastName, email, matricNo, password, role, level, department })
        });
        const data = await res.json();

        if (data.status === 'ok') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user',  JSON.stringify(data.user));
            showSuccess('Account created! Redirecting…');
            setTimeout(() => {
                window.location.href = data.user.role === 'tutor'
                    ? 'tutor_dashboard.html'
                    : 'dashboard.html';
            }, 900);
        } else {
            showError(data.message || 'Registration failed. Please try again.');
            btn.innerHTML = '<i class="fa-solid fa-rocket"></i> Create Account';
            btn.disabled  = false;
        }
    } catch {
        showError('Connection error — is the backend running?');
        btn.innerHTML = '<i class="fa-solid fa-rocket"></i> Create Account';
        btn.disabled  = false;
    }
}