import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Heart, LayoutDashboard, Pill, Calendar } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/medicines', label: 'Medicines', icon: Pill },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">CareCrew</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}>
              <Button
                variant={isActive(path) ? 'secondary' : 'ghost'}
                size="sm"
                className={`gap-2 ${isActive(path) ? 'bg-accent text-accent-foreground' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user?.phone}
          </span>
          <Button variant="outline" size="sm" onClick={logout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="flex border-t border-border md:hidden">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} className="flex-1">
            <Button
              variant="ghost"
              className={`w-full rounded-none gap-2 ${
                isActive(path) ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs">{label}</span>
            </Button>
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;
