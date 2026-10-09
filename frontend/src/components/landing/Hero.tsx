import { useCallback, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MatchPreview } from '@/components/landing/MatchPreview';
import { Button } from '@/components/ui/button';

/** Rotating headline angles — click (or keyboard) cycles through them. */
const ANGLES = ['where you fit.', "what's missing.", 'what to say next.'];

function RotatingAngle() {
  const reduce = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const next = useCallback(() => setIndex((i) => (i + 1) % ANGLES.length), []);

  if (reduce) {
    return <span>{ANGLES[0]}</span>;
  }
  return (
    <button
      type="button"
      onClick={next}
      title="Click to see another angle"
      aria-label={`Headline angle ${index + 1} of ${ANGLES.length}: ${ANGLES[index]} Activate to see the next angle.`}
      className="lm-press cursor-pointer rounded-sm underline decoration-dotted decoration-2 underline-offset-8 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ textDecorationColor: 'var(--lm-ember)' }}
    >
      <span key={index} className="lm-word" aria-hidden={false}>
        <span>{ANGLES[index]}</span>
      </span>
    </button>
  );
}

export function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-14 pt-28 sm:px-6 sm:pt-36">
      <div className="mx-auto max-w-3xl text-center">
        <p
          className="lm lm-rise inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ ['--d' as string]: '150ms', color: 'var(--lm-ember)' }}
        >
          <span className="lm-pulse h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--lm-green)' }} aria-hidden />
          Application tracker + resume intelligence
        </p>

        <h1
          className="mt-5 text-balance text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-[4.4rem]"
          style={{ color: 'var(--lm-ink)' }}
          aria-live="polite"
        >
          <span className="lm-mask">
            <span className="lm lm-line" style={{ ['--d' as string]: '280ms' }}>
              Track every application.
            </span>
          </span>
          <span className="lm-mask">
            <span className="lm lm-line" style={{ ['--d' as string]: '400ms' }}>
              Know exactly <RotatingAngle />
            </span>
          </span>
        </h1>

        <p
          className="lm lm-rise mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-relaxed sm:text-base"
          style={{ ['--d' as string]: '560ms', color: 'var(--lm-muted)' }}
        >
          ApplyTrack AI logs each application with its hiring stage, scores your
          resume against any job description, and answers questions over your
          resume with quoted evidence — all from your own database.
        </p>

        <div
          className="lm lm-rise mt-8 flex flex-wrap items-center justify-center gap-2.5"
          style={{ ['--d' as string]: '680ms' }}
        >
          <Button size="lg" asChild className="lm-press">
            <Link to="/app">
              Open the dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="lm-press">
            <a href="#how">See how it works</a>
          </Button>
        </div>

        <p
          className="lm lm-fade mt-4 font-mono text-xs"
          style={{ ['--d' as string]: '800ms', color: 'var(--lm-muted)' }}
        >
          No account needed · Your records live in your own MongoDB
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl sm:mt-14">
        <MatchPreview />
        <p
          className="lm lm-fade mt-8 text-center text-xs xl:mt-10"
          style={{ ['--d' as string]: '2700ms', color: 'var(--lm-muted)' }}
        >
          Illustrative preview with sample content — the dashboard shows your live records.
        </p>
      </div>
    </section>
  );
}
