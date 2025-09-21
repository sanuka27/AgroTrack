import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { AddPlantModal } from "@/components/AddPlantModal";
import { PlantCard } from "@/components/PlantCard";
import { PlantFiltersComponent, PlantFilters } from "@/components/PlantFilters";
import { Plant } from "@/types/plant";
import { filterAndSortPlants } from "@/utils/plantFiltering";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { exportPlantsToCSV, exportPlantsToJSON } from "@/utils/exportUtils";
import { BulkOperationsBar } from "@/components/BulkOperationsBar";
import { useSearchDebounce } from "@/hooks/use-search";
import { Leaf, Plus, Calendar, Droplets, Sun, Bell, TrendingUp, MessageSquare, CheckSquare, Square } from "lucide-react";

const MyPlants = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);

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

  // Load plants from localStorage on mount
  useEffect(() => {
    const storedPlants = localStorage.getItem('agrotrack:plants');
    if (storedPlants) {
      try {
        const parsedPlants = JSON.parse(storedPlants);
        setPlants(parsedPlants);
      } catch (error) {
        console.error('Error loading plants from localStorage:', error);
      }
    }
  }, []);

  // Save plants to localStorage whenever plants change
  useEffect(() => {
    localStorage.setItem('agrotrack:plants', JSON.stringify(plants));
  }, [plants]);

  // CRUD operations
  const handleCreatePlant = (newPlant: Plant) => {
    setPlants(prev => [newPlant, ...prev]);
  };

  const handleUpdatePlant = (updatedPlant: Plant) => {
    setPlants(prev => prev.map(plant => 
      plant.id === updatedPlant.id ? updatedPlant : plant
    ));
  };

  const handleDeletePlant = (plantId: string) => {
    setPlants(prev => prev.filter(plant => plant.id !== plantId));
  };

  const handleWateredPlant = (plantId: string) => {
    setPlants(prev => prev.map(plant => 
      plant.id === plantId 
        ? { ...plant, lastWatered: new Date().toISOString() }
        : plant
    ));
  };

  // Bulk operation handlers
  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedItems.length} plant${selectedItems.length > 1 ? 's' : ''}?`;
    if (confirm(confirmMessage)) {
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

  const handleSubmitPlant = (plantData: Plant) => {
    if (editingPlant) {
      handleUpdatePlant(plantData);
    } else {
      handleCreatePlant(plantData);
    }
  };
  
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button variant="default" size="lg" asChild className="h-20 flex-col">
            <Link to="/plant-analysis">
              <Leaf className="w-8 h-8 mb-2" />
              AI Plant Analysis
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-20 flex-col"
            onClick={() => handleOpenModal()}
            data-testid="add-plant-btn"
          >
            <Plus className="w-8 h-8 mb-2" />
            Add New Plant
          </Button>
          <Button 
            variant={selectionMode ? "default" : "outline"} 
            size="lg" 
            className="h-20 flex-col"
            onClick={handleToggleSelectionMode}
            disabled={plants.length === 0}
          >
            {selectionMode ? <CheckSquare className="w-8 h-8 mb-2" /> : <Square className="w-8 h-8 mb-2" />}
            {selectionMode ? "Exit Select" : "Select Plants"}
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
                  <p className="text-xl font-bold text-green-800">{plants.length}</p>
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
                  <p className="text-xl font-bold text-blue-600">
                    {filterAndSortPlants(plants, { ...filters, careNeeds: 'needs-water' }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Care</p>
                  <p className="text-xl font-bold text-orange-600">
                    {filterAndSortPlants(plants, { ...filters, careNeeds: 'overdue' }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Healthy Plants</p>
                  <p className="text-xl font-bold text-purple-600">
                    {plants.filter(p => p.health === 'Excellent' || p.health === 'Good').length}
                  </p>
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
                  <Button variant="outline" size="sm" onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Plant
                  </Button>
                </div>
                <CardDescription>Track care history and manage multiple plants</CardDescription>
              </CardHeader>
              <CardContent>
                {plants.length > 0 ? (
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
                        <Button variant="ghost" onClick={() => setFilters({
                          search: '',
                          healthStatus: 'all',
                          category: 'all',
                          careNeeds: 'all',
                          sortBy: 'name',
                          sortOrder: 'asc'
                        })}>
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No plants yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start your garden by adding your first plant!
                    </p>
                    <Button onClick={() => handleOpenModal()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Plant
                    </Button>
                  </div>
                )}
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
