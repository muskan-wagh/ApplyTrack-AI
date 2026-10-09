import { Reveal } from '@/components/landing/Reveal';

/** Consistent section header: mono eyebrow, tight title, short lede. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <Reveal>
      <p className="font-mono text-xs font-medium uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">
        {title}
      </h2>
      {lede && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{lede}</p>}
    </Reveal>
  );
}
