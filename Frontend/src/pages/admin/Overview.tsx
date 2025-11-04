import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Flag, Activity, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi, DashboardStats } from '@/api/admin';
import { RecentActivity } from '@/components/admin/RecentActivity';

export function Overview() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingReports, setPendingReports] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        console.log('📊 Loading dashboard data...');
        const [dashboardData, reportsCount] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getPendingReportsCount(),
        ]);
        console.log('✅ Dashboard data loaded:', dashboardData);
        console.log('📋 Pending reports count:', reportsCount);
        setStats(dashboardData);
        setPendingReports(reportsCount);
      } catch (error: any) {
        console.error('❌ Error loading dashboard:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [toast]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse rounded-2xl ring-1 ring-slate-200 shadow-sm">
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

  const totalUsers = stats.users.total;
  const activeUsers = stats.activity.dailyActiveUsers;
  const newUsersThisMonth = stats.users.newThisMonth;
  const monthlyGrowthPct = totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground animate-[countUp_0.5s_ease-out]">
                  {totalUsers.toLocaleString()}
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
                  {activeUsers.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600">{totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0'}% of total users</p>
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
                  {pendingReports}
                </p>
                <Badge
                  variant={
                    pendingReports < 5 ? 'secondary' :
                    pendingReports < 10 ? 'default' : 'destructive'
                  }
                  className="text-xs"
                >
                  {pendingReports < 5 ? 'Normal' :
                   pendingReports < 10 ? 'Elevated' : 'High'}
                </Badge>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                pendingReports < 5 ? 'bg-green-100' :
                pendingReports < 10 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Flag className={`h-6 w-6 ${
                  pendingReports < 5 ? 'text-green-600' :
                  pendingReports < 10 ? 'text-yellow-600' : 'text-red-600'
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

        <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Plants</p>
                <p className="text-3xl font-bold text-foreground animate-[countUp_0.5s_ease-out]">
                  {stats.content.plants.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-600">Tracked plants</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Leaf className="h-6 w-6 text-emerald-600" />
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
                  {activeUsers > 0 ? ((stats.content.posts / activeUsers) * 100).toFixed(1) : '0'}%
                </p>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 animate-[countUp_0.5s_ease-out]">
                  {activeUsers.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Daily Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 animate-[countUp_0.5s_ease-out]">
                  {stats.content.posts}
                </p>
                <p className="text-sm text-muted-foreground">Posts/Day</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600 animate-[countUp_0.5s_ease-out]">
                  {stats.content.posts > 0 ? ((pendingReports / stats.content.posts) * 100).toFixed(1) : '0'}%
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
