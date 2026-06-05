'use client';

import type { SwmsActivity } from '@/lib/types';
import { RiskBadge } from './RiskBadge';

interface Props {
  activity: SwmsActivity;
  index: number;
}

export function ActivityCard({ activity, index }: Props) {
  return (
    <div className="border border-brand-line rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-brand-charcoal text-white px-4 py-3 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="font-[family-name:var(--font-mono-plex)] text-brand-amber text-sm mt-0.5 shrink-0">
            {String(index).padStart(2, '0')}
          </span>
          <span className="font-semibold text-sm leading-snug">{activity.task}</span>
        </div>
        <span className="text-xs text-brand-steel shrink-0">{activity.responsible}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-brand-line">
        {/* Hazards */}
        <div className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-steel mb-2">Hazards</h4>
          <ul className="space-y-1">
            {activity.hazards.map((h, i) => (
              <li key={i} className="text-sm text-brand-charcoal flex gap-2">
                <span className="text-risk-high mt-0.5 shrink-0">▲</span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Controls */}
        <div className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-brand-steel mb-2">Controls</h4>
          <ul className="space-y-1">
            {activity.controls.map((c, i) => (
              <li key={i} className="text-sm text-brand-charcoal flex gap-2">
                <span className="text-risk-low mt-0.5 shrink-0">✓</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Risk row */}
      <div className="border-t border-brand-line bg-brand-paper-2 px-4 py-2.5 flex items-center gap-4 text-xs">
        <span className="text-brand-steel font-medium">Initial risk</span>
        <RiskBadge level={activity.initialRisk} />
        <span className="text-brand-steel">→</span>
        <span className="text-brand-steel font-medium">Residual risk</span>
        <RiskBadge level={activity.residualRisk} />
      </div>
    </div>
  );
}
