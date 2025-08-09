import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
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

  useEffect(() => {
    // Check for existing auth on mount
    checkExistingAuth();
  }, []);

  const checkExistingAuth = () => {
    const authData = localStorage.getItem('agrotrack_auth');
    if (authData) {
      try {
        const userData = JSON.parse(authData);
        setUser(userData);
        setRole(userData.role || 'user');
      } catch (error) {
        localStorage.removeItem('agrotrack_auth');
      }
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call - replace with real authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Demo users for testing
      const demoUsers: Record<string, User> = {
        'admin@demo.com': {
          id: '1',
          email: 'admin@demo.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: '2024-01-01',
          lastLogin: new Date().toISOString()
        },
        'demo@user.com': {
          id: '2', 
          email: 'demo@user.com',
          name: 'Demo User',
          role: 'user',
          createdAt: '2024-01-15',
          lastLogin: new Date().toISOString()
        },
        // Keep the old ones for compatibility
        'admin@agrotrack.com': {
          id: '3',
          email: 'admin@agrotrack.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: '2024-01-01',
          lastLogin: new Date().toISOString()
        },
        'user@agrotrack.com': {
          id: '4', 
          email: 'user@agrotrack.com',
          name: 'Regular User',
          role: 'user',
          createdAt: '2024-01-15',
          lastLogin: new Date().toISOString()
        }
      };

      const foundUser = demoUsers[email];
      if (foundUser && password === 'password') {
        setUser(foundUser);
        setRole(foundUser.role);
        localStorage.setItem('agrotrack_auth', JSON.stringify(foundUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        role: 'user', // New users start as regular users
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      setUser(newUser);
      setRole('user');
      localStorage.setItem('agrotrack_auth', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setRole('guest');
    localStorage.removeItem('agrotrack_auth');
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
      login,
      logout,
      register,
      hasPermission
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
