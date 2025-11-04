import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usersApi } from '@/lib/api/users';
import type { User as UserType } from '@/lib/api/users';
import { useAuth } from '@/hooks/useAuth';
import { Sun, Moon, Cog, Bell, Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';

const SETTINGS_KEY = 'agrotrack:settings';

interface SettingsData {
  notifications: {
    watering: boolean;
    fertilizer: boolean;
    dailySummary: boolean;
  };
}

const defaultSettings: SettingsData = {
  notifications: {
    watering: true,
    fertilizer: true,
    dailySummary: false,
  },
};

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const { user, updateUser } = useAuth();

  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profile, setProfile] = useState<UserType | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const userProfile = await usersApi.getProfile();
        setProfile(userProfile);
        setName(userProfile.name || '');
        setLocation(userProfile.location || '');
        setBio(userProfile.bio || '');
        setAvatarPreview(userProfile.avatar || undefined);

        // keep notifications from user profile if present
        const prefs = userProfile.preferences || {} as any;
        setSettings({
          notifications: {
            watering: prefs.notifications?.reminderNotifications ?? defaultSettings.notifications.watering,
            fertilizer: prefs.notifications?.communityNotifications ?? defaultSettings.notifications.fertilizer,
            dailySummary: prefs.notifications?.dailySummary ?? defaultSettings.notifications.dailySummary,
          }
        });
      } catch (err) {
        console.error('Error loading profile/settings', err);
        try {
          const saved = localStorage.getItem(SETTINGS_KEY);
          if (saved) setSettings({ ...defaultSettings, ...JSON.parse(saved) });
        } catch (e) { /* ignore */ }
      } finally {
        setLoading(false);
        setProfileLoading(false);
      }
    };
    load();
  }, []);

  const handleFileSelection = (file: File | null) => {
    if (!file) return;
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: 'File Too Large', description: 'Please use an image smaller than 2MB', variant: 'destructive' });
      return;
    }
    setAvatarFile(file);
    if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const notificationPrefs = {
        reminderNotifications: settings.notifications.watering,
        communityNotifications: settings.notifications.fertilizer,
        email: true,
      };
      await usersApi.updateNotificationPreferences(notificationPrefs);
      // persist notification settings under profile.preferences.notifications
      await usersApi.updateProfile({ preferences: { notifications: notificationPrefs } as any } as any);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ notifications: settings.notifications }));
      toast({ title: 'Settings Saved', description: 'Your preferences have been updated successfully.', duration: 3000 });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // dailySummaryTime option was removed; no time input handler is needed

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({ title: 'Error', description: 'New password must be at least 8 characters long.', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      await usersApi.changePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword, confirmPassword: passwordData.confirmPassword });
      toast({ title: 'Password Changed', description: 'Your password has been updated successfully.', duration: 3000 });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to change password. Please try again.', variant: 'destructive' });
    } finally { setChangingPassword(false); }
  };

  // no dailySummaryTime validation (feature removed)

  if (loading) return (
    <div className="min-h-screen bg-background"><Header /><main className="container mx-auto px-4 py-8"><div className="flex items-center justify-center min-h-[400px]"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div><p className="text-muted-foreground">Loading settings...</p></div></div></main><Footer /></div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><UserIcon className="h-5 w-5" /><span>Profile</span></CardTitle>
              <CardDescription>Update your profile information and avatar</CardDescription>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="text-center py-6">Loading profile...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  <div className="flex flex-col items-center md:items-start space-y-4">
                    <div className="w-36 h-36 rounded-full overflow-hidden bg-muted flex items-center justify-center shadow-sm">
                      {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" /> : <UserIcon className="h-10 w-10 text-muted-foreground" />}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                      {avatarPreview && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => { 
                            if (avatarPreview && avatarPreview.startsWith('blob:')) {
                              URL.revokeObjectURL(avatarPreview);
                            }
                            setAvatarFile(null); 
                            setAvatarPreview(undefined);
                            // If there's an existing avatar on the server, delete it
                            if (profile?.avatar) {
                              try {
                                await usersApi.deleteAvatar();
                                setProfile({ ...profile, avatar: undefined });
                                toast({ title: 'Avatar Removed', description: 'Your profile photo has been removed.', duration: 3000 });
                              } catch (error) {
                                console.error('Error removing avatar:', error);
                                toast({ title: 'Error', description: 'Failed to remove avatar. Please try again.', variant: 'destructive' });
                              }
                            }
                          }}
                          className="w-full"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Recommended: square image, &lt; 2MB</div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <input ref={(el) => fileInputRef.current = el} type="file" accept="image/*" onChange={(e) => handleFileSelection(e.target.files?.[0] || null)} className="hidden" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="profile-name">Display Name</Label><Input id="profile-name" type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
                      <div className="space-y-2"><Label htmlFor="profile-location">City</Label><Input id="profile-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
                    </div>

                    <div className="space-y-2"><Label htmlFor="profile-bio">Bio</Label><textarea id="profile-bio" rows={4} className="w-full rounded-md border p-3" value={bio} onChange={(e) => setBio(e.target.value)} /></div>

                    <div className="flex justify-end">
                      <Button onClick={async () => {
                        setProfileSaving(true);
                        try {
                          console.log('[Profile Save] Starting save with data:', { name, bio, location, hasAvatarFile: !!avatarFile });
                          
                          // Upload avatar first if present
                          if (avatarFile) {
                            console.log('[Profile Save] Uploading avatar...');
                            await usersApi.uploadAvatar(avatarFile);
                            console.log('[Profile Save] Avatar uploaded successfully');
                          }
                          
                          // Update profile
                          console.log('[Profile Save] Updating profile...');
                          const profileData = { 
                            name: name || undefined, 
                            bio: bio || undefined, 
                            location: location || undefined 
                          };
                          console.log('[Profile Save] Profile data being sent:', profileData);
                          
                          const updated = await usersApi.updateProfile(profileData);
                          console.log('[Profile Save] Profile updated successfully:', updated);
                          
                          setProfile(updated); 
                          setName(updated.name || ''); 
                          setLocation(updated.location || ''); 
                          setBio(updated.bio || ''); 
                          setAvatarPreview(updated.avatar || avatarPreview);
                          
                          // Update auth context to reflect changes in header
                          updateUser({ 
                            name: updated.name,
                            id: updated._id
                          });
                          
                          toast({ title: 'Profile saved', description: 'Profile updated successfully.', duration: 3000 });
                        } catch (err: any) { 
                          console.error('[Profile Save] Error saving profile:', err);
                          console.error('[Profile Save] Error details:', {
                            message: err?.message,
                            response: err?.response?.data,
                            status: err?.response?.status,
                            statusText: err?.response?.statusText
                          });
                          
                          const errorMsg = err?.response?.data?.message || err?.message || 'Failed to save profile';
                          toast({ 
                            title: 'Error', 
                            description: errorMsg, 
                            variant: 'destructive' 
                          }); 
                        }
                        finally { setProfileSaving(false); }
                      }} disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save Profile'}</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10"><Cog className="h-6 w-6 text-primary" /></div>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your AgroTrack preferences and account settings</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><UserIcon className="h-5 w-5" /><span>Account Settings</span></CardTitle>
              <CardDescription>Manage your account information and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted" />
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>
                {/* Display name is editable in the Profile section above. Removed from Account Settings to avoid duplication. */}
              </div>

              {/* Change Password - Only show for local/email auth users, not OAuth (Google) users */}
              {profile?.authProvider === 'local' && (
                <div className="border-t pt-6">
                  <div className="flex items-center space-x-2 mb-4"><Lock className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">Change Password</h3></div>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input id="currentPassword" type={showCurrentPassword ? 'text' : 'password'} value={passwordData.currentPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))} required />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} required minLength={8} />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Must be at least 8 characters long</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} required className="max-w-md" />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                      </div>
                    </div>

                    <Button type="submit" disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword} className="w-full md:w-auto">{changingPassword ? 'Changing Password...' : 'Change Password'}</Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance section removed per request */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><Bell className="h-5 w-5" /><span>Notifications</span></CardTitle>
              <CardDescription>Manage how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label htmlFor="watering-notifications">Watering Reminders</Label><p className="text-sm text-muted-foreground">Get notified when your plants need watering</p></div>
                  <Switch id="watering-notifications" checked={settings.notifications.watering} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, watering: checked } }))} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label htmlFor="fertilizer-notifications">Fertilizer Reminders</Label><p className="text-sm text-muted-foreground">Get notified when your plants need fertilizing</p></div>
                  <Switch id="fertilizer-notifications" checked={settings.notifications.fertilizer} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, fertilizer: checked } }))} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label htmlFor="daily-summary">Daily Summary</Label><p className="text-sm text-muted-foreground">Receive a daily summary of your plants' status</p></div>
                  <Switch id="daily-summary" checked={settings.notifications.dailySummary} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, dailySummary: checked } }))} />
                </div>

                {settings.notifications.dailySummary && (
                  <div className="pl-6 space-y-2">
                    <p className="text-sm text-muted-foreground">Daily summary enabled. Time option has been removed.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end"><Button onClick={saveSettings} disabled={saving} className="min-w-[120px]">{saving ? 'Saving...' : 'Save Settings'}</Button></div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage;
