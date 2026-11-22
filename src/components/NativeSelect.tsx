import * as React from 'react';
import { cn } from '@/lib/utils';

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn('flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-base disabled:opacity-50 md:text-sm', className)}
      {...props}
    >
      {children}
    </select>
  ),
);
NativeSelect.displayName = 'NativeSelect';
