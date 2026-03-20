/* eslint-disable no-restricted-globals */

// 1. FIX: Injected manifest variable required by Workbox
// eslint-disable-next-line no-unused-vars
const manifest = self.__WB_MANIFEST;

const CACHE_NAME = "yawm-v2.1"; // Updated version to trigger a browser refresh

// 2. Combine manual routes with auto-generated build files
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
      tag: data.tag || "yawm-reminder",
      data: { url: data.url || "/" },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        if (windowClients[i].url === "/" && "focus" in windowClients[i]) {
          return windowClients[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});

// ── Scheduled local notifications via setTimeout ──────────────────────────────
self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SCHEDULE_NOTIFICATIONS") {
    const prayers = event.data.prayers || [];
    prayers.forEach(function(p) {
      const delay = p.time - Date.now();
      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        setTimeout(function() {
          self.registration.showNotification("يَوْم · " + p.name + " Time", {
            body: p.body,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: "yawm-" + p.id,
            vibrate: [100, 50, 100],
          });
        }, delay);
      }
    });
  }
});
