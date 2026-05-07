// ═══════════════════════════════════════════════════════════
// KelasaGaara — PWA Module
// Install Banner + Bottom Nav + Service Worker Registration
// ═══════════════════════════════════════════════════════════

// ── SERVICE WORKER REGISTRATION ─────────────────────────────
export async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner();
        }
      });
    });
    console.log('[PWA] Service worker registered');
    return reg;
  } catch(e) {
    console.warn('[PWA] SW registration failed:', e);
  }
}

function showUpdateBanner() {
  const banner = document.createElement('div');
  banner.innerHTML = `<div style="position:fixed;bottom:80px;left:16px;right:16px;background:#1a1a1a;color:#fff;border-radius:14px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;z-index:9998;box-shadow:0 8px 32px rgba(0,0,0,.3);font-family:inherit">
    <span style="font-size:.88rem">🆕 New version available!</span>
    <button onclick="window.location.reload()" style="background:#E25519;color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:.8rem;font-weight:700;cursor:pointer">Update</button>
  </div>`;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 8000);
}

// ── INSTALL BANNER ───────────────────────────────────────────
let deferredPrompt = null;
let installBannerShown = false;

export function initInstallBanner() {
  // Already installed or dismissed?
  if (localStorage.getItem('kg_install_dismissed')) return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    scheduleInstallBanner();
  });

  // iOS Safari detection
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isInStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
  if (isIOS && !isInStandalone && !localStorage.getItem('kg_install_dismissed')) {
    setTimeout(() => showIOSBanner(), 8000);
  }
}

function scheduleInstallBanner() {
  // Show after 20 seconds of browsing
  setTimeout(() => {
    if (!installBannerShown && deferredPrompt) showInstallBanner();
  }, 20000);
}

function showInstallBanner() {
  if (installBannerShown) return;
  installBannerShown = true;

  const banner = document.createElement('div');
  banner.id = 'kg-install-banner';
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;flex:1">
      <img src="/icons/icon-72.png" width="44" height="44" style="border-radius:12px" alt="">
      <div>
        <div style="font-weight:800;font-size:.92rem;color:#1a1a1a">📲 Install KelasaGaara App</div>
        <div style="font-size:.75rem;color:#666;margin-top:2px">Works offline · Faster · Feels native</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-shrink:0">
      <button id="kg-install-btn" style="background:linear-gradient(135deg,#E25519,#D4450A);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:.82rem;font-weight:700;cursor:pointer;font-family:inherit">✅ Install</button>
      <button id="kg-install-skip" style="background:#f5f5f5;color:#666;border:none;border-radius:10px;padding:8px 12px;font-size:.82rem;cursor:pointer;font-family:inherit">Later</button>
    </div>`;

  Object.assign(banner.style, {
    position: 'fixed', bottom: '72px', left: '12px', right: '12px',
    background: '#fff', borderRadius: '16px', padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,.15)', zIndex: '9997',
    border: '1px solid rgba(0,0,0,.08)',
    transform: 'translateY(120px)', transition: 'transform .35s cubic-bezier(.32,.72,0,1)',
    fontFamily: 'inherit'
  });

  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.style.transform = 'translateY(0)');

  document.getElementById('kg-install-btn').onclick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') {
      banner.style.transform = 'translateY(120px)';
      setTimeout(() => banner.remove(), 400);
    }
  };

  document.getElementById('kg-install-skip').onclick = () => {
    localStorage.setItem('kg_install_dismissed', '1');
    banner.style.transform = 'translateY(120px)';
    setTimeout(() => banner.remove(), 400);
  };
}

function showIOSBanner() {
  if (installBannerShown) return;
  installBannerShown = true;

  const banner = document.createElement('div');
  banner.innerHTML = `
    <div style="text-align:center">
      <div style="font-weight:800;font-size:.95rem;margin-bottom:8px">📲 Install KelasaGaara on iPhone</div>
      <div style="font-size:.82rem;color:#555;line-height:1.6">
        Tap <strong>Share</strong> <span style="font-size:1.1rem">⬆️</span> at the bottom, then<br>
        <strong>"Add to Home Screen"</strong> for app experience
      </div>
      <button onclick="this.closest('#kg-ios-banner').remove();localStorage.setItem('kg_install_dismissed','1')" 
        style="margin-top:14px;background:#E25519;color:#fff;border:none;border-radius:10px;padding:8px 20px;font-size:.82rem;font-weight:700;cursor:pointer;font-family:inherit">Got it ✓</button>
    </div>`;
  banner.id = 'kg-ios-banner';
  Object.assign(banner.style, {
    position: 'fixed', bottom: '80px', left: '16px', right: '16px',
    background: '#fff', borderRadius: '18px', padding: '20px',
    boxShadow: '0 8px 40px rgba(0,0,0,.18)', zIndex: '9997',
    border: '2px solid #FFE0D0',
    transform: 'translateY(120px)', transition: 'transform .35s ease',
    fontFamily: 'inherit'
  });
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.style.transform = 'translateY(0)');
}

// ── BOTTOM NAVIGATION BAR ────────────────────────────────────
export function initBottomNav(activePage = 'home') {
  if (window.innerWidth > 768) return; // Desktop: skip

  const pages = {
    home:    { href: 'index.html',            icon: '🏠', label: 'Home' },
    jobs:    { href: 'find-jobs.html',         icon: '💼', label: 'Jobs' },
    workers: { href: 'index.html',             icon: '👷', label: 'Workers' },
    profile: { href: 'hirer-dashboard.html',   icon: '👤', label: 'Profile' }
  };

  const nav = document.createElement('nav');
  nav.id = 'bottom-nav';
  nav.innerHTML = Object.entries(pages).map(([key, p]) => `
    <a href="${p.href}" class="bn-tab ${key === activePage ? 'active' : ''}" data-tab="${key}">
      <span class="bn-icon">${p.icon}</span>
      <span class="bn-label">${p.label}</span>
    </a>`).join('');

  const style = document.createElement('style');
  style.textContent = `
    #bottom-nav {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 990;
      background: #fff; border-top: 1px solid rgba(0,0,0,.08);
      display: flex; height: 62px; padding-bottom: env(safe-area-inset-bottom);
      box-shadow: 0 -2px 16px rgba(0,0,0,.06);
      transition: transform .3s cubic-bezier(.32,.72,0,1);
    }
    #bottom-nav.hide { transform: translateY(100%); }
    .bn-tab {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 2px; text-decoration: none;
      color: #9ca3af; transition: color .2s; position: relative;
      -webkit-tap-highlight-color: transparent;
    }
    .bn-tab.active { color: #E25519; }
    .bn-tab.active::after {
      content: ''; position: absolute; bottom: 0; left: 50%;
      transform: translateX(-50%); width: 24px; height: 3px;
      background: #E25519; border-radius: 2px 2px 0 0;
    }
    .bn-icon { font-size: 1.3rem; transition: transform .2s; }
    .bn-tab.active .bn-icon { transform: scale(1.15); }
    .bn-label { font-size: .65rem; font-weight: 600; line-height: 1; }
    body { padding-bottom: 70px; }
    @media (min-width: 769px) { #bottom-nav { display: none; } body { padding-bottom: 0; } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(nav);

  // Hide on scroll down, show on scroll up
  let lastY = 0, ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y > lastY + 10) nav.classList.add('hide');
      else if (y < lastY - 10) nav.classList.remove('hide');
      lastY = y;
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
}

// ── HAPTIC FEEDBACK ──────────────────────────────────────────
export function haptic(type = 'tap') {
  if (!navigator.vibrate) return;
  if (type === 'tap')     navigator.vibrate(8);
  if (type === 'success') navigator.vibrate([8, 40, 8]);
  if (type === 'error')   navigator.vibrate(100);
}

// ── APP BADGE ─────────────────────────────────────────────────
export function setBadge(count) {
  if ('setAppBadge' in navigator) {
    if (count > 0) navigator.setAppBadge(count);
    else navigator.clearAppBadge();
  }
}

// ── SKELETON LOADER ──────────────────────────────────────────
export function showSkeletons(containerId, count = 6) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array(count).fill(`
    <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,.06)">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
        <div class="skeleton" style="width:52px;height:52px;border-radius:50%"></div>
        <div style="flex:1">
          <div class="skeleton" style="height:14px;width:70%;border-radius:6px;margin-bottom:8px"></div>
          <div class="skeleton" style="height:11px;width:50%;border-radius:6px"></div>
        </div>
      </div>
      <div class="skeleton" style="height:11px;width:100%;border-radius:6px;margin-bottom:6px"></div>
      <div class="skeleton" style="height:11px;width:75%;border-radius:6px;margin-bottom:16px"></div>
      <div style="display:flex;gap:8px">
        <div class="skeleton" style="height:36px;flex:1;border-radius:10px"></div>
        <div class="skeleton" style="height:36px;flex:1;border-radius:10px"></div>
      </div>
    </div>`).join('');

  if (!document.getElementById('skeleton-style')) {
    const s = document.createElement('style');
    s.id = 'skeleton-style';
    s.textContent = `
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
      @keyframes shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position:  200% 0; }
      }`;
    document.head.appendChild(s);
  }
}

// ── PRECONNECT HINTS ─────────────────────────────────────────
export function addPreconnect() {
  const origins = [
    'https://firestore.googleapis.com',
    'https://firebase.googleapis.com',
    'https://storage.googleapis.com',
    'https://identitytoolkit.googleapis.com'
  ];
  origins.forEach(href => {
    const l = document.createElement('link');
    l.rel = 'preconnect'; l.href = href;
    document.head.appendChild(l);
  });
}
