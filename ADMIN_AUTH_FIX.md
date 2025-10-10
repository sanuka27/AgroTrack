# Admin Dashboard - Authentication Fix

## Issue
The admin dashboard is showing "Failed to load dashboard data" error with HTTP 401 Unauthorized.

## Root Causes Identified

1. **Wrong Token Key**: The admin API client was looking for `token` in localStorage, but the app stores it as `agrotrack_token`
2. **Wrong Auth Endpoint**: AuthContext was calling `/api/auth/me` (404 Not Found), but the correct endpoint is `/api/users/profile`
3. **Stale Token**: User may have a token from before they became admin, so it doesn't contain the admin role

## Fixes Applied

### 1. Fixed Admin API Token Retrieval
**File**: `Frontend/src/api/admin.ts`
- Changed from `localStorage.getItem('token')` to `localStorage.getItem('agrotrack_token') || localStorage.getItem('token')`
- Added response interceptor to log 401 errors
- Added warning when no token is found

### 2. Fixed Auth Endpoint
**File**: `Frontend/src/contexts/AuthContext.tsx`
- Changed endpoint from `/auth/me` to `/users/profile`
- Fixed response data path from `response.data.user` to `response.data.data`

### 3. Added Admin Access Check Component
**File**: `Frontend/src/components/admin/AdminAccessCheck.tsx`
- New component that decodes JWT token to check role
- Shows alert if user doesn't have admin role
- Provides "Logout and Refresh" button to get new token with admin role

### 4. Added Component to Dashboard
**File**: `Frontend/src/pages/admin/AdminDashboard.tsx`
- Imported and added `<AdminAccessCheck />` component
- Displays before tabs to warn users if they need to re-login

### 5. Better Error Logging
**File**: `Frontend/src/pages/admin/Overview.tsx`
- Added detailed console logging for dashboard load
- Shows response status and error message in console

## User Action Required

The user needs to **logout and login again** to get a fresh authentication token that includes their admin role.

### Steps:
1. **Refresh the page** (Ctrl+F5 or Cmd+Shift+R)
2. If you see a warning about "Admin Access Required" with your current role showing as "user":
   - Click the **"Logout and Refresh"** button
   - Or manually: Click your profile → Logout
3. **Login again** with the same credentials
4. Navigate back to Admin Dashboard
5. The dashboard should now load successfully

## Database Verification

✅ User `sanukanm@gmail.com` is already set to `role: 'admin'` in MongoDB
- Verified with `checkAdminUser.ts` script
- Database is correct, just need fresh token

## Technical Details

### JWT Token Structure
```json
{
  "userId": "...",
  "email": "sanukanm@gmail.com",
  "role": "admin",  // This is what we need
  "iat": 1234567890,
  "exp": 1234567890
}
```

When user logs in, the backend generates this token with their current role from the database. If the role was changed after login, the old token still has the old role.

### Backend Admin Route Protection
```typescript
router.get('/dashboard',
  protect,  // Checks if JWT token is valid
  requireRole(['admin', 'super_admin']),  // Checks if role in token is admin
  adminController.getDashboard
);
```

The `requireRole` middleware reads the role from the decoded JWT token, not from the database. That's why a fresh login is required.

## Testing Checklist

After re-login:
- [ ] Dashboard Overview loads without errors
- [ ] Users tab displays user list
- [ ] Reports tab shows community reports
- [ ] Content tab displays forum posts
- [ ] All statistics show real data from MongoDB
- [ ] User actions (ban/activate) work
- [ ] Content moderation works
- [ ] No 401 errors in console

## Additional Notes

- The admin routes are working correctly on the backend
- MongoDB connection is working (verified by script)
- CORS is configured correctly
- The issue was purely frontend authentication token handling
