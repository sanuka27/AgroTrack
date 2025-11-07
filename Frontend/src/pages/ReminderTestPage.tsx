import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SimpleReminders from '@/components/SimpleReminders';
import { ReminderSettings } from '@/components/ReminderSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plant, Category, Sunlight, Health } from '@/types/plant';
import { ReminderPreferences } from '@/types/reminders';
import { Bell, Settings, TestTube, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import Notifications from '../components/Notifications';
import { plantsApi } from '@/lib/api/plants';
import type { Plant as APIPlant } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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

const ReminderTestPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Fetch plants and care logs from real API with retry/backoff for rate limits
  useEffect(() => {
    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
    const MAX_RETRIES = 3;

    const fetchWithRetry = async <T,>(fn: () => Promise<T>, attempt = 0): Promise<T> => {
      try {
        return await fn();
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 429 && attempt < MAX_RETRIES) {
          const wait = 700 * Math.pow(2, attempt);
          console.warn(`Rate limited (429). Retrying in ${wait}ms... attempt ${attempt + 1}`);
          await sleep(wait);
          return fetchWithRetry(fn, attempt + 1);
        }
        throw err;
      }
    };

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch plants with retry
        const plantsResp = await fetchWithRetry(() => plantsApi.getPlants({ limit: 100 }));
        const convertedPlants = (plantsResp || []).map((p: any) => convertAPIPlantToPlant(p as APIPlant));
        setPlants(convertedPlants);

        setLastRefreshedAt(new Date());
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 429) {
          setError('Rate limited by the API (429). Please retry in a moment.');
        } else if (status === 401) {
          setError('Not authenticated. Please log in to view your real data.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };

    // Only attempt to fetch when authenticated; otherwise show login prompt
    if (isAuthenticated) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleRefresh = async () => {
    setError(null);
    setLoading(true);
    try {
      // Re-run the same fetch logic: fetch plants
      const plantsResp = await plantsApi.getPlants({ limit: 100 });
      const convertedPlants = (plantsResp || []).map((p: any) => convertAPIPlantToPlant(p as APIPlant));
      setPlants(convertedPlants);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = (preferences: ReminderPreferences) => {
    console.log('Saving reminder preferences:', preferences);
    localStorage.setItem('reminder-preferences', JSON.stringify(preferences));
    setShowSettings(false);
  };

  if (showSettings) {
    return (
      <div className="min-h-screen bg-background bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-green-950/20 dark:via-background dark:to-blue-950/20">
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
      <div className="min-h-screen bg-background bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-green-950/20 dark:via-background dark:to-blue-950/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading reminder system...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-green-950/20 dark:via-background dark:to-blue-950/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Retry</Button>
            {!isAuthenticated && (
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated state: Encourage login for real data (no mock fallback)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-green-950/20 dark:via-background dark:to-blue-950/20">
        <Header />
        <main className="container mx-auto px-4 py-20">
          <Card className="max-w-xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Smart Reminder System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Please log in to view your plants and personalized reminders.
              </p>
              <Button onClick={() => navigate('/login')}>Go to Login</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-green-950/20 dark:via-background dark:to-blue-950/20">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Data source indicator */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            {/* Data source indicator removed per design request */}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {lastRefreshedAt && (
              <div className="text-sm text-muted-foreground">Last refreshed: {lastRefreshedAt.toLocaleTimeString()}</div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TestTube className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Smart Reminder System Test</h1>
                <p className="text-muted-foreground">Testing intelligent plant care reminders and notifications</p>
              </div>
            </div>
            <Button onClick={() => setShowSettings(true)} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Reminder Dashboard</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Simple Reminders Dashboard - no complex UI */}
            <SimpleReminders plants={plants} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Notifications />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ReminderTestPage;