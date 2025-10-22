import { CareLog } from '../api/careLogs';

export const formatCareType = (careType: string): string => {
  const types: Record<string, string> = {
    watering: 'Watering',
    fertilizing: 'Fertilizing',
    pruning: 'Pruning',
    repotting: 'Repotting',
    pestControl: 'Pest Control',
    other: 'Other'
  };
  return types[careType] || careType;
};

export const getCareTypeColor = (careType: string): string => {
  const colors: Record<string, string> = {
    watering: 'blue',
    fertilizing: 'green',
    pruning: 'orange',
    repotting: 'purple',
    pestControl: 'red',
    other: 'gray'
  };
  return colors[careType] || 'gray';
};

export const getCareTypeIcon = (careType: string): string => {
  const icons: Record<string, string> = {
    watering: '💧',
    fertilizing: '🌱',
    pruning: '✂️',
    repotting: '🪴',
    pestControl: '🐛',
    other: '📝'
  };
  return icons[careType] || '📝';
};

export const sortCareLogsByDate = (careLogs: CareLog[]): CareLog[] => {
  return [...careLogs].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};

export const groupCareLogsByMonth = (careLogs: CareLog[]): Record<string, CareLog[]> => {
  const grouped: Record<string, CareLog[]> = {};
  
  careLogs.forEach(log => {
    const date = new Date(log.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthYear]) {
      grouped[monthYear] = [];
    }
    grouped[monthYear].push(log);
  });
  
  return grouped;
};

export const getLastCareDate = (careLogs: CareLog[], careType?: string): Date | null => {
  const filtered = careType 
    ? careLogs.filter(log => log.careType === careType)
    : careLogs;
  
  if (filtered.length === 0) return null;
  
  const sorted = sortCareLogsByDate(filtered);
  return new Date(sorted[0].date);
};

export const getCareFrequency = (careLogs: CareLog[], careType: string, days: number = 30): number => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentLogs = careLogs.filter(log => 
    log.careType === careType && new Date(log.date) >= cutoffDate
  );
  
  return recentLogs.length;
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export const getCareStatistics = (careLogs: CareLog[]) => {
  const total = careLogs.length;
  const byType: Record<string, number> = {};
  
  careLogs.forEach(log => {
    byType[log.careType] = (byType[log.careType] || 0) + 1;
  });
  
  return {
    total,
    byType,
    mostCommon: Object.keys(byType).sort((a, b) => byType[b] - byType[a])[0] || null,
  };
};

export const calculateCareFrequency = (careLogs: CareLog[], careType: string, days: number = 30): number => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const relevantLogs = careLogs.filter(log => 
    log.careType === careType && new Date(log.date) >= cutoffDate
  );
  
  if (relevantLogs.length < 2) return 0;
  
  const sortedLogs = relevantLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const intervals: number[] = [];
  
  for (let i = 1; i < sortedLogs.length; i++) {
    const diffMs = new Date(sortedLogs[i].date).getTime() - new Date(sortedLogs[i-1].date).getTime();
    intervals.push(diffMs / (1000 * 60 * 60 * 24)); // Convert to days
  }
  
  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  return Math.round(avgInterval);
};

export const generatePlantCareHistory = (careLogs: CareLog[], plantId: string): any => {
  const plantLogs = careLogs.filter(log => log.plantId === plantId);
  const sortedLogs = sortCareLogsByDate(plantLogs);
  
  const history = {
    plantId,
    totalEntries: plantLogs.length,
    lastCareDate: sortedLogs.length > 0 ? sortedLogs[0].date : null,
    careTypes: {} as Record<string, any>,
    timeline: sortedLogs.map(log => ({
      date: log.date,
      careType: log.careType,
      notes: log.notes,
      photos: log.photos,
    })),
  };
  
  // Group by care type
  plantLogs.forEach(log => {
    if (!history.careTypes[log.careType]) {
      history.careTypes[log.careType] = {
        count: 0,
        lastDate: null,
        frequency: 0,
      };
    }
    history.careTypes[log.careType].count++;
    if (!history.careTypes[log.careType].lastDate || new Date(log.date) > new Date(history.careTypes[log.careType].lastDate)) {
      history.careTypes[log.careType].lastDate = log.date;
    }
  });
  
  // Calculate frequencies
  Object.keys(history.careTypes).forEach(careType => {
    history.careTypes[careType].frequency = calculateCareFrequency(plantLogs, careType);
  });
  
  return history;
};

export const createCareLog = (data: {
  plantId: string;
  careType: string;
  notes?: string;
  photos?: string[];
  careData?: Record<string, any>;
  date?: string;
}): CareLog => {
  return {
    _id: '', // Will be set by backend
    userId: '', // Will be set by backend
    plantId: data.plantId,
    careType: data.careType as CareLog['careType'],
    notes: data.notes,
    photos: data.photos,
    careData: data.careData,
    date: data.date || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const getPlantCarePatterns = (careLogs: CareLog[], plantId: string): any => {
  const plantLogs = careLogs.filter(log => log.plantId === plantId);
  
  if (plantLogs.length === 0) {
    return {
      plantId,
      hasData: false,
      patterns: [],
      recommendations: [],
    };
  }
  
  const patterns = {
    plantId,
    hasData: true,
    careTypes: {} as Record<string, any>,
    seasonalPatterns: {} as Record<string, number>,
    recommendations: [] as string[],
  };
  
  // Analyze care types
  plantLogs.forEach(log => {
    if (!patterns.careTypes[log.careType]) {
      patterns.careTypes[log.careType] = {
        frequency: calculateCareFrequency(plantLogs, log.careType),
        lastCare: getLastCareDate(plantLogs, log.careType),
        totalCount: 0,
      };
    }
    patterns.careTypes[log.careType].totalCount++;
    
    // Seasonal analysis
    const month = new Date(log.date).getMonth();
    patterns.seasonalPatterns[month] = (patterns.seasonalPatterns[month] || 0) + 1;
  });
  
  // Generate recommendations
  Object.entries(patterns.careTypes).forEach(([careType, data]: [string, any]) => {
    if (data.frequency > 14) { // More than 2 weeks
      patterns.recommendations.push(`Consider increasing ${formatCareType(careType)} frequency`);
    } else if (data.frequency < 3) { // Less than 3 days
      patterns.recommendations.push(`${formatCareType(careType)} is being done very frequently - check if necessary`);
    }
    
    const daysSinceLast = data.lastCare ? 
      Math.floor((new Date().getTime() - new Date(data.lastCare).getTime()) / (1000 * 60 * 60 * 24)) : 
      null;
    
    if (daysSinceLast && daysSinceLast > data.frequency * 2) {
      patterns.recommendations.push(`${formatCareType(careType)} is overdue`);
    }
  });
  
  return patterns;
};

export const getPlantCareLogs = (careLogs: CareLog[], plantId: string): CareLog[] => {
  return careLogs.filter(log => log.plantId === plantId);
};
