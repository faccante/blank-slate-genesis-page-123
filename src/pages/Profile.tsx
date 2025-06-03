import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Building, Mail, Phone, MapPin, FileText, LogOut } from 'lucide-react';
import { CVManager } from '@/components/CVManager';

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    phone: '',
    location: '',
    bio: '',
    role: 'job_seeker' as 'job_seeker' | 'employer'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        role: profile.role
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        role: profile.role
      });
    }
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account information</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <CardTitle>{profile.full_name || 'User'}</CardTitle>
                <CardDescription className="capitalize">{profile.role.replace('_', ' ')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">{user.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">{profile.phone}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">{profile.location}</span>
                    </div>
                  )}
                  {profile.company_name && (
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">{profile.company_name}</span>
                    </div>
                  )}
                </div>
                
                {/* Logout Button */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CV Management for Job Seekers */}
            {profile.role === 'job_seeker' && (
              <div className="mt-6">
                <CVManager />
              </div>
            )}
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your profile details</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  ) : (
                    <div className="space-x-2">
                      <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                      <Button onClick={handleSave}>Save Changes</Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Account Type</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData({...formData, role: value as 'job_seeker' | 'employer'})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="job_seeker">Job Seeker</SelectItem>
                        <SelectItem value="employer">Employer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.role === 'employer' && (
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      disabled={!isEditing}
                      placeholder="City, State"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">
                    {formData.role === 'employer' ? 'Company Description' : 'Bio'}
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    disabled={!isEditing}
                    rows={4}
                    placeholder={
                      formData.role === 'employer' 
                        ? "Tell us about your company..." 
                        : "Tell us about yourself..."
                    }
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Account Information</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Email: {user.email}</p>
                    <p>Member since: {new Date(profile.created_at).toLocaleDateString()}</p>
                    <p>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
