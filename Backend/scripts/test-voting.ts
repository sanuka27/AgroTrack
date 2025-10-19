import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// You'll need to get a real token from your auth endpoint
// For now, this is a placeholder - replace with actual token
const AUTH_TOKEN = 'YOUR_FIREBASE_TOKEN_HERE';

async function testVoting() {
  try {
    console.log('🧪 Testing Community Forum Voting...\n');

    // 1. Get posts first
    console.log('1️⃣ Fetching posts...');
    const postsResponse = await axios.get(`${API_BASE}/community/forum/posts?limit=1`);
    const post = postsResponse.data.data.posts[0];
    
    if (!post) {
      console.log('❌ No posts found to test voting');
      return;
    }

    console.log(`✅ Found post: "${post.title}"`);
    console.log(`   Current score: ${post.score}`);
    console.log(`   Current user vote: ${post.userVote}\n`);

    // 2. Test upvote (requires authentication)
    console.log('2️⃣ Testing upvote...');
    try {
      const upvoteResponse = await axios.post(
        `${API_BASE}/community/forum/posts/${post._id}/vote`,
        { value: 1 },
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(`✅ Upvote successful!`);
      console.log(`   New score: ${upvoteResponse.data.data.voteScore}`);
      console.log(`   User vote: ${upvoteResponse.data.data.userVote}\n`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('⚠️  Need authentication to vote (expected for guest)');
        console.log('   Status: 401 Unauthorized\n');
      } else {
        console.log(`❌ Upvote failed: ${error.response?.data?.message || error.message}\n`);
      }
    }

    // 3. Test downvote
    console.log('3️⃣ Testing downvote...');
    try {
      const downvoteResponse = await axios.post(
        `${API_BASE}/community/forum/posts/${post._id}/vote`,
        { value: -1 },
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(`✅ Downvote successful!`);
      console.log(`   New score: ${downvoteResponse.data.data.voteScore}`);
      console.log(`   User vote: ${downvoteResponse.data.data.userVote}\n`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('⚠️  Need authentication to vote (expected for guest)\n');
      } else {
        console.log(`❌ Downvote failed: ${error.response?.data?.message || error.message}\n`);
      }
    }

    // 4. Test vote toggle (voting same value removes it)
    console.log('4️⃣ Testing vote toggle...');
    try {
      const toggleResponse = await axios.post(
        `${API_BASE}/community/forum/posts/${post._id}/vote`,
        { value: 1 },
        { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
      );
      console.log(`✅ Vote toggle successful!`);
      console.log(`   New score: ${toggleResponse.data.data.voteScore}`);
      console.log(`   User vote: ${toggleResponse.data.data.userVote}\n`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('⚠️  Need authentication to vote (expected for guest)\n');
      } else {
        console.log(`❌ Vote toggle failed: ${error.response?.data?.message || error.message}\n`);
      }
    }

    console.log('✅ Voting test complete!\n');
    console.log('📝 Note: To fully test voting, you need to:');
    console.log('   1. Login via Firebase to get an auth token');
    console.log('   2. Replace AUTH_TOKEN in this script with your real token');
    console.log('   3. Run the test again\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testVoting();
