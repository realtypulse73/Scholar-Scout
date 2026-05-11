import type { ButtonHTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 border-brand-600',
  secondary:
    'bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700 border-ink-200',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100 border-transparent',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 border-danger-600',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3 text-sm',
  md: 'min-h-touch px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

export default function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames(
        'inline-flex items-center justify-center gap-2 rounded-card border font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
