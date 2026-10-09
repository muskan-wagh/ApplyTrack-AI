import type { ApplicationItem, StatsResponse } from '@/types';

const BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:5000/api';

async function parseBody(res: Response) {
  const body = (await res.json().catch(() => null)) as {
    ok: boolean;
    data?: unknown;
    pagination?: unknown;
    error?: string;
  } | null;
  if (!res.ok || !body?.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return body;
}

export interface ApplicationList {
  data: ApplicationItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

/**
 * Resume match (POST /api/match) scores pasted resume text against a pasted
 * job description. Resume Q&A is live: upload/index via /api/resumes, chat
 * via /api/rag/query.
 */
export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
}

export interface AssistantSource {
  label: string;
  snippet: string;
}

export interface AssistantAnswer {
  answer: string;
  sources: AssistantSource[];
}

export interface ResumeMeta {
  id: string;
  filename: string;
  chunkCount: number;
  charCount: number;
  uploadedAt: string;
}

export const api = {
  async listApplications(
    params: { q?: string; status?: string; page?: number; limit?: number } = {}
  ): Promise<ApplicationList> {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.status) sp.set('status', params.status);
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString();
    const res = await fetch(`${BASE}/applications${qs ? `?${qs}` : ''}`);
    const body = await parseBody(res);
    return {
      data: body.data as ApplicationItem[],
      pagination: body.pagination as ApplicationList['pagination'],
    };
  },

  async getStats(): Promise<StatsResponse> {
    const res = await fetch(`${BASE}/applications/stats`);
    const body = await parseBody(res);
    return body.data as StatsResponse;
  },

  async createApplication(input: Record<string, unknown>): Promise<ApplicationItem> {
    const res = await fetch(`${BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await parseBody(res);
    return body.data as ApplicationItem;
  },

  async updateApplication(id: string, input: Record<string, unknown>): Promise<ApplicationItem> {
    const res = await fetch(`${BASE}/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await parseBody(res);
    return body.data as ApplicationItem;
  },

  async deleteApplication(id: string): Promise<void> {
    const res = await fetch(`${BASE}/applications/${id}`, { method: 'DELETE' });
    await parseBody(res);
  },

  async matchResume(input: { resumeText: string; jobDescription: string }): Promise<MatchResult> {
    const res = await fetch(`${BASE}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await parseBody(res);
    return body.data as MatchResult;
  },

  async askAssistant(input: { question: string }): Promise<AssistantAnswer> {
    const res = await fetch(`${BASE}/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await parseBody(res);
    return body.data as AssistantAnswer;
  },

  async getCurrentResume(): Promise<ResumeMeta | null> {
    const res = await fetch(`${BASE}/resumes/current`);
    const body = await parseBody(res);
    return body.data as ResumeMeta | null;
  },

  async uploadResume(file: File): Promise<ResumeMeta & { resumeId: string }> {
    const form = new FormData();
    form.append('file', file, file.name);
    const res = await fetch(`${BASE}/resumes/upload`, { method: 'POST', body: form });
    // Upload errors use the same {ok:false,error} envelope.
    const body = (await res.json().catch(() => null)) as {
      ok: boolean;
      data?: unknown;
      error?: string;
    } | null;
    if (!res.ok || !body?.ok) {
      throw new Error(body?.error ?? `Upload failed (${res.status})`);
    }
    const data = body.data as { resumeId: string; filename: string; chunkCount: number; charCount: number };
    return { id: data.resumeId, uploadedAt: new Date().toISOString(), ...data };
  },
};

export { BASE as API_BASE };
