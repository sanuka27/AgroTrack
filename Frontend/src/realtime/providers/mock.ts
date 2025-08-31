import { RealtimeClient } from '../client';
import { 
  RealtimeEvent, 
  RealtimeSnapshot, 
  MetricSnapshot, 
  UserRow, 
  ReportRow, 
  ContentRow, 
  ActivityRow 
} from '../types';

export class MockRealtimeClient implements RealtimeClient {
  private subscribers: ((event: RealtimeEvent) => void)[] = [];
  private currentData: RealtimeSnapshot;
  private metricsInterval?: NodeJS.Timeout;
  private randomEventInterval?: NodeJS.Timeout;

  constructor() {
    this.currentData = this.generateInitialData();
    this.startMetricsUpdates();
    this.startRandomEvents();
  }

  subscribe(cb: (e: RealtimeEvent) => void): () => void {
    this.subscribers.push(cb);
    return () => {
      const index = this.subscribers.indexOf(cb);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  async requestSnapshot(): Promise<RealtimeSnapshot> {
    return { ...this.currentData };
  }

  private emit(event: RealtimeEvent) {
    this.subscribers.forEach(cb => cb(event));
  }

  private generateInitialData(): RealtimeSnapshot {
    const users: UserRow[] = [
      { id: '1', name: 'Alice Johnson', email: 'alice@example.com', status: 'active', joinedAt: Date.now() - 86400000 * 30 },
      { id: '2', name: 'Bob Smith', email: 'bob@example.com', status: 'active', joinedAt: Date.now() - 86400000 * 15 },
      { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', status: 'pending', joinedAt: Date.now() - 86400000 * 2 },
      { id: '4', name: 'Diana Prince', email: 'diana@example.com', status: 'active', joinedAt: Date.now() - 86400000 * 7 },
      { id: '5', name: 'Eve Wilson', email: 'eve@example.com', status: 'banned', joinedAt: Date.now() - 86400000 * 60 }
    ];

    const reports: ReportRow[] = [
      { id: 'r1', reporter: 'Alice Johnson', targetId: 'post_123', reason: 'Spam content', status: 'open', createdAt: Date.now() - 3600000 },
      { id: 'r2', reporter: 'Bob Smith', targetId: 'user_456', reason: 'Inappropriate behavior', status: 'resolved', createdAt: Date.now() - 7200000 },
      { id: 'r3', reporter: 'Diana Prince', targetId: 'post_789', reason: 'Misinformation', status: 'open', createdAt: Date.now() - 1800000 }
    ];

    const content: ContentRow[] = [
      { id: 'c1', author: 'Alice Johnson', title: 'How to grow tomatoes indoors', category: 'Guides', status: 'visible', createdAt: Date.now() - 86400000 },
      { id: 'c2', author: 'Bob Smith', title: 'Best fertilizers for houseplants', category: 'Tips', status: 'visible', createdAt: Date.now() - 43200000 },
      { id: 'c3', author: 'Charlie Brown', title: 'My garden progress', category: 'Progress', status: 'flagged', createdAt: Date.now() - 21600000 }
    ];

    const activity: ActivityRow[] = [
      { id: 'a1', kind: 'user_joined', message: 'Charlie Brown joined the community', ts: Date.now() - 1800000 },
      { id: 'a2', kind: 'report_resolved', message: 'Report #r2 resolved by admin', ts: Date.now() - 3600000 },
      { id: 'a3', kind: 'report_submitted', message: 'New report submitted by Alice Johnson', ts: Date.now() - 7200000 }
    ];

    const activeUsers = users.filter(u => u.status === 'active').length;
    const totalUsers = users.length;
    const pendingReports = reports.filter(r => r.status === 'open').length;

    const metrics: MetricSnapshot = {
      totalUsers,
      activeUsers,
      activePct: (activeUsers / totalUsers) * 100,
      pendingReports,
      severityLabel: pendingReports <= 10 ? "Normal" : pendingReports <= 30 ? "Elevated" : "Critical",
      community: {
        engagementRate: 73.5,
        dailyActiveUsers: Math.floor(activeUsers * 0.8),
        postsPerDay: 12,
        reportRate: 2.1
      },
      ts: Date.now()
    };

    return { metrics, users, reports, content, activity };
  }

  private startMetricsUpdates() {
    this.metricsInterval = setInterval(() => {
      this.updateMetrics();
    }, 3000);
  }

  private startRandomEvents() {
    this.randomEventInterval = setInterval(() => {
      this.generateRandomEvent();
    }, Math.random() * 5000 + 5000); // 5-10 seconds
  }

  private updateMetrics() {
    const drift = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const jitter = (base: number, variance: number) => base + (Math.random() - 0.5) * variance;

    const oldMetrics = this.currentData.metrics;
    const totalUsers = Math.max(0, oldMetrics.totalUsers + drift(-1, 3));
    const activeUsers = Math.max(0, Math.min(totalUsers, oldMetrics.activeUsers + drift(-2, 5)));
    const pendingReports = Math.max(0, oldMetrics.pendingReports + drift(-2, 2));

    const newMetrics: MetricSnapshot = {
      totalUsers,
      activeUsers,
      activePct: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      pendingReports,
      severityLabel: pendingReports <= 10 ? "Normal" : pendingReports <= 30 ? "Elevated" : "Critical",
      community: {
        engagementRate: Math.max(0, Math.min(100, jitter(oldMetrics.community.engagementRate, 5))),
        dailyActiveUsers: Math.max(0, Math.floor(activeUsers * jitter(0.8, 0.2))),
        postsPerDay: Math.max(0, Math.floor(jitter(oldMetrics.community.postsPerDay, 3))),
        reportRate: Math.max(0, jitter(oldMetrics.community.reportRate, 1))
      },
      ts: Date.now()
    };

    this.currentData.metrics = newMetrics;
    this.emit({ type: 'metrics', data: newMetrics });
  }

  private generateRandomEvent() {
    const eventTypes = ['user', 'report', 'content', 'activity'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    switch (eventType) {
      case 'user':
        this.generateUserEvent();
        break;
      case 'report':
        this.generateReportEvent();
        break;
      case 'content':
        this.generateContentEvent();
        break;
      case 'activity':
        this.generateActivityEvent();
        break;
    }
  }

  private generateUserEvent() {
    const actions = ['add', 'update'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    if (action === 'add') {
      const newUser: UserRow = {
        id: `user_${Date.now()}`,
        name: this.generateRandomName(),
        email: `user${Date.now()}@example.com`,
        status: Math.random() > 0.7 ? 'pending' : 'active',
        joinedAt: Date.now()
      };
      
      this.currentData.users.unshift(newUser);
      this.emit({ type: 'users:add', data: newUser });
      
      // Generate activity
      const activity: ActivityRow = {
        id: `a_${Date.now()}`,
        kind: 'user_joined',
        message: `${newUser.name} joined the community`,
        ts: Date.now()
      };
      this.currentData.activity.unshift(activity);
      this.emit({ type: 'activity', data: activity });
      
    } else if (this.currentData.users.length > 0) {
      const userIndex = Math.floor(Math.random() * this.currentData.users.length);
      const user = { ...this.currentData.users[userIndex] };
      
      // Toggle status
      const statuses: UserRow['status'][] = ['active', 'banned', 'pending'];
      user.status = statuses[Math.floor(Math.random() * statuses.length)];
      
      this.currentData.users[userIndex] = user;
      this.emit({ type: 'users:update', data: user });
    }
  }

  private generateReportEvent() {
    const actions = ['add', 'update'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    if (action === 'add') {
      const reasons = ['Spam content', 'Inappropriate behavior', 'Misinformation', 'Copyright violation'];
      const newReport: ReportRow = {
        id: `r_${Date.now()}`,
        reporter: this.getRandomUserName(),
        targetId: `target_${Math.floor(Math.random() * 1000)}`,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        status: 'open',
        createdAt: Date.now()
      };
      
      this.currentData.reports.unshift(newReport);
      this.emit({ type: 'reports:add', data: newReport });
      
      // Generate activity
      const activity: ActivityRow = {
        id: `a_${Date.now()}`,
        kind: 'report_submitted',
        message: `New report submitted by ${newReport.reporter}`,
        ts: Date.now()
      };
      this.currentData.activity.unshift(activity);
      this.emit({ type: 'activity', data: activity });
      
    } else if (this.currentData.reports.length > 0) {
      const reportIndex = Math.floor(Math.random() * this.currentData.reports.length);
      const report = { ...this.currentData.reports[reportIndex] };
      
      if (report.status === 'open') {
        report.status = Math.random() > 0.5 ? 'resolved' : 'dismissed';
        
        this.currentData.reports[reportIndex] = report;
        this.emit({ type: 'reports:update', data: report });
        
        if (report.status === 'resolved') {
          const activity: ActivityRow = {
            id: `a_${Date.now()}`,
            kind: 'report_resolved',
            message: `Report #${report.id} resolved by admin`,
            ts: Date.now()
          };
          this.currentData.activity.unshift(activity);
          this.emit({ type: 'activity', data: activity });
        }
      }
    }
  }

  private generateContentEvent() {
    const actions = ['add', 'update'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    if (action === 'add') {
      const titles = [
        'Growing herbs on windowsill',
        'Best plants for beginners',
        'Seasonal planting guide',
        'Composting tips and tricks'
      ];
      const categories = ['Guides', 'Tips', 'Progress', 'Discussion'];
      
      const newContent: ContentRow = {
        id: `c_${Date.now()}`,
        author: this.getRandomUserName(),
        title: titles[Math.floor(Math.random() * titles.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        status: 'visible',
        createdAt: Date.now()
      };
      
      this.currentData.content.unshift(newContent);
      this.emit({ type: 'content:add', data: newContent });
      
    } else if (this.currentData.content.length > 0) {
      const contentIndex = Math.floor(Math.random() * this.currentData.content.length);
      const content = { ...this.currentData.content[contentIndex] };
      
      const statuses: ContentRow['status'][] = ['visible', 'flagged', 'removed'];
      content.status = statuses[Math.floor(Math.random() * statuses.length)];
      
      this.currentData.content[contentIndex] = content;
      this.emit({ type: 'content:update', data: content });
    }
  }

  private generateActivityEvent() {
    const activities = [
      'System maintenance completed',
      'Daily backup successful',
      'New feature deployed',
      'Security scan completed'
    ];
    
    const activity: ActivityRow = {
      id: `a_${Date.now()}`,
      kind: 'user_joined', // Generic activity
      message: activities[Math.floor(Math.random() * activities.length)],
      ts: Date.now()
    };
    
    this.currentData.activity.unshift(activity);
    this.emit({ type: 'activity', data: activity });
  }

  private generateRandomName(): string {
    const firstNames = ['Alex', 'Sam', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Avery'];
    const lastNames = ['Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }

  private getRandomUserName(): string {
    if (this.currentData.users.length === 0) {
      return this.generateRandomName();
    }
    
    const user = this.currentData.users[Math.floor(Math.random() * this.currentData.users.length)];
    return user.name;
  }

  destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.randomEventInterval) {
      clearInterval(this.randomEventInterval);
    }
    this.subscribers.length = 0;
  }
}

export function createMockRealtimeClient(): RealtimeClient {
  return new MockRealtimeClient();
}
