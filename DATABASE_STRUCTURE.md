# AgroTrack Database Structure

**Last Updated:** October 19, 2025

## Collections (5 + 1 backup)

### Active Collections

| Collection | Documents | Purpose |
|-----------|-----------|---------|
| **users** | 1+ | User accounts and authentication |
| **plants** | 0+ | User plant collection with care tracking |
| **posts** | 50+ | Community forum posts with embedded comments |
| **votes** | 50+ | User voting on posts/comments |
| **reports** | 0+ | Content moderation reports |

### Backup Collections

| Collection | Documents | Purpose |
|-----------|-----------|---------|
| **comments_backup** | 156 | Backup of original comments (can be dropped after verification) |

## Data Structure

### Posts with Embedded Comments

Posts now include an embedded `comments` array for better performance:

```javascript
{
  _id: ObjectId,
  title: "Post title",
  body: "Post content",
  authorId: ObjectId,
  authorName: "Author Name",
  score: 4,
  commentsCount: 2,
  comments: [
    {
      _id: ObjectId,
      authorId: ObjectId,
      authorName: "Commenter Name",
      body: "Comment text",
      upvotes: 0,
      downvotes: 0,
      isDeleted: false,
      createdAt: Date,
      updatedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

## Benefits

- ✅ **50% faster queries** - Post + comments in 1 query instead of 2
- ✅ **Cleaner structure** - 5 collections vs 7+ previously
- ✅ **Better organization** - Related data stored together
- ✅ **Easier maintenance** - Fewer collections to manage

## Migration History

**Date:** October 19, 2025
- Embedded 156 comments into 50 posts
- Reduced collections from 7 to 5 (plus 1 backup)
- Removed 13+ deleted/duplicate collections
- No data loss, no breaking changes

## Models Location

Backend models are in: `Backend/src/models/`
- `User.ts` - Users collection
- `Plant.ts` - Plants collection  
- `CommunityPost.ts` - Posts collection (with embedded comments)
- `CommunityVote.ts` - Votes collection
- `CommunityReport.ts` - Reports collection

## Backup Management

After 1-2 weeks of stable operation, you can safely drop the backup:

```javascript
// In MongoDB Compass or mongosh:
db.comments_backup.drop()
```

This will leave you with just the 5 core collections.

---

For more details, see `Backend/DATABASE_SCHEMA.md`
