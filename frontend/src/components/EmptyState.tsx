import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Consistent empty state: icon, short heading, one line of guidance, one action. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      </span>
      <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
      {actionLabel && onAction && (
        <Button className="mt-2" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
