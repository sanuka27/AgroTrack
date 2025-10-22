import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CareLogModal } from './CareLogModal';
import { CareTimeline } from './CareTimeline';
import { CareAnalytics } from './CareAnalytics';
import { CareLog, PlantCareHistory } from '@/types/care';
import { Plant } from '@/types/plant';
import { generatePlantCareHistory } from '@/utils/careUtils';
import { Plus, TrendingUp, Calendar, Activity } from 'lucide-react';
import { careLogsApi } from '@/api/careLogs';
import type { CareLog as APICareLog, UpdateCareLogData } from '@/api/careLogs';
import { CareType } from '@/types/care';

// Mapping between frontend CareType and API careType
const mapFrontendToApiCareType = (careType: CareType): 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'pestControl' | 'other' => {
  switch (careType) {
    case 'watering': return 'watering';
    case 'fertilizing': return 'fertilizing';
    case 'pruning': return 'pruning';
    case 'repotting': return 'repotting';
    case 'pest-treatment': return 'pestControl';
    case 'soil-change': return 'repotting';
    case 'location-change': return 'other';
    case 'health-check': return 'other';
    default: return 'other';
  }
};

const mapApiToFrontendCareType = (careType: string): CareType => {
  switch (careType) {
    case 'watering': return 'watering';
    case 'fertilizing': return 'fertilizing';
    case 'pruning': return 'pruning';
    case 'repotting': return 'repotting';
    case 'pestControl': return 'pest-treatment';
    default: return 'health-check'; // Default for 'other' or unknown
  }
};

// Type converter to transform API CareLog to component CareLog
const convertAPICareLogToCareLog = (apiLog: APICareLog): CareLog => ({
  id: apiLog._id,
  plantId: apiLog.plantId,
  careType: mapApiToFrontendCareType(apiLog.careType),
  date: apiLog.date,
  notes: apiLog.notes,
  photos: apiLog.photos,
  metadata: apiLog.careData, // Map careData to metadata
  createdAt: apiLog.createdAt,
  updatedAt: apiLog.updatedAt
});

interface PlantCareSystemProps {
  plant: Plant;
  className?: string;
}

export const PlantCareSystem: React.FC<PlantCareSystemProps> = ({
  plant,
  className = ''
}) => {
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [isAddingCare, setIsAddingCare] = useState(false);
  const [plantCareHistory, setPlantCareHistory] = useState<PlantCareHistory | undefined>();
  const [activeTab, setActiveTab] = useState<'timeline' | 'analytics'>('timeline');
  const [loading, setLoading] = useState(true);

  // Load care logs from API
  useEffect(() => {
    const loadCareLogs = async () => {
      try {
        setLoading(true);
        const plantLogs = await careLogsApi.getByPlant(plant.id);
        const convertedLogs = plantLogs.map(convertAPICareLogToCareLog);
        setCareLogs(convertedLogs);
      } catch (error) {
        console.error('Error loading care logs:', error);
        setCareLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadCareLogs();
  }, [plant.id]);

  // Generate plant care history when care logs change
  useEffect(() => {
    if (careLogs.length > 0) {
      const apiLogs = careLogs.map(log => ({
        _id: log.id,
        plantId: log.plantId,
        userId: '', // Not needed for history generation
        careType: mapFrontendToApiCareType(log.careType),
        notes: log.notes,
        photos: log.photos,
        careData: log.metadata,
        date: log.date,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt
      }));
      const history = generatePlantCareHistory(apiLogs, plant.id);
      setPlantCareHistory(history);
    } else {
      setPlantCareHistory(undefined);
    }
  }, [careLogs, plant.id]);

  // Save care logs using API
  const saveCareLog = async (newLog: CareLog) => {
    try {
      // Convert frontend CareLog to API format
      const apiLogData = {
        plantId: newLog.plantId,
        careType: mapFrontendToApiCareType(newLog.careType),
        notes: newLog.notes || '',
        photos: newLog.photos,
        careData: newLog.metadata, // Map metadata to careData
        date: newLog.date,
      };

      const createdLog = await careLogsApi.create(apiLogData);

      // Convert back to frontend format and add to state
      const frontendLog: CareLog = {
        id: createdLog._id,
        plantId: createdLog.plantId,
        careType: mapApiToFrontendCareType(createdLog.careType),
        date: createdLog.date,
        notes: createdLog.notes,
        photos: createdLog.photos,
        metadata: createdLog.careData, // Map careData back to metadata
        createdAt: createdLog.createdAt,
        updatedAt: createdLog.updatedAt
      };

      setCareLogs(prev => [...prev, frontendLog]);
    } catch (error) {
      console.error('Error saving care log:', error);
      // Fallback: just add to local state
      setCareLogs(prev => [...prev, newLog]);
    }
  };

  const recentCareLogs = careLogs.slice(0, 5);
  const totalCareEvents = careLogs.length;
  const thisWeekCount = careLogs.filter(log => {
    const logDate = new Date(log.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  }).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Care Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Care History
            </CardTitle>
            <Button 
              onClick={() => setIsAddingCare(true)}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Care
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {totalCareEvents === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No care history yet</p>
              <p className="text-sm">Start logging care activities to track your plant's health</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{totalCareEvents}</p>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{thisWeekCount}</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
                <div className="text-center">
                  {plantCareHistory && (
                    <>
                      <Badge 
                        className={
                          plantCareHistory.healthTrend === 'improving' ? 'bg-green-100 text-green-800' :
                          plantCareHistory.healthTrend === 'declining' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        {plantCareHistory.healthTrend}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">Health Trend</p>
                    </>
                  )}
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b">
                <Button
                  variant={activeTab === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('timeline')}
                  className="rounded-b-none"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Timeline
                </Button>
                <Button
                  variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('analytics')}
                  className="rounded-b-none"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </div>

              {/* Tab Content */}
              {activeTab === 'timeline' && (
                <div className="mt-4">
                  <CareTimeline 
                    careLogs={recentCareLogs}
                    maxEntries={5}
                    showPlantName={false}
                  />
                  {careLogs.length > 5 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" size="sm">
                        View All {careLogs.length} Entries
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'analytics' && plantCareHistory && (
                <div className="mt-4">
                  <CareAnalytics 
                    careLogs={careLogs}
                    plantCareHistory={plantCareHistory}
                    showOverallStats={false}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Care Modal */}
      {isAddingCare && (
        <CareLogModal
          isOpen={isAddingCare}
          plantId={plant.id}
          onSave={async (data) => {
            // Create the care log using the API
            const createdLog = await careLogsApi.create(data as any);
            const frontendLog = convertAPICareLogToCareLog(createdLog);
            setCareLogs(prev => [...prev, frontendLog]);
            setIsAddingCare(false);
          }}
          onClose={() => setIsAddingCare(false)}
        />
      )}
    </div>
  );
};