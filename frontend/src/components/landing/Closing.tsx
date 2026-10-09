import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/landing/Reveal';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { Logo } from '@/components/Logo';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/types';

/**
 * Product preview with real interface switching. The in-house Tabs component
 * drives three sample views built from production primitives — every view is
 * labelled as sample content, never live data.
 */
export function ProductPreview() {
  const [tab, setTab] = useState('applications');
  return (
    <section id="preview" className="scroll-mt-20 border-t">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Preview"
          title="The actual interface, with sample content"
          lede="Switch between the three surfaces. Everything below is rendered with the production components — filled with labelled sample data so the shape of each view is clear."
        />
        <Reveal delay={100}>
          <Tabs value={tab} onValueChange={setTab} className="mt-8">
            <TabsList aria-label="Preview surface">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="match">Match</TabsTrigger>
              <TabsTrigger value="assistant">Assistant</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-4 overflow-hidden rounded-lg border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-2.5">
              <p className="font-mono text-xs text-muted-foreground">
                {tab === 'applications' && 'applytrack — applications'}
                {tab === 'match' && 'applytrack — resume match'}
                {tab === 'assistant' && 'applytrack — resume assistant'}
              </p>
              <Badge variant="outline" size="sm" className="font-mono text-[11px] uppercase tracking-wide">
                Sample data
              </Badge>
            </div>
            {/* Keyed wrapper replays a short fade/rise each time the tab changes. */}
            <div key={tab} className="tab-panel-enter">
              {tab === 'applications' && <ApplicationsSample />}
              {tab === 'match' && <MatchSample />}
              {tab === 'assistant' && <AssistantSample />}
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Your dashboard shows live records from the API —{' '}
            <Link to="/app" className="font-medium text-primary underline-offset-4 hover:underline">
              open it here
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const SAMPLE_ROWS: Array<{ company: string; role: string; status: ApplicationStatus; date: string }> = [
  { company: 'Acme Corp', role: 'Frontend Engineer', status: 'interview', date: 'Oct 2, 2026' },
  { company: 'Globex', role: 'Backend Engineer', status: 'applied', date: 'Sep 28, 2026' },
  { company: 'Initech', role: 'Full-Stack Developer', status: 'offer', date: 'Sep 20, 2026' },
  { company: 'Umbrella', role: 'Data Analyst', status: 'rejected', date: 'Sep 12, 2026' },
];

function ApplicationsSample() {
  return (
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
        {SAMPLE_ROWS.map((r) => (
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
  );
}

function MatchSample() {
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-baseline gap-3">
        <p className="font-mono text-3xl font-semibold text-foreground">
          82<span className="text-sm font-normal text-muted-foreground">/100</span>
        </p>
        <p className="text-sm text-muted-foreground">Strong overlap with one gap to close.</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full w-[82%] rounded-full bg-primary" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[13px] font-semibold text-foreground">Matched skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
            {['React', 'TypeScript', 'Node.js'].map((s) => (
              <Badge key={s} variant="success" size="sm" className="font-mono text-[11px]">{s}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground">Missing skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
            {['GraphQL', 'AWS'].map((s) => (
              <Badge key={s} variant="warning" size="sm" className="font-mono text-[11px]">{s}</Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantSample() {
  return (
    <div className="space-y-2.5 p-5">
      <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
        How many years of TypeScript experience are shown?
      </div>
      <div className="max-w-[92%] rounded-lg rounded-bl-sm border bg-background px-3.5 py-2.5">
        <p className="text-sm leading-relaxed text-foreground">
          Four years — TypeScript appears across three roles, most recently leading a
          checkout migration.
        </p>
        <p className="mt-2 border-t pt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          “TypeScript (4 yrs): Acme 2023–2026, Globex 2022–2023…”
        </p>
      </div>
    </div>
  );
}

const FAQS = [
  {
    q: 'What resumes can I upload?',
    a: 'PDF files, up to the size limit configured on the server. The assistant parses the PDF into text, splits it into overlapping chunks, and indexes those chunks in your database so questions can be answered from them.',
  },
  {
    q: 'How does resume–job matching work?',
    a: 'The matching view is built, but the scoring endpoint is not implemented yet — the page shows a clear pending state instead of a fabricated score. When it ships, it will compare your resume text against a job description and return a score with matched skills, missing skills, and an explanation.',
  },
  {
    q: 'What does the assistant use as evidence?',
    a: 'Only the chunks retrieved from your uploaded resume. Answers quote the exact lines they rely on, and when the resume holds no evidence the answer says so plainly instead of guessing.',
  },
  {
    q: 'Where is my data stored?',
    a: 'In your own MongoDB: applications, resume text chunks, and their embeddings. There are no accounts and no shared cloud — resume content is sent to the configured embedding and answer provider only when you ask a question, and without a backend API key the RAG routes simply return “unavailable”.',
  },
  {
    q: 'Do I need an account or an API key?',
    a: 'No account, ever — this is a single-user tracker. Application tracking works with just MongoDB. The assistant needs an API key configured on the backend; everything else keeps working without one.',
  },
];

function FaqItem({ q, a, open, onToggle, index }: { q: string; a: string; open: boolean; onToggle: () => void; index: number }) {
  const panelId = `faq-panel-${index}`;
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-[15px] font-medium text-foreground">{q}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        role="region"
        className={cn(
          'grid transition-all duration-200 ease-out',
          open ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <p className="min-h-0 overflow-hidden text-sm leading-relaxed text-muted-foreground">{a}</p>
      </div>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-20 border-t bg-card">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="FAQ"
          title="Practical answers, no fine print"
          lede="Only capabilities that are implemented or verified are stated here."
        />
        <Reveal delay={100}>
          <div className="mt-8 rounded-lg border bg-background px-5">
            {FAQS.map((f, i) => (
              <FaqItem
                key={f.q}
                index={i}
                q={f.q}
                a={f.a}
                open={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <div className="rounded-lg border bg-card px-6 py-10 text-center sm:py-12">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
              Get started
            </p>
            <h2 className="mx-auto mt-2 max-w-md text-2xl font-semibold tracking-tight text-foreground">
              Bring order to your job search.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
              Log your first application in under a minute. No account, no setup beyond
              the app and your database.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <Link to="/app">
                  Open the dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/app/resume-assistant">Try the assistant</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Track applications, understand your fit, and ask questions over your resume.
          </p>
        </div>
        <nav aria-label="Product">
          <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Product
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {[
              { to: '/app', label: 'Dashboard' },
              { to: '/app/applications', label: 'Applications' },
              { to: '/app/resume-match', label: 'Resume Match' },
              { to: '/app/resume-assistant', label: 'Resume Assistant' },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted-foreground hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Resources">
          <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Page
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {[
              { href: '#product', label: 'Product' },
              { href: '#features', label: 'Features' },
              { href: '#how', label: 'How it works' },
              { href: '#preview', label: 'Preview' },
              { href: '#faq', label: 'FAQ' },
            ].map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-muted-foreground hover:text-foreground">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
          <p>ApplyTrack AI — single-user job search tracker</p>
          <p className="sm:ml-auto">Built with React, Express &amp; MongoDB</p>
        </div>
      </div>
    </footer>
  );
}
