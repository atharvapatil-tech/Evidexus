import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import TopBar from "@/components/shell/TopBar";
import PHIBanner from "@/components/shell/PHIBanner";
import { MODE_META, MODE_ORDER, type SearchMode } from "@/lib/searchModes";
import { runQuery } from "@/lib/runQuery";
import { useQueryTracker } from "@/hooks/useQueryTracker";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.webp";
import DDxEngine from "@/components/clinical/DDxEngine";
import DoseCalculator from "@/components/clinical/DoseCalculator";
import { Loader2, Search, ArrowRight } from "lucide-react";

const INDIA_EXAMPLES = [
  "Empirical antibiotics for sepsis (ICMR AMR)",
  "Management of dengue with warning signs",
  "TB treatment regimen for new case (NTEP)",
  "Hypertension in diabetic Indian patient",
];

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { checkLimit, fetchStats } = useQueryTracker();

  const [mode, setMode] = useState<SearchMode>("qa");
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [indiaContext, setIndiaContext] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem("evidexus.indiaContext") === "true"
  );

  const handleSubmit = async () => {
    if (!user) { navigate("/auth"); return; }
    const q = value.trim();
    if (!q) return;
    const allowed = await checkLimit();
    if (!allowed) return;

    setIsLoading(true);
    try {
      localStorage.setItem("evidexus.indiaContext", String(indiaContext));
      const res = await runQuery(mode, q, { indiaContext });
      if (!res.ok) { toast.error(res.error); return; }
      const id = res.query_id;
      if (id) { await fetchStats(); navigate(`/answer/${id}`); }
    } finally {
      setIsLoading(false);
    }
  };

  // DDx and Dose have their own full UI
  if (mode === "ddx") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PHIBanner />
        <TopBar />
        <div className="flex gap-1 px-4 pt-4 pb-0 overflow-x-auto border-b border-border">
          {MODE_ORDER.map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-2 text-[13px] font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                mode === m ? "bg-background border border-b-0 border-border text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {MODE_META[m].label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          <DDxEngine />
        </div>
      </div>
    );
  }

  if (mode === "dose") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PHIBanner />
        <TopBar />
        <div className="flex gap-1 px-4 pt-4 pb-0 overflow-x-auto border-b border-border">
          {MODE_ORDER.map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-2 text-[13px] font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                mode === m ? "bg-background border border-b-0 border-border text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {MODE_META[m].label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          <DoseCalculator />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PHIBanner />
      <TopBar />

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-[680px]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <img src={logo} alt="" className="h-10 w-10 object-contain mb-3 opacity-90" />
            <h1 className="text-[32px] md:text-[38px] font-bold tracking-tight text-foreground">
              Evidexus<sup className="text-[12px] text-primary font-sans align-super ml-0.5">®</sup>
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1">
              Clinical intelligence for Indian physicians
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {MODE_ORDER.map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-full whitespace-nowrap transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}>
                {MODE_META[m].label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit()}
              placeholder={MODE_META[mode].placeholder}
              disabled={isLoading}
              className="w-full h-14 pl-11 pr-14 text-[15px] border border-border rounded-2xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 shadow-sm"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !value.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </div>

          {/* India context toggle */}
          <div className="flex items-center justify-between mb-8">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setIndiaContext(v => !v)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${indiaContext ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${indiaContext ? "left-4" : "left-0.5"}`} />
              </div>
              <span className="text-[13px] text-muted-foreground">
                🇮🇳 India context (ICMR / CSI priority)
              </span>
            </label>
          </div>

          {/* Example queries */}
          {mode === "qa" && (
            <div>
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
                Try these
              </p>
              <div className="flex flex-wrap gap-2">
                {INDIA_EXAMPLES.map(ex => (
                  <button key={ex} onClick={() => { setValue(ex); }}
                    className="text-[13px] px-3 py-1.5 border border-border rounded-full text-foreground hover:bg-muted/40 hover:border-primary/30 transition-colors text-left">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "ddx" && (
            <p className="text-[13px] text-muted-foreground text-center">
              Switch to the DDx tab for the full differential diagnosis tool
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
