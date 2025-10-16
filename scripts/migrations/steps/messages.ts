import { MigrationRunner, BatchResult } from '../runner';
import { mapContactMessage } from '../config/mapping';
import { Message } from '../../../src/models/new/messages';

export async function messagesStep(
  runner: MigrationRunner,
  options: { batchSize: number; isDryRun: boolean; resume: boolean }
): Promise<any> {
  return runner.runStep(
    'messagesStep',
    async (batch: any[], isDryRun: boolean): Promise<BatchResult[]> => {
      const results: BatchResult[] = [];

      for (const message of batch) {
        try {
          const mappedMessage = mapContactMessage(message);

          if (!isDryRun) {
            await Message.create(mappedMessage);
          }

          results.push({ inserted: true });
        } catch (error) {
          console.error(`Failed to process message ${message._id}:`, error);
          results.push({ error: true });
        }
      }

      return results;
    },
    {
      sourceCollection: 'contactmessages',
      batchSize: options.batchSize,
      isDryRun: options.isDryRun,
      resume: options.resume
    }
  );
}

export default messagesStep;