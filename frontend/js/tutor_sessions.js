/* ============================================================
   tutor_sessions.js — KnowledgeEx Tutor Schedule
   Auth · User · Load · Filter · Accept · Decline · Complete
   ============================================================ */

/* ── Auth guard ── */
const user  = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
if (!user || !token) navigateTo('login.html');

/* ── State ── */
let allBookings = [];

const STATUS = {
    pending: {
        cls: 's-pending', accentCls: 'accent-pending',
        icon: 'fa-clock', label: 'Pending'
    },
    scheduled: {
        cls: 's-scheduled', accentCls: 'accent-scheduled',
        icon: 'fa-calendar-check', label: 'Scheduled'
    },
    awaiting_confirmation: {
        cls: 's-awaiting', accentCls: 'accent-awaiting',
        icon: 'fa-hourglass-half', label: 'Awaiting Confirmation'
    },
    completed: {
        cls: 's-completed', accentCls: 'accent-completed',
        icon: 'fa-circle-check', label: 'Completed'
    },
    declined: {
        cls: 's-declined', accentCls: 'accent-declined',
        icon: 'fa-xmark-circle', label: 'Declined'
    }
};

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

function populateUser(u) {
    if (!u) return;
    const initials  = u.firstName.charAt(0) + u.lastName.charAt(0);
    const shortName = `${u.firstName} ${u.lastName.charAt(0)}.`;

    const sidebarName     = document.getElementById('sidebarName');
    const sidebarInitials = document.getElementById('sidebarInitials');
    const sidebarAvImg    = document.getElementById('sidebarAvImg');
    const welcomeMsg      = document.getElementById('welcomeMsg');

    if (sidebarName)     sidebarName.textContent     = shortName;
    if (sidebarInitials) sidebarInitials.textContent = initials;
    if (welcomeMsg)      welcomeMsg.textContent      = `Welcome, ${u.firstName}!`;

    if (sidebarAvImg && u.profileImage) {
        sidebarAvImg.src           = u.profileImage;
        sidebarAvImg.style.display = 'block';
        if (sidebarInitials) sidebarInitials.style.display = 'none';
    }
}

populateUser(user);

window.addEventListener('storage', e => {
    if (e.key === 'user' && e.newValue) {
        try { populateUser(JSON.parse(e.newValue)); } catch {}
    }
});

/* ============================================================
   LOAD SESSIONS
   ============================================================ */
async function loadSessions() {
    try {
        const res   = await fetch('http://localhost:5000/api/bookings/tutor-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allBookings = await res.json();
        updateCounts(allBookings);
        renderSessions(allBookings);
    } catch (err) {
        console.error('Failed to load sessions:', err);
        document.getElementById('sessionsContainer').innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Failed to load</h3>
                <p>Check your connection or backend status.</p>
            </div>`;
    }
}

/* ============================================================
   UPDATE COUNTS
   ============================================================ */
function updateCounts(bookings) {
    const c = {
        all: bookings.length,
        pending: 0, scheduled: 0,
        awaiting: 0, completed: 0, declined: 0
    };

    bookings.forEach(b => {
        if      (b.status === 'pending')               c.pending++;
        else if (b.status === 'scheduled')             c.scheduled++;
        else if (b.status === 'awaiting_confirmation') c.awaiting++;
        else if (b.status === 'completed')             c.completed++;
        else if (b.status === 'declined')              c.declined++;
    });

    /* Stat cards */
    const pendingEl   = document.getElementById('pendingCount');
    const scheduledEl = document.getElementById('scheduledCount');
    const completedEl = document.getElementById('completedCount');
    if (pendingEl)   pendingEl.textContent   = c.pending;
    if (scheduledEl) scheduledEl.textContent = c.scheduled;
    if (completedEl) completedEl.textContent = c.completed;

    /* Tab counts */
    Object.entries(c).forEach(([k, v]) => {
        const el = document.getElementById(`count-${k}`);
        if (el) el.textContent = v;
    });
}

/* ============================================================
   RENDER SESSIONS
   ============================================================ */
function renderSessions(bookings) {
    const container = document.getElementById('sessionsContainer');

    if (!bookings.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar-xmark"></i>
                <h3>No sessions found</h3>
                <p>New booking requests will appear here.</p>
            </div>`;
        return;
    }

    container.innerHTML = bookings.map((b, i) => {
        const s     = STATUS[b.status] || STATUS.pending;
        const inits = b.learner.firstName.charAt(0) + b.learner.lastName.charAt(0);
        const date  = new Date(b.scheduledAt).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });
        const time  = new Date(b.scheduledAt).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
        });

        const actionsHtml = buildActions(b);

        return `
            <div class="session-card" data-status="${b.status}" style="animation-delay:${i * 0.05}s">
                <div class="card-accent ${s.accentCls}"></div>
                <div class="card-body">
                    <div class="session-top">
                        <div class="session-learner">
                            <div class="learner-av">${inits}</div>
                            <div>
                                <div class="learner-name">
                                    ${b.learner.firstName} ${b.learner.lastName}
                                </div>
                                <div class="learner-info">
                                    ${b.learner.department} · ${b.learner.level}L
                                </div>
                            </div>
                        </div>
                        <span class="status-badge ${s.cls}">
                            <i class="fa-solid ${s.icon}"></i> ${s.label}
                        </span>
                    </div>

                    <div class="session-details">
                        <div class="detail-chip">
                            <i class="fa-solid fa-book"></i>
                            <div>
                                <div class="detail-chip-label">Subject</div>
                                <div class="detail-chip-value">${b.subject}</div>
                            </div>
                        </div>
                        <div class="detail-chip">
                            <i class="fa-solid fa-calendar"></i>
                            <div>
                                <div class="detail-chip-label">Date & Time</div>
                                <div class="detail-chip-value">${date} · ${time}</div>
                            </div>
                        </div>
                        <div class="detail-chip">
                            <i class="fa-solid fa-ethereum"></i>
                            <div>
                                <div class="detail-chip-label">Amount</div>
                                <div class="detail-chip-value">${b.amount} ETH</div>
                            </div>
                        </div>
                    </div>

                    ${b.message ? `
                        <div class="session-message">"${b.message}"</div>
                    ` : ''}
                </div>

                <div class="card-divider"></div>
                <div class="card-footer">${actionsHtml}</div>
            </div>`;
    }).join('');
}

/* ============================================================
   BUILD ACTIONS PER STATUS
   ============================================================ */
function buildActions(b) {
    const now         = Date.now();
    const sessionTime = new Date(b.scheduledAt).getTime();
    const isPast      = now >= sessionTime;
    const timeUntilMs = sessionTime - now;
    const minsLeft    = Math.ceil(timeUntilMs / (1000 * 60));
    const timeLabel   = minsLeft < 60
        ? `${minsLeft}m`
        : `${Math.ceil(minsLeft / 60)}h`;

    switch (b.status) {

        case 'pending':
            return `
                <button class="btn-accept" id="accept-${b._id}"
                    onclick="acceptBooking('${b._id}')">
                    <i class="fa-solid fa-check"></i> Accept
                </button>
                <button class="btn-decline" id="decline-${b._id}"
                    onclick="declineBooking('${b._id}')">
                    <i class="fa-solid fa-xmark"></i> Decline
                </button>`;

        case 'scheduled':
            if (isPast) {
                return `
                    <button class="btn-complete" id="complete-${b._id}"
                        onclick="markComplete('${b._id}')">
                        <i class="fa-solid fa-check-double"></i> Mark as Complete
                    </button>`;
            }
            return `
                <button class="btn-complete-locked" disabled>
                    <i class="fa-solid fa-clock"></i>
                    Available in ${timeLabel}
                </button>`;

        case 'awaiting_confirmation':
            return `
                <span class="status-msg waiting">
                    <i class="fa-solid fa-hourglass-half"></i>
                    Waiting for learner to confirm and release payment…
                </span>`;

        case 'completed': {
            let html = '';
            if (b.feedback) {
                const filled = Array.from({ length: b.feedback.rating },
                    () => `<i class="fa-solid fa-star"></i>`).join('');
                const empty = Array.from({ length: 5 - b.feedback.rating },
                    () => `<i class="fa-solid fa-star empty"></i>`).join('');
                html = `
                    <div class="feedback-display">
                        <div class="feedback-stars">
                            ${filled}${empty}
                            <span class="rating-text">${b.feedback.rating}/5</span>
                        </div>
                        ${b.feedback.comment
                            ? `<div class="feedback-comment">"${b.feedback.comment}"</div>`
                            : ''}
                    </div>`;
            } else {
                html = `
                    <span class="status-msg success">
                        <i class="fa-solid fa-circle-check"></i>
                        Session completed — awaiting learner feedback.
                    </span>`;
            }
            if (b.txHash) {
                html += `
                    <div class="tx-hash">
                        <i class="fa-solid fa-cube"></i>
                        ${b.txHash.substring(0, 14)}…
                    </div>`;
            }
            return html;
        }

        case 'declined':
            return `
                <span class="status-msg declined-msg">
                    <i class="fa-solid fa-xmark"></i>
                    You declined this booking.
                </span>`;

        default:
            return '';
    }
}

/* ============================================================
   FILTER
   ============================================================ */
function filterSessions(status, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = status === 'all'
        ? allBookings
        : allBookings.filter(b => b.status === status);
    renderSessions(filtered);
}

/* ============================================================
   ACCEPT BOOKING
   ============================================================ */
async function acceptBooking(bookingId) {
    const aBtn = document.getElementById(`accept-${bookingId}`);
    const dBtn = document.getElementById(`decline-${bookingId}`);

    if (aBtn) { aBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; aBtn.disabled = true; }
    if (dBtn) dBtn.disabled = true;

    try {
        const res  = await fetch(`http://localhost:5000/api/bookings/${bookingId}/accept`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.booking) {
            showSuccess('Session accepted! ✅');
            /* Animate out */
            const card = document.querySelector(`[data-status="pending"] #accept-${bookingId}`)
                ?.closest('.session-card');
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity    = '0';
                card.style.transform  = 'translateX(10px)';
                setTimeout(() => loadSessions(), 300);
            } else {
                loadSessions();
            }
        } else {
            throw new Error(data.message || 'Accept failed');
        }
    } catch (err) {
        showError('Failed to accept: ' + err.message);
        if (aBtn) { aBtn.innerHTML = '<i class="fa-solid fa-check"></i> Accept'; aBtn.disabled = false; }
        if (dBtn) dBtn.disabled = false;
    }
}

/* ============================================================
   DECLINE BOOKING
   ============================================================ */
async function declineBooking(bookingId) {
    if (!confirm('Are you sure you want to decline this booking?')) return;

    const aBtn = document.getElementById(`accept-${bookingId}`);
    const dBtn = document.getElementById(`decline-${bookingId}`);

    if (aBtn) aBtn.disabled = true;
    if (dBtn) { dBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; dBtn.disabled = true; }

    try {
        const res  = await fetch(`http://localhost:5000/api/bookings/${bookingId}/decline`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.booking) {
            showInfo('Booking declined.');
            loadSessions();
        } else {
            throw new Error(data.message || 'Decline failed');
        }
    } catch (err) {
        showError('Failed to decline: ' + err.message);
        if (aBtn) aBtn.disabled = false;
        if (dBtn) { dBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Decline'; dBtn.disabled = false; }
    }
}

/* ============================================================
   MARK COMPLETE
   ============================================================ */
async function markComplete(bookingId) {
    /* Client-side time guard */
    const booking     = allBookings.find(b => b._id === bookingId);
    const sessionTime = booking ? new Date(booking.scheduledAt).getTime() : 0;

    if (sessionTime && Date.now() < sessionTime) {
        const minsLeft = Math.ceil((sessionTime - Date.now()) / (1000 * 60));
        const label    = minsLeft < 60
            ? `${minsLeft} minute${minsLeft !== 1 ? 's' : ''}`
            : `${Math.ceil(minsLeft / 60)} hour${Math.ceil(minsLeft / 60) !== 1 ? 's' : ''}`;
        showWarning(`Session hasn't started yet. Available in ${label}.`);
        return;
    }

    if (!confirm('Mark this session as complete? The learner will be notified to confirm.')) return;

    const btn = document.getElementById(`complete-${bookingId}`);
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing…';
        btn.disabled  = true;
    }

    try {
        const res  = await fetch(`http://localhost:5000/api/bookings/${bookingId}/complete`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.booking) {
            showSuccess('Marked complete! Waiting for learner to release payment. 🎉');
            loadSessions();
        } else {
            throw new Error(data.message || 'Failed to mark complete');
        }
    } catch (err) {
        showError('Error: ' + err.message);
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Mark as Complete';
            btn.disabled  = false;
        }
    }
}

/* ============================================================
   INIT
   ============================================================ */
loadSessions();