/* ============================================================
   AGRISYNC OS — NAVIGATION & UI UTILITIES
   Handles: Sidebar, Topbar, Toasts, Modals, Active Nav
   ============================================================ */

// ── TOAST NOTIFICATIONS ────────────────────────────────────
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

export function showToast(message, type = 'default', duration = 3500) {
  const container = getToastContainer();
  const icons = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    info:    'fa-circle-info',
    default: 'fa-bell',
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.default}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// ── MODAL SYSTEM ───────────────────────────────────────────
export function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(() => {
      const first = overlay.querySelector('input, select, textarea, button');
      if (first) first.focus();
    }, 100);
  }
}

export function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
    const overlay = e.target.closest('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});

// ── SIDEBAR TOGGLE ─────────────────────────────────────────
export function initSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const toggle   = document.querySelector('.sidebar-toggle');
  const overlay  = document.querySelector('.sidebar-overlay');

  if (!sidebar) return;

  toggle?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay?.classList.toggle('active');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });

  // Close on nav item click (mobile)
  sidebar.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
        overlay?.classList.remove('active');
      }
    });
  });
}

// ── ACTIVE NAV ITEM ────────────────────────────────────────
export function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    if (href && path.endsWith(href.split('/').pop())) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// ── TOPBAR SCROLL EFFECT ───────────────────────────────────
export function initLandingNav() {
  const nav = document.querySelector('.landing-nav');
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── NOTIFICATION PANEL ─────────────────────────────────────
export function initNotifPanel() {
  const btn   = document.getElementById('notif-btn');
  const panel = document.getElementById('notif-panel');
  if (!btn || !panel) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('open');
    }
  });
}

// ── LOADING HELPERS ────────────────────────────────────────
export function showLoading(containerId, text = 'Loading...') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.position = 'relative';
  const existing = el.querySelector('.loading-overlay');
  if (existing) return;
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="spinner"></div>
    <span class="loading-text">${text}</span>
  `;
  el.appendChild(overlay);
}

export function hideLoading(containerId) {
  const el = document.getElementById(containerId);
  el?.querySelector('.loading-overlay')?.remove();
}

// ── EMPTY STATE HELPER ─────────────────────────────────────
export function renderEmpty(containerId, icon, title, desc, actionHtml = '') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      <p class="empty-desc">${desc}</p>
      ${actionHtml}
    </div>
  `;
}

// ── CONFIRM DIALOG ─────────────────────────────────────────
export function confirmAction(message) {
  return new Promise((resolve) => {
    // Use native confirm for simplicity; can be replaced with custom modal
    resolve(window.confirm(message));
  });
}

// ── FORMAT HELPERS ─────────────────────────────────────────
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── INIT ALL ───────────────────────────────────────────────
export function initDashboardUI() {
  initSidebar();
  setActiveNav();
  initNotifPanel();
}
