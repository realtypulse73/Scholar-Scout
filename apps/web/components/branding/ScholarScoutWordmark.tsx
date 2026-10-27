import { classNames } from '@/lib/class-names';

type ScholarScoutWordmarkSize = 'inline' | 'compact' | 'full' | 'display';
type ScholarScoutWordmarkTone = 'silver' | 'inverse';

interface ScholarScoutWordmarkProps {
  size?: ScholarScoutWordmarkSize;
  tone?: ScholarScoutWordmarkTone;
  className?: string;
}

/** Renders the product name with the shared, accessible Scholar Scout wordmark treatment. */
export default function ScholarScoutWordmark({
  size = 'inline',
  tone = 'silver',
  className,
}: ScholarScoutWordmarkProps) {
  return (
    <span
      className={classNames(
        'brand-wordmark',
        `brand-wordmark--${size}`,
        `brand-wordmark--${tone}`,
        className,
      )}
    >
      Scholar Scout
    </span>
  );
}
