import { MigrationRunner, BatchResult } from '../runner';
import { mapCareLog, mapPlantAnalytics, mapReminder } from '../config/mapping';
import { PlantLog } from '../../../src/models/new/plant_logs';

export async function plantLogsStep(
  runner: MigrationRunner,
  options: { batchSize: number; isDryRun: boolean; resume: boolean }
): Promise<any> {
  const sources = [
    { collection: 'carelogs', mapper: mapCareLog },
    { collection: 'plantcareanalytics', mapper: mapPlantAnalytics },
    { collection: 'reminders', mapper: mapReminder }
  ];

  let totalSource = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalDuration = 0;

  for (const { collection, mapper } of sources) {
    const result = await runner.runStep(
      `plantLogsStep_${collection}`,
      async (batch: any[], isDryRun: boolean): Promise<BatchResult[]> => {
        const results: BatchResult[] = [];

        for (const doc of batch) {
          try {
            const mappedDoc = mapper(doc);

            if (!isDryRun) {
              await PlantLog.create(mappedDoc);
            }

            results.push({ inserted: true });
          } catch (error) {
            console.error(`Failed to process ${collection} doc ${doc._id}:`, error);
            results.push({ error: true });
          }
        }

        return results;
      },
      {
        sourceCollection: collection,
        batchSize: options.batchSize,
        isDryRun: options.isDryRun,
        resume: options.resume
      }
    );

    totalSource += result.sourceCount;
    totalInserted += result.insertedCount;
    totalSkipped += result.skippedDuplicates;
    totalErrors += result.errors;
    totalDuration += result.duration;
  }

  return {
    step: 'plantLogsStep',
    sourceCount: totalSource,
    insertedCount: totalInserted,
    skippedDuplicates: totalSkipped,
    errors: totalErrors,
    duration: totalDuration,
    status: totalErrors > 0 ? 'failed' : 'success'
  };
}

export default plantLogsStep;