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

/** Balanced metric card: icon chip, mono value, small supporting label. Real values only. */
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
    <Card className="card-interactive">
      <CardContent className="flex items-start justify-between gap-3 pt-5">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="metric-value mt-1.5 text-[28px] font-semibold leading-none text-foreground">
            {value}
          </p>
          {hint && (
            <p className="mt-2 font-mono text-[11px] leading-tight text-muted-foreground">{hint}</p>
          )}
        </div>
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
            TONE_CHIP[tone] ?? TONE_CHIP.default
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );
}
