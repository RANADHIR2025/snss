import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User, Shield, Package, Home, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Home', href: '#home', icon: Home },
  { name: 'About', href: '#about', icon: Users },
  { name: 'Partners', href: '#partners', icon: Building2 },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, showAdminUI, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const controlHeader = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY < 100) {
      setIsVisible(true);
    }
    else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setIsVisible(false);
    }
    else if (currentScrollY < lastScrollY) {
      setIsVisible(true);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', controlHeader);
    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
  }, [controlHeader]);

  const scrollToSection = (href: string) => {
    setIsMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.querySelector(href);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Menu Button - White with black icon */}
      <div className="lg:hidden fixed top-6 right-6 z-50">
        <button
          className={cn(
            "w-12 h-12 rounded-full border border-gray-200 shadow-lg",
            "bg-white flex items-center justify-center",
            "transition-all duration-300 hover:scale-110 hover:shadow-gray-400/30",
            !isVisible ? "-translate-y-32" : "translate-y-0",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-gray-800" />
          ) : (
            <Menu className="w-6 h-6 text-gray-800" />
          )}
        </button>
      </div>

      {/* Desktop Header */}
      <header className={cn(
        "hidden lg:fixed lg:flex top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
        "w-[calc(100%-2rem)] max-w-4xl",
        !isVisible ? "-translate-y-32" : "translate-y-0",
        isVisible ? "opacity-100" : "opacity-0"
      )}>
        {/* Floating Container - White background with subtle shadow */}
        <div className={cn(
          "w-full rounded-2xl border border-gray-200 shadow-lg",
          "bg-white"
        )}>
          <div className="px-6 py-3">
            <nav className="flex items-center justify-between">
              {/* Navigation Links */}
              <div className="flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.name}
                      onClick={() => scrollToSection(link.href)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg",
                        "text-sm font-medium transition-all duration-200",
                        "hover:bg-gray-100 hover:text-gray-900 text-gray-700",
                        "group/nav relative"
                      )}
                    >
                      <Icon className="w-4 h-4 group-hover/nav:scale-110 transition-transform text-gray-600" />
                      <span>{link.name}</span>
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-sky-400 to-blue-400 rounded-full group-hover/nav:w-8 transition-all duration-300" />
                    </button>
                  );
                })}
                {user && (
                  <Link
                    to="/products"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                  >
                    <Package className="w-4 h-4 text-gray-600" />
                    Products
                  </Link>
                )}
              </div>

              {/* Auth Buttons */}
              <div className="flex items-center gap-2">
                {user ? (
                  <>
                    <Button 
                      onClick={() => navigate('/dashboard')} 
                      variant="ghost"
                      className="rounded-xl gap-2 px-4 hover:bg-gray-100 text-sm text-gray-700 hover:text-gray-900"
                    >
                      <User className="w-4 h-4 text-gray-600" />
                      Dashboard
                    </Button>
                    {showAdminUI && (
                      <Button 
                        onClick={() => navigate('/admin')} 
                        className="rounded-xl gap-2 px-4 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 shadow-sm text-sm text-white"
                      >
                        <Shield className="w-4 h-4" />
                        Admin
                      </Button>
                    )}
                    <Button 
                      onClick={handleSignOut} 
                      variant="outline"
                      className="rounded-xl gap-2 px-4 border-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-600 text-sm text-gray-700"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate('/auth')}
                      className="rounded-xl gap-2 px-4 hover:bg-gray-100 text-sm text-gray-700 hover:text-gray-900"
                    >
                      <LogIn className="w-4 h-4 text-gray-600" />
                      Login
                    </Button>
                    <Button 
                      onClick={() => navigate('/auth?mode=signup')}
                      className="rounded-xl px-6 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 shadow-sm hover:shadow-md transition-all text-sm text-white"
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel - White background with black text */}
          <div className="absolute top-24 right-6 w-72">
            <div className={cn(
              "rounded-2xl border border-gray-200 shadow-2xl",
              "bg-white",
              "animate-slide-down"
            )}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.name}
                        onClick={() => scrollToSection(link.href)}
                        className="flex items-center gap-3 w-full p-3 rounded-lg text-left hover:bg-gray-100 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-700 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="font-medium text-gray-800">{link.name}</span>
                      </button>
                    );
                  })}
                  {user && (
                    <>
                      <Link
                        to="/products"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-700" />
                        </div>
                        <span className="font-medium text-gray-800">Products</span>
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-700" />
                        </div>
                        <span className="font-medium text-gray-800">Dashboard</span>
                      </Link>
                      {showAdminUI && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-gray-700" />
                          </div>
                          <span className="font-medium text-gray-800">Admin</span>
                        </Link>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 space-y-3">
                  {user ? (
                    <Button 
                      onClick={() => { handleSignOut(); setIsMenuOpen(false); }} 
                      variant="outline"
                      className="w-full justify-start gap-3 p-3 rounded-xl border-gray-300 hover:border-red-400 hover:bg-red-50 text-gray-800"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => { navigate('/auth'); setIsMenuOpen(false); }}
                        className="w-full justify-start p-3 rounded-xl hover:bg-gray-100 text-gray-800"
                      >
                        <LogIn className="w-4 h-4 mr-3" />
                        Login
                      </Button>
                      <Button 
                        onClick={() => { navigate('/auth?mode=signup'); setIsMenuOpen(false); }}
                        className="w-full p-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white"
                      >
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}