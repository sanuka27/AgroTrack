import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { Plant } from '@/types/plant';
import { CareLog } from '@/types/care';
import { Reminder, ReminderStatus, ReminderPreferences, SmartReminderConfig } from '@/types/reminders';
import { generateSmartReminders, getTodaysReminders, getOverdueReminders } from '@/utils/reminderUtils';
import { getPlantCareLogs } from '@/utils/careUtils';
import { mockApi } from '@/lib/mockApi';
import type { DashboardStats, RecentActivity, AnalyticsData } from '@/types/api';
import type { Plant as APIPlant, CareLog as APICareLog } from '@/types/api';
import type { Category, Sunlight, Health } from '@/types/plant';
import type { CareType } from '@/types/care';
import {
  Leaf,
  Plus,
  Bell,
  TrendingUp,
  Calendar,
  Droplets,
  Sun,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  MessageSquare,
  Settings,
  User,
  Activity
} from 'lucide-react';

// Type converters to transform API types to component types
const convertAPIPlantToPlant = (apiPlant: APIPlant): Plant => ({
  id: apiPlant._id,
  name: apiPlant.name,
  category: apiPlant.category as Category,
  sunlight: apiPlant.sunlightHours >= 6 ? 'Full Sun' : apiPlant.sunlightHours >= 4 ? 'Partial Sun' : 'Low Light',
  wateringEveryDays: apiPlant.wateringFrequency,
  health: 'Good' as Health,
  soil: apiPlant.soilType,
  imageUrl: apiPlant.imageUrl
});

const convertAPICareLogToCareLog = (apiLog: APICareLog): CareLog => ({
  id: apiLog._id,
  plantId: apiLog.plantId,
  careType: apiLog.action as CareType,
  date: typeof apiLog.date === 'string' ? apiLog.date : apiLog.date.toISOString(),
  notes: apiLog.notes,
  createdAt: typeof apiLog.createdAt === 'string' ? apiLog.createdAt : apiLog.createdAt.toISOString()
});

const UserDashboard = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [preferences, setPreferences] = useState<ReminderPreferences>({
    enabled: true,
    notificationMethods: ['browser'],
    advanceNoticeDays: 1,
    maxRemindersPerDay: 10,
    quietHours: { enabled: true, start: '22:00', end: '08:00' },
    plantSpecificSettings: {}
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Load analytics data from API
      const analytics = await mockApi.analytics.getDashboard();
      setAnalyticsData(analytics);

      // Load plants from API
      const plantsResponse = await mockApi.plants.getAll();
      const convertedPlants = plantsResponse.plants.map(convertAPIPlantToPlant);
      setPlants(convertedPlants);

      // Load care logs (we'll need to get them for each plant)
      const allCareLogs: CareLog[] = [];
      for (const plant of plantsResponse.plants) {
        const plantCareLogs = await mockApi.careLogs.getByPlant(plant._id);
        const convertedLogs = plantCareLogs.map(convertAPICareLogToCareLog);
        allCareLogs.push(...convertedLogs);
      }
      setCareLogs(allCareLogs);

      // Load reminder preferences from localStorage (keeping this for now as it's user-specific)
      const storedPreferences = localStorage.getItem('agrotrack:reminderPreferences');
      const prefs: ReminderPreferences = storedPreferences ? JSON.parse(storedPreferences) : preferences;
      setPreferences(prefs);

      // Generate smart reminders based on plants and care logs
      const smartReminders = generateSmartReminders(convertedPlants, allCareLogs, prefs);
      setReminders(smartReminders);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [preferences]);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'plant_added': return <Plus className="w-4 h-4 text-green-500" />;
      case 'care_logged': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'reminder_completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'reminder_overdue': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'plant_added': return 'border-green-200 bg-green-50';
      case 'care_logged': return 'border-blue-200 bg-blue-50';
      case 'reminder_completed': return 'border-green-200 bg-green-50';
      case 'reminder_overdue': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const activeReminders = reminders.filter(r =>
    r.status === 'pending' || r.status === 'overdue'
  ).slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {user?.name?.split(' ')[0] || 'Gardener'}! 🌱
              </h1>
              <p className="text-muted-foreground mt-2">
                Here's what's happening with your plants today
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/plants">
                  <Leaf className="w-4 h-4 mr-2" />
                  View All Plants
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.dashboard.totalPlants || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.dashboard.healthScore || 0}% healthy
              </p>
              <Progress value={analyticsData?.dashboard.healthScore || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Reminders</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.dashboard.activeReminders || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.dashboard.overdueReminders || 0} overdue
              </p>
              {analyticsData?.dashboard.overdueReminders > 0 && (
                <Badge variant="destructive" className="mt-2">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Action needed
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.dashboard.recentCareLogs || 0}</div>
              <p className="text-xs text-muted-foreground">
                Care actions this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.dashboard.healthScore || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Plant health average
              </p>
              <Progress value={analyticsData?.dashboard.healthScore || 0} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Reminders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Active Reminders
                    </CardTitle>
                    <CardDescription>
                      Upcoming care tasks for your plants
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/reminder-test">
                      View All
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeReminders.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">All caught up! No pending reminders.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeReminders.map((reminder) => {
                      const plant = plants.find(p => p.id === reminder.plantId);
                      const isOverdue = reminder.status === 'overdue';

                      return (
                        <div
                          key={reminder.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            isOverdue
                              ? 'border-red-200 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              isOverdue ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              {reminder.type === 'watering' && <Droplets className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />}
                              {reminder.type === 'fertilizing' && <Sun className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />}
                              {reminder.type === 'pruning' && <Leaf className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />}
                              <Calendar className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <p className="font-medium">
                                {reminder.title}
                                {isOverdue && <Badge variant="destructive" className="ml-2 text-xs">Overdue</Badge>}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {plant?.name || 'Unknown Plant'} • Due {new Date(reminder.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Snooze
                            </Button>
                            <Button size="sm">
                              Complete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {activeReminders.length >= 5 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" asChild>
                          <Link to="/reminders">
                            View All Reminders
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest updates from your garden
                    </CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/care-test">
                      View Timeline
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {analyticsData?.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analyticsData?.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className={`flex gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                            {new Date(activity.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature Access Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Plant Care Systems</CardTitle>
              <CardDescription>
                Access your implemented plant care features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-4 p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <div className="p-3 rounded-full bg-blue-500">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">Smart Reminders</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Intelligent plant care scheduling with seasonal adjustments
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/reminder-test" className="text-blue-700 border-blue-300 hover:bg-blue-50">
                        Manage Reminders
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg border bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <div className="p-3 rounded-full bg-green-500">
                    <Droplets className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900">Care Logging</h3>
                    <p className="text-sm text-green-700 mb-3">
                      Track watering, fertilizing, and all plant care activities
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/care-test" className="text-green-700 border-green-300 hover:bg-green-50">
                        Log Care
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                  <div className="p-3 rounded-full bg-purple-500">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900">Plant Management</h3>
                    <p className="text-sm text-purple-700 mb-3">
                      Advanced plant filtering, bulk operations, and care tracking
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/plants" className="text-purple-700 border-purple-300 hover:bg-purple-50">
                        Manage Plants
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access all your plant care features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Button asChild className="h-20 flex-col gap-2">
                  <Link to="/plants">
                    <Plus className="w-6 h-6" />
                    Add Plant
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/plants">
                    <Leaf className="w-6 h-6" />
                    My Plants
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/reminder-test">
                    <Bell className="w-6 h-6" />
                    Reminders
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/care-test">
                    <Droplets className="w-6 h-6" />
                    Care Logs
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/analytics">
                    <BarChart3 className="w-6 h-6" />
                    Analytics
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/assistant">
                    <MessageSquare className="w-6 h-6" />
                    AI Assistant
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/community">
                    <User className="w-6 h-6" />
                    Community
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/profile">
                    <User className="w-6 h-6" />
                    Profile
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2">
                  <Link to="/settings">
                    <Settings className="w-6 h-6" />
                    Settings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;