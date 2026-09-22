import type { InputHTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  isInvalid?: boolean;
}

export default function Input({
  className,
  isInvalid = false,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  return (
    <input
      className={classNames(
        'min-h-touch w-full rounded-card border bg-white px-3 text-sm text-ink-900 shadow-sm transition-colors placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
        isInvalid
          ? 'border-danger-600'
          : 'border-border hover:border-brand-300',
        className,
      )}
      {...props}
      aria-invalid={isInvalid || ariaInvalid}
    />
  );
}
