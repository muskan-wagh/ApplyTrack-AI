import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, Briefcase, FileSearch, LayoutDashboard, Menu, Plus, Search, Sparkles, X } from 'lucide-react';
import { ApplicationForm } from '@/components/ApplicationForm';
import { Logo } from '@/components/Logo';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ShellContext {
  onAdd: () => void;
}

const NAV = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/applications', label: 'Applications', icon: Briefcase, end: false },
  { to: '/app/resume-match', label: 'Resume Match', icon: FileSearch, end: false },
  { to: '/app/resume-assistant', label: 'Resume Assistant', icon: Sparkles, end: false },
];

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/app': {
    title: 'Overview',
    description: 'Application pipeline at a glance, computed from your records.',
  },
  '/app/applications': {
    title: 'Applications',
    description: 'Search, filter, and manage every application.',
  },
  '/app/resume-match': {
    title: 'Resume Match',
    description: 'Compare your resume against a job description.',
  },
  '/app/resume-assistant': {
    title: 'Resume Assistant',
    description: 'Ask questions over your uploaded resume.',
  },
};

export function AppShell({ onSearch }: { onSearch: (q: string) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const location = useLocation();
  const meta = PAGE_META[location.pathname] ?? { title: 'ApplyTrack AI', description: '' };
  // The header search filters the applications table, so it only renders
  // on the page that consumes it — never as a decorative control.
  const showSearch = location.pathname === '/app/applications';
  const openAdd = () => {
    setMobileOpen(false);
    setAddOpen(true);
  };

  const nav = (
    <nav aria-label="Primary" className="grid gap-1">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-secondary font-semibold text-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0'
                )}
                aria-hidden
              />
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                )}
                aria-hidden
              />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-card md:flex">
        <div className="border-b px-4 py-4">
          <Link to="/" aria-label="ApplyTrack AI home" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Logo />
          </Link>
          <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
            Job pipeline · AI career tools
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="eyebrow px-3 pb-2">Workspace</p>
          {nav}
        </div>
        <div className="space-y-1 border-t p-3">
          <div className="flex items-center gap-2.5 rounded-lg border bg-muted px-3 py-2.5">
            <ProfileAvatar initials="AT" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">Personal</p>
              <p className="font-mono text-[11px] text-muted-foreground">single-user · v1</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r bg-card shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <Logo />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <p className="eyebrow px-3 pb-2">Workspace</p>
              {nav}
              <Button onClick={openAdd} className="mt-4 w-full" size="sm">
                <Plus className="h-4 w-4" aria-hidden />
                Add application
              </Button>
            </div>
            <div className="border-t p-3">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to site
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="md:pl-60">
        <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden w-72 sm:block">
              {showSearch && (
                <>
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    placeholder="Search applications…"
                    aria-label="Search applications"
                    className="h-9 bg-card pl-8"
                    onChange={(e) => onSearch(e.target.value)}
                  />
                </>
              )}
            </div>
            {!showSearch && (
              <p className="hidden font-mono text-xs text-muted-foreground sm:block" aria-hidden>
                {meta.title}
              </p>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <Button onClick={openAdd} size="sm" className="hidden h-9 sm:inline-flex">
                <Plus className="h-4 w-4" aria-hidden />
                Add application
              </Button>
              <Button
                onClick={openAdd}
                size="icon"
                className="h-9 w-9 sm:hidden"
                aria-label="Add application"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </Button>
              <ThemeToggle />
              <ProfileAvatar initials="AT" />
            </div>
          </div>
          {showSearch && (
            <div className="border-t px-4 py-2 sm:hidden">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  placeholder="Search applications…"
                  aria-label="Search applications"
                  className="bg-card pl-8"
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            </div>
          )}
        </header>
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet context={{ onAdd: openAdd } satisfies ShellContext} />
        </main>
      </div>
      <ApplicationForm open={addOpen} onOpenChange={setAddOpen} initial={null} />
    </div>
  );
}
