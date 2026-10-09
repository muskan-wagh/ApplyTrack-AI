import { useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/landing/Reveal';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { SAMPLE_APPLICATIONS } from '@/components/landing/Sections';
import { Logo } from '@/components/Logo';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/**
 * Product preview with real interface switching. The in-house Tabs component
 * drives three sample views built from production primitives — every view is
 * labelled as sample content, never live data.
 */
export function ProductPreview() {
  const [tab, setTab] = useState('applications');
  return (
    <section id="preview" className="scroll-mt-20 border-t" style={{ borderColor: 'var(--lm-line)' }}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          index="02 · Results"
          eyebrow="The analysis experience"
          title="The actual interface, with sample content"
          lede="Switch between the three surfaces. Everything below is rendered with the production components — filled with labelled sample data so the shape of each view is clear."
        />
        <Reveal delay={100} variant="scale">
          <Tabs value={tab} onValueChange={setTab} className="mt-8">
            <TabsList aria-label="Preview surface">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="match">Match</TabsTrigger>
              <TabsTrigger value="assistant">Assistant</TabsTrigger>
            </TabsList>
          </Tabs>
          <div
            className="lm-shadow mt-4 overflow-hidden rounded-2xl"
            style={{ backgroundColor: 'var(--lm-shell)', border: '1px solid var(--lm-line)' }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5" style={{ borderColor: 'var(--lm-line)' }}>
              <p className="font-mono text-xs" style={{ color: 'var(--lm-muted)' }}>
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
          <p className="mt-3 text-center text-xs" style={{ color: 'var(--lm-muted)' }}>
            Your dashboard shows live records from the API —{' '}
            <Link to="/app" className="font-medium underline-offset-4 hover:underline" style={{ color: 'var(--lm-ember)' }}>
              open it here
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

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
        {SAMPLE_APPLICATIONS.map((r) => (
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
    <div className="space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline gap-3">
        <p className="font-mono text-4xl font-semibold" style={{ color: 'var(--lm-ink)' }}>
          82<span className="text-sm font-normal" style={{ color: 'var(--lm-muted)' }}>/100</span>
        </p>
        <p className="text-sm" style={{ color: 'var(--lm-muted)' }}>Strong overlap with one gap to close.</p>
        <p className="ml-auto font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--lm-green)' }}>
          Strong fit
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--lm-line)' }} aria-hidden>
        <div className="h-full w-[82%] rounded-full" style={{ backgroundColor: 'var(--lm-green)' }} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--lm-ink)' }}>Matched skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
            {['React', 'TypeScript', 'Node.js'].map((s) => (
              <Badge key={s} variant="success" size="sm" className="font-mono text-[11px]">{s}</Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--lm-ink)' }}>Missing skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
            {['GraphQL', 'AWS'].map((s) => (
              <Badge key={s} variant="warning" size="sm" className="font-mono text-[11px]">{s}</Badge>
            ))}
          </div>
        </div>
      </div>
      <p className="border-t pt-3 font-mono text-xs" style={{ borderColor: 'var(--lm-line)', color: 'var(--lm-muted)' }}>
        “Led migration of the checkout flow to React + TypeScript; no GraphQL or AWS exposure evident…”
      </p>
    </div>
  );
}

function AssistantSample() {
  return (
    <div className="space-y-2.5 p-5 sm:p-6">
      <div className="lm-inkpanel ml-auto max-w-[85%] rounded-lg rounded-br-sm px-3.5 py-2.5 text-sm">
        How many years of TypeScript experience are shown?
      </div>
      <div className="max-w-[92%] rounded-lg rounded-bl-sm border px-3.5 py-2.5" style={{ borderColor: 'var(--lm-line)', backgroundColor: 'var(--lm-shell-2)' }}>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--lm-ink)' }}>
          Four years — TypeScript appears across three roles, most recently leading a
          checkout migration.
        </p>
        <p className="mt-2 border-t pt-2 font-mono text-[11px] leading-relaxed" style={{ borderColor: 'var(--lm-line)', color: 'var(--lm-muted)' }}>
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
    a: 'Paste your resume text next to a job description and run the analysis. POST /api/match returns a fit score with matched skills, missing skills, and a short explanation. The backend needs an AI key configured; without one the page shows a clear error instead of a fabricated score.',
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
    a: 'No account, ever — this is a single-user tracker. Application tracking works with just MongoDB. Matching and the assistant need an API key configured on the backend; everything else keeps working without one.',
  },
];

function FaqItem({ q, a, open, onToggle, index }: { q: string; a: string; open: boolean; onToggle: () => void; index: number }) {
  const panelId = `faq-panel-${index}`;
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--lm-line)' }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-[15px] font-medium" style={{ color: 'var(--lm-ink)' }}>{q}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          style={{ color: 'var(--lm-muted)' }}
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
        <p className="min-h-0 overflow-hidden text-sm leading-relaxed" style={{ color: 'var(--lm-muted)' }}>{a}</p>
      </div>
    </div>
  );
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-20 border-t" style={{ borderColor: 'var(--lm-line)', backgroundColor: 'var(--lm-shell)' }}>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          index="05 · FAQ"
          eyebrow="Questions"
          title="Practical answers, no fine print"
          lede="Only capabilities that are implemented or verified are stated here."
        />
        <Reveal delay={100} variant="scale">
          <div className="mt-8 rounded-2xl px-5 sm:px-6" style={{ backgroundColor: 'var(--lm-shell-2)', border: '1px solid var(--lm-line)' }}>
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
    <section className="border-t" style={{ borderColor: 'var(--lm-line)' }}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <Reveal variant="scale">
          <div className="lm-shadow lm-inkpanel relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:py-16">
            {/* Restrained geometric inlay: solid shapes, no gradients. */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -left-16 -top-16 h-56 w-56 rounded-[28px] border border-white/15" style={{ transform: 'rotate(12deg)' }} />
              <div className="absolute -bottom-20 -right-14 h-64 w-64 rounded-full border border-white/15" />
              <span className="absolute left-[12%] top-[22%] font-mono text-lg text-white/25">+</span>
              <span className="absolute bottom-[20%] right-[12%] font-mono text-lg text-white/25">+</span>
            </div>
            <div className="relative">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Get started
              </p>
              <h2 className="mx-auto mt-3 max-w-lg text-balance text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
                Bring order to your job search.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-pretty text-[15px] leading-relaxed text-white/70">
                Log your first application in under a minute. No account, no
                setup beyond the app and your database.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
                <Button asChild className="lm-press border-0 bg-[#f7f1e3] text-[#241a10] shadow-sm hover:bg-white">
                  <Link to="/app">
                    Open the dashboard
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="lm-press border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link to="/app/resume-assistant">Try the assistant</Link>
                </Button>
              </div>
              <p className="mt-5 font-mono text-[11px] text-white/50">
                No account needed · Your records live in your own MongoDB
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: 'var(--lm-line)' }}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--lm-muted)' }}>
            Track applications, understand your fit, and ask questions over your resume.
          </p>
        </div>
        <nav aria-label="Product">
          <p className="font-mono text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--lm-muted)' }}>
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
                <Link to={l.to} style={{ color: 'var(--lm-muted)' }} className="transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Resources">
          <p className="font-mono text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--lm-muted)' }}>
            Page
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {[
              { href: '#product', label: 'Product' },
              { href: '#preview', label: 'Preview' },
              { href: '#features', label: 'Features' },
              { href: '#how', label: 'How it works' },
              { href: '#faq', label: 'FAQ' },
            ].map((l) => (
              <li key={l.href}>
                <a href={l.href} style={{ color: 'var(--lm-muted)' }} className="transition-colors hover:text-foreground">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t" style={{ borderColor: 'var(--lm-line)' }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 font-mono text-xs sm:flex-row sm:items-center sm:px-6" style={{ color: 'var(--lm-muted)' }}>
          <p>ApplyTrack AI — single-user job search tracker</p>
          <p className="sm:ml-auto">Built with React, Express &amp; MongoDB</p>
        </div>
      </div>
    </footer>
  );
}
