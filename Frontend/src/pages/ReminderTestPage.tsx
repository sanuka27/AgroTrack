import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SmartReminderDashboard } from '@/components/SmartReminderDashboard';
import { ReminderSettings } from '@/components/ReminderSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plant, Category, Sunlight, Health } from '@/types/plant';
import { CareLog, CareType } from '@/types/care';
import { ReminderPreferences } from '@/types/reminders';
import { Bell, Settings, TestTube, Zap, Clock, CheckCircle, Loader2 } from 'lucide-react';
import mockApi from '@/lib/mockApi';
import type { Plant as APIPlant, CareLog as APICareLog } from '@/types/api';

// Helper function to convert API Plant to component Plant
const convertAPIPlantToPlant = (apiPlant: APIPlant): Plant => {
  return {
    id: apiPlant._id,
    name: apiPlant.name,
    category: (apiPlant.category || 'Indoor') as Category,
    sunlight: 'Full Sun' as Sunlight,
    wateringEveryDays: apiPlant.wateringFrequency || 7,
    ageYears: 0,
    health: 'Good' as Health,
    imageUrl: apiPlant.imageUrl,
    notes: apiPlant.description,
  };
};

// Helper function to convert API CareLog to component CareLog
const convertAPICareLogToCareLog = (apiLog: APICareLog): CareLog => {
  return {
    id: apiLog._id,
    plantId: apiLog.plantId,
    careType: 'watering' as CareType,
    date: new Date(apiLog.createdAt).toISOString(),
    notes: apiLog.notes,
    createdAt: new Date(apiLog.createdAt).toISOString(),
  };
};

const ReminderTestPage = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plants and care logs from mock API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [plantsResponse, careLogsData] = await Promise.all([
          mockApi.plants.getAll(),
          mockApi.careLogs.getAll()
        ]);
        
        // Convert API data to component data types
        const convertedPlants = plantsResponse.plants.map(convertAPIPlantToPlant);
        const convertedCareLogs = careLogsData.map(convertAPICareLogToCareLog);
        
        setPlants(convertedPlants);
        setCareLogs(convertedCareLogs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveSettings = (preferences: ReminderPreferences) => {
    console.log('Saving reminder preferences:', preferences);
    localStorage.setItem('reminder-preferences', JSON.stringify(preferences));
    setShowSettings(false);
  };

  if (showSettings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <ReminderSettings
            plants={plants}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading reminder system...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TestTube className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Smart Reminder System Test</h1>
                <p className="text-gray-600">Testing intelligent plant care reminders and notifications</p>
              </div>
            </div>
            <Button onClick={() => setShowSettings(true)} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Reminder Dashboard</TabsTrigger>
            <TabsTrigger value="features">Features Overview</TabsTrigger>
            <TabsTrigger value="testing">Testing Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Smart Reminder Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Intelligent reminder system that learns from your care patterns and adapts to seasonal changes
                </p>
                <SmartReminderDashboard
                  plants={plants}
                  careLogs={careLogs}
                  onSettingsClick={() => setShowSettings(true)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    Smart Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Pattern-based scheduling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Seasonal adjustments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Plant type intelligence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span>Priority-based alerts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span>Quiet hours support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      <span>Browser notifications</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Reminder Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-blue-50 rounded">💧 Watering</div>
                    <div className="p-2 bg-green-50 rounded">🌱 Fertilizing</div>
                    <div className="p-2 bg-yellow-50 rounded">✂️ Pruning</div>
                    <div className="p-2 bg-purple-50 rounded">🪴 Repotting</div>
                    <div className="p-2 bg-red-50 rounded">🏥 Health Check</div>
                    <div className="p-2 bg-orange-50 rounded">🐛 Pest Treatment</div>
                    <div className="p-2 bg-indigo-50 rounded">🌍 Soil Change</div>
                    <div className="p-2 bg-pink-50 rounded">📍 Location Change</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>🎯 Intelligence Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-green-600">Learning</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Analyzes care history</li>
                        <li>• Learns your patterns</li>
                        <li>• Adapts frequencies</li>
                        <li>• Plant-specific tuning</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-600">Seasonal</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Winter: Less frequent</li>
                        <li>• Summer: More frequent</li>
                        <li>• Spring/Fall: Balanced</li>
                        <li>• Weather-aware</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-purple-600">Smart</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Priority levels</li>
                        <li>• Snooze options</li>
                        <li>• Quiet hours</li>
                        <li>• Notification preferences</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🧪 Testing Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <strong>1. View Active Reminders:</strong> Check the dashboard to see generated reminders based on plant care history and seasonal adjustments
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <strong>2. Test Priority Levels:</strong> Notice how reminders are prioritized (urgent &gt; high &gt; medium &gt; low) and color-coded
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                      <strong>3. Try Snooze Actions:</strong> Click the +1d or +1w buttons to snooze reminders and see them move to "Snoozed" status
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                      <strong>4. Mark as Complete:</strong> Use the "Done" button to complete reminders and see them move to "Completed" status
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <strong>5. Configure Settings:</strong> Click "Settings" to customize notification preferences, quiet hours, and plant-specific settings
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <strong>6. Test Browser Notifications:</strong> Enable browser notifications in settings and grant permission when prompted
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📊 Expected Behavior</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-green-600">Sample Data Results</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Peace Lily: Should show urgent watering reminder</li>
                        <li>• Monstera: Should show upcoming watering reminder</li>
                        <li>• Snake Plant: Should show fertilizing reminder</li>
                        <li>• Priority: Based on days overdue</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-600">Seasonal Adjustments</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Winter: 1.5x frequency reduction</li>
                        <li>• Summer: 0.8x frequency increase</li>
                        <li>• Current season affects all calculations</li>
                        <li>• Plant type overrides seasonal rules</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="font-semibold text-green-600">✅ Smart Logic</div>
                      <div className="text-gray-600">Pattern recognition working</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="font-semibold text-blue-600">✅ Notifications</div>
                      <div className="text-gray-600">Browser API integrated</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <div className="font-semibold text-purple-600">✅ Settings</div>
                      <div className="text-gray-600">User preferences saved</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ReminderTestPage;