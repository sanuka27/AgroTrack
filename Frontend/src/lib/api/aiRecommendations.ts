import api, { getErrorMessage } from '../api';

export interface AiRecommendation {
  _id: string;
  userId?: string;
  plantId?: string;
  plantName?: string;
  imageUrl: string;
  description?: string;
  recommendations: any;
  detectionResults?: any;
  status?: string;
  createdAt: string;
}

export const aiRecommendationApi = {
  async getRecommendations(opts?: { plantId?: string; limit?: number }): Promise<AiRecommendation[]> {
    try {
      const params = new URLSearchParams();
      if (opts?.plantId) params.append('plantId', opts.plantId);
      if (opts?.limit) params.append('limit', String(opts.limit));
      const url = `/ai-recommendations${params.toString() ? `?${params.toString()}` : ''}`;
      const resp = await api.get(url);
      return resp.data?.data?.recommendations || [];
    } catch (err) {
      console.error('Error fetching AI recommendations:', getErrorMessage(err));
      return [];
    }
  }
};

export default aiRecommendationApi;
