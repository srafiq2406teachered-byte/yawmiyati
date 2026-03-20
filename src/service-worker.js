/* eslint-disable no-restricted-globals */

// 1. FIX: Add the manifest hook so the build doesn't fail.
// This variable is injected by the build tool (Workbox) at compile time.
// eslint-disable-next-line no-unused-vars
const manifest = self.__WB_MANIFEST;

const CACHE_NAME = "yawm-v2";

// 2. IMPROVEMENT: Combine your manual routes with the auto-generated build files.
// This ensures that files like 'main.a1b2c3.js' are cached correctly.
const buildAssets = (self.__WB_MANIFEST || []).map(entry => entry.url);
const manualAssets = ["/", "/index.html", "/manifest.json"];
const ASSETS = [...new Set([...manualAssets, ...buildAssets])];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) { 
      return cache.addAll(ASSETS); 
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(key) { return key !== CACHE_NAME; })
          .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { 
            cache.put(event.request, clone); 
          });
        }
        return response;
      });
    }).catch(function() { 
      return caches.match("/index.html"); 
    })
  );
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", function(event) {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "يَوْم · Yawm", {
      body: data.body || "Time for your daily deeds",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "yawm-reminder
