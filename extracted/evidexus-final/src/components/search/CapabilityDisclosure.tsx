import { useState } from "react";
import { ChevronDown, MapPin, Leaf } from "lucide-react";

type Props = {
  indiaContext: boolean;
  onIndiaContextChange: (v: boolean) => void;
  ayurvedicMode: boolean;
  onAyurvedicChange: (v: boolean) => void;
  showAyurvedic: boolean;
  showIndiaContext: boolean;
};

const CapabilityDisclosure = ({
  indiaContext,
  onIndiaContextChange,
  ayurvedicMode,
  onAyurvedicChange,
  showAyurvedic,
  showIndiaContext,
}: Props) => {
  const [open, setOpen] = useState(false);

  if (!showAyurvedic && !showIndiaContext) return null;

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
      >
        Explore more capabilities
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 animate-fade-in">
          {showIndiaContext && (
            <button
              type="button"
              onClick={() => onIndiaContextChange(!indiaContext)}
              aria-pressed={indiaContext}
              title="Prefer Indian guidelines (ICMR, NTEP, NACO, NCDC, MoHFW)"
              className={`pill ${indiaContext ? "pill-active" : ""}`}
            >
              <MapPin className="h-3.5 w-3.5" />
              India context
            </button>
          )}
          {showAyurvedic && (
            <button
              type="button"
              onClick={() => onAyurvedicChange(!ayurvedicMode)}
              aria-pressed={ayurvedicMode}
              title="Check Ayurvedic ↔ Allopathic interactions"
              className={`pill ${ayurvedicMode ? "pill-active" : ""}`}
            >
              <Leaf className="h-3.5 w-3.5" />
              Ayurvedic ↔ Allopathic
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CapabilityDisclosure;
