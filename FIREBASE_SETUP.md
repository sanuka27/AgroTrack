# 🔥 Firebase Configuration Guide

## ✅ Firebase Setup Complete!

Your AgroTrack project is now configured with Firebase. Here's what was set up:

### **Backend Configuration**
- ✅ Service account JSON file created: `firebase-service-account.json`
- ✅ Firebase Admin SDK credentials added to `.env`
- ✅ Environment variables configured for both file-based and variable-based auth

### **Frontend Configuration**
- ✅ Firebase web app credentials added to `Frontend/.env`
- ✅ Firebase SDK configured for authentication

### **Security**
- ✅ Firebase credentials added to `.gitignore`
- ✅ Service account JSON file excluded from version control

---

## 📋 Firebase Services Enabled

Your project includes:
- 🔐 **Authentication**: Email/Password & Google Sign-In
- 📊 **Firestore** (optional): NoSQL database
- 📁 **Storage**: File uploads and image storage
- 📈 **Analytics**: User behavior tracking

---

## 🚀 How to Use Firebase Authentication

### **1. Start the Backend Server**

```bash
cd Backend
npm run dev
```

The server will now:
- ✅ Connect to MongoDB
- ✅ Initialize Firebase Admin SDK
- ✅ Enable Google OAuth authentication
- ✅ Support Firebase ID token verification

### **2. Start the Frontend**

```bash
cd Frontend
npm run dev
```

### **3. Test Authentication**

#### **Email/Password Registration:**
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

#### **Email/Password Login:**
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePassword123!"
}
```

#### **Google OAuth Login:**
- Click "Sign in with Google" button in the frontend
- User will be authenticated via Google
- Backend will sync with Firebase automatically

#### **Firebase Token Authentication:**
```bash
POST http://localhost:5000/api/auth/firebase
Content-Type: application/json

{
  "idToken": "<firebase-id-token-from-client>"
}
```

---

## 🔑 Environment Variables

### **Backend (.env)**
```env
# Firebase Admin SDK - Option 1 (File-based)
GOOGLE_APPLICATION_CREDENTIALS=firebase-service-account.json

# Firebase Admin SDK - Option 2 (Environment variables)
FIREBASE_PROJECT_ID=agrotrack-b980f
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@agrotrack-b980f.iam.gserviceaccount.com
```

### **Frontend (.env)**
```env
VITE_FIREBASE_API_KEY=AIzaSyBJjkuEhwZIQfnzcZ_GnyJ-1pFJL5DDpuU
VITE_FIREBASE_AUTH_DOMAIN=agrotrack-b980f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=agrotrack-b980f
```

---

## 🛡️ Security Best Practices

### **✅ DO:**
- Keep `firebase-service-account.json` out of version control (already in `.gitignore`)
- Use environment variables for production deployments
- Rotate Firebase service account keys periodically
- Enable Firebase Security Rules in production

### **❌ DON'T:**
- Never commit `firebase-service-account.json` to Git
- Never share Firebase private keys publicly
- Don't use the same Firebase project for dev and production

---

## 🔧 Firebase Features Available

### **1. User Management**
```typescript
// Create Firebase user
await firebaseService.createUser({
  email: 'user@example.com',
  displayName: 'User Name',
  emailVerified: true
});

// Get user by email
const user = await firebaseService.getUserByEmail('user@example.com');

// Set custom claims (roles)
await firebaseService.setCustomUserClaims(uid, {
  role: 'admin',
  userId: mongoUserId
});
```

### **2. Token Verification**
```typescript
// Verify Firebase ID token
const decodedToken = await firebaseService.verifyIdToken(idToken);
```

### **3. File Upload to Storage**
```typescript
// Upload file to Firebase Storage
const downloadURL = await firebaseService.uploadFile(
  file,
  'uploads/images/plant.jpg'
);
```

---

## 📱 Frontend Authentication Example

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginComponent() {
  const { login, loginWithGoogle } = useAuth();

  // Email/Password login
  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      // User logged in successfully
    }
  };

  // Google OAuth login
  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      // User logged in with Google
    }
  };
}
```

---

## 🧪 Testing Firebase Connection

Run this to test if Firebase is working:

```bash
# Backend
cd Backend
npm run dev

# Check logs for:
# "✅ Firebase Admin SDK initialized"
```

---

## 🆘 Troubleshooting

### **Error: Firebase configuration not found**
- Check if `GOOGLE_APPLICATION_CREDENTIALS` points to the correct file
- Verify environment variables are loaded

### **Error: Invalid Firebase token**
- Ensure Frontend is using the correct Firebase config
- Check if Firebase API key matches in Frontend `.env`

### **Error: Permission denied**
- Update Firebase Security Rules
- Ensure user is authenticated

---

## 📚 Next Steps

1. **Test Authentication**: Try logging in with email/password and Google
2. **Configure Security Rules**: Set up Firestore and Storage rules
3. **Enable Additional Features**: Add more Firebase services as needed
4. **Deploy**: Configure production Firebase credentials

---

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com/project/agrotrack-b980f)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**🎉 Firebase is ready! You can now use authentication in your AgroTrack app.**
