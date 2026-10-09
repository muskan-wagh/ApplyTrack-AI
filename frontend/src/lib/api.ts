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
 * Contracts for backend Phases 4–5 (not implemented yet).
 * The Resume pages call these and render loading / error / result states;
 * until the endpoints exist the UI surfaces a clear "backend pending" error
 * instead of mock data.
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
};

export { BASE as API_BASE };
