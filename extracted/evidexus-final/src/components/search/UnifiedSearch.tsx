import { ArrowRight, Loader2 } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  isLoading?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
  size?: "lg" | "md";
};

const UnifiedSearch = forwardRef<HTMLTextAreaElement | HTMLInputElement, Props>(({
  value,
  onChange,
  onSubmit,
  placeholder,
  isLoading,
  multiline,
  autoFocus,
  size = "lg",
}, forwardedRef) => {
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useImperativeHandle(forwardedRef, () => ref.current as HTMLTextAreaElement | HTMLInputElement, []);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
  };

  const isLg = size === "lg";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isLoading && value.trim()) onSubmit();
      }}
      className={`search-halo bg-background rounded-full flex items-center gap-2 ${
        isLg ? "pl-6 pr-2 py-2" : "pl-5 pr-1.5 py-1.5"
      }`}
    >
      {multiline ? (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          rows={1}
          className={`flex-1 bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground/70 text-foreground ${
            isLg ? "text-[16px] py-2.5" : "text-[14px] py-2"
          }`}
          disabled={isLoading}
        />
      ) : (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className={`flex-1 bg-transparent focus:outline-none placeholder:text-muted-foreground/70 text-foreground ${
            isLg ? "text-[16px] py-2.5" : "text-[14px] py-2"
          }`}
          disabled={isLoading}
        />
      )}

      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        aria-label="Submit"
        className={`shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
          isLg ? "h-12 w-12" : "h-10 w-10"
        }`}
      >
        {isLoading ? (
          <Loader2 className={isLg ? "h-5 w-5 animate-spin" : "h-4 w-4 animate-spin"} />
        ) : (
          <ArrowRight className={isLg ? "h-5 w-5" : "h-4 w-4"} />
        )}
      </button>
    </form>
  );
});

UnifiedSearch.displayName = "UnifiedSearch";

export default UnifiedSearch;
