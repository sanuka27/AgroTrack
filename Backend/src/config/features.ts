export type FeatureFlag =
  | 'community'
  | 'communityForum'
  | 'carelogs'
  | 'reminders'
  | 'notifications'
  | 'analytics'
  | 'aiSuggestions'
  | 'exportImport';

const defaults: Record<FeatureFlag, boolean> = {
  community: false,
  communityForum: false,
  carelogs: false,
  reminders: true,
  notifications: true,
  analytics: false,
  aiSuggestions: true,
  exportImport: false,
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const env = process.env[`FEATURE_${flag.toUpperCase()}`];
  if (env == null) return defaults[flag];
  return env === '1' || env?.toLowerCase() === 'true';
}
