import { ArrowRight, Check, FileText, Quote, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';

/**
 * Hero product frame: a faithful, clearly-labelled illustration of the real
 * Resume Match screen (`/app/resume-match`, `MatchResult` shape). Sample
 * content only — permanently badged as an illustrative preview.
 * Layers enter in sequence via CSS `--d` delays: frame → document →
 * analysis → meter fill → matched chips → missing chips → evidence →
 * floating satellites.
 */
export function MatchPreview() {
  return (
    <div className="relative">
      <div
        className="lm-panel lm-shadow relative overflow-hidden rounded-2xl"
        style={
          {
            ['--d' as string]: '1000ms',
            backgroundColor: 'var(--lm-shell)',
            border: '1px solid var(--lm-line)',
          }
        }
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3 sm:px-5"
          style={{ borderColor: 'var(--lm-line)' }}
        >
          <span className="flex gap-1.5" aria-hidden>
            <i className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#e0605e' }} />
            <i className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#e6b93d' }} />
            <i className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: 'var(--lm-green)' }} />
          </span>
          <p className="truncate font-mono text-xs" style={{ color: 'var(--lm-muted)' }}>
            applytrack — resume-match
          </p>
          <Badge
            variant="outline"
            size="sm"
            className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-widest"
          >
            Illustrative preview
          </Badge>
        </div>

        {/* One-shot scan sweep: a 1px solid rule crossing the frame. */}
        <div
          aria-hidden
          className="lm-scan pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px"
          style={{ ['--d' as string]: '1500ms', backgroundColor: 'var(--lm-ember)', opacity: 0.5 }}
        />

        <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[1fr_1.25fr]">
          {/* Resume document */}
          <div
            className="lm lm-rise rounded-xl p-4"
            style={
              {
                ['--d' as string]: '1180ms',
                backgroundColor: 'var(--lm-shell-2)',
                border: '1px solid var(--lm-line)',
              }
            }
          >
            <p className="flex items-center gap-2 font-mono text-xs font-semibold" style={{ color: 'var(--lm-ink)' }}>
              <FileText className="h-4 w-4" style={{ color: 'var(--lm-muted)' }} aria-hidden />
              resume.pdf
            </p>
            <div className="mt-4 space-y-2" aria-hidden>
              {[96, 88, 100, 74, 91, 64].map((w, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-sm"
                  style={{ width: `${w}%`, backgroundColor: 'var(--lm-line)' }}
                />
              ))}
            </div>
            <div
              className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ border: '1px solid var(--lm-line)', backgroundColor: 'var(--lm-shell)' }}
            >
              <Badge variant="success" size="sm" className="font-mono text-[10px]">
                Resume on file
              </Badge>
              <p className="truncate font-mono text-[11px]" style={{ color: 'var(--lm-muted)' }}>
                14 chunks indexed
              </p>
            </div>
            <p className="mt-3 font-mono text-[11px]" style={{ color: 'var(--lm-muted)' }}>
              PDF · parsed into chunks
            </p>
          </div>

          {/* Fit analysis */}
          <div
            className="lm lm-rise rounded-xl p-4 sm:p-5"
            style={
              {
                ['--d' as string]: '1330ms',
                backgroundColor: 'var(--lm-shell-2)',
                border: '1px solid var(--lm-line)',
              }
            }
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--lm-muted)' }}>
                Fit analysis · sample
              </p>
              <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: 'var(--lm-green)' }}>
                Strong fit
              </p>
            </div>
            <p className="mt-1 font-mono text-5xl font-semibold tracking-tight" style={{ color: 'var(--lm-ink)' }}>
              82
              <span className="text-base font-normal" style={{ color: 'var(--lm-muted)' }}>
                /100
              </span>
            </p>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full"
              style={{ backgroundColor: 'var(--lm-line)' }}
              role="img"
              aria-label="Sample match score 82 out of 100"
            >
              <div
                className="lm-fill h-full rounded-full"
                style={{ ['--d' as string]: '1560ms', ['--w' as string]: '82%', backgroundColor: 'var(--lm-green)' }}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--lm-ink)' }}>
                  <Check className="h-3.5 w-3.5" style={{ color: 'var(--lm-green)' }} aria-hidden />
                  Matched
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['React', 'TypeScript', 'Node.js'].map((s, i) => (
                    <Badge
                      key={s}
                      variant="success"
                      size="sm"
                      className="lm lm-chip font-mono text-[10px]"
                      style={{ ['--d' as string]: `${1700 + i * 110}ms` }}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--lm-ink)' }}>
                  <X className="h-3.5 w-3.5 text-destructive" aria-hidden />
                  Missing
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['GraphQL', 'AWS'].map((s, i) => (
                    <Badge
                      key={s}
                      variant="warning"
                      size="sm"
                      className="lm lm-chip font-mono text-[10px]"
                      style={{ ['--d' as string]: `${2030 + i * 110}ms` }}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="lm lm-rise mt-4 rounded-lg px-3.5 py-3"
              style={{ ['--d' as string]: '2220ms', border: '1px solid var(--lm-line)', backgroundColor: 'var(--lm-shell)' }}
            >
              <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--lm-muted)' }}>
                <Quote className="h-3 w-3" aria-hidden />
                Why this score
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--lm-muted)' }}>
                “Led migration of the checkout flow to React + TypeScript; no
                GraphQL or AWS exposure evident in the pasted text…”
              </p>
            </div>
          </div>
        </div>

        {/* Status strip */}
        <div
          className="lm lm-fade flex items-center gap-2 border-t px-4 py-2.5 sm:px-5"
          style={{ ['--d' as string]: '2380ms', borderColor: 'var(--lm-line)' }}
        >
          <span className="lm-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--lm-green)' }} aria-hidden />
          <p className="truncate font-mono text-[11px]" style={{ color: 'var(--lm-muted)' }}>
            POST /api/match · sample inputs → sample result
          </p>
          <p className="ml-auto hidden shrink-0 items-center gap-1 font-mono text-[11px] sm:flex" style={{ color: 'var(--lm-muted)' }}>
            Analysis complete
            <ArrowRight className="h-3 w-3" aria-hidden />
          </p>
        </div>
      </div>

      {/* Floating satellites: settle in last, desktop only. */}
      <div
        className="lm lm-chip lm-shadow absolute -right-8 -top-10 hidden w-56 rounded-xl p-3.5 xl:block"
        style={{ ['--d' as string]: '2480ms', backgroundColor: 'var(--lm-shell)', border: '1px solid var(--lm-line)' }}
      >
        <Badge variant="warning" size="sm" className="font-mono text-[10px]">
          Gap to close
        </Badge>
        <p className="mt-2 text-[13px] font-semibold leading-snug" style={{ color: 'var(--lm-ink)' }}>
          GraphQL — not evidenced
        </p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--lm-muted)' }}>
          Add one project line before applying.
        </p>
      </div>
      <div
        className="lm lm-chip lm-shadow absolute -bottom-8 -left-8 hidden w-60 rounded-xl p-3.5 xl:block"
        style={{ ['--d' as string]: '2600ms', backgroundColor: 'var(--lm-teal)', border: '1px solid transparent' }}
      >
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/70">
          Tracked alongside
        </p>
        <p className="mt-1.5 text-[13px] font-semibold text-white">Acme Corp · Frontend</p>
        <p className="mt-2">
          <StatusBadge status="interview" className="border-white/20" />
        </p>
      </div>
    </div>
  );
}
