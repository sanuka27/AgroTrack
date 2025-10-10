# 🗄️ MongoDB Database Cleanup Guide

## Current Status

### ✅ **CORRECT DATABASE: `agrotrack`**
- **Location**: Now specified in `.env` file
- **Data**: 
  - 10 community users
  - 50 posts
  - 139 comments
  - 462 votes
  - 1 registered user (you)
- **Status**: ACTIVE and configured

### ❌ **UNUSED DATABASE: `agrotrack_db`**
- **Data**: Empty (0 documents in all collections)
- **Status**: Should be deleted

---

## 🎯 What Was Fixed

### 1. **Updated `.env` Configuration**
```env
# OLD (no database specified)
MONGODB_URI=mongodb+srv://...@agrotrack.pfp9ipq.mongodb.net/?retryWrites=true...

# NEW (database specified)
MONGODB_URI=mongodb+srv://...@agrotrack.pfp9ipq.mongodb.net/agrotrack?retryWrites=true...
```

### 2. **Seeded Community Data**
- Re-ran the seed script to populate `agrotrack` database
- All community forum data is now in the correct database

---

## 🧹 How to Delete `agrotrack_db` Database

### Option 1: MongoDB Atlas Dashboard (Recommended)

1. Go to https://cloud.mongodb.com/
2. Login with your account
3. Select your cluster (AgroTrack)
4. Click **"Collections"** tab
5. Find `agrotrack_db` database
6. Click the **trash icon** next to `agrotrack_db`
7. Confirm deletion

### Option 2: Using MongoDB Compass

1. Open **MongoDB Compass**
2. Connect using your connection string
3. Right-click on `agrotrack_db` database
4. Select **"Drop Database"**
5. Confirm deletion

### Option 3: Using mongosh (MongoDB Shell)

```bash
mongosh "mongodb+srv://sanukanm_db_user:iZfa0UqrJmlrqyIh@agrotrack.pfp9ipq.mongodb.net/"

# In mongosh:
use agrotrack_db
db.dropDatabase()
```

---

## ✅ Verification Checklist

- [x] `.env` file updated with correct database name
- [x] Community forum data seeded in `agrotrack` database
- [x] Backend server configured to use `agrotrack`
- [ ] Delete `agrotrack_db` from MongoDB Atlas
- [ ] Restart backend server to ensure connection

---

## 🚀 Next Steps

1. **Restart your backend server**:
   ```bash
   cd Backend
   npm run dev
   ```

2. **Test the community forum**:
   - Visit http://localhost:8081/community
   - Verify posts are loading
   - Check that data persists after refresh

3. **Delete the empty database**:
   - Follow the cleanup steps above
   - This will free up space and avoid confusion

---

## 📝 Notes

- **Why two databases?** MongoDB creates databases on first write. The empty `agrotrack_db` was likely created during initial testing.
- **Is my data safe?** Yes! All your data is in the `agrotrack` database and the `.env` file now points to it.
- **What about the user data?** Your registered user is in the `agrotrack` database along with the community data.

---

## 🔍 Useful Scripts Created

### Check which database has data:
```bash
cd Backend
npx ts-node src/scripts/checkDatabases.ts
```

### Check community forum data:
```bash
cd Backend
npx ts-node src/scripts/checkCommunityData.ts
```

### Re-seed community data:
```bash
cd Backend
npx ts-node src/scripts/seedCommunityForum.ts
```

---

## ✨ Summary

**✅ Everything is now configured correctly!**

- Your application uses the `agrotrack` database
- All data is consolidated in one place
- The empty `agrotrack_db` can be safely deleted
- Community forum is populated with test data

**Status: READY TO GO! 🎉**
