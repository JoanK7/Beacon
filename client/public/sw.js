/* Beacon service worker: lets peer supporters re-read already loaded training
 * modules and the directory on poor or no connection (proposal §3.4.1).
 *
 * Privacy: only non-sensitive GET responses are cached (modules, quiz-free
 * content, directory, progress). Session notes and reflections are NEVER cached.
 * The API cache is cleared on sign-out.
 */
const VERSION = 'v1';
const STATIC_CACHE = `beacon-static-${VERSION}`;
const PAGE_CACHE = `beacon-pages-${VERSION}`;
const API_CACHE = 'beacon-api';
const OFFLINE_URL = '/offline.html';

const CACHEABLE_API = [/^\/api\/modules(\/|$)/, /^\/api\/providers(\/|$)/, /^\/api\/progress$/, /^\/api\/auth\/me$/];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGE_CACHE, API_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC_CACHE)).put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    if (CACHEABLE_API.some((re) => re.test(url.pathname))) {
      event.respondWith(networkFirst(request, API_CACHE));
    }
    return; // everything else (sessions, reflections, quiz) always hits the network
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, PAGE_CACHE).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error()),
    );
  }
});
