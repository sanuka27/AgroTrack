import React from 'react';
import { Plant } from '@/types/plant';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, Droplets, Edit, Trash2, Sun } from 'lucide-react';
import { formatLastWatered, getHealthStatusColor, getGrowthRateColor } from '@/utils/plantUtils';
import { useToast } from '@/hooks/use-toast';

interface PlantCardProps {
  plant: Plant;
  onEdit: (plant: Plant) => void;
  onDelete: (plantId: string) => void;
  onWatered: (plantId: string) => void;
}

export function PlantCard({ plant, onEdit, onDelete, onWatered }: PlantCardProps) {
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
  const growthColor = getGrowthRateColor(plant.growthRatePctThisMonth || 0);
  return (
    <Card className={`overflow-hidden border-2 transition-shadow hover:shadow-lg ${healthColor.border}`}>
      <div className="flex">
        {/* Plant Image */}
        {plant.imageUrl && (
          <div className="w-20 h-20 flex-shrink-0">
            <img
              src={plant.imageUrl}
              alt={plant.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Content */}
        <CardContent className="flex-1 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg leading-tight">{plant.name}</h3>
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
                className="h-8 w-8 p-0 hover:bg-blue-50"
                title="Mark as watered"
              >
                <Droplets className="w-4 h-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(plant)}
                className="h-8 w-8 p-0 hover:bg-emerald-50"
                title="Edit plant"
              >
                <Edit className="w-4 h-4 text-emerald-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 hover:bg-rose-50"
                title="Delete plant"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Last watered:</span>
              <span className="text-blue-600 font-medium">
                {formatLastWatered(plant.lastWatered)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Health status:</span>
              <Badge variant="outline" className={`${healthColor.text} ${healthColor.bg} border-current`}>
                {plant.health}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Growth rate:</span>
              <span className={`font-medium ${growthColor}`}>
                {plant.growthRatePctThisMonth >= 0 ? '+' : ''}{plant.growthRatePctThisMonth || 0}% this month
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Light needs:</span>
              <div className="flex items-center space-x-1">
                <Sun className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-700 font-medium">{plant.sunlight}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
