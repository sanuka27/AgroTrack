import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CareLog, CareType, CareMetadata } from '@/types/care';
import { Plant } from '@/types/plant';
import { formatCareType, getCareTypeColor, createCareLog } from '@/utils/careUtils';
import { Calendar, Camera, Plus, X } from 'lucide-react';

interface CareLogModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (careLog: CareLog) => void;
  plant: Plant;
  initialCareType?: CareType;
}

export const CareLogModal: React.FC<CareLogModalProps> = ({
  open,
  onClose,
  onSubmit,
  plant,
  initialCareType = 'watering'
}) => {
  const [careType, setCareType] = useState<CareType>(initialCareType);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<CareMetadata>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const careLog = createCareLog(
      plant.id,
      careType,
      notes || undefined,
      Object.keys(metadata).length > 0 ? metadata : undefined,
      photos.length > 0 ? photos : undefined
    );
    
    // Override the date if user changed it
    careLog.date = new Date(date).toISOString();
    
    onSubmit(careLog);
    handleClose();
  };

  const handleClose = () => {
    setCareType('watering');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setPhotos([]);
    setMetadata({});
    onClose();
  };

  const updateMetadata = (key: keyof CareMetadata, value: unknown) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const renderCareSpecificFields = () => {
    switch (careType) {
      case 'watering':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="waterAmount">Water Amount (ml)</Label>
                <Input
                  id="waterAmount"
                  type="number"
                  placeholder="250"
                  value={metadata.waterAmount || ''}
                  onChange={(e) => updateMetadata('waterAmount', parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="wateringMethod">Watering Method</Label>
                <Select value={metadata.wateringMethod || ''} onValueChange={(value) => updateMetadata('wateringMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-watering">Top Watering</SelectItem>
                    <SelectItem value="bottom-watering">Bottom Watering</SelectItem>
                    <SelectItem value="spray">Spray Misting</SelectItem>
                    <SelectItem value="soaking">Soaking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'fertilizing':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fertilizerType">Fertilizer Type</Label>
                <Input
                  id="fertilizerType"
                  placeholder="e.g., Liquid, Granular"
                  value={metadata.fertilizerType || ''}
                  onChange={(e) => updateMetadata('fertilizerType', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fertilizerBrand">Brand</Label>
                <Input
                  id="fertilizerBrand"
                  placeholder="e.g., Miracle-Gro"
                  value={metadata.fertilizerBrand || ''}
                  onChange={(e) => updateMetadata('fertilizerBrand', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="concentration">Concentration</Label>
                <Select value={metadata.concentration || ''} onValueChange={(value) => updateMetadata('concentration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select strength" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-strength">Full Strength</SelectItem>
                    <SelectItem value="half-strength">Half Strength</SelectItem>
                    <SelectItem value="quarter-strength">Quarter Strength</SelectItem>
                    <SelectItem value="diluted">Heavily Diluted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="applicationMethod">Application Method</Label>
                <Select value={metadata.applicationMethod || ''} onValueChange={(value) => updateMetadata('applicationMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soil">Soil Application</SelectItem>
                    <SelectItem value="foliar">Foliar Spray</SelectItem>
                    <SelectItem value="slow-release">Slow Release</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'pruning':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pruningType">Pruning Type</Label>
              <Select value={metadata.pruningType || ''} onValueChange={(value) => updateMetadata('pruningType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadheading">Deadheading</SelectItem>
                  <SelectItem value="shaping">Shaping</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="propagation">Propagation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="partsRemoved">Parts Removed</Label>
              <Input
                id="partsRemoved"
                placeholder="e.g., dead leaves, brown tips"
                value={metadata.partsRemoved?.join(', ') || ''}
                onChange={(e) => updateMetadata('partsRemoved', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
              />
            </div>
          </div>
        );

      case 'health-check':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="overallHealth">Overall Health</Label>
              <Select value={metadata.overallHealth || ''} onValueChange={(value) => updateMetadata('overallHealth', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select health status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">🌟 Excellent</SelectItem>
                  <SelectItem value="good">😊 Good</SelectItem>
                  <SelectItem value="fair">😐 Fair</SelectItem>
                  <SelectItem value="poor">😟 Poor</SelectItem>
                  <SelectItem value="critical">🚨 Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="25"
                  value={metadata.measurements?.height || ''}
                  onChange={(e) => updateMetadata('measurements', {
                    ...metadata.measurements,
                    height: parseInt(e.target.value) || undefined
                  })}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  placeholder="20"
                  value={metadata.measurements?.width || ''}
                  onChange={(e) => updateMetadata('measurements', {
                    ...metadata.measurements,
                    width: parseInt(e.target.value) || undefined
                  })}
                />
              </div>
              <div>
                <Label htmlFor="leafCount">Leaf Count</Label>
                <Input
                  id="leafCount"
                  type="number"
                  placeholder="15"
                  value={metadata.measurements?.leafCount || ''}
                  onChange={(e) => updateMetadata('measurements', {
                    ...metadata.measurements,
                    leafCount: parseInt(e.target.value) || undefined
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 'repotting':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="oldPotSize">Old Pot Size</Label>
                <Input
                  id="oldPotSize"
                  placeholder="e.g., 4 inch"
                  value={metadata.oldPotSize || ''}
                  onChange={(e) => updateMetadata('oldPotSize', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newPotSize">New Pot Size</Label>
                <Input
                  id="newPotSize"
                  placeholder="e.g., 6 inch"
                  value={metadata.newPotSize || ''}
                  onChange={(e) => updateMetadata('newPotSize', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="soilType">Soil Type</Label>
              <Input
                id="soilType"
                placeholder="e.g., Potting mix, Cactus soil"
                value={metadata.soilType || ''}
                onChange={(e) => updateMetadata('soilType', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rootCondition">Root Condition</Label>
              <Select value={metadata.rootCondition || ''} onValueChange={(value) => updateMetadata('rootCondition', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">🌱 Healthy</SelectItem>
                  <SelectItem value="root-bound">🔄 Root Bound</SelectItem>
                  <SelectItem value="root-rot">🚨 Root Rot</SelectItem>
                  <SelectItem value="needs-attention">⚠️ Needs Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Log Care Activity</span>
            <Badge variant="outline">{plant.name}</Badge>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Care Type Selection */}
          <div className="space-y-2">
            <Label>Care Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['watering', 'fertilizing', 'pruning', 'repotting', 'health-check', 'pest-treatment'] as CareType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={careType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCareType(type)}
                  className="justify-start"
                >
                  {formatCareType(type)}
                </Button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="care-date">Date</Label>
            <Input
              id="care-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Care-specific fields */}
          {renderCareSpecificFields()}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details about this care activity..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Photos (placeholder for future implementation) */}
          <div className="space-y-2">
            <Label>Photos (Coming Soon)</Label>
            <Card className="p-4 border-dashed">
              <div className="flex items-center justify-center text-muted-foreground">
                <Camera className="w-6 h-6 mr-2" />
                Photo upload functionality will be added in a future update
              </div>
            </Card>
          </div>

          {/* Form Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Log Care Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};