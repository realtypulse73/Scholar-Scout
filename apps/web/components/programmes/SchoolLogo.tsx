import { classNames } from '@/lib/class-names';
import {
  getSchoolBrand,
  getSchoolLogoAltText,
} from '@/lib/school-branding';
import type { Programme } from '@/lib/programmes';

interface SchoolLogoProps {
  programme: Pick<Programme, 'school'>;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClassNames = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export default function SchoolLogo({
  programme,
  size = 'md',
}: SchoolLogoProps) {
  const brand = getSchoolBrand(programme);

  return (
    <span
      className={classNames(
        'inline-flex shrink-0 items-center justify-center rounded-card ring-1',
        sizeClassNames[size],
        brand.themeClassName,
      )}
    >
      <img
        src={brand.logoUrl}
        alt={getSchoolLogoAltText(programme)}
        className="h-full w-full object-contain p-1"
      />
    </span>
  );
}
