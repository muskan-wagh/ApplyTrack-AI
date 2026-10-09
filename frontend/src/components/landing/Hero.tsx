import { ArrowDown, ArrowRight, FileText, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Illustrative product-flow mockup: resume document → fit analysis →
 * quoted evidence. Entirely static sample content, labelled as such —
 * never presented as live data.
 */
function FlowMockup() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <p className="font-mono text-xs text-muted-foreground">resume.pdf → senior-frontend-posting</p>
        <Badge variant="outline" size="sm" className="font-mono text-[11px] uppercase tracking-wide">
          Illustrative preview
        </Badge>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch sm:gap-2">
        {/* Resume document */}
        <div className="rounded-md border bg-background p-3">
          <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-foreground">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            resume.pdf
          </p>
          <div className="mt-2.5 space-y-1.5" aria-hidden>
            {[92, 100, 84, 96, 70].map((w, i) => (
              <div key={i} className="h-1.5 rounded-sm bg-muted" style={{ width: `${w}%` }} />
            ))}
          </div>
          <p className="mt-2.5 font-mono text-[11px] text-muted-foreground">PDF · parsed into chunks</p>
        </div>

        <div className="flex items-center justify-center" aria-hidden>
          <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
        </div>

        {/* Fit analysis */}
        <div className="rounded-md border bg-background p-3">
          <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Fit analysis
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            82<span className="text-sm font-normal text-muted-foreground">/100</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="flow-bar h-full rounded-full bg-primary" style={{ width: '82%' }} />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1" aria-hidden>
            <Badge variant="success" size="sm" className="font-mono text-[10px]">React</Badge>
            <Badge variant="success" size="sm" className="font-mono text-[10px]">TypeScript</Badge>
            <Badge variant="warning" size="sm" className="font-mono text-[10px]">+GraphQL?</Badge>
          </div>
        </div>

        <div className="flex items-center justify-center" aria-hidden>
          <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <ArrowDown className="h-4 w-4 text-muted-foreground sm:hidden" />
        </div>

        {/* Evidence quote */}
        <div className="rounded-md border bg-background p-3">
          <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Quote className="h-3 w-3" aria-hidden />
            Evidence
          </p>
          <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
            “Led migration of the checkout flow to React + TypeScript…”
          </p>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 pt-28 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-2xl text-center">
        <p
          className="animate-enter font-mono text-xs font-medium uppercase tracking-widest text-primary"
          style={{ animationDelay: '0ms' }}
        >
          Application tracker + resume intelligence
        </p>
        <h1
          className="animate-enter mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]"
          style={{ animationDelay: '90ms' }}
        >
          Track every application. Know exactly where you fit.
        </h1>
        <p
          className="animate-enter mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base"
          style={{ animationDelay: '180ms' }}
        >
          ApplyTrack AI logs each application with its hiring stage, scores your resume
          against any job description, and answers questions over your resume with
          quoted evidence — all from your own database.
        </p>
        <div
          className="animate-enter mt-7 flex flex-wrap items-center justify-center gap-2"
          style={{ animationDelay: '270ms' }}
        >
          <Button size="lg" asChild className="transition-transform active:scale-[0.98]">
            <Link to="/app">
              Open the dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="transition-transform active:scale-[0.98]">
            <a href="#how">See how it works</a>
          </Button>
        </div>
        <p
          className="animate-enter mt-4 font-mono text-xs text-muted-foreground"
          style={{ animationDelay: '340ms' }}
        >
          No account needed · Your records live in your own MongoDB
        </p>
      </div>
      <div className="animate-enter-preview mx-auto mt-10 max-w-4xl" style={{ animationDelay: '420ms' }}>
        <FlowMockup />
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Illustrative preview with sample content — the dashboard shows your live records.
        </p>
      </div>
    </section>
  );
}
