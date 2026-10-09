import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, ClipboardList, FileSearch, FileUp, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { api, API_BASE, type MatchResult } from '@/lib/api';
import { cn } from '@/lib/utils';

function ScoreMeter({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const stroke =
    clamped >= 70
      ? 'var(--success-solid)'
      : clamped >= 40
        ? 'var(--warning-foreground)'
        : 'var(--destructive)';
  const verdict = clamped >= 70 ? 'Strong fit' : clamped >= 40 ? 'Partial fit' : 'Weak fit';
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-24 w-24 shrink-0" role="img" aria-label={`Match score ${clamped} out of 100, ${verdict}`}>
        <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90" aria-hidden>
          <circle cx="40" cy="40" r={R} fill="none" strokeWidth="8" style={{ stroke: 'var(--border)' }} />
          <circle
            cx="40"
            cy="40"
            r={R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (clamped / 100) * C}
            style={{ stroke, transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold leading-none text-foreground">{clamped}</span>
          <span className="font-mono text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="min-w-0">
        <Badge
          variant={clamped >= 70 ? 'success' : clamped >= 40 ? 'warning' : 'destructive'}
          size="sm"
          className="font-mono text-[11px]"
        >
          {verdict}
        </Badge>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Resume match score"
        >
          <div className="h-full rounded-full" style={{ width: `${clamped}%`, background: stroke }} />
        </div>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          Grounded in the two texts you pasted
        </p>
      </div>
    </div>
  );
}

function SkillList({
  title,
  skills,
  icon: Icon,
  tone,
}: {
  title: string;
  skills: string[];
  icon: typeof Check;
  tone: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/50 p-3.5">
      <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
        <Icon className={cn('h-3.5 w-3.5', tone)} aria-hidden />
        {title}
        <span className="ml-auto font-mono text-xs font-normal text-muted-foreground">
          {skills.length}
        </span>
      </h3>
      {skills.length === 0 ? (
        <p className="mt-1.5 text-sm text-muted-foreground">None reported.</p>
      ) : (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <li key={s}>
              <Badge variant="secondary" size="sm" className="border font-mono text-[11px]">
                {s}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MatchResultView({ result }: { result: MatchResult }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow">Real analysis · POST /api/match</p>
          <Badge variant="success" size="sm" className="font-mono text-[11px]">
            Live
          </Badge>
        </div>
        <CardTitle className="mt-1 text-[15px]">Match result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScoreMeter score={result.score} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SkillList
            title="Matched skills"
            skills={result.matchedSkills}
            icon={Check}
            tone="text-success-foreground"
          />
          <SkillList
            title="Missing skills"
            skills={result.missingSkills}
            icon={X}
            tone="text-destructive"
          />
        </div>
        <div className="rounded-lg border p-3.5">
          <h3 className="text-[13px] font-semibold text-foreground">Why this score</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {result.explanation || 'No explanation was returned.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResumeMatchPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resumeQuery = useQuery({ queryKey: ['resume-current'], queryFn: api.getCurrentResume });
  const resume = resumeQuery.data ?? null;

  // Backend liveness probe — lets the error card distinguish "backend down"
  // (network) from "backend up but AI provider failed" (server/AI).
  const healthQuery = useQuery({
    queryKey: ['backend-health'],
    queryFn: api.getHealth,
    retry: false,
    staleTime: 30000,
  });

  const match = useMutation({
    mutationFn: () => api.matchResume({ resumeText: resumeText.trim(), jobDescription: jobDescription.trim() }),
  });

  const resumeLen = resumeText.trim().length;
  const jdLen = jobDescription.trim().length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeLen < 50) {
      setFormError('Paste at least a short resume summary (50+ characters) so there is something to compare.');
      return;
    }
    if (jdLen < 50) {
      setFormError('Paste the job description (50+ characters) you want to compare against.');
      return;
    }
    setFormError(null);
    match.mutate();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Resume Match"
        title="Compare resume to role"
        description="Paste both texts and run a real AI comparison. The score, skill overlap, and explanation appear here — nothing is fabricated."
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-1">
            <p className="eyebrow">Workbench · 3 steps</p>
            <CardTitle className="flex items-center gap-2 text-[15px]">
              <FileSearch className="h-4 w-4 text-muted-foreground" aria-hidden />
              Analysis input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Explicit resume selection / upload state */}
            {resumeQuery.isPending ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2.5">
                <Skeleton className="h-4 w-40" />
              </div>
            ) : resume ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-success/40 bg-success px-3 py-2.5">
                <Badge variant="success" size="sm" className="font-mono text-[11px]">
                  Resume on file
                </Badge>
                <p className="min-w-0 flex-1 truncate font-mono text-xs text-success-foreground">
                  {resume.filename} · {resume.chunkCount} chunks
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted px-3 py-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-card">
                  <FileUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                </span>
                <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">
                  No resume uploaded. You can still paste text below.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/app/resume-assistant">
                    Upload
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              </div>
            )}
            {resume && (
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Scoring uses the pasted text, not the stored PDF — paste the version you want
                evaluated.
              </p>
            )}

            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="resume-text">
                    <span className="mr-1.5 font-mono text-[11px] font-semibold text-primary">01</span>
                    Your resume
                  </Label>
                  <span className="font-mono text-[11px] text-muted-foreground" aria-live="polite">
                    {resumeLen}/50 min
                  </span>
                </div>
                <Textarea
                  id="resume-text"
                  placeholder="Paste your resume text here — experience, skills, education…"
                  className="min-h-44 font-mono text-xs leading-relaxed"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  aria-describedby="resume-hint"
                />
                <p id="resume-hint" className="text-xs text-muted-foreground">
                  At least 50 characters. Nothing leaves the browser until you run the analysis.
                </p>
              </div>
              <div className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="job-description">
                    <span className="mr-1.5 font-mono text-[11px] font-semibold text-primary">02</span>
                    Job description
                  </Label>
                  <span className="font-mono text-[11px] text-muted-foreground" aria-live="polite">
                    {jdLen}/50 min
                  </span>
                </div>
                <Textarea
                  id="job-description"
                  placeholder="Paste the full job posting — responsibilities, requirements, nice-to-haves…"
                  className="min-h-60 font-mono text-xs leading-relaxed"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
              {formError && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={match.isPending}>
                {match.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <FileSearch className="h-4 w-4" aria-hidden />
                )}
                {match.isPending ? 'Analyzing — this takes a few seconds…' : 'Analyze fit'}
              </Button>
              <p className="text-center font-mono text-[11px] text-muted-foreground">
                POST /api/match · grounded in the two texts above
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:sticky lg:top-20">
          {match.isPending && (
            <Card aria-label="Analysis in progress">
              <CardHeader className="pb-1">
                <p className="eyebrow">Working</p>
                <CardTitle className="flex items-center gap-2 text-[15px]">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                  Analyzing…
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-2 w-full" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          )}

          {!match.isPending && !match.isSuccess && !match.isError && (
            <Card>
              <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-semibold text-foreground">No analysis yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Fill in both fields and run the analysis. The score, skill overlap, and
                  explanation will appear here. Sample results are never shown as real.
                </p>
              </CardContent>
            </Card>
          )}

          {match.isError && (
            <Card>
              <CardHeader className="pb-1">
                <p className="eyebrow">Error · not a result</p>
                <CardTitle className="text-[15px]">Analysis unavailable</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const message =
                    (match.error as Error)?.message ?? 'The matching service could not be reached.';
                  const isNetwork = /cannot reach|failed to fetch|network|timed out|backend running/i.test(
                    message
                  );
                  const backendDown = healthQuery.isError;
                  const backendUp = healthQuery.isSuccess;
                  return (
                    <>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {message} No score was produced — this is a{' '}
                        {isNetwork || backendDown ? 'connection' : 'backend or AI provider'} failure,
                        not a weak fit.
                      </p>
                      <p className="rounded-lg border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                        POST {API_BASE}/match — {message}
                      </p>
                      {(isNetwork || backendDown) && (
                        <ol className="list-decimal space-y-1 rounded-lg border bg-muted/50 px-3 py-2 pl-8 text-[13px] leading-relaxed text-muted-foreground">
                          <li>
                            Start the backend: <code className="font-mono text-xs">cd backend &amp;&amp; npm run dev</code>{' '}
                            (must listen on :5000).
                          </li>
                          <li>
                            Using a custom backend? Check <code className="font-mono text-xs">VITE_API_URL</code> — or
                            leave it empty to use the Vite <code className="font-mono text-xs">/api</code> proxy.
                          </li>
                          <li>Then press Retry analysis below.</li>
                        </ol>
                      )}
                      <p className="font-mono text-[11px] text-muted-foreground" aria-live="polite">
                        Backend status:{' '}
                        {healthQuery.isPending
                          ? 'checking…'
                          : backendUp
                            ? `reachable (db: ${healthQuery.data.db ?? 'unknown'}, AI: ${healthQuery.data.ai?.configured ? 'configured' : 'not configured'})`
                            : 'unreachable — start the backend and retry'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            void healthQuery.refetch();
                            match.mutate();
                          }}
                          disabled={match.isPending}
                        >
                          Retry analysis
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => match.reset()}>
                          Dismiss
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {match.isSuccess && <MatchResultView result={match.data} />}
        </div>
      </div>
    </div>
  );
}
