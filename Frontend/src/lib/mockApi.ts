import {
  mockPlants,
  mockUsers,
  mockCareLogs,
  mockReminders,
  mockWeather,
  mockAnalytics,
  mockCommunityPosts,
  mockComments,
  mockCommunityStats,
  mockTrendingTopics,
} from './mockData';
import type {
  LoginCredentials,
  RegisterData,
  User,
  AuthResponse,
  PlantQueryParams,
  PlantsResponse,
  Plant,
  CreatePlantData,
  UpdatePlantData,
  CareLog,
  CreateCareLogData,
  Reminder,
  CreateReminderData,
  UpdateReminderData,
  WeatherData,
  AnalyticsData,
  CommunityPost,
  Comment,
  CreatePostData,
  CreateCommentData,
  CommunityStats,
  TrendingTopic,
} from '../types/api';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API responses
export const mockApi = {
  // Auth endpoints
  auth: {
    login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
      await delay(500);
      if (credentials.email === 'user@example.com' && credentials.password === 'password') {
        const user = mockUsers[0];
        const token = 'mock-jwt-token';
        localStorage.setItem('authToken', token);
        return { user, token };
      }
      throw new Error('Invalid credentials');
    },

    register: async (userData: RegisterData): Promise<AuthResponse> => {
      await delay(500);
      const newUser: User = {
        _id: `user${Date.now()}`,
        email: userData.email,
        name: userData.name,
        role: 'user',
        profilePicture: '/placeholder.svg',
        preferences: {
          notifications: true,
          language: 'en',
          timezone: 'UTC',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.push(newUser);
      const token = 'mock-jwt-token';
      localStorage.setItem('authToken', token);
      return { user: newUser, token };
    },

    logout: async () => {
      await delay(200);
      localStorage.removeItem('authToken');
      return { message: 'Logged out successfully' };
    },

    getProfile: async () => {
      await delay(300);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');
      return mockUsers[0];
    },

    updateProfile: async (profileData: Partial<Pick<User, 'name' | 'profilePicture'>>) => {
      await delay(500);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      // Update the mock user
      const userIndex = 0; // Always update the first user for mock
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...profileData,
        updatedAt: new Date()
      };

      return mockUsers[userIndex];
    },

    updatePreferences: async (preferences: Partial<User['preferences']>) => {
      await delay(300);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      // Update the mock user preferences
      const userIndex = 0;
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        preferences: {
          ...mockUsers[userIndex].preferences,
          ...preferences
        },
        updatedAt: new Date()
      };

      return mockUsers[userIndex];
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      await delay(500);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      // Mock password validation (in real app, this would be done server-side)
      if (currentPassword !== 'password') {
        throw new Error('Current password is incorrect');
      }

      // In a real app, you'd hash and store the new password
      return { message: 'Password changed successfully' };
    },
  },

  // Plant endpoints
  plants: {
    getAll: async (params?: PlantQueryParams): Promise<PlantsResponse> => {
      await delay(300);
      let plants = [...mockPlants];

      if (params?.category) {
        plants = plants.filter(p => p.category === params.category);
      }
      if (params?.search) {
        plants = plants.filter(p =>
          p.name.toLowerCase().includes(params.search.toLowerCase()) ||
          p.scientificName.toLowerCase().includes(params.search.toLowerCase())
        );
      }

      return {
        plants,
        total: plants.length,
        page: params?.page || 1,
        limit: params?.limit || 10,
      };
    },

    getById: async (id: string) => {
      await delay(200);
      const plant = mockPlants.find(p => p._id === id);
      if (!plant) throw new Error('Plant not found');
      return plant;
    },

    create: async (plantData: CreatePlantData): Promise<Plant> => {
      await delay(400);
      const newPlant = {
        ...plantData,
        _id: `plant${Date.now()}`,
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPlants.push(newPlant);
      return newPlant;
    },

    update: async (id: string, plantData: UpdatePlantData): Promise<Plant> => {
      await delay(400);
      const index = mockPlants.findIndex(p => p._id === id);
      if (index === -1) throw new Error('Plant not found');

      mockPlants[index] = {
        ...mockPlants[index],
        ...plantData,
        updatedAt: new Date(),
      };
      return mockPlants[index];
    },

    delete: async (id: string) => {
      await delay(300);
      const index = mockPlants.findIndex(p => p._id === id);
      if (index === -1) throw new Error('Plant not found');

      mockPlants.splice(index, 1);
      return { message: 'Plant deleted successfully' };
    },
  },

  // Care log endpoints
  careLogs: {
    getAll: async () => {
      await delay(200);
      return mockCareLogs;
    },

    getByPlant: async (plantId: string) => {
      await delay(200);
      return mockCareLogs.filter(log => log.plantId === plantId);
    },

    create: async (logData: CreateCareLogData): Promise<CareLog> => {
      await delay(300);
      const newLog: CareLog = {
        ...logData,
        _id: `log${Date.now()}`,
        userId: 'user1', // Mock user ID
        createdAt: new Date(),
      };
      mockCareLogs.push(newLog);
      return newLog;
    },
  },

  // Reminder endpoints
  reminders: {
    getAll: async () => {
      await delay(200);
      return mockReminders;
    },

    getByPlant: async (plantId: string) => {
      await delay(200);
      return mockReminders.filter(r => r.plantId === plantId);
    },

    create: async (reminderData: CreateReminderData): Promise<Reminder> => {
      await delay(300);
      const newReminder: Reminder = {
        ...reminderData,
        _id: `rem${Date.now()}`,
        userId: 'user1', // Mock user ID
        completed: false,
        createdAt: new Date(),
      };
      mockReminders.push(newReminder);
      return newReminder;
    },

    update: async (id: string, reminderData: UpdateReminderData): Promise<Reminder> => {
      await delay(300);
      const index = mockReminders.findIndex(r => r._id === id);
      if (index === -1) throw new Error('Reminder not found');

      mockReminders[index] = {
        ...mockReminders[index],
        ...reminderData,
        updatedAt: new Date(),
      };
      return mockReminders[index];
    },

    delete: async (id: string) => {
      await delay(200);
      const index = mockReminders.findIndex(r => r._id === id);
      if (index === -1) throw new Error('Reminder not found');

      mockReminders.splice(index, 1);
      return { message: 'Reminder deleted successfully' };
    },
  },

  // Weather endpoint
  weather: {
    getCurrent: async () => {
      await delay(500);
      return mockWeather;
    },
  },

  // Search endpoint
  search: {
    plants: async (query: string) => {
      await delay(300);
      const results = mockPlants.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.scientificName.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      );
      return results;
    },
  },

  // Analytics endpoint
  analytics: {
    getDashboard: async (): Promise<AnalyticsData> => {
      await delay(400);
      return mockAnalytics;
    },
  },

  // Community endpoints
  community: {
    getPosts: async (params?: { page?: number; limit?: number; tag?: string }) => {
      await delay(300);
      let posts = [...mockCommunityPosts];

      if (params?.tag) {
        posts = posts.filter(post => post.tags.includes(params.tag));
      }

      // Sort by pinned first, then by creation date
      posts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        posts: posts.slice(startIndex, endIndex),
        total: posts.length,
        page,
        limit,
      };
    },

    getPostById: async (id: string): Promise<CommunityPost> => {
      await delay(200);
      const post = mockCommunityPosts.find(p => p._id === id);
      if (!post) throw new Error('Post not found');
      return post;
    },

    createPost: async (postData: CreatePostData): Promise<CommunityPost> => {
      await delay(400);
      const newPost: CommunityPost = {
        _id: `post${Date.now()}`,
        author: {
          _id: 'user1', // Mock current user
          name: 'Current User',
          role: 'user',
          profilePicture: '/placeholder.svg'
        },
        title: postData.title,
        content: postData.content,
        likes: 0,
        comments: 0,
        isPinned: false,
        tags: postData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCommunityPosts.unshift(newPost); // Add to beginning for immediate visibility
      return newPost;
    },

    getComments: async (postId: string) => {
      await delay(200);
      return mockComments.filter(comment => comment.postId === postId);
    },

    createComment: async (postId: string, commentData: CreateCommentData): Promise<Comment> => {
      await delay(300);
      const newComment: Comment = {
        _id: `comment${Date.now()}`,
        postId,
        author: {
          _id: 'user1', // Mock current user
          name: 'Current User',
          role: 'user',
          profilePicture: '/placeholder.svg'
        },
        content: commentData.content,
        likes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockComments.push(newComment);

      // Update post comment count
      const post = mockCommunityPosts.find(p => p._id === postId);
      if (post) {
        post.comments += 1;
      }

      return newComment;
    },

    likePost: async (postId: string) => {
      await delay(200);
      const post = mockCommunityPosts.find(p => p._id === postId);
      if (!post) throw new Error('Post not found');
      post.likes += 1;
      return post;
    },

    getStats: async (): Promise<CommunityStats> => {
      await delay(200);
      return mockCommunityStats;
    },

    getTrendingTopics: async (): Promise<TrendingTopic[]> => {
      await delay(200);
      return mockTrendingTopics;
    },
  },

  // Admin endpoints
  admin: {
    // User management
    getUsers: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
      await delay(300);
      let users = [...mockUsers];

      if (params?.status) {
        users = users.filter(u => u.role === params.status || (params.status === 'active' && u.role === 'user'));
      }

      if (params?.search) {
        const search = params.search.toLowerCase();
        users = users.filter(u =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
        );
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const start = (page - 1) * limit;
      const paginatedUsers = users.slice(start, start + limit);

      return {
        users: paginatedUsers,
        total: users.length,
        page,
        limit
      };
    },

    updateUserStatus: async (userId: string, status: 'active' | 'banned' | 'pending') => {
      await delay(500);
      const user = mockUsers.find(u => u._id === userId);
      if (!user) throw new Error('User not found');

      // In a real app, this would update the user's status
      // For mock purposes, we'll just return success
      return { message: `User ${status === 'banned' ? 'banned' : status === 'active' ? 'activated' : 'marked as pending'} successfully` };
    },

    deleteUser: async (userId: string) => {
      await delay(500);
      const userIndex = mockUsers.findIndex(u => u._id === userId);
      if (userIndex === -1) throw new Error('User not found');

      mockUsers.splice(userIndex, 1);
      return { message: 'User deleted successfully' };
    },

    // Reports management
    getReports: async (params?: { page?: number; limit?: number; status?: string }) => {
      await delay(300);
      // Mock reports data - in a real app this would come from a reports table
      const mockReports = [
        {
          _id: 'report1',
          reporterId: 'user2',
          reporterName: 'Bob Smith',
          targetId: 'post1',
          targetType: 'post',
          reason: 'Inappropriate content',
          description: 'Post contains offensive language',
          status: 'open',
          createdAt: new Date(Date.now() - 86400000 * 2),
          resolvedAt: null,
          resolvedBy: null
        },
        {
          _id: 'report2',
          reporterId: 'user3',
          reporterName: 'Charlie Brown',
          targetId: 'comment1',
          targetType: 'comment',
          reason: 'Spam',
          description: 'Comment is promotional spam',
          status: 'resolved',
          createdAt: new Date(Date.now() - 86400000 * 5),
          resolvedAt: new Date(Date.now() - 86400000 * 1),
          resolvedBy: 'admin1'
        }
      ];

      let reports = [...mockReports];

      if (params?.status) {
        reports = reports.filter(r => r.status === params.status);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const start = (page - 1) * limit;
      const paginatedReports = reports.slice(start, start + limit);

      return {
        reports: paginatedReports,
        total: reports.length,
        page,
        limit
      };
    },

    resolveReport: async (reportId: string, action: 'resolve' | 'dismiss', adminNote?: string) => {
      await delay(500);
      // In a real app, this would update the report status
      return { message: `Report ${action}d successfully` };
    },

    // Content moderation
    getContent: async (params?: { page?: number; limit?: number; status?: string; type?: string }) => {
      await delay(300);
      let content = [
        ...mockCommunityPosts.map(p => ({
          _id: p._id,
          type: 'post' as const,
          title: p.title,
          content: p.content,
          author: p.author.name,
          authorId: p.author._id,
          status: 'visible' as const,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          reports: Math.floor(Math.random() * 3)
        })),
        ...mockComments.map(c => ({
          _id: c._id,
          type: 'comment' as const,
          title: '',
          content: c.content,
          author: c.author.name,
          authorId: c.author._id,
          status: 'visible' as const,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          reports: Math.floor(Math.random() * 2)
        }))
      ];

      if (params?.status) {
        content = content.filter(c => c.status === params.status);
      }

      if (params?.type) {
        content = content.filter(c => c.type === params.type);
      }

      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const start = (page - 1) * limit;
      const paginatedContent = content.slice(start, start + limit);

      return {
        content: paginatedContent,
        total: content.length,
        page,
        limit
      };
    },

    moderateContent: async (contentId: string, action: 'hide' | 'remove' | 'restore', reason?: string) => {
      await delay(500);
      // In a real app, this would update the content status
      return { message: `Content ${action}d successfully` };
    },

    // Analytics
    getAnalytics: async (timeframe?: string) => {
      await delay(500);
      const now = new Date();
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;

      return {
        userGrowth: {
          total: mockUsers.length,
          new: Math.floor(Math.random() * 20) + 5,
          active: Math.floor(mockUsers.length * 0.7)
        },
        contentStats: {
          posts: mockCommunityPosts.length,
          comments: mockComments.length,
          reports: Math.floor(Math.random() * 15) + 5
        },
        engagement: {
          dailyActiveUsers: Math.floor(mockUsers.length * 0.4),
          postsPerDay: Math.floor(Math.random() * 10) + 2,
          avgSessionTime: Math.floor(Math.random() * 20) + 10
        },
        timeframe,
        generatedAt: now
      };
    }
  },
};

// Export mock API as default for easy switching
export default mockApi;