import Link from 'next/link';

type Props = {
  requiredPlan: 'crew' | 'business';
  feature: string;
};

const PLAN_LABELS: Record<'crew' | 'business', string> = {
  crew: 'Small Crew',
  business: 'Business',
};

export function UpgradePrompt({ requiredPlan, feature }: Props) {
  const planLabel = PLAN_LABELS[requiredPlan];

  return (
    <div className="bg-brand-paper border border-brand-line rounded-lg p-3 text-sm flex items-start gap-2">
      <span className="text-base leading-5 shrink-0" aria-hidden="true">🔒</span>
      <div className="flex-1 min-w-0">
        <span className="text-brand-ink">
          Upgrade to <strong>{planLabel}</strong> to use {feature}.{' '}
        </span>
        <Link
          href="/pricing"
          className="font-semibold text-brand-amber-deep hover:underline whitespace-nowrap"
        >
          View plans
        </Link>
      </div>
    </div>
  );
}
