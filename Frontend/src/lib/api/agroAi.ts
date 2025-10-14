import api from '../api'; // your axios instance

export type PlantSuggestion = {
  category: string;
  sunlight: 'Full Sun' | 'Partial Sun' | 'Indirect Light' | 'Shade' | string;
  wateringFrequencyDays: number | null;
  fertilizerScheduleWeeks: number | null;
  soilType: string;
  notes: string;
};

export async function suggestPlantDefaults(plantName: string): Promise<PlantSuggestion> {
  const { data } = await api.post('/ai/plant/suggest', { plantName });
  if (!data?.success) throw new Error(data?.message || 'Failed to get suggestion');
  return data.data as PlantSuggestion;
}