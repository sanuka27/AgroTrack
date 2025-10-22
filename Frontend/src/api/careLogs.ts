import api from '../lib/api';

export interface CareLog {
  _id: string;
  userId: string;
  plantId: string;
  careType: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'pestControl' | 'other';
  notes?: string;
  photos?: string[];
  careData?: Record<string, any>;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCareLogData {
  plantId: string;
  careType: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'pestControl' | 'other';
  notes?: string;
  photos?: string[];
  careData?: Record<string, any>;
  date?: string;
}

export interface UpdateCareLogData {
  careType?: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'pestControl' | 'other';
  notes?: string;
  photos?: string[];
  careData?: Record<string, any>;
  date?: string;
}

export const careLogsApi = {
  // Get all care logs for current user
  getAll: async (): Promise<CareLog[]> => {
    const response = await api.get('/care-logs');
    return response.data;
  },

  // Get care logs for a specific plant
  getByPlant: async (plantId: string): Promise<CareLog[]> => {
    const response = await api.get(`/care-logs/plant/${plantId}`);
    return response.data;
  },

  // Get a specific care log
  getById: async (id: string): Promise<CareLog> => {
    const response = await api.get(`/care-logs/${id}`);
    return response.data;
  },

  // Create a new care log
  create: async (data: CreateCareLogData): Promise<CareLog> => {
    const response = await api.post('/care-logs', data);
    return response.data;
  },

  // Update a care log
  update: async (id: string, data: UpdateCareLogData): Promise<CareLog> => {
    const response = await api.put(`/care-logs/${id}`, data);
    return response.data;
  },

  // Delete a care log
  delete: async (id: string): Promise<void> => {
    await api.delete(`/care-logs/${id}`);
  },

  // Get care logs by type
  getByType: async (careType: string): Promise<CareLog[]> => {
    const response = await api.get(`/care-logs/type/${careType}`);
    return response.data;
  },

  // Get care statistics
  getStatistics: async (): Promise<any> => {
    const response = await api.get('/care-logs/statistics');
    return response.data;
  },
};