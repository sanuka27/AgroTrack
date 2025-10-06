# AgroTrack Frontend-Backend Integration Implementation Plan

## Overview
This document provides step-by-step instructions to connect all frontend components to the backend MongoDB API.

---

## ✅ COMPLETED

### 1. API Infrastructure
- ✅ Enhanced `Frontend/src/lib/api.ts` with token refresh and error handling
- ✅ Created `Frontend/src/lib/api/plants.ts` - Plants API module
- ✅ Created `Frontend/src/lib/api/careLogs.ts` - Care Logs API module

---

## 🔄 IN PROGRESS - API Service Modules

### Next: Create Remaining API Modules

Create these files in `Frontend/src/lib/api/`:

#### 1. `reminders.ts` - Reminders API
```typescript
import api, { ApiResponse, getErrorMessage } from '../api';

export const remindersApi = {
  async getReminders(params?: { plantId?: string; status?: string }): Promise<Reminder[]> {
    const response = await api.get('/reminders', { params });
    return response.data.data?.reminders || [];
  },
  
  async createReminder(reminderData: Partial<Reminder>): Promise<Reminder> {
    const response = await api.post('/reminders', reminderData);
    return response.data.data.reminder;
  },
  
  async updateReminder(id: string, reminderData: Partial<Reminder>): Promise<Reminder> {
    const response = await api.put(`/reminders/${id}`, reminderData);
    return response.data.data.reminder;
  },
  
  async deleteReminder(id: string): Promise<void> {
    await api.delete(`/reminders/${id}`);
  },
  
  async completeReminder(id: string): Promise<Reminder> {
    const response = await api.post(`/reminders/${id}/complete`);
    return response.data.data.reminder;
  },
  
  async snoozeReminder(id: string, snoozeUntil: Date): Promise<Reminder> {
    const response = await api.post(`/reminders/${id}/snooze`, { snoozeUntil });
    return response.data.data.reminder;
  },
};
```

#### 2. `users.ts` - User Profile API
```typescript
import api, { ApiResponse, getErrorMessage } from '../api';

export const usersApi = {
  async getProfile(): Promise<User> {
    const response = await api.get('/users/profile');
    return response.data.data.user;
  },
  
  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await api.put('/users/profile', profileData);
    return response.data.data.user;
  },
  
  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data.user;
  },
  
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/users/change-password', {
      currentPassword,
      newPassword,
    });
  },
  
  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    await api.put('/users/notification-preferences', preferences);
  },
};
```

#### 3. `community.ts` - Community Posts API
```typescript
import api, { ApiResponse, getErrorMessage } from '../api';

export const communityApi = {
  async getPosts(params?: { page?: number; limit?: number }): Promise<Post[]> {
    const response = await api.get('/community/posts', { params });
    return response.data.data?.posts || [];
  },
  
  async createPost(postData: FormData | Partial<Post>): Promise<Post> {
    const headers = postData instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : {};
    const response = await api.post('/community/posts', postData, { headers });
    return response.data.data.post;
  },
  
  async updatePost(id: string, postData: Partial<Post>): Promise<Post> {
    const response = await api.put(`/community/posts/${id}`, postData);
    return response.data.data.post;
  },
  
  async deletePost(id: string): Promise<void> {
    await api.delete(`/community/posts/${id}`);
  },
  
  async likePost(id: string): Promise<void> {
    await api.post(`/community/posts/${id}/like`);
  },
  
  async unlikePost(id: string): Promise<void> {
    await api.delete(`/community/posts/${id}/like`);
  },
  
  async addComment(postId: string, content: string): Promise<Comment> {
    const response = await api.post(`/community/posts/${postId}/comments`, { content });
    return response.data.data.comment;
  },
  
  async getComments(postId: string): Promise<Comment[]> {
    const response = await api.get(`/community/posts/${postId}/comments`);
    return response.data.data?.comments || [];
  },
};
```

#### 4. `analytics.ts` - Analytics API
```typescript
import api, { ApiResponse, getErrorMessage } from '../api';

export const analyticsApi = {
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    const response = await api.get('/analytics/dashboard');
    return response.data.data;
  },
  
  async getPlantAnalytics(plantId?: string): Promise<PlantCareAnalytics> {
    const params = plantId ? { plantId } : {};
    const response = await api.get('/analytics/plants', { params });
    return response.data.data;
  },
  
  async getCareTrends(period?: 'week' | 'month' | 'year'): Promise<any> {
    const response = await api.get('/analytics/care-trends', {
      params: { period }
    });
    return response.data.data;
  },
};
```

---

## 📝 FRONTEND COMPONENT UPDATES

### Priority 1: Plant Management

#### File: `Frontend/src/pages/MyPlants.tsx`

**Current State**: Uses mockApi  
**Target**: Use real API calls

**Changes Needed**:

1. **Import real API**:
```typescript
import { plantsApi } from '@/lib/api/plants';
import { getErrorMessage } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
```

2. **Replace mockApi.getPlants()** (around line 80):
```typescript
// OLD:
// const plantsData = await mockApi.getPlants();

// NEW:
const plantsData = await plantsApi.getPlants();
```

3. **Update handleCreatePlant** (around line 104):
```typescript
const handleCreatePlant = async (plantData: any) => {
  try {
    setLoading(true);
    
    // Create FormData for image upload
    const formData = new FormData();
    
    // Add all plant fields
    Object.keys(plantData).forEach((key) => {
      if (plantData[key] !== undefined && key !== 'imageFile') {
        formData.append(key, plantData[key]);
      }
    });
    
    // Add image file if present
    if (plantData.imageFile) {
      formData.append('image', plantData.imageFile);
    }

    // Call real API
    const newPlant = await plantsApi.createPlant(formData);
    
    // Update local state
    setPlants([...plants, newPlant]);
    
    toast({
      title: 'Success!',
      description: `${newPlant.name} has been added to your collection.`,
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: getErrorMessage(error),
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};
```

4. **Update handleUpdatePlant** (around line 130):
```typescript
const handleUpdatePlant = async (id: string, plantData: any) => {
  try {
    setLoading(true);
    
    const formData = new FormData();
    Object.keys(plantData).forEach((key) => {
      if (plantData[key] !== undefined && key !== 'imageFile') {
        formData.append(key, plantData[key]);
      }
    });
    
    if (plantData.imageFile) {
      formData.append('image', plantData.imageFile);
    }

    const updatedPlant = await plantsApi.updatePlant(id, formData);
    
    setPlants(plants.map(p => p.id === id ? updatedPlant : p));
    
    toast({
      title: 'Updated!',
      description: `${updatedPlant.name} has been updated.`,
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: getErrorMessage(error),
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};
```

5. **Update handleDeletePlant** (around line 150):
```typescript
const handleDeletePlant = async (id: string) => {
  try {
    setLoading(true);
    
    await plantsApi.deletePlant(id);
    
    setPlants(plants.filter(p => p.id !== id));
    
    toast({
      title: 'Deleted',
      description: 'Plant has been removed from your collection.',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: getErrorMessage(error),
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};
```

---

### Priority 2: Care Logging

#### File: `Frontend/src/components/CareLogModal.tsx`

**Current State**: Creates care log locally  
**Target**: Save to backend

**Changes Needed**:

1. **Import API**:
```typescript
import { careLogsApi } from '@/lib/api/careLogs';
import { getErrorMessage } from '@/lib/api';
```

2. **Update handleSubmit** (around line 39):
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Create FormData for photo upload
    const formData = new FormData();
    formData.append('plantId', plant.id);
    formData.append('careType', careType);
    formData.append('date', date);
    
    if (notes) {
      formData.append('notes', notes);
    }
    
    // Add metadata
    if (Object.keys(metadata).length > 0) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    // Add photos
    photos.forEach((photo, index) => {
      if (photo instanceof File) {
        formData.append('photos', photo);
      }
    });

    // Call API
    const newCareLog = await careLogsApi.createCareLog(formData);
    
    // Call parent callback with new care log
    onSubmit(newCareLog);
    handleClose();
  } catch (error) {
    console.error('Failed to create care log:', getErrorMessage(error));
    // Show error toast
  }
};
```

#### File: `Frontend/src/components/CareTimeline.tsx`

**Changes Needed**:

1. **Add edit and delete handlers**:
```typescript
const handleEdit = async (careLog: CareLog) => {
  if (onEditCareLog) {
    onEditCareLog(careLog);
  }
};

const handleDelete = async (careLogId: string) => {
  try {
    await careLogsApi.deleteCareLog(careLogId);
    if (onDeleteCareLog) {
      onDeleteCareLog(careLogId);
    }
  } catch (error) {
    console.error('Failed to delete care log:', getErrorMessage(error));
  }
};
```

---

### Priority 3: Profile Management

#### File: `Frontend/src/pages/ProfilePage.tsx`

**Current State**: Uses mockApi  
**Target**: Use real API

**Changes Needed**:

1. **Import API**:
```typescript
import { usersApi } from '@/lib/api/users';
import { getErrorMessage } from '@/lib/api';
```

2. **Load profile on mount**:
```typescript
useEffect(() => {
  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await usersApi.getProfile();
      setProfileData({
        displayName: profile.name || '',
        email: profile.email || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        photoURL: profile.avatar || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  loadProfile();
}, []);
```

3. **Update handleSave**:
```typescript
const handleSave = async () => {
  if (!validateForm()) return;
  
  try {
    setSaving(true);
    
    const updatedProfile = await usersApi.updateProfile({
      name: profileData.displayName,
      bio: profileData.bio,
      location: profileData.location,
      website: profileData.website,
    });
    
    toast({
      title: 'Profile updated',
      description: 'Your profile has been saved successfully.',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: getErrorMessage(error),
      variant: 'destructive',
    });
  } finally {
    setSaving(false);
  }
};
```

4. **Update handleImageUpload**:
```typescript
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  try {
    setUploading(true);
    
    const updatedUser = await usersApi.uploadAvatar(file);
    
    setProfileData(prev => ({
      ...prev,
      photoURL: updatedUser.avatar || ''
    }));
    
    toast({
      title: 'Avatar updated',
      description: 'Your profile picture has been updated.',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: getErrorMessage(error),
      variant: 'destructive',
    });
  } finally {
    setUploading(false);
  }
};
```

---

### Priority 4: Settings Page

#### File: `Frontend/src/pages/SettingsPage.tsx`

**Changes Needed**:

1. **Connect password change**:
```typescript
const handlePasswordChange = async () => {
  if (!validatePasswordForm()) return;
  
  try {
    setPasswordChanging(true);
    
    await usersApi.changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );
    
    // Clear form
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    toast({
      title: 'Password updated',
      description: 'Your password has been changed successfully.',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: getErrorMessage(error),
      variant: 'destructive',
    });
  } finally {
    setPasswordChanging(false);
  }
};
```

2. **Connect notification preferences**:
```typescript
const handleSaveNotificationPreferences = async () => {
  try {
    setSaving(true);
    
    await usersApi.updateNotificationPreferences(notificationPreferences);
    
    toast({
      title: 'Preferences saved',
      description: 'Your notification preferences have been updated.',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: getErrorMessage(error),
      variant: 'destructive',
    });
  } finally {
    setSaving(false);
  }
};
```

---

## 🎯 NEXT STEPS

1. **Create remaining API modules** (reminders, users, community, analytics)
2. **Update MyPlants.tsx** with real API calls
3. **Update CareLogModal.tsx** with API integration
4. **Update ProfilePage.tsx** with API calls
5. **Update SettingsPage.tsx** with API integration
6. **Create Reminder components** (ReminderModal, RemindersList)
7. **Connect Community page** to backend
8. **Test all data flows** end-to-end

---

## 📚 Testing Checklist

### Plant Management
- [ ] Can load plants from backend
- [ ] Can create new plant with image
- [ ] Can update plant details
- [ ] Can delete plant
- [ ] Images upload successfully
- [ ] Loading states work
- [ ] Error messages display correctly

### Care Logging
- [ ] Can create care log with photos
- [ ] Care logs display in timeline
- [ ] Can edit care log
- [ ] Can delete care log
- [ ] Photos upload successfully

### Profile
- [ ] Profile loads from backend
- [ ] Can update profile details
- [ ] Can upload avatar
- [ ] Changes save correctly

### Settings
- [ ] Can change password
- [ ] Can update notification preferences
- [ ] Settings persist across sessions

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution**: Check that auth token is stored correctly in localStorage as 'accessToken'

### Issue: Network Error
**Solution**: Verify backend is running on http://localhost:5000

### Issue: CORS Error
**Solution**: Backend CORS configuration should include frontend URL

### Issue: Image upload fails
**Solution**: Check Content-Type is set to 'multipart/form-data'

### Issue: Token refresh not working
**Solution**: Verify refreshToken is stored and /auth/refresh endpoint works

---

**Last Updated**: October 6, 2025  
**Status**: API modules created, component updates in progress
