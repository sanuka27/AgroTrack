import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in environment. Set it and re-run.');
  process.exit(2);
}

const plantSchema = new mongoose.Schema({}, { strict: false, collection: 'plants' });
const Plant = mongoose.model('PlantDump', plantSchema);

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 } as any);
  console.log('Connected to MongoDB');

  const total = await Plant.countDocuments();
  const withImage = await Plant.countDocuments({ imageUrl: { $exists: true, $ne: null } });
  const withoutImage = total - withImage;

  console.log(`Total plants: ${total}`);
  console.log(`With imageUrl: ${withImage}`);
  console.log(`Without imageUrl: ${withoutImage}`);

  // Show up to 20 sample image URLs
  const samples = await Plant.find({}).limit(20).select({ _id: 1, name: 1, imageUrl: 1 }).lean();
  console.log('Sample plants (id, name, imageUrl):');
  samples.forEach((p: any) => {
    console.log(JSON.stringify({ id: p._id, name: p.name, imageUrl: p.imageUrl }));
  });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Error running dump:', err);
  process.exit(1);
});
