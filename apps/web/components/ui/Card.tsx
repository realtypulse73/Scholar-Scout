import type { HTMLAttributes } from 'react';
import { classNames } from '@/lib/class-names';

export default function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={classNames(
        'rounded-card border border-border bg-white shadow-panel',
        className,
      )}
      {...props}
    />
  );
}
