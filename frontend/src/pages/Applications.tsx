import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Inbox, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ApplicationItem } from '@/types';
import { ApplicationForm } from '@/components/ApplicationForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hint } from '@/components/ui/tooltip';

const STATUS_TABS = ['all', 'applied', 'interview', 'offer', 'rejected'] as const;

export function ApplicationsPage({ globalSearch }: { globalSearch: string }) {
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>('all');
  const [localSearch, setLocalSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationItem | null>(null);
  const [deleting, setDeleting] = useState<ApplicationItem | null>(null);
  const qc = useQueryClient();

  const q = (globalSearch || localSearch).trim();
  const statusParam = tab === 'all' ? '' : tab;

  const list = useQuery({
    queryKey: ['applications', q, statusParam],
    queryFn: () => api.listApplications({ q, status: statusParam, limit: 50 }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteApplication(id),
    onSuccess: () => {
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (item: ApplicationItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const total = list.data?.pagination.total ?? 0;
  const shown = list.data?.data.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/*
          Status filter uses the accessible shadcn-compatible Tabs fallback.
          Skecher Velocity Tabs publishes no installable source (preview-only docs),
          so it cannot be vendored reliably — see frontend README.
        */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList aria-label="Filter by status">
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-48 sm:w-56">
            <Input
              placeholder="Filter list…"
              aria-label="Filter applications in list"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <Button onClick={openAdd} size="sm" className="h-9">
            <Plus className="h-4 w-4" aria-hidden />
            Add application
          </Button>
        </div>
      </div>

      {list.data && shown > 0 && (
        <p className="font-mono text-xs text-muted-foreground" role="status">
          Showing {shown} of {total} application{total === 1 ? '' : 's'}
        </p>
      )}

      {del.isError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Couldn’t delete the application:{' '}
          {(del.error as Error)?.message ?? 'unknown error.'} Nothing was removed.
        </p>
      )}

      {list.isPending && (
        <Card>
          <CardContent className="space-y-2 pt-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      )}

      {list.isError && (
        <Card>
          <CardHeader>
            <CardTitle>Couldn’t load applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {(list.error as Error)?.message ?? 'Backend unreachable.'}
            </p>
            <Button variant="outline" size="sm" onClick={() => list.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {list.data && shown === 0 && (
        <EmptyState
          icon={Inbox}
          title="No applications found"
          hint={
            q || tab !== 'all'
              ? 'Try clearing the search or choosing a different status.'
              : 'Add your first application to start tracking your pipeline.'
          }
          actionLabel="Add application"
          onAction={openAdd}
        />
      )}

      {list.data && shown > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data.data.map((a) => (
              <TableRow key={a._id}>
                <TableCell className="font-medium">{a.company}</TableCell>
                <TableCell className="text-muted-foreground">{a.role}</TableCell>
                <TableCell>
                  <StatusBadge status={a.status} />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
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
