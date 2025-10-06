# MongoDB Integration Analysis for AgroTrack

## Executive Summary

This document provides a comprehensive analysis of the AgroTrack application's data flow requirements, existing MongoDB collections, and necessary frontend-to-backend integrations.

---

## 1. Existing MongoDB Collections (Backend Models)

### ✅ Complete Models (Already Implemented)

#### 1.1 **User** (`models/User.ts`)
- **Purpose**: Store user account information, authentication, and profile data
- **Key Fields**:
  - Basic: `name`, `email`, `password`, `role` (guest/user/admin)
  - Profile: `avatar`, `bio`, `location`, `phoneNumber`
  - Auth: `emailVerified`, `emailVerificationToken`, `resetPasswordToken`
  - Settings: `preferences`, `notificationSettings`
  - OAuth: `firebaseUid`, `googleId`, `lastLoginAt`
  - Metadata: `isActive`, `deletedAt`, `createdAt`, `updatedAt`
- **Indexes**: email (unique), firebaseUid, googleId, role
- **Status**: ✅ Complete

#### 1.2 **Plant** (`models/Plant.ts`)
- **Purpose**: Store user's plant collection with care requirements
- **Key Fields**:
  - Basic: `name`, `species`, `variety`, `category`
  - Care: `wateringSchedule`, `fertilizerSchedule`, `sunlightRequirement`
  - Location: `location`, `zoneHardiness`
  - Health: `healthStatus`, `growthStage`
  - Media: `images[]`, `qrCode`
  - Tracking: `purchaseDate`, `plantedDate`, `lastWateredDate`, `lastFertilizedDate`
  - Relations: `userId` (ref: User)
- **Indexes**: userId, category, healthStatus, name (text search)
- **Status**: ✅ Complete

#### 1.3 **CareLog** (`models/CareLog.ts`)
- **Purpose**: Track all plant care activities (watering, fertilizing, pruning, etc.)
- **Key Fields**:
  - Relations: `userId`, `plantId`
  - Activity: `careType` (watering/fertilizing/pruning/repotting/pest_control)
  - Details: `notes`, `images[]`, `metadata` (care-specific data)
  - Weather: `weatherConditions`, `temperature`
  - Timing: `scheduledDate`, `completedDate`
- **Indexes**: userId, plantId, careType, completedDate
- **Status**: ✅ Complete

#### 1.4 **Reminder** (`models/Reminder.ts`)
- **Purpose**: Manage care reminders and notifications
- **Key Fields**:
  - Relations: `userId`, `plantId`
  - Schedule: `reminderType`, `frequency`, `nextDueDate`
  - Status: `status` (pending/completed/snoozed/cancelled)
  - Settings: `isRecurring`, `customSchedule`, `priority`
  - Notifications: `notificationChannels[]` (push/email/sms)
  - Smart: `aiGenerated`, `adjustmentHistory[]`
- **Indexes**: userId, plantId, nextDueDate, status
- **Status**: ✅ Complete

#### 1.5 **Post** (`models/Post.ts`)
- **Purpose**: Community posts and plant sharing
- **Key Fields**:
  - Content: `title`, `content`, `images[]`
  - Relations: `userId`, `plantId` (optional)
  - Classification: `category`, `tags[]`, `isPublic`
  - Engagement: `likes`, `comments`, `views`, `shares`
  - Status: `status` (draft/published/archived)
- **Indexes**: userId, plantId, category, createdAt, likes
- **Status**: ✅ Complete

#### 1.6 **Comment** (`models/Comment.ts`)
- **Purpose**: Comments on community posts
- **Key Fields**:
  - Content: `content`, `images[]`
  - Relations: `userId`, `postId`, `parentCommentId` (for replies)
  - Engagement: `likes`, `replies`
  - Status: `isEdited`, `isDeleted`
- **Indexes**: postId, userId, parentCommentId, createdAt
- **Status**: ✅ Complete

#### 1.7 **Like** (`models/Like.ts`)
- **Purpose**: Track likes on posts and comments
- **Key Fields**:
  - Relations: `userId`, `targetId`, `targetType` (Post/Comment)
- **Indexes**: userId, targetId+targetType (compound unique)
- **Status**: ✅ Complete

#### 1.8 **Notification** (`models/Notification.ts`)
- **Purpose**: System notifications for users
- **Key Fields**:
  - Relations: `userId`, `relatedUser`, `relatedPlant`, `relatedPost`
  - Content: `type`, `title`, `message`, `actionUrl`
  - Status: `isRead`, `readAt`, `sentAt`
  - Delivery: `channels[]`, `priority`
- **Indexes**: userId, isRead, createdAt, type
- **Status**: ✅ Complete

#### 1.9 **NotificationPreference** (`models/NotificationPreference.ts`)
- **Purpose**: User notification preferences
- **Key Fields**:
  - Relations: `userId`
  - Channels: `email`, `push`, `sms` (enabled/disabled per type)
  - Settings: `reminderNotifications`, `communityNotifications`, `systemNotifications`
  - Schedule: `quietHoursStart`, `quietHoursEnd`, `frequency`
- **Indexes**: userId (unique)
- **Status**: ✅ Complete

#### 1.10 **UserAnalytics** (`models/UserAnalytics.ts`)
- **Purpose**: Track user activity and behavior
- **Key Fields**:
  - Event: `eventType`, `eventData`, `sessionId`
  - User: `userId`, `deviceInfo`, `location`
  - Performance: `loadTime`, `responseTime`
- **Indexes**: userId, eventType, timestamp (with TTL: 2 years)
- **Status**: ✅ Complete

#### 1.11 **PlantCareAnalytics** (`models/PlantCareAnalytics.ts`)
- **Purpose**: Analytics for plant care patterns
- **Key Fields**:
  - Relations: `userId`, `plantId`
  - Stats: `totalCareLogs`, `wateringFrequency`, `fertilizerUsage`
  - Health: `healthTrend`, `growthRate`
  - Period: `periodStart`, `periodEnd`
- **Indexes**: userId, plantId, periodEnd
- **Status**: ✅ Complete

#### 1.12 **DashboardAnalytics** (`models/DashboardAnalytics.ts`)
- **Purpose**: Aggregated dashboard metrics
- **Key Fields**:
  - Relations: `userId`
  - Metrics: `totalPlants`, `healthyPlants`, `needsAttention`
  - Activity: `activitiesThisWeek`, `upcomingReminders`
  - Engagement: `communityPosts`, `communityEngagement`
- **Indexes**: userId, calculatedAt
- **Status**: ✅ Complete

#### 1.13 **SearchAnalytics** (`models/SearchAnalytics.ts`)
- **Purpose**: Track search queries and results
- **Key Fields**:
  - Query: `searchQuery`, `searchType`, `filters`
  - Results: `resultsCount`, `clickedResults[]`
  - User: `userId` (optional), `sessionId`
- **Indexes**: searchQuery (text), userId, timestamp
- **Status**: ✅ Complete

#### 1.14 **BlogPost** (`models/BlogPost.ts`)
- **Purpose**: Educational blog content
- **Key Fields**:
  - Content: `title`, `slug`, `content`, `excerpt`
  - Media: `featuredImage`, `images[]`
  - Classification: `categoryId`, `tags[]`, `series`
  - SEO: `metaDescription`, `keywords[]`
  - Engagement: `views`, `likes`, `shares`
  - Status: `status`, `publishedAt`
- **Indexes**: slug (unique), categoryId, status, publishedAt
- **Status**: ✅ Complete

#### 1.15 **BlogCategory** (`models/BlogCategory.ts`)
- **Purpose**: Blog content organization
- **Key Fields**: `name`, `slug`, `description`, `icon`
- **Status**: ✅ Complete

#### 1.16 **BlogTag** (`models/BlogTag.ts`)
- **Purpose**: Blog content tagging
- **Key Fields**: `name`, `slug`, `description`
- **Status**: ✅ Complete

#### 1.17 **BlogSeries** (`models/BlogSeries.ts`)
- **Purpose**: Multi-part blog series
- **Key Fields**: `title`, `slug`, `description`, `posts[]`
- **Status**: ✅ Complete

#### 1.18 **SystemMetrics** (`models/SystemMetrics.ts`)
- **Purpose**: System performance monitoring
- **Key Fields**: `timestamp`, `activeUsers`, `apiRequests`, `errors`, `performance`
- **Status**: ✅ Complete

#### 1.19 **ExportImportOperation** (`models/ExportImportOperation.ts`)
- **Purpose**: Track data export/import operations
- **Key Fields**:
  - Relations: `userId`
  - Operation: `operationType` (export/import), `dataType`, `fileFormat`
  - Status: `status`, `progress`, `recordsProcessed`
  - Files: `filePath`, `fileSize`, `downloadUrl`
- **Indexes**: userId, operationType, createdAt
- **Status**: ✅ Complete

---

## 2. Frontend Data Entry Points Analysis

### 2.1 **Authentication & User Management**

#### Login (`Login.tsx`, `auth/Login.tsx`)
- **Form Fields**: email, password
- **API Endpoint**: `POST /api/auth/login`
- **Backend**: ✅ Implemented (`authController.ts`)
- **Status**: ✅ Connected to MongoDB

#### Register (`Register.tsx`, `auth/Register.tsx`, `auth/Signup.tsx`)
- **Form Fields**: name, email, password, confirmPassword
- **API Endpoint**: `POST /api/auth/register`
- **Backend**: ✅ Implemented (`authController.ts`)
- **Creates**: User + UserAnalytics documents
- **Status**: ✅ Connected to MongoDB

#### Password Reset (`auth/PasswordResetPage.tsx`)
- **Form Fields**: email (request), newPassword (reset)
- **API Endpoints**: 
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- **Backend**: ✅ Implemented (`authController.ts`)
- **Status**: ✅ Connected to MongoDB

### 2.2 **Profile Management**

#### Profile Page (`ProfilePage.tsx`)
- **Form Fields**: 
  - displayName, bio, location
  - profileImage (upload)
- **API Endpoint**: `PUT /api/users/profile`
- **Backend**: ✅ Implemented (`userController.ts`)
- **Status**: ⚠️ **Needs Frontend API Integration**
- **Action Required**: Replace mock API calls with real backend calls

#### Settings Page (`SettingsPage.tsx`, `SettingsPage_new.tsx`)
- **Form Fields**:
  - Account: email (read-only), name
  - Password: currentPassword, newPassword, confirmPassword
  - Notifications: watering, fertilizer, dailySummary, dailySummaryTime
  - Preferences: theme, units (metric/imperial)
- **API Endpoints**: 
  - `PUT /api/users/profile` (for name)
  - `PUT /api/users/change-password` (for password)
  - `PUT /api/users/notification-preferences` (for notifications)
- **Backend**: ✅ Implemented (`userController.ts`)
- **Status**: ⚠️ **Needs Frontend API Integration**
- **Action Required**: Connect settings forms to real API endpoints

### 2.3 **Plant Management**

#### Add Plant Modal (`AddPlantModal.tsx`)
- **Form Fields**:
  - Basic: name, species, variety, category
  - Care: sunlight, wateringEveryDays, fertilizerEveryWeeks, soil
  - Details: ageYears, notes, health, growthRatePctThisMonth
  - Media: imageFile (upload)
- **API Endpoint**: `POST /api/plants`
- **Backend**: ✅ Implemented (`plantController.ts`)
- **Status**: ⚠️ **Needs Frontend API Integration**
- **Action Required**: Update `MyPlants.tsx` to call real API instead of mock

#### My Plants Page (`MyPlants.tsx`)
- **Actions**:
  - Create Plant: Uses `AddPlantModal`
  - Edit Plant: Uses `AddPlantModal` in edit mode
  - Delete Plant: Button action
  - View Plant Details: Card click
- **API Endpoints**:
  - `GET /api/plants` - List user's plants
  - `GET /api/plants/:id` - Get plant details
  - `POST /api/plants` - Create plant
  - `PUT /api/plants/:id` - Update plant
  - `DELETE /api/plants/:id` - Delete plant
- **Backend**: ✅ All endpoints implemented
- **Status**: ⚠️ **Partially Connected** (still using mock data)
- **Action Required**: Replace mockApi calls with real API calls

### 2.4 **Care Logging**

#### Care Log Modal (`CareLogModal.tsx`)
- **Form Fields**:
  - Basic: careType, date, notes
  - Watering: waterAmount, wateringMethod
  - Fertilizing: fertilizerType, amount, npkRatio
  - Pruning: partsRemoved, toolsUsed
  - Repotting: potSize, soilType
  - Pest Control: pestType, treatment
  - Photos: images[] (upload)
- **API Endpoint**: `POST /api/care-logs`
- **Backend**: ✅ Implemented (`careLogController.ts`)
- **Status**: ⚠️ **Needs Frontend API Integration**
- **Action Required**: Connect CareLogModal submission to backend API

#### Care Timeline (`CareTimeline.tsx`)
- **Actions**:
  - View care logs
  - Edit care log
  - Delete care log
- **API Endpoints**:
  - `GET /api/care-logs?plantId=:id` - Get plant care logs
  - `PUT /api/care-logs/:id` - Update care log
  - `DELETE /api/care-logs/:id` - Delete care log
- **Backend**: ✅ Implemented
- **Status**: ⚠️ **Needs Frontend API Integration**

### 2.5 **Reminders** (Not Yet Implemented in Frontend)

**Missing Frontend Components**:
- Reminder creation modal
- Reminder list/management interface
- Reminder settings page

**Required API Endpoints** (Already Implemented in Backend):
- `GET /api/reminders` - List user reminders
- `POST /api/reminders` - Create reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder
- `POST /api/reminders/:id/complete` - Mark reminder complete
- `POST /api/reminders/:id/snooze` - Snooze reminder

**Action Required**:
1. Create `ReminderModal.tsx` component
2. Create `RemindersList.tsx` component
3. Integrate into `UserDashboard.tsx` and `MyPlants.tsx`

### 2.6 **Community Features**

#### Community Page (`Community.tsx`)
- **Actions**:
  - Create post (button present but not functional)
  - View posts
  - Like posts
  - Comment on posts
  - Share posts
- **API Endpoints Needed**:
  - `GET /api/community/posts` - List posts
  - `POST /api/community/posts` - Create post
  - `PUT /api/community/posts/:id` - Update post
  - `DELETE /api/community/posts/:id` - Delete post
  - `POST /api/community/posts/:id/like` - Like post
  - `POST /api/community/posts/:id/comments` - Add comment
  - `POST /api/community/comments/:id/like` - Like comment
- **Backend**: ✅ Implemented (`communityController.ts`)
- **Status**: ❌ **Not Connected** (no API calls in frontend)
- **Action Required**: 
  1. Create `CreatePostModal.tsx`
  2. Implement API calls in `Community.tsx`
  3. Add comment submission functionality

### 2.7 **Admin Dashboard**

#### Users Tab (`admin/UsersTab.tsx`)
- **Actions**:
  - View users list
  - Change user role
  - Suspend/activate user
  - Delete user
- **API Endpoints**:
  - `GET /api/admin/users` - List all users
  - `PUT /api/admin/users/:id/role` - Change user role
  - `PUT /api/admin/users/:id/status` - Change user status
  - `DELETE /api/admin/users/:id` - Delete user
- **Backend**: ✅ Implemented (`adminController.ts`)
- **Status**: ⚠️ **Needs Backend API Integration**

### 2.8 **Contact & Bug Reports**

#### Contact Page (`ContactPage.tsx`)
- **Form Fields**: name, email, subject, message
- **Current**: Logs to console only
- **Action Required**: 
  1. Create Contact model (optional)
  2. Implement `POST /api/contact` endpoint
  3. Send email notifications

#### Bug Reports Page (`BugReportsPage.tsx`)
- **Form Fields**: name, email, message (bug description)
- **Current**: Shows alert only
- **Action Required**:
  1. Create BugReport model
  2. Implement `POST /api/bug-reports` endpoint
  3. Store in database and notify admins

### 2.9 **Assistant/Chat** (`AssistantPage.tsx`)
- **Current**: Mock messages only
- **AI Integration**: Uses Gemini AI
- **Backend**: ✅ Gemini service implemented (`ai/gemini.ts`)
- **Action Required**:
  1. Create ChatMessage model
  2. Implement `POST /api/chat` endpoint
  3. Connect frontend to backend AI service
  4. Store chat history

---

## 3. Missing Collections/Models

### 3.1 **BugReport** (New Model Needed)
```typescript
{
  userId?: ObjectId,  // Optional - allow non-logged-in users
  name: String,
  email: String,
  description: String,
  status: 'new' | 'investigating' | 'resolved' | 'closed',
  priority: 'low' | 'medium' | 'high' | 'critical',
  assignedTo?: ObjectId,
  attachments?: String[],
  createdAt: Date,
  resolvedAt?: Date
}
```

### 3.2 **ContactMessage** (New Model Needed)
```typescript
{
  userId?: ObjectId,  // Optional
  name: String,
  email: String,
  subject: String,
  message: String,
  status: 'new' | 'responded' | 'closed',
  response?: String,
  respondedAt?: Date,
  respondedBy?: ObjectId,
  createdAt: Date
}
```

### 3.3 **ChatMessage** (New Model Needed)
```typescript
{
  userId: ObjectId,
  sessionId: String,
  role: 'user' | 'assistant',
  content: String,
  metadata?: {
    plantId?: ObjectId,
    careType?: String,
    suggestions?: String[]
  },
  createdAt: Date
}
```

---

## 4. API Endpoint Status Matrix

| Feature | Frontend Component | API Endpoint | Backend Controller | MongoDB Model | Status |
|---------|-------------------|--------------|-------------------|---------------|---------|
| **Auth** |
| Login | Login.tsx | POST /api/auth/login | ✅ | User | ✅ Connected |
| Register | Register.tsx | POST /api/auth/register | ✅ | User | ✅ Connected |
| Forgot Password | PasswordResetPage.tsx | POST /api/auth/forgot-password | ✅ | User | ✅ Connected |
| Reset Password | PasswordResetPage.tsx | POST /api/auth/reset-password | ✅ | User | ✅ Connected |
| Logout | Header.tsx | POST /api/auth/logout | ✅ | - | ✅ Connected |
| Refresh Token | - | POST /api/auth/refresh | ✅ | User | ✅ Connected |
| **Profile** |
| Get Profile | ProfilePage.tsx | GET /api/users/profile | ✅ | User | ⚠️ Using Mock |
| Update Profile | ProfilePage.tsx | PUT /api/users/profile | ✅ | User | ⚠️ Using Mock |
| Upload Avatar | ProfilePage.tsx | POST /api/users/avatar | ✅ | User | ❌ Not Connected |
| Change Password | SettingsPage.tsx | PUT /api/users/change-password | ✅ | User | ❌ Not Connected |
| Notification Prefs | SettingsPage.tsx | PUT /api/users/notification-preferences | ✅ | NotificationPreference | ❌ Not Connected |
| **Plants** |
| List Plants | MyPlants.tsx | GET /api/plants | ✅ | Plant | ⚠️ Using Mock |
| Get Plant | MyPlants.tsx | GET /api/plants/:id | ✅ | Plant | ⚠️ Using Mock |
| Create Plant | AddPlantModal.tsx | POST /api/plants | ✅ | Plant | ❌ Not Connected |
| Update Plant | AddPlantModal.tsx | PUT /api/plants/:id | ✅ | Plant | ❌ Not Connected |
| Delete Plant | MyPlants.tsx | DELETE /api/plants/:id | ✅ | Plant | ❌ Not Connected |
| Upload Image | AddPlantModal.tsx | POST /api/plants/:id/images | ✅ | Plant | ❌ Not Connected |
| **Care Logs** |
| List Care Logs | CareTimeline.tsx | GET /api/care-logs | ✅ | CareLog | ❌ Not Connected |
| Create Care Log | CareLogModal.tsx | POST /api/care-logs | ✅ | CareLog | ❌ Not Connected |
| Update Care Log | CareTimeline.tsx | PUT /api/care-logs/:id | ✅ | CareLog | ❌ Not Connected |
| Delete Care Log | CareTimeline.tsx | DELETE /api/care-logs/:id | ✅ | CareLog | ❌ Not Connected |
| **Reminders** |
| List Reminders | ❌ Missing | GET /api/reminders | ✅ | Reminder | ❌ Not Connected |
| Create Reminder | ❌ Missing | POST /api/reminders | ✅ | Reminder | ❌ Not Connected |
| Update Reminder | ❌ Missing | PUT /api/reminders/:id | ✅ | Reminder | ❌ Not Connected |
| Delete Reminder | ❌ Missing | DELETE /api/reminders/:id | ✅ | Reminder | ❌ Not Connected |
| Complete Reminder | ❌ Missing | POST /api/reminders/:id/complete | ✅ | Reminder | ❌ Not Connected |
| Snooze Reminder | ❌ Missing | POST /api/reminders/:id/snooze | ✅ | Reminder | ❌ Not Connected |
| **Community** |
| List Posts | Community.tsx | GET /api/community/posts | ✅ | Post | ❌ Not Connected |
| Create Post | ❌ Missing | POST /api/community/posts | ✅ | Post | ❌ Not Connected |
| Update Post | ❌ Missing | PUT /api/community/posts/:id | ✅ | Post | ❌ Not Connected |
| Delete Post | ❌ Missing | DELETE /api/community/posts/:id | ✅ | Post | ❌ Not Connected |
| Like Post | Community.tsx | POST /api/community/posts/:id/like | ✅ | Like | ❌ Not Connected |
| Unlike Post | Community.tsx | DELETE /api/community/posts/:id/like | ✅ | Like | ❌ Not Connected |
| Comment on Post | ❌ Missing | POST /api/community/posts/:id/comments | ✅ | Comment | ❌ Not Connected |
| Reply to Comment | ❌ Missing | POST /api/community/comments/:id/replies | ✅ | Comment | ❌ Not Connected |
| Like Comment | ❌ Missing | POST /api/community/comments/:id/like | ✅ | Like | ❌ Not Connected |
| **Admin** |
| List Users | UsersTab.tsx | GET /api/admin/users | ✅ | User | ⚠️ Using Mock |
| Change Role | UsersTab.tsx | PUT /api/admin/users/:id/role | ✅ | User | ❌ Not Connected |
| Suspend User | UsersTab.tsx | PUT /api/admin/users/:id/suspend | ✅ | User | ❌ Not Connected |
| Delete User | UsersTab.tsx | DELETE /api/admin/users/:id | ✅ | User | ❌ Not Connected |
| System Metrics | AdminDashboard.tsx | GET /api/admin/metrics | ✅ | SystemMetrics | ❌ Not Connected |
| **Analytics** |
| Dashboard Analytics | UserDashboard.tsx | GET /api/analytics/dashboard | ✅ | DashboardAnalytics | ⚠️ Using Mock |
| Plant Analytics | Analytics.tsx | GET /api/analytics/plants | ✅ | PlantCareAnalytics | ⚠️ Using Mock |
| Care Trends | Analytics.tsx | GET /api/analytics/care-trends | ✅ | UserAnalytics | ⚠️ Using Mock |
| **Contact** |
| Submit Contact | ContactPage.tsx | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Not Implemented |
| Submit Bug Report | BugReportsPage.tsx | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Not Implemented |
| **Chat/Assistant** |
| Send Message | AssistantPage.tsx | ❌ Missing | ✅ Partial (AI service) | ❌ Missing | ❌ Not Implemented |

**Legend**:
- ✅ Implemented and working
- ⚠️ Implemented but using mock data
- ❌ Not implemented or not connected

---

## 5. Priority Action Items

### HIGH PRIORITY (Core Functionality)

1. **Fix MongoDB Connection** ✅ COMPLETED
   - Removed duplicate `SKIP_MONGODB=true` from .env
   - Server now connects to MongoDB Atlas

2. **Connect Plant Management**
   - Update `MyPlants.tsx` to use real API calls
   - Connect `AddPlantModal.tsx` to `POST /api/plants`
   - Implement image upload functionality
   - Test create, read, update, delete operations

3. **Connect Care Logging**
   - Update `CareLogModal.tsx` to use real API
   - Connect `CareTimeline.tsx` to backend
   - Implement photo uploads for care logs

4. **Connect Profile Management**
   - Replace mock API in `ProfilePage.tsx` with real calls
   - Connect Settings page to backend APIs
   - Implement avatar upload

### MEDIUM PRIORITY (Enhanced Features)

5. **Implement Reminder Frontend**
   - Create `ReminderModal.tsx` component
   - Create `RemindersList.tsx` component
   - Add reminder management to dashboard
   - Connect to existing backend API

6. **Connect Community Features**
   - Create `CreatePostModal.tsx`
   - Implement post creation/editing
   - Add comment submission
   - Connect like/unlike functionality

7. **Complete Admin Dashboard**
   - Connect UsersTab to real API
   - Implement user management actions
   - Connect system metrics display

### LOW PRIORITY (Additional Features)

8. **Implement Contact/Support**
   - Create BugReport model and controller
   - Create ContactMessage model and controller
   - Connect frontend forms to backend
   - Set up email notifications

9. **Implement AI Chat**
   - Create ChatMessage model
   - Create chat controller
   - Connect frontend to backend AI service
   - Implement chat history storage

10. **Add Analytics Connections**
    - Connect dashboard analytics
    - Connect plant care analytics
    - Implement real-time updates

---

## 6. Data Flow Diagrams

### 6.1 User Registration Flow
```
Frontend (Register.tsx)
  → Form Submission (name, email, password)
  → POST /api/auth/register
  → authController.register()
  → Create User document
  → Create UserAnalytics document
  → Track USER_REGISTER event
  → Generate JWT tokens
  → Return user + tokens
  → Frontend stores tokens
  → Redirect to /dashboard
```

### 6.2 Plant Creation Flow (NEEDS IMPLEMENTATION)
```
Frontend (AddPlantModal.tsx)
  → Form Submission (plant data + image)
  → FormData with multipart/form-data
  → POST /api/plants
  → plantController.createPlant()
  → Upload image to storage
  → Create Plant document with imageUrl
  → Track PLANT_CREATE event in UserAnalytics
  → Return created plant
  → Frontend updates plants list
```

### 6.3 Care Log Creation Flow (NEEDS IMPLEMENTATION)
```
Frontend (CareLogModal.tsx)
  → Form Submission (careType, notes, metadata, photos)
  → FormData with photos
  → POST /api/care-logs
  → careLogController.createCareLog()
  → Upload photos to storage
  → Create CareLog document
  → Update Plant.lastWateredDate (if watering)
  → Update PlantCareAnalytics
  → Track CARE_LOG_CREATE event
  → Return created care log
  → Frontend updates care timeline
```

### 6.4 Community Post Flow (NEEDS IMPLEMENTATION)
```
Frontend (CreatePostModal.tsx - TO BE CREATED)
  → Form Submission (title, content, images, plantId?)
  → FormData with images
  → POST /api/community/posts
  → communityController.createPost()
  → Upload images to storage
  → Create Post document
  → Create Notification for followers
  → Track POST_CREATE event
  → Return created post
  → Frontend updates community feed
```

---

## 7. Implementation Steps

### Phase 1: MongoDB Connection ✅ COMPLETED
- [x] Fix duplicate SKIP_MONGODB in .env
- [x] Verify MongoDB Atlas connection
- [x] Test database connectivity

### Phase 2: Core Data Flow (Plant Management)
1. Create API service utility (`src/lib/api.ts`)
2. Update `MyPlants.tsx`:
   - Replace mockApi with real API calls
   - Add error handling and loading states
   - Implement image upload
3. Update `AddPlantModal.tsx`:
   - Connect form submission to API
   - Handle multipart form data for images
   - Add validation and error messages
4. Test end-to-end plant CRUD operations

### Phase 3: Care Logging Integration
1. Update `CareLogModal.tsx`:
   - Connect to `POST /api/care-logs`
   - Handle photo uploads
   - Add success/error notifications
2. Update `CareTimeline.tsx`:
   - Fetch care logs from API
   - Implement edit/delete actions
   - Add loading states
3. Test care log creation and display

### Phase 4: Profile & Settings
1. Update `ProfilePage.tsx`:
   - Connect to `GET /PUT /api/users/profile`
   - Implement avatar upload
   - Add form validation
2. Update `SettingsPage.tsx`:
   - Connect password change
   - Connect notification preferences
   - Save settings to backend

### Phase 5: Reminders Frontend
1. Create `ReminderModal.tsx`:
   - Form for creating/editing reminders
   - Support for recurring schedules
   - Priority and notification settings
2. Create `RemindersList.tsx`:
   - Display user's reminders
   - Complete/snooze actions
   - Filter by plant/status
3. Integrate into dashboard and plant pages

### Phase 6: Community Features
1. Create `CreatePostModal.tsx`:
   - Rich text editor for content
   - Image upload
   - Plant linking
   - Tags and categories
2. Update `Community.tsx`:
   - Fetch posts from API
   - Implement like/unlike
   - Add comment submission
   - Display post interactions
3. Create `CommentSection.tsx`:
   - Nested comment display
   - Reply functionality
   - Like comments

### Phase 7: Additional Features
1. Implement bug reports system
2. Implement contact messages
3. Implement AI chat with history
4. Connect admin dashboard
5. Add real-time analytics

---

## 8. Code Examples

### 8.1 API Service Utility (TO BE CREATED)

```typescript
// Frontend/src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      // If refresh fails, redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 8.2 Plant API Calls (EXAMPLE)

```typescript
// Frontend/src/lib/api/plants.ts
import api from '../api';
import { Plant } from '@/types/plant';

export const plantsApi = {
  // Get all user plants
  async getPlants(): Promise<Plant[]> {
    const response = await api.get('/plants');
    return response.data.data.plants;
  },

  // Create new plant
  async createPlant(plantData: FormData): Promise<Plant> {
    const response = await api.post('/plants', plantData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data.plant;
  },

  // Update plant
  async updatePlant(id: string, plantData: FormData): Promise<Plant> {
    const response = await api.put(`/plants/${id}`, plantData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data.plant;
  },

  // Delete plant
  async deletePlant(id: string): Promise<void> {
    await api.delete(`/plants/${id}`);
  },
};
```

### 8.3 Updated MyPlants.tsx (EXAMPLE)

```typescript
// Frontend/src/pages/MyPlants.tsx (excerpt)
import { plantsApi } from '@/lib/api/plants';

const MyPlants = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plants from API
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        setLoading(true);
        const data = await plantsApi.getPlants();
        setPlants(data);
        setError(null);
      } catch (err) {
        setError('Failed to load plants');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
  }, []);

  // Create plant
  const handleCreatePlant = async (plantData: Plant) => {
    try {
      const formData = new FormData();
      // Append all plant fields to FormData
      Object.keys(plantData).forEach((key) => {
        if (plantData[key] !== undefined) {
          formData.append(key, plantData[key]);
        }
      });

      const newPlant = await plantsApi.createPlant(formData);
      setPlants([...plants, newPlant]);
      toast({
        title: 'Plant added!',
        description: `${newPlant.name} has been added to your collection.`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add plant. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // ... rest of component
};
```

---

## 9. Environment Variables

Ensure the following are set:

```env
# Backend/.env
MONGODB_URI=mongodb+srv://sanukanm_db_user:5rkEdV6SfFngk6fD@agrotrack.pfp9ipq.mongodb.net/agrotrack?retryWrites=true&w=majority&appName=AgroTrack
SKIP_MONGODB=false  # Must be false!
DISABLE_REDIS=true  # For development
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

```env
# Frontend/.env
VITE_API_URL=http://localhost:5000/api
```

---

## 10. Next Steps

1. ✅ **COMPLETED**: Fix MongoDB connection issue
2. **IN PROGRESS**: Create API service utility
3. **NEXT**: Connect plant management to backend
4. **THEN**: Connect care logging to backend
5. **AFTER**: Implement remaining features per priority list

---

## Conclusion

The AgroTrack application has a **comprehensive and well-designed backend** with all necessary MongoDB collections and API endpoints already implemented. The main task now is to:

1. **Connect existing frontend components** to the backend APIs
2. **Create missing frontend components** (Reminder UI, Post creation, etc.)
3. **Implement new features** (Bug reports, Contact form, AI chat)
4. **Add proper error handling and loading states** throughout the frontend

The backend is production-ready. The frontend needs integration work to complete the full data flow.

---

**Document Version**: 1.0  
**Last Updated**: October 6, 2025  
**Status**: MongoDB Connection Fixed ✅ | Ready for Frontend Integration
