import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { api } from '@/lib/api';
import type { ApplicationItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(160),
  role: z.string().trim().min(1, 'Role is required').max(160),
  status: z.enum(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']),
  location: z.string().max(160).default(''),
  jobUrl: z.string().max(2048).default(''),
  source: z.string().max(80).default(''),
  notes: z.string().max(2000).default(''),
});

type FormValues = z.infer<typeof schema>;

export function ApplicationForm({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ApplicationItem | null;
}) {
  const qc = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      company: '',
      role: '',
      status: 'applied',
      location: '',
      jobUrl: '',
      source: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      setServerError(null);
      form.reset(
        initial
          ? {
              company: initial.company,
              role: initial.role,
              status: initial.status,
              location: initial.location ?? '',
              jobUrl: initial.jobUrl ?? '',
              source: initial.source ?? '',
              notes: initial.notes ?? '',
            }
          : {
              company: '',
              role: '',
              status: 'applied',
              location: '',
              jobUrl: '',
              source: '',
              notes: '',
            }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?._id]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      initial
        ? api.updateApplication(initial._id, values)
        : api.createApplication(values),
    onSuccess: () => {
      setServerError(null);
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (e: unknown) => setServerError(e instanceof Error ? e.message : 'Save failed'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit application' : 'Add application'}</DialogTitle>
          <DialogDescription>
            Track the company, role, and current hiring stage.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((v) => {
            setServerError(null);
            mutation.mutate(v);
          })}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Inc" {...form.register('company')} />
              {form.formState.errors.company && (
                <p className="text-xs text-destructive">{form.formState.errors.company.message}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="role">Role</Label>
              <Input id="role" placeholder="Frontend Engineer" {...form.register('role')} />
              {form.formState.errors.role && (
                <p className="text-xs text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) => form.setValue('status', v as FormValues['status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'] as const).map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Remote / Berlin" {...form.register('location')} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="jobUrl">Job URL</Label>
              <Input id="jobUrl" placeholder="https://…" {...form.register('jobUrl')} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="source">Source</Label>
              <Input id="source" placeholder="LinkedIn" {...form.register('source')} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Recruiter, next steps…" {...form.register('notes')} />
          </div>
          {serverError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : initial ? 'Save changes' : 'Add application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
