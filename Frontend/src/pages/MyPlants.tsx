import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { AddPlantModal } from "@/components/AddPlantModal";
import { PlantCard } from "@/components/PlantCard";
import { PlantFiltersComponent, PlantFilters } from "@/components/PlantFilters";
import { WaterReminderDialog } from "@/components/WaterReminderDialog";
import { FertilizerReminderDialog } from "@/components/FertilizerReminderDialog";
import { Plant, Category } from "@/types/plant";
import type { Plant as ApiPlant } from "@/types/api";
import { filterAndSortPlants } from "@/utils/plantFiltering";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { exportPlantsToCSV, exportPlantsToJSON } from "@/utils/exportUtils";
import { BulkOperationsBar } from "@/components/BulkOperationsBar";
import { useSearchDebounce } from "@/hooks/use-search";
import { Leaf, Plus, Calendar, Droplets, Sun, Bell, TrendingUp, MessageSquare, CheckSquare, Square, AlertTriangle, Activity, Scissors, Sprout, Bug } from "lucide-react";
import api from '@/lib/api';
import plantsApi from '@/lib/api/plants';
import { uploadPlantImage } from '@/utils/firebaseStorage';
import { analyticsApi } from '@/lib/api/analytics';
import { remindersApi, Reminder as ReminderType } from '@/lib/api/reminders';
import aiRecommendationApi, { AiRecommendation } from '@/lib/api/aiRecommendations';
import { useToast } from '@/hooks/use-toast';
import { normalizeImageUrl } from '@/lib/utils';

// Helper function to map API category to frontend Category type
const mapCategory = (apiCategory: string): Category => {
  const categoryMap: Record<string, Category> = {
    'Vegetable': 'Outdoor',
    'Herb': 'Herb',
    'Flower': 'Flower',
    'Tree': 'Tree',
    'Indoor': 'Indoor',
    'Outdoor': 'Outdoor',
    'Succulent': 'Succulent',
  };
  return categoryMap[apiCategory] || 'Outdoor';
};

// Normalize frontend category labels to backend enum values
const mapToApiCategory = (frontendCategory: string): string => {
  const c = (frontendCategory || '').toLowerCase();
  if (c === 'houseplant' || c === 'indoor') return 'Indoor';
  if (c === 'outdoor') return 'Outdoor';
  if (c === 'succulent') return 'Succulent';
  if (c === 'herb') return 'Herb';
  if (c === 'flower') return 'Flower';
  if (c === 'tree') return 'Tree';
  if (c === 'shrub') return 'Shrub';
  if (c === 'vegetable') return 'Vegetable';
  return 'Other';
};

const MyPlants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plants, setPlants] = useState<Plant[]>([]);
  const LOCAL_STORAGE_PLANTS_KEY = 'agrotrack:plants';

  const savePlantsToLocalStorage = (list: Plant[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PLANTS_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore storage errors
      console.warn('Failed to save plants to localStorage', e);
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [viewingPlant, setViewingPlant] = useState<Plant | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [reminderPlant, setReminderPlant] = useState<Plant | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [fertilizerReminderPlant, setFertilizerReminderPlant] = useState<Plant | null>(null);
  const [isFertilizerReminderDialogOpen, setIsFertilizerReminderDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [upcomingReminders, setUpcomingReminders] = useState<ReminderType[]>([]);
  const [overdueReminders, setOverdueReminders] = useState<ReminderType[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<PlantFilters>({
    search: '',
    healthStatus: 'all',
    category: 'all',
    careNeeds: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Bulk selection management
  const {
    selectedCount,
    selectedItems,
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    isAllSelected,
    isSomeSelected
  } = useBulkSelection(plants);

  // Filtered and sorted plants
  const filteredPlants = filterAndSortPlants(plants, filters);

  // Load plants from backend API on mount
  useEffect(() => {
    const loadPlants = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[MyPlants] Fetching plants from API: /plants?limit=100');
        const resp = await api.get('/plants?limit=100');
        console.log('[MyPlants] API response:', resp?.data);
        const responsePlants: ApiPlant[] = resp?.data?.data?.plants || resp?.data?.plants || [];
        console.log('[MyPlants] Raw API plants count:', responsePlants.length);
        const convertedPlants: Plant[] = responsePlants.map((apiPlant: ApiPlant) => ({
          id: apiPlant._id,
          name: apiPlant.name,
          category: mapCategory(apiPlant.category),
          sunlight: (apiPlant.sunlightHours ?? 4) >= 8 ? "Full Sun" : (apiPlant.sunlightHours ?? 4) >= 6 ? "Partial Sun" : "Low Light",
          ageYears: (apiPlant as any).ageYears ?? undefined,
          wateringEveryDays: apiPlant.wateringFrequency ?? 7,
          fertilizerEveryWeeks: (apiPlant as any).fertilizerEveryWeeks ?? undefined,
          soil: apiPlant.soilType ?? undefined,
          notes: (apiPlant as any).notes || apiPlant.careInstructions || undefined,
          imageUrl: normalizeImageUrl(apiPlant.imageUrl),
          lastWatered: (apiPlant as any).lastWatered || undefined,
          health: (apiPlant as any).health || "Good",
          
        }));
      setPlants(convertedPlants);
      savePlantsToLocalStorage(convertedPlants);

      // Also surface any AI analysis saved in plant notes as lightweight recommendations
      try {
        const derived = convertedPlants
          .map(p => {
            const notes = p.notes || '';
            if (!notes || !notes.includes('AI Analysis')) return null;

            // Extract a short summary (first line after 'AI Analysis:')
            const markerIndex = notes.indexOf('AI Analysis');
            const after = notes.slice(markerIndex);
            const lines = after.split('\n').map(l => l.trim()).filter(Boolean);
            // Take up to first two informative lines
            const summary = lines.slice(1, 3).join(' ') || lines[0] || notes.slice(0, 200);

            const rec: AiRecommendation = {
              _id: `note-${p.id}`,
              userId: user?.id || undefined,
              plantId: p.id,
              plantName: p.name,
              imageUrl: p.imageUrl || '',
              description: summary,
              recommendations: { immediateActions: [summary] },
              detectionResults: undefined,
              status: 'saved',
              createdAt: new Date().toISOString()
            };

            return rec;
          })
          .filter(Boolean) as AiRecommendation[];

        if (derived.length > 0) {
          setAiRecommendations(prev => {
            // Prepend derived so users see their saved analyses first
            const existing = prev || [];
            // Avoid duplicates by _id
            const ids = new Set(existing.map(r => r._id));
            const newOnes = derived.filter(d => !ids.has(d._id));
            return [...newOnes, ...existing];
          });
        }
      } catch (e) {
        console.warn('[MyPlants] Failed to derive AI recommendations from plant notes', e);
      }
      // Debug: log loaded plants and their imageUrl fields to aid troubleshooting
      try {
        console.log('[MyPlants] Loaded plants:', convertedPlants.map(p => ({ 
          id: p.id, 
          name: p.name, 
          imageUrl: p.imageUrl ? (p.imageUrl.substring(0, 60) + '...') : 'NO IMAGE',
          fullImageUrl: p.imageUrl 
        })));
        console.log('[MyPlants] Total plants loaded:', convertedPlants.length);
        
        // Test image URLs
        convertedPlants.forEach(async (p) => {
          if (p.imageUrl) {
            try {
              const testImg = new Image();
              testImg.onload = () => console.log(`✅ Image loaded for ${p.name}: ${p.imageUrl}`);
              testImg.onerror = (e) => console.error(`❌ Image FAILED for ${p.name}: ${p.imageUrl}`, e);
              testImg.src = p.imageUrl;
            } catch (e) {
              console.error(`❌ Image test error for ${p.name}:`, e);
            }
          }
        });
      } catch (e) {
        console.warn('[MyPlants] Failed to log loaded plants', e);
      }
      } catch (err) {
        console.error('Error loading plants:', err);
        setError('Failed to load plants. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadPlants();
    // load analytics for dashboard-style stats
    const loadAnalytics = async () => {
      try {
        const analytics = await analyticsApi.getDashboardAnalytics();
        setAnalyticsData({
          dashboard: {
            totalPlants: analytics.totalPlants || 0,
            healthScore: Math.round(((analytics.healthyPlants || 0) / Math.max(1, analytics.totalPlants || 1)) * 100) || 0,
            // keep analytics values as fallback, but primary source for reminders is remindersApi
            activeReminders: analytics.upcomingReminders || 0,
            overdueReminders: analytics.overdueReminders || 0,
            recentCareLogs: analytics.careThisWeek || 0,
          }
        });
        // fetch real reminders - get all pending reminders
        try {
          const pending = await remindersApi.getReminders({ status: 'pending' });
          const now = Date.now();

          // Split reminders into upcoming and overdue
          // Upcoming: due at or after current time
          // Overdue: due before current time
          const localUpcoming = (pending || []).filter((r: any) => new Date(r.dueAt).getTime() >= now);
          const localOverdue = (pending || []).filter((r: any) => new Date(r.dueAt).getTime() < now);

          console.log('[MyPlants] Loaded reminders:', {
            total: pending?.length || 0,
            upcoming: localUpcoming.length,
            overdue: localOverdue.length,
          });

          setUpcomingReminders(localUpcoming);
          setOverdueReminders(localOverdue);
        } catch (remErr) {
          console.warn('[MyPlants] Failed to load reminders from API', remErr);
          setUpcomingReminders([]);
          setOverdueReminders([]);
        }
        // Load AI recommendations (recent)
        try {
          const recs = await aiRecommendationApi.getRecommendations({ limit: 5 });
          // Merge backend recommendations with any derived recommendations from plant notes
          setAiRecommendations(prev => {
            const existing = Array.isArray(prev) ? prev : [];
            const existingIds = new Set(existing.map(r => r._id));
            const fetched = Array.isArray(recs) ? recs : [];
            // Keep derived/existing first, then append fetched ones that are not duplicates
            const toAppend = fetched.filter(r => !existingIds.has(r._id));
            return [...existing, ...toAppend];
          });
        } catch (aiErr) {
          console.warn('Failed to load AI recommendations', aiErr);
        }
      } catch (err) {
        // ignore analytics failure
        setAnalyticsData(null);
        setUpcomingReminders([]);
        setOverdueReminders([]);
      }
    };

    loadAnalytics();
  }, [user]);

  // Helper: retry an async function with exponential backoff
  async function retry<T>(fn: () => Promise<T>, attempts = 3, baseDelay = 400): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        const delay = baseDelay * Math.pow(2, i);
        console.warn('[MyPlants] retry attempt', i + 1, 'failed, retrying in', delay, 'ms', err);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastErr;
  }

  // CRUD operations
  const handleCreatePlant = async (newPlant: Plant, imageFile?: File | null) => {
    try {
      // Create plant record quickly without image to make UI feel fast
      const payload = {
        name: newPlant.name,
        scientificName: newPlant.name,
        description: newPlant.notes || '',
        category: mapToApiCategory(newPlant.category),
        wateringFrequency: newPlant.wateringEveryDays,
        sunlightHours: newPlant.sunlight === "Full Sun" ? 8 : newPlant.sunlight === "Partial Sun" ? 6 : 4,
        soilType: newPlant.soil || 'Well-draining soil',
        notes: newPlant.notes || '',
      } as any;

      let createdPlant: any;

      // If imageFile is provided, send it in FormData so backend can persist imageUrl atomically
      if (imageFile) {
        try {
          console.log('[MyPlants] Creating FormData with image, file size:', imageFile.size, 'type:', imageFile.type);
          const form = new FormData();
          Object.keys(payload).forEach(key => {
            const val = (payload as any)[key];
            if (val !== undefined && val !== null) form.append(key, String(val));
          });
          form.append('image', imageFile);
          console.log('[MyPlants] Calling plantsApi.createPlant with FormData...');
          createdPlant = await plantsApi.createPlant(form as any);
          console.log('[MyPlants] Created plant response:', createdPlant);
        } catch (e) {
          console.error('[MyPlants] create with file failed, falling back to metadata-only create', e);
          createdPlant = await plantsApi.createPlant(payload);
        }
      } else {
        console.log('[MyPlants] No image file, creating plant without image');
        createdPlant = await plantsApi.createPlant(payload);
      }

      const frontendPlant: Plant = {
        id: createdPlant._id,
        name: createdPlant.name,
        category: mapCategory(createdPlant.category),
        sunlight: ((createdPlant as any).sunlightHours ?? 4) >= 8 ? "Full Sun" : ((createdPlant as any).sunlightHours ?? 4) >= 6 ? "Partial Sun" : "Low Light",
        ageYears: (createdPlant as any).ageYears ?? undefined,
        wateringEveryDays: createdPlant.wateringFrequency ?? 7,
        fertilizerEveryWeeks: (createdPlant as any).fertilizerEveryWeeks ?? undefined,
        soil: createdPlant.soilType ?? undefined,
        notes: (createdPlant as any).notes || (createdPlant as any).careInstructions || undefined,
        imageUrl: createdPlant.imageUrl ?? undefined,
        lastWatered: (createdPlant as any).lastWatered ?? undefined,
        health: (createdPlant as any).health || 'Good',
        
      };

      setPlants(prev => {
        const next = [frontendPlant, ...prev];
        savePlantsToLocalStorage(next);
        return next;
      });

  // If an image was provided but the server didn't persist it (edge case), upload in the background and then patch the plant
  if (imageFile && !frontendPlant.imageUrl) {
        (async () => {
          try {
            const userId = (window as any).__AGROTRACK__?.userId || 'anonymous';
            console.debug('[MyPlants] Background upload start for created plant', createdPlant._id);
            const img = await uploadPlantImage(imageFile, userId, (progress) => {});
            console.debug('[MyPlants] Firebase upload complete for plant', createdPlant._id, 'url=', img?.url);
            if (img?.url) {
              try {
                // Retry updating the plant record in case of transient failures
                const updated = await retry(() => plantsApi.updatePlant(createdPlant._id, { imageUrl: img.url } as any), 3, 500);
                const savedUrl = updated?.imageUrl || (img.url as string);
                console.info('[MyPlants] Successfully patched plant with imageUrl', createdPlant._id, savedUrl);
                setPlants(prev => {
                  const next = prev.map(p => p.id === createdPlant._id ? { ...p, imageUrl: savedUrl } : p);
                  savePlantsToLocalStorage(next);
                  return next;
                });
              } catch (updateErr) {
                console.error('[MyPlants] Failed to patch plant imageUrl after upload', updateErr);
                toast({ title: 'Image upload failed', description: 'Image uploaded but updating plant record failed. You can retry from the plant editor.' });
              }
            }
          } catch (err) {
            console.error('Background image upload failed', err);
            toast({ title: 'Image upload failed', description: 'Image upload failed in background. You can retry from the plant editor.' });
          }
        })();
      }
    } catch (error: any) {
      console.error('Error creating plant:', error);
      toast({ title: 'Failed to add plant', description: error?.message || 'Please ensure you are logged in and the server is running.' });
    }
  };

  const handleUpdatePlant = async (updatedPlant: Plant, imageFile?: File | null) => {
    try {
      // Optimistic metadata update: patch core fields immediately
      const payload = {
        name: updatedPlant.name,
        scientificName: updatedPlant.name,
        description: updatedPlant.notes || '',
        category: mapToApiCategory(updatedPlant.category),
        wateringFrequency: updatedPlant.wateringEveryDays,
        sunlightHours: updatedPlant.sunlight === "Full Sun" ? 8 : updatedPlant.sunlight === "Partial Sun" ? 6 : 4,
        soilType: updatedPlant.soil || 'Well-draining soil',
        notes: updatedPlant.notes || '',
      } as any;

      // Apply optimistic update to UI
      setPlants(prev => {
        const next = prev.map(plant => plant.id === updatedPlant.id ? {
          ...plant,
          name: updatedPlant.name,
          wateringEveryDays: updatedPlant.wateringEveryDays,
          soil: updatedPlant.soil,
          notes: updatedPlant.notes || plant.notes,
        } : plant);
        savePlantsToLocalStorage(next);
        return next;
      });

      // If imageFile provided, send metadata+file together so server persists imageUrl immediately.
      if (imageFile) {
        try {
          const form = new FormData();
          Object.keys(payload).forEach(key => {
            const val = (payload as any)[key];
            if (val !== undefined && val !== null) form.append(key, String(val));
          });
          form.append('image', imageFile);
          const updatedResp = await plantsApi.updatePlant(updatedPlant.id, form as any);
          const savedUrl = normalizeImageUrl(updatedResp?.imageUrl);
          if (savedUrl) {
            setPlants(prev => {
              const next = prev.map(p => p.id === updatedPlant.id ? { ...p, imageUrl: savedUrl } : p);
              savePlantsToLocalStorage(next);
              return next;
            });
          }
        } catch (err) {
          console.warn('[MyPlants] Update with file failed, falling back to background upload', err);
          // Fallback to previous behavior (background upload + patch)
          (async () => {
            try {
              const userId = (window as any).__AGROTRACK__?.userId || 'anonymous';
              const img = await uploadPlantImage(imageFile, userId, (progress) => {});
              if (img?.url) {
                const updated = await retry(() => plantsApi.updatePlant(updatedPlant.id, { imageUrl: img.url } as any), 3, 500);
                const savedUrl = normalizeImageUrl(updated?.imageUrl || img.url);
                setPlants(prev => {
                  const next = prev.map(p => p.id === updatedPlant.id ? { ...p, imageUrl: savedUrl } : p);
                  savePlantsToLocalStorage(next);
                  return next;
                });
              }
            } catch (bgErr) {
              console.error('[MyPlants] Background upload fallback failed', bgErr);
              toast({ title: 'Image upload failed', description: 'Image upload failed in background. You can retry from the plant editor.' });
            }
          })();
        }
      } else {
        // No file: just send metadata non-blocking
        plantsApi.updatePlant(updatedPlant.id, payload).catch(err => {
          console.error('Failed to update plant metadata', err);
          toast({ title: 'Update failed', description: 'Failed to save changes. Please retry.' });
        });
      }
    } catch (error: any) {
      console.error('Error updating plant:', error);
      toast({ title: 'Failed to update plant', description: error?.message || 'Please try again.' });
    }
  };

  const handleDeletePlant = async (plantId: string) => {
    try {
  await api.delete(`/plants/${plantId}`);
      setPlants(prev => {
        const next = prev.filter(plant => plant.id !== plantId);
        savePlantsToLocalStorage(next);
        return next;
      });
    } catch (error) {
      console.error('Error deleting plant:', error);
      // Fallback to local state update
      setPlants(prev => prev.filter(plant => plant.id !== plantId));
    }
  };

  const handleWateredPlant = (plantId: string) => {
    setPlants(prev => {
      const next = prev.map(plant => 
        plant.id === plantId 
          ? { ...plant, lastWatered: new Date().toISOString() }
          : plant
      );
      savePlantsToLocalStorage(next);
      return next;
    });
  };

  const handleSetReminder = (plant: Plant) => {
    setReminderPlant(plant);
    setIsReminderDialogOpen(true);
  };

  const handleSetFertilizerReminder = (plant: Plant) => {
    setFertilizerReminderPlant(plant);
    setIsFertilizerReminderDialogOpen(true);
  };

  const handleReminderCreated = async () => {
    // Refresh reminders list
    try {
      const upcoming = await remindersApi.getReminders({ upcoming: true, status: 'pending' });
      const overdue = await remindersApi.getReminders({ overdue: true, status: 'pending' });
      setUpcomingReminders(upcoming);
      setOverdueReminders(overdue);
    } catch (err) {
      console.warn('Failed to refresh reminders', err);
    }
  };

  // Helper function to get reminder styling based on type
  const getReminderStyle = (title: string) => {
    const lowerTitle = title.toLowerCase();
    
    // Water reminders - blue theme
    if (lowerTitle.includes('water')) {
      return {
        bgGradient: 'from-white to-blue-50',
        borderColor: 'border-blue-400',
        iconBg: 'bg-blue-500',
        textColor: 'text-blue-800',
        subtextColor: 'text-blue-600',
        icon: Droplets,
      };
    }
    
    // Fertilizer reminders - green theme
    if (lowerTitle.includes('fertiliz')) {
      return {
        bgGradient: 'from-white to-green-50',
        borderColor: 'border-green-400',
        iconBg: 'bg-green-500',
        textColor: 'text-green-800',
        subtextColor: 'text-green-600',
        icon: Sprout,
      };
    }
    
    // Pruning reminders - purple theme
    if (lowerTitle.includes('prun') || lowerTitle.includes('trim')) {
      return {
        bgGradient: 'from-white to-purple-50',
        borderColor: 'border-purple-400',
        iconBg: 'bg-purple-500',
        textColor: 'text-purple-800',
        subtextColor: 'text-purple-600',
        icon: Scissors,
      };
    }
    
    // Pest/disease reminders - orange theme
    if (lowerTitle.includes('pest') || lowerTitle.includes('disease') || lowerTitle.includes('check')) {
      return {
        bgGradient: 'from-white to-orange-50',
        borderColor: 'border-orange-400',
        iconBg: 'bg-orange-500',
        textColor: 'text-orange-800',
        subtextColor: 'text-orange-600',
        icon: Bug,
      };
    }
    
    // Default - teal theme for other reminders
    return {
      bgGradient: 'from-white to-teal-50',
      borderColor: 'border-teal-400',
      iconBg: 'bg-teal-500',
      textColor: 'text-teal-800',
      subtextColor: 'text-teal-600',
      icon: Bell,
    };
  };

  // Bulk operation handlers
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedItems.length} plant${selectedItems.length > 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) return;

    try {
  // Delete each plant from API
  const deletePromises = selectedItems.map(plant => api.delete(`/plants/${plant.id}`));
      await Promise.all(deletePromises);

      // Remove from local state
      const selectedIds = selectedItems.map(plant => plant.id);
      setPlants(prev => {
        const next = prev.filter(plant => !selectedIds.includes(plant.id));
        savePlantsToLocalStorage(next);
        return next;
      });
      clearSelection();
      setSelectionMode(false);
    } catch (error) {
      console.error('Error deleting plants:', error);
      // Fallback to local state update
      const selectedIds = selectedItems.map(plant => plant.id);
      setPlants(prev => {
        const next = prev.filter(plant => !selectedIds.includes(plant.id));
        savePlantsToLocalStorage(next);
        return next;
      });
      clearSelection();
      setSelectionMode(false);
    }
  };

  const handleBulkWater = () => {
    if (selectedItems.length === 0) return;
    
    const now = new Date().toISOString();
    const selectedIds = selectedItems.map(plant => plant.id);
    
    setPlants(prev => {
      const next = prev.map(plant => 
        selectedIds.includes(plant.id) 
          ? { ...plant, lastWatered: now }
          : plant
      );
      savePlantsToLocalStorage(next);
      return next;
    });
    clearSelection();
    setSelectionMode(false);
  };

  const handleBulkMarkHealthy = () => {
    if (selectedItems.length === 0) return;
    
    const selectedIds = selectedItems.map(plant => plant.id);
    
    setPlants(prev => {
      const next = prev.map(plant => 
        selectedIds.includes(plant.id) 
          ? { ...plant, health: 'Excellent' as const }
          : plant
      );
      savePlantsToLocalStorage(next);
      return next;
    });
    clearSelection();
    setSelectionMode(false);
  };

  const handleBulkExport = () => {
    if (selectedItems.length === 0) return;
    
    const exportFormat = confirm('Export as JSON? (Cancel for CSV)') ? 'json' : 'csv';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `plants-export-${timestamp}.${exportFormat}`;
    
    if (exportFormat === 'json') {
      exportPlantsToJSON(selectedItems, filename);
    } else {
      exportPlantsToCSV(selectedItems, filename);
    }
    
    clearSelection();
    setSelectionMode(false);
  };

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      clearSelection();
    }
  };

  // Modal handlers
  const handleOpenModal = (plant?: Plant) => {
    setEditingPlant(plant || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlant(null);
  };

  const handleSubmitPlant = (plantData: Plant, imageFile?: File | null) => {
    if (editingPlant) {
      handleUpdatePlant(plantData, imageFile);
    } else {
      handleCreatePlant(plantData, imageFile);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-blue-50 dark:from-green-950/20 dark:via-background dark:to-blue-950/20">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header (same as Dashboard) */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-muted-foreground">Here's everything happening with your garden</p>
        </div>

        {/* Stats Overview - show dashboard-style cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Plants</p>
                  <p className="text-3xl font-bold text-foreground">{plants.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm">
                <span className="text-green-600 font-medium">{analyticsData?.dashboard.healthScore || 0}% healthy</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Health Score</p>
                  <p className="text-3xl font-bold text-foreground">{analyticsData?.dashboard.healthScore || 0}%</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${ (analyticsData?.dashboard.healthScore || 0) >= 80 ? 'bg-green-100 dark:bg-green-900/40' : (analyticsData?.dashboard.healthScore || 0) >= 50 ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-red-100 dark:bg-red-900/40' }`}>
                  <TrendingUp className={`w-6 h-6 ${ (analyticsData?.dashboard.healthScore || 0) >= 80 ? 'text-green-600 dark:text-green-400' : (analyticsData?.dashboard.healthScore || 0) >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400' }`} />
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: `${analyticsData?.dashboard.healthScore || 0}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Reminders</p>
                  <p className="text-3xl font-bold text-foreground">
                    {(() => {
                      const total = (upcomingReminders?.length || 0) + (overdueReminders?.length || 0);
                      return total > 0 ? total : (analyticsData?.dashboard?.activeReminders || 0);
                    })()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm">
                {(() => {
                  const overdueCount = overdueReminders?.length || 0;
                  const fallbackOverdue = analyticsData?.dashboard?.overdueReminders || 0;
                  const displayOverdue = overdueCount > 0 ? overdueCount : fallbackOverdue;
                  return displayOverdue > 0 ? (
                    <span className="text-red-600 dark:text-red-400 font-medium">⚠️ {displayOverdue} overdue</span>
                  ) : (
                    <span className="text-muted-foreground">All up to date</span>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Care Actions</p>
                  <p className="text-3xl font-bold text-foreground">{analyticsData?.dashboard.recentCareLogs || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm text-muted-foreground">This week</div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 dark:border-green-800 border-t-green-600"></div>
            <p className="mt-4 text-muted-foreground font-medium">Loading your garden...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-lg p-6 mb-8 shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mr-3" />
              <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

  {/* Modern Action Cards - Eye-catching with gradients */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* AI Plant Analysis - Primary Action */}
          <Link to="/plant-analysis" className="group">
            <Card className="border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all duration-300 hover:shadow-xl cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <Leaf className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 dark:text-green-300 group-hover:text-green-900 dark:group-hover:text-green-200">
                        AI Plant Analysis
                      </h3>
                      <p className="text-sm text-green-600 dark:text-green-400">Scan & identify your plants instantly</p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Add New Plant */}
          <Card 
            className="border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-xl cursor-pointer bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30 group"
            onClick={() => handleOpenModal()}
            data-testid="add-plant-btn"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-sky-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 group-hover:text-blue-900 dark:group-hover:text-blue-200">
                      Add New Plant
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Expand your garden collection</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick access: Reminders Center */}
        <div className="mb-8">
          <Link to="/reminder-test" className="group">
            <Card className="border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 transition-all duration-300 hover:shadow-xl cursor-pointer bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <Bell className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-orange-800 dark:text-orange-300 group-hover:text-orange-900 dark:group-hover:text-orange-200">
                        Reminders Center
                      </h3>
                      {(() => {
                        const upcomingCount = (upcomingReminders?.length ?? 0);
                        const overdueCount = (overdueReminders?.length ?? 0);
                        const analyticsActive = analyticsData?.dashboard?.activeReminders ?? 0;
                        const analyticsOverdue = analyticsData?.dashboard?.overdueReminders ?? 0;
                        const activeCount = (upcomingCount + overdueCount) > 0 ? (upcomingCount + overdueCount) : analyticsActive;
                        const overdueDisplay = overdueCount > 0 ? overdueCount : (analyticsOverdue > 0 ? analyticsOverdue : 0);
                        
                        // Debug logging
                        console.log('[MyPlants Reminders Center]', {
                          upcomingCount,
                          overdueCount,
                          analyticsActive,
                          analyticsOverdue,
                          activeCount,
                          overdueDisplay,
                          upcomingReminders,
                          overdueReminders
                        });
                        
                        return (
                          <p className="text-sm text-orange-700 dark:text-orange-400">
                            {`${activeCount} active`}
                            {overdueDisplay > 0 ? ` • ${overdueDisplay} overdue` : ''}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Modern Stats Dashboard with Gradients */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Plants */}
          <Card className="border-l-4 border-l-green-500 dark:border-l-green-600 bg-gradient-to-br from-card to-green-50/50 dark:to-green-950/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">{plants.length}</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Plants</p>
              <div className="mt-2 h-1 bg-green-200 dark:bg-green-900/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 w-full"></div>
              </div>
            </CardContent>
          </Card>
          
          {/* Need Water */}
          <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-600 bg-gradient-to-br from-card to-blue-50/50 dark:to-blue-950/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {filterAndSortPlants(plants, { ...filters, careNeeds: 'needs-water' }).length}
                </span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Need Water</p>
              <div className="mt-2 h-1 bg-blue-200 dark:bg-blue-900/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-sky-500 w-3/4"></div>
              </div>
            </CardContent>
          </Card>
          
          {/* Overdue Care */}
          <Card className="border-l-4 border-l-orange-500 dark:border-l-orange-600 bg-gradient-to-br from-card to-orange-50/50 dark:to-orange-950/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                <span className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {(() => {
                    const overdueCount = overdueReminders?.length || 0;
                    const overdueFilterCount = filterAndSortPlants(plants, { ...filters, careNeeds: 'overdue' }).length;
                    return Math.max(overdueCount, overdueFilterCount);
                  })()}
                </span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Needs Attention</p>
              <div className="mt-2 h-1 bg-orange-200 dark:bg-orange-900/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-1/2"></div>
              </div>
            </CardContent>
          </Card>
          
          {/* Healthy Plants */}
          <Card className="border-l-4 border-l-purple-500 dark:border-l-purple-600 bg-gradient-to-br from-card to-purple-50/50 dark:to-purple-950/20 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {plants.filter(p => p.health === 'Excellent' || p.health === 'Good').length}
                </span>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Healthy</p>
              <div className="mt-2 h-1 bg-purple-200 dark:bg-purple-900/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plant Collection & Care History - Moved to top */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="border border-border shadow-md hover:shadow-lg transition-all duration-200">
              <CardHeader className="border-b border-border bg-gradient-to-r from-card to-green-50/20 dark:to-green-950/10">
                <CardTitle className="text-green-800 dark:text-green-300 text-xl">Your Plant Collection</CardTitle>
                <CardDescription className="text-green-600 dark:text-green-400/80">Track care history and manage multiple plants</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">{plants.length > 0 ? (
                  <div className="space-y-6">
                    {/* Plant Filters */}
                    <PlantFiltersComponent
                      filters={filters}
                      onFiltersChange={setFilters}
                      plantsCount={plants.length}
                      filteredCount={filteredPlants.length}
                    />
                    
                    {/* Filtered Plants Grid */}
                    {filteredPlants.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredPlants.map((plant) => (
                          <PlantCard 
                            key={plant.id} 
                            plant={plant} 
                            onEdit={handleOpenModal}
                            onDelete={handleDeletePlant}
                            onWatered={handleWateredPlant}
                            onSetReminder={handleSetReminder}
                            onSetFertilizerReminder={handleSetFertilizerReminder}
                            isSelected={isSelected(plant.id)}
                            onSelectionChange={toggleSelection}
                            selectionMode={selectionMode}
                            onViewDetails={(plant) => setViewingPlant(plant)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No plants match your filters</h3>
                        <p className="text-muted-foreground mb-4">
                          Try adjusting your search or filter criteria
                        </p>
                        <Button variant="outline" onClick={() => setFilters({
                          search: '',
                          healthStatus: 'all',
                          category: 'all',
                          careNeeds: 'all',
                          sortBy: 'name',
                          sortOrder: 'asc'
                        })}>
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-block p-6 bg-green-50 rounded-full mb-4">
                      <Leaf className="w-16 h-16 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-900 mb-2">No plants yet</h3>
                    <p className="text-green-600/70 mb-6">
                      Start your plant collection by adding your first plant
                    </p>
                    <Button onClick={() => handleOpenModal()} className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Plant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Care History Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Care Activity</CardTitle>
                <CardDescription>Your plant care history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plants.slice(0, 3).map((plant) => (
                    <div key={plant.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Droplets className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{plant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {plant.lastWatered 
                            ? `Watered ${new Date(plant.lastWatered).toLocaleDateString()}`
                            : 'Not watered yet'
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                  {plants.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No activity yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Move Smart Care Suggestions up into the sidebar to avoid large white gaps */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Smart Care Suggestions</CardTitle>
                <CardDescription>Personalized tips from your AI analyses and saved results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiRecommendations && aiRecommendations.length > 0 ? (
                  aiRecommendations.slice(0, 3).map((rec) => {
                    const label = rec.recommendations?.followUpRequired ? '⚠️ Alert' : (rec.recommendations?.immediateActions?.length ? '💡 Pro Tip' : '🌱 Insight');
                    const bg = label.includes('Alert') ? 'from-orange-50 to-yellow-50' : label.includes('Pro Tip') ? 'from-green-50 to-blue-50' : 'from-purple-50 to-pink-50';
                    const textColor = label.includes('Alert') ? 'text-orange-800' : label.includes('Pro Tip') ? 'text-green-800' : 'text-purple-800';
                    const summary = (
                      rec.recommendations?.immediateActions?.[0]
                      || rec.recommendations?.preventionMeasures?.[0]
                      || rec.detectionResults?.primaryDisease?.name
                      || rec.description
                      || 'Recommendation available'
                    );

                    return (
                      <div key={rec._id} className={`p-3 bg-gradient-to-r ${bg} rounded-lg border flex items-start gap-3`}>
                        <div className="flex-shrink-0 w-12 h-12 overflow-hidden rounded-lg bg-white/70 border">
                          {rec.imageUrl ? (
                            <img src={rec.imageUrl} alt={rec.plantName || 'plant'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">🌿</div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`text-sm font-medium ${textColor} mb-1`}>{label}</p>
                              <div className="text-sm text-neutral-800 font-semibold">{rec.plantName || 'Saved Analysis'}</div>
                            </div>
                            <span className="text-xs text-neutral-600">Saved</span>
                          </div>

                          <p className="mt-2 text-sm text-muted-foreground">{summary}</p>

                          <div className="mt-2">
                            <Link to={`/plant-analysis?rec=${rec._id}`} className="text-sm text-blue-600">View details</Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Smart Notifications & Reminders */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="border-t-4 border-t-orange-400">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-orange-500" />
                    <span>Today's Care Reminders</span>
                  </CardTitle>
                  <CardDescription>Smart adaptive notifications for your plants</CardDescription>
                </div>
                <Button asChild size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                  <Link to="/reminder-test">
                    View all
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {
                // Prefer showing upcoming reminders first, then overdue
                (upcomingReminders.length + overdueReminders.length) === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600">No reminders scheduled. Create one from a plant or view the Reminders Center.</p>
                    <div className="mt-4">
                      <Link to="/reminder-test">
                        <Button size="sm" className="bg-orange-600 text-white">Open Reminders</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingReminders.map(rem => {
                      const style = getReminderStyle(rem.title);
                      const IconComponent = style.icon;
                      
                      return (
                        <div key={rem._id} className={`flex items-center justify-between p-4 bg-gradient-to-r ${style.bgGradient} rounded-xl border-l-4 ${style.borderColor} hover:shadow-md transition-shadow`}>
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 ${style.iconBg} rounded-lg`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className={`font-medium ${style.textColor}`}>{rem.title}</p>
                              <p className={`text-sm ${style.subtextColor}`}>{rem.notes || 'Reminder'}</p>
                              <p className="text-xs text-gray-500">Due: {new Date(rem.dueAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={async () => {
                              try {
                                await remindersApi.completeReminder(rem._id);
                                setUpcomingReminders(prev => prev.filter(r => r._id !== rem._id));
                                setAnalyticsData((ad:any) => ({
                                  ...ad,
                                  dashboard: {
                                    ...ad?.dashboard,
                                    recentCareLogs: (ad?.dashboard?.recentCareLogs || 0) + 1
                                  }
                                }));
                                toast({ title: 'Reminder completed', description: `Marked "${rem.title}" as done.` });
                              } catch (err: any) {
                                console.error('Failed to complete reminder', err, err?.response?.data || err?.message);
                                toast({ title: 'Failed to complete reminder', description: (err?.response?.data?.message || err?.message || 'See console for details') });
                              }
                            }}>Done</Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link to="/reminder-test">View</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {overdueReminders.map(rem => {
                      const style = getReminderStyle(rem.title);
                      const IconComponent = style.icon;
                      
                      return (
                        <div key={rem._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-500 rounded-lg">
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-red-800">{rem.title}</p>
                              <p className="text-sm text-red-600">{rem.notes || 'Reminder'}</p>
                              <p className="text-xs text-gray-500">Overdue since: {new Date(rem.dueAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={async () => {
                              try {
                                await remindersApi.completeReminder(rem._id);
                                setOverdueReminders(prev => prev.filter(r => r._id !== rem._id));
                                setAnalyticsData((ad:any) => ({
                                  ...ad,
                                  dashboard: {
                                    ...ad?.dashboard,
                                    recentCareLogs: (ad?.dashboard?.recentCareLogs || 0) + 1
                                  }
                                }));
                                toast({ title: 'Reminder completed', description: `Marked "${rem.title}" as done.` });
                              } catch (err: any) {
                                console.error('Failed to complete reminder', err, err?.response?.data || err?.message);
                                toast({ title: 'Failed to complete reminder', description: (err?.response?.data?.message || err?.message || 'See console for details') });
                              }
                            }}>Done</Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link to="/reminder-test">View</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </CardContent>
          </Card>
        </div>

      </main>

      {/* Add Plant Modal */}
      <AddPlantModal
        mode={editingPlant ? "edit" : "create"}
        open={isModalOpen}
        initial={editingPlant || undefined}
        onCancel={handleCloseModal}
        onSubmit={handleSubmitPlant}
      />

      {/* Plant Details Dialog */}
      <Dialog open={!!viewingPlant} onOpenChange={(open) => !open && setViewingPlant(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Leaf className="w-6 h-6 text-green-600" />
              {viewingPlant?.name}
            </DialogTitle>
          </DialogHeader>
          {viewingPlant && (
            <div className="space-y-6">
              {/* Plant Image */}
              {viewingPlant.imageUrl && (
                <div className="w-full h-64 rounded-lg overflow-hidden">
                  <img
                    src={viewingPlant.imageUrl}
                    alt={viewingPlant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Category</h4>
                  <p className="text-base">{viewingPlant.category}</p>
                </div>
                {viewingPlant.ageYears && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Age</h4>
                    <p className="text-base">{viewingPlant.ageYears} year{viewingPlant.ageYears !== 1 ? 's' : ''} old</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    Last Watered
                  </h4>
                  <p className="text-base">{viewingPlant.lastWatered ? new Date(viewingPlant.lastWatered).toLocaleDateString() : 'Never'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <Activity className="w-4 h-4 text-green-600" />
                    Health Status
                  </h4>
                  <p className="text-base font-medium text-green-600">{viewingPlant.health}</p>
                </div>
              </div>

              {/* Care Requirements */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Care Requirements</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-muted-foreground">Light needs:</span>
                    <span className="font-medium">{viewingPlant.sunlight}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-muted-foreground">Watering frequency:</span>
                    <span className="font-medium">Every {viewingPlant.wateringEveryDays} days</span>
                  </div>
                  {viewingPlant.fertilizerEveryWeeks && (
                    <div className="flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-muted-foreground">Fertilizer:</span>
                      <span className="font-medium">Every {viewingPlant.fertilizerEveryWeeks} weeks</span>
                    </div>
                  )}
                  {viewingPlant.soil && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Soil type:</span>
                      <span className="font-medium">{viewingPlant.soil}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setViewingPlant(null);
                    handleOpenModal(viewingPlant);
                  }}
                  className="flex-1"
                  variant="outline"
                >
                  Edit Plant
                </Button>
                <Button
                  onClick={() => setViewingPlant(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Water Reminder Dialog */}
      <WaterReminderDialog
        plant={reminderPlant}
        open={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
        onReminderCreated={handleReminderCreated}
      />

      {/* Fertilizer Reminder Dialog */}
      <FertilizerReminderDialog
        plant={fertilizerReminderPlant}
        open={isFertilizerReminderDialogOpen}
        onOpenChange={setIsFertilizerReminderDialogOpen}
        onReminderCreated={handleReminderCreated}
      />

      {/* Bulk Operations Bar */}
      <BulkOperationsBar
        selectedCount={selectedCount}
        onClearSelection={() => {
          clearSelection();
          setSelectionMode(false);
        }}
        onBulkDelete={handleBulkDelete}
        onBulkWater={handleBulkWater}
        onBulkExport={handleBulkExport}
        onBulkMarkHealthy={handleBulkMarkHealthy}
      />

      <Footer />
    </div>
  );
};

export default MyPlants;
