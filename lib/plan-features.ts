export type PlanKey = 'solo' | 'crew' | 'business';

export type Feature =
  | 'templates'
  | 'bulk_generate'
  | 'worker_profiles'
  | 'email_swms'
  | 'white_label'
  | 'version_history'
  | 'docx_export'
  | 'qr_signoff'
  | 'priority_support';

const PLAN_DAILY_LIMITS: Record<PlanKey, number> = {
  solo: 20,
  crew: 50,
  business: 100,
};

// null = unlimited
const PLAN_HISTORY_DAYS: Record<PlanKey, number | null> = {
  solo: 90,
  crew: 90,
  business: null,
};

const CREW_FEATURES: Feature[] = [
  'templates',
  'bulk_generate',
  'worker_profiles',
  'email_swms',
];

const BUSINESS_FEATURES: Feature[] = [
  ...CREW_FEATURES,
  'white_label',
  'version_history',
  'docx_export',
  'qr_signoff',
  'priority_support',
];

const PLAN_FEATURES: Record<PlanKey, Feature[]> = {
  solo: [],
  crew: CREW_FEATURES,
  business: BUSINESS_FEATURES,
};

export function hasFeature(plan: PlanKey | null | undefined, feature: Feature): boolean {
  if (!plan) return false;
  return PLAN_FEATURES[plan].includes(feature);
}

export function getDailyLimit(plan: PlanKey | null | undefined): number {
  if (!plan) return 0;
  return PLAN_DAILY_LIMITS[plan];
}

export function getHistoryDays(plan: PlanKey | null | undefined): number | null {
  if (!plan) return 0;
  return PLAN_HISTORY_DAYS[plan];
}

export function getMinPlanForFeature(feature: Feature): PlanKey {
  if (PLAN_FEATURES.crew.includes(feature)) return 'crew';
  return 'business';
}
