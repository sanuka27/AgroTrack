import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X, User, MessageSquare, BarChart3, LogOut, Shield, Settings, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Base navigation items available to all users
  // Order: Community, Features - Dashboard is inserted before these when authenticated
  const baseNavItems = [
    { label: "Community", href: "/community", icon: MessageSquare, permission: null },
    { label: "Features", href: "/features", icon: Leaf, permission: null },
  ];

  // User-specific navigation items (Dashboard handled separately for placement)
  // Note: We intentionally exclude "My Plants" here to avoid a duplicate with the Dashboard link,
  // which points to the same route and is shown in a primary position when authenticated.
  const userNavItems = [
    { label: "AI Assistant", href: "/assistant", icon: Bot, permission: "view_assistant" },
  ];

  // Admin-specific navigation items
  const adminNavItems = [
    { label: "Admin Panel", href: "/admin", icon: Shield, permission: "moderate_content" },
  ];

  // Filter navigation items based on permissions
  const getVisibleNavItems = () => {
    const items = [...baseNavItems];

    // If authenticated and not admin, insert a Dashboard link before Features
    if (user && user.role !== 'admin') {
      // Use a distinct icon for Dashboard so it differs from the Features leaf icon
      items.unshift({ label: "Dashboard", href: "/plants", icon: BarChart3 } as any);
    }

    userNavItems.forEach(item => {
      if (!item.permission || hasPermission(item.permission)) {
        items.push(item);
      }
    });

    adminNavItems.forEach(item => {
      if (!item.permission || hasPermission(item.permission)) {
        items.push(item);
      }
    });

    return items;
  };

  const navigationItems = getVisibleNavItems();

  // User display name with role badge
  const getUserDisplayName = () => {
    if (!user) return null;
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          {user.role === 'admin' && <Shield className="w-3 h-3 text-orange-500" />}
          {user.role === 'user' && <User className="w-3 h-3 text-green-500" />}
          <span className="text-sm font-medium">{user.name}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          user.role === 'admin' 
            ? 'bg-orange-100 text-orange-700'
            : user.role === 'user'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <NavLink to="/" className="flex items-center space-x-2 hover:opacity-90 transition-opacity cursor-pointer">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-hero rounded-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">AgroTrack</span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-1 transition-colors duration-200 cursor-pointer hover:opacity-90 ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                {getUserDisplayName()}
                <NotificationBell />
                <Button variant="ghost" size="sm" asChild>
                  <NavLink to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </NavLink>
                </Button>
                {/* Profile link removed — profile is now merged into Settings */}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <NavLink to="/login">
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </NavLink>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <NavLink to="/register">Get Started</NavLink>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-smooth cursor-pointer"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? "text-primary bg-muted font-medium"
                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              
              {/* Mobile Auth Section */}
              <div className="flex flex-col space-y-2 px-3 py-2 border-t border-border mt-2 pt-2">
                {user ? (
                  <>
                    <div className="py-2 flex items-center justify-between">
                      {getUserDisplayName()}
                      <NotificationBell />
                    </div>
                    <Button variant="ghost" size="sm" className="justify-start" asChild>
                      <NavLink to="/settings" onClick={() => setIsMenuOpen(false)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </NavLink>
                    </Button>
                    {/* Profile link removed from mobile menu (merged into Settings) */}
                    <Button variant="ghost" size="sm" className="justify-start" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="justify-start" asChild>
                      <NavLink to="/login">
                        <User className="w-4 h-4 mr-2" />
                        Sign In
                      </NavLink>
                    </Button>
                    <Button variant="hero" size="sm" asChild>
                      <NavLink to="/register">Get Started</NavLink>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}