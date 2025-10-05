// API Types for mock services
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  profilePicture?: string;
  preferences: {
    notifications: boolean;
    language: string;
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PlantQueryParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PlantsResponse {
  plants: Plant[];
  total: number;
  page: number;
  limit: number;
}

export interface Plant {
  _id: string;
  name: string;
  scientificName: string;
  description: string;
  category: string;
  wateringFrequency: number;
  sunlightHours: number;
  temperature: { min: number; max: number };
  humidity: number;
  soilType: string;
  fertilizer: string;
  commonIssues: string[];
  careInstructions: string;
  imageUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlantData {
  name: string;
  scientificName: string;
  description: string;
  category: string;
  wateringFrequency: number;
  sunlightHours: number;
  temperature: { min: number; max: number };
  humidity: number;
  soilType: string;
  fertilizer: string;
  commonIssues: string[];
  careInstructions: string;
  imageUrl?: string;
}

export interface UpdatePlantData extends Partial<CreatePlantData> {
  _id?: string;
}

export interface CareLog {
  _id: string;
  plantId: string;
  userId: string;
  action: string;
  notes: string;
  date: Date;
  createdAt: Date;
}

export interface CreateCareLogData {
  plantId: string;
  action: string;
  notes: string;
  date: Date;
}

export interface Reminder {
  _id: string;
  plantId: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  recurring: boolean;
  frequency: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateReminderData {
  plantId: string;
  type: string;
  title: string;
  description: string;
  dueDate: Date;
  recurring: boolean;
  frequency: number;
}

export interface UpdateReminderData extends Partial<CreateReminderData> {
  completed?: boolean;
}

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  conditions: string;
  forecast: Array<{
    date: Date;
    temp: number;
    conditions: string;
  }>;
}

export interface DashboardStats {
  totalPlants: number;
  activeReminders: number;
  overdueReminders: number;
  recentCareLogs: number;
  healthScore: number;
  growthRate: number;
  careActions: number;
  streakDays: number;
}

export interface CareTrend {
  month: string;
  watering: number;
  fertilizing: number;
  pruning: number;
  healthCheck: number;
}

export interface PlantHealthData {
  category: string;
  count: number;
  percentage: number;
}

export interface CareTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'plant_added' | 'care_logged' | 'reminder_completed' | 'reminder_overdue';
  title: string;
  description: string;
  timestamp: string;
  plantName?: string;
}

export interface AnalyticsData {
  dashboard: DashboardStats;
  careTrends: CareTrend[];
  plantHealth: PlantHealthData[];
  careTypeDistribution: CareTypeDistribution[];
  recentActivity: RecentActivity[];
}