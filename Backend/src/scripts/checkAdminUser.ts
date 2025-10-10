// Script to check user role and create admin user if needed
import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

async function checkAndFixAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    // Find the user by email
    const email = 'sanukanirmalamadhuwantha@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found:', email);
      console.log('Available users:');
      const users = await User.find({}).select('email role name').limit(10);
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.role})`);
      });
    } else {
      console.log('\n📋 User found:');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);

      if (user.role !== 'admin') {
        console.log('\n🔧 Updating user role to admin...');
        user.role = 'admin';
        user.isActive = true;
        await user.save();
        console.log('✅ User role updated to admin!');
      } else {
        console.log('\n✅ User already has admin role');
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAndFixAdminUser();
