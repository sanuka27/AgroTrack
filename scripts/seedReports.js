#!/usr/bin/env node
/*
  Seed script for Community Reports (for Admin UI testing)
  Usage:
    MONGO_URI="mongodb://localhost:27017/agrotrack" node scripts/seedReports.js
  If MONGO_URI is not set, defaults to mongodb://localhost:27017/agrotrack
*/
const mongoose = require('mongoose');

(async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/agrotrack';
  console.log('Connecting to', uri);
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;

    const usersCol = db.collection('communityusers');
    const reportsCol = db.collection('communityreports');

    // Ensure a reporter user exists (upsert)
    const reporterUid = 'seed_user_1';
    await usersCol.updateOne(
      { uid: reporterUid },
      { $set: { uid: reporterUid, name: 'Seed Reporter', createdAt: new Date(), updatedAt: new Date() } },
      { upsert: true }
    );

    // Insert sample reports
    const now = new Date();
    const sampleReports = [
      {
        reporterUid,
        targetType: 'post',
        targetId: new mongoose.Types.ObjectId(),
        reason: 'spam',
        description: 'Seed: this post is spam and should be reviewed',
        status: 'pending',
        createdAt: now,
        updatedAt: now
      },
      {
        reporterUid,
        targetType: 'comment',
        targetId: new mongoose.Types.ObjectId(),
        reason: 'harassment',
        description: 'Seed: comment contains harassment',
        status: 'reviewed',
        reviewedBy: 'admin_seed',
        reviewedAt: new Date(now.getTime() - 1000 * 60 * 60),
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
        updatedAt: now
      },
      {
        reporterUid,
        targetType: 'post',
        targetId: new mongoose.Types.ObjectId(),
        reason: 'inappropriate-content',
        description: 'Seed: inappropriate content',
        status: 'dismissed',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
        updatedAt: now
      }
    ];

    const insertRes = await reportsCol.insertMany(sampleReports);
    console.log(`Inserted ${insertRes.insertedCount} sample reports into communityreports`);

    await mongoose.disconnect();
    console.log('Done. Refresh the Admin → Reports page to see seeded reports.');
  } catch (err) {
    console.error('Failed to seed reports:', err.message || err);
    process.exitCode = 1;
    try { await mongoose.disconnect(); } catch (e) {}
  }
})();
