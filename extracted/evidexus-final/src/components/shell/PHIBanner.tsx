import { useState } from "react";
import { X } from "lucide-react";

const PHIBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("evidexus.phi.dismissed") === "true";
  });

  if (dismissed) return null;

  return (
    <div className="bg-[hsl(var(--primary-soft))] border-b border-border">
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-2.5 flex items-center justify-between gap-3">
        <p className="text-[12px] text-foreground/80 leading-snug">
          Do not enter protected health information (PHI) or any other personal data of any individual.
        </p>
        <button
          onClick={() => {
            sessionStorage.setItem("evidexus.phi.dismissed", "true");
            setDismissed(true);
          }}
          className="shrink-0 text-foreground/60 hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default PHIBanner;
