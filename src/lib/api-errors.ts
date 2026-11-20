import { ApiError } from '@/lib/api-client';

// The backend answers a refused request with { error: { message, details } },
// where each detail names a field and what is wrong with it.
export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'An error occurred';
  const body: unknown = error.error;
  if (body && typeof body === 'object') {
    if ('details' in body && Array.isArray(body.details) && body.details.length > 0) {
      const details = body.details
        .map((detail: unknown) => {
          if (!detail || typeof detail !== 'object' || !('message' in detail)) return '';
          const field = 'field' in detail ? String(detail.field) : '';
          return field ? `${field}: ${String(detail.message)}` : String(detail.message);
        })
        .filter(Boolean)
        .join(' ');
      if (details) return details;
    }
    if ('message' in body && typeof body.message === 'string' && body.message) return body.message;
  }
  return error.message;
}

// Where the API takes uploads, as a client outside the browser reaches it.
export function absoluteApiUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(baseUrl)) return `${baseUrl.replace(/\/$/, '')}${path}`;
  const base = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
  return `${window.location.origin}${base.replace(/\/$/, '')}${path}`;
}
