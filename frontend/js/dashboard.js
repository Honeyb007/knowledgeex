/* ============================================================
   dashboard.js — KnowledgeEx Student Dashboard
   Auth · User · Bookings · Wallet · Schedule
   ============================================================ */

/* ── Auth guard ── */
const user  = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
if (!user || !token) navigateTo('login.html');

/* ============================================================
   NAVIGATION
   ============================================================ */
function navigateTo(page) {
    document.body.style.opacity    = '0';
    document.body.style.transform  = 'translateY(4px)';
    document.body.style.transition = 'all 0.18s ease';
    setTimeout(() => { window.location.href = page; }, 180);
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
   POPULATE USER
   ============================================================ */
function populateUser(u) {
    if (!u) return;
    const initials  = u.firstName.charAt(0) + u.lastName.charAt(0);
    const shortName = `${u.firstName} ${u.lastName.charAt(0)}.`;

    const ids = {
        sidebarName:     shortName,
        sidebarInitials: initials,
        topbarName:      shortName,
        topbarInitials:  initials,
    };

    Object.entries(ids).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });

    /* Avatar images */
    if (u.profileImage) {
        ['sidebarAvImg', 'topbarAvImg'].forEach(id => {
            const img = document.getElementById(id);
            if (img) {
                img.src = u.profileImage;
                img.style.display = 'block';
            }
        });
    }
}

populateUser(user);

/* Sync across tabs */
window.addEventListener('storage', e => {
    if (e.key === 'user' && e.newValue) {
        try { populateUser(JSON.parse(e.newValue)); } catch {}
    }
});

/* ── Time-of-day greeting (topbar) — matches tutor dashboard ── */
(function setGreeting() {
    const hour   = new Date().getHours();
    const word   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const nameEl = document.getElementById('topbarGreeting');
    const subEl  = document.getElementById('topbarSub');
    if (nameEl) nameEl.textContent = `${word}, ${user.firstName}!`;
    if (subEl)  subEl.textContent  = "Here's what's happening with your learning today.";
})();

/* ============================================================
   DATE HELPERS
   ------------------------------------------------------------
   IMPORTANT: never use Date#toISOString() for calendar-day
   comparisons — it converts to UTC first, which silently shifts
   the date backward or forward depending on the user's timezone
   offset (e.g. Nigeria is UTC+1, so local midnight becomes
   23:00 the previous day in UTC). Always build the key from the
   LOCAL year/month/day components instead.
   ============================================================ */
function localDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/* ============================================================
   CONNECT WALLET
   ============================================================ */
async function connectWallet() {
    const btn     = document.getElementById('connectWalletBtn');
    const btnText = document.getElementById('walletBtnText');
    const display = document.getElementById('walletBalance');

    if (typeof window.ethereum === 'undefined') {
        showError('Please install MetaMask to connect your wallet.');
        return;
    }

    btnText.textContent = 'Connecting…';
    btn.disabled        = true;

    try {
        const result = await connectAndSaveWallet();
        if (!result) throw new Error('Connection cancelled');

        const { provider, address } = result;
        const balance = await provider.getBalance(address);
        const eth     = parseFloat(ethers.utils.formatEther(balance)).toFixed(4);

        if (display) display.textContent = eth;

        btnText.textContent = `${address.substring(0, 6)}…${address.substring(38)}`;
        btn.classList.add('connected');
        btn.disabled = false;

        showSuccess('Wallet connected! 🎉');

    } catch (err) {
        showError('Failed to connect wallet.');
        btnText.textContent = 'Connect Wallet';
        btn.disabled        = false;
    }
}

/* ============================================================
   LOAD BOOKINGS
   ============================================================ */
async function loadBookings() {
    try {
        const res      = await fetch('http://localhost:5000/api/bookings/my-bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bookings = await res.json();

        /* Stats */
        const completed = bookings.filter(b => b.status === 'completed');
        const escrow    = bookings
            .filter(b => ['pending', 'scheduled'].includes(b.status))
            .reduce((s, b) => s + b.amount, 0);
        const upcoming  = bookings.filter(b => b.status === 'scheduled');

        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setEl('sessionsCompleted', completed.length);
        setEl('lockedEscrow',      escrow.toFixed(3));

        renderTransactions(bookings);
        renderSchedule(upcoming);

    } catch (err) {
        console.error('Failed to load bookings:', err);
        const tbody = document.getElementById('transactionsBody');
        if (tbody) tbody.innerHTML = `
            <tr><td colspan="4">
                <div class="table-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Failed to load. Is the backend running?
                </div>
            </td></tr>`;
    }
}

/* ============================================================
   RENDER TRANSACTIONS
   ============================================================ */
function renderTransactions(bookings) {
    const tbody = document.getElementById('transactionsBody');
    if (!tbody) return;

    const recent = [...bookings]
        .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
        .slice(0, 5);

    if (!recent.length) {
        tbody.innerHTML = `<tr><td colspan="4">
            <div class="table-state">
                <i class="fa-solid fa-inbox"></i> No transactions yet.
            </div>
        </td></tr>`;
        return;
    }

    const STATUS = {
        pending:               ['pending',   'fa-clock',         'Pending'],
        scheduled:             ['scheduled', 'fa-calendar-check','Scheduled'],
        awaiting_confirmation: ['awaiting',  'fa-hourglass-half','Awaiting'],
        completed:             ['completed', 'fa-circle-check',  'Released'],
        declined:              ['cancelled', 'fa-xmark',         'Declined'],
        refunded:              ['refunded',  'fa-rotate-left',   'Refunded'],
    };

    tbody.innerHTML = recent.map(b => {
        const inits    = b.tutor.firstName.charAt(0) + b.tutor.lastName.charAt(0);
        const [cls, ico, lbl] = STATUS[b.status] || ['pending', 'fa-clock', b.status];

        return `
            <tr>
                <td>
                    <div class="party-cell">
                        <div class="party-av">${inits}</div>
                        <div>
                            <div class="party-name">${b.tutor.firstName} ${b.tutor.lastName}</div>
                        </div>
                    </div>
                </td>
                <td>${b.subject}</td>
                <td><span class="amount-cell">${b.amount} ETH</span></td>
                <td>
                    <span class="status-pill ${cls}">
                        <i class="fa-solid ${ico}"></i> ${lbl}
                    </span>
                </td>
            </tr>`;
    }).join('');
}

/* ============================================================
   RENDER SCHEDULE — horizontal week strip
   ============================================================ */
function renderSchedule(upcoming) {
    const body = document.getElementById('scheduleBody');
    if (!body) return;

    /* Group bookings by LOCAL calendar date (not UTC) */
    const byDate = {};
    upcoming.forEach(b => {
        const key = localDateKey(new Date(b.scheduledAt));
        byDate[key] = byDate[key] || [];
        byDate[key].push(b);
    });

    /* Build 7-day week starting on Monday (local time throughout) */
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const offset = (today.getDay() + 6) % 7; // 0 => Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() - offset);
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        days.push(d);
    }

    const todayKey = localDateKey(today);

    const calHtml = days.map(d => {
        const key     = localDateKey(d);
        const hasSess = !!(byDate[key] && byDate[key].length);
        return `
            <button class="cal-day${hasSess ? ' has-session' : ''}" data-date="${key}">
                <div class="cal-day-name">${d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="cal-day-num">${d.getDate()}</div>
                <span class="cal-dot"></span>
            </button>`;
    }).join('');

    body.innerHTML = `
        <div class="schedule-ui">
            <div class="week-calendar" id="weekCalendar">${calHtml}</div>
            <div class="schedule-list" id="daySessions"></div>
        </div>`;

    function renderDaySessions(dateKey) {
        const list = document.getElementById('daySessions');
        const sessions = byDate[dateKey] || [];
        if (!sessions.length) {
            list.innerHTML = `<div class="schedule-empty"><i class="fa-regular fa-calendar-xmark"></i>No sessions on this day.</div>`;
            return;
        }

        sessions.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

        list.innerHTML = sessions.map(s => {
            const dt    = new Date(s.scheduledAt);
            const hours = dt.getHours();
            const mins  = String(dt.getMinutes()).padStart(2, '0');
            const ampm  = hours >= 12 ? 'PM' : 'AM';
            const h12   = hours % 12 || 12;
            return `
                <div class="session-item">
                    <div class="session-time">${h12}:${mins} ${ampm}</div>
                    <div>
                        <div class="session-title">${s.subject}</div>
                        <div class="session-meta">With ${s.tutor ? `${s.tutor.firstName} ${s.tutor.lastName}` : s.learner?.firstName || 'Learner'}</div>
                    </div>
                </div>`;
        }).join('');
    }

    document.querySelectorAll('#weekCalendar .cal-day').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#weekCalendar .cal-day').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderDaySessions(btn.dataset.date);
        });
    });

    const todayBtn = document.querySelector(`#weekCalendar .cal-day[data-date="${todayKey}"]`);
    if (todayBtn) {
        todayBtn.classList.add('active');
        renderDaySessions(todayKey);
    } else if (days.length) {
        const firstBtn = document.querySelector('#weekCalendar .cal-day');
        if (firstBtn) {
            firstBtn.classList.add('active');
            renderDaySessions(firstBtn.dataset.date);
        }
    }
}

/* ============================================================
   INIT
   ============================================================ */
loadBookings();