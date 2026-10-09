import { Briefcase } from 'lucide-react';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Briefcase className="h-4 w-4" aria-hidden />
      </span>
      {!compact && (
        <span className="text-sm font-semibold tracking-tight text-foreground">
          ApplyTrack&nbsp;AI
        </span>
      )}
    </span>
  );
}
