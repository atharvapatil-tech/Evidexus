import { Fragment } from "react";

/**
 * Renders prose with inline numbered citation chips.
 * Citations are scroll-anchors to <li id="cite-N"> in the SourcesList.
 *
 * Two input formats are supported:
 * 1. Plain text — pass `text` and `citationsAfter` (numbers appended at end)
 * 2. Markup — embed `[1]` `[2]` style markers directly in the text and pass `parseInline=true`
 */

type Props = {
  text: string;
  citationsAfter?: number[]; // appends [n] [m] at the end of the paragraph
  parseInline?: boolean;
  className?: string;
  as?: "p" | "span" | "div";
};

const Citation = ({ n }: { n: number }) => (
  <a
    href={`#cite-${n}`}
    onClick={(e) => {
      e.preventDefault();
      const el = document.getElementById(`cite-${n}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary/40");
        setTimeout(() => el.classList.remove("ring-2", "ring-primary/40"), 1500);
      }
    }}
    className="cite-chip"
    aria-label={`Citation ${n}`}
  >
    {n}
  </a>
);

const InlineCitations = ({ text, citationsAfter = [], parseInline, className, as = "span" }: Props) => {
  const Tag = as as any;

  if (!parseInline) {
    return (
      <Tag className={className}>
        {text}
        {citationsAfter.length > 0 && (
          <span className="ml-0.5">
            {citationsAfter.map((n) => (
              <Citation key={n} n={n} />
            ))}
          </span>
        )}
      </Tag>
    );
  }

  // Parse [1], [2,3], [1-3] markers in text
  const parts = text.split(/(\[[0-9,\s\-]+\])/g);
  return (
    <Tag className={className}>
      {parts.map((part, i) => {
        const m = part.match(/^\[([0-9,\s\-]+)\]$/);
        if (!m) return <Fragment key={i}>{part}</Fragment>;
        const nums = expandRanges(m[1]);
        return (
          <span key={i}>
            {nums.map((n) => (
              <Citation key={n} n={n} />
            ))}
          </span>
        );
      })}
    </Tag>
  );
};

function expandRanges(input: string): number[] {
  const out = new Set<number>();
  input.split(",").forEach((tok) => {
    const t = tok.trim();
    const r = t.match(/^(\d+)\s*-\s*(\d+)$/);
    if (r) {
      const [a, b] = [parseInt(r[1]), parseInt(r[2])];
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.add(i);
    } else {
      const n = parseInt(t);
      if (!Number.isNaN(n)) out.add(n);
    }
  });
  return [...out].sort((a, b) => a - b);
}

export default InlineCitations;
