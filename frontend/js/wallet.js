/* ============================================================
   wallet.js — KnowledgeEx Wallet & Escrow
   Auth · Role-adaptive UI · Wallet Connect · Transactions · Release
   ============================================================ */

/* ── Auth guard ── */
const user  = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
if (!user || !token) navigateTo('login.html');

/* ── Role ── */
const isTutor = user.role === 'tutor';

/* ── Wallet state ── */
let provider, signer, contractInst, walletAddr;

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
    localStorage.removeItem('walletAddress');
    navigateTo('login.html');
}

/* ── Helpers ── */
function setEl(id, text)  { const el = document.getElementById(id); if (el) el.textContent = text; }

function populateSidebarUser(u) {
    if (!u) return;
    const initials  = u.firstName.charAt(0) + u.lastName.charAt(0);
    const shortName = `${u.firstName} ${u.lastName.charAt(0)}.`;

    setEl('sidebarName', shortName);
    setEl('sidebarInitials', initials);
    setEl('topBarName', shortName);

    const sidebarAvImg = document.getElementById('sidebarAvImg');
    if (sidebarAvImg && u.profileImage) {
        sidebarAvImg.src           = u.profileImage;
        sidebarAvImg.style.display = 'block';
        const init = document.getElementById('sidebarInitials');
        if (init) init.style.display = 'none';
    }
}

/* ============================================================
   BUILD ROLE-ADAPTIVE UI
   ============================================================ */
function buildUI() {
    const nav    = document.getElementById('sidebarNavContent');
    const roleEl = document.getElementById('sidebarRole');
    const chipEl = document.getElementById('sidebarUserChip');

    if (isTutor) {
        /* Topbar + page meta */
        setEl('pageTitle',      'Earnings');
        setEl('pageHeading',    'Earnings');
        setEl('pageSubheading', 'Track your crypto earnings from completed sessions.');
        setEl('partyHeader',    'Learner');
        setEl('lockedLabel',    'Pending Payment');
        setEl('totalSpentLabel','Total Earned');

        /* Sidebar role */
            if (roleEl) { roleEl.textContent = 'Tutor'; roleEl.classList.add('tutor'); }
        if (chipEl) chipEl.onclick = () => navigateTo('tutor_profile.html');

        nav.innerHTML = `
            <div class="sidebar-role-badge tutor">
                <i class="fa-solid fa-chalkboard-user"></i> Tutor Account
            </div>
            <div class="sidebar-nav-group">
                <div class="sidebar-label">Tutor Menu</div>
                <ul class="sidebar-links">
                    <li><a href="#" onclick="navigateTo('tutor_dashboard.html')">
                        <i class="fa-solid fa-th"></i> Dashboard
                    </a></li>
                    <li><a href="#" onclick="navigateTo('tutor_sessions.html')">
                        <i class="fa-solid fa-calendar-days"></i> My Schedule
                    </a></li>
                    <li class="active"><a href="#">
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
                    <li><a href="#" onclick="navigateTo('help.html')">
                        <i class="fa-solid fa-circle-question"></i> Help Center
                    </a></li>
                </ul>
            </div>`;
    } else {
        /* Student */
            if (roleEl) { roleEl.textContent = 'Learner'; roleEl.classList.add('learner'); }
        if (chipEl) chipEl.onclick = () => navigateTo('profile.html');

        nav.innerHTML = `
            <div class="sidebar-role-badge learner">
                <i class="fa-solid fa-user-graduate"></i> Learner Account
            </div>
            <div class="sidebar-nav-group">
                <div class="sidebar-label">Main Menu</div>
                <ul class="sidebar-links">
                    <li><a href="#" onclick="navigateTo('dashboard.html')">
                        <i class="fa-solid fa-th"></i> Dashboard
                    </a></li>
                    <li><a href="#" onclick="navigateTo('marketplace.html')">
                        <i class="fa-solid fa-magnifying-glass"></i> Find Tutors
                    </a></li>
                    <li><a href="#" onclick="navigateTo('sessions.html')">
                        <i class="fa-solid fa-calendar-days"></i> My Sessions
                    </a></li>
                    <li class="active"><a href="#">
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
   CONNECT WALLET
   ============================================================ */
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showError('Please install MetaMask to connect your wallet.');
        return;
    }

    const btn = document.getElementById('connectBtn');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting…';
    btn.disabled  = true;

    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider   = new ethers.providers.Web3Provider(window.ethereum);
        signer     = provider.getSigner();
        walletAddr = await signer.getAddress();

        const balance = await provider.getBalance(walletAddr);
        const eth     = parseFloat(ethers.utils.formatEther(balance)).toFixed(4);
        const network = await provider.getNetwork();
        const netName = network.name === 'sepolia' ? 'Sepolia Testnet'
                      : network.name === 'homestead' ? 'Ethereum Mainnet'
                      : network.name;

        /* Update hero */
        setEl('walletBalanceNum', eth);

        const addrEl = document.getElementById('walletAddress');
        if (addrEl) {
            addrEl.textContent = `${walletAddr.substring(0, 8)}…${walletAddr.substring(36)}`;
            addrEl.classList.add('connected');
        }

        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) copyBtn.style.display = 'inline-flex';

        const networkChip = document.getElementById('networkChip');
        if (networkChip) networkChip.style.display = 'flex';
        setEl('networkName', netName);

        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Connected';
        btn.classList.add('connected');
        btn.disabled  = false;

        /* Init contract */
        contractInst = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        /* Persist to backend */
        localStorage.setItem('walletAddress', walletAddr);
        await fetch('http://localhost:5000/api/auth/save-wallet', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ walletAddress: walletAddr })
        });
        user.walletAddress = walletAddr;
        localStorage.setItem('user', JSON.stringify(user));

        showSuccess('Wallet connected! 🎉');
        loadTransactions();

    } catch (err) {
        console.error('Wallet connect error:', err);
        showError('Failed to connect wallet.');
        const btn2 = document.getElementById('connectBtn');
        if (btn2) {
            btn2.innerHTML = '<i class="fa-solid fa-wallet"></i> Connect Wallet';
            btn2.disabled  = false;
        }
    }
}

/* ── Copy wallet address ── */
function copyAddress() {
    if (!walletAddr) return;
    navigator.clipboard.writeText(walletAddr)
        .then(() => showSuccess('Address copied to clipboard!'))
        .catch(() => showError('Failed to copy address.'));
}

/* ============================================================
   LOAD TRANSACTIONS
   ============================================================ */
async function loadTransactions() {
    const tbody = document.getElementById('transactionsBody');

    try {
        const endpoint = isTutor
            ? 'http://localhost:5000/api/bookings/tutor-requests'
            : 'http://localhost:5000/api/bookings/my-bookings';

        const res      = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bookings = await res.json();

        /* ── Stats ── */
        const active    = bookings.filter(b =>
            ['pending', 'scheduled', 'awaiting_confirmation'].includes(b.status));
        const completed = bookings.filter(b => b.status === 'completed');

        const locked = active.reduce((s, b)    => s + b.amount, 0);
        const total  = completed.reduce((s, b) => s + b.amount, 0);

        setEl('lockedAmount',  `${locked.toFixed(3)} ETH`);
        setEl('totalSpent',    `${total.toFixed(3)} ETH`);
        setEl('totalTxCount',  bookings.length);

        /* ── Table ── */
        if (!bookings.length) {
            tbody.innerHTML = `
                <tr><td colspan="5">
                    <div class="table-state">
                        <i class="fa-solid fa-inbox"></i>
                        No transactions yet.
                    </div>
                </td></tr>`;
            return;
        }

        const STATUS_MAP = {
            pending:               ['s-pending',  'fa-clock',          'Pending'],
            scheduled:             ['s-funded',   'fa-lock',           'Funded'],
            awaiting_confirmation: ['s-awaiting', 'fa-hourglass-half', 'Awaiting'],
            completed:             ['s-completed','fa-circle-check',   'Released'],
            declined:              ['s-refunded', 'fa-xmark-circle',   'Declined'],
            refunded:              ['s-refunded', 'fa-rotate-left',    'Refunded'],
        };

        tbody.innerHTML = bookings.map(b => {
            const party = isTutor
                ? `${b.learner.firstName} ${b.learner.lastName}`
                : `${b.tutor.firstName}   ${b.tutor.lastName}`;
            const partyInits = isTutor
                ? b.learner.firstName.charAt(0) + b.learner.lastName.charAt(0)
                : b.tutor.firstName.charAt(0)   + b.tutor.lastName.charAt(0);

            const [cls, ico, lbl] = STATUS_MAP[b.status] || ['s-pending', 'fa-clock', 'Pending'];

            /* Build action cell */
            let action = '<span style="color:var(--text-muted); font-size:12px;">—</span>';

            if (b.txHash) {
                action = `
                    <a class="chain-link"
                        href="https://sepolia.etherscan.io/tx/${b.txHash}"
                        target="_blank" rel="noopener">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> View on chain
                    </a>`;
            } else if (!isTutor && b.status === 'awaiting_confirmation') {
                action = `
                    <button class="btn-release" onclick="releasePayment('${b._id}')">
                        <i class="fa-solid fa-unlock"></i> Release
                    </button>`;
            }

            return `
                <tr>
                    <td>
                        <div class="party-cell">
                            <div class="party-av">${partyInits}</div>
                            <div class="party-name">${party}</div>
                        </div>
                    </td>
                    <td>${b.subject}</td>
                    <td><span class="amount-cell">${b.amount} ETH</span></td>
                    <td>
                        <span class="status-badge ${cls}">
                            <i class="fa-solid ${ico}"></i> ${lbl}
                        </span>
                    </td>
                    <td>${action}</td>
                </tr>`;
        }).join('');

    } catch (err) {
        console.error('Failed to load transactions:', err);
        tbody.innerHTML = `
            <tr><td colspan="5">
                <div class="table-state">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    Failed to load. Is the backend running?
                </div>
            </td></tr>`;
    }
}

/* ============================================================
   RELEASE PAYMENT
   ============================================================ */
async function releasePayment(bookingId) {
    if (!contractInst) {
        showWarning('Please connect your wallet first!');
        return;
    }
    if (!confirm('Release payment to tutor via smart contract?')) return;

    try {
        showInfo('Releasing funds from escrow…');
        const tx = await contractInst.releasePayment(bookingId);
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
            showSuccess('Payment released! ✅ Tutor received their funds.');
            loadTransactions();
        }
    } catch (err) {
        console.error('Release error:', err);
        showError('Transaction failed: ' + err.message);
    }
}

/* ============================================================
   AUTO-RECONNECT
   ============================================================ */
async function tryAutoConnect() {
    const saved = localStorage.getItem('walletAddress');
    if (!saved || typeof window.ethereum === 'undefined') return;

    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) await connectWallet();
    } catch {}
}

/* ============================================================
   INIT
   ============================================================ */
buildUI();
populateSidebarUser(user);
loadTransactions();
window.addEventListener('load', tryAutoConnect);