import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BarChart3, TrendingUp, Activity, PieChart } from "lucide-react";
import { analyticsApi } from '@/lib/api/analytics';
import type { AnalyticsData } from "@/types/api";

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        // Fetch analytics data from backend
        const [full, plantHealth, growth] = await Promise.all([
          analyticsApi.getFullDashboard().catch(() => null),
          analyticsApi.getPlantHealthSummary().catch(() => null),
          analyticsApi.getGrowthAnalytics().catch(() => null)
        ]);

        console.log('Analytics API responses:', { full, plantHealth, growth });

        const backendAnalytics = full?.analytics || {};

        // Derive counts
        const totalPlants = backendAnalytics?.plantOverview?.totalPlants ?? plantHealth?.totalPlants ?? 0;
        const healthyCount = (plantHealth?.healthDistribution?.excellent || 0) + (plantHealth?.healthDistribution?.good || 0);

        console.log('Data extraction:', {
          backendAnalytics,
          'backendAnalytics.plantOverview': backendAnalytics?.plantOverview,
          'backendAnalytics.plantOverview.totalPlants': backendAnalytics?.plantOverview?.totalPlants,
          'plantHealth.totalPlants': plantHealth?.totalPlants,
          totalPlants,
          healthyCount
        });

        const mapped: any = {
          dashboard: {
            totalPlants: totalPlants,
            activeReminders: backendAnalytics?.reminders?.pending ?? backendAnalytics?.reminders?.total ?? 0,
            overdueReminders: backendAnalytics?.reminders?.overdue ?? 0,
            recentCareLogs: backendAnalytics?.careActivity?.totalLogs ?? plantHealth?.recentCareLogs ?? 0,
            healthScore: totalPlants > 0 ? Math.round((healthyCount / totalPlants) * 100) : (plantHealth?.averageHealthScore ? Math.round(plantHealth.averageHealthScore) : 0),
            growthRate: growth?.averageGrowthRate ?? 0,
            careActions: backendAnalytics?.careActivity?.thisWeek ?? backendAnalytics?.careActivity?.totalLogs ?? 0,
            streakDays: 0,
          },
          careTrends: [],
          plantHealth: [],
          careTypeDistribution: [],
          recentActivity: []
        };

        console.log('Final mapped data:', mapped);
        setAnalyticsData(mapped);
      } catch (error) {
        console.error('Error loading analytics:', error);
        // Set fallback data with proper structure
        setAnalyticsData({
          dashboard: {
            totalPlants: 0,
            activeReminders: 0,
            overdueReminders: 0,
            recentCareLogs: 0,
            healthScore: 0,
            growthRate: 0,
            careActions: 0,
            streakDays: 0,
          },
          careTrends: [],
          plantHealth: [],
          careTypeDistribution: [],
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Analytics Overview</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Track your key gardening metrics and performance indicators at a glance
          </p>
        </div>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                  <p className="text-2xl font-bold text-green-800">+{analyticsData?.dashboard.growthRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Care Actions</p>
                  <p className="text-2xl font-bold text-blue-800">{analyticsData?.dashboard.careActions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className="text-2xl font-bold text-purple-800">{analyticsData?.dashboard.healthScore || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                  <PieChart className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Plants</p>
                  <p className="text-2xl font-bold text-orange-800">{analyticsData?.dashboard.totalPlants || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Reminders</p>
                  <p className="text-2xl font-bold text-indigo-800">{analyticsData?.dashboard.activeReminders || 0}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recent Care Logs</p>
                  <p className="text-2xl font-bold text-teal-800">{analyticsData?.dashboard.recentCareLogs || 0}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Tasks</p>
                  <p className="text-2xl font-bold text-red-800">{analyticsData?.dashboard.overdueReminders || 0}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analytics;
