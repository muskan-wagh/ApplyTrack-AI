import type { ApplicationStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const VARIANT: Record<
  ApplicationStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info' | 'error'
> = {
  applied: 'secondary',
  screening: 'info',
  interview: 'warning',
  offer: 'success',
  hired: 'success',
  rejected: 'destructive',
  withdrawn: 'outline',
};

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge
      variant={VARIANT[status] ?? 'secondary'}
      size="sm"
      className={cn('font-mono text-[11px] font-medium uppercase tracking-wide', className)}
    >
      {label}
    </Badge>
  );
}
