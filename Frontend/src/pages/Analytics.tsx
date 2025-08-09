import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BarChart3, TrendingUp, Activity, PieChart } from "lucide-react";

const Analytics = () => {
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
                  <p className="text-xl font-bold text-green-800">+12%</p>
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
                  <p className="text-xl font-bold text-blue-600">84</p>
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
                  <p className="text-xl font-bold text-purple-600">92%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-bold text-orange-600">89%</p>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Coming Soon</h3>
                <p className="text-green-700">Detailed growth charts and analytics will be available here</p>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <Activity className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Coming Soon</h3>
                <p className="text-green-700">Care statistics and insights will be displayed here</p>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Coming Soon</h3>
                <p className="text-green-700">Health trend analysis and predictions</p>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <PieChart className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Coming Soon</h3>
                <p className="text-green-700">Performance metrics and recommendations</p>
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
