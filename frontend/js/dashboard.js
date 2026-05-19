/* ============================================================
   dashboard.js — KnowledgeEx Student Dashboard
   Auth · User · Bookings · Wallet · Sidebar
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

    /* Page greeting */
    const pageGreeting = document.getElementById('pageGreeting');
    if (pageGreeting) pageGreeting.textContent = `Welcome back, ${u.firstName}`;

    /* Topbar */
    const topbarName     = document.getElementById('topbarName');
    const topbarInitials = document.getElementById('topbarInitials');
    const topbarAvImg    = document.getElementById('topbarAvImg');
    if (topbarName)     topbarName.textContent     = shortName;
    if (topbarInitials) topbarInitials.textContent = initials;
    if (topbarAvImg && u.profileImage) {
        topbarAvImg.src           = u.profileImage;
        topbarAvImg.style.display = 'block';
        if (topbarInitials) topbarInitials.style.display = 'none';
    }

    /* Sidebar */
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

/* Sync if profile page updates localStorage */
window.addEventListener('storage', e => {
    if (e.key === 'user' && e.newValue) {
        try { populateUser(JSON.parse(e.newValue)); } catch {}
    }
});

/* ── Time-of-day greeting ── */
(function setGreeting() {
    const hour = new Date().getHours();
    const word = hour < 12 ? 'Good morning 👋'
               : hour < 17 ? 'Good afternoon 👋'
               :              'Good evening 👋';
    const el = document.getElementById('greetingText');
    if (el) el.textContent = word;
})();

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

        const completed = bookings.filter(b => b.status === 'completed');
        const upcoming  = bookings.filter(b => b.status === 'scheduled');
        const escrow    = bookings
            .filter(b => ['pending', 'scheduled'].includes(b.status))
            .reduce((sum, b) => sum + b.amount, 0);

        document.getElementById('sessionsCompleted').textContent = completed.length;
        document.getElementById('upcomingSessions').textContent  = upcoming.length;
        document.getElementById('lockedInEscrow').textContent    = `${escrow.toFixed(3)} ETH`;

        renderTransactions(bookings);
        renderPendingActions(bookings);

    } catch (err) {
        console.error('Failed to load bookings:', err);
        document.getElementById('transactionsBody').innerHTML = `
            <tr><td colspan="5">
                <div class="table-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Failed to load. Is the backend running?
                </div>
            </td></tr>`;
    }
}

/* ============================================================
   RENDER TRANSACTIONS TABLE
   ============================================================ */
function renderTransactions(bookings) {
    const tbody = document.getElementById('transactionsBody');

    if (!bookings.length) {
        tbody.innerHTML = `
            <tr><td colspan="5">
                <div class="table-state">
                    <i class="fa-solid fa-inbox"></i> No transactions yet.
                </div>
            </td></tr>`;
        return;
    }

    const STATUS_MAP = {
        completed: ['completed', 'fa-check',         'Released'],
        pending:   ['pending',   'fa-clock',          'Pending'],
        scheduled: ['scheduled', 'fa-calendar-check', 'Scheduled'],
    };

    /* Latest 4 only */
    const preview = [...bookings]
        .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
        .slice(0, 4);

    tbody.innerHTML = preview.map(b => {
        const date  = new Date(b.scheduledAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
        const inits = b.tutor.firstName.charAt(0) + b.tutor.lastName.charAt(0);
        const [cls, ico, label] = STATUS_MAP[b.status] || ['pending', 'fa-clock', b.status];

        return `
            <tr>
                <td>
                    <div class="tutor-cell">
                        <div class="tutor-init">${inits}</div>
                        <div class="tutor-name">${b.tutor.firstName} ${b.tutor.lastName}</div>
                    </div>
                </td>
                <td>${b.subject}</td>
                <td>${date}</td>
                <td><span class="amount-cell">${b.amount} ETH</span></td>
                <td>
                    <span class="status-pill ${cls}">
                        <i class="fa-solid ${ico}"></i> ${label}
                    </span>
                </td>
            </tr>`;
    }).join('');
}

/* ============================================================
   RENDER PENDING ACTIONS
   ============================================================ */
function renderPendingActions(bookings) {
    const container = document.getElementById('pendingActions');
    const badge     = document.getElementById('pendingCount');

    const awaiting  = bookings.filter(b => b.status === 'awaiting_confirmation');
    const scheduled = bookings.filter(b => b.status === 'scheduled');
    const total     = awaiting.length + scheduled.length;

    /* Badge */
    badge.textContent = total;
    badge.className   = total > 0 ? 'pending-badge has-items' : 'pending-badge';

    if (!total) {
        container.innerHTML = `
            <div class="table-state" style="flex-direction:column; gap:8px; padding:40px 20px;">
                <i class="fa-solid fa-circle-check" style="font-size:28px; color:var(--success); opacity:0.5;"></i>
                All clear — no pending actions!
            </div>`;
        return;
    }

    container.innerHTML = [
        ...awaiting.map(b => `
            <div class="action-item">
                <div class="action-dot warn">
                    <i class="fa-solid fa-exclamation"></i>
                </div>
                <div>
                    <div class="action-title">Release Payment</div>
                    <div class="action-sub">
                        Confirm session with <strong>${b.tutor.firstName}</strong>
                        for <strong>${b.subject}</strong>
                    </div>
                    <button class="btn-release" onclick="confirmSession('${b._id}')">
                        <i class="fa-solid fa-unlock"></i> Release Funds
                    </button>
                </div>
            </div>`),

        ...scheduled.map(b => {
            const date = new Date(b.scheduledAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            return `
                <div class="action-item">
                    <div class="action-dot info">
                        <i class="fa-solid fa-calendar"></i>
                    </div>
                    <div>
                        <div class="action-title">${b.subject}</div>
                        <div class="action-sub">
                            ${date} · ${b.tutor.firstName} ${b.tutor.lastName}
                        </div>
                    </div>
                </div>`;
        })
    ].join('');
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
            loadBookings();
        }
    } catch (err) {
        showError('Error: ' + err.message);
    }
}

/* ============================================================
   CONNECT WALLET
   ============================================================ */
async function connectWallet() {
    const btn     = document.getElementById('connectWalletBtn');
    const btnText = document.getElementById('walletBtnText');
    const display = document.getElementById('walletBalanceDisplay');

    btnText.textContent = 'Connecting…';
    btn.disabled        = true;

    const result = await connectAndSaveWallet();

    if (!result) {
        btnText.textContent = 'Connect Wallet';
        btn.disabled        = false;
        return;
    }

    const { provider, address } = result;
    const balance = await provider.getBalance(address);
    const eth     = parseFloat(ethers.utils.formatEther(balance)).toFixed(4);

    btn.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <span>${address.substring(0, 6)}…${address.substring(38)}</span>`;
    btn.classList.add('connected');
    btn.disabled = false;

    if (display) display.textContent = `${eth} ETH`;
}

/* ============================================================
   INIT
   ============================================================ */
loadBookings();