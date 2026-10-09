import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (v: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const current = value ?? internal;
  const handle = (v: string) => {
    setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: current, onValueChange: handle }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
  ...props
}: { className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = React.useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') {
      return;
    }
    const tabs = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []
    );
    const idx = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    e.preventDefault();
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    tabs[next]?.focus();
    tabs[next]?.click();
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={cn('inline-flex items-center gap-0.5 rounded-lg border bg-muted p-1', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');
  const selected = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border bg-card text-foreground shadow-sm'
          : 'border border-transparent text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}
