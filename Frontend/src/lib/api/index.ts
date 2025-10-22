/**
 * API Modules Index
 * 
 * Central export point for all API service modules.
 * Import from this file to use any API service in your components.
 * 
 * @example
 * import { plantsApi, careLogsApi, usersApi } from '@/lib/api/index';
 */

export { plantsApi } from './plants';
// export { careLogsApi } from './careLogs'; // Removed - using src/api/careLogs.ts instead
export { usersApi } from './users';
export { remindersApi } from './reminders';
export { communityApi } from './community';
export { adminApi } from './admin';
export { analyticsApi } from './analytics';
export { bugReportsApi } from './bugReports';
export { contactApi } from './contact';
export { aiChatApi } from './aiChat';

// Note: Types should be imported from their source locations:
// - Plant types: import from '@/types/plant'
// - CareLog types: import from '@/types/care'
// - User types: import from '@/lib/api/users'
// - Other types: import from respective @/types/ modules
