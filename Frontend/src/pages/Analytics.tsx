import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BarChart3, TrendingUp, Activity, PieChart, Droplets, Sun, Scissors } from "lucide-react";
import { mockApi } from "@/lib/mockApi";
import type { AnalyticsData } from "@/types/api";

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await mockApi.analytics.getDashboard();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error loading analytics:', error);
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-muted-foreground">Track your gardening progress and insights</p>
          </div>
          <div className="mt-3 md:mt-0">
            <Button variant="default" asChild className="w-full md:w-auto">
              <Link to="/plant-analysis">Plant Analysis</Link>
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                  <p className="text-xl font-bold text-green-800">+{analyticsData?.dashboard.growthRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Care Actions</p>
                  <p className="text-xl font-bold text-blue-600">{analyticsData?.dashboard.careActions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className="text-xl font-bold text-purple-600">{analyticsData?.dashboard.healthScore || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Streak Days</p>
                  <p className="text-xl font-bold text-orange-600">{analyticsData?.dashboard.streakDays || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Growth Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">Growth Analytics</CardTitle>
              <CardDescription>Track your plants' growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Care Trends (Last 6 Months)</h3>
                <div className="grid grid-cols-1 gap-3">
                  {analyticsData?.careTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-green-800">{trend.month}</div>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          <span>{trend.watering}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Sun className="w-4 h-4 text-yellow-500" />
                          <span>{trend.fertilizing}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Scissors className="w-4 h-4 text-red-500" />
                          <span>{trend.pruning}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Care Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">Care Statistics</CardTitle>
              <CardDescription>Your plant care patterns and habits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Care Type Distribution</h3>
                <div className="space-y-3">
                  {analyticsData?.careTypeDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.type === 'Watering' ? 'bg-blue-500' :
                          item.type === 'Fertilizing' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium">{item.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{item.count} times</span>
                        <span className="text-sm font-medium">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plant Health Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">Health Trends</CardTitle>
              <CardDescription>Monitor plant health over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Plant Health Distribution</h3>
                <div className="space-y-3">
                  {analyticsData?.plantHealth.map((health, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          health.category === 'Excellent' ? 'bg-green-500' :
                          health.category === 'Good' ? 'bg-blue-500' :
                          health.category === 'Fair' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium">{health.category}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">{health.count} plants</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              health.category === 'Excellent' ? 'bg-green-500' :
                              health.category === 'Good' ? 'bg-blue-500' :
                              health.category === 'Fair' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${health.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{health.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-800">Performance Metrics</CardTitle>
              <CardDescription>Overall gardening performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Performance Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-800">{analyticsData?.dashboard.totalPlants || 0}</div>
                    <div className="text-sm text-green-700">Total Plants</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-800">{analyticsData?.dashboard.activeReminders || 0}</div>
                    <div className="text-sm text-blue-700">Active Reminders</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-800">{analyticsData?.dashboard.recentCareLogs || 0}</div>
                    <div className="text-sm text-yellow-700">Recent Care Logs</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-800">{analyticsData?.dashboard.healthScore || 0}%</div>
                    <div className="text-sm text-purple-700">Avg Health Score</div>
                  </div>
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
