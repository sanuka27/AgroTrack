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
import { Settings, Bell, Clock, Monitor, Mail, Smartphone, Save, RotateCcw } from 'lucide-react';

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

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('reminder-preferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading reminder preferences:', error);
    }
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [preferences]);

  const handleSave = () => {
    onSave(preferences);
    setHasChanges(false);
  };

  const handleReset = () => {
    setPreferences(getDefaultReminderPreferences());
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
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
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
            {(['in-app', 'browser', 'email', 'push'] as NotificationMethod[]).map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={method}
                  checked={preferences.notificationMethods.includes(method)}
                  onCheckedChange={(checked) => updateNotificationMethod(method, checked as boolean)}
                />
                <Label htmlFor={method} className="flex items-center gap-2 cursor-pointer">
                  {getNotificationIcon(method)}
                  {getNotificationLabel(method)}
                </Label>
              </div>
            ))}
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
                  <div key={plant.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{plant.name}</h4>
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
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};