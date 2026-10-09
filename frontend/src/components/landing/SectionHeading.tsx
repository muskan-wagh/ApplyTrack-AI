import { Reveal } from '@/components/landing/Reveal';

/** Consistent section header: mono index, violet eyebrow, large tight title. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  lede,
}: {
  index: string;
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <Reveal>
      <p className="lm-index">{index}</p>
      <p className="lm-eyebrow mt-2">{eyebrow}</p>
      <h2
        className="mt-3 max-w-xl text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl sm:leading-[1.08]"
        style={{ color: 'var(--lm-ink)' }}
      >
        {title}
      </h2>
      {lede && (
        <p className="mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed" style={{ color: 'var(--lm-muted)' }}>
          {lede}
        </p>
      )}
    </Reveal>
  );
}
