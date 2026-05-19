/* ============================================================
   tutor_profile.js — KnowledgeEx Tutor Profile
   Auth · Sidebar context · Load · Avatar · Save
   Handles: own tutor profile (editable) + viewing another tutor (read-only)
   ============================================================ */

/* ── Auth guard ── */
const user  = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
if (!user || !token) navigateTo('login.html');

/* ── Detect view mode ── */
const urlParams      = new URLSearchParams(window.location.search);
const tutorId        = urlParams.get('tutorId');
const isViewingOther = !!tutorId;

/* If a student hits this without a tutorId, redirect to their own profile */
if (!isViewingOther && user.role !== 'tutor') navigateTo('profile.html');

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

/* Build sidebar nav based on who's viewing */
function buildSidebarNav() {
    const isTutorOwner = !isViewingOther && user.role === 'tutor';
    const nav          = document.getElementById('sidebarNavContent');
    const roleEl       = document.getElementById('sidebarRole');
    const chipEl       = document.getElementById('sidebarUserChip');

    if (isTutorOwner) {
        if (roleEl) { roleEl.textContent = 'Tutor'; roleEl.style.color = 'var(--success)'; }
        if (chipEl) chipEl.onclick = () => navigateTo('tutor_profile.html');

        nav.innerHTML = `
            <div class="tutor-mode-badge">
                <i class="fa-solid fa-chalkboard-user"></i> Tutor Account
            </div>
            <div class="sidebar-nav-group">
                <div class="sidebar-label">Tutor Menu</div>
                <ul class="sidebar-links">
                    <li><a href="#" onclick="navigateTo('tutor_dashboard.html')">
                        <i class="fa-solid fa-grid-2"></i> Dashboard
                    </a></li>
                    <li><a href="#" onclick="navigateTo('tutor_sessions.html')">
                        <i class="fa-solid fa-calendar-days"></i> My Schedule
                    </a></li>
                    <li><a href="#" onclick="navigateTo('wallet.html')">
                        <i class="fa-solid fa-coins"></i> Earnings
                    </a></li>
                </ul>
            </div>
            <div class="sidebar-nav-group">
                <div class="sidebar-label">Account</div>
                <ul class="sidebar-links">
                    <li class="active"><a href="#">
                        <i class="fa-solid fa-circle-user"></i> Profile
                    </a></li>
                    <li><a href="#" onclick="navigateTo('help.html')">
                        <i class="fa-solid fa-circle-question"></i> Help Center
                    </a></li>
                </ul>
            </div>`;
    } else {
        /* Student viewing a tutor's profile */
        if (roleEl) { roleEl.textContent = 'Student'; roleEl.style.color = 'var(--text-muted)'; }
        if (chipEl) chipEl.onclick = () => navigateTo('profile.html');

        nav.innerHTML = `
            <div class="sidebar-nav-group">
                <div class="sidebar-label">Main Menu</div>
                <ul class="sidebar-links">
                    <li><a href="#" onclick="navigateTo('dashboard.html')">
                        <i class="fa-solid fa-grid-2"></i> Dashboard
                    </a></li>
                    <li><a href="#" onclick="navigateTo('marketplace.html')">
                        <i class="fa-solid fa-magnifying-glass"></i> Find Tutors
                    </a></li>
                    <li><a href="#" onclick="navigateTo('sessions.html')">
                        <i class="fa-solid fa-calendar-days"></i> My Sessions
                    </a></li>
                    <li><a href="#" onclick="navigateTo('wallet.html')">
                        <i class="fa-solid fa-wallet"></i> Wallet & Escrow
                    </a></li>
                </ul>
            </div>
            <div class="sidebar-nav-group">
                <div class="sidebar-label">Account</div>
                <ul class="sidebar-links">
                    <li><a href="#" onclick="navigateTo('profile.html')">
                        <i class="fa-solid fa-circle-user"></i> Profile
                    </a></li>
                    <li><a href="#" onclick="navigateTo('help.html')">
                        <i class="fa-solid fa-circle-question"></i> Help Center
                    </a></li>
                </ul>
            </div>`;
    }
}

/* ============================================================
   AUTH / USER
   ============================================================ */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigateTo('login.html');
}

function populateSidebarUser(u) {
    if (!u) return;
    const initials  = u.firstName.charAt(0) + u.lastName.charAt(0);
    const shortName = `${u.firstName} ${u.lastName.charAt(0)}.`;

    const sidebarName     = document.getElementById('sidebarName');
    const sidebarInitials = document.getElementById('sidebarInitials');
    const sidebarAvImg    = document.getElementById('sidebarAvImg');

    if (sidebarName)     sidebarName.textContent     = shortName;
    if (sidebarInitials) sidebarInitials.textContent = initials;

    if (sidebarAvImg && u.profileImage) {
        sidebarAvImg.src           = u.profileImage;
        sidebarAvImg.style.display = 'block';
        if (sidebarInitials) sidebarInitials.style.display = 'none';
    }
}

/* ── Update page header for view-only ── */
function setPageMeta() {
    if (isViewingOther) {
        const pageTitle    = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');
        const breadcrumb   = document.getElementById('breadcrumb');

        if (pageTitle)    pageTitle.textContent    = 'Tutor Profile';
        if (pageSubtitle) pageSubtitle.textContent = 'View tutor details and book a session.';
        if (breadcrumb)   breadcrumb.innerHTML     = `
            Marketplace
            <i class="fa-solid fa-chevron-right"></i>
            <strong>Tutor Profile</strong>`;
    }
}

/* ── Helpers ── */
function setEl(id, text)  { const el = document.getElementById(id); if (el) el.textContent = text; }
function setVal(id, val)  { const el = document.getElementById(id); if (el) el.value = val; }
function setAvatar(src) {
    const img      = document.getElementById('avatarImg');
    const fallback = document.getElementById('avatarFallback');
    const sideImg  = document.getElementById('sidebarAvImg');
    if (img) { img.src = src; img.style.display = 'block'; }
    if (fallback) fallback.style.display = 'none';
    if (sideImg) {
        sideImg.src = src; sideImg.style.display = 'block';
        const init = document.getElementById('sidebarInitials');
        if (init) init.style.display = 'none';
    }
}

/* ============================================================
   LOAD TUTOR PROFILE
   ============================================================ */
async function loadTutorProfile() {
    try {
        let res;
        if (isViewingOther) {
            res = await fetch(`http://localhost:5000/api/tutors/${tutorId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } else {
            res = await fetch('http://localhost:5000/api/tutors/me/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data._id) return;

        /* Tutor user object differs depending on endpoint */
        const tu = isViewingOther ? data.user : user;

        /* ── Left card ── */
        const initials = tu.firstName.charAt(0) + tu.lastName.charAt(0);
        setEl('avatarFallback', initials);
        setEl('profileName',    `${tu.firstName} ${tu.lastName}`);
        setEl('profileSub',     `${tu.department} · ${tu.level}L`);
        setEl('profileDept',    tu.department);
        setEl('profileMatric',  tu.matricNo);
        setEl('profileRate',    data.hourlyRate ? `${data.hourlyRate} ETH/hr` : '—');
        setEl('totalSessions',  data.totalSessions ?? 0);
        setEl('tutorRating',    data.rating > 0 ? `${Number(data.rating).toFixed(1)} ★` : '—');

        if (tu.profileImage) setAvatar(tu.profileImage);

        /* Courses */
        const coursesWrap = document.getElementById('coursesDisplay');
        if (coursesWrap) {
            coursesWrap.innerHTML = data.courses?.length
                ? data.courses.map(c => `<span class="course-tag">${c}</span>`).join('')
                : '<span class="course-tag-empty">No courses listed</span>';
        }

        /* ── Form fields (own profile) ── */
        setVal('firstName',    tu.firstName);
        setVal('lastName',     tu.lastName);
        setVal('emailDisplay', tu.email);
        setVal('bio',          data.bio          || '');
        setVal('phone',        tu.phone          || '');
        setVal('hourlyRate',   data.hourlyRate   || '');
        setVal('availability', data.availability || '');
        setVal('courses',      data.courses?.join(', ') || '');

        /* ── Academic badges ── */
        setEl('deptDisplay',     tu.department);
        setEl('levelDisplay',    tu.level);
        setEl('matricDisplay',   tu.matricNo);
        setEl('sessionsDisplay', data.totalSessions ?? 0);
        setEl('ratingDisplay',
            data.rating > 0 ? `${Number(data.rating).toFixed(1)} / 5` : 'No ratings yet');

        /* ── View-only mode ── */
        if (isViewingOther) {
            /* Disable all form inputs */
            document.querySelectorAll('.f-input')
                .forEach(el => { el.disabled = true; });

            /* Hide edit controls */
            const formFooter = document.getElementById('formFooter');
            const cameraBtn  = document.getElementById('cameraBtn');
            if (formFooter) formFooter.style.display = 'none';
            if (cameraBtn)  cameraBtn.style.display  = 'none';

            /* Show book button */
            const bookSection = document.getElementById('bookSection');
            if (bookSection) bookSection.style.display = 'block';
        }

    } catch (err) {
        console.error('Failed to load tutor profile:', err);
        showError('Failed to load profile. Please try again.');
    }
}

/* ============================================================
   UPLOAD AVATAR
   ============================================================ */
async function uploadAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;

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
        showError('Failed to upload image.');
    }
}

/* ============================================================
   SAVE PROFILE
   ============================================================ */
async function saveProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');

    const firstName   = document.getElementById('firstName').value.trim();
    const lastName    = document.getElementById('lastName').value.trim();
    const bio         = document.getElementById('bio').value.trim();
    const phone       = document.getElementById('phone').value.trim();
    const hourlyRate  = parseFloat(document.getElementById('hourlyRate').value) || 0;
    const availability = document.getElementById('availability').value.trim();
    const courses     = document.getElementById('courses').value
        .split(',').map(c => c.trim()).filter(Boolean);

    if (!firstName || !lastName) {
        showWarning('First and last name are required.');
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
    btn.disabled  = true;

    try {
        const res  = await fetch('http://localhost:5000/api/tutors/me/update', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bio, courses, hourlyRate, availability })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.profile) {
            /* Refresh courses display */
            const coursesWrap = document.getElementById('coursesDisplay');
            if (coursesWrap) {
                coursesWrap.innerHTML = data.profile.courses?.length
                    ? data.profile.courses.map(c => `<span class="course-tag">${c}</span>`).join('')
                    : '<span class="course-tag-empty">No courses listed</span>';
            }

            /* Update rate in left card */
            setEl('profileRate', data.profile.hourlyRate
                ? `${data.profile.hourlyRate} ETH/hr` : '—');

            /* Update local user */
            user.firstName = firstName;
            user.lastName  = lastName;
            user.phone     = phone;
            localStorage.setItem('user', JSON.stringify(user));

            btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            btn.classList.add('success');
            showSuccess('Profile saved successfully! ✅');
        } else {
            throw new Error(data.message || 'Save failed');
        }
    } catch (err) {
        console.error('Save error:', err);
        showError('Failed to save profile: ' + err.message);
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
buildSidebarNav();
populateSidebarUser(user);
setPageMeta();
loadTutorProfile();