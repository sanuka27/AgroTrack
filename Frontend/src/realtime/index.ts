import { createMockRealtimeClient } from './providers/mock';
import { createSseRealtimeClient } from './providers/sse';

const provider = (import.meta.env.VITE_REALTIME || '').toString().toLowerCase();
export const realtime = provider === 'sse' ? createSseRealtimeClient() : createMockRealtimeClient();
