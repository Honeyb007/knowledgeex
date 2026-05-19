/* ============================================================
   help.js — KnowledgeEx Help Center
   Auth · Role-adaptive sidebar · FAQ accordion · Live search
   ============================================================ */

/* ── Auth guard ── */
const user  = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
if (!user || !token) navigateTo('login.html');

const isTutor = user.role === 'tutor';

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
    const sidebarRole     = document.getElementById('sidebarRole');

    if (sidebarName)     sidebarName.textContent     = shortName;
    if (sidebarInitials) sidebarInitials.textContent = initials;

    if (sidebarRole) {
        sidebarRole.textContent = isTutor ? 'Tutor' : 'Student';
        sidebarRole.style.color = isTutor ? 'var(--success)' : 'var(--text-muted)';
    }

    if (sidebarAvImg && u.profileImage) {
        sidebarAvImg.src           = u.profileImage;
        sidebarAvImg.style.display = 'block';
        if (sidebarInitials) sidebarInitials.style.display = 'none';
    }
}

/* ============================================================
   BUILD ROLE-ADAPTIVE SIDEBAR
   ============================================================ */
function buildSidebarNav() {
    const nav    = document.getElementById('sidebarNavContent');
    const chipEl = document.getElementById('sidebarUserChip');

    if (isTutor) {
        if (chipEl) chipEl.onclick = () => navigateTo('tutor_profile.html');

        nav.innerHTML = `
            <div class="sidebar-role-badge tutor">
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
                    <li><a href="#" onclick="navigateTo('tutor_profile.html')">
                        <i class="fa-solid fa-circle-user"></i> Profile
                    </a></li>
                    <li class="active"><a href="#">
                        <i class="fa-solid fa-circle-question"></i> Help Center
                    </a></li>
                </ul>
            </div>`;
    } else {
        if (chipEl) chipEl.onclick = () => navigateTo('profile.html');

        nav.innerHTML = `
            <div class="sidebar-role-badge learner">
                <i class="fa-solid fa-user-graduate"></i> Student
            </div>
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
                    <li class="active"><a href="#">
                        <i class="fa-solid fa-circle-question"></i> Help Center
                    </a></li>
                </ul>
            </div>`;
    }
}

/* ============================================================
   FAQ ACCORDION
   ============================================================ */
function toggleFAQ(item) {
    const isOpen = item.classList.contains('faq-open');

    /* Close all open items */
    document.querySelectorAll('.faq-item.faq-open')
        .forEach(el => el.classList.remove('faq-open'));

    /* Open clicked if it was closed */
    if (!isOpen) {
        item.classList.add('faq-open');
        /* Scroll into view smoothly if near bottom */
        setTimeout(() => {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
    }
}

/* ============================================================
   SEARCH — fully functional with highlight + count
   ============================================================ */
function searchFAQ(query) {
    const q         = query.trim().toLowerCase();
    const items     = document.querySelectorAll('.faq-item');
    const noResults = document.getElementById('noResults');
    const countEl   = document.getElementById('faqCount');
    const clearBtn  = document.getElementById('searchClear');
    const quickLinks = document.getElementById('quickLinks');

    /* Show/hide clear button */
    if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';

    /* Hide quick links while searching */
    if (quickLinks) quickLinks.style.display = q ? 'none' : '';

    let visible = 0;

    items.forEach(item => {
        /* Build search corpus from question text + data-text + answer text */
        const questionText = item.querySelector('.faq-question span')?.textContent || '';
        const answerText   = item.querySelector('.faq-answer-inner')?.textContent   || '';
        const dataText     = item.dataset.text || '';
        const corpus       = `${questionText} ${answerText} ${dataText}`.toLowerCase();

        const match = !q || corpus.includes(q);
        item.style.display = match ? '' : 'none';
        if (match) visible++;

        /* Auto-open single result */
        if (match && q) {
            item.classList.add('faq-open');
        } else if (!match) {
            item.classList.remove('faq-open');
        }
    });

    /* If more than 1 match, close all and let user pick */
    if (visible > 1 && q) {
        document.querySelectorAll('.faq-item.faq-open')
            .forEach(el => el.classList.remove('faq-open'));
    }

    /* Update count badge */
    if (countEl) {
        countEl.textContent = q ? `${visible} result${visible !== 1 ? 's' : ''}` : '';
        countEl.style.display = q ? '' : 'none';
    }

    /* No results state */
    if (noResults) {
        const querySpan = document.getElementById('noResultsQuery');
        if (querySpan) querySpan.textContent = query;
        noResults.style.display = visible === 0 && q ? 'block' : 'none';
    }
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = '';
        input.focus();
    }
    searchFAQ('');
}

/* ============================================================
   QUICK LINK SCROLL TO CATEGORY
   ============================================================ */
function scrollToCategory(category) {
    /* Clear any active search first */
    clearSearch();

    const first = document.querySelector(`.faq-item[data-category="${category}"]`);
    if (!first) return;

    first.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => toggleFAQ(first), 340);
}

/* ============================================================
   KEYBOARD SHORTCUT — / to focus search
   ============================================================ */
document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        const input = document.getElementById('searchInput');
        if (input) input.focus();
    }
    if (e.key === 'Escape') {
        const input = document.getElementById('searchInput');
        if (document.activeElement === input) {
            clearSearch();
            input.blur();
        }
    }
});

/* ============================================================
   INIT FAQ COUNT
   ============================================================ */
function initFAQCount() {
    const total  = document.querySelectorAll('.faq-item').length;
    const countEl = document.getElementById('faqCount');
    if (countEl) {
        countEl.textContent = `${total} articles`;
        countEl.style.display = '';
    }
}

/* ============================================================
   INIT
   ============================================================ */
buildSidebarNav();
populateSidebarUser(user);
initFAQCount();