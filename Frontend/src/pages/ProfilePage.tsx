import React, { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { mockApi } from '@/lib/mockApi';
import type { User } from '@/types/api';
import { 
  User as UserIcon, 
  Camera, 
  MapPin, 
  Save,
  Leaf,
  Bell,
  Calendar,
  TrendingUp,
  Edit,
  Check
} from 'lucide-react';

interface ProfileData {
  displayName: string;
  bio: string;
  location: string;
  avatarUrl: string;
}

interface ProfileStats {
  plantsCount: number;
  remindersSet: number;
  careActivities: number;
  joinedDate: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    location: '',
    avatarUrl: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileData>>({});

  // Load profile data from mock API on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await mockApi.auth.getProfile();
        setProfileData({
          displayName: userProfile.name,
          bio: '', // Mock bio - not in API yet
          location: '', // Mock location - not in API yet
          avatarUrl: userProfile.profilePicture || ''
        });
        setAvatarPreview(userProfile.profilePicture || '');
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to user data if available
        setProfileData({
          displayName: user?.name || '',
          bio: '',
          location: '',
          avatarUrl: ''
        });
      }
    };

    loadProfile();
  }, [user]);

  // Mock stats from localStorage
  const getProfileStats = (): ProfileStats => {
    const plants = JSON.parse(localStorage.getItem('agrotrack:plants') || '[]');
    const reminders = JSON.parse(localStorage.getItem('agrotrack:reminders') || '[]');
    
    return {
      plantsCount: plants.length,
      remindersSet: reminders.length || Math.floor(Math.random() * 12) + 3, // Mock if no reminders
      careActivities: Math.floor(Math.random() * 50) + 15, // Mock care activities
      joinedDate: 'March 2024' // Mock join date
    };
  };

  const stats = getProfileStats();

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileData> = {};
    
    if (!profileData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (profileData.displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    }
    
    if (profileData.bio.length > 200) {
      newErrors.bio = 'Bio must be 200 characters or less';
    }
    
    if (profileData.location.length > 100) {
      newErrors.location = 'Location must be 100 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    
    // Store the preview URL (in real app, you'd upload to server)
    const avatarUrl = previewUrl;
    setProfileData(prev => ({
      ...prev,
      avatarUrl
    }));

    // Save avatar to API immediately
    try {
      await mockApi.auth.updateProfile({
        profilePicture: avatarUrl
      });
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast({
        title: "Avatar upload failed",
        description: "Your avatar was uploaded but couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation errors",
        description: "Please fix the errors before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Update profile via mock API
      await mockApi.auth.updateProfile({
        name: profileData.displayName,
        profilePicture: profileData.avatarUrl
      });

      setIsEditing(false);
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Reload from API
    const loadProfile = async () => {
      try {
        const userProfile = await mockApi.auth.getProfile();
        setProfileData({
          displayName: userProfile.name,
          bio: '', // Mock bio - not in API yet
          location: '', // Mock location - not in API yet
          avatarUrl: userProfile.profilePicture || ''
        });
        setAvatarPreview(userProfile.profilePicture || '');
      } catch (error) {
        console.error('Error reloading profile:', error);
      }
    };

    loadProfile();
    setIsEditing(false);
    setErrors({});
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account information and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your profile details and avatar</CardDescription>
                    </div>
                    {!isEditing && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage 
                          src={avatarPreview || profileData.avatarUrl} 
                          alt={profileData.displayName || 'Profile'} 
                        />
                        <AvatarFallback className="text-lg">
                          {getInitials(profileData.displayName || user?.name || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-medium mb-1">Profile Photo</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Upload a photo to personalize your profile
                      </p>
                      {isEditing && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </Button>
                      )}
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 gap-6">
                    {/* Display Name */}
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name *</Label>
                      <Input
                        id="displayName"
                        value={profileData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        placeholder="Enter your display name"
                        disabled={!isEditing}
                        className={errors.displayName ? 'border-red-500' : ''}
                      />
                      {errors.displayName && (
                        <p className="text-sm text-red-500">{errors.displayName}</p>
                      )}
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Tell us about yourself and your gardening experience..."
                        rows={4}
                        disabled={!isEditing}
                        className={errors.bio ? 'border-red-500' : ''}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{errors.bio && <span className="text-red-500">{errors.bio}</span>}</span>
                        <span>{profileData.bio.length}/200</span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="City, Country"
                          disabled={!isEditing}
                          className={`pl-10 ${errors.location ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.location && (
                        <p className="text-sm text-red-500">{errors.location}</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSaving ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Side Panel - Stats */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Your Garden Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Leaf className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium">Plants</span>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {stats.plantsCount}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Bell className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">Reminders</span>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      {stats.remindersSet}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium">Care Activities</span>
                    </div>
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      {stats.careActivities}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                    <span>Account Info</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{user?.email || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                    <p className="text-sm">{stats.joinedDate}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Leaf className="w-4 h-4 mr-2" />
                    Add New Plant
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Set Reminder
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Care Schedule
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
