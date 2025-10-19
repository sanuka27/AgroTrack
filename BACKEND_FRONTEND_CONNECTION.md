# Backend-Frontend Connection Status

## ✅ Backend Status

### Build Status
- **TypeScript Compilation**: ✅ SUCCESS (0 errors)
- **Port**: 5000 (default, configurable via .env PORT)
- **Base URL**: `http://localhost:5000/api`

### Database Schema (Finalized)
#### Core Collections (6):
1. **users** - User accounts and authentication
2. **posts** - Community posts (CommunityPost model)
3. **comments** - Post comments (CommunityComment model)
4. **votes** - Post voting system (CommunityVote model)
5. **reports** - Content moderation reports (CommunityReport model)
6. **plants** - User's plant data with care tracking

#### Analytics/Preferences Collections (5):
7. **DashboardAnalytics** - User dashboard widgets and data
8. **ExportImportOperation** - Data export/import tracking
9. **PlantCareAnalytics** - Plant-specific care analytics
10. **UserAnalytics** - User activity and engagement metrics
11. **NotificationPreference** - User notification settings

### Removed/Disabled Features
The following models and controllers were removed or stubbed with 501 responses:
- ❌ CareLog (feature disabled)
- ❌ Reminder (feature disabled)
- ❌ Notification (feature disabled, preferences still work)
- ❌ SearchAnalytics (search works, but analytics disabled)
- ❌ SystemMetrics (disabled)
- ❌ Old Post/Comment/Like models (replaced with Community* models)
- ❌ Blog* models (BlogPost, BlogCategory, BlogSeries, BlogTag)

### Active API Endpoints

#### Authentication (`/api/auth`)
- ✅ POST `/register` - User registration
- ✅ POST `/login` - User login
- ✅ POST `/refresh` - Token refresh
- ✅ POST `/logout` - User logout
- ✅ POST `/forgot-password` - Password reset request
- ✅ POST `/reset-password` - Password reset

#### Users (`/api/users`)
- ✅ GET `/profile` - Get user profile
- ✅ PUT `/profile` - Update profile
- ✅ DELETE `/account` - Delete account
- ✅ GET `/stats` - User statistics

#### Plants (`/api/plants`)
- ✅ POST `/` - Create plant
- ✅ GET `/` - List user's plants
- ✅ GET `/:id` - Get plant details
- ✅ PUT `/:id` - Update plant
- ✅ DELETE `/:id` - Delete plant
- ✅ GET `/categories` - Get plant categories
- ✅ POST `/:id/health` - Update plant health

#### Community Forum (`/api/community`)
- ✅ POST `/posts` - Create post
- ✅ GET `/posts` - List posts (with filters)
- ✅ GET `/posts/trending` - Get trending posts
- ✅ GET `/posts/:postId` - Get post details
- ✅ PUT `/posts/:postId` - Update post
- ✅ DELETE `/posts/:postId` - Delete post
- ✅ POST `/posts/:postId/comments` - Add comment
- ✅ GET `/posts/:postId/comments` - Get comments
- ✅ PUT `/comments/:commentId` - Update comment
- ✅ DELETE `/comments/:commentId` - Delete comment
- ✅ POST `/likes` - Toggle like on post/comment
- ✅ POST `/flag` - Flag content for moderation
- ✅ GET `/stats` - Community statistics

#### Analytics (`/api/analytics`)
- ✅ GET `/dashboard` - Get user dashboard
- ✅ GET `/dashboard/simple` - Simple dashboard stats
- ✅ POST `/dashboard` - Create dashboard
- ✅ GET `/dashboard/widgets/:widgetId` - Get widget data
- ✅ GET `/plants/health` - Plant health analytics
- ⚠️ GET `/care/effectiveness` - Returns 501 (care logs disabled)
- ✅ GET `/plants/growth` - Growth analytics
- ⚠️ GET `/system/metrics` - Returns placeholder (real metrics disabled)
- ✅ GET `/user` - User analytics
- ✅ POST `/user/generate` - Generate user analytics

#### Search (`/api/search`)
- ✅ GET `/` - Universal search (plants only, no care logs/reminders)
- ✅ GET `/suggestions` - Search suggestions
- ✅ GET `/plants` - Plant-specific search
- ✅ GET `/facets` - Search facets
- ⚠️ GET `/history` - Returns 501 (analytics disabled)
- ⚠️ GET `/trending` - Returns 501 (analytics disabled)
- ⚠️ GET `/analytics` - Returns 501 (analytics disabled)

#### Weather (`/api/weather`)
- ✅ GET `/current` - Current weather
- ✅ GET `/forecast` - Weather forecast
- ✅ GET `/recommendations` - Weather-based care recommendations
- ✅ GET `/alerts` - Weather alerts
- ✅ POST `/alerts/:alertId/acknowledge` - Acknowledge alert
- ⚠️ POST `/schedules/update` - Returns empty (no reminders)
- ✅ GET `/stats` - Weather statistics

#### Admin (`/api/admin`)
- ✅ Admin user management
- ✅ Content moderation
- ✅ System monitoring

#### Disabled Endpoints (Return 501)
- ❌ POST `/api/care-logs/*` - All care log endpoints
- ❌ POST `/api/reminders/*` - All reminder endpoints
- ❌ POST `/api/notifications/*` - Notification sending (preferences still work)
- ❌ GET `/api/bug-reports/*` - Bug reporting endpoints
- ❌ POST `/api/contact/*` - Contact form endpoints

---

## ✅ Frontend Status

### Configuration
- **Port**: 5173 (Vite default)
- **API Base URL**: `http://localhost:5000/api` (from `.env` file)
- **Build Tool**: Vite + React + TypeScript

### API Client Setup (`Frontend/src/lib/api.ts`)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

### Authentication Flow
1. **Token Storage**: `localStorage.getItem('agrotrack_token')` (primary) or `accessToken` (fallback)
2. **Refresh Token**: `localStorage.getItem('agrotrack_refresh_token')`
3. **Auto-Refresh**: Axios interceptor handles 401 errors and automatically refreshes tokens
4. **Token Format**: `Bearer <token>` in Authorization header

### Environment Variables Required
Create `Frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### API Service Files
- `Frontend/src/lib/api.ts` - Main Axios instance with interceptors
- `Frontend/src/lib/apiService.ts` - Additional API helpers
- `Frontend/src/api/admin.ts` - Admin-specific API calls
- `Frontend/src/api/communityForum.ts` - Community forum API calls

---

## 🔧 Setup Instructions

### Backend Setup
1. **Install Dependencies**:
   ```bash
   cd Backend
   npm install
   ```

2. **Create `.env` file** (copy from `.env.example`):
   ```bash
   # Required minimum configuration
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/agrotrack_db
   JWT_SECRET=your-secret-key-here
   JWT_REFRESH_SECRET=your-refresh-secret-here
   CORS_ORIGINS=http://localhost:5173
   ```

3. **Build**:
   ```bash
   npm run build
   ```

4. **Start Server**:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. **Install Dependencies**:
   ```bash
   cd Frontend
   npm install
   ```

2. **Create `.env` file**:
   ```bash
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing Connection

### 1. Backend Health Check
```bash
curl http://localhost:5000/health
```
Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-19T...",
  "services": { "database": "connected", "cache": "connected" }
}
```

### 2. Test Registration (via Frontend or curl)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 3. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

### 4. Test Authenticated Endpoint
```bash
curl http://localhost:5000/api/plants \
  -H "Authorization: Bearer <your-token-here>"
```

---

## 📋 Database Collections Schema

### Users Collection
```typescript
{
  username: string;
  email: string;
  password: string (hashed);
  role: 'guest' | 'user' | 'admin';
  profilePicture?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Posts Collection (CommunityPost)
```typescript
{
  authorId: ObjectId; // ref User
  authorName: string;
  title: string;
  body: string;
  category?: string;
  tags: string[];
  score: number; // vote score
  commentsCount: number;
  isSolved: boolean;
  status: 'visible' | 'hidden' | 'deleted';
  plantId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### Comments Collection (CommunityComment)
```typescript
{
  postId: ObjectId; // ref CommunityPost
  authorId: ObjectId; // ref User
  text: string;
  parentCommentId?: ObjectId; // for nested comments
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}
```

### Votes Collection (CommunityVote)
```typescript
{
  postId: ObjectId; // ref CommunityPost
  userId: ObjectId; // ref User
  value: 1 | -1; // upvote or downvote
  createdAt: Date;
  updatedAt: Date;
}
```

### Plants Collection
```typescript
{
  userId: ObjectId; // ref User
  name: string;
  scientificName?: string;
  commonNames: string[];
  category: string;
  location: string;
  images: string[];
  careInstructions: {
    watering: { frequency: number; amount: string; notes?: string };
    sunlight: { hours: number; type: string; notes?: string };
    // ... more care types
  };
  wateringEveryDays?: number;
  fertilizerEveryWeeks?: number;
  health: string;
  healthStatus: string;
  measurements: Array<{ date: Date; height?: number; width?: number; notes?: string }>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ⚠️ Known Limitations

1. **Disabled Features** (return 501):
   - Care log tracking
   - Reminders/scheduling
   - Notification sending (preferences still work)
   - Bug reporting
   - Contact forms
   - Search analytics

2. **Weather Schedule Updates**: No longer updates reminders (reminders disabled)

3. **Community Features**: Fully functional with new Community* models

4. **Analytics**: Limited to plant health and growth; care effectiveness disabled

---

## 🐛 Troubleshooting

### Backend won't start
1. Check MongoDB is running: `mongosh` or check connection string
2. Check PORT is free: `netstat -ano | findstr :5000`
3. Check `.env` file exists with required variables

### Frontend can't connect to backend
1. Verify backend is running: `curl http://localhost:5000/health`
2. Check CORS origins in backend `.env`: `CORS_ORIGINS=http://localhost:5173`
3. Check frontend `.env` has: `VITE_API_URL=http://localhost:5000/api`
4. Clear browser localStorage if old tokens exist

### Registration not saving to database
1. Ensure MongoDB connection is successful (check server logs)
2. Check `users` collection exists and has proper indexes
3. Verify password meets requirements (min 6 chars, with uppercase/lowercase/number/special)

### Authentication errors
1. Clear localStorage: `localStorage.clear()`
2. Verify JWT_SECRET is set in backend `.env`
3. Check token expiration settings (default 7 days)

---

## ✅ Final Checklist

- [x] All TypeScript errors resolved
- [x] Backend builds successfully
- [x] Core collections defined (6)
- [x] Analytics collections kept (5)
- [x] Removed models deleted
- [x] Controllers refactored or stubbed
- [x] Frontend API client configured
- [x] CORS configured
- [x] Authentication flow working
- [x] Token refresh implemented
- [x] Health endpoint available
- [x] Documentation complete

---

**Status**: ✅ Backend and Frontend are properly connected and ready for development!
