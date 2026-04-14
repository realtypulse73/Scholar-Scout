import { Opportunity } from './types'

export const opportunities: Opportunity[] = [
  {
    id: 'college-1',
    name: 'Community College IT Program',
    pathway: 'college',
    locationType: 'near_home',
    interests: ['Technology', 'Engineering'],
    support: ['tutoring', 'financial aid'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Affordable local IT pathway with transfer options and strong academic support.'
  },
  {
    id: 'college-2',
    name: 'State University Business Pathway',
    pathway: 'college',
    locationType: 'in_state',
    interests: ['Business', 'Law'],
    support: ['mentorship', 'financial aid'],
    lowCost: false,
    minGpaBand: '2_2_5',
    description: 'Business-focused four-year pathway with advising and internship support.'
  },
  {
    id: 'college-3',
    name: 'Urban Education Transfer Track',
    pathway: 'college',
    locationType: 'near_home',
    interests: ['Education', 'Arts'],
    support: ['tutoring', 'mentorship', 'flex schedule'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Flexible education pathway for students interested in teaching and youth development.'
  },
  {
    id: 'trade-1',
    name: 'Electrical Apprenticeship',
    pathway: 'apprenticeship',
    locationType: 'in_state',
    interests: ['Trades', 'Engineering'],
    support: ['mentorship', 'job placement'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Hands-on paid training pathway into electrical work and union careers.'
  },
  {
    id: 'trade-2',
    name: 'Advanced Manufacturing Certificate',
    pathway: 'certificate',
    locationType: 'near_home',
    interests: ['Trades', 'Technology', 'Engineering'],
    support: ['job placement', 'financial aid'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Short-term manufacturing training with job placement support.'
  },
  {
    id: 'trade-3',
    name: 'Construction Skills Pre-Apprenticeship',
    pathway: 'trade',
    locationType: 'near_home',
    interests: ['Trades'],
    support: ['mentorship', 'job placement', 'flex schedule'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Entry pathway into construction and skilled labor opportunities.'
  },
  {
    id: 'health-1',
    name: 'Practical Nursing Certificate',
    pathway: 'certificate',
    locationType: 'in_state',
    interests: ['Healthcare'],
    support: ['tutoring', 'financial aid'],
    lowCost: false,
    minGpaBand: '2_2_5',
    description: 'Career-focused healthcare credential with licensing preparation.'
  },
  {
    id: 'health-2',
    name: 'Medical Assistant Career Program',
    pathway: 'certificate',
    locationType: 'near_home',
    interests: ['Healthcare'],
    support: ['tutoring', 'job placement'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Short-term allied health training designed for fast workforce entry.'
  },
  {
    id: 'creative-1',
    name: 'Online UX Design Certificate',
    pathway: 'certificate',
    locationType: 'online',
    interests: ['Arts', 'Technology'],
    support: ['tutoring', 'flex schedule'],
    lowCost: false,
    minGpaBand: '2_2_5',
    description: 'Remote design-focused certificate for digital product and UX careers.'
  },
  {
    id: 'creative-2',
    name: 'Digital Media Bootcamp',
    pathway: 'certificate',
    locationType: 'online',
    interests: ['Arts', 'Technology', 'Business'],
    support: ['mentorship', 'flex schedule'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Project-based digital media training with portfolio development.'
  },
  {
    id: 'law-1',
    name: 'Paralegal Studies Program',
    pathway: 'college',
    locationType: 'in_state',
    interests: ['Law', 'Business'],
    support: ['tutoring', 'mentorship'],
    lowCost: false,
    minGpaBand: '2_2_5',
    description: 'Legal studies pathway with practical office and court-support training.'
  },
  {
    id: 'military-1',
    name: 'Military Career Readiness Track',
    pathway: 'military',
    locationType: 'anywhere',
    interests: ['Engineering', 'Healthcare', 'Technology'],
    support: ['mentorship', 'job placement', 'financial aid'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Service-oriented pathway with training, career structure, and education benefits.'
  },
  {
    id: 'online-1',
    name: 'Remote Customer Support Certificate',
    pathway: 'certificate',
    locationType: 'online',
    interests: ['Business', 'Technology'],
    support: ['flex schedule', 'job placement'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Remote-ready certificate for students seeking flexible work options.'
  },
  {
    id: 'online-2',
    name: 'Cybersecurity Foundations Program',
    pathway: 'certificate',
    locationType: 'online',
    interests: ['Technology', 'Engineering'],
    support: ['tutoring', 'mentorship'],
    lowCost: false,
    minGpaBand: '2_5_3',
    description: 'Entry-level cyber training pathway for students pursuing secure tech careers.'
  },
  {
    id: 'business-1',
    name: 'Entrepreneurship Launch Program',
    pathway: 'certificate',
    locationType: 'near_home',
    interests: ['Business', 'Arts'],
    support: ['mentorship', 'flex schedule'],
    lowCost: true,
    minGpaBand: 'below_2',
    description: 'Small-business and startup fundamentals with coaching and flexible delivery.'
  }
]
