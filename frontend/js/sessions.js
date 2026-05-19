/* ============================================================
   sessions.js — KnowledgeEx My Sessions
   Auth · User · Load · Filter · Confirm · Refund · Feedback
   ============================================================ */

/* ── Auth guard ── */
const user  = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
if (!user || !token) navigateTo('login.html');

/* ── State ── */
let allBookings       = [];
let selectedRating    = 0;
let selectedBookingId = '';

const RATING_LABELS = {
    1: 'Poor 😞',
    2: 'Fair 😐',
    3: 'Good 🙂',
    4: 'Great 😊',
    5: 'Excellent 🌟'
};

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
    },
    refunded: {
        cls: 's-refunded', accentCls: 'accent-refunded',
        icon: 'fa-rotate-left', label: 'Refunded'
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

    if (sidebarName)     sidebarName.textContent     = shortName;
    if (sidebarInitials) sidebarInitials.textContent = initials;
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
        const res   = await fetch('http://localhost:5000/api/bookings/my-bookings', {
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
   UPDATE TAB COUNTS
   ============================================================ */
function updateCounts(bookings) {
    const counts = {
        all: bookings.length,
        pending: 0, scheduled: 0,
        awaiting: 0, completed: 0,
        declined: 0, refunded: 0
    };

    bookings.forEach(b => {
        if      (b.status === 'pending')                counts.pending++;
        else if (b.status === 'scheduled')              counts.scheduled++;
        else if (b.status === 'awaiting_confirmation')  counts.awaiting++;
        else if (b.status === 'completed')              counts.completed++;
        else if (b.status === 'declined')               counts.declined++;
        else if (b.status === 'refunded')               counts.refunded++;
    });

    Object.entries(counts).forEach(([k, v]) => {
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
                <p>Book a session with a tutor to get started!</p>
                <a class="btn-find" href="#" onclick="navigateTo('marketplace.html')">
                    <i class="fa-solid fa-magnifying-glass"></i> Find a Tutor
                </a>
            </div>`;
        return;
    }

    container.innerHTML = bookings.map((b, i) => {
        const s     = STATUS[b.status] || STATUS.pending;
        const inits = b.tutor.firstName.charAt(0) + b.tutor.lastName.charAt(0);
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
                        <div class="session-tutor">
                            <div class="tutor-av">${inits}</div>
                            <div>
                                <div class="tutor-name">
                                    ${b.tutor.firstName} ${b.tutor.lastName}
                                </div>
                                <div class="tutor-subject">${b.subject}</div>
                            </div>
                        </div>
                        <span class="status-badge ${s.cls}">
                            <i class="fa-solid ${s.icon}"></i> ${s.label}
                        </span>
                    </div>

                    <div class="session-details">
                        <div class="detail-chip">
                            <i class="fa-solid fa-calendar"></i>
                            <div>
                                <div class="detail-chip-label">Date</div>
                                <div class="detail-chip-value">${date}</div>
                            </div>
                        </div>
                        <div class="detail-chip">
                            <i class="fa-solid fa-clock"></i>
                            <div>
                                <div class="detail-chip-label">Time</div>
                                <div class="detail-chip-value">${time}</div>
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
   BUILD ACTIONS HTML PER STATUS
   ============================================================ */
function buildActions(b) {
    const now          = Date.now();
    const scheduledMs  = new Date(b.scheduledAt).getTime();
    const hoursPassed  = (now - scheduledMs) / (1000 * 60 * 60);
    const hoursLeft    = Math.max(0, 48 - hoursPassed).toFixed(1);

    switch (b.status) {

        case 'awaiting_confirmation':
            return `
                <button class="btn-release" onclick="confirmSession('${b._id}')">
                    <i class="fa-solid fa-unlock"></i> Release Payment
                </button>`;

        case 'pending':
            if (hoursPassed >= 48) {
                return `
                    <span class="status-msg danger">
                        <i class="fa-solid fa-clock"></i>
                        Deadline passed — tutor never responded.
                    </span>
                    <button class="btn-refund" onclick="claimRefund('${b._id}')">
                        <i class="fa-solid fa-rotate-left"></i> Claim Refund
                    </button>`;
            }
            return `
                <span class="status-msg waiting">
                    <i class="fa-solid fa-clock"></i>
                    Waiting for tutor to accept…
                    <span class="countdown-pill">
                        <i class="fa-solid fa-hourglass-half"></i>
                        ${hoursLeft}h left
                    </span>
                </span>`;

        case 'scheduled':
            if (hoursPassed >= 48) {
                return `
                    <span class="status-msg danger">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        Session time passed — tutor never marked complete.
                    </span>
                    <button class="btn-refund" onclick="claimRefund('${b._id}')">
                        <i class="fa-solid fa-rotate-left"></i> Claim Refund
                    </button>`;
            }
            return `
                <span class="status-msg info">
                    <i class="fa-solid fa-calendar-check"></i>
                    Session scheduled — attend and await tutor confirmation.
                </span>`;

        case 'declined':
            return `
                <span class="status-msg danger">
                    <i class="fa-solid fa-xmark"></i> Booking was declined.
                </span>
                <button class="btn-refund" onclick="claimRefund('${b._id}')">
                    <i class="fa-solid fa-rotate-left"></i> Claim Refund
                </button>`;

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
                    <button class="btn-feedback"
                        onclick="openFeedbackModal('${b._id}',
                        '${b.tutor.firstName} ${b.tutor.lastName}')">
                        <i class="fa-solid fa-star"></i> Leave Feedback
                    </button>`;
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

        case 'refunded':
            return `
                <span class="status-msg info">
                    <i class="fa-solid fa-rotate-left"></i>
                    Refund processed successfully.
                </span>`;

        default:
            return '';
    }
}

/* ============================================================
   FILTER SESSIONS
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
   CONFIRM SESSION & RELEASE PAYMENT
   ============================================================ */
async function confirmSession(bookingId) {
    if (!confirm('Confirm this session and release payment to the tutor?')) return;

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer   = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        showInfo('Releasing funds from escrow…');
        const tx = await contract.releasePayment(bookingId);
        showInfo('Transaction submitted — waiting for confirmation…');
        await tx.wait();

        const res  = await fetch(`http://localhost:5000/api/bookings/${bookingId}/confirm`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ txHash: tx.hash })
        });
        const data = await res.json();

        if (data.booking) {
            showSuccess('Payment released! Tutor received their funds ✅');
            loadSessions();
        }
    } catch (err) {
        showError('Error: ' + err.message);
    }
}

/* ============================================================
   CLAIM REFUND
   ============================================================ */
async function claimRefund(bookingId) {
    if (!confirm('Claim refund for this booking? This will call the smart contract.')) return;

    try {
        if (typeof window.ethereum === 'undefined') {
            showError('Please install MetaMask to claim a refund.');
            return;
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer   = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        showInfo('Confirm the transaction in MetaMask…');
        const tx = await contract.refundLearner(bookingId);
        showInfo('Transaction submitted — waiting for confirmation…');
        await tx.wait();

        const res  = await fetch(`http://localhost:5000/api/bookings/${bookingId}/refund`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ txHash: tx.hash })
        });
        const data = await res.json();

        if (data.booking) {
            showSuccess('Refund successful! ETH returned to your wallet. 🎉');
            loadSessions();
        }
    } catch (err) {
        console.error('Refund error:', err);
        if (err.message.includes('Session not funded')) {
            showError('This booking was not funded on-chain. Only escrow bookings can be refunded via smart contract.');
        } else {
            showError('Refund failed: ' + err.message);
        }
    }
}

/* ============================================================
   FEEDBACK MODAL
   ============================================================ */
function openFeedbackModal(bookingId, tutorName) {
    const booking = allBookings.find(b => b._id === bookingId);
    if (booking?.feedback) {
        showInfo('Feedback already submitted for this session.');
        return;
    }

    selectedBookingId = bookingId;
    selectedRating    = 0;

    /* Reset modal */
    document.getElementById('feedbackTutorName').textContent = tutorName;
    document.getElementById('feedbackComment').value         = '';
    document.getElementById('ratingLabel').textContent       = 'Tap a star to rate';
    document.getElementById('ratingLabel').style.color       = '';
    document.querySelectorAll('.star-btn').forEach(s => s.classList.remove('lit'));

    const btn = document.getElementById('submitFeedbackBtn');
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit';
    btn.disabled  = false;

    document.getElementById('feedbackModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').classList.remove('open');
    document.body.style.overflow = '';
}

function handleModalClick(e) {
    if (e.target === document.getElementById('feedbackModal')) closeFeedbackModal();
}

function setRating(r) {
    selectedRating = r;
    document.querySelectorAll('.star-btn').forEach((s, i) => {
        s.classList.toggle('lit', i < r);
    });
    const label = document.getElementById('ratingLabel');
    label.textContent = RATING_LABELS[r] || '';
    label.style.color = 'var(--warning)';
}

async function submitFeedback() {
    if (!selectedRating) {
        showWarning('Please select a star rating first!');
        return;
    }

    const btn     = document.getElementById('submitFeedbackBtn');
    const comment = document.getElementById('feedbackComment').value.trim();

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled  = true;

    try {
        const res  = await fetch('http://localhost:5000/api/feedback/leave', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookingId: selectedBookingId,
                rating:    selectedRating,
                comment
            })
        });
        const data = await res.json();

        if (data.feedback) {
            showSuccess('Feedback submitted! ⭐ Thank you!');
            closeFeedbackModal();
            loadSessions();
        } else {
            throw new Error(data.message || 'Submission failed');
        }
    } catch (err) {
        showError('Failed to submit: ' + err.message);
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit';
        btn.disabled  = false;
    }
}

/* ============================================================
   INIT
   ============================================================ */
loadSessions();
