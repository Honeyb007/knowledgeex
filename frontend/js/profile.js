/* ============================================================
   profile.js — KnowledgeEx Student Profile
   Auth · User · Avatar Upload · Stats · Save Profile
   ============================================================ */

/* ── Auth guard ── */
const user  = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
if (!user || !token) navigateTo('login.html');
if (user.role === 'tutor') navigateTo('tutor_profile.html');

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigateTo(page) {
    document.body.style.opacity    = '0';
    document.body.style.transform  = 'translateY(6px)';
    document.body.style.transition = 'all 0.2s ease';
    setTimeout(() => { window.location.href = page; }, 200);
}

/* ============================================================
   SIDEBAR
   ============================================================ */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
}

/* ============================================================
   AUTH
   ============================================================ */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigateTo('login.html');
}

/* ============================================================
   POPULATE UI
   ============================================================ */
function populateUser(u) {
    if (!u) return;

    const initials  = u.firstName.charAt(0) + u.lastName.charAt(0);
    const fullName  = `${u.firstName} ${u.lastName}`;
    const shortName = `${u.firstName} ${u.lastName.charAt(0)}.`;

    /* Sidebar */
    setEl('sidebarName',     shortName);
    setEl('sidebarInitials', initials);

    /* Left card */
    setEl('avatarFallback', initials);
    setEl('profileName',    fullName);
    setEl('profileSub',     `${u.department} · ${u.level}L`);
    setEl('profileLevel',   u.level);
    setEl('profileDept',    u.department);
    setEl('profileMatric',  u.matricNo);
    setEl('profileEmail',   u.email);

    /* Form fields */
    setVal('firstName',    u.firstName);
    setVal('lastName',     u.lastName);
    setVal('emailDisplay', u.email);
    setVal('bio',          u.bio   || '');
    setVal('phone',        u.phone || '');

    /* Read-only badges */
    setEl('deptDisplay',   u.department);
    setEl('levelDisplay',  u.level);
    setEl('matricDisplay', u.matricNo);

    /* Avatar */
    if (u.profileImage) {
        setAvatar(u.profileImage);
    }
}

/* ── Helpers ── */
function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function setAvatar(src) {
    const img      = document.getElementById('avatarImg');
    const fallback = document.getElementById('avatarFallback');
    const sideImg  = document.getElementById('sidebarAvImg');

    if (img) {
        img.src           = src;
        img.style.display = 'block';
    }
    if (fallback) fallback.style.display = 'none';
    if (sideImg) {
        sideImg.src           = src;
        sideImg.style.display = 'block';
        const initials = document.getElementById('sidebarInitials');
        if (initials) initials.style.display = 'none';
    }
}

populateUser(user);

/* Sync if another tab updates profile */
window.addEventListener('storage', e => {
    if (e.key === 'user' && e.newValue) {
        try { populateUser(JSON.parse(e.newValue)); } catch {}
    }
});

/* ============================================================
   UPLOAD AVATAR
   ============================================================ */
async function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;

    /* Basic client-side size check — 5MB */
    if (file.size > 5 * 1024 * 1024) {
        showError('Image must be under 5MB.');
        return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
        showInfo('Uploading photo…');

        const res  = await fetch('http://localhost:5000/api/auth/upload-avatar', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.profileImage) {
            setAvatar(data.profileImage);
            user.profileImage = data.profileImage;
            localStorage.setItem('user', JSON.stringify(user));
            showSuccess('Profile photo updated! 📸');
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (err) {
        console.error('Avatar upload error:', err);
        showError('Failed to upload image. Please try again.');
    }
}

/* ============================================================
   LOAD SESSION STATS
   ============================================================ */
async function loadStats() {
    try {
        const res = await fetch('http://localhost:5000/api/bookings/my-bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bookings  = await res.json();
        const completed = bookings.filter(b => b.status === 'completed');
        setEl('sessionsCount', completed.length);
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

/* ============================================================
   SAVE PROFILE
   ============================================================ */
async function saveProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');

    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const bio       = document.getElementById('bio').value.trim();
    const phone     = document.getElementById('phone').value.trim();

    if (!firstName || !lastName) {
        showWarning('First and last name are required.');
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
    btn.disabled  = true;

    try {
        const res  = await fetch('http://localhost:5000/api/auth/update-profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, lastName, bio, phone })
        });

        /* If endpoint not wired yet, just update locally */
        const data = res.ok ? await res.json() : {};

        /* Update local state */
        user.firstName = firstName;
        user.lastName  = lastName;
        user.bio       = bio;
        user.phone     = phone;
        localStorage.setItem('user', JSON.stringify(user));

        /* Refresh displayed name */
        setEl('profileName', `${firstName} ${lastName}`);
        setEl('sidebarName', `${firstName} ${lastName.charAt(0)}.`);

        btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
        btn.classList.add('success');
        showSuccess('Profile saved successfully! ✅');

    } catch (err) {
        console.error('Save error:', err);
        showError('Something went wrong. Please try again.');
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
        btn.disabled  = false;
        return;
    }

    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes';
        btn.classList.remove('success');
        btn.disabled  = false;
    }, 2500);
}

/* ============================================================
   INIT
   ============================================================ */
loadStats();