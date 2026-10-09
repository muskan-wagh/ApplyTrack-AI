import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

/**
 * Living page background: fixed, pointer-transparent, four parallax layers.
 * - Pipeline rails: thin full-bleed rules, each carrying small stage
 *   markers that travel left → right on long loops (the product's own
 *   applied → interview → offer motif, abstracted).
 * - Slowly drifting solid plates: bordered square, ring, ember + teal tiles.
 * - Scattered interface markers: plus signs, mono annotations, signal dots.
 * - Fine grain overlay for a printed, editorial finish.
 * Motion only *enhances*: without JS the page simply sits on the paper
 * color. All scroll listeners are Motion-managed and clean up on unmount.
 */
const RAILS = [
  { top: '24%', duration: '34s', delay: '-8s', dot: 'var(--lm-ember)', size: 7 },
  { top: '52%', duration: '46s', delay: '-22s', dot: 'var(--lm-teal)', size: 6 },
  { top: '76%', duration: '58s', delay: '-37s', dot: 'var(--lm-gold)', size: 5 },
];

export function Backdrop() {
  const reduce = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll();

  // Distinct scroll multipliers per layer give the parallax depth.
  const railsY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const platesY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const marksY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const railsOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0.3]);

  const static_ = reduce;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Base paper wash: solid landing color. */}
      <div className="lm-paper absolute inset-0" />

      {/* Layer 1 — pipeline rails with travelling stage markers. */}
      <motion.div className="absolute inset-0" style={static_ ? undefined : { y: railsY, opacity: railsOpacity }}>
        {RAILS.map((r) => (
          <div key={r.top} className="absolute inset-x-0 hidden sm:block" style={{ top: r.top }}>
            <div className="lm-rail-line" style={{ opacity: 0.55 }} />
            {!static_ && (
              <span
                className="lm-travel absolute left-0 top-0 block"
                style={
                  {
                    ['--t' as string]: r.duration,
                    ['--td' as string]: r.delay,
                    transform: 'translateY(-50%)',
                  }
                }
              >
                <i
                  className="block rounded-full"
                  style={{ width: r.size, height: r.size, backgroundColor: r.dot, opacity: 0.9 }}
                />
              </span>
            )}
          </div>
        ))}
      </motion.div>

      {/* Layer 2 — drifting solid plates. */}
      <motion.div className="absolute inset-0" style={static_ ? undefined : { y: platesY }}>
        {/* Large bordered square, upper right. */}
        <div
          className="lm-drift-a absolute -right-24 top-[8%] hidden h-96 w-96 rounded-[28px] border sm:block"
          style={{ borderColor: 'var(--lm-line)', ['--rot' as string]: '12deg' }}
        />
        {/* Sunken square inside it for layered depth. */}
        <div
          className="lm-drift-b absolute right-10 top-[16%] hidden h-40 w-40 rounded-2xl sm:block"
          style={{ backgroundColor: 'var(--lm-shell-2)', border: '1px solid var(--lm-line)', ['--rot' as string]: '12deg' }}
        />
        {/* Outlined ring, lower left. */}
        <div
          className="lm-drift-b absolute -left-28 top-[46%] hidden h-80 w-80 rounded-full border md:block"
          style={{ borderColor: 'var(--lm-line)', ['--rot' as string]: '0deg' }}
        />
        {/* Small solid ember tile — the restrained accent. */}
        <div
          className="lm-drift-a absolute left-[8%] top-[13%] h-10 w-10 rounded-lg"
          style={{ backgroundColor: 'var(--lm-ember)', opacity: 0.9, ['--rot' as string]: '-8deg' }}
        />
        {/* Small teal tile balancing the lower right. */}
        <div
          className="lm-drift-b absolute bottom-[16%] right-[10%] hidden h-14 w-14 rounded-xl lg:block"
          style={{ backgroundColor: 'var(--lm-teal)', opacity: 0.85, ['--rot' as string]: '10deg' }}
        />
      </motion.div>

      {/* Layer 3 — small interface markers drifting the opposite way. */}
      <motion.div className="absolute inset-0" style={static_ ? undefined : { y: marksY }}>
        <span className="lm-drift-a absolute left-[16%] top-[38%] font-mono text-lg" style={{ color: 'var(--lm-line)', ['--rot' as string]: '0deg' }}>
          +
        </span>
        <span className="lm-drift-b absolute right-[18%] top-[60%] hidden font-mono text-lg sm:block" style={{ color: 'var(--lm-line)', ['--rot' as string]: '0deg' }}>
          +
        </span>
        <span className="absolute left-[46%] top-[7%] hidden h-2 w-2 rounded-full md:block" style={{ backgroundColor: 'var(--lm-gold)', opacity: 0.8 }} />
        <span className="absolute bottom-[10%] left-[38%] hidden h-2 w-2 rounded-full md:block" style={{ backgroundColor: 'var(--lm-green)', opacity: 0.8 }} />
        <span className="lm-drift-a absolute right-[30%] top-[24%] hidden font-mono text-[10px] tracking-widest lg:block" style={{ color: 'var(--lm-muted)', opacity: 0.8, ['--rot' as string]: '0deg' }}>
          001
        </span>
        <span className="lm-drift-b absolute left-[26%] top-[82%] hidden font-mono text-[10px] tracking-widest lg:block" style={{ color: 'var(--lm-muted)', opacity: 0.8, ['--rot' as string]: '0deg' }}>
          004
        </span>
      </motion.div>

      {/* Layer 4 — grain sits on top, unifies the layers like print. */}
      <div className="lm-grain absolute inset-0" style={{ opacity: 'var(--lm-grain-opacity)' }} />
    </div>
  );
}
