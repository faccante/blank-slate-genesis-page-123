
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const { user, profile, updateProfile } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSettingUpProfile, setIsSettingUpProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile?.full_name) {
      // User is authenticated and has completed profile setup
      navigate('/jobs');
    } else if (user && !profile?.full_name) {
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent!",
        description: "Check your email for instructions to reset your password.",
      });
      setIsForgotPassword(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Failed to send reset email",
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
        full_name: user?.user_metadata?.full_name || 'User',
      });

      toast({
        title: "Profile completed!",
        description: "Welcome to ISPANI!",
      });

      navigate('/jobs');
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
              Just one more step to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCompleteProfile} className="w-full">
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
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

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Reset Email...
                  </div>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reset Email
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setIsForgotPassword(false)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to sign in
              </button>
            </div>
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
            {isSignUp ? 'Join ISPANI to connect with opportunities' : 'Sign in to your ISPANI account'}
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

          <div className="mt-4 space-y-2 text-center">
            {!isSignUp && (
              <button
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800 block w-full"
              >
                Forgot your password?
              </button>
            )}
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
