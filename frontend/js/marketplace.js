/* ============================================================
   marketplace.js — KnowledgeEx Find Tutors
   Auth · User · Tutors · Filters · Sort · Booking · Availability
   ============================================================ */

/* ── Auth guard ── */
const user  = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');
if (!user || !token) navigateTo('login.html');

/* ── State ── */
let allTutors            = [];
let activeFilter         = 'all';
let selectedTutorId      = '';
let selectedAvailability = '';
let selectedHourlyRate   = 0;

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

    const sidebarInitials = document.getElementById('sidebarInitials');
    const sidebarName     = document.getElementById('sidebarName');
    const topbarInitials  = document.getElementById('topbarInitials');
    const topbarName      = document.getElementById('topbarName');

    if (sidebarInitials) sidebarInitials.textContent = initials;
    if (sidebarName)     sidebarName.textContent     = shortName;
    if (topbarInitials)  topbarInitials.textContent  = initials;
    if (topbarName)      topbarName.textContent      = shortName;
}

populateUser(user);

/* Sync if profile page updates localStorage */
window.addEventListener('storage', e => {
    if (e.key === 'user' && e.newValue) {
        try { populateUser(JSON.parse(e.newValue)); } catch {}
    }
});

/* ============================================================
   LOAD TUTORS
   ============================================================ */
async function loadTutors() {
    try {
        const res = await fetch('http://localhost:5000/api/tutors');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allTutors = await res.json();
        applySortAndFilter();
    } catch (err) {
        console.error('Failed to load tutors:', err);
        document.getElementById('tutorGrid').innerHTML = `
            <div class="grid-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Failed to load tutors.<br>Is the backend running?</p>
            </div>`;
    }
}

/* ============================================================
   RENDER TUTORS
   ============================================================ */
function renderTutors(tutors) {
    const grid = document.getElementById('tutorGrid');
    document.getElementById('tutorCount').textContent = tutors.length;

    if (!tutors.length) {
        grid.innerHTML = `
            <div class="grid-state">
                <i class="fa-solid fa-user-slash"></i>
                <p>No tutors match your search.<br>Try adjusting the filters.</p>
            </div>`;
        return;
    }

    grid.innerHTML = tutors.map((t, i) => {
        const initials = t.user.firstName.charAt(0) + t.user.lastName.charAt(0);

        const starsHtml = t.rating > 0
            ? `<i class="fa-solid fa-star"></i> ${t.rating.toFixed(1)}
               <span class="sessions-count">(${t.totalSessions} session${t.totalSessions !== 1 ? 's' : ''})</span>`
            : `<i class="fa-regular fa-star"></i>
               <span class="sessions-count">New tutor</span>`;

        const tags = t.courses.slice(0, 3)
            .map(c => `<span class="tag">${c}</span>`)
            .join('');

        const avatarHtml = t.user.profileImage
            ? `<img class="t-avatar"
                    src="${t.user.profileImage}"
                    alt="${t.user.firstName}"
                    onerror="this.parentElement.innerHTML='<div class=\\'t-avatar-fallback\\'>${initials}</div><div class=\\'online-dot\\'></div>'">`
            : `<div class="t-avatar-fallback">${initials}</div>`;

        return `
            <div class="tutor-card" style="animation-delay:${i * 0.04}s">
                <div class="t-avatar-wrap">
                    ${avatarHtml}
                    <div class="online-dot"></div>
                </div>
                <div class="t-name">${t.user.firstName} ${t.user.lastName}</div>
                <div class="t-dept">${t.department} &middot; ${t.level}L</div>
                <div class="t-rating">${starsHtml}</div>
                <div class="tags">${tags}</div>
                <div class="t-price">
                    ${t.hourlyRate} ETH
                    <span class="unit">/hr</span>
                </div>
                <div class="card-btns">
                    <button class="btn-view" onclick="viewProfile('${t._id}')">
                        <i class="fa-regular fa-user"></i> Profile
                    </button>
                    <button class="btn-book" onclick="openBooking('${t._id}', '${t.user.firstName} ${t.user.lastName}', ${t.hourlyRate})">
                        <i class="fa-solid fa-calendar-plus"></i> Book
                    </button>
                </div>
            </div>`;
    }).join('');
}

/* ============================================================
   SEARCH + FILTERS + SORT
   ============================================================ */
function setFilter(filter, el) {
    activeFilter = filter;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    applySortAndFilter();
}

function filterTutors() {
    /* Show / hide clear button */
    const val   = document.getElementById('searchInput').value;
    const clear = document.getElementById('searchClear');
    if (clear) clear.classList.toggle('visible', val.length > 0);
    applySortAndFilter();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    const clear = document.getElementById('searchClear');
    if (clear) clear.classList.remove('visible');
    applySortAndFilter();
}

function applySortAndFilter() {
    const query  = document.getElementById('searchInput').value.trim().toLowerCase();
    const sort   = document.getElementById('sortSelect')?.value || 'default';

    /* Filter */
    let filtered = allTutors.filter(t => {
        const haystack = [
            ...t.courses,
            t.department,
            t.user.firstName,
            t.user.lastName,
        ].join(' ').toLowerCase();

        const matchQuery  = !query || haystack.includes(query);
        const matchFilter = activeFilter === 'all'
            || t.courses.some(c => c.toLowerCase().startsWith(activeFilter));

        return matchQuery && matchFilter;
    });

    /* Sort */
    switch (sort) {
        case 'rating':
            filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'price_asc':
            filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
            break;
        case 'price_desc':
            filtered.sort((a, b) => b.hourlyRate - a.hourlyRate);
            break;
        case 'sessions':
            filtered.sort((a, b) => (b.totalSessions || 0) - (a.totalSessions || 0));
            break;
        default:
            break;
    }

    renderTutors(filtered);
}

function viewProfile(tutorId) {
    navigateTo(`tutor_profile.html?tutorId=${tutorId}`);
}

/* ============================================================
   BOOKING MODAL
   ============================================================ */
function openBooking(tutorId, name, hourlyRate) {
    const tutor = allTutors.find(t => t._id === tutorId);
    selectedTutorId      = tutorId;
    selectedAvailability = tutor?.availability || '';
    selectedHourlyRate   = parseFloat(hourlyRate);

    document.getElementById('modalTutorName').textContent = name;

    const availEl = document.getElementById('modalAvailability');
    if (availEl) {
        const span = availEl.querySelector('span');
        if (span) span.textContent = selectedAvailability || 'Not specified';
    }

    /* Reset fields */
    document.getElementById('bookingSubject').value  = '';
    document.getElementById('bookingMessage').value  = '';
    document.getElementById('bookingDate').value     = '';
    document.getElementById('bookingDuration').value = '1';
    updateBookingPrice();
    resetConfirmBtn();

    document.getElementById('bookingModal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('bookingModal').classList.remove('open');
    document.body.style.overflow = '';
    resetConfirmBtn();
}

function handleModalOverlayClick(e) {
    if (e.target === document.getElementById('bookingModal')) closeModal();
}

function updateBookingPrice() {
    const duration = parseInt(document.getElementById('bookingDuration').value, 10);
    const total    = (selectedHourlyRate * duration).toFixed(3);
    document.getElementById('modalPrice').textContent = `${total} ETH`;
}

function resetConfirmBtn() {
    const btn = document.getElementById('confirmBtn');
    if (!btn) return;
    btn.innerHTML = '<i class="fa-solid fa-lock"></i> Confirm & Pay';
    btn.disabled  = false;
}

/* ============================================================
   AVAILABILITY VALIDATION
   ============================================================ */
function parseAvailability(availability) {
    if (!availability) return null;

    const rule = { days: null, startMinutes: null, endMinutes: null };
    const text = availability.toLowerCase();

    /* Days */
    if (/weekdays/.test(text)) {
        rule.days = [1, 2, 3, 4, 5];
    } else if (/weekends/.test(text)) {
        rule.days = [0, 6];
    } else if (/daily|every day|any day/.test(text)) {
        rule.days = [0, 1, 2, 3, 4, 5, 6];
    } else {
        const DAY_MAP = {
            sunday: 0, sun: 0,
            monday: 1, mon: 1,
            tuesday: 2, tue: 2, tues: 2,
            wednesday: 3, wed: 3,
            thursday: 4, thu: 4, thurs: 4,
            friday: 5, fri: 5,
            saturday: 6, sat: 6,
        };
        const days = [];
        Object.entries(DAY_MAP).forEach(([name, num]) => {
            if (new RegExp(`\\b${name}\\b`).test(text)) days.push(num);
        });
        if (days.length) rule.days = [...new Set(days)].sort();
    }

    /* Time range */
    const timeMatch = text.match(
        /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)[\s–\-to]+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
    );
    if (timeMatch) {
        const parseTime = token => {
            const m = token.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
            if (!m) return null;
            let h = parseInt(m[1], 10);
            const min = parseInt(m[2] || '0', 10);
            const mer = m[3]?.toLowerCase();
            if (mer === 'pm' && h !== 12) h += 12;
            if (mer === 'am' && h === 12) h = 0;
            return h * 60 + min;
        };
        rule.startMinutes = parseTime(timeMatch[1]);
        rule.endMinutes   = parseTime(timeMatch[2]);
    }

    return rule;
}

function validateBookingDate(dateString, duration, availability) {
    if (!availability) return { ok: true };

    const rule = parseAvailability(availability);
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return { ok: false, message: 'Please select a valid date and time.' };
    }

    if (rule?.days && !rule.days.includes(date.getDay())) {
        const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const allowed   = rule.days.map(d => DAY_NAMES[d]).join(', ');
        return { ok: false, message: `Tutor is only available on: ${allowed}.` };
    }

    if (rule?.startMinutes != null && rule?.endMinutes != null) {
        const bookingStart = date.getHours() * 60 + date.getMinutes();
        const bookingEnd   = bookingStart + duration * 60;
        if (bookingStart < rule.startMinutes || bookingEnd > rule.endMinutes) {
            const pad = n => String(n).padStart(2, '0');
            const sh  = Math.floor(rule.startMinutes / 60), sm = rule.startMinutes % 60;
            const eh  = Math.floor(rule.endMinutes   / 60), em = rule.endMinutes   % 60;
            return {
                ok: false,
                message: `Tutor is available between ${sh}:${pad(sm)} and ${eh}:${pad(em)}. Please pick a time within that window.`
            };
        }
    }

    return { ok: true };
}

/* ============================================================
   PROCESS BOOKING
   ============================================================ */
async function processBooking() {
    const btn       = document.getElementById('confirmBtn');
    const subject   = document.getElementById('bookingSubject').value.trim();
    const message   = document.getElementById('bookingMessage').value.trim();
    const scheduled = document.getElementById('bookingDate').value;
    const duration  = parseInt(document.getElementById('bookingDuration').value, 10);

    /* Validation */
    if (!subject || !scheduled) {
        showWarning('Please fill in the subject and pick a date.');
        return;
    }

    const availCheck = validateBookingDate(scheduled, duration, selectedAvailability);
    if (!availCheck.ok) {
        showError(availCheck.message);
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing…';
    btn.disabled  = true;

    try {
        /* 1 — Fetch tutor wallet */
        const tutorRes  = await fetch(`http://localhost:5000/api/tutors/${selectedTutorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tutorData = await tutorRes.json();
        const tutorWallet = tutorData.user.walletAddress;

        if (!tutorWallet) {
            showError("This tutor hasn't connected their wallet yet.");
            resetConfirmBtn();
            return;
        }

        /* 2 — Create booking record */
        const bookRes  = await fetch('http://localhost:5000/api/bookings/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tutorProfileId: selectedTutorId,
                subject,
                message,
                scheduledAt: scheduled,
                duration
            })
        });
        const bookData = await bookRes.json();

        if (!bookData.booking) {
            showError(bookData.message || 'Booking failed. Please try again.');
            resetConfirmBtn();
            return;
        }

        const bookingId = bookData.booking._id;
        const amount    = bookData.booking.amount;

        /* 3 — MetaMask / smart contract */
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider  = new ethers.providers.Web3Provider(window.ethereum);
        const signer    = provider.getSigner();
        const contract  = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const amountWei = ethers.utils.parseEther(amount.toString());

        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Confirm in MetaMask…';

        let tx;
        try {
            tx = await contract.fundSession(bookingId, tutorWallet, { value: amountWei });
        } catch (mmErr) {
            /* User rejected — clean up dangling booking */
            await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showError('Transaction cancelled. Booking removed.');
            resetConfirmBtn();
            return;
        }

        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Waiting for blockchain…';
        await tx.wait();

        /* 4 — Save tx hash to backend */
        await fetch(`http://localhost:5000/api/bookings/${bookingId}/fund`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ txHash: tx.hash })
        });

        showSuccess('Session booked! 🎉 Payment is locked in escrow.');
        closeModal();
        setTimeout(() => navigateTo('dashboard.html'), 1600);

    } catch (err) {
        console.error('Booking error:', err);
        showError('Something went wrong: ' + err.message);
        resetConfirmBtn();
    }
}

/* ============================================================
   INIT
   ============================================================ */
loadTutors();