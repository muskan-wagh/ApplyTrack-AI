import { ArrowRight, Briefcase, FileSearch, MessagesSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { StatusBadge } from '@/components/StatusBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ApplicationStatus } from '@/types';

const DEMO_ROWS: Array<{ company: string; role: string; status: ApplicationStatus; date: string }> = [
  { company: 'Acme Corp', role: 'Frontend Engineer', status: 'interview', date: 'Oct 2, 2026' },
  { company: 'Globex', role: 'Backend Engineer', status: 'applied', date: 'Sep 28, 2026' },
  { company: 'Initech', role: 'Full-Stack Developer', status: 'offer', date: 'Sep 20, 2026' },
  { company: 'Umbrella', role: 'Data Analyst', status: 'rejected', date: 'Sep 12, 2026' },
];

function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:px-6">
        <Link to="/" aria-label="ApplyTrack AI home">
          <Logo />
        </Link>
        <nav aria-label="Site" className="ml-6 hidden items-center gap-1 sm:flex">
          <a
            href="#features"
            className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Features
          </a>
          <a
            href="#workflow"
            className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Workflow
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle label="Toggle color theme" />
          <Button size="sm" asChild>
            <Link to="/app">
              Open dashboard
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
      <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
        Application tracker + resume intelligence
      </p>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-[40px] sm:leading-[1.15]">
        Every application. One clear picture.
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
        ApplyTrack AI keeps your job search organized: log each application with its hiring
        stage, compare your resume against any job description, and ask questions over your
        resume with quoted evidence.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link to="/app">
            Open the dashboard
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <a href="#workflow">See how it works</a>
        </Button>
      </div>
      <p className="mt-4 font-mono text-xs text-muted-foreground">
        No account needed · Your records live in your own MongoDB
      </p>
    </section>
  );
}

function Preview() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="font-mono text-xs text-muted-foreground">applytrack — applications</p>
          <Badge variant="outline" size="sm" className="font-mono text-[11px] uppercase tracking-wide">
            Sample data
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Applied</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEMO_ROWS.map((r) => (
              <TableRow key={`${r.company}-${r.role}`}>
                <TableCell className="font-medium">{r.company}</TableCell>
                <TableCell className="text-muted-foreground">{r.role}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                  {r.date}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Preview with sample data — your dashboard shows live records from the API.
      </p>
    </section>
  );
}

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Application tracking',
    status: 'Live now',
    live: true,
    body: 'Log company, role, stage, and source for every application. Search and filter by status from one table backed by the applications API.',
  },
  {
    icon: FileSearch,
    title: 'Resume–job match',
    status: 'Backend pending',
    live: false,
    body: 'A fit score with matched skills, missing skills, and a short explanation — served by the matching API once the backend enables it.',
  },
  {
    icon: MessagesSquare,
    title: 'Resume Q&A',
    status: 'Backend pending',
    live: false,
    body: 'Ask questions over your uploaded resume and get answers with quoted evidence snippets — served by the RAG endpoint once available.',
  },
];

function Features() {
  return (
    <section id="features" className="border-t">
      <div className="mx-auto max-w-5xl scroll-mt-16 px-4 py-14 sm:px-6">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
          Features
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          Three tools, one job search
        </h2>
        <div className="mt-6 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="space-y-2.5 bg-card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
                <f.icon className="h-4 w-4 text-foreground" aria-hidden />
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              </div>
              <Badge variant={f.live ? 'success' : 'secondary'} size="sm" className="font-mono text-[11px]">
                {f.status}
              </Badge>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: '01',
    title: 'Log applications',
    body: 'Add each role you apply to with its stage — applied, screening, interview, offer, or rejected. Filter the table as the pipeline grows.',
  },
  {
    n: '02',
    title: 'Check the fit',
    body: 'Paste a job description next to your resume to see a match score, which skills overlap, and what is missing before you apply.',
  },
  {
    n: '03',
    title: 'Ask follow-ups',
    body: 'Ask the assistant about experience, gaps, or tailoring — answers quote the resume lines they are based on.',
  },
];

function Workflow() {
  return (
    <section id="workflow" className="border-t bg-card">
      <div className="mx-auto max-w-5xl scroll-mt-16 px-4 py-14 sm:px-6">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
          Workflow
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          From application to answer in three steps
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="border-t-2 border-primary/60 pt-4">
              <p className="font-mono text-xs font-semibold text-muted-foreground">{s.n}</p>
              <h3 className="mt-1 text-sm font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link to="/app">
              Start tracking
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/applications">View applications</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <Logo />
        <nav aria-label="Footer" className="flex flex-wrap gap-1 text-sm">
          {[
            { to: '/app', label: 'Dashboard' },
            { to: '/app/applications', label: 'Applications' },
            { to: '/app/resume-match', label: 'Resume Match' },
            { to: '/app/resume-assistant', label: 'Resume Assistant' },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="font-mono text-xs text-muted-foreground sm:ml-auto">
          Built with React, Express &amp; MongoDB
        </p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main>
        <Hero />
        <Preview />
        <Features />
        <Workflow />
      </main>
      <Footer />
    </div>
  );
}
