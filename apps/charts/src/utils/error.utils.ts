import { FetchError } from 'ofetch';

import type { ApiError } from '@/lib/api';

export function sanitizeError(error: unknown) {
  if (error instanceof FetchError) {
    const data = error.data as ApiError | undefined;
    return {
      title: data?.error ?? `Request failed (${error.statusCode})`,
      description: data?.message ?? error.message,
    };
  }

  if (error instanceof Error) {
    return {
      title: error.message,
    };
  }

  return {
    title: 'An unknown error occurred',
    description: 'Please try again later',
  };
}
