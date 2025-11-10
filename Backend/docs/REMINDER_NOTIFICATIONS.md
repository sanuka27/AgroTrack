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
   - Runs the reminder check every 5 minutes for better accuracy
   - Performs daily cleanup at midnight
   - Provides manual trigger capability for testing

3. **Integration** (`src/server.ts`)
   - Automatically starts scheduler on server startup
   - Gracefully stops scheduler on shutdown

### Notification Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Scheduled Job (runs every 5 minutes)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Find reminders due in approximately 1 hour                 │
│  - Not completed                                             │
│  - Between 55 and 65 minutes from now (10-min window)       │
│  - notificationSent is false or null                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  For each reminder:                                          │
│  1. Check user notification preferences                      │
│  2. Send FCM push notification (if user has token)          │
│  3. Create in-app notification                              │
│  4. Mark as notified in database (notificationSent=true)    │
└─────────────────────────────────────────────────────────────┘
```

## Example Scenario

**User creates a reminder:**
- Date: October 22, 2025
- Time: 5:00 PM
- Task: Water the Monstera plant

**System behavior:**
- At **4:00 PM** (or within 5 minutes after), the scheduler job runs
- Finds this reminder (due in approximately 1 hour, within the 55-65 minute window)
- Sends Firebase push notification: "⏰ Reminder in 1 Hour"
- Message: "Water the Monstera for Monstera at 5:00 PM"
- Creates in-app notification for the user
- Marks the reminder as notified in the database to prevent duplicates

## Configuration

### Scheduler Frequency

The reminder check runs every **5 minutes** for better accuracy. You can adjust this in `src/services/scheduler.ts`:

```typescript
// Current: Every 5 minutes (recommended for 1-hour advance notifications)
cron.schedule('*/5 * * * *', ...)

// Options:
// Every 10 minutes: '*/10 * * * *'
// Every 15 minutes: '*/15 * * * *'
// Every 30 minutes: '*/30 * * * *'
// Every hour:       '0 * * * *'
```

**Note:** Running every 5 minutes ensures reminders are caught within a 10-minute window (55-65 minutes before due time), providing accurate 1-hour advance notifications.

### Notification Window

The system checks for reminders due in approximately **1 hour** (between 55-65 minutes from now). This 10-minute window ensures accurate notification timing. You can adjust this in `src/services/reminderNotificationService.ts`:

```typescript
// Current: 1 hour (with 10-minute window)
const fiftyFiveMinutesFromNow = new Date(now.getTime() + 55 * 60 * 1000);
const sixtyFiveMinutesFromNow = new Date(now.getTime() + 65 * 60 * 1000);

// To change to 30 minutes before:
const twentyFiveMinutesFromNow = new Date(now.getTime() + 25 * 60 * 1000);
const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60 * 1000);

// To change to 2 hours before:
const oneHundredFifteenMinutesFromNow = new Date(now.getTime() + 115 * 60 * 1000);
const oneHundredTwentyFiveMinutesFromNow = new Date(now.getTime() + 125 * 60 * 1000);
```

**Important:** The system uses the `notificationSent` field in the database to prevent duplicate notifications, ensuring each reminder is notified only once.

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

2. **Wait for the next scheduled check (max 5 minutes)**
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

The service prevents duplicate notifications using two mechanisms:

1. **Database tracking:** The `notificationSent` field in the Reminder model is set to `true` when a notification is sent, preventing the same reminder from being notified again even after server restarts.

2. **In-memory cache:** As a backup, the service also tracks notified reminders in memory. This cache is cleared daily at midnight automatically.

This dual-layer approach ensures reliable duplicate prevention across server restarts and deployments.

## Future Enhancements

Potential improvements:

1. ✅ **Persistent notification tracking** - ~~Store notified reminders in database~~ (IMPLEMENTED)
2. **Customizable notification timing** - Let users choose when to receive notifications (15min, 30min, 1hr, etc.)
3. **Multiple notifications** - Send reminders at different intervals (1 day before, 1 hour before, etc.)
4. **SMS/Email notifications** - In addition to push notifications
5. **Smart scheduling** - AI-powered optimal notification times based on user behavior
6. **Notification templates** - Customizable message templates
7. **Snooze functionality** - Allow users to snooze notifications
8. **Notification analytics** - Track delivery rates, open rates, and user engagement

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
