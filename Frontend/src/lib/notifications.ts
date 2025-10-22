import { getMessagingIfSupported } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";

export async function askPermissionAndGetToken() {
  try {
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
    // Send to backend
    const authToken = localStorage.getItem('token');
    await fetch('/api/store-token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      },
      body: JSON.stringify({ token })
    });
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export async function listenForMessages() {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    alert(`📢 ${payload.notification.title}\n${payload.notification.body}`);
  });
}