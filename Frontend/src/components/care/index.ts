// Core Care Logging System Components
export { CareLogModal } from '../CareLogModal';
export { CareTimeline } from '../CareTimeline';
export { CareAnalytics } from '../CareAnalytics';
export { CareReminders } from '../CareReminders';

// Integrated Care System Components
export { CareDashboard } from '../CareDashboard';
export { PlantCareSystem } from '../PlantCareSystem';

// Care System Types
export type {
  CareLog,
  CareType,
  CareMetadata,
  CarePattern,
  PlantCareHistory
} from '../../types/care';

// Care System Utilities
export {
  createCareLog,
  generatePlantCareHistory,
  getPlantCarePatterns,
  getCareStatistics,
  formatCareType,
  getCareTypeColor
} from '../../utils/careUtils';