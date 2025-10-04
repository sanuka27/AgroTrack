import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export type UserRole = 'guest' | 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  refreshToken: () => Promise<boolean>;
}

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios instance for API calls
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrotrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      const refreshTokenValue = localStorage.getItem('agrotrack_refresh_token');
      if (refreshTokenValue) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshTokenValue
          });
          
          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            localStorage.setItem('agrotrack_token', accessToken);
            localStorage.setItem('agrotrack_refresh_token', newRefreshToken);
            
            // Retry the original request
            error.config.headers.Authorization = `Bearer ${accessToken}`;
            return api.request(error.config);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('agrotrack_token');
          localStorage.removeItem('agrotrack_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

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

  useEffect(() => {
    // Check for existing auth on mount
    checkExistingAuth();
    
    // Listen to Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get Firebase ID token and authenticate with backend
        const idToken = await firebaseUser.getIdToken();
        await authenticateWithFirebase(idToken);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkExistingAuth = async () => {
    const token = localStorage.getItem('agrotrack_token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
          setRole(response.data.user.role || 'user');
        }
      } catch (error) {
        // Token invalid, clear storage
        localStorage.removeItem('agrotrack_token');
        localStorage.removeItem('agrotrack_refresh_token');
      }
    }
    setLoading(false);
  };

  const authenticateWithFirebase = async (idToken: string) => {
    try {
      const response = await api.post('/auth/firebase', { idToken });
      if (response.data.success) {
        const { user: userData, accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        setUser(userData);
        setRole(userData.role || 'user');
        localStorage.setItem('agrotrack_token', accessToken);
        localStorage.setItem('agrotrack_refresh_token', newRefreshToken);
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
        const { user: userData, accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        setUser(userData);
        setRole(userData.role || 'user');
        localStorage.setItem('agrotrack_token', accessToken);
        localStorage.setItem('agrotrack_refresh_token', newRefreshToken);
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
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      return await authenticateWithFirebase(idToken);
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', { name, email, password });
      
      if (response.data.success) {
        const { user: userData, accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        setUser(userData);
        setRole(userData.role || 'user');
        localStorage.setItem('agrotrack_token', accessToken);
        localStorage.setItem('agrotrack_refresh_token', newRefreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Logout from backend
      await api.post('/auth/logout');
      
      // Sign out from Firebase
      await signOut(auth);
      
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

  const refreshToken = async (): Promise<boolean> => {
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
  };

  const hasPermission = (permission: string): boolean => {
    return PERMISSIONS[role]?.includes(permission) || false;
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
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
