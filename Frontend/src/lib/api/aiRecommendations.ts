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
  },

  async saveAnalysis(data: {
    plantName: string;
    plantId?: string;
    imageUrl: string;
    description?: string;
    analysisData: any;
  }): Promise<AiRecommendation> {
    try {
      const resp = await api.post('/ai-recommendations/save', data);
      return resp.data?.data?.recommendation;
    } catch (err) {
      console.error('Error saving AI analysis:', getErrorMessage(err));
      throw err;
    }
  }
};

export default aiRecommendationApi;
