import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Plant, Category, Sunlight, Health } from '@/types/plant';
import { useToast } from '@/hooks/use-toast';

interface AddPlantModalProps {
  mode: "create" | "edit";
  open: boolean;
  initial?: Partial<Plant>;
  onCancel: () => void;
  onSubmit: (plant: Plant) => void;
}

export function AddPlantModal({ mode, open, initial, onCancel, onSubmit }: AddPlantModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '' as Category | '',
    sunlight: '' as Sunlight | '',
    ageYears: '',
    wateringEveryDays: '7',
    fertilizerEveryWeeks: '',
    soil: '',
    notes: '',
    health: 'Good' as Health,
    growthRatePctThisMonth: '0'
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isValid, setIsValid] = useState(false);

  // Initialize form with initial data when modal opens
  useEffect(() => {
    if (open && initial) {
      setFormData({
        name: initial.name || '',
        category: initial.category || '' as Category | '',
        sunlight: initial.sunlight || '' as Sunlight | '',
        ageYears: initial.ageYears?.toString() || '',
        wateringEveryDays: initial.wateringEveryDays?.toString() || '7',
        fertilizerEveryWeeks: initial.fertilizerEveryWeeks?.toString() || '',
        soil: initial.soil || '',
        notes: initial.notes || '',
        health: initial.health || 'Good',
        growthRatePctThisMonth: initial.growthRatePctThisMonth?.toString() || '0'
      });
      setImagePreview(initial.imageUrl || '');
    } else if (open && !initial) {
      // Reset form for create mode
      setFormData({
        name: '',
        category: '' as Category | '',
        sunlight: '' as Sunlight | '',
        ageYears: '',
        wateringEveryDays: '7',
        fertilizerEveryWeeks: '',
        soil: '',
        notes: '',
        health: 'Good' as Health,
        growthRatePctThisMonth: '0'
      });
      setImageFile(null);
      setImagePreview('');
    }
  }, [open, initial]);

  // Validation
  React.useEffect(() => {
    const isFormValid = 
      formData.name.trim() !== '' &&
      formData.category !== '' &&
      formData.sunlight !== '' &&
      parseInt(formData.wateringEveryDays) >= 1;
    setIsValid(isFormValid);
  }, [formData]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '' as Category | '',
      sunlight: '' as Sunlight | '',
      ageYears: '',
      wateringEveryDays: '7',
      fertilizerEveryWeeks: '',
      soil: '',
      notes: '',
      health: 'Good' as Health,
      growthRatePctThisMonth: '0'
    });
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onCancel();
  };

  const handleSave = () => {
    if (!isValid) return;

    const plantData: Plant = {
      id: mode === 'edit' && initial?.id ? initial.id : crypto.randomUUID(),
      name: formData.name.trim(),
      category: formData.category as Category,
      sunlight: formData.sunlight as Sunlight,
      ageYears: formData.ageYears ? parseInt(formData.ageYears) : undefined,
      wateringEveryDays: parseInt(formData.wateringEveryDays),
      fertilizerEveryWeeks: formData.fertilizerEveryWeeks ? parseInt(formData.fertilizerEveryWeeks) : undefined,
      soil: formData.soil.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      imageUrl: imagePreview || (mode === 'edit' && initial?.imageUrl ? initial.imageUrl : undefined),
      lastWatered: mode === 'edit' && initial?.lastWatered ? initial.lastWatered : null,
      health: formData.health as Health,
      growthRatePctThisMonth: parseInt(formData.growthRatePctThisMonth) || 0
    };

    onSubmit(plantData);
    
    // Show success toast
    toast({
      title: mode === 'create' ? "Plant Added Successfully!" : "Plant Updated Successfully!",
      description: mode === 'create' 
        ? `✅ ${plantData.name} has been added to your collection.`
        : `✅ ${plantData.name} has been updated.`,
    });

    handleClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-plant-title"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 m-4"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="add-plant-title" className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Plant' : 'Edit Plant'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Plant Name */}
          <div className="space-y-2">
            <Label htmlFor="plant-name" className="text-sm font-medium text-gray-700">
              Plant Name *
            </Label>
            <Input
              id="plant-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Monstera Deliciosa"
              className="w-full"
              required
            />
          </div>

          {/* Category and Sunlight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant-category" className="text-sm font-medium text-gray-700">
                Category *
              </Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value as Category)}>
                <SelectTrigger id="plant-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indoor">Indoor</SelectItem>
                  <SelectItem value="Outdoor">Outdoor</SelectItem>
                  <SelectItem value="Succulent">Succulent</SelectItem>
                  <SelectItem value="Herb">Herb</SelectItem>
                  <SelectItem value="Flower">Flower</SelectItem>
                  <SelectItem value="Tree">Tree</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plant-sunlight" className="text-sm font-medium text-gray-700">
                Sunlight Requirements *
              </Label>
              <Select value={formData.sunlight} onValueChange={(value) => handleInputChange('sunlight', value as Sunlight)}>
                <SelectTrigger id="plant-sunlight">
                  <SelectValue placeholder="Select sunlight needs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Sun">Full Sun</SelectItem>
                  <SelectItem value="Partial Sun">Partial Sun</SelectItem>
                  <SelectItem value="Low Light">Low Light</SelectItem>
                  <SelectItem value="Shade">Shade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Age and Watering */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant-age" className="text-sm font-medium text-gray-700">
                Age (years)
              </Label>
              <Input
                id="plant-age"
                type="number"
                min="0"
                step="0.5"
                value={formData.ageYears}
                onChange={(e) => handleInputChange('ageYears', e.target.value)}
                placeholder="e.g., 2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="watering-days" className="text-sm font-medium text-gray-700">
                Watering Frequency (every X days) *
              </Label>
              <Input
                id="watering-days"
                type="number"
                min="1"
                value={formData.wateringEveryDays}
                onChange={(e) => handleInputChange('wateringEveryDays', e.target.value)}
                placeholder="7"
                required
              />
            </div>
          </div>

          {/* Fertilizer and Soil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fertilizer-weeks" className="text-sm font-medium text-gray-700">
                Fertilizer Schedule (every X weeks)
              </Label>
              <Input
                id="fertilizer-weeks"
                type="number"
                min="1"
                value={formData.fertilizerEveryWeeks}
                onChange={(e) => handleInputChange('fertilizerEveryWeeks', e.target.value)}
                placeholder="e.g., 4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plant-soil" className="text-sm font-medium text-gray-700">
                Soil Type
              </Label>
              <Input
                id="plant-soil"
                value={formData.soil}
                onChange={(e) => handleInputChange('soil', e.target.value)}
                placeholder="e.g., Well-draining potting mix"
              />
            </div>
          </div>

          {/* Health and Growth Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant-health" className="text-sm font-medium text-gray-700">
                Health Status
              </Label>
              <Select value={formData.health} onValueChange={(value) => handleInputChange('health', value as Health)}>
                <SelectTrigger id="plant-health">
                  <SelectValue placeholder="Select health status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Needs light">Needs light</SelectItem>
                  <SelectItem value="Needs water">Needs water</SelectItem>
                  <SelectItem value="Attention">Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="growth-rate" className="text-sm font-medium text-gray-700">
                Growth Rate (% this month)
              </Label>
              <Input
                id="growth-rate"
                type="number"
                value={formData.growthRatePctThisMonth}
                onChange={(e) => handleInputChange('growthRatePctThisMonth', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Plant Photo
            </Label>
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Photo</span>
              </Button>
              
              {imagePreview && (
                <div className="flex items-center space-x-2">
                  <img 
                    src={imagePreview} 
                    alt="Plant preview" 
                    className="w-12 h-12 rounded-lg object-cover border"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="plant-notes" className="text-sm font-medium text-gray-700">
              Notes
            </Label>
            <Textarea
              id="plant-notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any special care instructions, observations, or notes..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          >
            {mode === 'create' ? 'Save Plant' : 'Update Plant'}
          </Button>
        </div>
      </div>
    </div>
  );
}
