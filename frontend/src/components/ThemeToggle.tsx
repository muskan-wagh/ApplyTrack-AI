import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';

export function ThemeToggle({ label = 'Toggle theme' }: { label?: string }) {
  const { resolvedTheme, toggle } = useTheme();
  const Icon = resolvedTheme === 'dark' ? Sun : Moon;
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={label} title={label}>
      <Icon className="h-4 w-4" aria-hidden />
    </Button>
  );
}
