import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TONE_CHIP: Record<string, string> = {
  default: 'bg-muted text-muted-foreground',
  plum: 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  danger: 'bg-error text-error-foreground',
  info: 'bg-info text-info-foreground',
};

const TONE_BAR: Record<string, string> = {
  default: 'bg-muted-foreground/40',
  plum: 'bg-primary',
  success: 'bg-success-solid',
  warning: 'bg-warning-foreground',
  danger: 'bg-destructive',
  info: 'bg-info-foreground',
};

/** Editorial metric: icon + label up top, oversized mono value, tone rule. */
export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint?: string;
  tone?: keyof typeof TONE_CHIP | string;
}) {
  return (
    <Card className="card-interactive overflow-hidden">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              TONE_CHIP[tone] ?? TONE_CHIP.default
            )}
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </span>
          <p className="min-w-0 truncate text-[13px] font-medium text-muted-foreground">{label}</p>
        </div>
        <p className="metric-value mt-3 text-4xl font-semibold leading-none tracking-tight text-foreground">
          {value}
        </p>
        {hint && (
          <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground">{hint}</p>
        )}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className={cn('h-full w-2/3 rounded-full', TONE_BAR[tone] ?? TONE_BAR.default)} />
        </div>
      </CardContent>
    </Card>
  );
}
