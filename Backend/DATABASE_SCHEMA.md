# AgroTrack Database Schema - Final Structure

## Database: MongoDB Atlas
**Database Name:** agrotrack
**Collections:** 6

---

## Collections

### 1. **users** (1 document)
User accounts and authentication

**Fields:**
- `_id`: ObjectId
- `name`: String
- `email`: String (unique, indexed)
- `password`: String (hashed)
- `role`: String (enum: 'user', 'expert', 'admin')
- `createdAt`: Date
- `updatedAt`: Date

---

### 2. **plants** (NEW)
User plant collection and care tracking

**Fields:**
- `_id`: ObjectId
- `userId`: ObjectId (ref: User, required, indexed)
- `name`: String (required, max 100 chars)
- `species`: String
- `category`: String (enum: Indoor, Outdoor, Succulent, Herb, Vegetable, Flower, Tree, Shrub, Other)
- `scientificName`: String
- `commonNames`: Array of Strings
- `plantedDate`: Date (default: now)
- `ageYears`: Number
- `location`: String
- `notes`: String (max 2000 chars)
- `imageUrl`: String
- `careInstructions`: Object
  - `watering`: String
  - `fertilizing`: String
  - `pruning`: String
  - `sunlight`: String
  - `soilType`: String
- `wateringFrequency`: Number (days, 1-365)
- `wateringEveryDays`: Number (days, 1-365)
- `fertilizerEveryWeeks`: Number (weeks, 1-52)
- `lastWateredDate`: Date
- `lastFertilizedDate`: Date
- `sunlightRequirements`: String (enum: Full Sun, Partial Sun, Partial Shade, Full Shade, Indirect Light)
- `soilType`: String
- `healthStatus`: String (enum: Excellent, Good, Fair, Poor, Critical, default: Good)
- `health`: String
- `healthScore`: Number (0-100)
- `growthRate`: Number (percentage, -100 to 1000)
- `measurements`: Array of Objects
  - `height`: Number
  - `width`: Number
  - `recordedAt`: Date
- `createdAt`: Date
- `updatedAt`: Date

**Indexes:**
- userId + createdAt (compound)
- userId + category (compound)
- userId + healthStatus (compound)

---

### 3. **posts** (50 documents)
Community forum posts (previously called CommunityPost)

**Fields:**
- `_id`: ObjectId
- `authorId`: ObjectId (ref: User)
- `authorName`: String (display name)
- `authorUsername`: String (optional)
- `title`: String (3-200 chars)
- `body`: String (max 10,000 chars)
- `images`: Array of {url, width, height}
- `tags`: Array of Strings
- `score`: Number (vote score)
- `commentsCount`: Number
- `isSolved`: Boolean
- `status`: String (enum: 'visible', 'hidden', 'deleted')
- `deletedAt`: Date (optional)
- `deletedBy`: String (optional)
- `createdAt`: Date
- `updatedAt`: Date

**Indexes:**
- authorId, createdAt, score, tags, status, title (text), body (text)

---

### 3. **comments** (156 documents)
Comments on community posts

### 4. **comments** (156 documents)
Comments on community posts

**Fields:**
- `_id`: ObjectId
- `postId`: ObjectId (ref: CommunityPost)
- `authorId`: ObjectId (ref: User)
- `authorName`: String
- `body`: String (max 5,000 chars)
- `parentCommentId`: ObjectId (optional, for replies)
- `upvotes`: Number
- `downvotes`: Number
- `isExpertReply`: Boolean
- `isDeleted`: Boolean
- `deletedAt`: Date (optional)
- `createdAt`: Date
- `updatedAt`: Date

**Indexes:**
- postId, authorId, createdAt

---

### 5. **votes** (50 documents)
User votes on posts and comments

**Fields:**
- `_id`: ObjectId
- `userId`: ObjectId (ref: User)
- `targetId`: ObjectId (post or comment ID)
- `targetType`: String (enum: 'post', 'comment')
- `voteType`: String (enum: 'upvote', 'downvote')
- `createdAt`: Date
- `updatedAt`: Date

**Indexes:**
- userId + targetId (compound unique)
- targetId + targetType

---

### 6. **reports** (0 documents)
User reports for inappropriate content

**Fields:**
- `_id`: ObjectId
- `reporterId`: ObjectId (ref: User)
- `reporterName`: String
- `targetId`: ObjectId (post or comment ID)
- `targetType`: String (enum: 'post', 'comment')
- `reason`: String
- `description`: String (max 1,000 chars)
- `status`: String (enum: 'pending', 'reviewing', 'resolved', 'dismissed')
- `reviewedBy`: ObjectId (ref: User, optional)
- `reviewNotes`: String (optional)
- `resolvedAt`: Date (optional)
- `createdAt`: Date
- `updatedAt`: Date

**Indexes:**
- targetId + targetType
- status, createdAt

---

## Model Files (Backend)

### Location: `Backend/src/models/`

1. **User.ts** - User accounts (collection: users)
2. **Plant.ts** - Plant collection and care tracking (collection: plants) 🆕
3. **CommunityPost.ts** - Forum posts (collection: posts)
4. **CommunityComment.ts** - Post comments (collection: comments)
5. **CommunityVote.ts** - Voting system (collection: votes)
6. **CommunityReport.ts** - Content reports (collection: reports)

---

## Database Statistics

| Collection | Documents | Purpose |
|-----------|-----------|---------|
| users | 1 | User accounts (admin: Sanuka Marasinghe) |
| plants | 0+ | User plant collection and care tracking 🆕 |
| posts | 50 | Community forum posts with full content |
| comments | 156 | Comments on posts |
| votes | 50 | User voting on posts/comments |
| reports | 0 | Content moderation reports |
| **Total** | **257+** | |

---

## Removed Collections (Permanently Deleted)

The following collections were removed from the database:
- ❌ communityreports (duplicate of reports)
- ❌ notificationpreferences
- ❌ likes (replaced by votes)
- ❌ plantcareanalytics
- ❌ exportimportoperations
- ❌ useranalytics
- ❌ systemmetrics
- ❌ notifications
- ❌ contactmessages
- ❌ dashboardanalytics
- ❌ chatmessages
- ❌ carelogs
- ❌ bugreports
- ❌ reminders

---

## Notes

1. **posts** collection uses the model name **CommunityPost** but the collection name is **posts**
2. **comments** collection uses the model name **CommunityComment**
3. **votes** collection uses the model name **CommunityVote**
4. **reports** collection uses the model name **CommunityReport**
5. All posts have been populated with relevant gardening content
6. Post author names are distributed: Sanuka Marasinghe (17), Asma Fahim (17), Pathumi Arunodya (16)
7. Admin panel provides full content management for posts (view/hide/show/delete)

---

## Last Updated
October 19, 2025
