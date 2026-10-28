// Thin fetch wrapper for the Beacon API. All calls go to same-origin /api/*,
// which Next.js proxies to the Express backend (see next.config.ts).

export interface FieldIssue {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly details: FieldIssue[];

  constructor(status: number, message: string, details?: FieldIssue[]) {
    super(message);
    this.status = status;
    this.details = details ?? [];
  }

  /** Map field-level validation errors to { field: message }. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

/** Narrow an unknown caught value to a user-facing message. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

/**
 * Call the API and return the parsed JSON as `T`. Pass the expected response
 * type, e.g. `api<{ modules: ModuleSummary[] }>('/modules')`.
 */
export async function api<T = unknown>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'You appear to be offline. Check your connection and try again.');
  }

  if (res.status === 204) return null as T;
  const data = (await res.json().catch(() => ({}))) as { error?: string; details?: FieldIssue[] };
  if (!res.ok) {
    throw new ApiError(res.status, data.error || 'Something went wrong. Please try again.', data.details);
  }
  return data as T;
}
