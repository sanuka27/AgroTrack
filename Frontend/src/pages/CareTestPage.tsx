import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CareDashboard } from '@/components/CareDashboard';
import { PlantCareSystem } from '@/components/PlantCareSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plant } from '@/types/plant';
import { Activity, Leaf, TestTube } from 'lucide-react';
import mockApi from '@/lib/mockApi';

const CareTestPage = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlants = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await mockApi.plants.getAll();
        // Convert API plant format to frontend Plant format
        const convertedPlants: Plant[] = response.plants.map(apiPlant => ({
          id: apiPlant._id,
          name: apiPlant.name,
          category: apiPlant.category === 'Vegetable' ? 'Outdoor' :
                   apiPlant.category === 'Herb' ? 'Herb' :
                   apiPlant.category === 'Flower' ? 'Flower' : 'Indoor',
          sunlight: apiPlant.sunlightHours >= 8 ? "Full Sun" :
                   apiPlant.sunlightHours >= 6 ? "Partial Sun" : "Low Light",
          ageYears: undefined,
          wateringEveryDays: apiPlant.wateringFrequency,
          fertilizerEveryWeeks: undefined,
          soil: apiPlant.soilType,
          notes: apiPlant.careInstructions,
          imageUrl: apiPlant.imageUrl,
          lastWatered: undefined,
          health: "Good" as const,
          growthRatePctThisMonth: undefined,
        }));
        setPlants(convertedPlants);
      } catch (err) {
        console.error('Error loading plants:', err);
        setError('Failed to load plants. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPlants();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading plants...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">{error}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TestTube className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Care Logging System Test</h1>
              <p className="text-gray-600">Testing all Care Logging System components and features</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Full Dashboard</TabsTrigger>
            <TabsTrigger value="individual">Individual Plant Care</TabsTrigger>
            <TabsTrigger value="features">Feature Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Full Care Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Complete care management dashboard with analytics, timeline, reminders, and multi-plant overview
                </p>
                <CareDashboard 
                  plants={plants}
                  showAllPlants={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual" className="space-y-6">
            <div className="grid gap-6">
              {plants.map(plant => (
                <Card key={plant.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-green-600" />
                      {plant.name} - Individual Care System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Integrated care system widget for {plant.name} - {plant.category} plant
                    </p>
                    <PlantCareSystem plant={plant} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>🌟 Key Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>8 Care Types with detailed metadata</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Visual timeline with care history</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Smart analytics and pattern recognition</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span>Priority-based reminder system</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span>Health trend monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      <span>Photo documentation support</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🔧 Care Types Supported</CardTitle>
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
                  <CardTitle>📊 System Capabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-green-600">Data Tracking</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Detailed care metadata</li>
                        <li>• Photo attachments</li>
                        <li>• Notes and observations</li>
                        <li>• Timestamp tracking</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-600">Analytics</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Care frequency analysis</li>
                        <li>• Health trend detection</li>
                        <li>• Pattern recognition</li>
                        <li>• Statistical insights</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-purple-600">Automation</h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• Smart reminders</li>
                        <li>• Predictive scheduling</li>
                        <li>• Priority-based alerts</li>
                        <li>• Snooze functionality</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>🚀 Testing Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                      <strong>1. Test Care Logging:</strong> Click "Log Care Activity" buttons to add care entries with different metadata
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <strong>2. View Timeline:</strong> Check the timeline view to see care history with visual connectors
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                      <strong>3. Analytics:</strong> Switch to analytics tab to see care patterns and statistics
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                      <strong>4. Reminders:</strong> Check reminders tab for smart care suggestions (after adding logs)
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <strong>5. Integration:</strong> Test individual plant care widgets on the "Individual Plant Care" tab
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

export default CareTestPage;