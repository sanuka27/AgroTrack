import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Flag, Activity } from 'lucide-react';
import { useRealtimeSnapshot } from '@/realtime/hooks';
import { RecentActivity } from '@/components/admin/RecentActivity';

export function Overview() {
  const { snapshot, isLoading } = useRealtimeSnapshot();

  if (isLoading || !snapshot) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { metrics } = snapshot;
  const monthlyGrowthPct = 15.2; // Mock calculation

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground animate-[countUp_0.5s_ease-out]">
                  {metrics.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">+{monthlyGrowthPct}% this month</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold text-foreground animate-[countUp_0.5s_ease-out]">
                  {metrics.activeUsers.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600">{metrics.activePct.toFixed(1)}% of total users</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Reports</p>
                <p className="text-3xl font-bold text-foreground animate-[countUp_0.5s_ease-out]">
                  {metrics.pendingReports}
                </p>
                <Badge 
                  variant={
                    metrics.severityLabel === 'Normal' ? 'secondary' :
                    metrics.severityLabel === 'Elevated' ? 'default' : 'destructive'
                  }
                  className="text-xs"
                >
                  {metrics.severityLabel}
                </Badge>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                metrics.severityLabel === 'Normal' ? 'bg-green-100' :
                metrics.severityLabel === 'Elevated' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Flag className={`h-6 w-6 ${
                  metrics.severityLabel === 'Normal' ? 'text-green-600' :
                  metrics.severityLabel === 'Elevated' ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                <p className="text-3xl font-bold text-foreground animate-[countUp_0.5s_ease-out]">
                  +{monthlyGrowthPct}%
                </p>
                <p className="text-xs text-green-600">vs last month</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Health Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl ring-1 ring-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Community Health</CardTitle>
            <CardDescription>Real-time community metrics and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600 animate-[countUp_0.5s_ease-out]">
                  {metrics.community.engagementRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 animate-[countUp_0.5s_ease-out]">
                  {metrics.community.dailyActiveUsers.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Daily Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 animate-[countUp_0.5s_ease-out]">
                  {metrics.community.postsPerDay}
                </p>
                <p className="text-sm text-muted-foreground">Posts/Day</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 animate-[countUp_0.5s_ease-out]">
                  {metrics.community.reportRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Report Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
            <CardDescription>Live system events</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
