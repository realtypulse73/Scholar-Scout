import type { Programme } from '@/lib/programmes';

export interface SchoolBrand {
  school: string;
  logoUrl: string;
  shortName: string;
  themeClassName: string;
}

const schoolBrands: Record<string, SchoolBrand> = {
  'North Valley College': {
    school: 'North Valley College',
    logoUrl: '/school-logos/north-valley-college.svg',
    shortName: 'NVC',
    themeClassName: 'bg-rose-50 text-rose-800 ring-rose-200',
  },
  'Metro Technical Institute': {
    school: 'Metro Technical Institute',
    logoUrl: '/school-logos/metro-technical-institute.svg',
    shortName: 'MTI',
    themeClassName: 'bg-sky-50 text-sky-800 ring-sky-200',
  },
  'Lakeside Community College': {
    school: 'Lakeside Community College',
    logoUrl: '/school-logos/lakeside-community-college.svg',
    shortName: 'LCC',
    themeClassName: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  'Evergreen State University': {
    school: 'Evergreen State University',
    logoUrl: '/school-logos/evergreen-state-university.svg',
    shortName: 'ESU',
    themeClassName: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
  'Harbor Trade Academy': {
    school: 'Harbor Trade Academy',
    logoUrl: '/school-logos/harbor-trade-academy.svg',
    shortName: 'HTA',
    themeClassName: 'bg-orange-50 text-orange-800 ring-orange-200',
  },
  'Summit Learning Network': {
    school: 'Summit Learning Network',
    logoUrl: '/school-logos/summit-learning-network.svg',
    shortName: 'SLN',
    themeClassName: 'bg-teal-50 text-teal-800 ring-teal-200',
  },
  'OpenWest Online University': {
    school: 'OpenWest Online University',
    logoUrl: '/school-logos/openwest-online-university.svg',
    shortName: 'OOU',
    themeClassName: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  },
  'Capital City College': {
    school: 'Capital City College',
    logoUrl: '/school-logos/capital-city-college.svg',
    shortName: 'CCC',
    themeClassName: 'bg-violet-50 text-violet-800 ring-violet-200',
  },
};

export function getSchoolBrand(
  programme: Pick<Programme, 'school'>,
): SchoolBrand {
  return (
    schoolBrands[programme.school] ?? {
      school: programme.school,
      logoUrl: '/school-logos/scholarscout-school.svg',
      shortName: programme.school
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 3)
        .toUpperCase(),
      themeClassName: 'bg-ink-50 text-ink-800 ring-ink-200',
    }
  );
}

export function getSchoolLogoAltText(programme: Pick<Programme, 'school'>) {
  return `${programme.school} logo`;
}
