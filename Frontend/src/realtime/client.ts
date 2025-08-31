import { RealtimeEvent, RealtimeSnapshot } from './types';

export interface RealtimeClient {
  subscribe(cb: (e: RealtimeEvent) => void): () => void; // returns unsubscribe
  requestSnapshot(): Promise<RealtimeSnapshot>;
}
