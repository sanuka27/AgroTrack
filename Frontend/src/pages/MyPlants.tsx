import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Leaf, Plus, Calendar, Droplets, Sun, Bell, TrendingUp, MessageSquare } from "lucide-react";

const MyPlants = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name || 'Gardener'}! 🌱
          </h1>
          <p className="text-muted-foreground">Your personalized plant care dashboard</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button variant="default" size="lg" asChild className="h-20 flex-col">
            <Link to="/plant-analysis">
              <Leaf className="w-8 h-8 mb-2" />
              AI Plant Analysis
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-20 flex-col">
            <Plus className="w-8 h-8 mb-2" />
            Add New Plant
          </Button>
          <Button variant="outline" size="lg" asChild className="h-20 flex-col">
            <Link to="/community">
              <MessageSquare className="w-8 h-8 mb-2" />
              Join Discussion
            </Link>
          </Button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Leaf className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Plants</p>
                  <p className="text-xl font-bold text-green-800">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Need Water</p>
                  <p className="text-xl font-bold text-blue-600">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Reminders</p>
                  <p className="text-xl font-bold text-orange-600">5</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Growth Score</p>
                  <p className="text-xl font-bold text-purple-600">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Notifications & Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-orange-500" />
                <span>Today's Care Reminders</span>
              </CardTitle>
              <CardDescription>Smart adaptive notifications for your plants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-800">Water your Monstera</p>
                    <p className="text-sm text-blue-600">Soil moisture is getting low</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Done</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-800">Move Snake Plant to brighter spot</p>
                    <p className="text-sm text-yellow-600">AI detected insufficient light</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Done</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="font-medium text-green-800">Fertilize Tomato plants</p>
                    <p className="text-sm text-green-600">Weekly feeding schedule</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Done</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Smart Suggestions</CardTitle>
              <CardDescription>Personalized care tips</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                <p className="text-sm font-medium text-green-800 mb-1">💡 Pro Tip</p>
                <p className="text-sm text-green-700">Your Fiddle Leaf Fig shows signs of overwatering. Reduce frequency by 2 days.</p>
              </div>
              
              <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                <p className="text-sm font-medium text-purple-800 mb-1">🌱 Growth Insight</p>
                <p className="text-sm text-purple-700">Plants near the east window are growing 23% faster this month!</p>
              </div>
              
              <div className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border">
                <p className="text-sm font-medium text-orange-800 mb-1">⚠️ Alert</p>
                <p className="text-sm text-orange-700">Basil leaves showing early pest signs. Check undersides.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plant Collection & Care History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-800">Your Plant Collection</CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Plant
                  </Button>
                </div>
                <CardDescription>Track care history and manage multiple plants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock plant cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Leaf className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Monstera Deliciosa</h3>
                            <p className="text-sm text-muted-foreground">Indoor • 2 years old</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Last watered:</span>
                            <span className="text-blue-600">2 days ago</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Health status:</span>
                            <span className="text-green-600">Excellent</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Growth rate:</span>
                            <span className="text-purple-600">+15% this month</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Sun className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Snake Plant</h3>
                            <p className="text-sm text-muted-foreground">Indoor • 1 year old</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Last watered:</span>
                            <span className="text-blue-600">1 week ago</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Health status:</span>
                            <span className="text-yellow-600">Needs light</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Growth rate:</span>
                            <span className="text-purple-600">+8% this month</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-green-800">Care History</CardTitle>
                <CardDescription>Recent plant care activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3 p-2 border-l-4 border-blue-400 bg-blue-50">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Watered Monstera</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 border-l-4 border-green-400 bg-green-50">
                  <Leaf className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Added Fiddle Leaf Fig</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 border-l-4 border-yellow-400 bg-yellow-50">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Moved plants for better light</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 border-l-4 border-purple-400 bg-purple-50">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Set fertilizer reminder</p>
                    <p className="text-xs text-muted-foreground">2 weeks ago</p>
                  </div>
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

export default MyPlants;
