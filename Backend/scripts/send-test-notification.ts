import admin from 'firebase-admin';
import path from 'path';

const serviceAccountPath = path.resolve(__dirname, '../serviceAccount.json');

import fs from 'fs';

try {
  const raw = fs.readFileSync(serviceAccountPath, 'utf-8');
  const serviceAccount = JSON.parse(raw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (err) {
  console.error('Failed to load serviceAccount.json from', serviceAccountPath, err);
  process.exit(2);
}

async function run() {
  const token = process.argv[2];
  const title = process.argv[3] || 'Test Notification';
  const body = process.argv[4] || 'This is a test from AgroTrack backend';

  if (!token) {
    console.error('Usage: ts-node scripts/send-test-notification.ts <device-token> [title] [body]');
    process.exit(2);
  }

  const message: admin.messaging.Message = {
    token,
    notification: { title, body },
    data: { url: '/reminders' },
  };

  try {
    const res = await admin.messaging().send(message);
    console.log('Message sent:', res);
    process.exit(0);
  } catch (err) {
    console.error('Failed to send message:', err);
    process.exit(1);
  }
}

run();
