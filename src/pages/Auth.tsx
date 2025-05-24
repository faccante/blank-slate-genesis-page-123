
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
import { User, Briefcase, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { user, profile, updateProfile } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userRole, setUserRole] = useState<'job_seeker' | 'employer'>('job_seeker');
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [isSettingUpProfile, setIsSettingUpProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Signed in successfully!",
          description: "Welcome back!",
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: isSignUp ? "Sign up failed" : "Sign in failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          <CardTitle className="text-center text-2xl">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? 'Join HireTrack to connect with opportunities' : 'Sign in to your HireTrack account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                <>
                  {isSignUp ? <User className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our terms of service and privacy policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
