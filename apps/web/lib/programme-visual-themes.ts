import type { Interest, SupportNeed } from '@/lib/onboarding-types';
import type { Programme, ProgrammePathway } from '@/lib/programmes';

export interface ProgrammeVisualTheme {
  id: string;
  label: string;
  stillUrl: string;
  videoUrl: string;
  paletteClassName: string;
  accentClassName: string;
  studentConcern: string;
  supportSignal: string;
  sceneSummary: string;
}

const sharedVideoUrl =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const supportSignals: Record<SupportNeed, string> = {
  'career-counseling': 'Career guidance and first-step planning are visible.',
  childcare: 'Schedule and care responsibilities stay part of the plan.',
  'disability-services': 'Access planning is treated as a practical support.',
  'financial-aid': 'Cost and aid questions are brought forward early.',
  'first-gen': 'First-generation support is easy to spot and compare.',
  housing: 'Housing and commute stability are included in the fit picture.',
  'language-support': 'Language support is included in the student view.',
  'mental-health': 'Wellbeing support is shown as part of fit.',
  none: 'The path stays focused on practical fit and next steps.',
  tutoring: 'Tutoring and academic help are easy to compare.',
};

const pathwaySignals: Record<ProgrammePathway, string> = {
  apprenticeship: 'earn-while-learning pathway',
  '2-year-community-college': 'lower-cost starting point',
  '4-year-university': 'campus and research pathway',
  'certificate-program': 'short career-focused credential',
  'online-degree': 'flexible online degree route',
  'trade-vocational': 'hands-on workforce training',
};

const themesByInterest: Record<Interest, ProgrammeVisualTheme> = {
  arts: {
    id: 'arts',
    label: 'Creative portfolio studio',
    stillUrl: '/visual-themes/creative-portfolio.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-fuchsia-100 via-white to-amber-100',
    accentClassName: 'bg-fuchsia-500',
    studentConcern: 'Connects portfolio work, feedback, costs, and flexible next steps.',
    supportSignal: 'Creative guidance and academic support are visible without pressure.',
    sceneSummary: 'A portfolio workspace with critique notes, materials, and planning cards.',
  },
  business: {
    id: 'business',
    label: 'Business planning studio',
    stillUrl: '/visual-themes/business-planning.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-amber-100 via-white to-sky-100',
    accentClassName: 'bg-amber-500',
    studentConcern: 'Keeps transfer, budget, and career options easy to compare.',
    supportSignal: 'Advising and financial planning sit close to the next step.',
    sceneSummary: 'A calm planning table with budgets, timelines, and team notes.',
  },
  education: {
    id: 'education',
    label: 'Classroom mentorship',
    stillUrl: '/visual-themes/classroom-mentorship.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-teal-100 via-white to-amber-100',
    accentClassName: 'bg-teal-500',
    studentConcern: 'Shows mentorship, schedule fit, and classroom support up front.',
    supportSignal: 'Mentor access and care responsibilities are treated as practical signals.',
    sceneSummary: 'A guided classroom residency scene with mentor notes and student goals.',
  },
  environment: {
    id: 'environment',
    label: 'Field research day',
    stillUrl: '/visual-themes/field-research.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-emerald-100 via-white to-cyan-100',
    accentClassName: 'bg-emerald-500',
    studentConcern: 'Makes fieldwork expectations, wellness, and lab support visible.',
    supportSignal: 'Access, mental health, and financial aid signals stay near the course details.',
    sceneSummary: 'A field notebook, sample trays, and accessible outdoor research gear.',
  },
  healthcare: {
    id: 'healthcare',
    label: 'Health skills lab',
    stillUrl: '/visual-themes/health-skills-lab.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-rose-100 via-white to-cyan-100',
    accentClassName: 'bg-rose-500',
    studentConcern: 'Highlights clinical practice, prerequisites, and support before applying.',
    supportSignal: 'Tutoring, aid, and career advising are part of the visual story.',
    sceneSummary: 'A bright allied health lab with checklists, practice stations, and peers.',
  },
  law: {
    id: 'law',
    label: 'Civic policy table',
    stillUrl: '/visual-themes/civic-policy.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-indigo-100 via-white to-rose-100',
    accentClassName: 'bg-indigo-500',
    studentConcern: 'Connects writing support, internships, and service goals.',
    supportSignal: 'First-generation and wellbeing support are visible beside civic work.',
    sceneSummary: 'A policy clinic table with annotated briefs and community maps.',
  },
  sports: {
    id: 'sports',
    label: 'Performance and wellness lab',
    stillUrl: '/visual-themes/performance-wellness.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-lime-100 via-white to-sky-100',
    accentClassName: 'bg-lime-500',
    studentConcern: 'Shows training, wellbeing, scheduling, and career pathways together.',
    supportSignal: 'Wellness and advising cues stay close to the student plan.',
    sceneSummary: 'A fitness and wellness lab with progress boards, equipment, and study notes.',
  },
  'social-sciences': {
    id: 'social-sciences',
    label: 'Community research hub',
    stillUrl: '/visual-themes/community-research.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-violet-100 via-white to-teal-100',
    accentClassName: 'bg-violet-500',
    studentConcern: 'Frames research, writing, advising, and community impact together.',
    supportSignal: 'Academic and personal support cues are shown as comparison data.',
    sceneSummary: 'A community research workspace with interview notes and planning boards.',
  },
  stem: {
    id: 'stem',
    label: 'Applied STEM lab',
    stillUrl: '/visual-themes/applied-stem.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-cyan-100 via-white to-lime-100',
    accentClassName: 'bg-cyan-500',
    studentConcern: 'Makes labs, tutoring, and prerequisite expectations feel concrete.',
    supportSignal: 'Academic help and access planning stay close to the technical work.',
    sceneSummary: 'A hands-on lab bench with project boards, tools, and progress checks.',
  },
  technology: {
    id: 'technology',
    label: 'Technology project bay',
    stillUrl: '/visual-themes/technology-project.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-sky-100 via-white to-emerald-100',
    accentClassName: 'bg-sky-500',
    studentConcern: 'Shows project work, flexibility, and job preparation without pressure.',
    supportSignal: 'Remote advising, tutoring, and career services are part of the path.',
    sceneSummary: 'A focused project desk with dashboards, task cards, and certification notes.',
  },
  trades: {
    id: 'trades',
    label: 'Workshop practice',
    stillUrl: '/visual-themes/workshop-practice.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-orange-100 via-white to-slate-100',
    accentClassName: 'bg-orange-500',
    studentConcern: 'Brings safety gear, tool costs, and externship timing forward.',
    supportSignal: 'Career placement and aid signals are paired with hands-on practice.',
    sceneSummary: 'A clean workshop bay with safety gear, practice materials, and tool grants.',
  },
  undecided: {
    id: 'undecided',
    label: 'Exploration map',
    stillUrl: '/visual-themes/exploration-map.svg',
    videoUrl: sharedVideoUrl,
    paletteClassName: 'from-slate-100 via-white to-emerald-100',
    accentClassName: 'bg-slate-500',
    studentConcern: 'Keeps options open while making cost, support, and timing comparable.',
    supportSignal: 'Guidance is framed around next useful actions, not pressure to decide.',
    sceneSummary: 'A comparison map with pathway cards, cost markers, and support notes.',
  },
};

export function getProgrammeVisualTheme(
  programme: Pick<Programme, 'interests' | 'pathway' | 'support'>,
) {
  const primaryInterest = programme.interests[0] ?? 'stem';
  const theme = themesByInterest[primaryInterest] ?? themesByInterest.stem;
  const primarySupport = programme.support[0];

  return {
    ...theme,
    supportSignal: primarySupport
      ? supportSignals[primarySupport]
      : theme.supportSignal,
    pathwaySignal: pathwaySignals[programme.pathway],
  };
}

export function getProgrammeVisualAltText(
  programme: Pick<Programme, 'name' | 'interests' | 'pathway' | 'support'>,
) {
  const theme = getProgrammeVisualTheme(programme);

  return `${programme.name} visual theme: ${theme.sceneSummary}`;
}
