import React, { useState } from 'react';
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
  const [imgError, setImgError] = React.useState(false);

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
    <TooltipProvider delayDuration={300}>
      <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl bg-white ${healthColor.border} ${
        isSelected ? 'ring-2 ring-green-500 shadow-xl scale-[0.98]' : ''
      }`}>
        {/* Selection Checkbox */}
        {selectionMode && (
          <div className="absolute top-3 left-3 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange?.(plant.id, checked as boolean)}
              className="bg-white border-2 shadow-lg h-5 w-5"
            />
          </div>
        )}
        
        {/* Plant Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 flex items-center justify-center">
          {plant.imageUrl && !imgError ? (
            <img
              src={plant.imageUrl}
              alt={plant.name}
              className="h-40 w-auto max-w-[90%] object-contain transition-transform duration-300 group-hover:scale-105 rounded-lg shadow-md"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="w-16 h-16 text-green-400/40" />
            </div>
          )}
          
          {/* Health Badge Overlay */}
          <div className="absolute top-3 right-3">
            <Badge className={`${healthColor.text} ${healthColor.bg} border-2 border-white shadow-lg text-xs px-2.5 py-0.5 font-semibold`}>
              {plant.health}
            </Badge>
          </div>
        </div>
          
        {/* Content */}
        <CardContent className="p-4 space-y-3">
          {/* Plant Info Header */}
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-gray-900 truncate">
              {plant.name}
            </h3>
            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-green-600" />
              <span className="font-medium">{plant.category}</span>
              {plant.ageYears && <span className="text-gray-400">• {plant.ageYears}yr old</span>}
            </p>
          </div>

          {/* Plant Details Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <span className="flex items-center gap-2 text-blue-700 text-xs font-medium">
                <Droplets className="w-4 h-4" />
                Last watered
              </span>
              <span className="text-blue-900 text-xs font-bold">
                {formatLastWatered(plant.lastWatered)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-100">
              <span className="flex items-center gap-2 text-amber-700 text-xs font-medium">
                <Sun className="w-4 h-4" />
                Light needs
              </span>
              <span className="text-amber-900 text-xs font-bold">
                {plant.sunlight}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleWatered}
                  size="sm"
                  className="flex-1 h-9 text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                >
                  <Droplets className="w-3.5 h-3.5 mr-1.5" />
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
                  className="flex-1 h-9 text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-500 hover:text-white border border-blue-200 hover:border-blue-500"
                >
                  <Bell className="w-3.5 h-3.5 mr-1.5" />
                  Remind
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set water reminder</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onSetFertilizerReminder?.(plant)}
                  size="sm"
                  className="flex-1 h-9 text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-500 hover:text-white border border-green-200 hover:border-green-500"
                >
                  <Sprout className="w-3.5 h-3.5 mr-1.5" />
                  Feed
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set fertilizer reminder</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onEdit(plant)}
                  size="sm"
                  variant="ghost"
                  className="flex-1 h-8 text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" />
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
                  className="flex-1 h-8 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove plant</p>
              </TooltipContent>
            </Tooltip>

            {showViewAll && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onViewDetails ? onViewDetails(plant) : (onViewAll ? onViewAll() : window.location.assign('/plants'))}
                    size="sm"
                    className="flex-1 h-8 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white"
                  >
                    View Details
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View full details</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}


