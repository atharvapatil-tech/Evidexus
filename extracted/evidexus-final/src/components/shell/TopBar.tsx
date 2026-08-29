import { useNavigate } from "react-router-dom";
import { LogOut, User, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const TopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="h-14 flex items-center justify-between px-5 md:px-8 border-b border-border bg-background">
      <button
        onClick={() => navigate("/")}
        className="font-serif text-[18px] font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
      >
        Evidexus
        <sup className="text-[8px] text-primary ml-0.5 font-sans">®</sup>
      </button>

      <div className="flex items-center gap-1">
        {user && (
          <button
            onClick={() => navigate("/history")}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="History"
            aria-label="History"
          >
            <History className="h-[18px] w-[18px]" />
          </button>
        )}
        {user ? (
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="px-4 h-9 rounded-full text-sm font-medium text-foreground border border-border hover:bg-muted transition-colors"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
