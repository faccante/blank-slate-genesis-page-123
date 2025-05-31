
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Settings, Briefcase, PlusCircle } from 'lucide-react';

export function Navigation() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              ISPANI
            </Link>
            
            {user && (
              <div className="ml-10 flex space-x-8">
                <Link
                  to="/jobs"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive('/jobs')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Jobs
                </Link>
                
                <Link
                  to="/employer/dashboard"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive('/employer/dashboard')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Post Jobs
                </Link>
                
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  My Applications
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white" align="end" forceMount>
                  <DropdownMenuItem className="flex flex-col items-start">
                    <div className="font-medium">{profile?.full_name || 'User'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth" className="text-gray-500 hover:text-gray-700">
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
