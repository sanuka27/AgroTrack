# Backend Scripts

This folder contains utility scripts for database maintenance and testing.

## 🧹 Database Cleanup (IMPORTANT!)

### `database-cleanup-master.ts` ⭐ **PERMANENT - DO NOT DELETE**

**Purpose:** Master cleanup script to remove unwanted, empty, and deleted collections

**Run with:** `npm run db:cleanup`

**What it does:**
- Removes all `*_deleted` collections
- Removes empty collections (comments, communityreports, etc.)
- Keeps your 5 core collections: users, plants, posts, votes, reports
- Keeps backup collections for safety
- Shows detailed analysis and final state

**Run this anytime your database gets cluttered!**

```bash
cd Backend
npm run db:cleanup
```

This script is safe to run repeatedly - it will never delete your important data.

---

## Available Utility Scripts

### Analytics
- **`check-analytics-data.ts`** - Verify analytics data integrity and dashboard data

### Community Features
- **`check-voting-setup.ts`** - Verify voting system setup and vote counts
- **`test-voting.ts`** - Test voting functionality (upvote/downvote)
- **`update-post-authors.ts`** - Update or fix post author information

## Running Scripts

```bash
# Database cleanup (recommended to run monthly)
npm run db:cleanup

# Or run other scripts using ts-node
npx ts-node scripts/check-analytics-data.ts
npx ts-node scripts/check-voting-setup.ts
npx ts-node scripts/test-voting.ts
npx ts-node scripts/update-post-authors.ts
```

## Notes

- All scripts connect to the database configured in `.env`
- Scripts are safe to run on production (they mostly read data)
- The cleanup script will never delete your core 5 collections
- Check script output for any errors or warnings
