import { type FetchOptions, ofetch } from 'ofetch';

export function createApiClient(baseURL: string, defaults?: FetchOptions) {
  return ofetch.create({
    baseURL,
    credentials: 'include',
    retry: 1,
    retryStatusCodes: [408, 409, 429, 500, 502, 503, 504],
    headers: { 'Content-Type': 'application/json' },
    ...defaults,
  });
}
