import mongoose from 'mongoose';
import { config } from 'dotenv';
import { User } from '../models/User';
import { CommunityPost } from '../models/CommunityPost';
import { CommunityComment } from '../models/CommunityComment';
import { CommunityVote } from '../models/CommunityVote';

config();

// Sample data
const sampleUsers = [
  { uid: 'seed-user-1', name: 'Kasun Perera', role: 'admin' },
  { uid: 'seed-user-2', name: 'Nimal Fernando', role: 'mod' },
  { uid: 'seed-user-3', name: 'Sanduni Silva', role: 'user' },
  { uid: 'seed-user-4', name: 'Ruwan Jayasinghe', role: 'user' },
  { uid: 'seed-user-5', name: 'Chamari Wickramasinghe', role: 'user' },
  { uid: 'seed-user-6', name: 'Tharaka Rajapaksa', role: 'user' },
  { uid: 'seed-user-7', name: 'Dilini Gunawardena', role: 'user' },
  { uid: 'seed-user-8', name: 'Mahesh Bandara', role: 'user' },
  { uid: 'seed-user-9', name: 'Nadeesha Kumari', role: 'user' },
  { uid: 'seed-user-10', name: 'Sunil Dissanayake', role: 'user' },
];

const samplePosts = [
  {
    title: 'Best practices for organic pest control?',
    body: 'I\'ve been growing tomatoes for the past 3 years and always struggle with aphids. What are your favorite organic methods for pest control? \n\n#pest-control #organic #tomatoes',
    tags: ['pest-control', 'organic', 'tomatoes'],
  },
  {
    title: 'My hydroponic lettuce setup - 30 days progress',
    body: 'Started my first hydroponic lettuce garden 30 days ago. Here\'s what I\'ve learned so far:\n\n1. pH management is crucial (keep it at 5.5-6.5)\n2. Weekly nutrient changes made a huge difference\n3. LED grow lights work better than fluorescent\n\nAny tips for faster growth? #hydroponics #lettuce #indoor-growing',
    tags: ['hydroponics', 'lettuce', 'indoor-growing'],
  },
  {
    title: 'Help! My cucumber leaves are turning yellow',
    body: 'I noticed my cucumber plants\' lower leaves are turning yellow. They\'re in full sun, getting water daily. Could this be a nutrient deficiency?\n\nDetails:\n- 6 weeks old\n- Growing in raised beds\n- Soil mix: compost + peat moss + perlite\n- No signs of pests\n\n#cucumber #help #yellowing-leaves',
    tags: ['cucumber', 'help', 'yellowing-leaves'],
  },
  {
    title: 'Companion planting guide for beginners',
    body: '**Companion Planting Basics**\n\nAfter years of trial and error, here\'s my go-to companion planting combinations:\n\n**Best Pairs:**\n- Tomatoes + Basil (improved flavor + pest control)\n- Carrots + Onions (deter carrot flies)\n- Corn + Beans + Squash (Three Sisters method)\n- Marigolds + Everything (natural pest deterrent)\n\n**Avoid:**\n- Tomatoes + Potatoes (same disease family)\n- Onions + Beans (stunted growth)\n\nWhat are your favorite combinations? #companion-planting #organic #beginner-tips',
    tags: ['companion-planting', 'organic', 'beginner-tips'],
  },
  {
    title: 'DIY compost bin - Built for under $50',
    body: 'Just finished building a 3-bin compost system using pallets! Total cost: $47\n\n**Materials:**\n- 9 wooden pallets (free from local warehouse)\n- Heavy-duty hinges\n- Wire mesh\n- Wood screws\n\nThe three-bin system lets me:\n1. Add fresh material (Bin 1)\n2. Turn and aerate (Bin 2)\n3. Store finished compost (Bin 3)\n\nTurns kitchen scraps into black gold in 6-8 weeks! #composting #diy #sustainable',
    tags: ['composting', 'diy', 'sustainable'],
  },
  {
    title: 'When to harvest garlic? Signs to look for',
    body: 'Planted garlic last October and it\'s been 8 months. How do I know when it\'s ready to harvest?\n\nI\'ve read to wait until:\n- Lower leaves turn brown\n- 5-6 green leaves remain\n- Stop watering 2 weeks before\n\nIs this accurate? My bulbs still feel small when I checked one. #garlic #harvest-time #help',
    tags: ['garlic', 'harvest-time', 'help'],
  },
  {
    title: 'Successfully grew 200+ lbs of potatoes in grow bags!',
    body: '**My Grow Bag Potato Journey**\n\nSpace-saving method that actually works! Here\'s my complete setup:\n\n**Setup:**\n- 10x 10-gallon fabric grow bags\n- Seed potatoes: Yukon Gold & Russet\n- Soil mix: 60% compost, 30% peat, 10% perlite\n\n**Process:**\n1. Plant 3-4 seed pieces per bag\n2. Hill up with soil as plants grow\n3. Water consistently (never soggy)\n4. Harvest when foliage dies back\n\n**Results:**\n- Total yield: 212 lbs\n- Average: 21 lbs per bag\n- Zero pest issues\n- Easy harvest (just dump the bag!)\n\nBest part? I can move them to follow the sun! #potatoes #grow-bags #success-story',
    tags: ['potatoes', 'grow-bags', 'success-story'],
  },
  {
    title: 'Drip irrigation vs soaker hoses - Which is better?',
    body: 'Planning to upgrade my watering system this season. Currently hand-watering 500 sq ft vegetable garden (not sustainable).\n\nDebating between:\n\n**Drip Irrigation Pros:**\n- Precise water delivery\n- Easy to automate with timer\n- Expandable\n\n**Drip Irrigation Cons:**\n- Higher upfront cost ($200-300)\n- More complex installation\n- Emitters can clog\n\n**Soaker Hoses Pros:**\n- Cheaper ($50-100)\n- Simple to set up\n- Flexible layout\n\n**Soaker Hoses Cons:**\n- Less precise\n- Can waste water\n- Shorter lifespan\n\nWhat do you use? Any brand recommendations? #irrigation #drip-irrigation #soaker-hose',
    tags: ['irrigation', 'drip-irrigation', 'soaker-hose'],
  },
  {
    title: 'Seed starting setup - What worked for me',
    body: 'After many failed attempts, I finally nailed indoor seed starting!\n\n**My Setup ($150 total):**\n- 4ft LED shop lights (6500K)\n- Seed starting trays with humidity domes\n- Heat mat for bottom heat\n- Timer for consistent light cycles\n\n**Key Lessons:**\n1. **Light distance matters** - keep 2-3 inches above seedlings\n2. **Bottom watering prevents damping off**\n3. **Fans create stronger stems** (run 2-3 hrs daily)\n4. **Hardening off is crucial** (gradual outdoor exposure)\n\n**Success Rate:**\n- Before: 40-50%\n- After: 90-95%\n\nTotally worth the investment! #seed-starting #indoor-growing #beginner-tips',
    tags: ['seed-starting', 'indoor-growing', 'beginner-tips'],
  },
  {
    title: 'Why are my pepper plants flowering but no fruit?',
    body: 'My bell pepper plants are healthy, lots of flowers, but flowers keep dropping without forming peppers. \n\n**Current Conditions:**\n- Temperature: 75-85°F daytime\n- Watering: Daily in morning\n- Fertilizer: 5-10-10 every 2 weeks\n- Location: Full sun (8+ hours)\n\nI\'ve read it could be:\n- Too much nitrogen\n- Not enough pollination\n- Temperature stress\n\nWhich is most likely? Should I hand-pollinate? #peppers #flowering #troubleshooting',
    tags: ['peppers', 'flowering', 'troubleshooting'],
  },
];

const sampleComments = [
  'Great tip! I\'ve been doing this for years and it works perfectly.',
  'Thanks for sharing! Going to try this in my garden.',
  'This is exactly what I was looking for. Much appreciated!',
  'Have you tried using neem oil? It worked wonders for me.',
  'I had the same issue last season. The problem was overwatering.',
  'Check the soil pH. Most vegetables prefer 6.0-7.0 range.',
  'Beautiful setup! How much did this cost you in total?',
  'This is a common problem with nitrogen-heavy fertilizers.',
  'Try adding some compost tea. It\'s a game changer!',
  'Make sure you\'re hardening off the seedlings properly.',
  'I use a similar method but with different timing. Works great!',
  'Don\'t forget to mulch! It helps retain moisture.',
  'Have you considered using raised beds? They drain better.',
  'This looks amazing! How long did it take to set up?',
  'I\'ve had success with this technique as well.',
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agrotrack';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing community forum data...');
    await User.deleteMany({ email: /^seed-user-/ });
    await CommunityPost.deleteMany({ authorId: /^seed-user-/ });
    await CommunityComment.deleteMany({ authorId: /^seed-user-/ });
    await CommunityVote.deleteMany({ userId: /^seed-user-/ });

    // Create users
    console.log('👥 Creating users...');
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${users.length} users`);

    // Create posts
    console.log('📝 Creating posts...');
    const posts = [];
    for (let i = 0; i < samplePosts.length; i++) {
      const post = samplePosts[i];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      const createdPost = await CommunityPost.create({
        authorUid: randomUser.uid,
        title: post.title,
        bodyMarkdown: post.body,
        tags: post.tags,
        voteScore: Math.floor(Math.random() * 50) - 10, // -10 to 40
        commentCount: 0,
      });
      
      posts.push(createdPost);
      
      // Add some random delay to vary timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Create additional posts to reach 50
    console.log('📝 Creating additional posts...');
    const additionalPostTitles = [
      'Best mulch for vegetable gardens?',
      'My first successful strawberry harvest!',
      'Dealing with powdery mildew naturally',
      'Container gardening tips for small spaces',
      'When to prune fruit trees?',
      'Vertical gardening ideas needed',
      'Best varieties for hot climates?',
      'My rain garden project - 1 year update',
      'Protecting plants from late frost',
      'Organic fertilizer recommendations?',
      'Starting a pollinator garden',
      'Best cover crops for winter?',
      'My greenhouse build - cost breakdown',
      'Dealing with root aphids',
      'Succession planting guide?',
      'Best tools for a beginner gardener',
      'My herb spiral garden design',
      'Protecting crops from deer and rabbits',
      'Microgreens growing setup',
      'Best time to transplant seedlings?',
      'My square foot garden layout',
      'Dealing with blossom end rot',
      'Best plants for clay soil?',
      'My worm composting journey',
      'Saving seeds - tips and tricks',
      'Best tomato varieties for flavor?',
      'My lasagna garden method results',
      'Natural slug and snail control',
      'Best crops for fall planting?',
      'My aquaponics setup - month 3',
      'Pruning tomatoes - yes or no?',
      'Best groundcover for paths?',
      'My mushroom growing adventure',
      'Dealing with Japanese beetles',
      'Best perennial vegetables?',
      'My food forest design - year 2',
      'Grafting fruit trees - beginner guide',
      'Best shade-tolerant vegetables?',
      'My chicken coop garden integration',
      'Dealing with calcium deficiency',
    ];

    for (const title of additionalPostTitles) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomTags = ['gardening', 'organic', 'vegetables', 'help', 'tips', 'success'];
      const selectedTags = randomTags.sort(() => 0.5 - Math.random()).slice(0, 2);
      
      await CommunityPost.create({
        authorUid: randomUser.uid,
        title: title,
        bodyMarkdown: `This is a sample post about ${title.toLowerCase()}. Share your experiences and tips! #${selectedTags.join(' #')}`,
        tags: selectedTags,
        voteScore: Math.floor(Math.random() * 30),
        commentCount: 0,
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const allPosts = await CommunityPost.find({ authorUid: /^seed-user-/ });
    console.log(`✅ Created ${allPosts.length} total posts`);

    // Create comments
    console.log('💬 Creating comments...');
    let commentCount = 0;
    for (const post of allPosts) {
      const numComments = Math.floor(Math.random() * 5) + 1; // 1-5 comments per post
      
      for (let i = 0; i < numComments; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        
        await CommunityComment.create({
          postId: post._id,
          authorUid: randomUser.uid,
          bodyMarkdown: randomComment,
        });
        
        commentCount++;
      }
      
      // Update comment count on post
      post.commentsCount = numComments;
      await post.save();
    }
    console.log(`✅ Created ${commentCount} comments`);

    // Create votes
    console.log('👍 Creating votes...');
    let voteCount = 0;
    for (const post of allPosts) {
      const numVoters = Math.floor(Math.random() * 20) + 5; // 5-25 votes per post
      const voters = users.sort(() => 0.5 - Math.random()).slice(0, numVoters);
      
      for (const voter of voters) {
        const voteValue = Math.random() > 0.3 ? 1 : -1; // 70% upvote, 30% downvote
        
        try {
          await CommunityVote.create({
            postId: post._id,
            voterUid: voter.uid,
            value: voteValue,
          });
          voteCount++;
        } catch (err) {
          // Skip duplicate votes
        }
      }
      
      // Recalculate vote score
      const votes = await CommunityVote.find({ postId: post._id });
      post.voteScore = votes.reduce((sum, vote) => sum + vote.value, 0);
      await post.save();
    }
    console.log(`✅ Created ${voteCount} votes`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Posts: ${allPosts.length}`);
    console.log(`   Comments: ${commentCount}`);
    console.log(`   Votes: ${voteCount}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the seed script
seedDatabase();
