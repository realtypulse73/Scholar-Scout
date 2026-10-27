import { classNames } from '@/lib/class-names';

type ScholarScoutWordmarkSize = 'inline' | 'compact' | 'full' | 'display';
type ScholarScoutWordmarkTone = 'metallic' | 'metallic-inverse';

interface ScholarScoutWordmarkProps {
  size?: ScholarScoutWordmarkSize;
  tone?: ScholarScoutWordmarkTone;
  className?: string;
}

/** Renders the product name with the shared, accessible Scholar Scout wordmark treatment. */
export default function ScholarScoutWordmark({
  size = 'inline',
  tone = 'metallic',
  className,
}: ScholarScoutWordmarkProps) {
  return (
    <span
      aria-label="Scholar Scout"
      className={classNames(
        'brand-wordmark',
        `brand-wordmark--${size}`,
        `brand-wordmark--${tone}`,
        className,
      )}
    >
      SCHOLAR SCOUT
    </span>
  );
}
