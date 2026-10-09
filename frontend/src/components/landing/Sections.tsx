import { ArrowRight, ArrowUpRight, Bot, FileSearch, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/landing/Reveal';
import { SectionHeading } from '@/components/landing/SectionHeading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';

/** Product overview: editorial split — what it is on the left, where to find it on the right. */
export function Overview() {
  const surfaces = [
    {
      icon: ListChecks,
      name: 'Overview & Applications',
      to: '/app/applications',
      body: 'Every application with its stage, searchable and filterable. Backed by the applications API — live now.',
    },
    {
      icon: FileSearch,
      name: 'Resume Match',
      to: '/app/resume-match',
      body: 'Score, matched and missing skills per job description. UI is ready; the matching endpoint is still to come.',
    },
    {
      icon: Bot,
      name: 'Resume Assistant',
      to: '/app/resume-assistant',
      body: 'Upload a PDF resume, then ask questions answered with quoted evidence. Live, powered by the RAG API.',
    },
  ];
  return (
    <section id="product" className="scroll-mt-20 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div>
          <SectionHeading
            eyebrow="Product"
            title="A job search you can actually keep track of"
            lede="Applications pile up across tabs, inboxes, and spreadsheets. ApplyTrack AI gives them one home — and adds resume intelligence on top, so each application also tells you how well you fit."
          />
          <Reveal delay={120}>
            <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              {[
                'One table for every application, stage, and source',
                'Fit analysis against the exact posting you are reading',
                'Answers grounded in your resume — with the lines quoted',
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span className="text-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={150}>
          <ul className="divide-y rounded-lg border bg-card">
            {surfaces.map((s) => (
              <li key={s.name}>
                <Link
                  to={s.to}
                  className="group flex items-start gap-3.5 rounded-lg p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted transition-colors group-hover:border-primary/40">
                    <s.icon className="h-4 w-4 text-foreground" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      {s.name}
                      <ArrowUpRight
                        className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-px group-hover:-translate-y-px group-hover:text-foreground"
                        aria-hidden
                      />
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {s.body}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/** Feature showcase: three deliberately different treatments, no repeated cards. */
export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Features"
          title="Three tools, each shaped like its job"
          lede="Tracking is a table. Matching is a score with reasons. Q&A is a conversation with receipts. Each surface below mirrors the real interface."
        />

        {/* 1 — Tracking: split with a mini pipeline strip */}
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Application tracking
              </h3>
              <Badge variant="success" size="sm" className="font-mono text-[11px]">Live</Badge>
            </div>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Log company, role, stage, location, and source for every application. Search
              across companies and roles, filter by stage, and edit inline — everything
              persists to your MongoDB through the applications API.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link to="/app/applications">
                Open applications
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-lg border bg-card p-4">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Stages · sample labels
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Example statuses">
                <StatusBadge status="applied" />
                <span className="text-muted-foreground" aria-hidden>→</span>
                <StatusBadge status="screening" />
                <span className="text-muted-foreground" aria-hidden>→</span>
                <StatusBadge status="interview" />
                <span className="text-muted-foreground" aria-hidden>→</span>
                <StatusBadge status="offer" />
              </div>
              <div className="mt-3 border-t pt-3 font-mono text-xs text-muted-foreground">
                GET /api/applications?q=&amp;status=&amp;sort=
              </div>
            </div>
          </Reveal>
        </div>

        {/* 2 — Match: reversed split with a score panel */}
        <div className="mt-14 grid items-center gap-8 lg:grid-cols-2">
          <Reveal className="lg:order-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Resume–job matching
              </h3>
              <Badge variant="secondary" size="sm" className="font-mono text-[11px]">Coming soon</Badge>
            </div>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Paste a job description next to your resume and get a fit score with the
              skills that overlap, the ones that are missing, and a short explanation.
              The interface is built — it lights up as soon as the matching endpoint ships.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link to="/app/resume-match">
                Preview the interface
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </Reveal>
          <Reveal delay={120} className="lg:order-1">
            <div className="rounded-lg border bg-card p-5" aria-label="Sample match result illustration">
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  Sample result
                </p>
                <p className="font-mono text-3xl font-semibold text-foreground">
                  82<span className="text-sm font-normal text-muted-foreground">/100</span>
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full w-[82%] rounded-full bg-primary" />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden>
                <Badge variant="success" size="sm" className="font-mono text-[11px]">React</Badge>
                <Badge variant="success" size="sm" className="font-mono text-[11px]">TypeScript</Badge>
                <Badge variant="success" size="sm" className="font-mono text-[11px]">Node.js</Badge>
                <Badge variant="warning" size="sm" className="font-mono text-[11px]">GraphQL — missing</Badge>
                <Badge variant="warning" size="sm" className="font-mono text-[11px]">AWS — missing</Badge>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 3 — Q&A: full-width conversation band */}
        <Reveal className="mt-14">
          <div className="grid gap-8 rounded-lg border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">Resume Q&A</h3>
                <Badge variant="success" size="sm" className="font-mono text-[11px]">Live</Badge>
              </div>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Upload your resume as PDF, then ask about experience, skills, or gaps.
                Answers are grounded in retrieved resume chunks and quote the exact lines
                they rely on — or say plainly when the resume holds no evidence.
              </p>
              <Button variant="outline" size="sm" asChild className="mt-4">
                <Link to="/app/resume-assistant">
                  Ask the assistant
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
            <div className="space-y-2.5" aria-label="Sample conversation illustration">
              <div className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground">
                What backend experience does this resume show?
              </div>
              <div className="max-w-[92%] rounded-lg rounded-bl-sm border bg-background px-3.5 py-2.5">
                <p className="text-sm leading-relaxed text-foreground">
                  Three years of Node.js API work, including a Postgres migration and
                  request-latency improvements.
                </p>
                <p className="mt-2 border-t pt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  “Reduced p95 latency from 900ms to 220ms on the billing API…”
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** How it works: vertical timeline, four honest steps. */
export function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Log your applications',
      body: 'Add each role with its stage — applied, screening, interview, offer, hired, rejected, or withdrawn. Search and filter as the pipeline grows.',
    },
    {
      n: '02',
      title: 'Upload your resume',
      body: 'Upload a PDF resume in the assistant. It is parsed, chunked, and indexed in your own database so questions can be answered from it.',
    },
    {
      n: '03',
      title: 'Check the fit, ask questions',
      body: 'Compare the resume against a posting for a score with reasons (matching endpoint coming soon), and ask the assistant anything — answers quote their evidence.',
    },
    {
      n: '04',
      title: 'Follow up with signal',
      body: 'Missing-skill lists and quoted experience make tailoring concrete: you know what to emphasize before the next interview.',
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 border-t bg-card">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="How it works"
          title="From scattered tabs to a clear pipeline"
          lede="Four steps, each mapped to a real surface in the app. Nothing here requires an account — just the app and your database."
        />
        <ol className="mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <li className="relative border-t-2 border-primary/50 pt-4">
                <p className="font-mono text-xs font-semibold text-primary">{s.n}</p>
                <h3 className="mt-1.5 text-[15px] font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
