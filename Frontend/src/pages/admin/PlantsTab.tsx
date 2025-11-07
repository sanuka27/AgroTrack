import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminPlant } from '@/lib/api/admin';
import { Search, Leaf, Eye, Trash2, Droplets, Sun, Calendar } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type HealthFilter = 'all' | 'Healthy' | 'Needs Attention' | 'Critical';

export function PlantsTab() {
  const { toast } = useToast();
  const [plants, setPlants] = useState<AdminPlant[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'view' | 'delete' | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<AdminPlant | null>(null);
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    const loadPlants = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getPlants({
          health: healthFilter === 'all' ? undefined : healthFilter,
          limit: 100
        });
        setPlants(response.plants);
      } catch (error) {
        console.error('Error loading plants:', error);
        toast({ title: "Error", description: "Failed to load plants.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadPlants();
  }, [toast, healthFilter]);

  const filteredPlants = plants.filter(plant => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return plant.name.toLowerCase().includes(search) || 
           plant.species?.toLowerCase().includes(search) ||
           plant.category.toLowerCase().includes(search) ||
           plant.ownerName.toLowerCase().includes(search);
  });

  const getHealthBadge = (health: AdminPlant['health']) => {
    switch (health) {
      case 'Healthy': 
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">Healthy</Badge>;
      case 'Needs Attention': 
        return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Needs Attention</Badge>;
      case 'Critical': 
        return <Badge variant="destructive" className="bg-rose-100 text-rose-800 border-rose-200">Critical</Badge>;
      default: 
        return <Badge variant="outline">{health}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatLastWatered = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const openDialog = (plant: AdminPlant, action: 'view' | 'delete') => {
    setSelectedPlant(plant);
    setDialogAction(action);
    setActionReason('');
    setDialogOpen(true);
  };

  const handleDialogConfirm = async () => {
    if (!selectedPlant || !dialogAction) return;
    
    if (dialogAction === 'delete') {
      setActionLoading(selectedPlant._id);
      try {
        await adminApi.deletePlant(selectedPlant._id, actionReason);
        setPlants(prev => prev.filter(p => p._id !== selectedPlant._id));
        
        const description = actionReason 
          ? `The plant has been deleted. The owner (${selectedPlant.ownerName}) has been notified with your reason.`
          : `The plant has been deleted. The owner (${selectedPlant.ownerName}) has been notified.`;
        
        toast({ 
          title: 'Plant Deleted Successfully', 
          description, 
          duration: 5000 
        });
        
        setDialogOpen(false);
        setSelectedPlant(null);
        setDialogAction(null);
        setActionReason('');
      } catch (error: any) {
        console.error('Error deleting plant:', error);
        const errorMsg = error?.response?.data?.message || 'Failed to delete plant. Please try again.';
        toast({ 
          title: 'Error', 
          description: errorMsg, 
          variant: 'destructive' 
        });
      } finally {
        setActionLoading(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const healthyCount = plants.filter(p => p.health === 'Healthy').length;
  const needsAttentionCount = plants.filter(p => p.health === 'Needs Attention').length;
  const criticalCount = plants.filter(p => p.health === 'Critical').length;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-600" />
                Plant Management
              </CardTitle>
              <CardDescription>
                {filteredPlants.length} of {plants.length} plants
                {healthFilter !== 'all' && ` (filtered by ${healthFilter})`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {filteredPlants.length}
              </Badge>
              {healthyCount > 0 && (
                <Badge variant="secondary" className="text-lg px-3 py-1 bg-emerald-100 text-emerald-800">
                  {healthyCount} healthy
                </Badge>
              )}
              {needsAttentionCount > 0 && (
                <Badge variant="secondary" className="text-lg px-3 py-1 bg-amber-100 text-amber-800">
                  {needsAttentionCount} needs attention
                </Badge>
              )}
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-lg px-3 py-1">
                  {criticalCount} critical
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by plant name, species, category, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'Healthy', 'Needs Attention', 'Critical'] as HealthFilter[]).map((filterOption) => (
                <Button
                  key={filterOption}
                  variant={healthFilter === filterOption ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHealthFilter(filterOption)}
                  className="capitalize"
                >
                  {filterOption}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl ring-1 ring-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Plant</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Owner</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Health</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Last Watered</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Sunlight</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Date Added</th>
                  <th className="text-left py-3 px-6 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPlants.map((plant) => (
                  <tr
                    key={plant._id}
                    className={`hover:bg-muted/50 transition-colors ${
                      plant.health === 'Needs Attention' ? 'bg-amber-50/30 dark:bg-amber-900/20' : 
                      plant.health === 'Critical' ? 'bg-rose-50/30 dark:bg-rose-900/20' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {plant.imageUrl ? (
                          <img 
                            src={plant.imageUrl} 
                            alt={plant.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                            <Leaf className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-foreground">{plant.name}</div>
                          {plant.species && (
                            <div className="text-sm text-muted-foreground">{plant.species}</div>
                          )}
                          <div className="text-xs text-muted-foreground">{plant.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-foreground">{plant.ownerName}</div>
                      <div className="text-sm text-muted-foreground">{plant.ownerEmail}</div>
                    </td>
                    <td className="py-4 px-6">
                      {getHealthBadge(plant.health)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{formatLastWatered(plant.lastWatered)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span className="text-sm">{plant.sunlight}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        {formatDate(plant.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(plant, 'view')}
                          title="View Plant Details"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(plant, 'delete')}
                          disabled={actionLoading === plant._id}
                          className="text-rose-600 hover:text-rose-700"
                          title="Delete Plant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPlants.length === 0 && (
              <div className="text-center py-12">
                <Leaf className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No plants found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className={dialogAction === 'view' ? 'max-w-3xl max-h-[80vh] overflow-y-auto' : ''}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAction === 'view' && 'View Plant Details'}
              {dialogAction === 'delete' && 'Permanently Delete Plant'}
            </AlertDialogTitle>
            {dialogAction === 'view' && selectedPlant ? (
              <div className="space-y-4 text-left pt-4">
                <div className="flex items-start gap-4">
                  {selectedPlant.imageUrl ? (
                    <img 
                      src={selectedPlant.imageUrl} 
                      alt={selectedPlant.name}
                      className="w-32 h-32 rounded-lg object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-green-100 flex items-center justify-center">
                      <Leaf className="w-16 h-16 text-green-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-foreground mb-1">{selectedPlant.name}</h3>
                    {selectedPlant.species && (
                      <p className="text-muted-foreground italic mb-2">{selectedPlant.species}</p>
                    )}
                    <div className="flex items-center gap-3">
                      {getHealthBadge(selectedPlant.health)}
                      <Badge variant="outline">{selectedPlant.category}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Owner Information</h4>
                    <p className="text-foreground">{selectedPlant.ownerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedPlant.ownerEmail}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Date Added</h4>
                    <p className="text-foreground">{formatDate(selectedPlant.createdAt)}</p>
                  </div>
                </div>

                <div className="border-t pt-4 grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-1 flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      Last Watered
                    </h4>
                    <p className="text-foreground">{formatLastWatered(selectedPlant.lastWatered)}</p>
                    <p className="text-sm text-muted-foreground">Every {selectedPlant.wateringFrequency} days</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      Sunlight
                    </h4>
                    <p className="text-foreground">{selectedPlant.sunlight}</p>
                  </div>
                  {selectedPlant.ageYears && (
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Age</h4>
                      <p className="text-foreground">{selectedPlant.ageYears} years old</p>
                    </div>
                  )}
                </div>

                {selectedPlant.location && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-1">Location</h4>
                    <p className="text-foreground">{selectedPlant.location}</p>
                  </div>
                )}

                {selectedPlant.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-2">Notes</h4>
                    <div className="bg-muted/50 p-4 rounded-lg text-foreground whitespace-pre-wrap">
                      {selectedPlant.notes}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium text-foreground">Plant ID:</span>
                      <p className="text-muted-foreground font-mono text-xs mt-1 break-all">{selectedPlant._id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Last Updated:</span>
                      <p className="text-muted-foreground mt-1">{formatDate(selectedPlant.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <AlertDialogDescription className="space-y-3">
                {dialogAction === 'delete' && (
                  <>
                    <p>This action cannot be undone. The plant will be permanently deleted from the system.</p>
                    {selectedPlant && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <p className="text-sm text-blue-900">
                          <strong>Note:</strong> The plant owner (<strong>{selectedPlant.ownerName}</strong>) will be notified about this deletion{actionReason ? ' along with your reason' : ''}.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {dialogAction === 'delete' && (
            <div className="space-y-2 my-4">
              <Label htmlFor="reason">Reason for deletion</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for deleting this plant (will be sent to the owner)..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This message will be included in the notification sent to {selectedPlant?.ownerName}.
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {dialogAction === 'delete' && (
              <AlertDialogAction
                onClick={handleDialogConfirm}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Delete Permanently
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
