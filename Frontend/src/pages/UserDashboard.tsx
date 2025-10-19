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
import api from '@/lib/api';
import { analyticsApi } from '@/lib/api/analytics';
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
import { PlantCard } from '@/components/PlantCard';
import { AISmartSuggestionsCard } from '@/components/AISmartSuggestionsCard';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Load analytics data from API
      try {
        const analytics = await analyticsApi.getDashboardAnalytics();
        // analyticsApi returns DashboardAnalytics; adapt to existing shape used in this component
        setAnalyticsData({
          dashboard: {
            totalPlants: analytics.totalPlants || 0,
            healthScore: Math.round(((analytics.healthyPlants || 0) / Math.max(1, analytics.totalPlants || 1)) * 100) || 0,
            activeReminders: analytics.upcomingReminders || 0,
            overdueReminders: analytics.overdueReminders || 0,
            recentCareLogs: analytics.careThisWeek || 0,
          },
          recentActivity: [],
        } as any);
      } catch (err) {
        console.warn('Failed to load analytics dashboard, falling back to minimal values', err);
      }

      // Load plants from API
      const plantsResp = await api.get('/plants?limit=100');
      const plantsList = plantsResp?.data?.data?.plants || plantsResp?.data?.plants || [];
      const convertedPlants = plantsList.map(convertAPIPlantToPlant);
      setPlants(convertedPlants);

      // Load care logs (attempt to use /care-logs or per-plant endpoint)
      const allCareLogs: CareLog[] = [];
      try {
        // Try global care-logs endpoint
        const careResp = await api.get('/care-logs');
        const careLogsData = careResp?.data?.data?.careLogs || careResp?.data || [];
        const converted = careLogsData.map((l: any) => convertAPICareLogToCareLog(l));
        allCareLogs.push(...converted);
      } catch (err) {
        // Fallback: fetch per-plant care logs
        for (const plant of plantsList) {
          try {
            const plantCareResp = await api.get(`/plants/${plant._id}/care-logs`);
            const plantCare = plantCareResp?.data?.data?.careLogs || plantCareResp?.data || [];
            const convertedLogs = plantCare.map((l: any) => convertAPICareLogToCareLog(l));
            allCareLogs.push(...convertedLogs);
          } catch (e) {
            // ignore per-plant failures
          }
        }
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

  // Plant CRUD helpers for the dashboard (minimal, keep functionality)
  const handleEditPlant = (plant: Plant) => {
    // Navigate to plants management page (user can edit there)
    navigate('/plants');
  };

  const handleDeletePlant = async (plantId: string) => {
    if (!confirm('Are you sure you want to delete this plant?')) return;
    try {
      await api.delete(`/plants/${plantId}`);
      setPlants(prev => prev.filter(p => p.id !== plantId));
    } catch (err) {
      console.error('Failed to delete plant:', err);
      // Do not crash dashboard; show toast or fallback in future
    }
  };

  const handleMarkWatered = (plantId: string) => {
    // Optimistic UI update: set lastWatered locally; backend care-log can be added separately
    setPlants(prev => prev.map(p => p.id === plantId ? { ...p, lastWatered: new Date().toISOString() } : p));
  };

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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Modern Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-600">
            Here's everything happening with your garden
          </p>
        </div>

        {/* Stats Overview - Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Plants</p>
                  <p className="text-3xl font-bold text-gray-900">{plants.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {analyticsData?.dashboard.healthScore || 0}% healthy
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Health Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData?.dashboard.healthScore || 0}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  (analyticsData?.dashboard.healthScore || 0) >= 80 ? 'bg-green-100' :
                  (analyticsData?.dashboard.healthScore || 0) >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <TrendingUp className={`w-6 h-6 ${
                    (analyticsData?.dashboard.healthScore || 0) >= 80 ? 'text-green-600' :
                    (analyticsData?.dashboard.healthScore || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
              <Progress value={analyticsData?.dashboard.healthScore || 0} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Reminders</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData?.dashboard.activeReminders || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm">
                {analyticsData?.dashboard.overdueReminders > 0 ? (
                  <span className="text-red-600 font-medium">
                    ⚠️ {analyticsData?.dashboard.overdueReminders} overdue
                  </span>
                ) : (
                  <span className="text-gray-500">All up to date</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Care Actions</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {analyticsData?.dashboard.recentCareLogs || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-gray-500">
                This week
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Add Plant Button */}
        <div className="mb-6">
          <Button 
            size="lg" 
            className="bg-green-600 hover:bg-green-700"
            asChild
          >
            <Link to="/plants">
              <Plus className="w-5 h-5 mr-2" />
              Add New Plant
            </Link>
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Plants (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Plants Section */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-green-600" />
                      My Plants
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {plants.length} {plants.length === 1 ? 'plant' : 'plants'} in your garden
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/plants">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {plants.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Leaf className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4">No plants yet</p>
                    <Button asChild>
                      <Link to="/plants">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Plant
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plants.slice(0, 5).map((plant) => (
                      <div
                        key={plant.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50/50 transition-all group"
                      >
                        {/* Plant Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {plant.imageUrl ? (
                            <img 
                              src={plant.imageUrl} 
                              alt={plant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              🌿
                            </div>
                          )}
                        </div>

                        {/* Plant Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1">{plant.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Sun className="w-4 h-4" />
                              {plant.sunlight}
                            </span>
                            <span className="flex items-center gap-1">
                              <Droplets className="w-4 h-4" />
                              Every {plant.wateringEveryDays}d
                            </span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => handleMarkWatered(plant.id)}
                          >
                            <Droplets className="w-4 h-4 mr-1" />
                            Water
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => handleEditPlant(plant)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                    {plants.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="link" asChild>
                          <Link to="/plants">
                            View all {plants.length} plants →
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Suggestions & Reminders (1/3 width) */}
          <div className="space-y-6">
            {/* AI Smart Suggestions */}
            <AISmartSuggestionsCard />

            {/* Active Reminders */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {activeReminders.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">All caught up! ✨</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeReminders.slice(0, 3).map((reminder) => {
                      const plant = plants.find(p => p.id === reminder.plantId);
                      const isOverdue = reminder.status === 'overdue';

                      return (
                        <div
                          key={reminder.id}
                          className={`p-3 rounded-lg border ${
                            isOverdue 
                              ? 'border-red-200 bg-red-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <div className={`p-1.5 rounded ${
                              isOverdue ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              {reminder.type === 'watering' && <Droplets className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />}
                              {reminder.type === 'fertilizing' && <Sun className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />}
                              {reminder.type === 'pruning' && <Leaf className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />}
                              {!['watering', 'fertilizing', 'pruning'].includes(reminder.type) && <Calendar className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 mb-1">
                                {plant?.name || 'Unknown Plant'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {reminder.title}
                              </p>
                              {isOverdue && (
                                <Badge variant="destructive" className="mt-1 text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button size="sm" className="w-full h-7 text-xs">
                            Mark Done
                          </Button>
                        </div>
                      );
                    })}
                    {activeReminders.length > 3 && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to="/reminder-test">
                          View all {activeReminders.length} reminders
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/community">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Community
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/reminder-test">
                      <Bell className="w-4 h-4 mr-2" />
                      All Reminders
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};


export default UserDashboard;