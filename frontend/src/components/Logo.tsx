import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ compact = false, tone = 'default' }: { compact?: boolean; tone?: 'default' | 'inverse' }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Briefcase className="h-4 w-4" aria-hidden />
      </span>
      {!compact && (
        <span
          className={cn(
            'text-sm font-semibold tracking-tight',
            tone === 'inverse' ? 'text-[#f7f1e3]' : 'text-foreground'
          )}
        >
          ApplyTrack&nbsp;AI
        </span>
      )}
    </span>
  );
}
