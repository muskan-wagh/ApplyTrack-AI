import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Reveal-on-scroll wrapper. Adds `.is-visible` once the element enters the
 * viewport; the actual transition lives in CSS so `prefers-reduced-motion`
 * is honoured globally. Optional `delay` staggers siblings (ms).
 * `variant="scale"` settles panels with a whisper of scale for depth.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = 'rise',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: 'rise' | 'scale';
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(variant === 'scale' ? 'reveal-scale' : 'reveal', visible && 'is-visible', className)}
    >
      {children}
    </div>
  );
}
