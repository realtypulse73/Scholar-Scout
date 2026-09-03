export const ROLE_LANGUAGE = {
  student: {
    exploration: 'Explore pathways and decide what to verify next.',
    profile: 'Your pathway profile helps tailor options; it is not an admissions decision.',
  },
  advisor: {
    guidance: 'Advisor guidance supports your next step and does not make admissions decisions.',
  },
  institution: {
    verification: 'Use official institution sources to confirm requirements, costs, deadlines, and current policies.',
  },
  staff: {
    stewardship: 'Authorized staff maintain governed programme information and moderation decisions.',
  },
} as const;

export type RoleLanguageRole = keyof typeof ROLE_LANGUAGE;
