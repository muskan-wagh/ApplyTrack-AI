import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, FileSearch, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { api, type MatchResult } from '@/lib/api';
import { cn } from '@/lib/utils';

function ScoreMeter({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tone =
    clamped >= 70 ? 'bg-success' : clamped >= 40 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="flex items-center gap-4">
      <p className="font-mono text-4xl font-semibold text-foreground" aria-label={`Match score ${clamped} out of 100`}>
        {clamped}
        <span className="text-base font-normal text-muted-foreground">/100</span>
      </p>
      <div className="flex-1">
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={cn('h-full rounded-full', tone)} style={{ width: `${clamped}%` }} />
        </div>
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
    <div>
      <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
        <Icon className={cn('h-3.5 w-3.5', tone)} aria-hidden />
        {title}
        <span className="font-mono text-xs font-normal text-muted-foreground">{skills.length}</span>
      </h3>
      {skills.length === 0 ? (
        <p className="mt-1.5 text-sm text-muted-foreground">None reported.</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <li key={s}>
              <Badge variant="secondary" size="sm" className="font-mono text-[11px]">
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
      <CardHeader>
        <CardTitle>Match result</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <ScoreMeter score={result.score} />
        <div className="grid gap-5 sm:grid-cols-2">
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
        <div>
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

  const match = useMutation({
    mutationFn: () => api.matchResume({ resumeText: resumeText.trim(), jobDescription: jobDescription.trim() }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeText.trim().length < 50) {
      setFormError('Paste at least a short resume summary (50+ characters) so there is something to compare.');
      return;
    }
    if (jobDescription.trim().length < 50) {
      setFormError('Paste the job description (50+ characters) you want to compare against.');
      return;
    }
    setFormError(null);
    match.mutate();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-muted-foreground" aria-hidden />
            Compare resume to job
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="resume-text">Your resume</Label>
                <Badge variant="success" size="sm" className="font-mono text-[11px]">
                  AI powered
                </Badge>
              </div>
              <Textarea
                id="resume-text"
                placeholder="Paste your resume text here…"
                className="min-h-36 font-mono text-xs"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="job-description">Job description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the job posting here…"
                className="min-h-36 font-mono text-xs"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <div>
              <Button type="submit" disabled={match.isPending}>
                {match.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {match.isPending ? 'Analyzing…' : 'Analyze fit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        {match.isPending && (
          <Card>
            <CardHeader>
              <CardTitle>Analyzing…</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        )}

        {!match.isPending && !match.isSuccess && !match.isError && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm font-medium text-foreground">No analysis yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Fill in both fields and run the analysis. The score, skill overlap, and
                explanation will appear here.
              </p>
            </CardContent>
          </Card>
        )}

        {match.isError && (
          <Card>
            <CardHeader>
              <CardTitle>Analysis unavailable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {(match.error as Error)?.message ?? 'The matching service could not be reached.'}
              </p>
              <p className="rounded-md border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                POST /api/match — { (match.error as Error)?.message ?? 'request failed' }
              </p>
              <Button variant="outline" size="sm" onClick={() => match.reset()}>
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {match.isSuccess && <MatchResultView result={match.data} />}
      </div>
    </div>
  );
}
