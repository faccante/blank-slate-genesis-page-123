
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Briefcase, User } from 'lucide-react';

export default function Auth() {
  const { user, profile, signInWithGoogle, updateProfile } = useAuth();
  const [userRole, setUserRole] = useState<'job_seeker' | 'employer'>('job_seeker');
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [isSettingUpProfile, setIsSettingUpProfile] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile?.role) {
      // User is authenticated and has completed profile setup
      if (profile.role === 'employer') {
        navigate('/employer/dashboard');
      } else {
        navigate('/jobs');
      }
    } else if (user && !profile?.role) {
      // User is authenticated but needs to complete profile setup
      setIsSettingUpProfile(true);
    }
  }, [user, profile, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Signing in...",
        description: "Please wait while we redirect you.",
      });
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteProfile = async () => {
    try {
      await updateProfile({
        role: userRole,
        company_name: userRole === 'employer' ? companyName : null,
        bio: bio || null,
      });

      toast({
        title: "Profile completed!",
        description: "Welcome to HireTrack!",
      });

      if (userRole === 'employer') {
        navigate('/employer/dashboard');
      } else {
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Profile setup failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isSettingUpProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Complete Your Profile</CardTitle>
            <CardDescription className="text-center">
              Tell us a bit about yourself to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium">I am a:</Label>
              <RadioGroup value={userRole} onValueChange={(value) => setUserRole(value as 'job_seeker' | 'employer')} className="mt-2">
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="job_seeker" id="job_seeker" />
                  <Label htmlFor="job_seeker" className="flex items-center cursor-pointer flex-1">
                    <User className="w-4 h-4 mr-2" />
                    Job Seeker
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="employer" id="employer" />
                  <Label htmlFor="employer" className="flex items-center cursor-pointer flex-1">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Employer
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {userRole === 'employer' && (
              <div>
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={userRole === 'employer' ? "Tell us about your company..." : "Tell us about yourself..."}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleCompleteProfile} 
              className="w-full"
              disabled={userRole === 'employer' && !companyName.trim()}
            >
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Welcome to HireTrack</CardTitle>
          <CardDescription className="text-center">
            Connect job seekers with employers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
            <Mail className="w-4 h-4 mr-2" />
            Sign in with Google
          </Button>
          <p className="text-xs text-gray-500 text-center mt-4">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
