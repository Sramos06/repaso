// Repaso service worker v4: shell duty only. Reviewer content and notes live
// in IndexedDB (see src/lib/sync.ts); the SW just keeps the app's pages and
// static assets openable offline, and serves a cached viewer page as an app
// shell for any /viewer/<id> the network can't reach (the client resolves the
// id from the URL against the local store).
const VERSION = "repaso-sw-v4";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && !response.redirected) (await caches.open(cacheName)).put(request, response.clone());
  return response;
}

async function pageNetworkFirst(request, url) {
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected) (await caches.open(PAGE_CACHE)).put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    if (url.pathname.startsWith("/viewer/")) {
      // Any cached viewer page works as the shell for any id.
      const cache = await caches.open(PAGE_CACHE);
      const entries = await cache.keys();
      const shell = entries.find((r) => new URL(r.url).pathname.startsWith("/viewer/"));
      if (shell) {
        const res = await cache.match(shell, { ignoreVary: true });
        if (res) return res;
      }
    }
    return new Response("<h1>Offline</h1><p>Open Repaso once while online and it works offline after that.</p>", {
      status: 503,
      headers: { "Content-Type": "text/html" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // writes: network only, always
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // data lives in IndexedDB now; auth stays untouched

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(pageNetworkFirst(request, url));
  }
});
