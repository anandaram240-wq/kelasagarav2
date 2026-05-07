// ═══════════════════════════════════════════════════════════
// KelasaGaara Service Worker v4 — Ultra-Fast PWA
// Strategy: Cache-first for static, network-first for dynamic
// ═══════════════════════════════════════════════════════════
const CACHE_VERSION = 'v4';
const STATIC_CACHE  = `kg-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `kg-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE   = `kg-images-${CACHE_VERSION}`;
const FONT_CACHE    = `kg-fonts-${CACHE_VERSION}`;
const ALL_CACHES    = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, FONT_CACHE];

// ── Core App Shell — ALL pages pre-cached ───────────────────
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/login.html',
  '/worker-dashboard.html',
  '/hirer-dashboard.html',
  '/setup-profile.html',
  '/find-jobs.html',
  '/book.html',
  '/chat.html',
  '/post-job.html',
  '/account.html',
  '/css/style.css',
  '/js/firebase-config.js',
  '/js/biometric.js',
  '/js/pwa.js',
  '/js/i18n.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/notifications-ui.js',
  '/js/bookings.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── Firebase SDK pre-cache (eliminates CDN cold-start) ───────
const FIREBASE_SDK_ASSETS = [
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js'
];

// ── INSTALL: Pre-cache all app shell assets ──────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      // Cache app shell
      caches.open(STATIC_CACHE).then(cache =>
        cache.addAll(STATIC_ASSETS).catch(err =>
          console.warn('[SW] Some static assets failed to cache:', err)
        )
      ),
      // Cache Firebase SDK files (cross-origin, cache individually)
      caches.open(STATIC_CACHE).then(cache =>
        Promise.all(FIREBASE_SDK_ASSETS.map(url =>
          cache.add(new Request(url, { mode: 'cors' })).catch(() => {})
        ))
      )
    ]).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: Clean old caches immediately ───────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Smart routing strategy ────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // 1. Firebase APIs → Network only (no cache for auth/DB calls)
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com') ||
      url.hostname.includes('firebasedatabase.app')) {
    return; // Let browser handle natively
  }

  // 2. Google Fonts → Cache first (permanent)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirstPermanent(request, FONT_CACHE));
    return;
  }

  // 3. Firebase CDN JS (e.g., gstatic.com firebase SDK) → Cache first
  if (url.hostname === 'www.gstatic.com') {
    e.respondWith(cacheFirstPermanent(request, STATIC_CACHE));
    return;
  }

  // 4. Images → Stale-While-Revalidate (instant + background update)
  if (request.destination === 'image' ||
      url.pathname.match(/\.(webp|jpg|jpeg|png|svg|gif|ico)$/i)) {
    e.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // 5. CSS / JS / Fonts → Cache first (fast)
  if (url.pathname.match(/\.(css|js|woff|woff2|ttf|otf)$/i)) {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 6. HTML pages → Network first with instant cache fallback
  if (request.destination === 'document' ||
      url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(networkFirstWithOffline(request));
    return;
  }

  // 7. Everything else → Network first (short timeout)
  e.respondWith(networkFirst(request, DYNAMIC_CACHE, 4000));
});

// ── STRATEGY: Cache First (serve from cache, update background) ─
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    // Background revalidation
    fetch(request).then(res => {
      if (res && res.ok) {
        caches.open(cacheName).then(c => c.put(request, res));
      }
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// ── STRATEGY: Cache First Permanent (no revalidation for CDN) ─
async function cacheFirstPermanent(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

// ── STRATEGY: Network First with timeout ─────────────────────
async function networkFirst(request, cacheName, timeout = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timer);
    const cached = await caches.match(request);
    return cached || new Response('{}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ── STRATEGY: Network First + Offline page fallback ──────────
async function networkFirstWithOffline(request) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline.html') || new Response('<h1>You\'re Offline</h1>', {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// ── STRATEGY: Stale While Revalidate ─────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || (await fetchPromise) || new Response('', { status: 404 });
}

// ── BACKGROUND SYNC ──────────────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-jobs') e.waitUntil(broadcastSync('SYNC_JOBS'));
  if (e.tag === 'sync-profiles') e.waitUntil(broadcastSync('SYNC_PROFILES'));
  if (e.tag === 'sync-bookings') e.waitUntil(broadcastSync('SYNC_BOOKINGS'));
});

async function broadcastSync(type) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(c => c.postMessage({ type }));
}

// ── PUSH NOTIFICATIONS ───────────────────────────────────────
self.addEventListener('push', e => {
  let data = {
    title: 'KelasaGaara',
    body: 'You have a new notification',
    url: '/',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png'
  };
  try { data = { ...data, ...e.data.json() }; } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag || 'kg-notif',
      data: { url: data.url },
      actions: [
        { action: 'view',    title: '👁️ View' },
        { action: 'dismiss', title: '✕ Dismiss' }
      ],
      vibrate: [100, 50, 100],
      requireInteraction: false
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const existing = cs.find(c => c.url.includes(url) && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// ── MESSAGE: Handle skip-waiting from update banner ──────────
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
