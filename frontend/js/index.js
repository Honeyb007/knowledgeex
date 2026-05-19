/* ============================================================
   index.js — KnowledgeEx Landing Page
   Tutors · Modals · Mobile menu
   ============================================================ */

/* ── Year ── */
document.getElementById('year').textContent = new Date().getFullYear();

/* ── Mobile menu toggle ── */
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');

menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    const icon = menuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-xmark');
});

/* Close mobile menu on nav link click */
mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-xmark');
    });
});

/* ── Load top tutors ── */
async function loadTopTutors() {
    const grid = document.getElementById('tutorsGrid');

    try {
        const response = await fetch('http://localhost:5000/api/tutors');
        const tutors   = await response.json();
        const top3     = tutors.sort((a, b) => b.rating - a.rating).slice(0, 3);

        if (top3.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:40px 0;">
                    <i class="fa-solid fa-user-graduate" style="font-size:32px; opacity:0.3; display:block; margin-bottom:12px;"></i>
                    No tutors yet. Be the first to join!
                </div>`;
            return;
        }

        grid.innerHTML = top3.map(tutor => {
            const initials   = tutor.user.firstName.charAt(0) + tutor.user.lastName.charAt(0);
            const starsHtml  = tutor.rating > 0
                ? `<i class="fa-solid fa-star"></i> ${tutor.rating}`
                : '<i class="fa-regular fa-star"></i> New';
            const courses    = tutor.courses.slice(0, 2)
                .map(c => `<span class="tutor-pill">${c}</span>`).join('');
            const avatarHtml = tutor.user.profileImage
                ? `<div class="tutor-img-wrap">
                       <img class="tutor-img" src="${tutor.user.profileImage}"
                            alt="${tutor.user.firstName} ${tutor.user.lastName}">
                   </div>`
                : `<div class="tutor-avatar-fallback">${initials}</div>`;

            return `
                <div class="tutor-card">
                    ${avatarHtml}
                    <div class="tutor-name">${tutor.user.firstName} ${tutor.user.lastName}</div>
                    <div class="tutor-rating">${starsHtml} <span>(${tutor.totalSessions} sessions)</span></div>
                    <div class="tutor-meta">${tutor.department} &middot; ${tutor.level}L</div>
                    <div class="tutor-pills">${courses}</div>
                    <a href="login.html" class="btn btn-ghost" style="width:100%">
                        <i class="fa-solid fa-calendar-plus"></i> Book Session
                    </a>
                </div>`;
        }).join('');

    } catch (err) {
        console.error('Failed to load tutors:', err);
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:40px 0;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:28px; opacity:0.3; display:block; margin-bottom:10px;"></i>
                Could not load tutors right now.
            </div>`;
    }
}

/* ── Modal content ── */
const MODAL_CONTENT = {
    privacy: {
        title: 'Privacy Policy',
        body: `
            <p>KnowledgeEx is committed to protecting your privacy.</p><br>
            <p><strong>Data We Collect:</strong> Name, email, matric number, department, level, and session history.</p><br>
            <p><strong>How We Use It:</strong> To facilitate tutoring sessions, process payments, and improve the platform.</p><br>
            <p><strong>Blockchain Data:</strong> Payment transactions are recorded on the Ethereum blockchain and are publicly visible by design.</p><br>
            <p><strong>Data Security:</strong> Passwords are encrypted using bcrypt. JWT tokens are used for secure authentication.</p><br>
            <p><strong>Third Parties:</strong> We use Cloudinary for profile image storage. We do not sell your data to any third party.</p><br>
            <p style="color:var(--text-muted); font-size:12px;">Last updated: March 2026</p>`
    },
    terms: {
        title: 'Terms of Service',
        body: `
            <p>By using KnowledgeEx, you agree to the following terms:</p><br>
            <p><strong>Eligibility:</strong> This platform is exclusively for students and tutors of Federal University of Lafia.</p><br>
            <p><strong>Tutoring Sessions:</strong> Tutors are responsible for delivering quality sessions. Learners must confirm sessions honestly.</p><br>
            <p><strong>Payments:</strong> All payments are processed via Ethereum smart contracts. Once locked in escrow, funds are released only upon session confirmation.</p><br>
            <p><strong>Ratings:</strong> Users must leave honest ratings. Fake reviews are prohibited.</p><br>
            <p><strong>Prohibited Conduct:</strong> Harassment, fraud, or misuse of the platform will result in account suspension.</p><br>
            <p><strong>Disclaimer:</strong> KnowledgeEx is a prototype built for academic purposes. Use at your own discretion.</p><br>
            <p style="color:var(--text-muted); font-size:12px;">Last updated: March 2026</p>`
    },
    contact: {
        title: 'Contact Support',
        body: `
            <div class="contact-item">
                <div class="contact-icon blue"><i class="fa-solid fa-envelope"></i></div>
                <div>
                    <div class="contact-label">Email Support</div>
                    <a href="mailto:support@knowledgeex.com" class="contact-value">support@knowledgeex.com</a>
                </div>
            </div>
            <div class="contact-item">
                <div class="contact-icon green"><i class="fa-brands fa-whatsapp"></i></div>
                <div>
                    <div class="contact-label">WhatsApp</div>
                    <a href="https://wa.me/2348000000000" target="_blank" class="contact-value green">+234 800 000 0000</a>
                </div>
            </div>
            <div class="contact-item">
                <div class="contact-icon blue"><i class="fa-solid fa-location-dot"></i></div>
                <div>
                    <div class="contact-label">Location</div>
                    <div class="contact-value muted">Federal University of Lafia, Nasarawa State</div>
                </div>
            </div>`
    }
};

function openModal(type) {
    const data  = MODAL_CONTENT[type];
    if (!data) return;
    document.getElementById('modalTitle').textContent = data.title;
    document.getElementById('modalBody').innerHTML    = data.body;
    document.getElementById('footerModal').classList.add('active');
}

function closeModal() {
    document.getElementById('footerModal').classList.remove('active');
}

/* Close on backdrop click */
document.getElementById('footerModal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

/* Close on Escape */
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

/* ── Init ── */
loadTopTutors();