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
  const notification = payload.notification;
  self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: "/icons/icon-192.png",
  });
});