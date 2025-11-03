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
      <Card className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg ${healthColor.border} ${
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
        
        {/* Plant Image */}
        <div className="relative h-24 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
          {plant.imageUrl && !imgError ? (
            <>
              <img
                src={plant.imageUrl}
                alt={plant.name}
                className="w-full h-full object-cover transition-transform duration-300"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-300 dark:text-green-700" />
            </div>
          )}
          
          {/* Health Badge Overlay */}
          <div className="absolute top-1 right-1">
            <Badge className={`${healthColor.text} ${healthColor.bg} border border-white shadow-sm text-[9px] px-1 py-0`}>
              {plant.health}
            </Badge>
          </div>
        </div>
          
        {/* Content */}
        <CardContent className="p-1.5 space-y-1">
          {/* Plant Info Header */}
          <div>
            <h3 className="font-bold text-sm leading-tight mb-0 text-gray-900 dark:text-gray-100">
              {plant.name}
            </h3>
            <p className="text-[10px] text-gray-900 dark:text-emerald-400 flex items-center gap-0.5 font-bold">
              <Leaf className="w-2.5 h-2.5 text-gray-900 dark:text-emerald-400" />
              {plant.category}
              {plant.ageYears && ` • ${plant.ageYears}yr`}
            </p>
          </div>

          {/* Plant Details Grid */}
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center justify-between p-1.5 rounded bg-blue-900 dark:bg-blue-900/20">
              <span className="flex items-center gap-1 text-white dark:text-blue-300 font-bold">
                <Droplets className="w-3 h-3 text-white dark:text-blue-300" />
                Last watered
              </span>
              <span className="text-white dark:text-blue-300 font-extrabold">
                {formatLastWatered(plant.lastWatered)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-1.5 rounded bg-amber-900 dark:bg-amber-900/20">
              <span className="flex items-center gap-1 text-white dark:text-amber-300 font-bold">
                <Sun className="w-3 h-3 text-white dark:text-amber-300" />
                Light needs
              </span>
              <span className="text-white dark:text-amber-400 font-extrabold">
                {plant.sunlight}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-0.5 pt-1 border-t">
            {/* Primary Actions */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleWatered}
                  size="sm"
                  className="flex-1 h-6 text-[9px] shadow-sm px-1 font-semibold transition-colors"
                  style={{ backgroundColor: '#38BDF8', color: '#FFFFFF' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0EA5E9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#38BDF8'}
                >
                  <Droplets className="w-2 h-2 mr-0.5" />
                  Water
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700 z-50">
                <p className="text-xs font-medium">Mark as watered today</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onSetReminder?.(plant)}
                  size="sm"
                  className="flex-1 h-6 text-[9px] shadow-sm px-1 font-semibold transition-colors border"
                  style={{ backgroundColor: '#E0F2FE', color: '#0369A1', borderColor: '#BAE6FD' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#BAE6FD'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0F2FE'}
                >
                  <Bell className="w-2 h-2 mr-0.5" />
                  Water
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700 z-50">
                <p className="text-xs font-medium">Set water reminder with AI</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onSetFertilizerReminder?.(plant)}
                  size="sm"
                  className="flex-1 h-6 text-[9px] shadow-sm px-1 font-semibold transition-colors border"
                  style={{ backgroundColor: '#D1FAE5', color: '#065F46', borderColor: '#A7F3D0' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A7F3D0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#D1FAE5'}
                >
                  <Sprout className="w-2 h-2 mr-0.5" />
                  Feed
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-gray-900 text-white border-gray-700 z-50">
                <p className="text-xs font-medium">Set fertilizer reminder with AI</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onEdit(plant)}
                  size="sm"
                  className="flex-1 h-5 text-[9px] shadow-sm px-0.5 font-medium transition-colors border"
                  style={{ backgroundColor: '#FFFFFF', color: '#374151', borderColor: '#E5E7EB' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <Edit className="w-2 h-2 mr-0.5" />
                  Edit
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-700 z-50">
                <p className="text-xs font-medium">Edit plant details</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleDelete}
                  size="sm"
                  className="flex-1 h-5 text-[9px] shadow-sm px-0.5 font-medium transition-colors"
                  style={{ backgroundColor: '#F87171', color: '#FFFFFF' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F87171'}
                >
                  <Trash2 className="w-2 h-2 mr-0.5" />
                  Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-700 z-50">
                <p className="text-xs font-medium">Remove from collection</p>
              </TooltipContent>
            </Tooltip>

            {showViewAll && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => onViewDetails ? onViewDetails(plant) : (onViewAll ? onViewAll() : window.location.assign('/plants'))}
                    size="sm"
                    className="flex-1 h-5 text-[9px] shadow-sm px-0.5 font-semibold transition-colors"
                    style={{ backgroundColor: '#059669', color: '#FFFFFF' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  >
                    View All
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-gray-900 text-white border-gray-700 z-50">
                  <p className="text-xs font-medium">View full plant details</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}


