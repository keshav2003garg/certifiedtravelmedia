import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { auth } from '@/lib/auth';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  BanUserPayload,
  CreateUserPayload,
  ListUsersParams,
  RemoveUserPayload,
  ResetPasswordPayload,
  SetRolePayload,
  UpdateUserPayload,
  UserFilter,
  UserWithRole,
} from './types';

interface BetterAuthResponse<TData> {
  data: TData | null;
  error: { message?: string | null } | null;
}

interface BetterAuthFilter {
  field: string;
  value: string | boolean;
}

function unwrapBetterAuthResponse<TData>(
  response: BetterAuthResponse<TData>,
  fallbackMessage: string,
) {
  if (response.error) {
    throw new Error(response.error.message ?? fallbackMessage);
  }

  if (!response.data) {
    throw new Error(fallbackMessage);
  }

  return response.data;
}

function getBetterAuthFilter(filter?: UserFilter): BetterAuthFilter | null {
  if (!filter) return null;

  if (filter.startsWith('role:')) {
    return { field: 'role', value: filter.replace('role:', '') };
  }

  return { field: 'banned', value: filter === 'status:banned' };
}

export const usersQueryKeys = {
  list: (params?: ListUsersParams) =>
    [ReactQueryKeys.GET_USERS, params] as const,
};

export function useUsers() {
  const listUsers = useCallback(async (params?: ListUsersParams) => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const offset = (page - 1) * limit;
    const filter = getBetterAuthFilter(params?.filter);
    const search = params?.search?.trim();

    const response = await auth.admin.listUsers({
      query: {
        limit,
        offset,
        ...(search
          ? {
              searchField: params?.searchField ?? 'email',
              searchOperator: 'contains',
              searchValue: search,
            }
          : {}),
        ...(params?.sortBy
          ? {
              sortBy: params.sortBy,
              sortDirection: params.order ?? 'asc',
            }
          : {}),
        ...(filter
          ? {
              filterField: filter.field,
              filterOperator: 'eq',
              filterValue: filter.value,
            }
          : {}),
      },
    });

    const data = unwrapBetterAuthResponse(response, 'Failed to list users');
    const total = data.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      users: (data.users ?? []) as UserWithRole[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }, []);

  const createUser = useCallback(async (payload: CreateUserPayload) => {
    const response = await auth.admin.createUser({
      email: payload.email,
      name: payload.name,
      password: payload.password,
      role: payload.role,
      data: { emailVerified: true },
    });

    return unwrapBetterAuthResponse(response, 'Failed to create user');
  }, []);

  const updateUser = useCallback(async (payload: UpdateUserPayload) => {
    const response = await auth.admin.updateUser({
      userId: payload.userId,
      data: payload.data,
    });

    return unwrapBetterAuthResponse(response, 'Failed to update user');
  }, []);

  const setRole = useCallback(async (payload: SetRolePayload) => {
    const response = await auth.admin.setRole({
      userId: payload.userId,
      role: payload.role,
    });

    return unwrapBetterAuthResponse(response, 'Failed to update user role');
  }, []);

  const banUser = useCallback(async (payload: BanUserPayload) => {
    const response = await auth.admin.banUser({
      userId: payload.userId,
      banReason: payload.banReason,
      banExpiresIn: payload.banExpiresIn,
    });

    return unwrapBetterAuthResponse(response, 'Failed to ban user');
  }, []);

  const unbanUser = useCallback(async (userId: string) => {
    const response = await auth.admin.unbanUser({ userId });

    return unwrapBetterAuthResponse(response, 'Failed to unban user');
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    const response = await auth.admin.setUserPassword({
      userId: payload.userId,
      newPassword: payload.newPassword,
    });

    return unwrapBetterAuthResponse(response, 'Failed to reset password');
  }, []);

  const removeUser = useCallback(async (payload: RemoveUserPayload) => {
    const response = await auth.admin.removeUser({ userId: payload.userId });

    return unwrapBetterAuthResponse(response, 'Failed to delete user');
  }, []);

  const usersQueryOptions = (params?: ListUsersParams) =>
    queryOptions({
      queryKey: usersQueryKeys.list(params),
      queryFn: () => listUsers(params),
    });

  const createMutation = useMutation({
    mutationFn: createUser,
    meta: {
      successMessage: 'User created successfully',
      invalidateQueries: [ReactQueryKeys.GET_USERS],
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    meta: {
      successMessage: 'User updated successfully',
      invalidateQueries: [ReactQueryKeys.GET_USERS],
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: setRole,
    meta: {
      successMessage: 'User role updated successfully',
      invalidateQueries: [ReactQueryKeys.GET_USERS],
    },
  });

  const banMutation = useMutation({
    mutationFn: banUser,
    meta: {
      successMessage: 'User banned successfully',
      invalidateQueries: [ReactQueryKeys.GET_USERS],
    },
  });

  const unbanMutation = useMutation({
    mutationFn: unbanUser,
    meta: {
      successMessage: 'User unbanned successfully',
      invalidateQueries: [ReactQueryKeys.GET_USERS],
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    meta: {
      successMessage: 'Password reset successfully',
      invalidateQueries: [ReactQueryKeys.GET_USERS],
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeUser,
    meta: {
      successMessage: 'User deleted successfully',
      invalidateQueries: [ReactQueryKeys.GET_USERS],
    },
  });

  return {
    listUsers,
    usersQueryOptions,
    createMutation,
    updateMutation,
    setRoleMutation,
    banMutation,
    unbanMutation,
    resetPasswordMutation,
    removeMutation,
  };
}
