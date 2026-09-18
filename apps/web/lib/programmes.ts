import type {
  Interest,
  LocationPreference,
  SupportNeed,
} from '@/lib/onboarding-types';
import { paginateItems } from '@/lib/pagination';

export type ProgrammePathway =
  | '4-year-university'
  | '2-year-community-college'
  | 'trade-vocational'
  | 'certificate-program'
  | 'apprenticeship'
  | 'online-degree';

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
  pathway: ProgrammePathway;
  interests: Interest[];
  support: SupportNeed[];
  annualTuition: number;
  acceptanceRate: number;
  matchScore: number;
  duration: string;
  overview: string;
  credential: string;
  image?: string;
  admissionsFlexibilityLabel?: string;
  highlights: string[];
  nextSteps: string[];
  publicationStatus?: ProgrammePublicationStatus;
  sourceName?: string;
  sourceUrl?: string;
  schoolSocialUrl?: string;
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
}

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
    pathway: '2-year-community-college',
    interests: ['healthcare', 'stem'],
    support: ['tutoring', 'career-counseling', 'financial-aid'],
    annualTuition: 5400,
    acceptanceRate: 100,
    matchScore: 94,
    duration: '2 years',
    credential: 'Associate pathway',
    image: '/images/campuses/health-sciences.png',
    overview:
      'A health sciences starting point for students who want clinical exposure, strong academic support, and a lower-cost route into allied health or transfer options.',
    highlights: ['Clinical observation', 'Transfer pathway', 'Peer tutoring'],
    nextSteps: [
      'Review health prerequisite courses',
      'Ask about clinical observation requirements',
      'Compare transfer partners and scholarship deadlines',
    ],
  },
  {
    id: 'metro-cybersecurity',
    name: 'Cybersecurity Certificate',
    school: 'Metro Technical Institute',
    city: 'Online',
    state: 'US',
    delivery: 'Online',
    pathway: 'certificate-program',
    interests: ['technology', 'stem'],
    support: ['career-counseling', 'financial-aid'],
    annualTuition: 3900,
    acceptanceRate: 100,
    matchScore: 91,
    duration: '9 months',
    credential: 'Career certificate',
    image: '/images/campuses/technology-learning.png',
    overview:
      'A short online cybersecurity path built around hands-on labs, certification preparation, and flexible pacing for students balancing work or family responsibilities.',
    highlights: ['Industry labs', 'Evening pace', 'Certification prep'],
    nextSteps: [
      'Confirm laptop and software requirements',
      'Ask which certification exam is included',
      'Compare evening workload with your schedule',
    ],
  },
  {
    id: 'lakeside-business-transfer',
    name: 'Business Transfer Pathway',
    school: 'Lakeside Community College',
    city: 'Madison',
    state: 'WI',
    delivery: 'Hybrid',
    pathway: '2-year-community-college',
    interests: ['business'],
    support: ['first-gen', 'tutoring', 'financial-aid'],
    annualTuition: 4700,
    acceptanceRate: 100,
    matchScore: 88,
    duration: '2 years',
    credential: 'Associate transfer pathway',
    image: '/images/campuses/community-campus.png',
    overview:
      'A business-focused community college route for students who want an affordable start, structured transfer advising, and room to explore concentrations.',
    highlights: ['Transfer advising', 'Low tuition', 'Flexible schedule'],
    nextSteps: [
      'Meet with a transfer advisor',
      'Map credits against target universities',
      'Review financial aid eligibility',
    ],
  },
  {
    id: 'evergreen-environmental',
    name: 'Environmental Systems',
    school: 'Evergreen State University',
    city: 'Olympia',
    state: 'WA',
    delivery: 'Campus',
    pathway: '4-year-university',
    interests: ['environment', 'stem'],
    support: ['mental-health', 'disability-services', 'financial-aid'],
    annualTuition: 11800,
    acceptanceRate: 74,
    matchScore: 84,
    duration: '4 years',
    credential: "Bachelor's degree",
    image: '/images/campuses/applied-learning.png',
    overview:
      'A four-year environmental systems programme for students who want field research, public university resources, and access to disability and wellness support.',
    highlights: ['Field research', 'Public university', 'Support services'],
    nextSteps: [
      'Explore fieldwork travel expectations',
      'Review environmental lab requirements',
      'Ask about research assistant opportunities',
    ],
  },
  {
    id: 'harbor-welding',
    name: 'Advanced Welding',
    school: 'Harbor Trade Academy',
    city: 'Norfolk',
    state: 'VA',
    delivery: 'Campus',
    pathway: 'trade-vocational',
    interests: ['trades'],
    support: ['career-counseling', 'financial-aid'],
    annualTuition: 7200,
    acceptanceRate: 100,
    matchScore: 82,
    duration: '12 months',
    credential: 'Trade diploma',
    image: '/images/campuses/applied-learning.png',
    overview:
      'A hands-on welding programme designed for quick workforce entry, with tool support, externship exposure, and practical career placement guidance.',
    highlights: ['Paid externship', 'Union pathways', 'Tool grant'],
    nextSteps: [
      'Ask about safety gear and tool grants',
      'Confirm externship placement timing',
      'Compare certification levels offered',
    ],
  },
  {
    id: 'summit-teacher-apprentice',
    name: 'Teacher Apprentice Residency',
    school: 'Summit Learning Network',
    city: 'Columbus',
    state: 'OH',
    delivery: 'Hybrid',
    pathway: 'apprenticeship',
    interests: ['education', 'social-sciences'],
    support: ['first-gen', 'career-counseling', 'childcare'],
    annualTuition: 2600,
    acceptanceRate: 86,
    matchScore: 79,
    duration: '18 months',
    credential: 'State credential',
    image: '/images/campuses/applied-learning.png',
    overview:
      'An earn-while-learning education pathway for future teachers who want classroom mentorship, hybrid coursework, and support during credential completion.',
    highlights: ['Earn while learning', 'Mentor classroom', 'State credential'],
    nextSteps: [
      'Confirm paid residency hours',
      'Review classroom placement locations',
      'Ask about childcare support availability',
    ],
  },
  {
    id: 'openwest-it-degree',
    name: 'Information Technology Degree',
    school: 'OpenWest Online University',
    city: 'Online',
    state: 'US',
    delivery: 'Online',
    pathway: 'online-degree',
    interests: ['technology', 'business'],
    support: ['language-support', 'tutoring', 'career-counseling'],
    annualTuition: 8400,
    acceptanceRate: 100,
    matchScore: 77,
    duration: '3 years',
    credential: "Bachelor's degree",
    image: '/images/campuses/technology-learning.png',
    overview:
      'A fully online IT degree with self-paced terms, portfolio projects, and remote advising for students who need flexibility without losing career support.',
    highlights: ['Self-paced terms', 'Remote advising', 'Portfolio projects'],
    nextSteps: [
      'Review weekly time expectations',
      'Ask about portfolio review milestones',
      'Compare transfer credit policies',
    ],
  },
  {
    id: 'civic-justice',
    name: 'Civic Justice Studies',
    school: 'Capital City College',
    city: 'Albany',
    state: 'NY',
    delivery: 'Campus',
    pathway: '4-year-university',
    interests: ['law', 'social-sciences'],
    support: ['mental-health', 'first-gen', 'financial-aid'],
    annualTuition: 9800,
    acceptanceRate: 68,
    matchScore: 73,
    duration: '4 years',
    credential: "Bachelor's degree",
    image: '/images/campuses/community-campus.png',
    overview:
      'A civic justice programme for students interested in law, policy, and public service, with writing support and internship networks built into the pathway.',
    highlights: ['Policy clinics', 'Internship network', 'Writing support'],
    nextSteps: [
      'Explore internship partner locations',
      'Review writing-intensive course sequence',
      'Ask about first-generation student advising',
    ],
  },
  {
    id: 'huston-tillotson-undergraduate-pathways',
    name: 'Undergraduate Pathways',
    school: 'Huston-Tillotson University',
    city: 'Austin',
    state: 'TX',
    delivery: 'Campus',
    pathway: '4-year-university',
    interests: ['business', 'education', 'stem', 'technology'],
    support: ['financial-aid'],
    annualTuition: 15981,
    acceptanceRate: 0,
    admissionsFlexibilityLabel: 'Review with admissions',
    matchScore: 89,
    duration: '4 years',
    credential: "Bachelor's degree pathways",
    image: '/images/campuses/scholar-scout-basketball-to-learning.png',
    overview:
      'A campus-based Austin pathway at Huston-Tillotson University, a historically Black university with undergraduate study across liberal arts, STEM, business, education, and technology-related fields. Explore the official degree list and speak with the university before applying.',
    highlights: [
      'Austin HBCU community',
      'Liberal arts and STEM pathways',
      'Official degree catalogue',
    ],
    nextSteps: [
      'Review the official degree programme catalogue',
      'Confirm current tuition, fees, and financial aid with HT',
      'Contact admissions about programme-specific requirements',
    ],
    publicationStatus: 'published',
    sourceName: 'Huston-Tillotson University Academics',
    sourceUrl: 'https://htu.edu/academics/',
    schoolSocialUrl: 'https://www.instagram.com/hustontillotsonuniversity/',
    sourceConfidence: 'verified',
    sourceNotes:
      'HT describes itself as an Austin HBCU offering undergraduate and graduate study; its academics pages include degree programmes, adult and continuing education, and online options. The listed annual tuition and fees are the 2026 financial-clearance estimate of $7,990.28 per semester, multiplied by two; actual charges vary.',
    sourceChecks: ['tuition', 'credential', 'duration', 'delivery', 'next-steps'],
    lastVerifiedAt: '2026-09-16',
  },
  {
    id: 'ibm-skillsbuild-ai',
    name: 'Artificial Intelligence Foundations',
    school: 'IBM SkillsBuild',
    city: 'Online',
    state: 'US',
    delivery: 'Online',
    pathway: 'certificate-program',
    interests: ['technology', 'stem'],
    support: ['career-counseling', 'language-support'],
    annualTuition: 0,
    acceptanceRate: 100,
    matchScore: 86,
    duration: 'Self-paced',
    credential: 'Digital credential pathway',
    image: '/images/campuses/city-to-learning.png',
    overview:
      'A private-sector learning catalogue from IBM SkillsBuild with introductory and advanced AI options, including a documented AI fundamentals credential pathway. Confirm the exact course, availability, and credential requirements directly with IBM.',
    highlights: ['AI learning catalogue', 'Digital credentials', 'Online access'],
    nextSteps: [
      'Review the current AI learning catalogue',
      'Confirm the credential requirements for your chosen path',
      'Compare the time commitment with a college or certificate option',
    ],
    publicationStatus: 'published',
    sourceName: 'IBM SkillsBuild learning catalog',
    sourceUrl: 'https://skillsbuild.org/learning-catalog/university-catalog?topic=ai',
    sourceConfidence: 'verified',
    sourceNotes:
      'Official IBM SkillsBuild catalogue documents AI courses and an Artificial Intelligence Fundamentals credential pathway. Offerings can change.',
    sourceChecks: ['credential', 'duration', 'delivery', 'next-steps'],
    lastVerifiedAt: '2026-09-16',
  },
  {
    id: 'aws-skill-builder-cloud-ai',
    name: 'Cloud and AI Infrastructure Foundations',
    school: 'AWS Skill Builder',
    city: 'Online',
    state: 'US',
    delivery: 'Online',
    pathway: 'certificate-program',
    interests: ['technology', 'stem'],
    support: ['career-counseling', 'tutoring'],
    annualTuition: 0,
    acceptanceRate: 100,
    matchScore: 85,
    duration: 'Self-paced',
    credential: 'Training and microcredential options',
    image: '/images/campuses/city-to-learning.png',
    overview:
      'AWS Skill Builder offers provider-created cloud and AI learning resources, including digital courses, labs, and selected microcredential opportunities. Confirm which learning resources are free, subscription-based, or available in your region before enrolling.',
    highlights: ['Cloud foundations', 'AI learning resources', 'Hands-on labs'],
    nextSteps: [
      'Explore the current cloud and AI learning paths',
      'Confirm the access level and any subscription costs',
      'Compare certification preparation with a broader degree pathway',
    ],
    publicationStatus: 'published',
    sourceName: 'AWS Skill Builder',
    sourceUrl: 'https://aws.amazon.com/training/digital/',
    sourceConfidence: 'verified',
    sourceNotes:
      'Official AWS page documents cloud and AI learning resources, free digital training, labs, and credential-related options. Access and pricing vary by resource.',
    sourceChecks: ['tuition', 'credential', 'duration', 'delivery', 'next-steps'],
    lastVerifiedAt: '2026-09-16',
  },
  {
    id: 'lincoln-tech-skilled-trades',
    name: 'Skilled Trades Technology',
    school: 'Lincoln Tech',
    city: 'Grand Prairie',
    state: 'TX',
    delivery: 'Campus',
    pathway: 'trade-vocational',
    interests: ['trades', 'technology'],
    support: ['career-counseling', 'financial-aid'],
    annualTuition: 31413,
    acceptanceRate: 100,
    matchScore: 81,
    duration: 'Campus-specific',
    credential: 'Career training programme',
    image: '/images/campuses/rural-to-learning.png',
    overview:
      'A private career-training option with campus-specific skilled-trades programmes such as electrical, HVAC, welding, and technology-enabled manufacturing. Confirm the exact programme, total charges, eligibility, and campus availability directly with Lincoln Tech.',
    highlights: ['Electrical and HVAC options', 'Hands-on learning spaces', 'Campus-specific programmes'],
    nextSteps: [
      'Confirm that your preferred trade is offered at the selected campus',
      'Review the full tuition and fee breakdown for your programme',
      'Ask about scheduling, equipment needs, and career services',
    ],
    publicationStatus: 'published',
    sourceName: 'Lincoln Tech Grand Prairie programme directory',
    sourceUrl: 'https://www.lincolntech.edu/campus/grand-prairie-tx/programs',
    sourceConfidence: 'verified',
    sourceNotes:
      'Official campus directory lists electrical, HVAC, and welding among programmes. Tuition shown is the public programme charge for Electrical and Electronic Systems Technology at Grand Prairie in the current provider fee schedule; confirm current charges before applying.',
    sourceChecks: ['tuition', 'credential', 'duration', 'delivery', 'support', 'next-steps'],
    lastVerifiedAt: '2026-09-16',
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
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function paginateProgrammes<T>(items: T[], page: number, pageSize: number) {
  return paginateItems(items, page, pageSize);
}
