'use client';

type Risk = 'Low' | 'Medium' | 'High' | 'Extreme';

const styles: Record<Risk, string> = {
  Low:     'bg-risk-low text-white',
  Medium:  'bg-risk-medium text-white',
  High:    'bg-risk-high text-white',
  Extreme: 'bg-risk-extreme text-white',
};

export function RiskBadge({ level }: { level: Risk }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[level]}`}>
      {level}
    </span>
  );
}
