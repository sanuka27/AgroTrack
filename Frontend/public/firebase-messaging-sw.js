importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBJjkuEhwZIQfnzcZ_GnyJ-1pFJL5DDpuU",
  authDomain: "agrotrack-b980f.firebaseapp.com",
  projectId: "agrotrack-b980f",
  storageBucket: "agrotrack-b980f.appspot.com",
  messagingSenderId: "149605185685",
  appId: "1:149605185685:web:3b528400dae25e24c5c39c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};

  const title = notification.title || 'AgroTrack';
  const body = notification.body || 'You have a notification';
  const image = notification.image || '/images/notification-banner.png';

  const options = {
    body,
    icon: '/icons/notification-icon.svg',
    badge: '/icons/badge-72x72.svg',
    image,
    vibrate: [80, 40, 80],
    requireInteraction: false,
    actions: [
      { action: 'open_app', title: 'Open AgroTrack' },
      { action: 'snooze_1h', title: 'Snooze 1h' }
    ],
    data: {
      url: data?.url || '/reminders',
      raw: data
    }
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});