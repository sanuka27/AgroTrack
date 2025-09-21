import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Trash2, 
  Droplets, 
  Download, 
  X, 
  CheckCircle,
  Archive,
  Eye,
  Heart
} from 'lucide-react';

interface BulkOperationsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkWater: () => void;
  onBulkExport: () => void;
  onBulkMarkHealthy: () => void;
}

export const BulkOperationsBar: React.FC<BulkOperationsBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkWater,
  onBulkExport,
  onBulkMarkHealthy
}) => {
  if (selectedCount === 0) return null;

  return (
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-lg border-2 border-blue-200 bg-white">
      <div className="flex items-center gap-4 p-4">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} plant{selectedCount > 1 ? 's' : ''} selected
          </Badge>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onBulkWater}
            className="flex items-center gap-1"
            title="Mark all selected as watered"
          >
            <Droplets className="w-4 h-4 text-blue-500" />
            Water All
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onBulkMarkHealthy}
            className="flex items-center gap-1"
            title="Mark all selected as healthy"
          >
            <Heart className="w-4 h-4 text-green-500" />
            Mark Healthy
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onBulkExport}
            className="flex items-center gap-1"
            title="Export selected plants data"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onBulkDelete}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete all selected plants"
          >
            <Trash2 className="w-4 h-4" />
            Delete All
          </Button>
        </div>

        {/* Clear Selection */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="ml-2"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};