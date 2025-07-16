
import React from 'react';

interface EffectivenessGaugeProps {
  score: number; // Score from 0 to 100
}

export const EffectivenessGauge: React.FC<EffectivenessGaugeProps> = ({ score }) => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  let colorClass = 'text-destructive';
  if (normalizedScore > 75) {
    colorClass = 'text-success';
  } else if (normalizedScore > 50) {
    colorClass = 'text-yellow-400';
  }

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-card"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={`transform -rotate-90 origin-center transition-all duration-1000 ease-out ${colorClass}`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${colorClass}`}>{normalizedScore}</span>
        <span className="text-xs text-muted-foreground">Score</span>
      </div>
    </div>
  );
};
