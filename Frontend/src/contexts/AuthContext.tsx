import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  Auth,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import type { UserRole, User, AuthContextType } from '../types/auth';
import api from '../lib/api';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase (only if config is available)
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (firebaseConfig.apiKey) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Set persistence to LOCAL so auth state survives redirects
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Failed to set persistence:', error);
  });
  
  googleProvider = new GoogleAuthProvider();
  // Force account selection every time
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role-based permissions
const PERMISSIONS = {
  guest: [
    'browse_plants',
    'view_public_content',
    'view_basic_features'
  ],
  user: [
    'browse_plants',
    'view_public_content',
    'view_basic_features',
    'access_dashboard',
    'manage_plants',
    'use_ai_features',
    'forum_participate',
    'create_posts',
    'comment_posts',
    'manage_reminders',
    'receive_notifications',
    'track_care_history'
  ],
  admin: [
    'browse_plants',
    'view_public_content',
    'view_basic_features',
    'access_dashboard',
    'manage_plants',
    'use_ai_features',
    'forum_participate',
    'create_posts',
    'comment_posts',
    'manage_reminders',
    'receive_notifications',
    'track_care_history',
    'moderate_content',
    'review_flagged_posts',
    'manage_users',
    'view_analytics',
    'evaluate_ai_quality',
    'monitor_engagement',
    'admin_dashboard'
  ]
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('agrotrack_refresh_token');
      if (!refreshTokenValue) return false;

      const response = await api.post('/auth/refresh', { 
        refreshToken: refreshTokenValue 
      });
      
      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('agrotrack_token', accessToken);
        localStorage.setItem('agrotrack_refresh_token', newRefreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }, []);

  const checkExistingAuth = useCallback(async () => {
    const token = localStorage.getItem('agrotrack_token');
    if (token) {
      try {
        const response = await api.get('/users/profile');
        if (response.data.success) {
          // Backend returns { success: true, data: { user: {...} } }
          const userData = response.data.data.user || response.data.data;
          setUser(userData);
          setRole(userData.role || 'user');
          localStorage.setItem('userId', userData.id || userData._id); // Store userId for FCM token storage
        }
      } catch (error) {
        // If 401, try to refresh token
        if ((error as any)?.response?.status === 401) {
          const refreshed = await refreshToken();
          if (refreshed) {
            try {
              const response = await api.get('/users/profile');
              if (response.data.success) {
                const userData = response.data.data.user || response.data.data;
                setUser(userData);
                setRole(userData.role || 'user');
                localStorage.setItem('userId', userData.id || userData._id);
              }
            } catch (retryError) {
              console.error('Auth retry failed:', retryError);
              // Clear storage
              localStorage.removeItem('agrotrack_token');
              localStorage.removeItem('agrotrack_refresh_token');
              localStorage.removeItem('userId');
            }
          } else {
            // Clear storage
            localStorage.removeItem('agrotrack_token');
            localStorage.removeItem('agrotrack_refresh_token');
            localStorage.removeItem('userId');
          }
        } else if ((error as any)?.response?.status !== 429) {
          // Don't log rate limit errors
          console.error('Auth check failed:', error);
        }
      }
    }
    setLoading(false);
  }, [refreshToken]);

  useEffect(() => {
    // Check for existing auth on mount - only run once
    checkExistingAuth();
    
    // Listen to Firebase auth changes (only if Firebase is configured)
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser && !user) {
          // Get Firebase ID token and authenticate with backend
          const idToken = await firebaseUser.getIdToken();
          await authenticateWithFirebase(idToken);
        }
      });

      return () => unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const authenticateWithFirebase = async (idToken: string) => {
    try {
      const response = await api.post('/auth/firebase', { idToken });
      
      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        
        setUser(userData);
        setRole(userData.role || 'user');
        localStorage.setItem('agrotrack_token', tokens.accessToken);
        localStorage.setItem('agrotrack_refresh_token', tokens.refreshToken);
        localStorage.setItem('userId', userData.id); // Store userId for FCM token storage
        return true;
      }
    } catch (error) {
      console.error('Firebase auth error:', error);
    }
    return false;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        
        const userObj: User = {
          id: userData._id || userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role as UserRole,
          createdAt: userData.createdAt,
          lastLogin: new Date().toISOString(),
        };

        setUser(userObj);
        setRole(userObj.role);
        localStorage.setItem('agrotrack_token', tokens.accessToken);
        localStorage.setItem('agrotrack_refresh_token', tokens.refreshToken);
        localStorage.setItem('userId', userObj.id); // Store userId for FCM token storage
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      if (!auth || !googleProvider) {
        console.error('Firebase not configured');
        return false;
      }

      setLoading(true);
      
      // Use popup method for Google login
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const success = await authenticateWithFirebase(idToken);
      
      return success;
    } catch (error: any) {
      // Only log non-cancellation errors
      if (error?.code !== 'auth/popup-closed-by-user' && 
          error?.code !== 'auth/cancelled-popup-request') {
        console.error('Google login error:', error);
      }
      
      setLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password,
        confirmPassword: password // Add confirmPassword field required by backend
      });

      if (response.data.success) {
        const { user: userData, tokens } = response.data.data;
        
        const userObj: User = {
          id: userData._id || userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role as UserRole,
          createdAt: userData.createdAt,
          lastLogin: new Date().toISOString(),
        };

        setUser(userObj);
        setRole(userObj.role);
        localStorage.setItem('agrotrack_token', tokens.accessToken);
        localStorage.setItem('agrotrack_refresh_token', tokens.refreshToken);
        localStorage.setItem('userId', userObj.id); // Store userId for FCM token storage
        return { success: true };
      }
      return { success: false, error: response.data.message || 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.email || error.response?.data?.errors?.password || 'Registration failed. Please try again.';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);

      // Logout from backend API
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.error('Backend logout error:', error);
      }

      // Sign out from Firebase (only if configured)
      if (auth) {
        await signOut(auth);
      }

      // Clear local state
      setUser(null);
      setRole('guest');
      localStorage.removeItem('agrotrack_token');
      localStorage.removeItem('agrotrack_refresh_token');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return PERMISSIONS[role]?.includes(permission) || false;
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  const isAuthenticated = role !== 'guest' && user !== null;

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAuthenticated,
      loading,
      login,
      loginWithGoogle,
      logout,
      register,
      hasPermission,
      refreshToken,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthContext;
