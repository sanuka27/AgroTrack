import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database';
import firebaseService from '../src/config/firebase';
import { Reminder } from '../src/models/Reminder';
import { User } from '../src/models/User';
import { createNotificationNow } from '../src/controllers/notificationController';
import { logger } from '../src/config/logger';

dotenv.config();

async function main() {
  try {
    const ok = await connectDatabase();
    // connectDatabase throws on error; if it returns, we proceed
  } catch (err) {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
  }

  try {
    await firebaseService.initialize();
  } catch (err) {
    // Firebase init may fail if env not set; continue — we can still create in-app notifications
    console.warn('Firebase initialize failed or not configured, continuing without push:', (err as any)?.message || err);
  }

  const now = new Date();
  const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);

  console.log(`Searching for reminders due between ${now.toISOString()} and ${oneHourLater.toISOString()}`);

  const reminders = await Reminder.find({
    completed: false,
    dueAt: { $gte: now, $lte: oneHourLater },
    notificationSent: { $ne: true }
  }).populate('userId').exec() as any[];

  console.log(`Found ${reminders.length} reminders to process`);

  let processed = 0;
  for (const r of reminders) {
    try {
      const reminderId: any = (r as any)._id;
      const userAny: any = (r as any).userId;
      if (!userAny) {
        console.warn('Reminder has no user populated, skipping', reminderId?.toString?.() || reminderId);
        continue;
      }

      const title = `Reminder: ${(r as any).title}`;
      const message = `Due: ${new Date((r as any).dueAt).toLocaleString()}`;

      // Persist in-app notification
  // Determine a userId ObjectId to persist
  const userIdField = userAny._id ? new mongoose.Types.ObjectId(userAny._id) : (r.userId as mongoose.Types.ObjectId);
  await createNotificationNow({ userId: userIdField, type: 'reminder', title, message, data: { reminderId } });

      // Attempt push if token available and firebase initialized
      const token = userAny.fcmToken as string | undefined;
      if (token && firebaseService.isFirebaseAvailable()) {
        try {
          const payload: any = {
            token,
            notification: {
              title,
              body: message,
            },
            data: {
              reminderId: reminderId?.toString?.() || String(reminderId),
              type: 'reminder'
            }
          };
          const resp = await firebaseService.getApp().messaging().send(payload);
          console.log('Push sent for reminder', reminderId?.toString?.() || reminderId, 'resp:', resp);
        } catch (pushErr) {
          console.error('Push send failed for reminder', reminderId?.toString?.() || reminderId, pushErr);
        }
      } else if (!token) {
        console.log('No fcmToken for user; skipping push for reminder', reminderId?.toString?.() || reminderId);
      } else {
        console.log('Firebase not initialized; skipped push for', reminderId?.toString?.() || reminderId);
      }

      // Mark reminder as notified
      await Reminder.findByIdAndUpdate(reminderId, { $set: { notificationSent: true, notifiedAt: new Date() } }).exec();

      processed++;
    } catch (err) {
      console.error('Failed processing reminder', ((r as any)?._id?.toString?.()) || (r as any)?._id, (err as any)?.message || err);
    }
  }

  console.log(`Processing complete. Processed: ${processed}/${reminders.length}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
