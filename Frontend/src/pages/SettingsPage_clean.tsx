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
import { useAuth } from '@/hooks/useAuth';
import { Sun, Moon, Cog, Bell, User, Eye, EyeOff, Lock } from 'lucide-react';

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
  theme: 'light',
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
}

function validateTime(time: string): string | undefined {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return 'Please enter a valid time in HH:mm format (e.g., 08:00)';
  }
  return undefined;
}

const SettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
        applyTheme(parsed.theme || defaultSettings.theme);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply theme changes immediately
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationTimeChange = (time: string) => {
    const error = validateTime(time);
    if (!error) {
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          dailySummaryTime: time,
        },
      }));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      // Simulate API call - replace with actual password change logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const timeError = useMemo(() => 
    validateTime(settings.notifications.dailySummaryTime), 
    [settings.notifications.dailySummaryTime]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <Cog className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your AgroTrack preferences and account settings</p>
            </div>
          </div>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Account Settings</span>
              </CardTitle>
              <CardDescription>
                Manage your account information and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">Name is managed by your authentication provider</p>
                </div>
              </div>

              {/* Change Password Section */}
              <div className="border-t pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Lock className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Change Password</h3>
                </div>
                
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            currentPassword: e.target.value
                          }))}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({
                            ...prev,
                            newPassword: e.target.value
                          }))}
                          required
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Must be at least 8 characters long
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({
                          ...prev,
                          confirmPassword: e.target.value
                        }))}
                        required
                        className="max-w-md"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="w-full md:w-auto"
                  >
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sun className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>
                Customize how AgroTrack looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value: ThemeOption) => 
                    setSettings(prev => ({ ...prev, theme: value }))
                  }
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center space-x-2">
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center space-x-2">
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center space-x-2">
                        <Cog className="h-4 w-4" />
                        <span>System</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme. System will match your device's theme.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="units">Units</Label>
                <Select
                  value={settings.units}
                  onValueChange={(value: UnitsOption) => 
                    setSettings(prev => ({ ...prev, units: value }))
                  }
                >
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Select units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (°C, cm, ml)</SelectItem>
                    <SelectItem value="imperial">Imperial (°F, in, fl oz)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred measurement system for temperature, length, and volume.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="watering-notifications">Watering Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your plants need watering
                    </p>
                  </div>
                  <Switch
                    id="watering-notifications"
                    checked={settings.notifications.watering}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, watering: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="fertilizer-notifications">Fertilizer Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your plants need fertilizing
                    </p>
                  </div>
                  <Switch
                    id="fertilizer-notifications"
                    checked={settings.notifications.fertilizer}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, fertilizer: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="daily-summary">Daily Summary</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a daily summary of your plants' status
                    </p>
                  </div>
                  <Switch
                    id="daily-summary"
                    checked={settings.notifications.dailySummary}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, dailySummary: checked }
                      }))
                    }
                  />
                </div>

                {settings.notifications.dailySummary && (
                  <div className="pl-6 space-y-2">
                    <Label htmlFor="daily-summary-time">Daily Summary Time</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="daily-summary-time"
                        type="time"
                        value={settings.notifications.dailySummaryTime}
                        onChange={(e) => handleNotificationTimeChange(e.target.value)}
                        className="max-w-xs"
                        style={{ colorScheme: 'auto' }}
                      />
                    </div>
                    {timeError && (
                      <p className="text-sm text-destructive">{timeError}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Choose when you'd like to receive your daily plant summary
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={saveSettings} 
              disabled={saving || !!timeError}
              className="min-w-[120px]"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage;
