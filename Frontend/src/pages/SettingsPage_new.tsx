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
  if (!time) return 'Time is required';
  const match = /^([01]?[0-9]|2[0-3]):([0-5]?[0-9])$/.test(time);
  if (!match) return 'Please enter a valid time (HH:mm)';
  return undefined;
}

// Password validation functions
function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) return 'Password must contain at least one letter and one number';
  return undefined;
}

function getPasswordStrength(password: string): 'Weak' | 'Medium' | 'Strong' {
  if (password.length < 8) return 'Weak';
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;
  
  if (score <= 2) return 'Weak';
  if (score <= 4) return 'Medium';
  return 'Strong';
}

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<{ dailySummaryTime?: string; }>({});

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    document.title = 'Settings - AgroTrack';
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        applyTheme(parsed.theme);
      } catch {
        console.warn('Invalid settings in localStorage');
      }
    }
  }, []);

  const handleThemeChange = (value: ThemeOption) => {
    setSettings((prev) => ({ ...prev, theme: value }));
    applyTheme(value);
    setDirty(true);
  };

  const handleUnitsChange = (value: UnitsOption) => {
    setSettings((prev) => ({ ...prev, units: value }));
    setDirty(true);
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

  // Password change handlers
  const handlePasswordChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Validate confirm password when new password changes
    if (field === 'newPassword' && passwordForm.confirmPassword) {
      if (value !== passwordForm.confirmPassword) {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: undefined }));
      }
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePasswordForm = () => {
    const newErrors: typeof passwordErrors = {};
    
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    const newPasswordError = validatePassword(passwordForm.newPassword);
    if (newPasswordError) {
      newErrors.newPassword = newPasswordError;
    }
    
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    // Simulate password update (no backend)
    toast({ 
      title: 'Password updated', 
      description: 'Password updated successfully (demo mode)',
    });
    
    // Clear form
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
  };

  const handlePasswordCancel = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);
  const strengthColors = {
    Weak: 'text-red-600',
    Medium: 'text-yellow-600', 
    Strong: 'text-green-600'
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
          <Card className="rounded-2xl ring-1 ring-border">
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

          {/* Change Password */}
          <Card className="rounded-2xl ring-1 ring-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-600" /> 
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      aria-invalid={!!passwordErrors.currentPassword}
                      aria-describedby={passwordErrors.currentPassword ? 'current-password-error' : undefined}
                      className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => togglePasswordVisibility('current')}
                      aria-label="Show password"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p id="current-password-error" className="text-sm text-red-600">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      aria-invalid={!!passwordErrors.newPassword}
                      aria-describedby={passwordErrors.newPassword ? 'new-password-error' : 'new-password-strength'}
                      className={passwordErrors.newPassword ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => togglePasswordVisibility('new')}
                      aria-label="Show password"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p id="new-password-error" className="text-sm text-red-600">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                  {passwordForm.newPassword && !passwordErrors.newPassword && (
                    <p id="new-password-strength" className={`text-sm ${strengthColors[passwordStrength]}`}>
                      Strength: {passwordStrength}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      aria-invalid={!!passwordErrors.confirmPassword}
                      aria-describedby={passwordErrors.confirmPassword ? 'confirm-password-error' : undefined}
                      className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => togglePasswordVisibility('confirm')}
                      aria-label="Show password"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p id="confirm-password-error" className="text-sm text-red-600">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handlePasswordCancel}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="rounded-2xl ring-1 ring-border">
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
          <Card className="rounded-2xl ring-1 ring-border">
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
