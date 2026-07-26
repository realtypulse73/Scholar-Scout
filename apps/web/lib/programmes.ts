import type {
  Interest,
  LocationPreference,
  SupportNeed,
} from '@/lib/onboarding-types';
import { paginateItems } from '@/lib/pagination';

export type AidType =
  | 'pell-grant'
  | 'institutional-grant'
  | 'work-study'
  | 'state-grant'
  | 'need-based-scholarship'
  | 'merit-scholarship'
  | 'employer-tuition-help';

export type ProgrammePathway =
  | '4-year-university'
  | '2-year-community-college'
  | 'trade-vocational'
  | 'certificate-program'
  | 'apprenticeship'
  | 'online-degree';

export type InstitutionKind =
  | '4-year-college'
  | '2-year-college'
  | 'career-training'
  | 'certificate-provider'
  | 'apprenticeship-sponsor'
  | 'online-provider';

export type ProgrammeDataSource =
  | 'manual'
  | 'ipeds'
  | 'college-scorecard'
  | 'state-workforce'
  | 'apprenticeship'
  | 'school-catalog';

export interface ProgrammeSourceIds {
  ipedsUnitId?: string;
  opeId?: string;
  collegeScorecardId?: string;
  stateProviderId?: string;
  apprenticeshipSponsorId?: string;
  schoolCatalogId?: string;
}

export interface ProgrammeCrossReference {
  sourceIds: ProgrammeSourceIds;
  sources: ProgrammeDataSource[];
  lastCrossReferencedAt?: string;
}

export type ProgrammePublicationStatus = 'draft' | 'in-review' | 'published';
export type ProgrammeSourceConfidence = 'unverified' | 'needs-review' | 'verified';
export type ProgrammeSourceCheck =
  | 'tuition'
  | 'credential'
  | 'duration'
  | 'delivery'
  | 'support'
  | 'next-steps';

export interface Programme {
  id: string;
  name: string;
  school: string;
  city: string;
  state: string;
  delivery: 'Campus' | 'Hybrid' | 'Online';
  institutionKind?: InstitutionKind;
  pathway: ProgrammePathway;
  interests: Interest[];
  support: SupportNeed[];
  supportFocus?: SupportNeed[];
  annualTuition: number;
  acceptanceRate: number;
  matchScore: number;
  duration: string;
  overview: string;
  credential: string;
  highlights: string[];
  nextSteps: string[];
  applicationDeadline?: string;
  aidDeadline?: string;
  aidTypes?: AidType[];
  crossReference?: ProgrammeCrossReference;
  publicationStatus?: ProgrammePublicationStatus;
  sourceName?: string;
  sourceUrl?: string;
  sourceConfidence?: ProgrammeSourceConfidence;
  sourceNotes?: string;
  sourceChecks?: ProgrammeSourceCheck[];
  lastVerifiedAt?: string;
  reviewAssignee?: string;
  reviewNotes?: string;
  revision?: number;
}

export interface ProgrammeFilters {
  query?: string;
  pathway?: ProgrammePathway | 'all';
  location?: LocationPreference | 'all';
  maxTuition?: number;
  supportFocus?: SupportNeed | 'all';
  institutionKind?: InstitutionKind | 'all';
  continentalUSOnly?: boolean;
}

export const CONTINENTAL_US_STATES = [
  'AL',
  'AR',
  'AZ',
  'CA',
  'CO',
  'CT',
  'DC',
  'DE',
  'FL',
  'GA',
  'IA',
  'ID',
  'IL',
  'IN',
  'KS',
  'KY',
  'LA',
  'MA',
  'MD',
  'ME',
  'MI',
  'MN',
  'MO',
  'MS',
  'MT',
  'NC',
  'ND',
  'NE',
  'NH',
  'NJ',
  'NM',
  'NV',
  'NY',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VA',
  'VT',
  'WA',
  'WI',
  'WV',
  'WY',
] as const;

export const INSTITUTION_KIND_LABELS: Record<InstitutionKind, string> = {
  '4-year-college': '4-year college',
  '2-year-college': '2-year college',
  'career-training': 'Career training',
  'certificate-provider': 'Certificate provider',
  'apprenticeship-sponsor': 'Apprenticeship sponsor',
  'online-provider': 'Online provider',
};

export const PROGRAMME_PATHWAY_LABELS: Record<ProgrammePathway, string> = {
  '4-year-university': '4-year',
  '2-year-community-college': '2-year',
  'trade-vocational': 'Trade',
  'certificate-program': 'Certificate',
  apprenticeship: 'Apprenticeship',
  'online-degree': 'Online degree',
};

export const programmes: Programme[] = [
  {
    id: 'north-valley-health',
    name: 'Applied Health Sciences',
    school: 'North Valley College',
    city: 'Riverside',
    state: 'CA',
    delivery: 'Campus',
    institutionKind: '2-year-college',
    pathway: '2-year-community-college',
    interests: ['healthcare', 'stem'],
    support: ['tutoring', 'career-counseling', 'financial-aid', 'iep-support'],
    supportFocus: ['iep-support', 'disability-services', 'tutoring'],
    annualTuition: 5400,
    acceptanceRate: 100,
    matchScore: 94,
    duration: '2 years',
    credential: 'Associate pathway',
    overview:
      'A health science starting point for students who want lab practice, strong school help, and a lower-cost path into health work or transfer.',
    highlights: ['Clinical observation', 'Transfer pathway', 'Peer tutoring'],
    applicationDeadline: '2026-08-01',
    aidDeadline: '2026-06-15',
    aidTypes: ['pell-grant', 'institutional-grant', 'work-study', 'state-grant'],
    nextSteps: [
      'Check required health classes',
      'Ask about clinical observation rules',
      'Compare transfer schools and scholarship dates',
    ],
    crossReference: createCrossReference({
      ipedsUnitId: 'sample-north-valley',
      collegeScorecardId: 'sample-north-valley',
      schoolCatalogId: 'north-valley-health',
    }),
  },
  {
    id: 'metro-cybersecurity',
    name: 'Cybersecurity Certificate',
    school: 'Metro Technical Institute',
    city: 'Online',
    state: 'US',
    delivery: 'Online',
    institutionKind: 'certificate-provider',
    pathway: 'certificate-program',
    interests: ['technology', 'stem'],
    support: ['career-counseling', 'financial-aid'],
    supportFocus: ['career-counseling'],
    annualTuition: 3900,
    acceptanceRate: 100,
    matchScore: 91,
    duration: '9 months',
    credential: 'Career certificate',
    overview:
      'A short online cyber path with hands-on labs, test prep, and flexible pacing for students with work or family needs.',
    highlights: ['Industry labs', 'Evening pace', 'Certification prep'],
    aidTypes: ['pell-grant', 'employer-tuition-help'],
    nextSteps: [
      'Check laptop and software needs',
      'Ask which certification test is included',
      'Compare the evening workload with your schedule',
    ],
    crossReference: createCrossReference({
      stateProviderId: 'sample-metro-cybersecurity',
      schoolCatalogId: 'metro-cybersecurity',
    }, ['state-workforce', 'school-catalog']),
  },
  {
    id: 'lakeside-business-transfer',
    name: 'Business Transfer Pathway',
    school: 'Lakeside Community College',
    city: 'Madison',
    state: 'WI',
    delivery: 'Hybrid',
    institutionKind: '2-year-college',
    pathway: '2-year-community-college',
    interests: ['business'],
    support: ['first-gen', 'tutoring', 'financial-aid', 'iep-support'],
    supportFocus: ['first-gen', 'iep-support', 'tutoring'],
    annualTuition: 4700,
    acceptanceRate: 100,
    matchScore: 88,
    duration: '2 years',
    credential: 'Associate transfer pathway',
    overview:
      'A business path at a community college for students who want a lower-cost start, transfer help, and room to explore.',
    highlights: ['Transfer advising', 'Low tuition', 'Flexible schedule'],
    applicationDeadline: '2026-07-31',
    aidDeadline: '2026-06-30',
    aidTypes: ['pell-grant', 'institutional-grant', 'work-study', 'state-grant', 'need-based-scholarship'],
    nextSteps: [
      'Meet with a transfer advisor',
      'Match credits with target universities',
      'Review financial aid eligibility',
    ],
    crossReference: createCrossReference({
      ipedsUnitId: 'sample-lakeside',
      collegeScorecardId: 'sample-lakeside',
      schoolCatalogId: 'lakeside-business-transfer',
    }),
  },
  {
    id: 'evergreen-environmental',
    name: 'Environmental Systems',
    school: 'Evergreen State University',
    city: 'Olympia',
    state: 'WA',
    delivery: 'Campus',
    institutionKind: '4-year-college',
    pathway: '4-year-university',
    interests: ['environment', 'stem'],
    support: ['mental-health', 'disability-services', 'financial-aid', 'iep-support'],
    supportFocus: ['disability-services', 'iep-support', 'mental-health'],
    annualTuition: 11800,
    acceptanceRate: 74,
    matchScore: 84,
    duration: '4 years',
    credential: "Bachelor's degree",
    overview:
      'A four-year environmental program for students who want field work, public university resources, and disability and wellness support.',
    highlights: ['Field research', 'Public university', 'Support services'],
    applicationDeadline: '2026-11-01',
    aidDeadline: '2026-10-01',
    aidTypes: ['pell-grant', 'institutional-grant', 'state-grant', 'need-based-scholarship', 'merit-scholarship'],
    nextSteps: [
      'Ask about fieldwork travel',
      'Check lab requirements',
      'Ask about research assistant opportunities',
    ],
    crossReference: createCrossReference({
      ipedsUnitId: 'sample-evergreen',
      collegeScorecardId: 'sample-evergreen',
      schoolCatalogId: 'evergreen-environmental',
    }),
  },
  {
    id: 'harbor-welding',
    name: 'Advanced Welding',
    school: 'Harbor Trade Academy',
    city: 'Norfolk',
    state: 'VA',
    delivery: 'Campus',
    institutionKind: 'career-training',
    pathway: 'trade-vocational',
    interests: ['trades'],
    support: ['career-counseling', 'financial-aid'],
    supportFocus: ['career-counseling'],
    annualTuition: 7200,
    acceptanceRate: 100,
    matchScore: 82,
    duration: '12 months',
    credential: 'Trade diploma',
    overview:
      'A hands-on welding program built for quick job entry, with tool help, work practice, and job placement support.',
    highlights: ['Paid externship', 'Union pathways', 'Tool grant'],
    applicationDeadline: '2026-07-01',
    aidTypes: ['pell-grant', 'employer-tuition-help'],
    nextSteps: [
      'Ask about safety gear and tool grants',
      'Check work practice timing',
      'Compare certification levels offered',
    ],
    crossReference: createCrossReference({
      stateProviderId: 'sample-harbor-welding',
      schoolCatalogId: 'harbor-welding',
    }, ['state-workforce', 'school-catalog']),
  },
  {
    id: 'summit-teacher-apprentice',
    name: 'Teacher Apprentice Residency',
    school: 'Summit Learning Network',
    city: 'Columbus',
    state: 'OH',
    delivery: 'Hybrid',
    institutionKind: 'apprenticeship-sponsor',
    pathway: 'apprenticeship',
    interests: ['education', 'social-sciences'],
    support: ['first-gen', 'career-counseling', 'childcare', 'iep-support'],
    supportFocus: ['first-gen', 'iep-support', 'childcare'],
    annualTuition: 2600,
    acceptanceRate: 86,
    matchScore: 79,
    duration: '18 months',
    credential: 'State credential',
    overview:
      'An earn-while-learning path for future teachers who want classroom mentors, hybrid classes, and help earning a credential.',
    highlights: ['Earn while learning', 'Mentor classroom', 'State credential'],
    applicationDeadline: '2026-06-25',
    aidTypes: ['pell-grant', 'employer-tuition-help'],
    nextSteps: [
      'Check paid classroom hours',
      'Review classroom placement sites',
      'Ask if childcare support is available',
    ],
    crossReference: createCrossReference({
      apprenticeshipSponsorId: 'sample-summit-teacher',
      stateProviderId: 'sample-summit-teacher',
      schoolCatalogId: 'summit-teacher-apprentice',
    }, ['apprenticeship', 'state-workforce', 'school-catalog']),
  },
  {
    id: 'openwest-it-degree',
    name: 'Information Technology Degree',
    school: 'OpenWest Online University',
    city: 'Online',
    state: 'US',
    delivery: 'Online',
    institutionKind: 'online-provider',
    pathway: 'online-degree',
    interests: ['technology', 'business'],
    support: ['language-support', 'tutoring', 'career-counseling'],
    supportFocus: ['language-support', 'tutoring'],
    annualTuition: 8400,
    acceptanceRate: 100,
    matchScore: 77,
    duration: '3 years',
    credential: "Bachelor's degree",
    overview:
      'A fully online IT degree with self-paced terms, portfolio projects, and remote advising for students who need flexibility and career help.',
    highlights: ['Self-paced terms', 'Remote advising', 'Portfolio projects'],
    aidTypes: ['pell-grant', 'employer-tuition-help', 'need-based-scholarship'],
    nextSteps: [
      'Review weekly time needs',
      'Ask about portfolio review milestones',
      'Compare transfer credit policies',
    ],
    crossReference: createCrossReference({
      ipedsUnitId: 'sample-openwest',
      collegeScorecardId: 'sample-openwest',
      schoolCatalogId: 'openwest-it-degree',
    }),
  },
  {
    id: 'civic-justice',
    name: 'Civic Justice Studies',
    school: 'Capital City College',
    city: 'Albany',
    state: 'NY',
    delivery: 'Campus',
    institutionKind: '4-year-college',
    pathway: '4-year-university',
    interests: ['law', 'social-sciences'],
    support: ['mental-health', 'first-gen', 'financial-aid'],
    supportFocus: ['first-gen', 'mental-health'],
    annualTuition: 9800,
    acceptanceRate: 68,
    matchScore: 73,
    duration: '4 years',
    credential: "Bachelor's degree",
    overview:
      'A civic justice program for students interested in law, policy, and public service, with writing help and internship links.',
    highlights: ['Policy clinics', 'Internship network', 'Writing support'],
    applicationDeadline: '2026-10-15',
    aidDeadline: '2026-09-15',
    aidTypes: ['pell-grant', 'institutional-grant', 'state-grant', 'need-based-scholarship'],
    nextSteps: [
      'Explore internship partner sites',
      'Review writing-heavy classes',
      'Ask about first-gen student advising',
    ],
    crossReference: createCrossReference({
      ipedsUnitId: 'sample-capital-city',
      collegeScorecardId: 'sample-capital-city',
      schoolCatalogId: 'civic-justice',
    }),
  },
];

export function getProgrammeById(id: string) {
  return programmes.find((programme) => programme.id === id);
}

export function getRelatedProgrammes(programme: Programme, limit = 3) {
  return programmes
    .filter((candidate) => candidate.id !== programme.id)
    .map((candidate) => ({
      programme: candidate,
      score:
        (candidate.pathway === programme.pathway ? 2 : 0) +
        candidate.interests.filter((interest) =>
          programme.interests.includes(interest),
        ).length +
        candidate.support.filter((support) => programme.support.includes(support))
          .length,
    }))
    .sort((a, b) => b.score - a.score || b.programme.matchScore - a.programme.matchScore)
    .slice(0, limit)
    .map(({ programme }) => programme);
}

export function filterProgrammes(
  items: Programme[],
  filters: ProgrammeFilters,
) {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? '';

  return items
    .filter((programme) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
        programme.name,
        programme.school,
        programme.city,
        programme.state,
        ...programme.highlights,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .filter((programme) => {
      if (!filters.pathway || filters.pathway === 'all') {
        return true;
      }

      return programme.pathway === filters.pathway;
    })
    .filter((programme) => {
      if (!filters.location || filters.location === 'all') {
        return true;
      }

      if (filters.location === 'online-only') {
        return programme.delivery === 'Online';
      }

      if (filters.location === 'local' || filters.location === 'in-state') {
        return programme.state !== 'US';
      }

      return true;
    })
    .filter((programme) => {
      if (!filters.maxTuition) {
        return true;
      }

      return programme.annualTuition <= filters.maxTuition;
    })
    .filter((programme) => {
      if (!filters.supportFocus || filters.supportFocus === 'all') {
        return true;
      }

      return getProgrammeSupportCoverage(programme).includes(filters.supportFocus);
    })
    .filter((programme) => {
      if (!filters.institutionKind || filters.institutionKind === 'all') {
        return true;
      }

      return getProgrammeInstitutionKind(programme) === filters.institutionKind;
    })
    .filter((programme) => {
      if (!filters.continentalUSOnly) {
        return true;
      }

      return isContinentalUSProgramme(programme);
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function paginateProgrammes<T>(items: T[], page: number, pageSize: number) {
  return paginateItems(items, page, pageSize);
}

export function getProgrammeSupportCoverage(
  programme: Pick<Programme, 'support' | 'supportFocus'>,
) {
  return Array.from(new Set([...(programme.supportFocus ?? []), ...programme.support]));
}

export function getProgrammeInstitutionKind(
  programme: Pick<Programme, 'institutionKind' | 'delivery' | 'pathway'>,
): InstitutionKind {
  if (programme.institutionKind) {
    return programme.institutionKind;
  }

  if (programme.delivery === 'Online') {
    return 'online-provider';
  }

  if (programme.pathway === '2-year-community-college') {
    return '2-year-college';
  }

  if (programme.pathway === '4-year-university') {
    return '4-year-college';
  }

  if (programme.pathway === 'apprenticeship') {
    return 'apprenticeship-sponsor';
  }

  if (programme.pathway === 'certificate-program') {
    return 'certificate-provider';
  }

  return 'career-training';
}

export function isContinentalUSProgramme(
  programme: Pick<Programme, 'delivery' | 'state'>,
) {
  if (programme.delivery === 'Online' && programme.state === 'US') {
    return true;
  }

  return CONTINENTAL_US_STATES.includes(
    programme.state as (typeof CONTINENTAL_US_STATES)[number],
  );
}

export function getCrossReferenceKey(
  programme: Pick<Programme, 'crossReference' | 'id'>,
) {
  const ids = programme.crossReference?.sourceIds;

  return (
    ids?.ipedsUnitId ??
    ids?.collegeScorecardId ??
    ids?.opeId ??
    ids?.stateProviderId ??
    ids?.apprenticeshipSponsorId ??
    ids?.schoolCatalogId ??
    programme.id
  );
}

export function getCrossReferencedProgrammeCount(items: Programme[]) {
  return new Set(items.map((programme) => getCrossReferenceKey(programme))).size;
}

function createCrossReference(
  sourceIds: ProgrammeSourceIds,
  sources: ProgrammeDataSource[] = ['ipeds', 'college-scorecard', 'school-catalog'],
): ProgrammeCrossReference {
  return {
    sourceIds,
    sources,
  };
}
