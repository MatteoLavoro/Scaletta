// Firebase Cloud Messaging Service Worker + PWA Caching
// Questo file gestisce sia le notifiche push che il caching PWA

importScripts(
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js",
);

// ====================================
// PWA CACHING
// ====================================
const CACHE_NAME = "scaletta-v5";
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
  console.log("[SW] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching app shell");
      return cache.addAll(urlsToCache);
    }),
  );
  // Attiva immediatamente il nuovo service worker
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  // Prendi controllo di tutte le pagine immediatamente
  self.clients.claim();
  console.log("[SW] Activated and claimed clients");
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Skip POST and other non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip Chrome extensions and other non-same-origin requests
  if (url.origin !== location.origin) {
    // But allow Firebase and other CDN resources to be fetched normally
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request);
      }),
  );
});

// ====================================
// FIREBASE CLOUD MESSAGING
// ====================================

importScripts(
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js",
);

// Configurazione Firebase (usa la stessa di config.js)
const firebaseConfig = {
  apiKey: "AIzaSyDDj84S-DO8QOIjKYYtLkSJFv0B16UWiFw",
  authDomain: "scaletta-1.firebaseapp.com",
  projectId: "scaletta-1",
  storageBucket: "scaletta-1.firebasestorage.app",
  messagingSenderId: "766379176366",
  appId: "1:766379176366:web:f193a5ffc5a8921f8f183f",
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);

// Ottieni l'istanza di messaging
const messaging = firebase.messaging();

// Gestisci le notifiche in background
messaging.onBackgroundMessage((payload) => {
  console.log("Notifica ricevuta in background:", payload);

  const notificationTitle = payload.notification?.title || "Scaletta";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/web-app-manifest-192x192.png",
    badge: "/favicon-96x96.png",
    data: payload.data || {},
    vibrate: [200, 100, 200],
    tag: payload.data?.projectId || "general",
    requireInteraction: false,
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions,
  );
});

// Gestisci il click sulla notifica
self.addEventListener("notificationclick", (event) => {
  console.log("Notifica cliccata:", event.notification.data);

  event.notification.close();

  // Apri l'app o porta in primo piano se già aperta
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Se c'è già una finestra aperta, portala in primo piano
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus().then(() => {
              // Naviga all'URL della notifica
              if (urlToOpen && "navigate" in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        // Altrimenti apri una nuova finestra
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Gestisci eventi push diretti (per Android)
self.addEventListener("push", (event) => {
  if (event.data) {
    console.log("Push event ricevuto:", event.data.json());

    const data = event.data.json();
    const notificationTitle =
      data.notification?.title || data.data?.title || "Scaletta";
    const notificationOptions = {
      body: data.notification?.body || data.data?.body || "",
      icon: data.notification?.icon || "/web-app-manifest-192x192.png",
      badge: "/favicon-96x96.png",
      data: data.data || {},
      vibrate: [200, 100, 200],
      tag: data.data?.projectId || "general",
      requireInteraction: false,
    };

    event.waitUntil(
      self.registration.showNotification(
        notificationTitle,
        notificationOptions,
      ),
    );
  }
});
