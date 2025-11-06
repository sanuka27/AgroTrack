import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ReminderPreferences, NotificationMethod } from '@/types/reminders';
import { Plant } from '@/types/plant';
import { getDefaultReminderPreferences } from '@/utils/reminderUtils';
import { Settings, Bell, Clock, Monitor, Mail, Smartphone, Save, RotateCcw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { usersApi } from '@/lib/api/users';
import { useToast } from '@/hooks/use-toast';

interface ReminderSettingsProps {
  plants: Plant[];
  onSave: (preferences: ReminderPreferences) => void;
  onClose: () => void;
}

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({
  plants,
  onSave,
  onClose
}) => {
  const [preferences, setPreferences] = useState<ReminderPreferences>(getDefaultReminderPreferences());
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load preferences from API
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const data = await usersApi.getReminderPreferences();
        if (data) {
          setPreferences(data);
        }
      } catch (error) {
        console.error('Error loading reminder preferences:', error);
        toast({
          title: 'Error',
          description: 'Failed to load preferences. Using defaults.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [toast]);

  // Track changes
  useEffect(() => {
    if (!loading) {
      setHasChanges(true);
    }
  }, [preferences, loading]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await usersApi.updateReminderPreferences(preferences);
      toast({
        title: 'Success',
        description: 'Reminder preferences saved successfully!',
      });
      onSave(preferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving reminder preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const defaultPrefs = getDefaultReminderPreferences();
    setPreferences(defaultPrefs);
    toast({
      title: 'Reset',
      description: 'Preferences reset to defaults',
    });
  };

  const updateNotificationMethod = (method: NotificationMethod, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notificationMethods: enabled
        ? [...prev.notificationMethods, method]
        : prev.notificationMethods.filter(m => m !== method)
    }));
  };

  const updatePlantSetting = (plantId: string, setting: 'enabled' | 'customFrequency', value: boolean | Record<string, number>) => {
    setPreferences(prev => ({
      ...prev,
      plantSpecificSettings: {
        ...prev.plantSpecificSettings,
        [plantId]: {
          ...prev.plantSpecificSettings[plantId],
          [setting]: value
        }
      }
    }));
  };

  const getNotificationIcon = (method: NotificationMethod) => {
    switch (method) {
      case 'browser':
        return <Monitor className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'push':
        return <Smartphone className="w-4 h-4" />;
      case 'in-app':
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationLabel = (method: NotificationMethod) => {
    switch (method) {
      case 'browser':
        return 'Browser Notifications';
      case 'email':
        return 'Email Notifications';
      case 'push':
        return 'Push Notifications';
      case 'in-app':
        return 'In-App Notifications';
    }
  };

  const getNotificationStatus = (method: NotificationMethod): 'working' | 'coming-soon' => {
    switch (method) {
      case 'in-app':
        return 'working';
      case 'browser':
        return 'working';
      case 'push':
        return 'working';
      case 'email':
        return 'coming-soon';
      default:
        return 'coming-soon';
    }
  };

  const getNotificationStatusBadge = (method: NotificationMethod) => {
    const status = getNotificationStatus(method);
    if (status === 'working') {
      return null; // Don't show badge for working methods
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-3 h-3" />
          Coming Soon
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Reminder Settings</h2>
            <p className="text-muted-foreground">Customize how and when you receive care reminders</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled">Enable Reminders</Label>
                <p className="text-sm text-muted-foreground">Turn smart reminders on or off</p>
              </div>
              <Switch
                id="enabled"
                checked={preferences.enabled}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="advance-notice">Advance Notice (Days)</Label>
              <Input
                id="advance-notice"
                className="bg-background"
                type="number"
                min="0"
                max="30"
                value={preferences.advanceNoticeDays}
                onChange={(e) =>
                  setPreferences(prev => ({
                    ...prev,
                    advanceNoticeDays: parseInt(e.target.value) || 0
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Show reminders this many days before they're due
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-reminders">Max Reminders Per Day</Label>
              <Input
                id="max-reminders"
                className="bg-background"
                type="number"
                min="1"
                max="50"
                value={preferences.maxRemindersPerDay}
                onChange={(e) =>
                  setPreferences(prev => ({
                    ...prev,
                    maxRemindersPerDay: parseInt(e.target.value) || 10
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Limit the number of reminders shown per day
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Notification Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['in-app', 'browser', 'push', 'email'] as NotificationMethod[]).map((method) => {
              const isComingSoon = getNotificationStatus(method) === 'coming-soon';
              return (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={method}
                      checked={preferences.notificationMethods.includes(method)}
                      onCheckedChange={(checked) => updateNotificationMethod(method, checked as boolean)}
                      disabled={isComingSoon}
                    />
                    <Label 
                      htmlFor={method} 
                      className={`flex items-center gap-2 ${isComingSoon ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      {getNotificationIcon(method)}
                      {getNotificationLabel(method)}
                    </Label>
                  </div>
                  {getNotificationStatusBadge(method)}
                </div>
              );
            })}
            <p className="text-sm text-muted-foreground mt-3">
              Choose how you want to be notified about care reminders
            </p>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quiet Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
                <p className="text-sm text-muted-foreground">Pause non-urgent reminders during specified hours</p>
              </div>
              <Switch
                id="quiet-hours-enabled"
                checked={preferences.quietHours.enabled}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, enabled: checked }
                  }))
                }
              />
            </div>

            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <Input
                    id="quiet-start"
                    className="bg-background"
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) =>
                      setPreferences(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, start: e.target.value }
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End Time</Label>
                  <Input
                    id="quiet-end"
                    className="bg-background"
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) =>
                      setPreferences(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, end: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plant-Specific Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Plant-Specific Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {plants.map((plant) => {
                const plantSettings = preferences.plantSpecificSettings[plant.id] || { enabled: true };
                return (
                  <div key={plant.id} className="border border-border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{plant.name}</h4>
                      <Switch
                        checked={plantSettings.enabled}
                        onCheckedChange={(checked) =>
                          updatePlantSetting(plant.id, 'enabled', checked)
                        }
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plantSettings.enabled ? 'Reminders enabled' : 'Reminders disabled'}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Enable or disable reminders for specific plants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Save/Cancel Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};