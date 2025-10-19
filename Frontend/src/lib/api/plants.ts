/**
 * Plants API Module
 * 
 * This module provides API methods for plant CRUD operations:
 * - Get all user's plants
 * - Get single plant by ID
 * - Create new plant (with image upload)
 * - Update existing plant
 * - Delete plant
 * - Search plants
 * - Get plant care schedule
 * 
 * Backend Endpoints: /api/plants
 * MongoDB Collection: plants
 */

import api, { getErrorMessage } from '../api';
import type { Plant } from '@/types/plant';

// Plant list response
interface PlantsListResponse {
  plants: Plant[];
  total: number;
  page: number;
  limit: number;
}

// Single plant response
interface PlantResponse {
  plant: Plant;
}

// Plant statistics response
interface PlantStatsResponse {
  totalPlants: number;
  healthyPlants: number;
  plantsNeedingCare: number;
  categories: Record<string, number>;
}

/**
 * Plants API Service
 */
export const plantsApi = {
  /**
   * Get all plants for the authenticated user
   * 
   * @param params - Query parameters for filtering and pagination
   * @returns Promise with array of plants
   * 
   * Example:
   * ```typescript
   * const plants = await plantsApi.getPlants({ category: 'houseplant', limit: 10 });
   * ```
   */
  async getPlants(params?: {
    category?: string;
    health?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Plant[]> {
    try {
      const response = await api.get<any>('/plants', { params });
      // Backend returns: { success, data: { plants, total, page, limit } }
      return response.data.data?.plants || response.data.plants || [];
    } catch (error) {
      console.error('Failed to fetch plants:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get a single plant by ID
   * 
   * @param id - Plant ID
   * @returns Promise with plant data
   */
  async getPlantById(id: string): Promise<Plant> {
    try {
      const response = await api.get<any>(`/plants/${id}`);
      // Backend returns: { success, data: { plant } }
      const plant = response.data.data?.plant || response.data.plant;
      
      if (!plant) {
        throw new Error('Plant not found');
      }
      return plant;
    } catch (error) {
      console.error('Failed to fetch plant:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Create a new plant
   * 
   * @param plantData - Plant data (can be FormData for image upload or plain object)
   * @returns Promise with created plant
   * 
   * Example:
   * ```typescript
   * const formData = new FormData();
   * formData.append('name', 'Monstera');
   * formData.append('species', 'Monstera deliciosa');
   * formData.append('category', 'houseplant');
   * formData.append('image', imageFile);
   * 
   * const newPlant = await plantsApi.createPlant(formData);
   * ```
   */
  async createPlant(plantData: FormData | Partial<Plant>): Promise<Plant> {
    try {
      const headers = plantData instanceof FormData 
        ? { 'Content-Type': 'multipart/form-data' }
        : {};

      const response = await api.post<any>(
        '/plants',
        plantData,
        { headers }
      );

      // Backend returns: { success, message, data: { plant } }
      const plant = response.data.data?.plant || response.data.plant;
      
      if (!plant) {
        throw new Error('Failed to create plant');
      }

      return plant;
    } catch (error) {
      console.error('Failed to create plant:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update an existing plant
   * 
   * @param id - Plant ID
   * @param plantData - Updated plant data
   * @returns Promise with updated plant
   */
  async updatePlant(id: string, plantData: FormData | Partial<Plant>): Promise<Plant> {
    try {
      const headers = plantData instanceof FormData 
        ? { 'Content-Type': 'multipart/form-data' }
        : {};

      const response = await api.put<any>(
        `/plants/${id}`,
        plantData,
        { headers }
      );

      // Backend returns: { success, message, data: { plant } }
      const plant = response.data.data?.plant || response.data.plant;
      
      if (!plant) {
        throw new Error('Failed to update plant');
      }

      return plant;
    } catch (error) {
      console.error('Failed to update plant:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete a plant
   * 
   * @param id - Plant ID
   * @returns Promise that resolves when plant is deleted
   */
  async deletePlant(id: string): Promise<void> {
    try {
      await api.delete(`/plants/${id}`);
    } catch (error) {
      console.error('Failed to delete plant:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Upload plant image
   * 
   * @param id - Plant ID
   * @param image - Image file
   * @returns Promise with updated plant
   */
  async uploadImage(id: string, image: File): Promise<Plant> {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await api.post<any>(
        `/plants/${id}/images`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Backend returns: { success, data: { plant } }
      const plant = response.data.data?.plant || response.data.plant;
      
      if (!plant) {
        throw new Error('Failed to upload image');
      }

      return plant;
    } catch (error) {
      console.error('Failed to upload image:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete plant image
   * 
   * @param id - Plant ID
   * @param imageUrl - Image URL to delete
   * @returns Promise with updated plant
   */
  async deleteImage(id: string, imageUrl: string): Promise<Plant> {
    try {
      const response = await api.delete<any>(
        `/plants/${id}/images`,
        { data: { imageUrl } }
      );

      // Backend returns: { success, data: { plant } }
      const plant = response.data.data?.plant || response.data.plant;
      
      if (!plant) {
        throw new Error('Failed to delete image');
      }

      return plant;
    } catch (error) {
      console.error('Failed to delete image:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Search plants
   * 
   * @param query - Search query
   * @returns Promise with matching plants
   */
  async searchPlants(query: string): Promise<Plant[]> {
    try {
      const response = await api.get<PlantsListResponse>('/plants/search', {
        params: { q: query }
      });
      return response.data.plants || [];
    } catch (error) {
      console.error('Failed to search plants:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get plant statistics
   * 
   * @returns Promise with plant statistics
   */
  async getPlantStats(): Promise<PlantStatsResponse> {
    try {
      const response = await api.get<PlantStatsResponse>('/plants/stats');
      if (!response.data) {
        throw new Error('Failed to get plant statistics');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to get plant stats:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get plant care schedule
   * 
   * @param id - Plant ID
   * @returns Promise with care schedule
   */
  async getCareSchedule(id: string): Promise<{
    nextWatering?: Date;
    nextFertilizing?: Date;
    nextPruning?: Date;
  }> {
    try {
      const response = await api.get(`/plants/${id}/schedule`);
      return response.data || {};
    } catch (error) {
      console.error('Failed to get care schedule:', getErrorMessage(error));
      throw error;
    }
  },
};

export default plantsApi;
