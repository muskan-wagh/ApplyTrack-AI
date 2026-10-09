import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Inbox } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { ApplicationStatus } from '@/types';

const DISTRIBUTION_ORDER: ApplicationStatus[] = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
];

const BAR_CLASS: Record<ApplicationStatus, string> = {
  applied: 'bg-info',
  screening: 'bg-info',
  interview: 'bg-warning',
  offer: 'bg-success',
  hired: 'bg-success',
  rejected: 'bg-destructive',
  withdrawn: 'bg-muted-foreground/40',
};

function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="space-y-2 pt-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function OverviewPage() {
  const navigate = useNavigate();
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.getStats });
  const recent = useQuery({
    queryKey: ['applications', 'recent'],
    queryFn: () => api.listApplications({ limit: 5 }),
    enabled: !stats.isPending && !stats.isError && (stats.data?.total ?? 0) > 0,
  });

  if (stats.isPending) return <StatsSkeleton />;

  if (stats.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Couldn’t load statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {(stats.error as Error)?.message ?? 'Backend unreachable.'} Start the backend and
            check <code className="font-mono text-xs">VITE_API_URL</code>.
          </p>
          <Button variant="outline" size="sm" onClick={() => stats.refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const s = stats.data;
  const inProcess = s.applied + s.screening + s.interview;
  const cards = [
    { label: 'Total applications', value: s.total },
    { label: 'In process', value: inProcess, hint: 'Applied · Screening · Interview' },
    { label: 'Offers', value: s.offers, hint: 'Offer · Hired' },
    { label: 'Rejected', value: s.rejected },
  ];

  if (s.total === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No applications yet"
        hint="Add your first application to start tracking stages, interviews, and offers."
        actionLabel="Go to applications"
        onAction={() => navigate('/app/applications')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-5">
              <p className="text-[13px] text-muted-foreground">{c.label}</p>
              <p className="mt-1 font-mono text-[28px] font-semibold leading-none text-foreground">
                {c.value}
              </p>
              {c.hint && <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">{c.hint}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Pipeline distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Status distribution across ${s.total} applications`}
            >
              {DISTRIBUTION_ORDER.filter((k) => (s.byStatus[k] ?? 0) > 0).map((k) => (
                <span
                  key={k}
                  className={BAR_CLASS[k]}
                  style={{ width: `${((s.byStatus[k] ?? 0) / s.total) * 100}%` }}
                />
              ))}
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
              {DISTRIBUTION_ORDER.filter((k) => (s.byStatus[k] ?? 0) > 0).map((k) => (
                <li key={k} className="flex items-center gap-2 text-[13px]">
                  <span className={`h-2 w-2 rounded-sm ${BAR_CLASS[k]}`} aria-hidden />
                  <span className="capitalize text-muted-foreground">{k}</span>
                  <span className="ml-auto font-mono text-xs text-foreground">{s.byStatus[k]}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent applications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/applications">
                View all
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.isPending ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : recent.isError ? (
              <p className="text-sm text-muted-foreground">
                Couldn’t load recent applications.{' '}
                <button
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => recent.refetch()}
                >
                  Retry
                </button>
              </p>
            ) : (
              <ul className="divide-y">
                {recent.data.data.map((a) => (
                  <li key={a._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{a.company}</p>
                      <p className="truncate text-[13px] text-muted-foreground">{a.role}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
