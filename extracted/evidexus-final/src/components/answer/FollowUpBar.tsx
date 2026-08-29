import { useState } from "react";
import UnifiedSearch from "@/components/search/UnifiedSearch";
import type { SearchMode } from "@/lib/searchModes";
import { MODE_META } from "@/lib/searchModes";

type Props = {
  mode: SearchMode;
  isLoading: boolean;
  onSubmit: (query: string) => void;
  suggestions?: string[];
};

const FollowUpBar = ({ mode, isLoading, onSubmit, suggestions = [] }: Props) => {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  };

  return (
    <div className="mt-12">
      {suggestions.length > 0 && (
        <div className="mb-4">
          <p className="eyebrow mb-3">Suggested follow-ups</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => onSubmit(s)}
                disabled={isLoading}
                className="pill text-left"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <UnifiedSearch
        value={value}
        onChange={setValue}
        onSubmit={submit}
        isLoading={isLoading}
        placeholder={`Ask a follow-up · ${MODE_META[mode].label}`}
        size="md"
      />
    </div>
  );
};

export default FollowUpBar;
