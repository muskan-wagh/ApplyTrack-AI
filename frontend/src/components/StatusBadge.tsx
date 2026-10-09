import type { ApplicationStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STYLE: Record<ApplicationStatus, { pill: string; dot: string }> = {
  // Restrained tints + solid dots. Green appears only for offer/hired.
  applied: { pill: 'bg-secondary text-secondary-foreground', dot: 'bg-muted-foreground' },
  screening: { pill: 'bg-info text-info-foreground', dot: 'bg-info-foreground' },
  interview: { pill: 'bg-warning text-warning-foreground', dot: 'bg-warning-foreground' },
  offer: { pill: 'bg-success text-success-foreground', dot: 'bg-success-solid' },
  hired: { pill: 'bg-success text-success-foreground', dot: 'bg-success-solid' },
  rejected: { pill: 'bg-error text-error-foreground', dot: 'bg-destructive' },
  withdrawn: { pill: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground/60' },
};

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const s = STYLE[status] ?? STYLE.applied;
  return (
    <Badge
      variant="secondary"
      size="sm"
      className={cn(
        'gap-1.5 border font-mono text-[11px] font-medium uppercase tracking-wide',
        s.pill,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />
      {label}
    </Badge>
  );
}
