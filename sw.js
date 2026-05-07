// ═══════════════════════════════════════════════════════════
// KelasaGaara Service Worker — Full PWA Caching Strategy
// ═══════════════════════════════════════════════════════════
const STATIC_CACHE  = 'kg-static-v2';
const DYNAMIC_CACHE = 'kg-dynamic-v2';
const IMAGE_CACHE   = 'kg-images-v2';
const ALL_CACHES    = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/login.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// ── INSTALL: Pre-cache static shell ─────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: Clean old caches ───────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Route-based caching strategies ───────────────────
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // 1. Google Fonts → Cache First (1 year)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2. Firebase / Firestore API → Network First (3s timeout)
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com')) {
    e.respondWith(networkFirst(request, DYNAMIC_CACHE, 3000));
    return;
  }

  // 3. Images → Stale While Revalidate
  if (request.destination === 'image' ||
      url.pathname.match(/\.(webp|jpg|jpeg|png|svg|gif)$/i)) {
    e.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // 4. Static assets (CSS/JS) → Cache First
  if (url.pathname.match(/\.(css|js|woff|woff2)$/i)) {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 5. HTML pages → Network First with offline fallback
  if (request.destination === 'document' ||
      url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(networkFirstWithOffline(request));
    return;
  }

  // 6. Everything else → Network First
  e.respondWith(networkFirst(request, DYNAMIC_CACHE, 5000));
});

// ── STRATEGIES ────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
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
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName, timeout = 5000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

async function networkFirstWithOffline(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback to offline page
    return caches.match('/offline.html') || new Response('<h1>Offline</h1>', {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || (await fetchPromise) || new Response('', { status: 404 });
}

// ── BACKGROUND SYNC ──────────────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-jobs') {
    e.waitUntil(syncQueuedJobs());
  }
  if (e.tag === 'sync-profiles') {
    e.waitUntil(syncQueuedProfiles());
  }
});

async function syncQueuedJobs() {
  // Read from IndexedDB and submit queued job posts
  // Implementation uses postMessage to client
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: 'SYNC_JOBS' }));
}

async function syncQueuedProfiles() {
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: 'SYNC_PROFILES' }));
}

// ── PUSH NOTIFICATIONS ───────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'KelasaGaara', body: 'You have a new notification', url: '/' };
  try { data = { ...data, ...e.data.json() }; } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag || 'kg-notif',
      data: { url: data.url },
      actions: [
        { action: 'view',    title: '👁️ View' },
        { action: 'dismiss', title: '✕ Dismiss' }
      ],
      vibrate: [100, 50, 100]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(cs => {
      const existing = cs.find(c => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
