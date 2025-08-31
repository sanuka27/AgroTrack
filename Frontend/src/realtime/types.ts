export type MetricSnapshot = {
  totalUsers: number;
  activeUsers: number;          // absolute
  activePct: number;            // 0..100
  pendingReports: number;
  severityLabel: "Normal" | "Elevated" | "Critical";
  community: {
    engagementRate: number;     // %
    dailyActiveUsers: number;
    postsPerDay: number;
    reportRate: number;         // %
  };
  ts: number; // epoch ms
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  status: "active" | "banned" | "pending";
  joinedAt: number;
};

export type ReportRow = {
  id: string;
  reporter: string;
  targetId: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: number;
};

export type ContentRow = {
  id: string;
  author: string;
  title: string;
  category: string;
  status: "visible" | "flagged" | "removed";
  createdAt: number;
};

export type ActivityRow = {
  id: string;
  kind: "report_resolved" | "user_joined" | "report_submitted";
  message: string;
  ts: number;
};

export type RealtimeEvent =
  | { type: "metrics"; data: MetricSnapshot }
  | { type: "users:add" | "users:update" | "users:remove"; data: UserRow }
  | { type: "reports:add" | "reports:update"; data: ReportRow }
  | { type: "content:add" | "content:update" | "content:remove"; data: ContentRow }
  | { type: "activity"; data: ActivityRow };

export type RealtimeSnapshot = {
  metrics: MetricSnapshot;
  users: UserRow[];
  reports: ReportRow[];
  content: ContentRow[];
  activity: ActivityRow[];
};
