const CACHE_NAME = "scaletta-v4";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/favicon.ico",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http(s) requests (chrome-extension, etc.)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Skip POST and other non-GET requests (can't be cached)
  if (request.method !== "GET") {
    return;
  }

  // Skip Firebase requests - non devono essere cachate per la sincronizzazione real-time
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("googleapis.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response for caching (only successful same-origin responses)
        if (response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request);
      }),
  );
});

// Push event - gestisce le notifiche push in background
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, badge, data: notificationData } = data;

    const options = {
      body: body || "",
      icon: icon || "/web-app-manifest-192x192.png",
      badge: badge || "/favicon-96x96.png",
      data: notificationData || {},
      vibrate: [200, 100, 200],
      requireInteraction: false,
      tag: notificationData?.projectId || "general",
    };

    event.waitUntil(
      self.registration.showNotification(title || "Scaletta", options),
    );
  } catch (error) {
    console.error("Errore gestione notifica push:", error);
  }
});

// Notification click - gestisce il click sulle notifiche
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Cerca una finestra già aperta con l'app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus().then(() => {
              // Naviga alla URL desiderata se disponibile
              if (urlToOpen !== "/" && "navigate" in client) {
                return client.navigate(urlToOpen);
              }
              return client;
            });
          }
        }
        // Se non c'è una finestra aperta, aprine una nuova
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
