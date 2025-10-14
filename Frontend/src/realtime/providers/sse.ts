import { RealtimeClient } from '../client';
import { RealtimeEvent, RealtimeSnapshot } from '../types';

export class SseRealtimeClient implements RealtimeClient {
  private subscribers: ((event: RealtimeEvent) => void)[] = [];
  private es: EventSource | null = null;

  constructor() {
    const url = `${window.location.origin.replace(/:\d+$/, '') || window.location.origin}/api/realtime/analytics`;
    try {
      this.es = new EventSource(url, { withCredentials: true } as any);
    } catch (err) {
      console.warn('SSE not available', err);
      this.es = null;
    }

    if (this.es) {
      this.es.addEventListener('analytics:update', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.emit({ type: 'metrics', data: { ...data, ts: Date.now() } } as any);
        } catch (err) {
          console.warn('Malformed SSE payload', err);
        }
      });

      this.es.addEventListener('analytics:error', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.emit({ type: 'activity', data: { id: 'err', kind: 'report_submitted', message: data.message, ts: Date.now() } } as any);
        } catch (err) {
          console.warn('Failed to parse SSE analytics:error payload', err);
        }
      });

      // Fallback to ping
      this.es.addEventListener('message', (e: MessageEvent) => {
        // no-op pings
      });
    }
  }

  subscribe(cb: (e: RealtimeEvent) => void): () => void {
    this.subscribers.push(cb);
    return () => {
      const idx = this.subscribers.indexOf(cb);
      if (idx > -1) this.subscribers.splice(idx, 1);
    };
  }

  async requestSnapshot(): Promise<RealtimeSnapshot> {
    // Try to fetch the latest dashboard snapshot from API
    try {
      const resp = await fetch('/api/analytics/dashboard', { credentials: 'include' });
      const json = await resp.json();
      if (json && json.data && json.data.analytics) {
        const analytics = json.data.analytics;
        return {
          metrics: {
            totalUsers: 0,
            activeUsers: 0,
            activePct: 0,
            pendingReports: analytics.reminders?.pending || 0,
            severityLabel: 'Normal',
            community: {
              engagementRate: analytics.community?.posts || 0,
              dailyActiveUsers: 0,
              postsPerDay: analytics.community?.posts || 0,
              reportRate: 0
            },
            ts: Date.now()
          },
          users: [],
          reports: [],
          content: [],
          activity: []
        } as RealtimeSnapshot;
      }
    } catch (err) {
        console.warn('Snapshot request error', err);
    }

    return {
      metrics: { totalUsers: 0, activeUsers: 0, activePct: 0, pendingReports: 0, severityLabel: 'Normal', community: { engagementRate: 0, dailyActiveUsers: 0, postsPerDay: 0, reportRate: 0 }, ts: Date.now() },
      users: [],
      reports: [],
      content: [],
      activity: []
    };
  }

  private emit(event: RealtimeEvent) {
    this.subscribers.forEach(cb => cb(event));
  }

  destroy() {
    if (this.es) this.es.close();
    this.subscribers.length = 0;
  }
}

export function createSseRealtimeClient(): RealtimeClient {
  return new SseRealtimeClient();
}
