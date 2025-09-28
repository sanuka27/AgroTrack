export type CareType = 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'health-check' | 'pest-treatment' | 'soil-change' | 'location-change';

export interface CareLog {
  id: string;
  plantId: string;
  careType: CareType;
  date: string; // ISO date string
  notes?: string;
  photos?: string[]; // Array of image URLs or base64 strings
  metadata?: CareMetadata;
  createdAt: string;
  updatedAt?: string;
}

export interface CareMetadata {
  // Watering specific
  waterAmount?: number; // ml
  wateringMethod?: 'spray' | 'bottom-watering' | 'top-watering' | 'soaking';
  
  // Fertilizing specific
  fertilizerType?: string;
  fertilizerBrand?: string;
  concentration?: string; // e.g., "half-strength", "quarter-strength"
  applicationMethod?: 'soil' | 'foliar' | 'slow-release';
  
  // Pruning specific
  pruningType?: 'deadheading' | 'shaping' | 'maintenance' | 'propagation';
  partsRemoved?: string[]; // e.g., ['dead leaves', 'brown tips']
  toolsUsed?: string[]; // e.g., ['scissors', 'pruning shears']
  
  // Repotting specific
  oldPotSize?: string;
  newPotSize?: string;
  soilType?: string;
  soilBrand?: string;
  rootCondition?: 'healthy' | 'root-bound' | 'root-rot' | 'needs-attention';
  drainageAdded?: boolean;
  
  // Health check specific
  overallHealth?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  symptoms?: string[]; // e.g., ['yellowing leaves', 'brown spots']
  measurements?: {
    height?: number; // cm
    width?: number; // cm
    leafCount?: number;
  };
  
  // Pest treatment specific
  pestType?: string; // e.g., 'aphids', 'spider mites'
  treatmentUsed?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  
  // Location change specific
  fromLocation?: string;
  toLocation?: string;
  reason?: string; // e.g., 'more light', 'better humidity'
}

export interface CareTemplate {
  id: string;
  name: string;
  careType: CareType;
  description: string;
  defaultMetadata?: Partial<CareMetadata>;
  isCustom: boolean;
}

export interface CarePattern {
  careType: CareType;
  averageFrequency: number; // days
  lastCareDate?: string;
  nextSuggestedDate?: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'seasonal' | 'as-needed';
}

export interface PlantCareHistory {
  plantId: string;
  careLogs: CareLog[];
  patterns: CarePattern[];
  totalCareEvents: number;
  lastCareDate?: string;
  averageCareFrequency: number; // days
  healthTrend: 'improving' | 'stable' | 'declining' | 'unknown';
}