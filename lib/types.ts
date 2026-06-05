export interface SwmsActivity {
  task: string;
  hazards: string[];
  initialRisk: 'Low' | 'Medium' | 'High' | 'Extreme';
  controls: string[];
  residualRisk: 'Low' | 'Medium' | 'High' | 'Extreme';
  responsible: string;
}

export interface SwmsDocument {
  jobTitle: string;
  highRiskWork: string[];
  ppe: string[];
  permits: string[];
  activities: SwmsActivity[];
  emergencyProcedures: string[];
  legislation: string[];
}

export interface SwmsRecord {
  id: string;
  user_id: string;
  document_number: string;
  job_title: string;
  trade: string;
  state: string;
  site_address: string | null;
  principal_contractor: string | null;
  job_description: string;
  swms_json: SwmsDocument;
  pdf_url: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  business_name: string | null;
  abn: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: 'solo' | 'crew' | 'business';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}
