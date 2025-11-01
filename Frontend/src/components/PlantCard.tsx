import React from 'react';
import { Plant } from '@/types/plant';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Leaf, Droplets, Edit, Trash2, Sun, Bell } from 'lucide-react';
import { formatLastWatered, getHealthStatusColor } from '@/utils/plantUtils';
import { useToast } from '@/hooks/use-toast';

interface PlantCardProps {
  plant: Plant;
  onEdit: (plant: Plant) => void;
  onDelete: (plantId: string) => void;
  onWatered: (plantId: string) => void;
  isSelected?: boolean;
  onSelectionChange?: (plantId: string, selected: boolean) => void;
  selectionMode?: boolean;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onViewDetails?: (plant: Plant) => void;
  onSetReminder?: (plant: Plant) => void;
}

export function PlantCard({ 
  plant, 
  onEdit, 
  onDelete, 
  onWatered, 
  isSelected = false, 
  onSelectionChange, 
  selectionMode = false,
  showViewAll = true,
  onViewAll,
  onViewDetails,
  onSetReminder
}: PlantCardProps) {
  const { toast } = useToast();

  const handleWatered = () => {
    onWatered(plant.id);
    toast({
      title: "💧 Marked as watered",
      description: `${plant.name} has been watered today.`,
    });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${plant.name}?`)) {
      onDelete(plant.id);
      toast({
        title: "🗑️ Deleted",
        description: `${plant.name} has been removed from your collection.`,
      });
    }
  };

  const healthColor = getHealthStatusColor(plant.health);
  
  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${healthColor.border} ${
      isSelected ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-lg' : ''
    }`}>
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange?.(plant.id, checked as boolean)}
            className="bg-white border-2 shadow-md"
          />
        </div>
      )}
      
  <div className="flex relative min-h-0">
        {/* Plant Image */}
        {plant.imageUrl && (
          <div className="w-20 h-20 flex-shrink-0 relative overflow-hidden rounded-l-lg">
            <img
              src={plant.imageUrl}
              alt={plant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}
        
  {/* Content */}
  <CardContent className="flex-1 p-4 min-h-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg leading-tight break-words">{plant.name}</h3>
              <p className="text-sm text-muted-foreground">
                {plant.category}
                {plant.ageYears && ` • ${plant.ageYears} year${plant.ageYears !== 1 ? 's' : ''} old`}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWatered}
                className="h-8 w-8 p-0 hover:bg-blue-100 hover:scale-110 transition-all duration-200"
                title="Mark as watered"
              >
                <Droplets className="w-4 h-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetReminder?.(plant)}
                className="h-8 w-8 p-0 hover:bg-purple-100 hover:scale-110 transition-all duration-200"
                title="Set water reminder"
              >
                <Bell className="w-4 h-4 text-purple-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(plant)}
                className="h-8 w-8 p-0 hover:bg-emerald-100 hover:scale-110 transition-all duration-200"
                title="Edit plant"
              >
                <Edit className="w-4 h-4 text-emerald-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 hover:bg-rose-100 hover:scale-110 transition-all duration-200"
                title="Delete plant"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
              </Button>
              {/* View All button - shows full plant details */}
              {showViewAll && (
                <Button
                  size="sm"
                  onClick={() => onViewDetails ? onViewDetails(plant) : (onViewAll ? onViewAll() : window.location.assign('/plants'))}
                  className="ml-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 h-8 px-3 shadow-md hover:shadow-lg transition-all duration-200"
                  title="View full plant details"
                >
                  View All
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Last watered:</span>
              <span className="text-blue-600 font-medium break-words">
                {formatLastWatered(plant.lastWatered)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Health status:</span>
              <Badge variant="outline" className={`${healthColor.text} ${healthColor.bg} border-current`}>
                {plant.health}
              </Badge>
            </div>
            
            {/* Growth rate removed from UI */}
            
            <div className="flex justify-between items-center">
              <span>Light needs:</span>
              <span className="text-yellow-700 font-medium break-words">{plant.sunlight}</span>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
