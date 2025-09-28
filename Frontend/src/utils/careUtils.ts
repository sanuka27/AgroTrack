import { CareLog, CareType, CarePattern, PlantCareHistory, CareMetadata } from '@/types/care';
import { Plant } from '@/types/plant';

/**
 * Generate a unique ID for care logs
 */
export const generateCareLogId = (): string => {
  return `care_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new care log entry
 */
export const createCareLog = (
  plantId: string,
  careType: CareType,
  notes?: string,
  metadata?: CareMetadata,
  photos?: string[]
): CareLog => {
  const now = new Date().toISOString();
  
  return {
    id: generateCareLogId(),
    plantId,
    careType,
    date: now,
    notes,
    photos: photos || [],
    metadata,
    createdAt: now,
  };
};

/**
 * Get care logs for a specific plant
 */
export const getPlantCareLogs = (careLogs: CareLog[], plantId: string): CareLog[] => {
  return careLogs
    .filter(log => log.plantId === plantId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Get care logs by type
 */
export const getCareLogsByType = (careLogs: CareLog[], careType: CareType): CareLog[] => {
  return careLogs
    .filter(log => log.careType === careType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Get recent care logs (last 30 days)
 */
export const getRecentCareLogs = (careLogs: CareLog[], days: number = 30): CareLog[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return careLogs
    .filter(log => new Date(log.date) >= cutoffDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/**
 * Calculate care frequency for a plant
 */
export const calculateCareFrequency = (careLogs: CareLog[], plantId: string, careType: CareType): number => {
  const plantCareLog = careLogs
    .filter(log => log.plantId === plantId && log.careType === careType)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (plantCareLog.length < 2) return 0;

  const intervals: number[] = [];
  for (let i = 1; i < plantCareLog.length; i++) {
    const current = new Date(plantCareLog[i].date).getTime();
    const previous = new Date(plantCareLog[i - 1].date).getTime();
    const daysDiff = Math.floor((current - previous) / (1000 * 60 * 60 * 24));
    intervals.push(daysDiff);
  }

  // Return average interval in days
  return Math.round(intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length);
};

/**
 * Get care patterns for a plant
 */
export const getPlantCarePatterns = (careLogs: CareLog[], plantId: string): CarePattern[] => {
  const careTypes: CareType[] = ['watering', 'fertilizing', 'pruning', 'repotting', 'health-check'];
  const patterns: CarePattern[] = [];

  careTypes.forEach(careType => {
    const plantCareLogs = careLogs.filter(log => log.plantId === plantId && log.careType === careType);
    
    if (plantCareLogs.length > 0) {
      const lastCare = plantCareLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const averageFrequency = calculateCareFrequency(careLogs, plantId, careType);
      
      let frequency: CarePattern['frequency'] = 'as-needed';
      if (averageFrequency > 0) {
        if (averageFrequency <= 1) frequency = 'daily';
        else if (averageFrequency <= 7) frequency = 'weekly';
        else if (averageFrequency <= 14) frequency = 'bi-weekly';
        else if (averageFrequency <= 31) frequency = 'monthly';
        else frequency = 'seasonal';
      }

      let nextSuggestedDate: string | undefined;
      if (averageFrequency > 0) {
        const nextDate = new Date(lastCare.date);
        nextDate.setDate(nextDate.getDate() + averageFrequency);
        nextSuggestedDate = nextDate.toISOString();
      }

      patterns.push({
        careType,
        averageFrequency,
        lastCareDate: lastCare.date,
        nextSuggestedDate,
        frequency
      });
    }
  });

  return patterns;
};

/**
 * Generate comprehensive care history for a plant
 */
export const generatePlantCareHistory = (careLogs: CareLog[], plantId: string): PlantCareHistory => {
  const plantCareLogs = getPlantCareLogs(careLogs, plantId);
  const patterns = getPlantCarePatterns(careLogs, plantId);
  
  // Calculate overall average care frequency
  const frequencies = patterns
    .filter(p => p.averageFrequency > 0)
    .map(p => p.averageFrequency);
  const averageCareFrequency = frequencies.length > 0 
    ? Math.round(frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length)
    : 0;

  // Determine health trend based on recent care logs and health checks
  let healthTrend: PlantCareHistory['healthTrend'] = 'unknown';
  const recentHealthChecks = plantCareLogs
    .filter(log => log.careType === 'health-check' && log.metadata?.overallHealth)
    .slice(0, 3); // Last 3 health checks

  if (recentHealthChecks.length >= 2) {
    const latest = recentHealthChecks[0].metadata?.overallHealth;
    const previous = recentHealthChecks[1].metadata?.overallHealth;
    
    const healthValues = { excellent: 5, good: 4, fair: 3, poor: 2, critical: 1 };
    const latestValue = healthValues[latest as keyof typeof healthValues] || 3;
    const previousValue = healthValues[previous as keyof typeof healthValues] || 3;
    
    if (latestValue > previousValue) healthTrend = 'improving';
    else if (latestValue < previousValue) healthTrend = 'declining';
    else healthTrend = 'stable';
  }

  return {
    plantId,
    careLogs: plantCareLogs,
    patterns,
    totalCareEvents: plantCareLogs.length,
    lastCareDate: plantCareLogs.length > 0 ? plantCareLogs[0].date : undefined,
    averageCareFrequency,
    healthTrend
  };
};

/**
 * Get care statistics for analytics
 */
export const getCareStatistics = (careLogs: CareLog[]) => {
  const totalCareEvents = careLogs.length;
  const careTypeCount: Record<CareType, number> = {
    'watering': 0,
    'fertilizing': 0,
    'pruning': 0,
    'repotting': 0,
    'health-check': 0,
    'pest-treatment': 0,
    'soil-change': 0,
    'location-change': 0
  };

  careLogs.forEach(log => {
    careTypeCount[log.careType]++;
  });

  const mostCommonCareType = Object.entries(careTypeCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] as CareType;

  const recentCareLogs = getRecentCareLogs(careLogs, 30);
  const careFrequencyLast30Days = recentCareLogs.length;

  return {
    totalCareEvents,
    careTypeCount,
    mostCommonCareType,
    careFrequencyLast30Days,
    averageCarePerWeek: Math.round((careFrequencyLast30Days / 30) * 7 * 10) / 10,
  };
};

/**
 * Format care type for display
 */
export const formatCareType = (careType: CareType): string => {
  const typeNames: Record<CareType, string> = {
    'watering': '💧 Watering',
    'fertilizing': '🌱 Fertilizing',
    'pruning': '✂️ Pruning',
    'repotting': '🪴 Repotting',
    'health-check': '🩺 Health Check',
    'pest-treatment': '🐛 Pest Treatment',
    'soil-change': '🌱 Soil Change',
    'location-change': '📍 Location Change'
  };
  
  return typeNames[careType] || careType;
};

/**
 * Get care type color for UI
 */
export const getCareTypeColor = (careType: CareType): string => {
  const colors: Record<CareType, string> = {
    'watering': 'text-blue-600 bg-blue-50 border-blue-200',
    'fertilizing': 'text-green-600 bg-green-50 border-green-200',
    'pruning': 'text-orange-600 bg-orange-50 border-orange-200',
    'repotting': 'text-purple-600 bg-purple-50 border-purple-200',
    'health-check': 'text-pink-600 bg-pink-50 border-pink-200',
    'pest-treatment': 'text-red-600 bg-red-50 border-red-200',
    'soil-change': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    'location-change': 'text-indigo-600 bg-indigo-50 border-indigo-200'
  };
  
  return colors[careType] || 'text-gray-600 bg-gray-50 border-gray-200';
};