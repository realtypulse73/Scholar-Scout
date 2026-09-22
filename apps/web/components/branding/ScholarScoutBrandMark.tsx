import { classNames } from '@/lib/class-names';

interface ScholarScoutBrandMarkProps {
  size?: 'compact' | 'full';
  className?: string;
}

export default function ScholarScoutBrandMark({
  size = 'full',
  className,
}: ScholarScoutBrandMarkProps) {
  return (
    <span className={classNames('inline-flex min-h-touch items-center gap-2 font-semibold text-ink-900', className)}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 32 32" className={size === 'compact' ? 'h-7 w-7' : 'h-8 w-8'}>
        <path d="M4 8h10l2 3 2-3h10v16H18l-2 3-2-3H4z" fill="currentColor" className="text-brand-600" />
        <path d="M8 12h7v9H8zm9 0h7v9h-7z" fill="white" />
        <path d="M10 19c4-5 8-5 12-10" fill="none" stroke="#D7DEE6" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className={size === 'compact' ? 'text-base' : 'text-lg'}>Scholar Scout</span>
    </span>
  );
}
