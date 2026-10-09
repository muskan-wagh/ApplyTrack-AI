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
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-2 text-[15px] font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{hint}</p>
      {actionLabel && onAction && (
        <Button className="mt-3" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
