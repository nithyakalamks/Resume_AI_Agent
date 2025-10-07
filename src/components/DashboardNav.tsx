import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, FileText, History } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

interface DashboardNavProps {
  onSignOut: () => void;
}

export const DashboardNav = ({ onSignOut }: DashboardNavProps) => {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/resume", label: "My Resume", icon: FileText },
    { path: "/dashboard/history", label: "Tweaks", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <img 
              src={logo} 
              alt="Tweaker Logo" 
              className="h-10 md:h-12 w-auto animate-fade-in-up transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 relative transition-colors",
                      isActive && "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:via-[hsl(169,48%,53%)] after:to-accent after:rounded-full"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        <Button onClick={onSignOut} variant="outline" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </header>
  );
};
