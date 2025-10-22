import { getMessagingIfSupported } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";

export async function askPermissionAndGetToken() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  console.log("FCM Token:", token);
  return token;
}

export async function listenForMessages() {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    alert(`📢 ${payload.notification.title}\n${payload.notification.body}`);
  });
}