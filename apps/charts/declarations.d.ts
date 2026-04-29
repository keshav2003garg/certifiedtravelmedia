import type { QueryKey } from '@tanstack/react-query';
import type { FetchError } from 'ofetch';
import type { ApiError } from '@/lib/api';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: FetchError<ApiError>;
    mutationMeta: {
      successMessage?: string;
      successDescription?: string;
      errorMessage?: string;
      errorDescription?: string;
      invalidateQueries?: QueryKey;
      removeQueries?: QueryKey;
    };
  }
}
