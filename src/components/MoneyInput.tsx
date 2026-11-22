import * as React from 'react';
import { Input } from '@/components/ui/input';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string;
  onValueChange: (value: string) => void;
}

/** Rupee amount field. Holds text; convert with rupeesToPaise() on submit. */
export function MoneyInput({ value, onValueChange, ...props }: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden>₹</span>
      <Input
        {...props}
        inputMode="decimal"
        autoComplete="off"
        className="pl-7"
        value={value}
        onChange={(e) => onValueChange(e.target.value.replace(/[^0-9.]/g, ''))}
      />
    </div>
  );
}
