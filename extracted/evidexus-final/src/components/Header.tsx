import { Link, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.webp";

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container max-w-5xl mx-auto flex h-14 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Evidexus" className="h-7 w-7 object-contain" />
          <span className="font-semibold text-foreground text-sm tracking-tight">Evidexus</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <a href="#features" className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary font-medium">
            Features
          </a>
          <a href="#pricing" className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary font-medium">
            Pricing
          </a>
          <Link to="/auth" className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary font-medium">
            For Clinicians
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button size="sm" variant="ghost" className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Dashboard
                </Button>
              </Link>
              <button
                onClick={handleSignOut}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button size="sm" variant="ghost" className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="btn-premium text-primary-foreground text-xs h-8 px-4 rounded-lg font-medium">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
