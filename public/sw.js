// Repaso offline tier (easy mode): network-first everywhere it matters, so
// online behavior is unchanged; the cache only steps in when the network is gone.
// Bump VERSION to invalidate all caches on deploy of a breaking change.
const VERSION = "repaso-sw-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const API_CACHE = `${VERSION}-api`;

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

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected) (await caches.open(cacheName)).put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response(JSON.stringify({ error: "You're offline and this isn't cached yet." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // uploads/saves/deletes: network only
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // fonts etc. load normally
  if (url.pathname.startsWith("/api/auth")) return; // NEVER cache auth

  // hashed build assets + icons: safe to serve cache-first forever
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  // reviewer list + content: fresh when online, cached copy when offline
  if (url.pathname.startsWith("/api/reviewers")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }
  if (url.pathname.startsWith("/api/")) return; // notes GET stays live (draft system covers offline)
  // page navigations (the desk, the viewer shell)
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
  }
});
