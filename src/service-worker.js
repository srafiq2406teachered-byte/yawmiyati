/* eslint-disable no-restricted-globals */

/**
 * MANDATORY FOR VERCEL/CRA BUILDS:
 * The build tool (Workbox) looks for 'self.__WB_MANIFEST'. 
 * Even if we don't use it for our manual cache, it MUST be referenced.
 */
const _ignore = self.__WB_MANIFEST;

const CACHE_NAME = "yawmiyati-v1";

// Only cache static, unchanging files here.
// Don't hardcode "main.chunk.js" because the name changes every build!
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
];

// Install — cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET and cross-origin requests (like Aladhan API)
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Cache successful responses for future offline use
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match("/index.html");
        }
      });
    })
  );
});
