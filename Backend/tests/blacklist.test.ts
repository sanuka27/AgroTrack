// tests/blacklist.test.ts
import mongoose from 'mongoose';

const BLACKLIST = new Set<string>([
  'communityposts', // old name, replaced by 'posts'
  'communitycomments', // old name, replaced by 'comments'
  'communityvotes', // old name, replaced by 'votes'
  'communityreports', // duplicate, replaced by 'reports'
  'dashboardanalytics', // removed analytics
  'useranalytics', // removed analytics
  'plantcareanalytics', // removed analytics
  'weatherdata', // removed weather features
  'weatherforecasts', // removed weather features
  'notifications', // removed notifications
  'bugreports', // removed bug reports
  'notificationpreferences', // removed preferences
  'exportimportoperations', // removed export/import
  'likes', // replaced by votes
  'systemmetrics', // removed metrics
  'contactmessages', // removed contact
  'chatmessages', // removed chat
  'carelogs', // removed care logs
  'reminders', // removed reminders
]);

test('no model points to blacklisted collections', () => {
  const models = mongoose.modelNames().map(function(n) { return mongoose.model(n); });
  const offenders = [];
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const collection = model.collection;
    if (collection) {
      const coll = collection.collectionName;
      if (coll && BLACKLIST.has(coll)) {
        offenders.push({ name: model.modelName, coll: coll });
      }
    }
  }
  expect(offenders).toEqual([]);
});