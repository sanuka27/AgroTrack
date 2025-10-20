import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { X, Upload, Image as ImageIcon, Camera } from 'lucide-react';
import { uploadPlantImage } from '@/utils/firebaseStorage';
import { Plant, Category, Sunlight, Health } from '@/types/plant';
import { useToast } from '@/hooks/use-toast';
import { suggestPlantDefaults, PlantSuggestion } from '@/lib/api/agroAi';

interface AddPlantModalProps {
  mode: "create" | "edit";
  open: boolean;
  initial?: Partial<Plant>;
  onCancel: () => void;
  onSubmit: (plant: Plant, imageFile?: File | null) => void;
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
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(''); // Track actual Firebase URL separately from blob preview
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [skipUpload, setSkipUpload] = useState(false);
  const [isValid, setIsValid] = useState(false);
  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null);
  const [didAutoApply, setDidAutoApply] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const MAX_RETRIES = 2;
  const [aiOpen, setAiOpen] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);

  // Helpers: normalize common sunlight phrases to our select options
  const normalizeSunlight = (s?: string | null): Sunlight | undefined => {
    if (!s) return undefined;
    const t = s.toLowerCase();
    if (t.includes('full')) return 'Full Sun' as Sunlight;
    if (t.includes('partial') || t.includes('bright') || t.includes('indirect')) return 'Partial Sun' as Sunlight;
    if (t.includes('low')) return 'Low Light' as Sunlight;
    if (t.includes('shade')) return 'Shade' as Sunlight;
    return undefined;
  };

  // simple debounce for name field
  const [debouncedName, setDebouncedName] = useState(formData.name);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(formData.name), 650);
    return () => clearTimeout(t);
  }, [formData.name]);

  // Fetch AI suggestion when debounced name changes; moved to useCallback to support retry and manual triggers
  const fetchSuggestion = React.useCallback(async (name: string, attempt = 0) => {
    if (!name || name.trim().length < 3) return;
    // Don't auto-fetch when editing an existing plant; allow manual regeneration only
    if (mode === 'edit') return;
    if (didAutoApply) return;
    setAiLoading(true);
    if (attempt > 0) setRetrying(true);
    try {
      console.debug('[AI] Requesting suggestion for:', name, 'attempt', attempt);
      const response = await api.post('/ai/plant/suggest', { name });
      const json = response.data;
      console.debug('[AI] Received response:', json);

      if (json?.success && json.data) {
        const aiData: any = json.data;
        setAiSuggestion(aiData);
        // Auto-fill ALL fields immediately (user just wants help)
        setFormData(prev => {
          const aiSunRaw = (aiData.sunlight ?? aiData.sunlightRequirements) as string | undefined;
          const normalizedSun = normalizeSunlight(aiSunRaw) ?? (aiSunRaw as Sunlight) ?? prev.sunlight;
          return ({
            ...prev,
            wateringEveryDays: aiData.wateringFrequencyDays !== undefined && aiData.wateringFrequencyDays !== null ? String(aiData.wateringFrequencyDays) : prev.wateringEveryDays,
            sunlight: normalizedSun,
            fertilizerEveryWeeks: aiData.fertilizerScheduleWeeks !== undefined && aiData.fertilizerScheduleWeeks !== null ? String(aiData.fertilizerScheduleWeeks) : prev.fertilizerEveryWeeks,
            soil: aiData.soilType ?? prev.soil,
            category: (aiData.category as Category) ?? prev.category,
            notes: aiData.notes ?? prev.notes,
          });
        });

        // If key numeric fields are missing, consider retrying
        const missing = (aiData.wateringFrequencyDays === null || aiData.wateringFrequencyDays === undefined)
          || (aiData.fertilizerScheduleWeeks === null || aiData.fertilizerScheduleWeeks === undefined)
          || !aiData.notes || String(aiData.notes).trim().length < 8;
        if (missing && attempt < MAX_RETRIES) {
          console.debug('[AI] Response incomplete, retrying...', attempt);
          await new Promise(r => setTimeout(r, 700 + attempt * 300));
          return fetchSuggestion(name, attempt + 1);
        }

      } else if (json?.success && json?.rawText) {
        // Backend returned rawText (fallback). Try to heuristically parse it.
        const raw = String(json.rawText || '');
        const daysMatch = raw.match(/(\d+)\s*(?:day|days)\b/i);
        const weeksMatch = raw.match(/(\d+)\s*(?:week|weeks)\b/i);
        const sunlightMatch = raw.match(/(full sun|partial sun|partial shade|low light|shade|bright indirect|bright indirect light|bright light|indirect light)/i);
        const soilMatch = raw.match(/(well[- ]draining[\w\- ]+|potting mix|loam|sandy|clay|peat|well draining)/i);
        const categoryMatch = raw.match(/(indoor|outdoor|succulent|herb|flower|tree|houseplant|garden)/i);

        const parsedSuggestion = {
          wateringFrequencyDays: daysMatch ? Number(daysMatch[1]) : null,
          // include both keys so callers can read either `sunlight` or `sunlightRequirements`
          sunlight: sunlightMatch ? sunlightMatch[1] : undefined,
          sunlightRequirements: sunlightMatch ? sunlightMatch[1] : undefined,
          fertilizerScheduleWeeks: weeksMatch ? Number(weeksMatch[1]) : null,
          soilType: soilMatch ? soilMatch[1] : undefined,
          category: categoryMatch ? categoryMatch[1] : undefined,
          notes: raw,
        };

        console.debug('[AI] Parsed fallback suggestion:', parsedSuggestion);
        setAiSuggestion(parsedSuggestion);
        // Auto-fill all fields immediately
        setFormData(prev => {
          const aiSunRaw = (parsedSuggestion.sunlight ?? parsedSuggestion.sunlightRequirements) as string | undefined;
          const normalizedSun = normalizeSunlight(aiSunRaw) ?? (aiSunRaw as Sunlight) ?? prev.sunlight;
          return ({
            ...prev,
            wateringEveryDays: parsedSuggestion.wateringFrequencyDays !== undefined && parsedSuggestion.wateringFrequencyDays !== null ? String(parsedSuggestion.wateringFrequencyDays) : prev.wateringEveryDays,
            sunlight: normalizedSun,
            fertilizerEveryWeeks: parsedSuggestion.fertilizerScheduleWeeks !== undefined && parsedSuggestion.fertilizerScheduleWeeks !== null ? String(parsedSuggestion.fertilizerScheduleWeeks) : prev.fertilizerEveryWeeks,
            soil: parsedSuggestion.soilType ?? prev.soil,
            category: (parsedSuggestion.category as Category) ?? prev.category,
            notes: parsedSuggestion.notes ?? prev.notes,
          });
        });

        // If parsed values are missing (e.g., raw was truncated), retry
        const missing = (parsedSuggestion.wateringFrequencyDays === null || parsedSuggestion.wateringFrequencyDays === undefined)
          || (parsedSuggestion.fertilizerScheduleWeeks === null || parsedSuggestion.fertilizerScheduleWeeks === undefined)
          || !parsedSuggestion.notes || String(parsedSuggestion.notes).trim().length < 8;
        if (missing && attempt < MAX_RETRIES) {
          console.debug('[AI] Parsed fallback incomplete, retrying...', attempt);
          await new Promise(r => setTimeout(r, 700 + attempt * 300));
          return fetchSuggestion(name, attempt + 1);
        }
      }

    } catch (err) {
      console.warn('[AI] Suggestion request failed', err);
      toast({
        title: 'AI suggestion failed',
        description: 'Unable to fetch suggestions. See console for details.',
      });
    } finally {
      setRetrying(false);
      setAiLoading(false);
    }
  }, [didAutoApply, toast, mode]);

  // Call AI suggestions only in create mode when modal is open
  useEffect(() => {
    if (open && mode === 'create') fetchSuggestion(debouncedName, 0);
  }, [debouncedName, open, fetchSuggestion, mode]);

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
      setUploadedImageUrl(initial.imageUrl || ''); // Set uploaded URL for edit mode
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
      setUploadedImageUrl(''); // Reset uploaded URL
    }
  }, [open, initial]);

  // Validation
  React.useEffect(() => {
    const isFormValid = 
      formData.name.trim() !== '' &&
      formData.category.trim() !== '' &&
      formData.sunlight.trim() !== '' &&
      formData.wateringEveryDays.trim() !== '' &&
      !isNaN(Number(formData.wateringEveryDays)) &&
      Number(formData.wateringEveryDays) >= 1;
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

  const handleUploadToFirebase = async (): Promise<string | undefined> => {
    if (!imageFile) return undefined;
    try {
      const userId = (window as any).__AGROTRACK__?.userId || 'anonymous';
      const img = await uploadPlantImage(imageFile, userId, (progress) => setUploadProgress(progress));
      setUploadProgress(null);
      setUploadedImageUrl(img.url); // Store the actual Firebase URL
      return img.url;
    } catch (err) {
      console.error('Upload to Firebase failed', err);
  toast({ title: 'Image upload failed', description: 'Unable to upload image. Try again or save and upload later.' });
      setUploadProgress(null);
      return undefined;
    }
  };

  // Wrap upload with a timeout so a stuck upload doesn't block Save forever.
  const handleUploadWithTimeout = async (timeoutMs = 20000): Promise<string | undefined> => {
    if (!imageFile) return undefined;
    try {
      const uploadPromise = handleUploadToFirebase();
      const timeoutPromise = new Promise<string | undefined>((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error('upload-timeout'));
        }, timeoutMs);
      });

      return await Promise.race([uploadPromise, timeoutPromise]) as string | undefined;
    } catch (err: any) {
      console.warn('Upload timed out or failed:', err);
      // Clear progress UI
      setUploadProgress(null);
      toast({ title: 'Image upload timed out', description: 'Upload is taking too long. You can save now and the server will accept the image upload instead.' });
      return undefined;
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
    setUploadedImageUrl(''); // Reset uploaded URL
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onCancel();
  };

  const handleSave = async () => {
    if (!isValid) return;

    const plantData: Plant = {
      id: mode === 'edit' && initial?.id ? initial.id : crypto.randomUUID(),
      name: formData.name.trim(),
      category: formData.category.trim() as Category,
      sunlight: formData.sunlight.trim() as Sunlight,
      ageYears: formData.ageYears && !isNaN(Number(formData.ageYears)) ? Number(formData.ageYears) : undefined,
      wateringEveryDays: Number(formData.wateringEveryDays),
      fertilizerEveryWeeks: formData.fertilizerEveryWeeks && !isNaN(Number(formData.fertilizerEveryWeeks)) ? Number(formData.fertilizerEveryWeeks) : undefined,
      soil: formData.soil.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      imageUrl: uploadedImageUrl || (mode === 'edit' && initial?.imageUrl ? initial.imageUrl : undefined), // Use uploaded Firebase URL, NOT blob preview
      lastWatered: mode === 'edit' && initial?.lastWatered ? initial.lastWatered : null,
      health: formData.health as Health,
      growthRatePctThisMonth: formData.growthRatePctThisMonth && !isNaN(Number(formData.growthRatePctThisMonth)) ? Number(formData.growthRatePctThisMonth) : 0
    };

    // If a new local image file was chosen and the user hasn't chosen to skip client upload,
    // try uploading it to Firebase Storage first and use that URL.
    // If the client upload stalls or fails, fall back to sending the file to the backend (passFile below).
    let finalImageUrl = plantData.imageUrl;
    if (imageFile && !skipUpload) {
      const uploaded = await handleUploadWithTimeout(20000); // 20s timeout
      if (uploaded) {
        finalImageUrl = uploaded;
      }
    }

    plantData.imageUrl = finalImageUrl;

  // Pass imageFile only when we didn't upload to Firebase (avoid duplicate uploads).
  const passFile = imageFile && !finalImageUrl ? imageFile : null;
  onSubmit(plantData, passFile);

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
          {/* Circular image uploader */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <button
                type="button"
                className="w-28 h-28 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload plant photo"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Plant" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-sm text-muted-foreground">
                    <Camera className="w-6 h-6 text-emerald-600" />
                    <div className="mt-1">Add photo</div>
                  </div>
                )}
              </button>
              {uploadProgress !== null && (
                <div className="absolute -bottom-4 left-0 right-0 flex flex-col items-center text-center text-xs text-muted-foreground space-y-1 z-10">
                  <div className="bg-white px-2 rounded">Uploading {uploadProgress}%</div>
                  <div>
                    <button
                      type="button"
                      className="text-emerald-600 underline text-xs pointer-events-auto"
                      onClick={() => setSkipUpload(true)}
                    >
                      Save now (server will upload image)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

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
              <div className="mt-2">
                {aiLoading && (
                  <div className="text-sm text-emerald-600 flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                    AI is analyzing and filling suggestions...
                  </div>
                )}
                {!aiLoading && aiSuggestion && (
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-emerald-600">✓ Fields auto-filled by AI based on "{formData.name}"</div>
                    <Button size="sm" variant="outline" onClick={() => fetchSuggestion(formData.name, 0)} disabled={aiLoading || retrying}>
                      {retrying ? 'Retrying...' : 'Regenerate AI suggestion'}
                    </Button>
                  </div>
                )}
                {/* Debug JSON panel removed to simplify UI for end users */}
              </div>
          </div>

          {/* Category and Sunlight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant-category" className="text-sm font-medium text-gray-700">
                Category *
              </Label>
              <Input
                id="plant-category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="e.g., Indoor, Outdoor, Herb"
                className="w-full bg-gray-50"
                readOnly={aiLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plant-sunlight" className="text-sm font-medium text-gray-700">
                Sunlight Requirements *
              </Label>
              <Input
                id="plant-sunlight"
                value={formData.sunlight}
                onChange={(e) => handleInputChange('sunlight', e.target.value)}
                placeholder="e.g., Full Sun, Partial Sun"
                className="w-full bg-gray-50"
                readOnly={aiLoading}
              />
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
                type="text"
                value={formData.ageYears}
                onChange={(e) => handleInputChange('ageYears', e.target.value)}
                placeholder="e.g., 2"
                className="w-full bg-gray-50"
                readOnly={aiLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="watering-days" className="text-sm font-medium text-gray-700">
                Watering Frequency (every X days) *
              </Label>
              <Input
                id="watering-days"
                type="text"
                value={formData.wateringEveryDays}
                onChange={(e) => handleInputChange('wateringEveryDays', e.target.value)}
                placeholder="e.g., 7"
                className="w-full bg-gray-50"
                readOnly={aiLoading}
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
                type="text"
                value={formData.fertilizerEveryWeeks}
                onChange={(e) => handleInputChange('fertilizerEveryWeeks', e.target.value)}
                placeholder="e.g., 4"
                className="w-full bg-gray-50"
                readOnly={aiLoading}
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
                className="w-full bg-gray-50"
                readOnly={aiLoading}
              />
            </div>
          </div>

          {/* Health and Growth Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant-health" className="text-sm font-medium text-gray-700">
                Health Status
              </Label>
              <Select
                value={formData.health}
                onValueChange={(val: string) => handleInputChange('health', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Health Status" />
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
                type="text"
                value={formData.growthRatePctThisMonth}
                onChange={(e) => handleInputChange('growthRatePctThisMonth', e.target.value)}
                placeholder="0"
                className="w-full bg-gray-50"
              />
            </div>
          </div>

          {/* Image upload handled by circular uploader at the top */}

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

      {/* Hidden file input used by circular uploader */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
