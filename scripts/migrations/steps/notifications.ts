import { MigrationRunner, BatchResult } from '../runner';
import { mapNotification } from '../config/mapping';
import { Notification } from '../../../src/models/new/notifications';

export async function notificationsStep(
  runner: MigrationRunner,
  options: { batchSize: number; isDryRun: boolean; resume: boolean }
): Promise<any> {
  // First, build preferences map
  const preferences = await runner['db'].collection('notificationpreferences').find({}).toArray();
  const preferencesMap = new Map();
  preferences.forEach((pref: any) => {
    preferencesMap.set(pref.userId.toString(), pref);
  });

  return runner.runStep(
    'notificationsStep',
    async (batch: any[], isDryRun: boolean): Promise<BatchResult[]> => {
      const results: BatchResult[] = [];

      for (const notification of batch) {
        try {
          const userPrefs = preferencesMap.get(notification.userId?.toString());
          const mappedNotification = await mapNotification(notification, userPrefs);

          if (!isDryRun) {
            await Notification.create(mappedNotification);
          }

          results.push({ inserted: true });
        } catch (error) {
          console.error(`Failed to process notification ${notification._id}:`, error);
          results.push({ error: true });
        }
      }

      return results;
    },
    {
      sourceCollection: 'notifications',
      batchSize: options.batchSize,
      isDryRun: options.isDryRun,
      resume: options.resume
    }
  );
}

export default notificationsStep;