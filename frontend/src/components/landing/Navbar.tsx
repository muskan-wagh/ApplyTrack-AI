import { useEffect, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '#product', label: 'Product', id: 'product' },
  { href: '#features', label: 'Features', id: 'features' },
  { href: '#how', label: 'How it works', id: 'how' },
  { href: '#faq', label: 'FAQ', id: 'faq' },
];

/** Glass navbar: translucent + blur, hairline border, shadow only after scroll. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: highlight the section currently near the top of the viewport.
  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Close the mobile menu on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open ]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-30 border-b bg-background/70 backdrop-blur-md transition-[box-shadow,background-color,border-color] duration-200',
        scrolled ? 'border-border shadow-[0_1px_12px_rgb(0_0_0/0.06)]' : 'border-transparent'
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link to="/" aria-label="ApplyTrack AI home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <nav aria-label="Site" className="ml-6 hidden items-center gap-0.5 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={l.href}
              aria-current={active === l.id ? 'true' : undefined}
              className={cn(
                'relative rounded-md px-3 py-1.5 text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring',
                active === l.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {l.label}
              <span
                aria-hidden
                className={cn(
                  'absolute inset-x-3 -bottom-px h-px bg-primary transition-opacity',
                  active === l.id ? 'opacity-100' : 'opacity-0'
                )}
              />
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle label="Toggle color theme" />
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/app">
              Open dashboard
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative block h-4 w-4" aria-hidden>
              <Menu
                className={cn(
                  'absolute inset-0 h-4 w-4 transition-all duration-200',
                  open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                )}
              />
              <X
                className={cn(
                  'absolute inset-0 h-4 w-4 transition-all duration-200',
                  open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                )}
              />
            </span>
          </Button>
        </div>
      </div>

      {/* Mobile menu: height/opacity transition, links stagger in. */}
      <div
        id="mobile-menu"
        className={cn(
          'grid overflow-hidden border-border transition-all duration-200 ease-out md:hidden',
          open ? 'grid-rows-[1fr] border-t opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <nav aria-label="Mobile" className="min-h-0 overflow-hidden">
          <ul className="space-y-0.5 px-4 py-3">
            {LINKS.map((l, i) => (
              <li
                key={l.id}
                style={{ transitionDelay: open ? `${40 + i * 40}ms` : '0ms' }}
                className={cn(
                  'transition-all duration-200',
                  open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
                )}
              >
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active === l.id
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  )}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li
              style={{ transitionDelay: open ? '200ms' : '0ms' }}
              className={cn(
                'pt-1 transition-all duration-200',
                open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
              )}
            >
              <Button asChild className="w-full">
                <Link to="/app" onClick={() => setOpen(false)}>
                  Open dashboard
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
