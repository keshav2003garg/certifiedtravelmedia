// Node Modules
import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

// Lib/Utils
import { auth } from '@/lib/auth';

// Types
import { ReactQueryKeys } from '@/types/react-query-keys';

export function useSession() {
  const getAllSessions = useCallback(async () => {
    const { data, error } = await auth.listSessions();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }, []);

  const getAllSessionsQueryOptions = queryOptions({
    queryKey: [ReactQueryKeys.GET_SESSIONS],
    queryFn: getAllSessions,
  });

  const revokeSession = useCallback(async (sessionToken: string) => {
    const { error } = await auth.revokeSession({
      token: sessionToken,
    });

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const revokeSessionMutation = useMutation({
    mutationFn: revokeSession,
    meta: {
      successMessage: 'Session revoked successfully',
      invalidateQueries: [ReactQueryKeys.GET_SESSIONS],
    },
  });

  const revokeAllSessions = useCallback(async () => {
    const { error } = await auth.revokeSessions();

    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const revokeAllSessionsMutation = useMutation({
    mutationFn: revokeAllSessions,
    meta: {
      successMessage: 'All other sessions revoked',
      invalidateQueries: [ReactQueryKeys.GET_SESSIONS],
    },
  });

  return {
    // Queries Options
    getAllSessionsQueryOptions,

    // Mutations
    revokeSessionMutation,
    revokeAllSessionsMutation,
  };
}
