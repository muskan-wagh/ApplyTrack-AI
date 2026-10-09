import type { ApplicationItem, StatsResponse } from '@/types';

/**
 * API base resolution (permanent network fix):
 * - If VITE_API_URL is set (e.g. http://localhost:5000/api), use it as-is.
 * - If empty/unset, use same-origin '/api' which hits the Vite dev proxy
 *   (vite.config.ts) in development and the same host in production.
 *   Same-origin avoids CORS + "Failed to fetch" entirely.
 */
function resolveBase(): string {
  const raw = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').trim();
  if (!raw) return '/api';
  return raw.replace(/\/$/, '');
}

const BASE = resolveBase();

const DEFAULT_TIMEOUT_MS = 30000;
const MATCH_TIMEOUT_MS = 90000;
const ASSISTANT_TIMEOUT_MS = 90000;
const UPLOAD_TIMEOUT_MS = 120000;

function backendHint(): string {
  if (BASE.startsWith('http')) {
    return `Cannot reach the API at ${BASE}. Is the backend running? Start it with \`cd backend && npm run dev\` (expects :5000), check backend/.env (MONGODB_URI), then retry.`;
  }
  return 'Cannot reach the backend (same-origin /api). Is the backend running? Start it with `cd backend && npm run dev` (expects :5000 via the Vite proxy), then retry.';
}

async function fetchJson(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${BASE}${path}`, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s — the backend or AI provider may be busy. Retry in a moment.`
      );
    }
    // Browser network failure (backend down, CORS block, DNS, offline).
    // The raw TypeError ("Failed to fetch") tells users nothing actionable.
    throw new Error(backendHint());
  } finally {
    clearTimeout(timer);
  }
}

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

export interface HealthStatus {
  ok: boolean;
  service: string;
  timestamp: string;
  db?: string;
  ai?: { configured: boolean; chatModel: string };
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    const res = await fetchJson('/health', {}, 10000);
    // /api/health returns a flat envelope { ok, service, timestamp, db, ai }
    // (not the { ok, data } shape used by the other routes).
    const body = (await res.json().catch(() => null)) as HealthStatus | null;
    if (!res.ok || !body?.ok) {
      throw new Error(`Backend health check failed (${res.status})`);
    }
    return body;
  },

  async listApplications(
    params: { q?: string; status?: string; page?: number; limit?: number; sort?: string } = {}
  ): Promise<ApplicationList> {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.status) sp.set('status', params.status);
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.sort) sp.set('sort', params.sort);
    const qs = sp.toString();
    const res = await fetchJson(`/applications${qs ? `?${qs}` : ''}`);
    const body = await parseBody(res);
    return {
      data: body.data as ApplicationItem[],
      pagination: body.pagination as ApplicationList['pagination'],
    };
  },

  async getStats(): Promise<StatsResponse> {
    const res = await fetchJson('/applications/stats');
    const body = await parseBody(res);
    return body.data as StatsResponse;
  },

  async createApplication(input: Record<string, unknown>): Promise<ApplicationItem> {
    const res = await fetchJson(
      '/applications',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );
    const body = await parseBody(res);
    return body.data as ApplicationItem;
  },

  async updateApplication(id: string, input: Record<string, unknown>): Promise<ApplicationItem> {
    const res = await fetchJson(`/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const body = await parseBody(res);
    return body.data as ApplicationItem;
  },

  async deleteApplication(id: string): Promise<void> {
    const res = await fetchJson(`/applications/${id}`, { method: 'DELETE' });
    await parseBody(res);
  },

  async matchResume(input: { resumeText: string; jobDescription: string }): Promise<MatchResult> {
    const res = await fetchJson(
      '/match',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
      MATCH_TIMEOUT_MS
    );
    const body = await parseBody(res);
    return body.data as MatchResult;
  },

  async askAssistant(input: { question: string }): Promise<AssistantAnswer> {
    const res = await fetchJson(
      '/rag/query',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      },
      ASSISTANT_TIMEOUT_MS
    );
    const body = await parseBody(res);
    return body.data as AssistantAnswer;
  },

  async getCurrentResume(): Promise<ResumeMeta | null> {
    const res = await fetchJson('/resumes/current');
    const body = await parseBody(res);
    return body.data as ResumeMeta | null;
  },

  async uploadResume(file: File): Promise<ResumeMeta & { resumeId: string }> {
    const form = new FormData();
    form.append('file', file, file.name);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${BASE}/resumes/upload`, { method: 'POST', body: form, signal: controller.signal });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Upload timed out — the file may be large or the backend busy indexing. Retry.');
      }
      throw new Error(backendHint());
    } finally {
      clearTimeout(timer);
    }
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
