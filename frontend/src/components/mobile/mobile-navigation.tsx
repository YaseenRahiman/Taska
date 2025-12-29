'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Briefcase, 
  MessageCircle, 
  User, 
  Plus,
  Search,
  Bell,
  Menu,
  X
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

interface MobileNavigationProps {
  userRole?: 'CLIENT' | 'ARTISAN' | 'ADMIN';
  unreadMessages?: number;
  unreadNotifications?: number;
}

export function MobileNavigation({ 
  userRole = 'CLIENT', 
  unreadMessages = 0, 
  unreadNotifications = 0 
}: MobileNavigationProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Different navigation items based on user role
  const getNavigationItems = (): NavigationItem[] => {
    switch (userRole) {
      case 'ARTISAN':
        return [
          { name: 'Dashboard', href: '/artisan/dashboard', icon: Home },
          { name: 'Jobs', href: '/artisan/jobs', icon: Search },
          { name: 'Bids', href: '/artisan/bids', icon: Briefcase },
          { name: 'Messages', href: '/artisan/messages', icon: MessageCircle, badge: unreadMessages },
          { name: 'Profile', href: '/artisan/profile', icon: User },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
          { name: 'Users', href: '/admin/users', icon: User },
          { name: 'Moderation', href: '/admin/moderation', icon: Briefcase },
          { name: 'Financial', href: '/admin/financial', icon: MessageCircle },
          { name: 'Settings', href: '/admin/settings', icon: User },
        ];
      default: // CLIENT
        return [
          { name: 'Dashboard', href: '/client/dashboard', icon: Home },
          { name: 'Post Job', href: '/client/jobs/create', icon: Plus },
          { name: 'My Jobs', href: '/client/jobs', icon: Briefcase },
          { name: 'Messages', href: '/client/messages', icon: MessageCircle, badge: unreadMessages },
          { name: 'Profile', href: '/client/profile', icon: User },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-200 md:hidden ${
        isScrolled ? 'shadow-lg' : 'shadow-sm'
      }`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-primary-600">🔧 Taska</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors">
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            {/* Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-out Menu */}
      <div
        className={`fixed inset-0 z-40 transform transition-transform duration-300 md:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl">
          <div className="flex flex-col h-full">
            {/* Menu Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Menu Footer */}
            <div className="p-4 border-t border-gray-200">
              <button className="w-full text-left px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <div className="relative">
                  <Icon size={20} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind fixed navigation */}
      <div className="h-16 md:hidden" />
    </>
  );
}

export default MobileNavigation;
