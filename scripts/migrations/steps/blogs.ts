import { MigrationRunner, BatchResult } from '../runner';
import { mapBlogPost } from '../config/mapping';
import { Blog } from '../../../src/models/new/blogs';

export async function blogsStep(
  runner: MigrationRunner,
  options: { batchSize: number; isDryRun: boolean; resume: boolean }
): Promise<any> {
  // First, fetch lookup data
  const [tags, categories, series] = await Promise.all([
    runner['db'].collection('blogtags').find({}).toArray(),
    runner['db'].collection('blogcategories').find({}).toArray(),
    runner['db'].collection('blogseries').find({}).toArray()
  ]);

  const tagsMap = new Map(tags.map((t: any) => [t._id.toString(), t]));
  const categoriesMap = new Map(categories.map((c: any) => [c._id.toString(), c]));
  const seriesMap = new Map(series.map((s: any) => [s._id.toString(), s]));

  return runner.runStep(
    'blogsStep',
    async (batch: any[], isDryRun: boolean): Promise<BatchResult[]> => {
      const results: BatchResult[] = [];

      for (const post of batch) {
        try {
          const postTags = (post.tags || []).map((tagId: any) => tagsMap.get(tagId.toString()));
          const postCategory = categoriesMap.get(post.categoryId?.toString());
          const postSeries = seriesMap.get(post.seriesId?.toString());

          const mappedPost = await mapBlogPost(
            post,
            postTags.filter(Boolean),
            postCategory ? [postCategory] : [],
            postSeries ? [postSeries] : []
          );

          if (!isDryRun) {
            await Blog.create(mappedPost);
          }

          results.push({ inserted: true });
        } catch (error) {
          console.error(`Failed to process blog post ${post._id}:`, error);
          results.push({ error: true });
        }
      }

      return results;
    },
    {
      sourceCollection: 'blogposts',
      batchSize: options.batchSize,
      isDryRun: options.isDryRun,
      resume: options.resume
    }
  );
}

export default blogsStep;