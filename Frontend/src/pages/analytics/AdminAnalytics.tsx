import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { adminApi } from '@/api/admin';
import { Button } from '@/components/ui/button';

const AdminAnalytics: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getAnalyticsOverview();
        setOverview(data);
      } catch (err) {
        console.error('Failed to load admin analytics', err);
        setError('Failed to load admin analytics');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="p-6">Loading admin analytics...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Analytics</h2>
        <div>
          <Button variant="ghost" onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.users?.total || 0}</div>
            <div className="text-sm text-muted-foreground">Active: {overview?.users?.active || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Reports</CardTitle>
            <CardDescription>Reports awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.reports?.pending || 0}</div>
            <div className="text-sm text-muted-foreground">Total: {overview?.reports?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users</CardTitle>
            <CardDescription>DAU (last 24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.activity?.dailyActiveUsers || 0}</div>
            <div className="text-sm text-muted-foreground">Weekly: {overview?.activity?.weeklyActiveUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Uptime & errors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.performance?.uptime || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Error Rate: {overview?.performance?.errorRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Moderation Queue</CardTitle>
            <CardDescription>Jump to flagged content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">Flagged posts: {overview?.content?.flagged || 0}</div>
            <div className="mt-3">
              <Button asChild>
                <a href="/admin#content">Open Content Moderation</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Errors</CardTitle>
            <CardDescription>Logs and exceptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">Last error: {overview?.logs?.lastError || 'None'}</div>
            <div className="mt-3">
              <Button asChild>
                <a href="/admin#system">Open System Health</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backups</CardTitle>
            <CardDescription>Create/restore backups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">Last backup: {overview?.backups?.last || 'Unknown'}</div>
            <div className="mt-3">
              <Button onClick={async () => {
                try {
                  await adminApi.createBackup();
                  alert('Backup created');
                } catch (err) {
                  alert('Backup failed');
                }
              }}>Create Backup</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
