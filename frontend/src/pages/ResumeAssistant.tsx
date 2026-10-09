import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bot, Loader2, Quote, Send, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api, type AssistantAnswer } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: AssistantAnswer['sources'];
  error?: string;
}

let nextId = 0;
const uid = () => `msg-${Date.now()}-${(nextId += 1)}`;

const INTRO: ChatMessage = {
  id: 'intro',
  role: 'assistant',
  text: 'Ask me about the uploaded resume — experience, skills, gaps, or how to tailor it for a role. Answers quote the resume lines they are based on.',
};

function Sources({ sources }: { sources: AssistantAnswer['sources'] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-2.5 space-y-1.5 border-t pt-2.5">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        Evidence · {sources.length}
      </p>
      {sources.map((s, i) => (
        <figure key={`${s.label}-${i}`} className="rounded-md border bg-muted px-2.5 py-2">
          <figcaption className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-foreground">
            <Quote className="h-3 w-3" aria-hidden />
            {s.label}
          </figcaption>
          <blockquote className="mt-1 font-mono text-xs leading-relaxed text-muted-foreground">
            {s.snippet}
          </blockquote>
        </figure>
      ))}
    </div>
  );
}

export function ResumeAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const pendingId = useRef<string>('');

  const ask = useMutation({
    mutationFn: (question: string) => api.askAssistant({ question }),
    onSuccess: (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId.current
            ? { ...m, text: data.answer || '(The service returned an empty answer.)', sources: data.sources ?? [] }
            : m
        )
      );
    },
    onError: (e) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId.current
            ? {
                ...m,
                text: '',
                error:
                  (e as Error)?.message ??
                  'The assistant service could not be reached.',
              }
            : m
        )
      );
    },
  });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const question = draft.trim();
    if (!question || ask.isPending) return;
    const userMsg: ChatMessage = { id: uid(), role: 'user', text: question };
    const pendingMsg: ChatMessage = { id: uid(), role: 'assistant', text: '' };
    pendingId.current = pendingMsg.id;
    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setDraft('');
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
    ask.mutate(question);
  };

  const retry = (failed: ChatMessage) => {
    const prevUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!prevUser) return;
    pendingId.current = failed.id;
    setMessages((prev) => prev.map((m) => (m.id === failed.id ? { ...m, error: undefined, text: '' } : m)));
    ask.mutate(prevUser.text);
  };

  return (
    <Card className="flex min-h-[480px] flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b py-3.5">
        <CardTitle className="text-[13px]">Resume assistant</CardTitle>
        <Badge variant="secondary" size="sm" className="font-mono text-[11px]">
          Backend pending
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        <div ref={listRef} className="max-h-[52vh] flex-1 space-y-4 overflow-y-auto p-5" role="log" aria-label="Conversation">
          {messages.map((m) => (
            <div key={m.id} className={cn('flex gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
                aria-hidden
              >
                {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </span>
              <div
                className={cn(
                  'max-w-[80%] rounded-lg border px-3 py-2 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground'
                )}
              >
                {m.error ? (
                  <div className="space-y-2">
                    <p className="text-destructive">{m.error}</p>
                    <p className="rounded-md bg-muted px-2.5 py-2 font-mono text-xs text-muted-foreground">
                      POST /api/rag/query — not implemented yet (backend Phase 5).
                    </p>
                    <Button variant="outline" size="sm" onClick={() => retry(m)}>
                      Retry
                    </Button>
                  </div>
                ) : m.text ? (
                  <>
                    <p className={m.role === 'user' ? undefined : 'text-foreground'}>{m.text}</p>
                    {m.sources && <Sources sources={m.sources} />}
                  </>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground" role="status">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Thinking…
                  </span>
                )}
              </div>
            </div>
          ))}
          {messages.length === 1 && (
            <p className="text-center font-mono text-xs text-muted-foreground">
              Conversation stays in this session · Nothing is stored
            </p>
          )}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t p-4">
          <label htmlFor="assistant-input" className="sr-only">
            Ask about your resume
          </label>
          <Input
            id="assistant-input"
            placeholder="e.g. What backend experience does this resume show?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={ask.isPending}
            autoComplete="off"
          />
          <Button type="submit" disabled={!draft.trim() || ask.isPending} aria-label="Send question">
            {ask.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
