// Mock data for development without backend
import type { Plant, User, CareLog, Reminder, WeatherData, CommunityPost, Comment, CommunityStats, TrendingTopic } from '../types/api';

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

export const mockCommunityPosts: CommunityPost[] = [
  {
    _id: 'post1',
    author: {
      _id: 'user1',
      name: 'GreenThumb_2024',
      role: 'user',
      profilePicture: '/placeholder.svg'
    },
    title: 'My tomato plants are thriving this season!',
    content: 'Just wanted to share my success with cherry tomatoes. Using the AgroTrack recommendations really helped optimize my watering schedule. The AI suggestions for soil moisture levels were spot on!',
    likes: 23,
    comments: 7,
    isPinned: false,
    tags: ['tomatoes', 'success', 'watering'],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    _id: 'post2',
    author: {
      _id: 'user2',
      name: 'PlantWhisperer',
      role: 'user',
      profilePicture: '/placeholder.svg'
    },
    title: 'Need help with yellowing leaves on basil',
    content: 'My basil plants have been developing yellow leaves for the past week. I\'ve been following the AI recommendations but wondering if anyone has similar experience? Should I adjust the watering frequency?',
    likes: 12,
    comments: 15,
    isPinned: false,
    tags: ['basil', 'help', 'yellow-leaves', 'watering'],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    _id: 'post3',
    author: {
      _id: 'admin1',
      name: 'CommunityModerator',
      role: 'admin',
      profilePicture: '/placeholder.svg'
    },
    title: 'Weekly Plant Challenge: Herb Gardens',
    content: 'This week\'s challenge is all about herb gardens! Share your best herb growing tips and photos. Winner gets featured on our main page! Don\'t forget to use #HerbGardenChallenge in your posts.',
    likes: 45,
    comments: 23,
    isPinned: true,
    tags: ['challenge', 'herbs', 'featured'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    _id: 'post4',
    author: {
      _id: 'user3',
      name: 'UrbanGardener',
      role: 'user',
      profilePicture: '/placeholder.svg'
    },
    title: 'Vertical gardening in small spaces',
    content: 'Living in a small apartment but want to grow vegetables? Check out my vertical garden setup! Using recycled materials and the AgroTrack app to monitor everything.',
    likes: 31,
    comments: 9,
    isPinned: false,
    tags: ['vertical-gardening', 'urban', 'small-spaces'],
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
    updatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
  },
  {
    _id: 'post5',
    author: {
      _id: 'user4',
      name: 'SeedSaver',
      role: 'user',
      profilePicture: '/placeholder.svg'
    },
    title: 'Saving seeds from this season\'s harvest',
    content: 'Just finished harvesting my pepper plants and saved seeds for next year. Anyone else doing seed saving? What are your favorite varieties to save?',
    likes: 18,
    comments: 12,
    isPinned: false,
    tags: ['seeds', 'harvest', 'peppers'],
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
  }
];

export const mockComments: Comment[] = [
  {
    _id: 'comment1',
    postId: 'post2',
    author: {
      _id: 'user5',
      name: 'HerbExpert',
      role: 'user',
      profilePicture: '/placeholder.svg'
    },
    content: 'Yellow leaves on basil are often caused by overwatering. Try letting the soil dry out more between waterings. Also check if they\'re getting enough sunlight.',
    likes: 8,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    _id: 'comment2',
    postId: 'post2',
    author: {
      _id: 'user6',
      name: 'BasilLover',
      role: 'user',
      profilePicture: '/placeholder.svg'
    },
    content: 'I had the same issue! It was definitely overwatering. Now I only water when the top inch of soil is dry. Much better results!',
    likes: 5,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
  }
];

export const mockCommunityStats: CommunityStats = {
  totalMembers: 2847,
  postsToday: 42,
  totalLikes: 1234,
  activeUsers: 156
};

export const mockTrendingTopics: TrendingTopic[] = [
  { tag: 'TomatoTips', postCount: 234, trend: 'up' },
  { tag: 'HerbGarden', postCount: 187, trend: 'up' },
  { tag: 'PlantCare', postCount: 156, trend: 'stable' },
  { tag: 'GrowingTips', postCount: 98, trend: 'down' },
  { tag: 'PestControl', postCount: 76, trend: 'up' }
];