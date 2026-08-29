import { MODE_META, MODE_ORDER, type SearchMode } from "@/lib/searchModes";
import {
  MessageCircleQuestion,
  BookOpen,
  ArrowLeftRight,
  Pill,
  ShieldCheck,
} from "lucide-react";

const ICONS: Record<SearchMode, React.ComponentType<{ className?: string }>> = {
  qa: MessageCircleQuestion,
  literature: BookOpen,
  compare: ArrowLeftRight,
  interactions: Pill,
  verify: ShieldCheck,
};

type Props = {
  active: SearchMode;
  onChange: (mode: SearchMode) => void;
};

const ModeChips = ({ active, onChange }: Props) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {MODE_ORDER.map((m) => {
        const Icon = ICONS[m];
        const isActive = active === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            aria-pressed={isActive}
            className={`pill ${isActive ? "pill-active" : ""}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{MODE_META[m].label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ModeChips;
