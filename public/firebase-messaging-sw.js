// Firebase Messaging Service Worker
// NOTE: Service workers cannot use process.env — values are hardcoded from Firebase config

importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyB4jElJykK5BCXkyfYSusHcw7H4vdaz0-U",
  authDomain: "sheetsync-d4c0a.firebaseapp.com",
  projectId: "sheetsync-d4c0a",
  storageBucket: "sheetsync-d4c0a.firebasestorage.app",
  messagingSenderId: "1078156094571",
  appId: "1:1078156094571:web:330f4380b3e56e95d0952e",
});

const messaging = firebase.messaging();

// Background notifications
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "SheetSync";
  const options = {
    body: payload.notification?.body || "You have a new notification.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.data?.tag || "sheetsync-bg",
    data: { url: payload.data?.url || payload.fcmOptions?.link || "/" },
    vibrate: [100, 50, 100],
  };
  self.registration.showNotification(title, options);
});

// Click handler — open the relevant page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});
