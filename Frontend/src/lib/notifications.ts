import { getMessagingIfSupported } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import api from './api';

export async function askPermissionAndGetToken() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = await getMessagingIfSupported();
    if (!messaging) return null;

    // Register service worker and wait for it to be ready
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready; // Wait for service worker to be active

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log("FCM Token:", token);
    // Send to backend
    const authToken = localStorage.getItem('agrotrack_token');
    const userId = localStorage.getItem('userId'); // You might need to store userId in localStorage after login

    const requestBody: any = { token };
    if (userId) requestBody.userId = userId;

    // Use central API client so requests go to the configured backend (VITE_API_URL)
    try {
      await api.post('/store-token', requestBody);
    } catch (e) {
      // If central API client fails (network or CORS), fall back to absolute URL
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await fetch(`${API_BASE}/store-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        },
        body: JSON.stringify(requestBody)
      });
    }
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