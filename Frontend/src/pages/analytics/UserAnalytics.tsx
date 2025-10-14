import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { analyticsApi } from '@/lib/api/analytics';
import { realtime } from '@/realtime';

interface SimpleDashboard {
  totalPlants: number;
  healthScore: number;
  activeReminders: number;
  recentCareLogs: number;
}

const UserAnalytics: React.FC = () => {
  const [data, setData] = useState<SimpleDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await analyticsApi.getDashboardAnalytics();
        // Map backend analytics to simple dashboard
        const analytics = resp;
        setData({
          totalPlants: analytics.totalPlants || 0,
    healthScore: Math.round((analytics.healthyPlants && analytics.totalPlants) ? (analytics.healthyPlants / analytics.totalPlants) * 100 : 0),
          activeReminders: analytics.upcomingReminders || 0,
          recentCareLogs: analytics.totalCareLogs || 0
        });
      } catch (err) {
        console.error('Failed to load user analytics', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    load();

    // Subscribe to realtime analytics updates if available
    const unsubscribe = realtime.subscribe((event) => {
      if (event.type === 'metrics') {
        // Re-fetch the dashboard analytics to ensure latest counts
        load();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">No analytics available.</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Plants</CardTitle>
            <CardDescription>Your plants tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPlants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Score</CardTitle>
            <CardDescription>Average health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.healthScore}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Reminders</CardTitle>
            <CardDescription>Reminders you need to act on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeReminders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Care Logs</CardTitle>
            <CardDescription>Logs in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.recentCareLogs}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserAnalytics;
