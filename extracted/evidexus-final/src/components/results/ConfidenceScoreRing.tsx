import { useEffect, useState } from "react";

interface ConfidenceScoreRingProps {
  percent: number;
  color: string;
  size?: number;
}

const ConfidenceScoreRing = ({ percent, color, size = 120 }: ConfidenceScoreRingProps) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="confidence-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{animatedPercent}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</span>
      </div>
    </div>
  );
};

export default ConfidenceScoreRing;
