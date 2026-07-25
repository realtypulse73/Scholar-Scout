export type TestPolicy =
  | 'test-free'
  | 'test-optional'
  | 'not-required'
  | 'verify-with-school';

export type EvidenceStatus = 'verified' | 'review-before-applying';

export interface CampusSource {
  label: string;
  url: string;
  status: EvidenceStatus;
}

export interface WesternNewYorkInstitution {
  id: string;
  name: string;
  city: string;
  kind: 'university' | 'college' | 'community-college' | 'workforce-training';
  officialUrl: string;
  mediaUrl: string;
  admissions: {
    testPolicy: TestPolicy;
    gpaGuidance: string;
    admissionsUrl: string;
  };
  logistics: {
    publicTransit: 'verified-access' | 'route-review-needed';
    childcare: 'discuss-with-school' | 'support-or-referral-documented';
    note: string;
  };
  accountability: {
    notice: string;
    sources: CampusSource[];
  };
  sourceCheckedOn: string;
}

export interface WesternNewYorkStudentContext {
  hasChildren: boolean;
  transportation: 'public-transit' | 'car-or-ride' | 'remote-or-flexible' | 'unsure';
  testStatus: 'taken' | 'not-taken' | 'not-sure';
  gpaStatus: 'provided' | 'not-provided' | 'not-sure';
}

export interface RankedWesternNewYorkInstitution {
  institution: WesternNewYorkInstitution;
  accessScore: number;
  reasons: string[];
  reviewItems: string[];
}

export const WESTERN_NEW_YORK_INSTITUTIONS: WesternNewYorkInstitution[] = [
  {
    id: 'university-at-buffalo',
    name: 'University at Buffalo',
    city: 'Buffalo / Amherst',
    kind: 'university',
    officialUrl: 'https://www.buffalo.edu/',
    mediaUrl: 'https://www.buffalo.edu/admissions/visit.html',
    admissions: {
      testPolicy: 'test-optional',
      gpaGuidance: 'An official final transcript is required after enrollment; ask admissions how your current academic record will be reviewed.',
      admissionsUrl: 'https://admissions.buffalo.edu/apply/applyingfaq.php',
    },
    logistics: {
      publicTransit: 'route-review-needed',
      childcare: 'discuss-with-school',
      note: 'Review the campus, program schedule, and transit route that match your specific class location.',
    },
    accountability: {
      notice: 'Use the annual security report and Title IX resources to review reporting options, campus crime disclosures, and support procedures. These sources are not a campus-safety rating.',
      sources: [
        { label: 'Annual security report', url: 'https://www.buffalo.edu/police/reporting/see-a-report/annual-report.html', status: 'verified' },
        { label: 'Admissions and test-optional FAQ', url: 'https://admissions.buffalo.edu/apply/applyingfaq.php', status: 'verified' },
      ],
    },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'buffalo-state',
    name: 'SUNY Buffalo State University',
    city: 'Buffalo',
    kind: 'university',
    officialUrl: 'https://suny.buffalostate.edu/',
    mediaUrl: 'https://suny.buffalostate.edu/visit',
    admissions: {
      testPolicy: 'test-optional',
      gpaGuidance: 'Admissions publishes a holistic-review path; ask about program-specific prerequisites and Educational Opportunity Program eligibility.',
      admissionsUrl: 'https://suny.buffalostate.edu/admissions/firstyearapply',
    },
    logistics: {
      publicTransit: 'route-review-needed',
      childcare: 'discuss-with-school',
      note: 'Confirm the travel plan for the Elmwood Avenue campus and the timing of required in-person courses.',
    },
    accountability: {
      notice: 'Review Title IX, nondiscrimination, and Annual Security Report materials before making a campus-environment decision.',
      sources: [
        { label: 'Annual security and fire safety report', url: 'https://police.buffalostate.edu/sites/police/files/documents/2526_asr.pdf', status: 'verified' },
        { label: 'Nondiscrimination notice', url: 'https://catalog.buffalostate.edu/about/nondiscrimination', status: 'verified' },
      ],
    },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'canisius',
    name: 'Canisius University',
    city: 'Buffalo',
    kind: 'university',
    officialUrl: 'https://www.canisius.edu/',
    mediaUrl: 'https://www.canisius.edu/admissions/visit',
    admissions: {
      testPolicy: 'test-free',
      gpaGuidance: 'The application asks for an official high-school transcript; ask admissions how your complete record will be reviewed.',
      admissionsUrl: 'https://www.canisius.edu/admissions/undergraduate-admissions/test-free-canisius',
    },
    logistics: { publicTransit: 'route-review-needed', childcare: 'discuss-with-school', note: 'Confirm commute, parking, and the schedule of the specific program.' },
    accountability: {
      notice: 'Review community standards, Title IX reporting, and the published Clery report directly; ScholarScout does not infer a safety score from their existence.',
      sources: [
        { label: 'Test-free admissions policy', url: 'https://www.canisius.edu/admissions/undergraduate-admissions/test-free-canisius', status: 'verified' },
        { label: 'Community standards, Title IX, and Clery links', url: 'https://www.canisius.edu/student-experience/student-support-services/community-standards-policies', status: 'verified' },
      ],
    },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'dyouville',
    name: "D'Youville University",
    city: 'Buffalo',
    kind: 'university',
    officialUrl: 'https://www.dyu.edu/',
    mediaUrl: 'https://www.dyu.edu/admissions/visit',
    admissions: { testPolicy: 'test-optional', gpaGuidance: 'Ask admissions about transcript and program-specific review requirements.', admissionsUrl: 'https://www.dyu.edu/admissions/first-time-college-admissions' },
    logistics: { publicTransit: 'route-review-needed', childcare: 'discuss-with-school', note: 'Confirm the Porter Avenue commute and any program-specific clinical or lab travel.' },
    accountability: { notice: 'Review the published security report and reporting procedures for a source-backed campus-environment review.', sources: [{ label: 'Security report and reporting policies', url: 'https://www.dyu.edu/campus-life/support-services/campus-safety/policies-reporting', status: 'verified' }] },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'suny-erie',
    name: 'SUNY Erie Community College',
    city: 'Buffalo / Williamsville / Orchard Park',
    kind: 'community-college',
    officialUrl: 'https://www.sunyerie.edu/',
    mediaUrl: 'https://www.sunyerie.edu/visit/',
    admissions: { testPolicy: 'verify-with-school', gpaGuidance: 'Ask admissions about placement, transcripts, GED/TASC pathways, and program prerequisites.', admissionsUrl: 'https://www.sunyerie.edu/admissions/' },
    logistics: { publicTransit: 'route-review-needed', childcare: 'discuss-with-school', note: 'Choose the campus first, then verify transit and course meeting times.' },
    accountability: { notice: 'Review current Title IX, campus-safety, and student-support pages before applying.', sources: [{ label: 'Official admissions hub', url: 'https://www.sunyerie.edu/admissions/', status: 'review-before-applying' }] },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'trocaire',
    name: 'Trocaire College',
    city: 'Buffalo / Lancaster',
    kind: 'college',
    officialUrl: 'https://trocaire.edu/',
    mediaUrl: 'https://trocaire.edu/visit/',
    admissions: { testPolicy: 'verify-with-school', gpaGuidance: 'Confirm admissions requirements for the exact health, technology, or transfer program.', admissionsUrl: 'https://trocaire.edu/admissions/' },
    logistics: { publicTransit: 'route-review-needed', childcare: 'discuss-with-school', note: 'Review the campus location and clinical, lab, or practicum travel requirements.' },
    accountability: { notice: 'Review the college’s current safety, Title IX, and accessibility materials directly.', sources: [{ label: 'Official admissions hub', url: 'https://trocaire.edu/admissions/', status: 'review-before-applying' }] },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'villa-maria',
    name: 'Villa Maria College',
    city: 'Buffalo',
    kind: 'college',
    officialUrl: 'https://www.villa.edu/',
    mediaUrl: 'https://www.villa.edu/visit/',
    admissions: { testPolicy: 'not-required', gpaGuidance: 'Official transcript, GED, or TASC documentation is listed; ask about individual exception and program requirements.', admissionsUrl: 'https://www.villa.edu/wp-content/uploads/2024/10/VMC_Catalog_2024-2025_LastUpdated10.9.24.pdf' },
    logistics: { publicTransit: 'route-review-needed', childcare: 'discuss-with-school', note: 'Confirm the Main Street campus trip and any studio, lab, or clinical schedule.' },
    accountability: { notice: 'Review the Annual Security Report and Title IX reporting information; the presence of policy documents is not a safety conclusion.', sources: [{ label: 'Annual campus security report', url: 'https://www.villa.edu/wp-content/uploads/2025/09/VMC-Annual-Security-Report-for-2024.pdf', status: 'verified' }] },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'bryant-stratton',
    name: 'Bryant & Stratton College',
    city: 'Buffalo / Amherst / Orchard Park',
    kind: 'college',
    officialUrl: 'https://www.bryantstratton.edu/',
    mediaUrl: 'https://www.bryantstratton.edu/campus-locations/new-york/buffalo.html',
    admissions: { testPolicy: 'verify-with-school', gpaGuidance: 'Verify program-specific admission and placement requirements with the campus.', admissionsUrl: 'https://www.bryantstratton.edu/admissions/' },
    logistics: { publicTransit: 'route-review-needed', childcare: 'discuss-with-school', note: 'Compare the delivery format and campus location for the program you want.' },
    accountability: { notice: 'Review current campus consumer, Title IX, and safety disclosures directly before enrolling.', sources: [{ label: 'Official admissions hub', url: 'https://www.bryantstratton.edu/admissions/', status: 'review-before-applying' }] },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'daemen',
    name: 'Daemen University',
    city: 'Amherst',
    kind: 'university',
    officialUrl: 'https://www.daemen.edu/',
    mediaUrl: 'https://www.daemen.edu/admissions/visit',
    admissions: { testPolicy: 'verify-with-school', gpaGuidance: 'Ask admissions about the academic record and prerequisite review for your program.', admissionsUrl: 'https://www.daemen.edu/admissions' },
    logistics: { publicTransit: 'route-review-needed', childcare: 'discuss-with-school', note: 'Confirm the Amherst commute, parking, and required in-person schedule.' },
    accountability: { notice: 'Review current equity, Title IX, accessibility, and campus safety disclosures directly.', sources: [{ label: 'Official admissions hub', url: 'https://www.daemen.edu/admissions', status: 'review-before-applying' }] },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'hilbert',
    name: 'Hilbert College',
    city: 'Hamburg',
    kind: 'college',
    officialUrl: 'https://www.hilbert.edu/',
    mediaUrl: 'https://www.hilbert.edu/admissions/visit-campus/',
    admissions: { testPolicy: 'verify-with-school', gpaGuidance: 'Ask admissions about transcript, test, and program-preparation requirements.', admissionsUrl: 'https://www.hilbert.edu/admissions/' },
    logistics: { publicTransit: 'route-review-needed', childcare: 'discuss-with-school', note: 'Confirm the Hamburg commute and schedule before treating it as an access match.' },
    accountability: { notice: 'Review current Title IX, safety, and accessibility disclosures directly.', sources: [{ label: 'Official admissions hub', url: 'https://www.hilbert.edu/admissions/', status: 'review-before-applying' }] },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'niagara',
    name: 'Niagara University',
    city: 'Lewiston',
    kind: 'university',
    officialUrl: 'https://www.niagara.edu/',
    mediaUrl: 'https://www.niagara.edu/visit/',
    admissions: { testPolicy: 'verify-with-school', gpaGuidance: 'Ask admissions how your transcript, GPA, and program preparation will be evaluated.', admissionsUrl: 'https://www.niagara.edu/admissions/' },
    logistics: { publicTransit: 'route-review-needed', childcare: 'discuss-with-school', note: 'Confirm regional transport and the time required for the Lewiston campus trip.' },
    accountability: { notice: 'Review current safety, Title IX, and accessibility disclosures directly.', sources: [{ label: 'Official admissions hub', url: 'https://www.niagara.edu/admissions/', status: 'review-before-applying' }] },
    sourceCheckedOn: '2026-07-25',
  },
  {
    id: 'northland-workforce-training',
    name: 'Northland Workforce Training Center',
    city: 'Buffalo',
    kind: 'workforce-training',
    officialUrl: 'https://northlandwtc.org/',
    mediaUrl: 'https://northlandwtc.org/',
    admissions: { testPolicy: 'not-required', gpaGuidance: 'Training is workforce-focused; attend a pre-enrollment session to confirm eligibility, program availability, and any partner-school requirements.', admissionsUrl: 'https://northlandwtc.org/about/faq/' },
    logistics: { publicTransit: 'verified-access', childcare: 'support-or-referral-documented', note: 'Northland documents public-transit access, free parking, transportation assistance, and support navigation; confirm availability for your cohort.' },
    accountability: { notice: 'Use the program’s FAQ and support materials to confirm current services and reporting contacts. It is not a substitute for an institution-specific security report.', sources: [{ label: 'Official FAQ: access and support', url: 'https://northlandwtc.org/about/faq/', status: 'verified' }, { label: 'Official approach and wraparound supports', url: 'https://northlandwtc.org/about/', status: 'verified' }] },
    sourceCheckedOn: '2026-07-25',
  },
];

export const DEFAULT_WNY_CONTEXT: WesternNewYorkStudentContext = {
  hasChildren: false,
  transportation: 'unsure',
  testStatus: 'not-sure',
  gpaStatus: 'not-sure',
};

export function rankWesternNewYorkInstitutions(
  institutions: WesternNewYorkInstitution[],
  context: WesternNewYorkStudentContext,
): RankedWesternNewYorkInstitution[] {
  return institutions
    .map((institution) => {
      let accessScore = 0;
      const reasons: string[] = [];
      const reviewItems = [institution.logistics.note];

      if (context.testStatus === 'not-taken') {
        if (institution.admissions.testPolicy === 'test-free') {
          accessScore += 12;
          reasons.push('Does not consider SAT/ACT scores for admission or merit decisions.');
        } else if (institution.admissions.testPolicy === 'test-optional' || institution.admissions.testPolicy === 'not-required') {
          accessScore += 9;
          reasons.push('Publishes a path that does not require standardized test scores.');
        } else {
          reviewItems.push('Confirm the current testing policy before applying.');
        }
      }

      if (context.gpaStatus === 'not-provided') {
        accessScore += 4;
        reasons.push('Includes a source-linked path to ask about holistic, alternative, or program-specific academic review.');
        reviewItems.push('A missing GPA is never treated as admission eligibility; confirm transcript and placement requirements.');
      }

      if (context.transportation === 'public-transit') {
        if (institution.logistics.publicTransit === 'verified-access') {
          accessScore += 12;
          reasons.push('Publishes public-transit access or transportation assistance.');
        } else {
          reviewItems.push('Build a door-to-door transit plan for the specific campus and class time.');
        }
      }

      if (context.hasChildren) {
        if (institution.logistics.childcare === 'support-or-referral-documented') {
          accessScore += 10;
          reasons.push('Documents support navigation that includes childcare or related barriers.');
        } else {
          reviewItems.push('Ask about on-campus childcare, referrals, evening schedules, absences, and emergency flexibility.');
        }
      }

      return { institution, accessScore, reasons, reviewItems };
    })
    .sort((left, right) => right.accessScore - left.accessScore || left.institution.name.localeCompare(right.institution.name));
}

export function labelTestPolicy(policy: TestPolicy) {
  return {
    'test-free': 'Test-free',
    'test-optional': 'Test-optional',
    'not-required': 'Scores not required',
    'verify-with-school': 'Confirm with school',
  }[policy];
}
