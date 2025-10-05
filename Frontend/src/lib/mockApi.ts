import {
  mockPlants,
  mockUsers,
  mockCareLogs,
  mockReminders,
  mockWeather,
  mockAnalytics,
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
} from '../types/api';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API responses
export const mockApi = {
  // Auth endpoints
  auth: {
    login: async (credentials: { email: string; password: string }) => {
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
};

// Export mock API as default for easy switching
export default mockApi;