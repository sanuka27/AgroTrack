/**
 * Script to check what analytics data exists in the database
 * Checks: plants, carelogs, reminders collections
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Plant } from '../src/models/Plant';
import { CareLog } from '../src/models/CareLog';
import { Reminder } from '../src/models/Reminder';
import { connectDatabase } from '../src/config/database';

// Load environment variables
dotenv.config();

async function checkAnalyticsData() {
  try {
    console.log('🔍 Checking Analytics Data Availability\n');
    console.log('=====================================\n');

    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to MongoDB\n');

    // Check Plants collection
    console.log('📊 Plants Collection:');
    const plantCount = await Plant.countDocuments();
    console.log(`   Total plants: ${plantCount}`);

    if (plantCount > 0) {
      const healthyPlants = await Plant.countDocuments({ health: { $in: ['Excellent', 'Good'] } });
      const needsAttention = await Plant.countDocuments({ health: { $in: ['Needs light', 'Needs water', 'Attention'] } });
      
      console.log(`   Healthy plants: ${healthyPlants}`);
      console.log(`   Needs attention: ${needsAttention}`);
      
      const samplePlant = await Plant.findOne().select('name species health userId');
      if (samplePlant) {
        console.log(`   Sample plant: ${samplePlant.name} (${samplePlant.species}) - Health: ${samplePlant.health}`);
        console.log(`   User ID: ${samplePlant.userId}`);
      }
    } else {
      console.log('   ⚠️ No plants found in database');
    }
    console.log('');

    // Check CareLogs collection
    console.log('📊 CareLogs Collection:');
    const careLogCount = await CareLog.countDocuments();
    console.log(`   Total care logs: ${careLogCount}`);

    if (careLogCount > 0) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const careThisWeek = await CareLog.countDocuments({ date: { $gte: weekAgo } });
      const careThisMonth = await CareLog.countDocuments({ date: { $gte: monthAgo } });
      
      console.log(`   Care logs this week: ${careThisWeek}`);
      console.log(`   Care logs this month: ${careThisMonth}`);
      
      const sampleCareLog = await CareLog.findOne().select('careType date plantId userId');
      if (sampleCareLog) {
        console.log(`   Sample care log: ${sampleCareLog.careType} on ${sampleCareLog.date.toISOString().split('T')[0]}`);
        console.log(`   User ID: ${sampleCareLog.userId}`);
      }
    } else {
      console.log('   ⚠️ No care logs found in database');
    }
    console.log('');

    // Check Reminders collection
    console.log('📊 Reminders Collection:');
    const reminderCount = await Reminder.countDocuments();
    console.log(`   Total reminders: ${reminderCount}`);

    if (reminderCount > 0) {
      const upcomingReminders = await Reminder.countDocuments({
        status: 'pending',
        scheduledDate: { $gte: new Date() }
      });
      const overdueReminders = await Reminder.countDocuments({
        status: 'overdue'
      });
      
      console.log(`   Upcoming reminders: ${upcomingReminders}`);
      console.log(`   Overdue reminders: ${overdueReminders}`);
      
      const sampleReminder = await Reminder.findOne().select('title status scheduledDate userId');
      if (sampleReminder) {
        console.log(`   Sample reminder: ${sampleReminder.title} - Status: ${sampleReminder.status}`);
        console.log(`   Scheduled: ${sampleReminder.scheduledDate.toISOString().split('T')[0]}`);
        console.log(`   User ID: ${sampleReminder.userId}`);
      }
    } else {
      console.log('   ⚠️ No reminders found in database');
    }
    console.log('');

    // List all collections
    console.log('📊 All Collections:');
    const collections = await mongoose.connection.db!.listCollections().toArray();
    console.log(`   Total collections: ${collections.length}`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    console.log('');

    // Summary
    console.log('=====================================');
    console.log('📊 Analytics Data Summary:');
    console.log(`   Plants: ${plantCount}`);
    console.log(`   Care Logs: ${careLogCount}`);
    console.log(`   Reminders: ${reminderCount}`);
    console.log('');

    if (plantCount === 0 && careLogCount === 0 && reminderCount === 0) {
      console.log('⚠️ WARNING: No analytics data found!');
      console.log('   The analytics page will show empty data.');
      console.log('   Consider seeding the database with sample plant data.');
    } else {
      console.log('✅ Analytics data is available');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error checking analytics data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAnalyticsData();
