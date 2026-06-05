'use client';
type Risk = 'Low' | 'Medium' | 'High' | 'Extreme';
interface Props { level: Risk; }
const colors: Record<Risk, string> = {
  Low: 'bg-risk-low text-white',
  Medium: 'bg-risk-medium text-white',
  High: 'bg-risk-high text-white',
  Extreme: 'bg-risk-extreme text-white',
};
export function RiskBadge({ level }: Props) {
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level]}`}>{level}</span>;
}
