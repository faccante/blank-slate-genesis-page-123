
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, 
  Users, 
  User, 
  PlusCircle, 
  FileText, 
  Settings,
  BarChart3,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomAppMenu() {
  const { profile } = useAuth();
  const location = useLocation();

  if (!profile) return null;

  const jobSeekerMenuItems = [
    {
      icon: Briefcase,
      label: 'Jobs',
      href: '/jobs',
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

  const employerMenuItems = [
    {
      icon: BarChart3,
      label: 'Dashboard',
      href: '/employer/dashboard',
    },
    {
      icon: PlusCircle,
      label: 'Post Job',
      href: '/employer/dashboard?tab=post-job',
    },
    {
      icon: Mail,
      label: 'Applications',
      href: '/employer/dashboard?tab=applications',
    },
    {
      icon: Settings,
      label: 'Profile',
      href: '/profile',
    }
  ];

  const menuItems = profile.role === 'employer' ? employerMenuItems : jobSeekerMenuItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href.includes('?') && location.pathname === item.href.split('?')[0]);
          
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
