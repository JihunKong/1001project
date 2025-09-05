'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSession, signOut } from 'next-auth/react';
import { 
  Menu, 
  X, 
  BookOpen, 
  Heart, 
  Users, 
  Home, 
  ShoppingBag, 
  ShoppingCart,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Shield,
  GraduationCap,
  School,
  ChevronDown
} from 'lucide-react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import useCartStore from '@/lib/cart-store';
import { UserRole } from '@prisma/client';

export default function Header() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartItems = useCartStore((state) => state.getTotalItems());
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Base navigation for all users
  const baseNavigation = [
    { name: t('navigation.home'), href: '/', icon: Home },
    { name: t('navigation.library'), href: '/library', icon: BookOpen },
    { name: t('navigation.shop'), href: '/shop', icon: ShoppingBag },
  ];

  // Add onboarding zone for users who need approval
  const getOnboardingNavigation = () => {
    if (!session?.user) return [];
    
    // Show onboarding zone if user is not email verified (pending approval)
    if (!session.user.emailVerified) {
      return [{ name: 'Onboarding Zone', href: '/onboarding', icon: GraduationCap }];
    }
    
    return [];
  };

  // Additional navigation based on role
  const getRoleBasedNavigation = () => {
    if (!session?.user) return [];
    
    const role = session.user.role;
    const roleNav = [];

    // Add dashboard link for all authenticated users
    roleNav.push({ 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard 
    });

    // Add role-specific navigation
    switch (role) {
      case UserRole.ADMIN:
        roleNav.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
        break;
      case UserRole.TEACHER:
        roleNav.push({ name: 'My Classes', href: '/dashboard/teacher', icon: GraduationCap });
        break;
      case UserRole.INSTITUTION:
        roleNav.push({ name: 'Institution', href: '/dashboard/institution', icon: School });
        break;
      case UserRole.VOLUNTEER:
        roleNav.push({ name: 'Volunteer Hub', href: '/dashboard/volunteer', icon: Users });
        break;
      case UserRole.LEARNER:
        roleNav.push({ name: 'My Learning', href: '/dashboard/learner', icon: BookOpen });
        break;
    }

    return roleNav;
  };

  // Public navigation (when not logged in)
  const publicNavigation = [
    { name: t('navigation.volunteer'), href: '/volunteer', icon: Users },
    { name: t('navigation.about'), href: '/about', icon: Heart },
  ];

  const navigation = [
    ...baseNavigation,
    ...getOnboardingNavigation(),
    ...getRoleBasedNavigation(),
    ...(session ? [] : publicNavigation)
  ];

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    // Use redirect: false to prevent page reload and handle redirect manually
    const data = await signOut({ 
      redirect: false,
      callbackUrl: '/' 
    });
    
    // Manually redirect to home page using Next.js router
    router.push(data.url || '/');
  };

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      [UserRole.ADMIN]: 'Administrator',
      [UserRole.TEACHER]: 'Teacher',
      [UserRole.LEARNER]: 'Learner',
      [UserRole.INSTITUTION]: 'Institution',
      [UserRole.VOLUNTEER]: 'Volunteer',
    };
    return labels[role] || 'User';
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      [UserRole.ADMIN]: 'bg-red-100 text-red-800',
      [UserRole.TEACHER]: 'bg-green-100 text-green-800',
      [UserRole.LEARNER]: 'bg-blue-100 text-blue-800',
      [UserRole.INSTITUTION]: 'bg-purple-100 text-purple-800',
      [UserRole.VOLUNTEER]: 'bg-pink-100 text-pink-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold gradient-text">1001 Stories</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Right side buttons */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            
            {/* Shopping Cart */}
            <Link href="/shop/cart" className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {mounted && cartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems}
                </span>
              )}
            </Link>
            
            {/* User Menu or Auth Buttons */}
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : session ? (
              // User Menu for authenticated users
              <div className="relative user-menu-container">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">{session.user.name || 'User'}</p>
                      <p className="text-xs text-gray-600 mt-1">{session.user.email}</p>
                      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${getRoleColor(session.user.role || UserRole.LEARNER)}`}>
                        {getRoleLabel(session.user.role || UserRole.LEARNER)}
                      </span>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      
                      {session.user.role === UserRole.ADMIN && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                      
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </div>
                    
                    <div className="border-t pt-2">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Auth buttons for non-authenticated users
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {t('navigation.login')}
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('navigation.signup')}
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4 animate-in">
            <div className="flex flex-col space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              
              <div className="flex flex-col gap-2 pt-3 border-t">
                {session ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-gray-900">{session.user.name || 'User'}</p>
                      <p className="text-xs text-gray-600">{session.user.email}</p>
                      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${getRoleColor(session.user.role || UserRole.LEARNER)}`}>
                        {getRoleLabel(session.user.role || UserRole.LEARNER)}
                      </span>
                    </div>
                    <Link
                      href="/settings"
                      className="px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleSignOut();
                      }}
                      className="px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('navigation.login')}
                    </Link>
                    <Link
                      href="/signup"
                      className="px-3 py-2 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('navigation.signup')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}