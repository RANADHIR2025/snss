import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User, Shield, Package, Home, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'About', href: '/', icon: Users },
  { name: 'Partners', href: '/', icon: Building2 },
];

export function PageHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, showAdminUI, isSuperAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const controlHeader = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    // Always show header at the very top
    if (currentScrollY < 100) {
      setIsVisible(true);
    }
    // Hide when scrolling down
    else if (currentScrollY > lastScrollY && currentScrollY > 100) {
      setIsVisible(false);
    }
    // Show when scrolling up
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {/* Single Three-dot menu button - Visible on ALL screen sizes */}
      <div className={cn(
        "fixed top-6 right-6 z-50 transition-all duration-300",
        !isVisible ? "-translate-y-32" : "translate-y-0",
        isVisible ? "opacity-100" : "opacity-0"
      )}>
        <button
          className={cn(
            // White background with subtle shadow
            "w-12 h-12 rounded-full bg-white flex items-center justify-center",
            "border border-gray-200 shadow-lg",
            "transition-all duration-300 hover:scale-110 hover:shadow-xl",
            // Remove pulsing animation
            !isMenuOpen && ""
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

      {/* Mobile Menu - Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40">
          {/* Backdrop with enhanced blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel - White background */}
          <div className="absolute top-24 right-6 w-72">
            <div className={cn(
              "rounded-2xl shadow-2xl",
              "bg-white", // Solid white background
              "border border-gray-200", // Subtle border
              "animate-slide-down"
            )}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.href;
                    
                    return (
                      <Link
                        key={link.name}
                        to={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-all duration-200 group",
                          "hover:bg-gray-50", // Subtle hover
                          isActive ? "text-blue-600 bg-blue-50" : "text-gray-800"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                          isActive ? "bg-blue-100" : "bg-gray-100 group-hover:bg-gray-200"
                        )}>
                          <Icon className={cn(
                            "w-4 h-4 transition-transform",
                            isActive ? "text-blue-600" : "text-gray-600",
                            "group-hover:scale-110"
                          )} />
                        </div>
                        <span className="font-medium">{link.name}</span>
                      </Link>
                    );
                  })}
                  {user && (
                    <>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 group",
                          "hover:bg-gray-50",
                          location.pathname === '/dashboard' ? "text-blue-600 bg-blue-50" : "text-gray-800"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                          location.pathname === '/dashboard' ? "bg-blue-100" : "bg-gray-100 group-hover:bg-gray-200"
                        )}>
                          <User className={cn(
                            "w-4 h-4",
                            location.pathname === '/dashboard' ? "text-blue-600" : "text-gray-600",
                            "group-hover:text-gray-700"
                          )} />
                        </div>
                        <span className="font-medium">Dashboard</span>
                      </Link>
                      {showAdminUI && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 group",
                            "hover:bg-purple-50",
                            location.pathname === '/admin' ? "text-purple-600 bg-purple-50" : "text-gray-800"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            location.pathname === '/admin' ? "bg-purple-100" : "bg-gray-100 group-hover:bg-purple-100"
                          )}>
                            <Shield className={cn(
                              "w-4 h-4",
                              location.pathname === '/admin' ? "text-purple-600" : "text-gray-600",
                              "group-hover:text-purple-500"
                            )} />
                          </div>
                          <span className="font-medium">{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
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
                      className="w-full justify-start gap-3 p-3 rounded-xl border-gray-300 hover:border-red-300 hover:bg-red-50 text-gray-800 hover:text-red-600 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => { navigate('/auth'); setIsMenuOpen(false); }}
                        className="w-full justify-start p-3 rounded-xl hover:bg-gray-100 text-gray-800 transition-all duration-200"
                      >
                        <LogIn className="w-4 h-4 mr-3" />
                        Login
                      </Button>
                      <Button 
                        variant="hero" 
                        onClick={() => { navigate('/auth?mode=signup'); setIsMenuOpen(false); }}
                        className="w-full p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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