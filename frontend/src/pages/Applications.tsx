import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpDown, Inbox, Pencil, Plus, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { api } from '@/lib/api';
import type { ApplicationItem } from '@/types';
import { ApplicationForm } from '@/components/ApplicationForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorCard } from '@/components/dashboard/StateCard';
import type { ShellContext } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hint } from '@/components/ui/tooltip';

const STATUS_TABS = ['all', 'applied', 'interview', 'offer', 'rejected'] as const;
type Tab = (typeof STATUS_TABS)[number];
type Sort = 'recent' | 'oldest' | 'company';

export function ApplicationsPage({ globalSearch }: { globalSearch: string }) {
  const shell = useOutletContext<ShellContext | null>();
  const [tab, setTab] = useState<Tab>('all');
  const [localSearch, setLocalSearch] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationItem | null>(null);
  const [deleting, setDeleting] = useState<ApplicationItem | null>(null);
  const qc = useQueryClient();

  const openLocalAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const onAdd = shell?.onAdd ?? openLocalAdd;
  const openEdit = (item: ApplicationItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const q = (globalSearch || localSearch).trim();
  const statusParam = tab === 'all' ? '' : tab;

  const list = useQuery({
    queryKey: ['applications', q, statusParam, sort],
    queryFn: () => api.listApplications({ q, status: statusParam, limit: 50, sort }),
  });
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.getStats });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteApplication(id),
    onSuccess: () => {
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const total = list.data?.pagination.total ?? 0;
  const shown = list.data?.data.length ?? 0;
  const isFiltered = q.length > 0 || tab !== 'all';
  const countFor = (t: Tab): number | null => {
    if (!stats.data) return null;
    if (t === 'all') return stats.data.total;
    if (t === 'applied') return stats.data.applied;
    if (t === 'interview') return stats.data.interviews;
    if (t === 'offer') return stats.data.offers;
    return stats.data.rejected;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Applications"
        title="Manage applications"
        description="Search, filter by hiring stage, and keep every record current. Changes refresh metrics automatically."
        actions={
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" aria-hidden />
            Add application
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            {/*
              Status filter uses the accessible shadcn-compatible Tabs fallback.
              Skecher Velocity Tabs publishes no installable source (preview-only docs),
              so it cannot be vendored reliably — see frontend README.
            */}
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList aria-label="Filter by status">
                {STATUS_TABS.map((s) => {
                  const n = countFor(s);
                  return (
                    <TabsTrigger key={s} value={s}>
                      {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                      {n !== null && (
                        <span className="font-mono text-[11px] text-muted-foreground">{n}</span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Input
                placeholder="Filter list…"
                aria-label="Filter applications in list"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="h-9 w-44 bg-background sm:w-56"
              />
              <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                <SelectTrigger aria-label="Sort applications" className="h-9 w-36 bg-background">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most recent</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="company">Company A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {list.data && shown > 0 && (
            <p className="font-mono text-xs text-muted-foreground" role="status">
              Showing {shown} of {total} application{total === 1 ? '' : 's'}
              {q ? ` · “${q}”` : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {del.isError && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Couldn’t delete the application: {(del.error as Error)?.message ?? 'unknown error.'}{' '}
          Nothing was removed.
        </p>
      )}

      {list.isPending && (
        <Card>
          <CardContent className="space-y-2 pt-5" aria-label="Loading applications">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {list.isError && (
        <ErrorCard
          title="Couldn’t load applications"
          message={(list.error as Error)?.message ?? 'Backend unreachable.'}
          onRetry={() => void list.refetch()}
        />
      )}

      {list.data && shown === 0 && (
        <div className="space-y-3">
          <EmptyState
            icon={Inbox}
            title="No applications found"
            hint={
              isFiltered
                ? 'Try clearing the search or choosing a different status.'
                : 'Add your first application to start tracking your pipeline.'
            }
            actionLabel="Add application"
            onAction={onAdd}
          />
          {isFiltered && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTab('all');
                  setLocalSearch('');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      {list.data && shown > 0 && (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="font-mono text-[11px] uppercase tracking-wide">Company</TableHead>
                    <TableHead className="font-mono text-[11px] uppercase tracking-wide">Role</TableHead>
                    <TableHead className="font-mono text-[11px] uppercase tracking-wide">Status</TableHead>
                    <TableHead className="font-mono text-[11px] uppercase tracking-wide">Applied</TableHead>
                    <TableHead className="hidden font-mono text-[11px] uppercase tracking-wide lg:table-cell">
                      Location
                    </TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.data.data.map((a) => (
                    <TableRow key={a._id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="max-w-44 truncate font-semibold">{a.company}</TableCell>
                      <TableCell className="max-w-52 truncate text-muted-foreground">{a.role}</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="hidden max-w-36 truncate text-muted-foreground lg:table-cell">
                        {a.location || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-0.5">
                          <Hint label={`Edit ${a.company} — ${a.role}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit ${a.company} ${a.role}`}
                              onClick={() => openEdit(a)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Hint>
                          <Hint label={`Delete ${a.company} — ${a.role}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${a.company} ${a.role}`}
                              onClick={() => {
                                del.reset();
                                setDeleting(a);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </Hint>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile cards */}
          <ul className="grid gap-3 md:hidden">
            {list.data.data.map((a) => (
              <li key={a._id}>
                <Card className="card-interactive">
                  <CardContent className="space-y-2.5 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{a.company}</p>
                        <p className="truncate text-[13px] text-muted-foreground">{a.role}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : '—'}
                      {a.location ? ` · ${a.location}` : ''}
                    </p>
                    <div className="flex gap-2 border-t pt-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEdit(a)}
                        aria-label={`Edit ${a.company} ${a.role}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                        onClick={() => {
                          del.reset();
                          setDeleting(a);
                        }}
                        aria-label={`Delete ${a.company} ${a.role}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      <ApplicationForm open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(v) => {
          if (!v) setDeleting(null);
        }}
        title="Delete application?"
        description={
          deleting
            ? `${deleting.company} — ${deleting.role} will be permanently removed. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        pending={del.isPending}
        onConfirm={() => {
          if (deleting) del.mutate(deleting._id);
        }}
      />
    </div>
  );
}
