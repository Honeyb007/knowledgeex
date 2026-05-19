/* ============================================================
   tutor_dashboard.js — KnowledgeEx Tutor Dashboard
   Auth · User · Stats · Requests · Accept/Decline · Wallet
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

    /* Sidebar */
    const sidebarName     = document.getElementById('sidebarName');
    const sidebarInitials = document.getElementById('sidebarInitials');
    const sidebarAvImg    = document.getElementById('sidebarAvImg');

    if (sidebarName)     sidebarName.textContent     = shortName;
    if (sidebarInitials) sidebarInitials.textContent = initials;
    if (sidebarAvImg && u.profileImage) {
        sidebarAvImg.src          = u.profileImage;
        sidebarAvImg.style.display = 'block';
        sidebarInitials.style.display = 'none';
    }

    /* Topbar */
    const topbarName     = document.getElementById('topbarName');
    const topbarInitials = document.getElementById('topbarInitials');
    const topbarAvImg    = document.getElementById('topbarAvImg');

    if (topbarName)     topbarName.textContent     = shortName;
    if (topbarInitials) topbarInitials.textContent = initials;
    if (topbarAvImg && u.profileImage) {
        topbarAvImg.src          = u.profileImage;
        topbarAvImg.style.display = 'block';
        topbarInitials.style.display = 'none';
    }
}

populateUser(user);

/* Sync if profile page updates localStorage */
window.addEventListener('storage', e => {
    if (e.key === 'user' && e.newValue) {
        try { populateUser(JSON.parse(e.newValue)); } catch {}
    }
});

/* ── Time-of-day greeting ── */
(function setGreeting() {
    const hour  = new Date().getHours();
    const word  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const el    = document.getElementById('topbarGreeting');
    if (el) el.textContent = `${word}, ${user.firstName}!`;
})();

/* ============================================================
   LOAD TUTOR PROFILE STATS
   ============================================================ */
async function loadTutorProfile() {
    try {
        const res  = await fetch('http://localhost:5000/api/tutors/me/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data._id) {
            document.getElementById('totalSessions').textContent =
                data.totalSessions ?? 0;

            document.getElementById('tutorRating').textContent =
                data.rating > 0 ? `${Number(data.rating).toFixed(1)} ★` : 'N/A';

            /* Estimated earnings = completed sessions × hourlyRate */
            const earned = ((data.totalSessions ?? 0) * (data.hourlyRate ?? 0)).toFixed(3);
            document.getElementById('totalEarnings').textContent = `${earned} ETH`;
        }
    } catch (err) {
        console.error('Failed to load tutor profile:', err);
    }
}

/* ============================================================
   LOAD SESSION REQUESTS
   ============================================================ */
async function loadRequests() {
    const container = document.getElementById('requestsContainer');
    const badge     = document.getElementById('requestBadge');
    const subEl     = document.getElementById('topbarSub');

    try {
        const res      = await fetch('http://localhost:5000/api/bookings/tutor-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const bookings = await res.json();
        const pending  = bookings.filter(b => b.status === 'pending');

        /* Update badge */
        if (pending.length > 0) {
            badge.textContent = `${pending.length} pending`;
            badge.className   = 'card-badge has-items';
        } else {
            badge.textContent = '0 pending';
            badge.className   = 'card-badge';
        }

        /* Update topbar subtitle */
        if (subEl) {
            subEl.textContent = pending.length > 0
                ? `You have ${pending.length} new session request${pending.length > 1 ? 's' : ''}.`
                : 'No new requests right now. Keep it up!';
        }

        /* Render */
        if (!pending.length) {
            container.innerHTML = `
                <div class="empty-req">
                    <i class="fa-solid fa-inbox"></i>
                    <p>No pending requests at the moment.</p>
                </div>`;
            return;
        }

        container.innerHTML = pending.map(b => {
            const inits = b.learner.firstName.charAt(0) + b.learner.lastName.charAt(0);
            const date  = new Date(b.scheduledAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const msgHtml = b.message
                ? ` — <em>"${b.message}"</em>`
                : '';

            return `
                <div class="req-item" id="req-${b._id}">
                    <div class="req-av">${inits}</div>
                    <div class="req-content">
                        <div class="req-top">
                            <div class="req-name">${b.learner.firstName} ${b.learner.lastName}</div>
                            <div class="req-meta">${b.learner.department} · ${b.learner.level}L</div>
                        </div>
                        <div class="req-subject">${b.subject}${msgHtml}</div>
                        <div class="req-chips">
                            <div class="req-chip">
                                <i class="fa-solid fa-clock"></i>${date}
                            </div>
                            <div class="req-chip eth">
                                <i class="fa-solid fa-ethereum"></i>${b.amount} ETH
                            </div>
                            <div class="req-chip">
                                <i class="fa-solid fa-hourglass-half"></i>${b.duration}h session
                            </div>
                        </div>
                        <div class="req-actions">
                            <button class="btn-accept" id="accept-${b._id}" onclick="handleAccept('${b._id}')">
                                <i class="fa-solid fa-check"></i> Accept
                            </button>
                            <button class="btn-decline" id="decline-${b._id}" onclick="handleDecline('${b._id}')">
                                <i class="fa-solid fa-xmark"></i> Decline
                            </button>
                        </div>
                    </div>
                </div>`;
        }).join('');

    } catch (err) {
        console.error('Failed to load requests:', err);
        container.innerHTML = `
            <div class="empty-req">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Failed to load requests.<br>Is the backend running?</p>
            </div>`;
    }
}

/* ============================================================
   ACCEPT BOOKING
   ============================================================ */
async function handleAccept(bookingId) {
    const aBtn = document.getElementById(`accept-${bookingId}`);
    const dBtn = document.getElementById(`decline-${bookingId}`);

    aBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    aBtn.disabled  = true;
    dBtn.disabled  = true;

    try {
        const res  = await fetch(`http://localhost:5000/api/bookings/${bookingId}/accept`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.booking) {
            showSuccess('Session accepted! ✅');
            /* Fade out the card */
            const card = document.getElementById(`req-${bookingId}`);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity    = '0';
                card.style.transform  = 'translateX(10px)';
                setTimeout(() => {
                    card.remove();
                    loadRequests();
                    loadTutorProfile();
                }, 300);
            }
        } else {
            throw new Error(data.message || 'Accept failed');
        }
    } catch (err) {
        showError('Failed to accept booking: ' + err.message);
        aBtn.innerHTML = '<i class="fa-solid fa-check"></i> Accept';
        aBtn.disabled  = false;
        dBtn.disabled  = false;
    }
}

/* ============================================================
   DECLINE BOOKING
   ============================================================ */
async function handleDecline(bookingId) {
    const aBtn = document.getElementById(`accept-${bookingId}`);
    const dBtn = document.getElementById(`decline-${bookingId}`);

    aBtn.disabled = true;
    dBtn.disabled = true;
    dBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const res  = await fetch(`http://localhost:5000/api/bookings/${bookingId}/decline`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.booking) {
            showInfo('Booking declined.');
            const card = document.getElementById(`req-${bookingId}`);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity    = '0';
                card.style.transform  = 'translateX(-10px)';
                setTimeout(() => {
                    card.remove();
                    loadRequests();
                }, 300);
            }
        } else {
            throw new Error(data.message || 'Decline failed');
        }
    } catch (err) {
        showError('Failed to decline booking: ' + err.message);
        aBtn.disabled  = false;
        dBtn.disabled  = false;
        dBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Decline';
    }
}

/* ============================================================
   CONNECT WALLET
   ============================================================ */
async function connectWallet() {
    const btn     = document.getElementById('connectWalletBtn');
    const btnText = document.getElementById('walletBtnText');

    btnText.textContent = 'Connecting…';
    btn.disabled        = true;

    const result = await connectAndSaveWallet();

    if (!result) {
        btnText.textContent = 'Connect Wallet';
        btn.disabled        = false;
        return;
    }

    const { address } = result;
    btn.innerHTML = `<i class="fa-solid fa-circle-check"></i>
                     <span>${address.substring(0, 6)}…${address.substring(38)}</span>`;
    btn.classList.add('connected');
    btn.disabled = false;
    showSuccess('Wallet connected! You can now receive payments. 🎉');
}

/* ============================================================
   INIT
   ============================================================ */
loadTutorProfile();
loadRequests();