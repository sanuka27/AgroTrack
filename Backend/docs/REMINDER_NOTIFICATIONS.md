# Reminder Notification System

## Overview

The AgroTrack reminder notification system automatically sends push notifications to users 1 hour before their scheduled reminders are due. This helps users stay on top of their plant care tasks.

## How It Works

### Architecture

1. **ReminderNotificationService** (`src/services/reminderNotificationService.ts`)
   - Finds reminders due in the next 1 hour
   - Sends Firebase Cloud Messaging (FCM) push notifications
   - Creates in-app notifications
   - Tracks already-notified reminders to prevent duplicates

2. **Scheduler** (`src/services/scheduler.ts`)
   - Runs the reminder check every 15 minutes
   - Performs daily cleanup at midnight
   - Provides manual trigger capability for testing

3. **Integration** (`src/server.ts`)
   - Automatically starts scheduler on server startup
   - Gracefully stops scheduler on shutdown

### Notification Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Scheduled Job (runs every 15 minutes)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Find reminders due in next 1 hour                          │
│  - Not completed                                             │
│  - Between 5 and 65 minutes from now                        │
│  - Not already notified                                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  For each reminder:                                          │
│  1. Check user notification preferences                      │
│  2. Send FCM push notification (if user has token)          │
│  3. Create in-app notification                              │
│  4. Mark as notified                                         │
└─────────────────────────────────────────────────────────────┘
```

## Example Scenario

**User creates a reminder:**
- Date: October 22, 2025
- Time: 5:00 PM
- Task: Water the Monstera plant

**System behavior:**
- At **4:00 PM** (or within 15 minutes after), the scheduler job runs
- Finds this reminder (due in ~1 hour)
- Sends push notification: "⏰ Reminder in 1 Hour"
- Message: "Water the Monstera for Monstera at 5:00 PM"
- Creates in-app notification for the user

## Configuration

### Scheduler Frequency

The reminder check runs every **15 minutes**. You can adjust this in `src/services/scheduler.ts`:

```typescript
// Current: Every 15 minutes
cron.schedule('*/15 * * * *', ...)

// Options:
// Every 5 minutes:  '*/5 * * * *'
// Every 30 minutes: '*/30 * * * *'
// Every hour:       '0 * * * *'
```

### Notification Window

The system checks for reminders due in the next **1 hour**. You can adjust this in `src/services/reminderNotificationService.ts`:

```typescript
// Current: 1 hour
const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

// To change to 30 minutes:
const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

// To change to 2 hours:
const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
```

## Testing

### Manual Trigger (Development Mode)

You can manually trigger the reminder notification check:

```bash
POST http://localhost:5000/api/dev/test-reminder-notification
Authorization: Bearer <your-token>
```

Response:
```json
{
  "success": true,
  "message": "Reminder notification check triggered"
}
```

### Testing with Real Data

1. **Create a test reminder:**
```bash
POST http://localhost:5000/api/reminders
Content-Type: application/json
Authorization: Bearer <your-token>

{
  "title": "Water the plant",
  "dueAt": "2025-10-22T17:00:00.000Z",  # 1 hour from now
  "plantId": "<your-plant-id>",
  "notes": "Don't forget!"
}
```

2. **Wait for the next scheduled check (max 15 minutes)**
   - Or use the manual trigger endpoint above

3. **Check your device for the push notification**

4. **Verify in-app notification:**
```bash
GET http://localhost:5000/api/notifications?status=unread
Authorization: Bearer <your-token>
```

## Requirements

### User Setup

Users must have:
1. **FCM Token registered** - Set via the `/api/store-token` endpoint
2. **Push notifications enabled** - Check `user.preferences.notifications.push`

### System Requirements

1. **Firebase Admin SDK** initialized
2. **MongoDB** connected
3. **node-cron** package installed

## Notification Format

### Push Notification
```json
{
  "notification": {
    "title": "⏰ Reminder in 1 Hour",
    "body": "Water the plant for Monstera at 5:00 PM"
  },
  "data": {
    "reminderId": "507f1f77bcf86cd799439011",
    "type": "reminder",
    "dueAt": "2025-10-22T17:00:00.000Z",
    "plantId": "507f1f77bcf86cd799439012"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "reminders",
      "sound": "default"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1
      }
    }
  }
}
```

### In-App Notification
```json
{
  "userId": "507f1f77bcf86cd799439010",
  "type": "reminder",
  "title": "⏰ Reminder in 1 Hour",
  "message": "Water the plant for Monstera at 5:00 PM",
  "data": {
    "reminderId": "507f1f77bcf86cd799439011",
    "plantId": "507f1f77bcf86cd799439012"
  },
  "isRead": false
}
```

## Monitoring

### Logs

The system logs important events:

```
🔔 Checking for upcoming reminders...
Found 3 upcoming reminder(s) to notify
Push notification sent successfully: projects/.../messages/...
In-app notification created for reminder 507f1f77bcf86cd799439011
✅ Reminder notification check completed
```

### Scheduler Status

Check scheduler status programmatically:

```typescript
import { Scheduler } from './services/scheduler';

const status = Scheduler.getStatus();
console.log(status); // { totalTasks: 2, runningTasks: 2 }
```

## Troubleshooting

### Notifications not being sent

1. **Check if scheduler is running:**
   - Look for "Scheduler started successfully" in logs
   - Verify MongoDB is connected (scheduler requires DB)

2. **Verify user has FCM token:**
```javascript
const user = await User.findById(userId);
console.log('FCM Token:', user.fcmToken);
```

3. **Check user notification preferences:**
```javascript
const user = await User.findById(userId);
console.log('Push enabled:', user.preferences?.notifications?.push);
```

4. **Check Firebase Admin initialization:**
   - Look for "Firebase Admin initialized" in logs

5. **Manually trigger check:**
   - Use the dev endpoint to test immediately

### Duplicate notifications

The service tracks notified reminders in memory. If the server restarts, this cache is cleared. To prevent duplicates after restart:

- The service includes a 5-minute buffer to avoid re-notifying recently sent reminders
- The cache is cleared daily at midnight automatically

## Future Enhancements

Potential improvements:

1. **Persistent notification tracking** - Store notified reminders in database
2. **Customizable notification timing** - Let users choose when to receive notifications (15min, 30min, 1hr, etc.)
3. **Multiple notifications** - Send reminders at different intervals (1 day before, 1 hour before, etc.)
4. **SMS/Email notifications** - In addition to push notifications
5. **Smart scheduling** - AI-powered optimal notification times based on user behavior
6. **Notification templates** - Customizable message templates
7. **Snooze functionality** - Allow users to snooze notifications

## API Integration

### Frontend Integration Example

```typescript
// Store FCM token when user logs in
const storeFCMToken = async (token: string, userId: string) => {
  await fetch('http://localhost:5000/api/store-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, userId })
  });
};

// Handle incoming push notifications
messaging.onMessage((payload) => {
  console.log('Notification received:', payload);
  
  if (payload.data?.type === 'reminder') {
    // Show notification to user
    showNotification(payload.notification.title, payload.notification.body);
    
    // Navigate to reminder details
    if (payload.data.reminderId) {
      navigateToReminder(payload.data.reminderId);
    }
  }
});
```

## Security Considerations

1. **FCM Token Security**
   - Tokens are stored securely in user documents
   - Only the user can update their own token

2. **Notification Privacy**
   - Users receive only their own reminder notifications
   - Notification data is filtered by userId

3. **Rate Limiting**
   - Scheduler runs at fixed intervals to prevent spam
   - Each reminder is notified only once

## Performance

- **Efficient queries**: Uses indexed fields (completed, dueAt, userId)
- **Batch processing**: Processes multiple reminders in a single job run
- **Memory management**: Auto-cleanup of notification cache
- **Non-blocking**: Runs in background without blocking API requests

## License

Part of the AgroTrack project.
