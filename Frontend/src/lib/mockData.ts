// Mock data for development without backend
import type { Plant, User, CareLog, Reminder, WeatherData } from '../types/api';

export const mockPlants: Plant[] = [
  {
    _id: '1',
    name: 'Tomato Plant',
    scientificName: 'Solanum lycopersicum',
    description: 'A popular fruit vegetable that grows well in warm climates.',
    category: 'Vegetable',
    wateringFrequency: 2, // days
    sunlightHours: 6,
    temperature: { min: 15, max: 30 },
    humidity: 60,
    soilType: 'Well-draining loamy soil',
    fertilizer: 'Balanced NPK fertilizer every 2-3 weeks',
    commonIssues: ['Blossom end rot', 'Fungal diseases'],
    careInstructions: 'Water regularly, provide support as it grows.',
    imageUrl: '/placeholder.svg',
    userId: 'user1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    _id: '2',
    name: 'Basil',
    scientificName: 'Ocimum basilicum',
    description: 'An aromatic herb used in cooking.',
    category: 'Herb',
    wateringFrequency: 1,
    sunlightHours: 6,
    temperature: { min: 18, max: 25 },
    humidity: 50,
    soilType: 'Rich, well-draining soil',
    fertilizer: 'Light feeding every 4-6 weeks',
    commonIssues: ['Root rot from overwatering'],
    careInstructions: 'Pinch flowers to encourage leaf growth.',
    imageUrl: '/placeholder.svg',
    userId: 'user1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    _id: '3',
    name: 'Rose Bush',
    scientificName: 'Rosa',
    description: 'Beautiful flowering plant with thorns.',
    category: 'Flower',
    wateringFrequency: 3,
    sunlightHours: 8,
    temperature: { min: 10, max: 25 },
    humidity: 40,
    soilType: 'Rich, slightly acidic soil',
    fertilizer: 'Rose fertilizer in spring and summer',
    commonIssues: ['Aphids', 'Black spot disease'],
    careInstructions: 'Prune regularly, deadhead spent blooms.',
    imageUrl: '/placeholder.svg',
    userId: 'user1',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
  },
];

export const mockUsers: User[] = [
  {
    _id: 'user1',
    email: 'user@example.com',
    name: 'John Doe',
    role: 'user',
    profilePicture: '/placeholder.svg',
    preferences: {
      notifications: true,
      language: 'en',
      timezone: 'UTC',
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
  },
];

export const mockCareLogs: CareLog[] = [
  {
    _id: 'log1',
    plantId: '1',
    userId: 'user1',
    action: 'watering',
    notes: 'Watered thoroughly, soil was dry',
    date: new Date('2024-01-20'),
    createdAt: new Date('2024-01-20'),
  },
  {
    _id: 'log2',
    plantId: '1',
    userId: 'user1',
    action: 'fertilizing',
    notes: 'Applied balanced fertilizer',
    date: new Date('2024-01-18'),
    createdAt: new Date('2024-01-18'),
  },
];

export const mockReminders: Reminder[] = [
  {
    _id: 'rem1',
    plantId: '1',
    userId: 'user1',
    type: 'watering',
    title: 'Water Tomato Plant',
    description: 'Time to water your tomato plant',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    completed: false,
    recurring: true,
    frequency: 2, // days
    createdAt: new Date('2024-01-18'),
  },
  {
    _id: 'rem2',
    plantId: '2',
    userId: 'user1',
    type: 'watering',
    title: 'Water Basil',
    description: 'Basil needs watering',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    completed: false,
    recurring: true,
    frequency: 1,
    createdAt: new Date('2024-01-19'),
  },
];

export const mockWeather: WeatherData = {
  location: 'New York, NY',
  temperature: 22,
  humidity: 65,
  conditions: 'Partly cloudy',
  forecast: [
    { date: new Date(), temp: 22, conditions: 'Partly cloudy' },
    { date: new Date(Date.now() + 24 * 60 * 60 * 1000), temp: 25, conditions: 'Sunny' },
    { date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), temp: 20, conditions: 'Rainy' },
  ],
};

export const mockAnalytics = {
  dashboard: {
    totalPlants: 12,
    activeReminders: 8,
    overdueReminders: 2,
    recentCareLogs: 24,
    healthScore: 85,
    growthRate: 12,
    careActions: 84,
    streakDays: 15
  },
  careTrends: [
    { month: 'Jan', watering: 45, fertilizing: 12, pruning: 8, healthCheck: 15 },
    { month: 'Feb', watering: 52, fertilizing: 15, pruning: 6, healthCheck: 18 },
    { month: 'Mar', watering: 48, fertilizing: 18, pruning: 10, healthCheck: 20 },
    { month: 'Apr', watering: 55, fertilizing: 20, pruning: 12, healthCheck: 22 },
    { month: 'May', watering: 62, fertilizing: 25, pruning: 15, healthCheck: 25 },
    { month: 'Jun', watering: 58, fertilizing: 22, pruning: 18, healthCheck: 28 }
  ],
  plantHealth: [
    { category: 'Excellent', count: 5, percentage: 42 },
    { category: 'Good', count: 4, percentage: 33 },
    { category: 'Fair', count: 2, percentage: 17 },
    { category: 'Needs Attention', count: 1, percentage: 8 }
  ],
  careTypeDistribution: [
    { type: 'Watering', count: 156, percentage: 45 },
    { type: 'Fertilizing', count: 89, percentage: 26 },
    { type: 'Pruning', count: 67, percentage: 19 },
    { type: 'Health Check', count: 38, percentage: 10 }
  ],
  recentActivity: [
    {
      id: 'act1',
      type: 'care_logged' as const,
      title: 'Watered Monstera Deliciosa',
      description: '500ml of water applied',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      plantName: 'Monstera Deliciosa'
    },
    {
      id: 'act2',
      type: 'reminder_completed' as const,
      title: 'Completed watering reminder',
      description: 'Snake Plant watering reminder marked complete',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      plantName: 'Snake Plant'
    },
    {
      id: 'act3',
      type: 'plant_added' as const,
      title: 'Added new plant',
      description: 'Peace Lily added to your collection',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      plantName: 'Peace Lily'
    },
    {
      id: 'act4',
      type: 'care_logged' as const,
      title: 'Fertilized Tomato Plant',
      description: 'Applied balanced fertilizer',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      plantName: 'Tomato Plant'
    }
  ]
};