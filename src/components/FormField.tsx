import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface Props {
  label: string;
  htmlFor: string;
  helper?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, htmlFor, helper, error, required, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive" aria-hidden> *</span>}
      </Label>
      {children}
      {helper && !error && <p className="text-xs text-muted-foreground">{helper}</p>}
      {error && (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
