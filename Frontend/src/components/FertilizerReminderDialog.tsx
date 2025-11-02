/**
 * FertilizerReminderDialog Component
 * 
 * Dialog for creating fertilizer reminders for plants.
 * Pre-populates with smart defaults based on AI recommendations.
 */

import { useState, useEffect } from 'react';
import { Plant } from '../types/plant';
import { remindersApi } from '../lib/api/reminders';
import { useToast } from '../hooks/use-toast';
import api from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Leaf, Calendar, Clock, Sparkles, Loader2 } from 'lucide-react';

interface FertilizerReminderDialogProps {
  plant: Plant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReminderCreated?: () => void;
}

export function FertilizerReminderDialog({
  plant,
  open,
  onOpenChange,
  onReminderCreated,
}: FertilizerReminderDialogProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // Form state
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('09:00'); // Default 9 AM
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState(4); // Default 4 weeks
  
  // AI recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<{
    wateringFrequencyDays: number;
    fertilizerFrequencyWeeks: number;
    optimalWateringTime: string;
    careTips: string[];
    sunlightRequirement: string;
    soilType: string;
  } | null>(null);

  const fetchAIRecommendations = async () => {
    if (!plant) return;
    
    try {
      setIsLoadingAI(true);
      const response = await api.post('/ai-recommendations/plant-care', {
        plantName: plant.name,
        plantCategory: plant.category,
      });
      
      const data = response.data.data;
      setAiRecommendations(data);
      
      // Auto-populate with AI recommendations
      if (data.fertilizerFrequencyWeeks) {
        setFrequency(data.fertilizerFrequencyWeeks);
        
        // Calculate next fertilizer date with AI frequency
        const nextFertilizerDate = new Date();
        nextFertilizerDate.setDate(nextFertilizerDate.getDate() + (data.fertilizerFrequencyWeeks * 7));
        const dateStr = nextFertilizerDate.toISOString().split('T')[0];
        setDueDate(dateStr);
      }
      
      // Set optimal time if available (can be different from watering)
      if (data.optimalWateringTime) {
        // Extract time from string like "Early morning (6-8 AM)"
        const timeMatch = data.optimalWateringTime.match(/(\d{1,2})/);
        if (timeMatch) {
          const hour = parseInt(timeMatch[1]);
          setDueTime(`${hour.toString().padStart(2, '0')}:00`);
        }
      }
      
      // Auto-populate notes with fertilizer-specific care tips
      if (data.careTips && data.careTips.length > 0) {
        const fertilizerTips = data.careTips.filter(tip => 
          tip.toLowerCase().includes('fertiliz') || 
          tip.toLowerCase().includes('feed') ||
          tip.toLowerCase().includes('nutrient')
        );
        if (fertilizerTips.length > 0) {
          setNotes(fertilizerTips.join('\n• '));
        } else {
          setNotes('Apply fertilizer according to package instructions.');
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
      // Silently fail - user can still set reminder manually
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Calculate next fertilizer date when plant changes
  useEffect(() => {
    if (plant && open) {
      // Reset AI recommendations
      setAiRecommendations(null);
      
      // Default to 4 weeks for fertilizer
      const weeks = 4;
      setFrequency(weeks);
      
      // Calculate next fertilizer date (4 weeks from today)
      const nextFertilizerDate = new Date();
      nextFertilizerDate.setDate(nextFertilizerDate.getDate() + (weeks * 7));
      
      // Set date in YYYY-MM-DD format
      const dateStr = nextFertilizerDate.toISOString().split('T')[0];
      setDueDate(dateStr);
      
      // Reset notes
      setNotes('');
      
      // Fetch AI recommendations
      fetchAIRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plant, open]);

  const handleCreateReminder = async () => {
    if (!plant || !dueDate) return;

    try {
      setIsCreating(true);

      // Combine date and time
      const dueDateTime = new Date(`${dueDate}T${dueTime}`);
      
      // Create reminder
      await remindersApi.createReminder({
        title: `Fertilize ${plant.name}`,
        dueAt: dueDateTime.toISOString(),
        notes: notes || `Fertilize every ${frequency} weeks`,
        plantId: plant.id,
      });

      toast({
        title: '🌿 Fertilizer reminder created',
        description: `You'll be notified to fertilize ${plant.name} on ${dueDateTime.toLocaleDateString()}`,
        variant: 'default',
      });

      onOpenChange(false);
      onReminderCreated?.();
    } catch (error) {
      console.error('Failed to create fertilizer reminder:', error);
      toast({
        title: 'Failed to create reminder',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleFrequencyChange = (newFrequency: number) => {
    setFrequency(newFrequency);
    
    // Recalculate due date based on new frequency (in weeks)
    const nextFertilizerDate = new Date();
    nextFertilizerDate.setDate(nextFertilizerDate.getDate() + (newFrequency * 7));
    
    const dateStr = nextFertilizerDate.toISOString().split('T')[0];
    setDueDate(dateStr);
  };

  if (!plant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle>Set Fertilizer Reminder</DialogTitle>
            </div>
            {isLoadingAI && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-300 font-semibold">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI analyzing...</span>
              </div>
            )}
          </div>
          <DialogDescription>
            {aiRecommendations ? (
              <span className="text-green-700 dark:text-green-300 font-semibold">
                <Sparkles className="h-3 w-3 inline mr-1" />
                AI-optimized schedule for <span className="font-bold text-foreground">{plant.name}</span>
              </span>
            ) : (
              <span>Set fertilizer reminder for <span className="font-semibold text-foreground">{plant.name}</span></span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1 px-1">
          {/* Plant Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            {plant.imageUrl ? (
              <img
                src={plant.imageUrl}
                alt={plant.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Leaf className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{plant.name}</p>
              <p className="text-sm text-muted-foreground">{plant.category}</p>
            </div>
          </div>

          {/* AI Recommendations Banner */}
          {aiRecommendations && (
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:bg-gradient-to-r dark:from-green-900/40 dark:to-emerald-900/40 border-2 border-green-300 dark:border-green-600">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <div className="text-xs text-slate-800 dark:text-slate-200 space-y-0.5 font-medium">
                    {aiRecommendations.sunlightRequirement && (
                      <p>☀️ {aiRecommendations.sunlightRequirement}</p>
                    )}
                    {aiRecommendations.soilType && (
                      <p>🌱 {aiRecommendations.soilType}</p>
                    )}
                    {aiRecommendations.fertilizerFrequencyWeeks && (
                      <p>🌿 Fertilize every {aiRecommendations.fertilizerFrequencyWeeks} weeks</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fertilizer Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency" className="flex items-center gap-2">
              Fertilizer Frequency
              {aiRecommendations && (
                <Sparkles className="h-3 w-3 text-green-600 dark:text-green-400" />
              )}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="frequency"
                type="number"
                min="1"
                max="52"
                value={frequency}
                onChange={(e) => handleFrequencyChange(parseInt(e.target.value) || 1)}
                className={aiRecommendations ? "w-20 border-2 border-green-400 dark:border-green-500" : "w-20"}
              />
              <span className="text-sm text-muted-foreground">weeks</span>
              {isLoadingAI && (
                <Loader2 className="h-4 w-4 animate-spin text-green-500" />
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Next Fertilizer Date
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Due Time */}
          <div className="space-y-2">
            <Label htmlFor="dueTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reminder Time
              {aiRecommendations && (
                <Sparkles className="h-3 w-3 text-green-600 dark:text-green-400" />
              )}
            </Label>
            <Input
              id="dueTime"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              required
              className={aiRecommendations ? "border-2 border-green-400 dark:border-green-500" : ""}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              Care Notes
              {aiRecommendations && aiRecommendations.careTips.length > 0 && (
                <Sparkles className="h-3 w-3 text-green-600 dark:text-green-400" />
              )}
            </Label>
            <Textarea
              id="notes"
              placeholder="Add notes about fertilizing this plant..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={aiRecommendations && aiRecommendations.careTips.length > 0 ? "resize-none border-2 border-green-400 dark:border-green-500" : "resize-none"}
            />
          </div>

          {/* Preview */}
          {dueDate && (
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 mb-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                📅 Scheduled for {new Date(`${dueDate}T${dueTime}`).toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                You'll receive a push notification at this time
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateReminder}
            disabled={!dueDate || isCreating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreating ? (
              <>Creating...</>
            ) : (
              <>
                <Leaf className="h-4 w-4 mr-2" />
                Create Reminder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
