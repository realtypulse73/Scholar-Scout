// Types for the ScholarScout onboarding wizard

export type GpaBand =
  | 'below-2.0'
  | '2.0-2.4'
  | '2.5-2.9'
  | '3.0-3.4'
  | '3.5-4.0'
  | 'no-gpa';

export type Interest =
  | 'stem'
  | 'arts'
  | 'business'
  | 'education'
  | 'healthcare'
  | 'trades'
  | 'social-sciences'
  | 'law'
  | 'sports'
  | 'technology'
  | 'environment'
  | 'undecided';

export type LocationPreference =
  | 'local'
  | 'in-state'
  | 'out-of-state'
  | 'international'
  | 'online-only'
  | 'no-preference';

export type PathwayPreference =
  | '4-year-university'
  | '2-year-community-college'
  | 'trade-vocational'
  | 'certificate-program'
  | 'apprenticeship'
  | 'online-degree'
  | 'undecided';

export type AffordabilitySensitivity = 1 | 2 | 3 | 4 | 5;

export type SupportNeed =
  | 'financial-aid'
  | 'first-gen'
  | 'disability-services'
  | 'mental-health'
  | 'tutoring'
  | 'career-counseling'
  | 'housing'
  | 'childcare'
  | 'language-support'
  | 'none';

export interface OnboardingData {
  gpaBand: GpaBand | null;
  interests: Interest[];
  locationPreference: LocationPreference | null;
  pathwayPreference: PathwayPreference | null;
  affordabilitySensitivity: AffordabilitySensitivity;
  supportNeeds: SupportNeed[];
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  gpaBand: null,
  interests: [],
  locationPreference: null,
  pathwayPreference: null,
  affordabilitySensitivity: 3,
  supportNeeds: [],
};

export const TOTAL_STEPS = 6;

export const GPA_BAND_LABELS: Record<GpaBand, string> = {
  'below-2.0': 'Below 2.0',
  '2.0-2.4': '2.0 – 2.4',
  '2.5-2.9': '2.5 – 2.9',
  '3.0-3.4': '3.0 – 3.4',
  '3.5-4.0': '3.5 – 4.0',
  'no-gpa': 'No GPA / N/A',
};

export const INTEREST_LABELS: Record<Interest, string> = {
  stem: 'STEM',
  arts: 'Arts & Humanities',
  business: 'Business',
  education: 'Education',
  healthcare: 'Healthcare',
  trades: 'Skilled Trades',
  'social-sciences': 'Social Sciences',
  law: 'Law & Justice',
  sports: 'Sports & Fitness',
  technology: 'Technology & IT',
  environment: 'Environment',
  undecided: 'Undecided',
};

export const LOCATION_LABELS: Record<LocationPreference, string> = {
  local: 'Close to Home (< 30 mi)',
  'in-state': 'In-State',
  'out-of-state': 'Out-of-State',
  international: 'International',
  'online-only': 'Online Only',
  'no-preference': 'No Preference',
};

export const PATHWAY_LABELS: Record<PathwayPreference, string> = {
  '4-year-university': '4-Year University',
  '2-year-community-college': '2-Year Community College',
  'trade-vocational': 'Trade / Vocational School',
  'certificate-program': 'Certificate Program',
  apprenticeship: 'Apprenticeship',
  'online-degree': 'Online Degree Program',
  undecided: 'Undecided',
};

export const AFFORDABILITY_LABELS: Record<AffordabilitySensitivity, string> = {
  1: 'Cost is my #1 priority',
  2: 'Very cost-conscious',
  3: 'Balanced – value matters',
  4: 'Willing to invest more',
  5: 'Cost is not a barrier',
};

export const SUPPORT_NEED_LABELS: Record<SupportNeed, string> = {
  'financial-aid': 'Financial Aid & Scholarships',
  'first-gen': 'First-Generation Student Support',
  'disability-services': 'Disability Services',
  'mental-health': 'Mental Health Services',
  tutoring: 'Tutoring & Academic Support',
  'career-counseling': 'Career Counseling',
  housing: 'Housing Assistance',
  childcare: 'Childcare',
  'language-support': 'ESL / Language Support',
  none: 'No specific needs',
};
