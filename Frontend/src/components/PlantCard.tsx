import React from 'react';
import { Plant } from '@/types/plant';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Leaf, Droplets, Edit, Trash2, Sun, Bell, Sprout } from 'lucide-react';
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
  onSetFertilizerReminder?: (plant: Plant) => void;
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
  onSetReminder,
  onSetFertilizerReminder
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
    <TooltipProvider>
      <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl ${healthColor.border} ${
        isSelected ? 'ring-2 ring-blue-500 ring-opacity-50 shadow-lg' : ''
      }`}>
        {/* Selection Checkbox */}
        {selectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange?.(plant.id, checked as boolean)}
              className="bg-white border-2 shadow-md"
            />
          </div>
        )}
        
        {/* Plant Image */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
          {plant.imageUrl ? (
            <>
              <img
                src={plant.imageUrl}
                alt={plant.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="w-12 h-12 text-green-300 dark:text-green-700" />
            </div>
          )}
          
          {/* Health Badge Overlay */}
          <div className="absolute top-2 right-2">
            <Badge className={`${healthColor.text} ${healthColor.bg} border border-white shadow-sm text-xs`}>
              {plant.health}
            </Badge>
          </div>
        </div>
          
        {/* Content */}
        <CardContent className="p-3 space-y-2.5">
          {/* Plant Info Header */}
          <div>
            <h3 className="font-bold text-base leading-tight mb-0.5 text-gray-900 dark:text-gray-100">
              {plant.name}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Leaf className="w-3 h-3" />
              {plant.category}
              {plant.ageYears && ` • ${plant.ageYears}yr`}
            </p>
          </div>

          {/* Plant Details Grid */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-1.5 rounded bg-blue-50 dark:bg-blue-900/20">
              <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <Droplets className="w-3 h-3 text-blue-600" />
                Last watered
              </span>
              <span className="text-blue-700 dark:text-blue-400 font-semibold">
                {formatLastWatered(plant.lastWatered)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-1.5 rounded bg-yellow-50 dark:bg-yellow-900/20">
              <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                <Sun className="w-3 h-3 text-yellow-600" />
                Light needs
              </span>
              <span className="text-yellow-700 dark:text-yellow-400 font-semibold">
                {plant.sunlight}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
            {/* Primary Actions */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleWatered}
                  size="sm"
                  className="flex-1 h-8 text-xs bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-sm"
                >
                  <Droplets className="w-3 h-3 mr-1" />
                  Water
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark as watered today</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onSetReminder?.(plant)}
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Bell className="w-3 h-3 mr-1 text-blue-600" />
                  Water
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set water reminder with AI</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onSetFertilizerReminder?.(plant)}
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Sprout className="w-3 h-3 mr-1 text-green-600" />
                  Feed
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set fertilizer reminder with AI</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onEdit(plant)}
                  size="sm"
                  variant="ghost"
                  className="flex-1 h-7 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit plant details</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleDelete}
                  size="sm"
                  variant="ghost"
                  className="flex-1 h-7 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove from collection</p>
              </TooltipContent>
            </Tooltip>

            {showViewAll && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onViewDetails ? onViewDetails(plant) : (onViewAll ? onViewAll() : window.location.assign('/plants'))}
                    size="sm"
                    className="flex-1 h-7 text-xs bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-sm"
                  >
                    View All
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View full plant details</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}


