import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, FileUp, Loader2, Quote, Send, Sparkles, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { api, type AssistantAnswer } from '@/lib/api';
import { cn } from '@/lib/utils';

const MAX_UPLOAD_MB = 5;

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
  text: 'Ask me about the uploaded resume — experience, skills, gaps, or how to tailor it for a role. Answers quote the resume lines they are based on. If a question can’t be answered from the resume, I’ll say so directly.',
};

const EXAMPLES = [
  'What backend experience does this resume show?',
  'Which skills match a frontend engineer role?',
  'What gaps should I fill before applying?',
  'Summarize this experience in 3 bullets',
];

function Sources({ sources }: { sources: AssistantAnswer['sources'] }) {
  if (sources.length === 0) return null;
  return (
    <section aria-label={`Supporting resume excerpts, ${sources.length} shown`} className="mt-2.5 space-y-1.5 border-t pt-2.5">
      <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        Supporting excerpts · {sources.length}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Exact lines from your uploaded resume that support the answer above, most relevant first.
      </p>
      <ol className="space-y-1.5">
        {sources.map((s, i) => (
          <li key={`excerpt-${i}`}>
            <figure className="rounded-lg border bg-muted px-2.5 py-2">
              <figcaption className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-foreground">
                <Quote className="h-3 w-3 shrink-0" aria-hidden />
                Excerpt {i + 1} of {sources.length}
              </figcaption>
              <blockquote className="mt-1 font-mono text-xs leading-relaxed text-muted-foreground">
                {s.snippet}
              </blockquote>
            </figure>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ResumeAssistantPage() {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);
  const [draft, setDraft] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingId = useRef<string>('');

  const resumeQuery = useQuery({
    queryKey: ['resume-current'],
    queryFn: api.getCurrentResume,
  });
  const resume = resumeQuery.data ?? null;

  const upload = useMutation({
    mutationFn: (file: File) => api.uploadResume(file),
    onSuccess: () => {
      setFileError(null);
      if (fileRef.current) fileRef.current.value = '';
      void qc.invalidateQueries({ queryKey: ['resume-current'] });
    },
    onError: (e) => {
      setFileError((e as Error)?.message ?? 'The resume could not be uploaded.');
    },
  });

  const pickFile = (file: File | undefined) => {
    if (!file || upload.isPending) return;
    if (!/\.pdf$/i.test(file.name)) {
      setFileError('Choose a PDF file (.pdf). Scanned/image-only PDFs are not supported.');
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setFileError(`That file is larger than ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    if (file.size === 0) {
      setFileError('That file looks empty. Choose a valid PDF resume.');
      return;
    }
    setFileError(null);
    upload.mutate(file);
  };

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
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });
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

  const sendQuestion = (raw: string) => {
    const question = raw.trim();
    if (!question || ask.isPending || !resume) return;
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

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(draft);
  };

  const retry = (failed: ChatMessage) => {
    const prevUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!prevUser) return;
    pendingId.current = failed.id;
    setMessages((prev) => prev.map((m) => (m.id === failed.id ? { ...m, error: undefined, text: '' } : m)));
    ask.mutate(prevUser.text);
  };

  const statusBadge = resumeQuery.isPending ? (
    <Badge variant="secondary" size="sm" className="font-mono text-[11px]">
      Checking…
    </Badge>
  ) : resume ? (
    <Badge variant="success" size="sm" className="font-mono text-[11px]">
      Ready · {resume.chunkCount} chunks
    </Badge>
  ) : (
    <Badge variant="secondary" size="sm" className="font-mono text-[11px]">
      No resume
    </Badge>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Resume Assistant"
        title="Ask your resume"
        description="Grounded Q&A over the uploaded PDF. Every answer cites the resume lines it used — unsupported questions get an honest fallback, never a guess."
      />

      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* Resume source */}
        <div className="grid gap-4 lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-1">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <FileUp className="h-4 w-4 text-muted-foreground" aria-hidden />
                Resume source
              </CardTitle>
              {statusBadge}
            </CardHeader>
            <CardContent className="space-y-3">
              {resumeQuery.isPending ? (
                <div className="space-y-2" aria-label="Checking resume status">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : resumeQuery.isError ? (
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {(resumeQuery.error as Error)?.message ?? 'Could not reach the backend.'}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => void resumeQuery.refetch()}>
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  {resume ? (
                    <dl className="rounded-lg border bg-muted px-3 py-2.5">
                      <dt className="sr-only">Uploaded resume</dt>
                      <dd className="truncate text-[13px] font-semibold text-foreground">
                        {resume.filename}
                      </dd>
                      <dd className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {resume.chunkCount} chunks · {resume.charCount.toLocaleString()} chars ·{' '}
                        {new Date(resume.uploadedAt).toLocaleDateString()}
                      </dd>
                    </dl>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Upload a PDF resume to enable grounded answers. Re-uploading replaces the
                      current resume.
                    </p>
                  )}
                  <div className="grid gap-2">
                    <label htmlFor="resume-file" className="sr-only">
                      Choose a PDF resume
                    </label>
                    <Input
                      ref={fileRef}
                      id="resume-file"
                      type="file"
                      accept="application/pdf,.pdf"
                      disabled={upload.isPending}
                      onChange={(e) => pickFile(e.target.files?.[0])}
                      className="h-9 cursor-pointer bg-background font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant={resume ? 'outline' : 'default'}
                      size="sm"
                      disabled={upload.isPending}
                      onClick={() => fileRef.current?.click()}
                    >
                      {upload.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                      {upload.isPending ? 'Indexing…' : resume ? 'Replace PDF' : 'Upload PDF'}
                    </Button>
                  </div>
                  {upload.isPending && (
                    <div className="space-y-1.5" role="status">
                      <Skeleton className="h-1.5 w-full" />
                      <p className="font-mono text-[11px] text-muted-foreground">
                        Extracting text, chunking, and indexing…
                      </p>
                    </div>
                  )}
                  {fileError && (
                    <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {fileError}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Example questions */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
                Try asking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2">
                {EXAMPLES.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      disabled={!resume || ask.isPending}
                      onClick={() => sendQuestion(q)}
                      className="w-full rounded-lg border bg-card px-3 py-2 text-left text-[13px] leading-snug text-foreground outline-none transition-colors hover:border-ring hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {resume ? 'Click a prompt to ask instantly.' : 'Upload a resume to enable prompts.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Conversation */}
        <Card className="flex min-h-[480px] flex-col lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b py-3.5">
            <CardTitle className="text-[15px]">Conversation</CardTitle>
            <Badge variant="secondary" size="sm" className="font-mono text-[11px]">
              Grounded · session only
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col p-0">
            <div ref={listRef} className="max-h-[56vh] flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" role="log" aria-label="Conversation">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}
                    aria-hidden
                  >
                    {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </span>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[80%]',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground'
                    )}
                  >
                    {m.error ? (
                      <div className="space-y-2">
                        <p className="font-medium text-destructive">{m.error}</p>
                        <p className="rounded-md bg-muted px-2.5 py-2 font-mono text-xs leading-relaxed text-muted-foreground">
                          {!resume
                            ? 'Upload a PDF resume above, then ask again.'
                            : 'The assistant service (provider or backend) could not answer. Nothing was fabricated — retry when ready.'}
                        </p>
                        <Button variant="outline" size="sm" onClick={() => retry(m)}>
                          Retry
                        </Button>
                      </div>
                    ) : m.text ? (
                      <>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        {m.role === 'assistant' && m.sources && m.sources.length === 0 && m.id !== 'intro' && (
                          <p className="mt-2 rounded-md bg-muted px-2.5 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                            No resume passages supported this answer — treated as a fallback, not a grounded result.
                          </p>
                        )}
                        {m.sources && <Sources sources={m.sources} />}
                      </>
                    ) : (
                      <span className="flex items-center gap-2 text-muted-foreground" role="status">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        Thinking — retrieving resume passages…
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="space-y-2 border-t p-4">
              <div className="flex gap-2">
                <label htmlFor="assistant-input" className="sr-only">
                  Ask about your resume
                </label>
                <Input
                  id="assistant-input"
                  placeholder={
                    resume
                      ? 'e.g. What backend experience does this resume show?'
                      : 'Upload a resume above to enable questions'
                  }
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={ask.isPending || !resume}
                  autoComplete="off"
                  className="h-10 bg-background"
                />
                <Button
                  type="submit"
                  disabled={!draft.trim() || ask.isPending || !resume}
                  aria-label="Send question"
                  className="h-10 w-10 shrink-0"
                  size="icon"
                >
                  {ask.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden />
                  )}
                </Button>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                Answers cite uploaded resume lines · Conversation stays in this session
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
