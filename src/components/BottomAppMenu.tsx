
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, 
  User, 
  PlusCircle, 
  FileText, 
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomAppMenu() {
  const { user } = useAuth();
  const location = useLocation();

  // Guest menu items for non-logged users
  const guestMenuItems = [
    {
      icon: Briefcase,
      label: 'Jobs',
      href: '/',
    },
    {
      icon: LogIn,
      label: 'Sign In',
      href: '/auth',
    }
  ];

  const userMenuItems = [
    {
      icon: Briefcase,
      label: 'Jobs',
      href: '/jobs',
    },
    {
      icon: PlusCircle,
      label: 'Post Jobs',
      href: '/employer/dashboard',
    },
    {
      icon: FileText,
      label: 'Applications',
      href: '/dashboard',
    },
    {
      icon: User,
      label: 'Profile',
      href: '/profile',
    }
  ];

  // Determine which menu items to show
  const menuItems = user ? userMenuItems : guestMenuItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
