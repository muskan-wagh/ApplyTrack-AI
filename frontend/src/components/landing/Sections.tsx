import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/landing/Reveal';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ApplicationStatus } from '@/types';

/** Labelled sample rows, shared by the feature demo and the tabbed preview. */
export const SAMPLE_APPLICATIONS: Array<{ company: string; role: string; status: ApplicationStatus; date: string }> = [
  { company: 'Acme Corp', role: 'Frontend Engineer', status: 'interview', date: 'Oct 2, 2026' },
  { company: 'Globex', role: 'Backend Engineer', status: 'applied', date: 'Sep 28, 2026' },
  { company: 'Initech', role: 'Full-Stack Developer', status: 'offer', date: 'Sep 20, 2026' },
  { company: 'Umbrella', role: 'Data Analyst', status: 'rejected', date: 'Sep 12, 2026' },
];

const LIVE_ENDPOINTS = [
  { method: 'GET', path: '/api/applications', note: 'search · filter · sort' },
  { method: 'POST', path: '/api/match', note: 'score · skills · reasons' },
  { method: 'POST', path: '/api/rag/query', note: 'answers with quotes' },
  { method: 'POST', path: '/api/resumes/upload', note: 'PDF → chunks' },
  { method: 'GET', path: '/api/health', note: 'db + AI status' },
];

/**
 * Endpoint ticker: every route below is real and implemented. The track is
 * duplicated for a seamless loop; the copy is hidden from screen readers
 * (the same information lives in the workflow and FAQ sections).
 */
export function Ticker() {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {LIVE_ENDPOINTS.map((e) => (
        <span key={`${hidden ? 'b' : 'a'}-${e.path}`} className="flex items-center">
          <span className="flex items-center gap-2 px-6 font-mono text-xs">
            <i className="lm-pulse block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--lm-green)' }} />
            <b className="font-semibold" style={{ color: 'var(--lm-ember)' }}>{e.method}</b>
            <span style={{ color: 'var(--lm-ink)' }}>{e.path}</span>
            <span style={{ color: 'var(--lm-muted)' }}>{e.note}</span>
          </span>
          <span className="h-3 w-px" style={{ backgroundColor: 'var(--lm-line)' }} />
        </span>
      ))}
    </div>
  );
  return (
    <div
      className="relative overflow-hidden border-y"
      style={{ borderColor: 'var(--lm-line)', backgroundColor: 'var(--lm-shell)' }}
    >
      <div className="lm-marquee flex w-max py-2.5">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

const WORKFLOW = [
  {
    n: '01',
    name: 'Log',
    title: 'Every application lands in one table',
    body: 'Company, role, stage, location, source — searchable and filterable as the pipeline grows. Backed by the applications API, live now.',
    to: '/app/applications',
    cta: 'Open applications',
    fragment: (
      <div>
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Example statuses">
          <StatusBadge status="applied" />
          <span style={{ color: 'var(--lm-muted)' }} aria-hidden>→</span>
          <StatusBadge status="screening" />
          <span style={{ color: 'var(--lm-muted)' }} aria-hidden>→</span>
          <StatusBadge status="interview" />
          <span style={{ color: 'var(--lm-muted)' }} aria-hidden>→</span>
          <StatusBadge status="offer" />
        </div>
        <p className="mt-3 border-t pt-3 font-mono text-xs" style={{ borderColor: 'var(--lm-line)', color: 'var(--lm-muted)' }}>
          GET /api/applications?q=&amp;status=&amp;sort=
        </p>
      </div>
    ),
  },
  {
    n: '02',
    name: 'Match',
    title: 'Score the resume against the posting',
    body: 'Paste both texts and get a fit score with the skills that overlap, the ones that are missing, and a short explanation. POST /api/match is implemented and working.',
    to: '/app/resume-match',
    cta: 'Try Resume Match',
    fragment: (
      <div>
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-3xl font-semibold" style={{ color: 'var(--lm-ink)' }}>
            82<span className="text-sm font-normal" style={{ color: 'var(--lm-muted)' }}>/100</span>
          </p>
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--lm-green)' }}>
            Strong fit
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--lm-line)' }} aria-hidden>
          <div className="h-full w-[82%] rounded-full" style={{ backgroundColor: 'var(--lm-green)' }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden>
          <Badge variant="success" size="sm" className="font-mono text-[11px]">React</Badge>
          <Badge variant="success" size="sm" className="font-mono text-[11px]">TypeScript</Badge>
          <Badge variant="warning" size="sm" className="font-mono text-[11px]">GraphQL — missing</Badge>
        </div>
        <p className="mt-3 border-t pt-3 font-mono text-xs" style={{ borderColor: 'var(--lm-line)', color: 'var(--lm-muted)' }}>
          POST /api/match · score + skills + explanation
        </p>
      </div>
    ),
  },
  {
    n: '03',
    name: 'Ask',
    title: 'Interrogate the resume with receipts',
    body: 'Upload the PDF once, then ask about experience, skills, or gaps. Answers are grounded in retrieved resume chunks and quote the exact lines — or say plainly when there is no evidence.',
    to: '/app/resume-assistant',
    cta: 'Ask the assistant',
    fragment: (
      <div className="space-y-2.5">
        <div className="lm-inkpanel ml-auto max-w-[85%] rounded-lg rounded-br-sm px-3.5 py-2.5 text-sm">
          What backend experience does this resume show?
        </div>
        <div className="max-w-[92%] rounded-lg rounded-bl-sm border px-3.5 py-2.5" style={{ borderColor: 'var(--lm-line)', backgroundColor: 'var(--lm-shell)' }}>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--lm-ink)' }}>
            Three years of Node.js API work, including a Postgres migration and
            request-latency improvements.
          </p>
          <p className="mt-2 border-t pt-2 font-mono text-[11px] leading-relaxed" style={{ borderColor: 'var(--lm-line)', color: 'var(--lm-muted)' }}>
            “Reduced p95 latency from 900ms to 220ms on the billing API…”
          </p>
        </div>
        <p className="font-mono text-xs" style={{ color: 'var(--lm-muted)' }}>
          POST /api/rag/query · grounded in your uploads
        </p>
      </div>
    ),
  },
];

/**
 * Product workflow: sticky intro on the left, three alternating step panels
 * on the right — each carrying a fragment of the real interface.
 */
export function Workflow() {
  return (
    <section id="product" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            index="01 · Product"
            eyebrow="The workflow"
            title="One pipeline, three moves"
            lede="Applications pile up across tabs, inboxes, and spreadsheets. ApplyTrack AI gives them one home — log the role, check your fit against the posting, and ask grounded questions before you apply."
          />
          <Reveal delay={120}>
            <ul className="mt-6 space-y-2.5 text-sm leading-relaxed">
              {[
                'One table for every application, stage, and source',
                'Fit analysis against the exact posting you are reading',
                'Answers grounded in your resume — with the lines quoted',
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--lm-ember)' }} aria-hidden />
                  <span style={{ color: 'var(--lm-ink)' }}>{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <ol className="space-y-5">
          {WORKFLOW.map((s, i) => (
            <Reveal key={s.n} delay={i * 90} variant="scale">
              <li
                className="lm-shadow overflow-hidden rounded-2xl"
                style={{ backgroundColor: 'var(--lm-shell)', border: '1px solid var(--lm-line)' }}
              >
                <div className="flex items-center gap-3 border-b px-5 py-3.5 sm:px-6" style={{ borderColor: 'var(--lm-line)' }}>
                  <span className="font-mono text-xs font-semibold" style={{ color: 'var(--lm-ember)' }}>{s.n}</span>
                  <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--lm-muted)' }}>{s.name}</span>
                  <Link
                    to={s.to}
                    className="group ml-auto inline-flex items-center gap-1 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ color: 'var(--lm-ember)' }}
                  >
                    {s.cta}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" aria-hidden />
                  </Link>
                </div>
                <div className="grid gap-5 px-5 py-5 sm:px-6 md:grid-cols-2 md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--lm-ink)' }}>{s.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed" style={{ color: 'var(--lm-muted)' }}>{s.body}</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--lm-shell-2)', border: '1px solid var(--lm-line)' }}>
                    {s.fragment}
                  </div>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * Features: deliberately asymmetric — one large live-shaped demo beside two
 * stacked compact panels. No repeated three-card grid.
 */
export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t" style={{ borderColor: 'var(--lm-line)' }}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          index="03 · Features"
          eyebrow="Capabilities"
          title="Three tools, each shaped like its job"
          lede="Tracking is a table. Matching is a score with reasons. Q&A is a conversation with receipts. Each surface below mirrors the real interface, filled with labelled sample data."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          {/* Large: the applications table, rendered with production primitives. */}
          <Reveal className="lg:col-span-7" variant="scale">
            <div className="lm-shadow flex h-full flex-col overflow-hidden rounded-2xl" style={{ backgroundColor: 'var(--lm-shell)', border: '1px solid var(--lm-line)' }}>
              <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: 'var(--lm-line)' }}>
                <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--lm-muted)' }}>
                  applytrack — applications · sample
                </p>
                <Badge variant="success" size="sm" className="ml-auto font-mono text-[11px]">Live</Badge>
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
              <div className="mt-auto border-t px-5 py-3.5" style={{ borderColor: 'var(--lm-line)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--lm-muted)' }}>
                  Search across companies and roles, filter by stage, edit inline —
                  everything persists to your MongoDB.
                </p>
                <Button variant="outline" size="sm" asChild className="lm-press mt-3">
                  <Link to="/app/applications">
                    Open applications
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>

          {/* Stacked: match + assistant. */}
          <div className="grid gap-5 lg:col-span-5">
            <Reveal delay={110} variant="scale">
              <div className="lm-shadow h-full rounded-2xl p-5 sm:p-6" style={{ backgroundColor: 'var(--lm-shell)', border: '1px solid var(--lm-line)' }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold tracking-tight" style={{ color: 'var(--lm-ink)' }}>Resume–job matching</h3>
                  <Badge variant="success" size="sm" className="font-mono text-[11px]">Live</Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--lm-muted)' }}>
                  A fit score with the skills that overlap, the ones that are
                  missing, and a short explanation — grounded in the two texts
                  you paste.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden>
                  <Badge variant="success" size="sm" className="font-mono text-[11px]">React</Badge>
                  <Badge variant="success" size="sm" className="font-mono text-[11px]">TypeScript</Badge>
                  <Badge variant="warning" size="sm" className="font-mono text-[11px]">GraphQL — missing</Badge>
                  <Badge variant="warning" size="sm" className="font-mono text-[11px]">AWS — missing</Badge>
                </div>
                <Button variant="outline" size="sm" asChild className="lm-press mt-4">
                  <Link to="/app/resume-match">
                    Run a match
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delay={200} variant="scale">
              <div className="lm-shadow h-full rounded-2xl p-5 sm:p-6" style={{ backgroundColor: 'var(--lm-teal)', border: '1px solid transparent' }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold tracking-tight text-white">Resume Q&A</h3>
                  <span className="rounded-sm px-1.5 py-0.5 font-mono text-[11px] font-medium" style={{ backgroundColor: 'var(--lm-green)', color: '#04120a' }}>
                    Live
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Upload your resume as PDF, then ask about experience, skills,
                  or gaps. Answers quote the exact lines they rely on.
                </p>
                <Button size="sm" asChild className="lm-press mt-4 border border-white/25 bg-white/10 text-white hover:bg-white/20">
                  <Link to="/app/resume-assistant">
                    Ask the assistant
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/** How it works: four steps on a rail that draws itself on arrival. */
export function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Log your applications',
      body: 'Add each role with its stage — applied through hired. Search and filter as the pipeline grows.',
    },
    {
      n: '02',
      title: 'Upload your resume',
      body: 'A PDF in the assistant is parsed, chunked, and indexed in your own database for grounded answers.',
    },
    {
      n: '03',
      title: 'Run the match',
      body: 'Compare the resume against a posting for a score with reasons — matched skills, missing skills, explanation.',
    },
    {
      n: '04',
      title: 'Follow up with signal',
      body: 'Missing-skill lists and quoted experience make tailoring concrete before the next interview.',
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 border-t" style={{ borderColor: 'var(--lm-line)', backgroundColor: 'var(--lm-shell)' }}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <SectionHeading
          index="04 · How it works"
          eyebrow="The loop"
          title="From scattered tabs to a clear pipeline"
          lede="Four steps, each mapped to a real surface in the app. Nothing here requires an account — just the app and your database."
        />
        <Reveal className="mt-12">
          <div className="lm-rail h-0.5 rounded-full" style={{ backgroundColor: 'var(--lm-ember)', ['--d' as string]: '200ms' }} aria-hidden />
          <ol className="mt-0 grid gap-8 pt-6 md:grid-cols-4 md:gap-6">
            {steps.map((s) => (
              <li key={s.n} className="relative">
                <span className="absolute -top-[30px] block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--lm-shell)', border: '2px solid var(--lm-ember)' }} aria-hidden />
                <p className="font-mono text-xs font-semibold" style={{ color: 'var(--lm-ember)' }}>{s.n}</p>
                <h3 className="mt-1.5 text-[15px] font-semibold" style={{ color: 'var(--lm-ink)' }}>{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--lm-muted)' }}>{s.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal delay={150}>
          <div className="mt-10 flex flex-wrap gap-2.5">
            <Button asChild className="lm-press">
              <Link to="/app">
                Open the dashboard
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" asChild className="lm-press">
              <a href="#faq">Read the FAQ</a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
