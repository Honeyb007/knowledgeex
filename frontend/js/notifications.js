// notifications.js — KnowledgeEx custom notification & confirm system
// Matches the dark SaaS design system (Syne + DM Sans, #0a0d14 bg, blue accent)
//
// Dependencies (already in every HTML page):
//   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">
//   <script src="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.js"></script>
//   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

/* ─────────────────────────────────────────────
   SHARED TOAST BASE CONFIG
───────────────────────────────────────────── */
const TOAST_BASE = {
    duration:     3500,
    close:        false,       // custom × rendered inside HTML
    gravity:      'top',
    position:     'right',
    stopOnFocus:  true,
    escapeMarkup: false,       // allow HTML in text
    offset: { y: 16, x: 16 },
    style: {
        fontFamily:   "'DM Sans', sans-serif",
        fontSize:     '14px',
        fontWeight:   '500',
        borderRadius: '12px',
        padding:      '12px 16px',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.55)',
        minWidth:     '280px',
        maxWidth:     '380px',
        lineHeight:   '1.5',
    }
};

/* Build inner HTML: icon bubble + message + dismiss × */
function _toastHTML(iconClass, accentColor, message) {
    return `
        <span style="display:flex;align-items:flex-start;gap:10px;width:100%;">
            <span style="
                width:28px; height:28px; border-radius:8px;
                background:${accentColor}22;
                display:flex; align-items:center; justify-content:center;
                flex-shrink:0; margin-top:1px;
            ">
                <i class="${iconClass}" style="color:${accentColor}; font-size:13px;"></i>
            </span>
            <span style="flex:1;">${message}</span>
            <span
                onclick="this.closest('.toastify').remove()"
                style="cursor:pointer; opacity:0.4; font-size:18px; line-height:1;
                       flex-shrink:0; margin-left:4px; margin-top:-1px;">
                &times;
            </span>
        </span>`;
}

/* ─────────────────────────────────────────────
   PUBLIC TOAST FUNCTIONS
───────────────────────────────────────────── */

/** ✅ Green success */
function showSuccess(message) {
    Toastify({
        ...TOAST_BASE,
        text: _toastHTML('fa-solid fa-circle-check', '#10b981', message),
        style: {
            ...TOAST_BASE.style,
            background: '#0b1a14',
            border:     '1px solid rgba(16,185,129,0.28)',
            color:      '#d1fae5',
        }
    }).showToast();
}

/** ❌ Red error */
function showError(message) {
    Toastify({
        ...TOAST_BASE,
        duration: 5000,
        text: _toastHTML('fa-solid fa-circle-xmark', '#ef4444', message),
        style: {
            ...TOAST_BASE.style,
            background: '#1a0c0c',
            border:     '1px solid rgba(239,68,68,0.28)',
            color:      '#fecaca',
        }
    }).showToast();
}

/** ℹ️ Blue info */
function showInfo(message) {
    Toastify({
        ...TOAST_BASE,
        text: _toastHTML('fa-solid fa-circle-info', '#60a5fa', message),
        style: {
            ...TOAST_BASE.style,
            background: '#0c1220',
            border:     '1px solid rgba(37,99,235,0.28)',
            color:      '#bfdbfe',
        }
    }).showToast();
}

/** ⚠️ Amber warning */
function showWarning(message) {
    Toastify({
        ...TOAST_BASE,
        duration: 4500,
        text: _toastHTML('fa-solid fa-triangle-exclamation', '#f59e0b', message),
        style: {
            ...TOAST_BASE.style,
            background: '#1a1400',
            border:     '1px solid rgba(245,158,11,0.28)',
            color:      '#fde68a',
        }
    }).showToast();
}

/* ─────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────── */
function showConfirm(message, onConfirm, onCancel) {

    /* Inject styles once */
    if (!document.getElementById('kex-confirm-styles')) {
        const style = document.createElement('style');
        style.id = 'kex-confirm-styles';
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

            .kex-overlay {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.72);
                display: flex; align-items: center; justify-content: center;
                z-index: 99999; padding: 20px;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                animation: kexFadeIn 0.18s ease;
            }
            @keyframes kexFadeIn {
                from { opacity: 0; }
                to   { opacity: 1; }
            }

            .kex-modal {
                background: #111520;
                border: 1px solid rgba(255,255,255,0.10);
                border-radius: 20px;
                padding: 28px;
                max-width: 380px; width: 100%;
                box-shadow: 0 24px 64px rgba(0,0,0,0.65);
                text-align: center;
                animation: kexSlideUp 0.22s ease;
            }
            @keyframes kexSlideUp {
                from { transform: translateY(20px); opacity: 0; }
                to   { transform: translateY(0);    opacity: 1; }
            }

            .kex-icon {
                width: 52px; height: 52px;
                background: rgba(37,99,235,0.13);
                border: 1px solid rgba(37,99,235,0.25);
                border-radius: 14px;
                display: flex; align-items: center; justify-content: center;
                font-size: 22px; color: #60a5fa;
                margin: 0 auto 18px;
            }

            .kex-title {
                font-family: 'Syne', sans-serif;
                font-size: 17px; font-weight: 800;
                color: #f0f4ff;
                letter-spacing: -0.025em;
                margin-bottom: 10px;
            }

            .kex-msg {
                font-family: 'DM Sans', sans-serif;
                font-size: 14px; color: #8b95b0;
                line-height: 1.65; margin-bottom: 24px;
            }

            .kex-btns { display: flex; gap: 10px; }

            .kex-btn {
                flex: 1; padding: 11px 16px;
                border-radius: 11px;
                font-family: 'DM Sans', sans-serif;
                font-size: 14px; font-weight: 700;
                cursor: pointer; border: none;
                transition: all 0.2s;
            }

            .kex-cancel {
                background: transparent;
                color: #8b95b0;
                border: 1px solid rgba(255,255,255,0.10);
            }
            .kex-cancel:hover {
                background: rgba(255,255,255,0.05);
                color: #f0f4ff;
                border-color: rgba(255,255,255,0.18);
            }

            .kex-confirm {
                background: #2563eb;
                color: #fff;
                box-shadow: 0 4px 14px rgba(37,99,235,0.38);
            }
            .kex-confirm:hover {
                background: #3b74f5;
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(37,99,235,0.5);
            }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.className = 'kex-overlay';
    overlay.innerHTML = `
        <div class="kex-modal">
            <div class="kex-icon">
                <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div class="kex-title">Confirm Action</div>
            <div class="kex-msg">${message}</div>
            <div class="kex-btns">
                <button class="kex-btn kex-cancel" id="kexCancel">Cancel</button>
                <button class="kex-btn kex-confirm" id="kexConfirm">
                    <i class="fa-solid fa-check" style="margin-right:6px; font-size:11px;"></i>Confirm
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    const close = (confirmed) => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.15s ease';
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
            if (confirmed && onConfirm) onConfirm();
            if (!confirmed && onCancel) onCancel();
        }, 150);
    };

    overlay.querySelector('#kexConfirm').addEventListener('click', () => close(true));
    overlay.querySelector('#kexCancel').addEventListener('click',  () => close(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });

    const onEsc = (e) => {
        if (e.key === 'Escape') {
            close(false);
            document.removeEventListener('keydown', onEsc);
        }
    };
    document.addEventListener('keydown', onEsc);
}

/* ─────────────────────────────────────────────
   OVERRIDE NATIVE window.alert / window.confirm
───────────────────────────────────────────── */

/** Replace native alert → info toast */
window.alert = function(message) {
    showInfo(message);
};

/**
 * Replace native confirm → returns Promise<boolean>
 * Works with async/await: const ok = await confirm("Sure?");
 */
window.confirm = function(message) {
    return new Promise((resolve) => {
        showConfirm(message, () => resolve(true), () => resolve(false));
    });
};