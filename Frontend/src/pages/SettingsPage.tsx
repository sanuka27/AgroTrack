import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Sun, Moon, Cog, Bell, User } from 'lucide-react';

// LocalStorage key
const SETTINGS_KEY = 'agrotrack:settings';

type ThemeOption = 'light' | 'dark' | 'system';

type UnitsOption = 'metric' | 'imperial';

interface SettingsData {
  theme: ThemeOption;
  units: UnitsOption;
  notifications: {
    watering: boolean;
    fertilizer: boolean;
    dailySummary: boolean;
    dailySummaryTime: string; // HH:mm
  };
}

const defaultSettings: SettingsData = {
  theme: 'system',
  units: 'metric',
  notifications: {
    watering: true,
    fertilizer: true,
    dailySummary: false,
    dailySummaryTime: '08:00',
  },
};

function applyTheme(theme: ThemeOption) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark = theme === 'dark' || (theme === 'system' && prefersDark);
  if (useDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', theme);
}

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<{ dailySummaryTime?: string }>({});

  // Load settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed: SettingsData = JSON.parse(raw);
        setSettings({ ...defaultSettings, ...parsed });
        // Apply saved theme on load
        applyTheme(parsed.theme ?? defaultSettings.theme);
      } else {
        applyTheme(defaultSettings.theme);
      }
    } catch (e) {
      console.error('Failed to load settings', e);
      applyTheme(defaultSettings.theme);
    }
  }, []);

  // Handlers
  const handleThemeChange = (value: ThemeOption) => {
    setSettings((prev) => ({ ...prev, theme: value }));
    setDirty(true);
    // Apply immediately
    applyTheme(value);
  };

  const handleUnitsChange = (value: UnitsOption) => {
    setSettings((prev) => ({ ...prev, units: value }));
    setDirty(true);
  };

  const validateTime = (value: string) => {
    if (!/^\d{2}:\d{2}$/.test(value)) return 'Invalid time format';
    const [h, m] = value.split(':').map(Number);
    if (h < 0 || h > 23 || m < 0 || m > 59) return 'Time must be HH:MM (00-23:00-59)';
    return undefined;
  };

  const handleTimeChange = (value: string) => {
    const err = validateTime(value);
    setErrors((e) => ({ ...e, dailySummaryTime: err }));
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, dailySummaryTime: value },
    }));
    setDirty(true);
  };

  const handleToggle = (key: 'watering' | 'fertilizer' | 'dailySummary', value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
    setDirty(true);
  };

  const handleSave = () => {
    if (settings.notifications.dailySummary && errors.dailySummaryTime) {
      toast({ title: 'Fix errors', description: 'Please correct the invalid time.', variant: 'destructive' });
      return;
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
    setDirty(false);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    applyTheme(defaultSettings.theme);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    setErrors({});
    setDirty(false);
    toast({ title: 'Settings reset', description: 'Defaults restored.' });
  };

  const summary = useMemo(() => {
    const parts = [
      `Theme: ${settings.theme}`,
      `Units: ${settings.units}`,
      `Watering: ${settings.notifications.watering ? 'On' : 'Off'}`,
      `Fertilizer: ${settings.notifications.fertilizer ? 'On' : 'Off'}`,
      `Daily Summary: ${settings.notifications.dailySummary ? settings.notifications.dailySummaryTime : 'Off'}`,
    ];
    return parts.join(' • ');
  }, [settings]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account, preferences, and notifications</p>
          </div>

          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-green-600" /> Account</CardTitle>
              <CardDescription>Basic account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ''} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Current Summary</Label>
                  <Input id="summary" value={summary} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cog className="w-5 h-5 text-green-600" /> Preferences</CardTitle>
              <CardDescription>Theme and measurement units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme */}
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={settings.theme} onValueChange={(v) => handleThemeChange(v as ThemeOption)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2"><Sun className="w-4 h-4" /> Light</div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2"><Moon className="w-4 h-4" /> Dark</div>
                      </SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Units */}
                <div className="space-y-2">
                  <Label>Measurement Units</Label>
                  <Select value={settings.units} onValueChange={(v) => handleUnitsChange(v as UnitsOption)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (°C, cm)</SelectItem>
                      <SelectItem value="imperial">Imperial (°F, in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-green-600" /> Notifications</CardTitle>
              <CardDescription>Control reminders and daily summaries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-1">
                    <p className="font-medium">Watering Reminders</p>
                    <p className="text-sm text-muted-foreground">Get notified when plants need water</p>
                  </div>
                  <Switch checked={settings.notifications.watering} onCheckedChange={(v) => handleToggle('watering', v)} />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4">
                  <div className="space-y-1">
                    <p className="font-medium">Fertilizer Reminders</p>
                    <p className="text-sm text-muted-foreground">Reminders for fertilizing schedule</p>
                  </div>
                  <Switch checked={settings.notifications.fertilizer} onCheckedChange={(v) => handleToggle('fertilizer', v)} />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4 md:col-span-2">
                  <div className="space-y-1">
                    <p className="font-medium">Daily Summary</p>
                    <p className="text-sm text-muted-foreground">Receive a daily summary of plant care tasks</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={settings.notifications.dailySummary} onCheckedChange={(v) => handleToggle('dailySummary', v)} />
                    <Input
                      type="time"
                      value={settings.notifications.dailySummaryTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      disabled={!settings.notifications.dailySummary}
                      className={errors.dailySummaryTime ? 'border-red-500' : ''}
                    />
                  </div>
                </div>
                {errors.dailySummaryTime && (
                  <p className="text-sm text-red-500 md:col-span-2">{errors.dailySummaryTime}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" onClick={handleReset}>Reset</Button>
                <Button onClick={handleSave} disabled={dirty === false}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage;
