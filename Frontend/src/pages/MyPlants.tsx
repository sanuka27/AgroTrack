import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { AddPlantModal } from "@/components/AddPlantModal";
import { PlantCard } from "@/components/PlantCard";
import { PlantFiltersComponent, PlantFilters } from "@/components/PlantFilters";
import { Plant, Category } from "@/types/plant";
import { filterAndSortPlants } from "@/utils/plantFiltering";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { exportPlantsToCSV, exportPlantsToJSON } from "@/utils/exportUtils";
import { BulkOperationsBar } from "@/components/BulkOperationsBar";
import { useSearchDebounce } from "@/hooks/use-search";
import { Leaf, Plus, Calendar, Droplets, Sun, Bell, TrendingUp, MessageSquare, CheckSquare, Square, AlertTriangle } from "lucide-react";
import api from '@/lib/api';
import plantsApi from '@/lib/api/plants';

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

const MyPlants = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [loading, setLoading] = useState(true);
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
        const resp = await api.get('/plants?limit=100');
        const responsePlants = resp?.data?.data?.plants || resp?.data?.plants || [];
        const convertedPlants: Plant[] = responsePlants.map((apiPlant: any) => ({
          id: apiPlant._id,
          name: apiPlant.name,
          category: mapCategory(apiPlant.category),
          sunlight: apiPlant.sunlightHours >= 8 ? "Full Sun" : apiPlant.sunlightHours >= 6 ? "Partial Sun" : "Low Light",
          ageYears: undefined,
          wateringEveryDays: apiPlant.wateringFrequency,
          fertilizerEveryWeeks: undefined,
          soil: apiPlant.soilType,
          notes: apiPlant.careInstructions,
          imageUrl: apiPlant.imageUrl,
          lastWatered: apiPlant.lastWatered || undefined,
          health: apiPlant.health || "Good",
          growthRatePctThisMonth: apiPlant.growthRatePctThisMonth,
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

  // CRUD operations
  const handleCreatePlant = async (newPlant: Plant, imageFile?: File | null) => {
    try {
      // prepare payload; use FormData if image is present
      let createdPlant: any = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('name', newPlant.name);
        formData.append('scientificName', newPlant.name);
        formData.append('description', newPlant.notes || '');
        formData.append('category', newPlant.category);
        formData.append('wateringFrequency', String(newPlant.wateringEveryDays));
        formData.append('sunlightHours', String(newPlant.sunlight === "Full Sun" ? 8 : newPlant.sunlight === "Partial Sun" ? 6 : 4));
        formData.append('soilType', newPlant.soil || 'Well-draining soil');
        formData.append('careInstructions', newPlant.notes || '');
        formData.append('image', imageFile);

        createdPlant = await plantsApi.createPlant(formData);
      } else {
        const payload = {
          name: newPlant.name,
          scientificName: newPlant.name,
          description: newPlant.notes || '',
          category: newPlant.category,
          wateringFrequency: newPlant.wateringEveryDays,
          sunlightHours: newPlant.sunlight === "Full Sun" ? 8 : newPlant.sunlight === "Partial Sun" ? 6 : 4,
          soilType: newPlant.soil || 'Well-draining soil',
          careInstructions: newPlant.notes || '',
        };
        createdPlant = await plantsApi.createPlant(payload as any);
      }

      // Convert and add to state
      const frontendPlant: Plant = {
        id: createdPlant._id,
        name: createdPlant.name,
        category: mapCategory(createdPlant.category),
        sunlight: createdPlant.sunlightHours >= 8 ? "Full Sun" : createdPlant.sunlightHours >= 6 ? "Partial Sun" : "Low Light",
        ageYears: createdPlant.ageYears,
        wateringEveryDays: createdPlant.wateringFrequency,
        fertilizerEveryWeeks: createdPlant.fertilizerEveryWeeks,
        soil: createdPlant.soilType,
        notes: createdPlant.careInstructions,
        imageUrl: createdPlant.imageUrl,
        lastWatered: createdPlant.lastWatered,
        health: createdPlant.health || 'Good',
        growthRatePctThisMonth: createdPlant.growthRatePctThisMonth,
      };

      setPlants(prev => [frontendPlant, ...prev]);
    } catch (error) {
      console.error('Error creating plant:', error);
      // For now, just add to local state as fallback
      setPlants(prev => [newPlant, ...prev]);
    }
  };

  const handleUpdatePlant = async (updatedPlant: Plant, imageFile?: File | null) => {
    try {
      // Use FormData if image provided
      let updated: any = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('name', updatedPlant.name);
        formData.append('scientificName', updatedPlant.name);
        formData.append('description', updatedPlant.notes || '');
        formData.append('category', updatedPlant.category);
        formData.append('wateringFrequency', String(updatedPlant.wateringEveryDays));
        formData.append('sunlightHours', String(updatedPlant.sunlight === "Full Sun" ? 8 : updatedPlant.sunlight === "Partial Sun" ? 6 : 4));
        formData.append('soilType', updatedPlant.soil || 'Well-draining soil');
        formData.append('careInstructions', updatedPlant.notes || '');
        formData.append('image', imageFile);

        updated = await plantsApi.updatePlant(updatedPlant.id, formData);
      } else {
        const payload = {
          name: updatedPlant.name,
          scientificName: updatedPlant.name,
          description: updatedPlant.notes || '',
          category: updatedPlant.category,
          wateringFrequency: updatedPlant.wateringEveryDays,
          sunlightHours: updatedPlant.sunlight === "Full Sun" ? 8 : updatedPlant.sunlight === "Partial Sun" ? 6 : 4,
          soilType: updatedPlant.soil || 'Well-draining soil',
          careInstructions: updatedPlant.notes || '',
        };
        updated = await plantsApi.updatePlant(updatedPlant.id, payload as any);
      }

      setPlants(prev => prev.map(plant => plant.id === updatedPlant.id ? {
        ...plant,
        name: updated.name,
        imageUrl: updated.imageUrl || plant.imageUrl,
        wateringEveryDays: updated.wateringFrequency,
        soil: updated.soilType,
        notes: updated.careInstructions,
      } : plant));
    } catch (error) {
      console.error('Error updating plant:', error);
      // Fallback to local state update
      setPlants(prev => prev.map(plant =>
        plant.id === updatedPlant.id ? updatedPlant : plant
      ));
    }
  };

  const handleDeletePlant = async (plantId: string) => {
    try {
  await api.delete(`/plants/${plantId}`);
      setPlants(prev => prev.filter(plant => plant.id !== plantId));
    } catch (error) {
      console.error('Error deleting plant:', error);
      // Fallback to local state update
      setPlants(prev => prev.filter(plant => plant.id !== plantId));
    }
  };

  const handleWateredPlant = (plantId: string) => {
    setPlants(prev => prev.map(plant => 
      plant.id === plantId 
        ? { ...plant, lastWatered: new Date().toISOString() }
        : plant
    ));
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
      setPlants(prev => prev.filter(plant => !selectedIds.includes(plant.id)));
      clearSelection();
      setSelectionMode(false);
    } catch (error) {
      console.error('Error deleting plants:', error);
      // Fallback to local state update
      const selectedIds = selectedItems.map(plant => plant.id);
      setPlants(prev => prev.filter(plant => !selectedIds.includes(plant.id)));
      clearSelection();
      setSelectionMode(false);
    }
  };

  const handleBulkWater = () => {
    if (selectedItems.length === 0) return;
    
    const now = new Date().toISOString();
    const selectedIds = selectedItems.map(plant => plant.id);
    
    setPlants(prev => prev.map(plant => 
      selectedIds.includes(plant.id) 
        ? { ...plant, lastWatered: now }
        : plant
    ));
    clearSelection();
    setSelectionMode(false);
  };

  const handleBulkMarkHealthy = () => {
    if (selectedItems.length === 0) return;
    
    const selectedIds = selectedItems.map(plant => plant.id);
    
    setPlants(prev => prev.map(plant => 
      selectedIds.includes(plant.id) 
        ? { ...plant, health: 'Excellent' as const }
        : plant
    ));
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header with Gradient */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl opacity-10"></div>
          <div className="relative p-8 rounded-2xl">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent mb-2">
              Your Plant Collection �
            </h1>
            <p className="text-lg text-gray-600">Track care history and manage multiple plants</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading your garden...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8 shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700 font-medium">{error}</p>
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
            <Card className="border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-xl cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                      <Leaf className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-800 group-hover:text-green-900">
                        AI Plant Analysis
                      </h3>
                      <p className="text-sm text-green-600">Scan & identify your plants instantly</p>
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
            className="border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl cursor-pointer bg-gradient-to-br from-blue-50 to-sky-50 group"
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
                    <h3 className="text-xl font-bold text-blue-800 group-hover:text-blue-900">
                      Add New Plant
                    </h3>
                    <p className="text-sm text-blue-600">Expand your garden collection</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Stats Dashboard with Gradients */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Plants */}
          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Leaf className="w-6 h-6 text-green-600" />
                <span className="text-2xl font-bold text-green-700">{plants.length}</span>
              </div>
              <p className="text-sm font-medium text-gray-600">Total Plants</p>
              <div className="mt-2 h-1 bg-green-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 w-full"></div>
              </div>
            </CardContent>
          </Card>
          
          {/* Need Water */}
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Droplets className="w-6 h-6 text-blue-600" />
                <span className="text-2xl font-bold text-blue-700">
                  {filterAndSortPlants(plants, { ...filters, careNeeds: 'needs-water' }).length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Need Water</p>
              <div className="mt-2 h-1 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-sky-500 w-3/4"></div>
              </div>
            </CardContent>
          </Card>
          
          {/* Overdue Care */}
          <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Bell className="w-6 h-6 text-orange-600" />
                <span className="text-2xl font-bold text-orange-700">
                  {filterAndSortPlants(plants, { ...filters, careNeeds: 'overdue' }).length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Needs Attention</p>
              <div className="mt-2 h-1 bg-orange-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 w-1/2"></div>
              </div>
            </CardContent>
          </Card>
          
          {/* Healthy Plants */}
          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <span className="text-2xl font-bold text-purple-700">
                  {plants.filter(p => p.health === 'Excellent' || p.health === 'Good').length}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">Healthy</p>
              <div className="mt-2 h-1 bg-purple-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plant Collection & Care History - Moved to top */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="border border-green-200/60 shadow-md hover:shadow-lg transition-all duration-200">
              <CardHeader className="border-b border-green-100/50 bg-gradient-to-r from-white to-green-50/20">
                <CardTitle className="text-green-800 text-xl">Your Plant Collection</CardTitle>
                <CardDescription className="text-green-600/80">Track care history and manage multiple plants</CardDescription>
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
                            isSelected={isSelected(plant.id)}
                            onSelectionChange={toggleSelection}
                            selectionMode={selectionMode}
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
          </div>
        </div>

        {/* Smart Notifications & Reminders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border-t-4 border-t-orange-400">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-orange-500" />
                <span>Today's Care Reminders</span>
              </CardTitle>
              <CardDescription>Smart adaptive notifications for your plants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border-l-4 border-blue-400 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
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

      </main>

      {/* Add Plant Modal */}
      <AddPlantModal
        mode={editingPlant ? "edit" : "create"}
        open={isModalOpen}
        initial={editingPlant || undefined}
        onCancel={handleCloseModal}
        onSubmit={handleSubmitPlant}
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
