import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Award,
  Briefcase,
  FileUp,
  Hourglass,
  Inbox,
  Plus,
  Video,
  XCircle,
} from 'lucide-react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorCard, MetricsSkeleton } from '@/components/dashboard/StateCard';
import type { ShellContext } from '@/components/layout/AppShell';
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

// Solid fills only — no gradients. Green appears solely for offer/hired.
const BAR_CLASS: Record<ApplicationStatus, string> = {
  applied: 'bg-info-foreground/70',
  screening: 'bg-info-foreground',
  interview: 'bg-warning-foreground',
  offer: 'bg-success-solid',
  hired: 'bg-success-solid',
  rejected: 'bg-destructive',
  withdrawn: 'bg-muted-foreground/40',
};

export function OverviewPage() {
  const navigate = useNavigate();
  const shell = useOutletContext<ShellContext | null>();
  const goApplications = () => navigate('/app/applications');
  const onAdd = shell?.onAdd ?? goApplications;

  const stats = useQuery({ queryKey: ['stats'], queryFn: api.getStats });
  const resume = useQuery({ queryKey: ['resume-current'], queryFn: api.getCurrentResume });
  const recent = useQuery({
    queryKey: ['applications', 'recent'],
    queryFn: () => api.listApplications({ limit: 5 }),
    enabled: !stats.isPending && !stats.isError && (stats.data?.total ?? 0) > 0,
  });

  if (stats.isPending) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Overview"
          title="Your pipeline at a glance"
          description="Loading live counts from your application records."
        />
        <MetricsSkeleton count={5} />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="space-y-3 pt-5">
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-5">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (stats.isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Overview"
          title="Your pipeline at a glance"
          description="Every count below is computed from your application records."
        />
        <ErrorCard
          title="Couldn’t load statistics"
          message={`${(stats.error as Error)?.message ?? 'Backend unreachable.'} Start the backend and check VITE_API_URL.`}
          onRetry={() => void stats.refetch()}
        />
      </div>
    );
  }

  const s = stats.data;
  const inProcess = s.applied + s.screening + s.interview;

  const headerActions = (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link to="/app/applications">
          View applications
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </Button>
      <Button size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4" aria-hidden />
        Add application
      </Button>
    </>
  );

  if (s.total === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Overview"
          title="Your pipeline at a glance"
          description="Track every application from applied to offer. Add your first record to populate metrics, pipeline, and recent activity."
          actions={headerActions}
        />
        <EmptyState
          icon={Inbox}
          title="No applications yet"
          hint="Add your first application to start tracking stages, interviews, and offers. Counts and charts will appear here automatically."
          actionLabel="Add application"
          onAction={onAdd}
        />
        {resume.data == null && !resume.isPending && (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 pt-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
                <FileUp className="h-4 w-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">No resume uploaded yet</p>
                <p className="text-sm text-muted-foreground">
                  Upload a PDF to unlock Resume Match and grounded Assistant answers.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/resume-assistant">
                  Open Resume Assistant
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const metrics = [
    { icon: Briefcase, label: 'Total applications', value: s.total, hint: 'All tracked records', tone: 'plum' },
    { icon: Hourglass, label: 'In progress', value: inProcess, hint: 'Applied · Screening · Interview', tone: 'default' },
    { icon: Video, label: 'Interviews', value: s.interviews, hint: 'Screening + Interview stages', tone: 'info' },
    { icon: Award, label: 'Offers', value: s.offers, hint: 'Offer · Hired', tone: 'success' },
    { icon: XCircle, label: 'Rejected', value: s.rejected, hint: 'Closed without offer', tone: 'danger' },
  ];

  const activeStages = DISTRIBUTION_ORDER.filter((k) => (s.byStatus[k] ?? 0) > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Your pipeline at a glance"
        description={`Tracking ${s.total} application${s.total === 1 ? '' : 's'} from applied to offer. Every number and bar below reflects your stored records.`}
        actions={headerActions}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" role="list" aria-label="Application metrics">
        {metrics.map((m) => (
          <MetricCard key={m.label} icon={m.icon} label={m.label} value={m.value} hint={m.hint} tone={m.tone} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-1">
            <p className="eyebrow">Pipeline</p>
            <CardTitle className="text-[15px]">Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Status distribution across ${s.total} applications`}
            >
              {activeStages.map((k) => (
                <span
                  key={k}
                  className={BAR_CLASS[k]}
                  style={{ width: `${((s.byStatus[k] ?? 0) / s.total) * 100}%` }}
                />
              ))}
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {activeStages.map((k) => (
                <li key={k} className="flex items-center gap-2 text-[13px]">
                  <span className={`h-2 w-2 shrink-0 rounded-sm ${BAR_CLASS[k]}`} aria-hidden />
                  <span className="capitalize text-muted-foreground">{k}</span>
                  <span className="ml-auto font-mono text-xs font-medium text-foreground">
                    {s.byStatus[k]}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t pt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              In process {inProcess} · Offers {s.offers} · Rejected {s.rejected}
              {s.withdrawn > 0 ? ` · Withdrawn ${s.withdrawn}` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <div>
              <p className="eyebrow">Recent</p>
              <CardTitle className="mt-0.5 text-[15px]">Latest applications</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/applications">
                View all
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.isPending ? (
              <div className="space-y-2" aria-label="Loading recent applications">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recent.isError ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Couldn’t load recent applications.</p>
                <Button variant="outline" size="sm" onClick={() => void recent.refetch()}>
                  Retry
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.data.data.map((a) => (
                  <li key={a._id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{a.company}</p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {a.role}
                        <span className="font-mono text-[11px]">
                          {' '}· {a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : '—'}
                        </span>
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {resume.data == null && !resume.isPending && !resume.isError && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 pt-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted">
              <FileUp className="h-4 w-4 text-muted-foreground" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Unlock AI matching</p>
              <p className="text-sm text-muted-foreground">
                No resume on file. Upload a PDF to compare fit and ask grounded questions.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/resume-match">Resume Match</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/app/resume-assistant">
                  Open Assistant
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
