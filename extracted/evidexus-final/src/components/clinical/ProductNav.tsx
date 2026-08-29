import { useLocation, useNavigate } from "react-router-dom";
import { Search, BookOpen, ArrowLeftRight, AlertCircle, ShieldCheck, LogOut, User, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.webp";

const tabs = [
  { id: "clinical", label: "QUERY", icon: Search, path: "/" },
  { id: "literature", label: "LITERATURE", icon: BookOpen, path: "/literature" },
  { id: "compare", label: "COMPARE", icon: ArrowLeftRight, path: "/compare" },
  { id: "interactions", label: "DRUGS", icon: AlertCircle, path: "/interactions" },
  { id: "verify", label: "VERIFY RX", icon: ShieldCheck, path: "/verify" },
  { id: "history", label: "HISTORY", icon: History, path: "/history" },
];

const ProductNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <>
      {/* Top header - minimal */}
      <header className="h-14 border-b border-border bg-background flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Evidexus" className="h-7 w-7 object-contain" />
          <span className="font-serif font-bold text-foreground text-lg tracking-tight">
            EVIDEXUS
          </span>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={handleSignOut}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = currentPath === tab.path || (tab.path === "/" && currentPath === "/");
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[9px] font-semibold tracking-wider ${isActive ? "text-primary" : ""}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default ProductNav;
