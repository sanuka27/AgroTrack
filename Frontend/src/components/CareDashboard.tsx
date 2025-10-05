import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CareLogModal } from './CareLogModal';
import { CareTimeline } from './CareTimeline';
import { CareAnalytics } from './CareAnalytics';
import { CareReminders } from './CareReminders';
import { CareLog, CareType, PlantCareHistory, CareMetadata } from '@/types/care';
import { Plant } from '@/types/plant';
import {
  generatePlantCareHistory,
  createCareLog,
  getPlantCarePatterns,
  formatCareType
} from '@/utils/careUtils';
import { Plus, Calendar, BarChart3, Bell, History } from 'lucide-react';
import mockApi from '@/lib/mockApi';

interface CareDashboardProps {
  plants: Plant[];
  selectedPlantId?: string;
  showAllPlants?: boolean;
}

const CARE_STORAGE_KEY = 'agrotrack-care-logs';

export const CareDashboard: React.FC<CareDashboardProps> = ({
  plants,
  selectedPlantId,
  showAllPlants = false
}) => {
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [isAddingCare, setIsAddingCare] = useState(false);
  const [plantCareHistories, setPlantCareHistories] = useState<Record<string, PlantCareHistory>>({});
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);

  // Load care logs from mock API
  useEffect(() => {
    const loadCareLogs = async () => {
      try {
        setLoading(true);
        const allLogs: CareLog[] = [];

        // Get care logs for each plant
        for (const plant of plants) {
          try {
            const plantLogs = await mockApi.careLogs.getByPlant(plant.id);
            allLogs.push(...plantLogs);
          } catch (error) {
            console.error(`Error loading care logs for plant ${plant.id}:`, error);
          }
        }

        setCareLogs(allLogs);
      } catch (error) {
        console.error('Error loading care logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCareLogs();
  }, [plants]);

  // Generate plant care histories when care logs change
  useEffect(() => {
    const histories: Record<string, PlantCareHistory> = {};
    
    plants.forEach(plant => {
      const plantLogs = careLogs.filter(log => log.plantId === plant.id);
      if (plantLogs.length > 0) {
        histories[plant.id] = generatePlantCareHistory(careLogs, plant.id);
      }
    });
    
    setPlantCareHistories(histories);
  }, [careLogs, plants]);

  // Save care logs using mock API
  const saveCareLog = async (newLog: CareLog) => {
    try {
      // Convert frontend CareLog to API format
      const apiLogData = {
        plantId: newLog.plantId,
        action: newLog.careType, // Map careType to action
        notes: newLog.notes || '',
        date: newLog.date,
      };

      const createdLog = await mockApi.careLogs.create(apiLogData);

      // Convert back to frontend format and add to state
      const frontendLog: CareLog = {
        id: createdLog._id,
        plantId: createdLog.plantId,
        careType: createdLog.action as CareType, // Map back
        date: createdLog.date,
        notes: createdLog.notes,
        metadata: newLog.metadata, // Keep original metadata
        createdAt: createdLog.createdAt,
        updatedAt: createdLog.createdAt,
      };

      setCareLogs(prev => [...prev, frontendLog]);
    } catch (error) {
      console.error('Error saving care log:', error);
      // Fallback: just add to local state
      setCareLogs(prev => [...prev, newLog]);
    }
  };

  // Handle adding new care log
  const handleAddCare = (plantId: string, careType: CareType, metadata: CareMetadata, notes?: string) => {
    const newLog = createCareLog(plantId, careType, notes, metadata);
    saveCareLog(newLog);
    setIsAddingCare(false);
  };

  // Handle marking reminder as complete
  const handleMarkReminderComplete = (plantId: string, careType: CareType) => {
    // Create a basic care log to mark as complete
    const basicMetadata: CareMetadata = careType === 'watering' ? { waterAmount: 200, wateringMethod: 'top-watering' } :
                         careType === 'fertilizing' ? { fertilizerType: 'liquid', concentration: 'as-directed' } :
                         careType === 'health-check' ? { overallHealth: 'good' } : {};
    
    const newLog = createCareLog(plantId, careType, 'Marked complete from reminder', basicMetadata);
    saveCareLog(newLog);
  };

  // Handle snoozing reminder
  const handleSnoozeReminder = (plantId: string, careType: CareType, days: number) => {
    // In a real app, this would update the reminder system
    console.log(`Snoozing ${formatCareType(careType)} for ${plants.find(p => p.id === plantId)?.name} by ${days} days`);
  };

  // Filter care logs based on selected plant
  const filteredCareLogs = showAllPlants || !selectedPlantId 
    ? careLogs 
    : careLogs.filter(log => log.plantId === selectedPlantId);

  const selectedPlant = selectedPlantId ? plants.find(p => p.id === selectedPlantId) : null;
  const selectedPlantCareHistory = selectedPlantId ? plantCareHistories[selectedPlantId] : undefined;

  // Get reminder counts
  const getOverdueCount = () => {
    let count = 0;
    Object.values(plantCareHistories).forEach(history => {
      history.patterns.forEach(pattern => {
        if (pattern.nextSuggestedDate) {
          const dueDate = new Date(pattern.nextSuggestedDate);
          const isOverdue = dueDate.getTime() < Date.now() && !isToday(dueDate);
          if (isOverdue) count++;
        }
      });
    });
    return count;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const overdueCount = getOverdueCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Care Dashboard</h2>
          {selectedPlant ? (
            <p className="text-muted-foreground">Managing care for {selectedPlant.name}</p>
          ) : (
            <p className="text-muted-foreground">{showAllPlants ? 'All plants' : 'Select a plant to view care details'}</p>
          )}
        </div>
        <Button onClick={() => setIsAddingCare(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Log Care Activity
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Care Logs</p>
                <p className="text-2xl font-bold">{filteredCareLogs.length}</p>
              </div>
              <History className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {filteredCareLogs.filter(log => {
                    const logDate = new Date(log.date);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return logDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plants Tracked</p>
                <p className="text-2xl font-bold">
                  {new Set(filteredCareLogs.map(log => log.plantId)).size}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={overdueCount > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Care</p>
                <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : ''}`}>
                  {overdueCount}
                </p>
              </div>
              <Bell className={`w-8 h-8 ${overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Reminders
            {overdueCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {overdueCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <CareTimeline 
            careLogs={filteredCareLogs} 
            showPlantName={showAllPlants || !selectedPlantId}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <CareAnalytics 
            careLogs={filteredCareLogs}
            plantCareHistory={selectedPlantCareHistory}
            showOverallStats={true}
          />
        </TabsContent>

        <TabsContent value="reminders" className="mt-6">
          <CareReminders
            plants={plants}
            plantCareHistories={plantCareHistories}
            onMarkComplete={handleMarkReminderComplete}
            onSnooze={handleSnoozeReminder}
            showOnlyOverdue={false}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Care Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Calendar view coming soon</p>
                <p className="text-sm">Plan and schedule care activities</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Care Modal */}
      {isAddingCare && selectedPlant && (
        <CareLogModal
          open={isAddingCare}
          plant={selectedPlant}
          onSubmit={(careLog) => {
            saveCareLog(careLog);
            setIsAddingCare(false);
          }}
          onClose={() => setIsAddingCare(false)}
        />
      )}
      
      {/* If no plant selected, show plant selection */}
      {isAddingCare && !selectedPlant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Select a Plant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Please select a plant to log care for:</p>
              <div className="space-y-2">
                {plants.map(plant => (
                  <Button
                    key={plant.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      // Navigate to plant-specific care dashboard
                      setIsAddingCare(false);
                      // This would need to be handled by parent component
                    }}
                  >
                    {plant.name}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsAddingCare(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};