// Node Modules
import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

// Lib/Utils
import { auth } from '@/lib/auth';

// Types
import type {
  ChangePasswordRequest,
  LoginRequest,
  RequestResetPasswordRequest,
  ResetPasswordRequest,
} from './types';

export function useAuth() {
  const router = useRouter();

  const login = useCallback(async (payload: LoginRequest['payload']) => {
    const { data, error } = await auth.signIn.email({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }, []);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: function () {
      router.invalidate();
    },
    meta: {
      successMessage: 'Logged in successfully',
    },
  });

  const requestResetPassword = useCallback(
    async (payload: RequestResetPasswordRequest['payload']) => {
      const { data, error } = await auth.requestPasswordReset({
        email: payload.email,
        redirectTo: `${import.meta.env.VITE_ADMIN_APP_URL}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    [],
  );

  const requestResetPasswordMutation = useMutation({
    mutationFn: requestResetPassword,
    meta: {
      successMessage: 'Password reset email sent',
      successDescription: 'Please check your email to reset your password',
    },
  });

  const resetPassword = useCallback(
    async (payload: ResetPasswordRequest['payload']) => {
      const { data, error } = await auth.resetPassword({
        token: payload.token,
        newPassword: payload.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    [],
  );

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: function () {
      router.navigate({ to: '/login' });
    },
    meta: {
      successMessage: 'Password reset successfully',
    },
  });

  const logout = useCallback(async () => {
    const { error } = await auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }, []);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: function () {
      router.invalidate();
    },
    meta: {
      successMessage: 'Logged out successfully',
    },
  });

  const changePassword = useCallback(
    async (payload: ChangePasswordRequest['payload']) => {
      const { data, error } = await auth.changePassword({
        currentPassword: payload.currentPassword,
        newPassword: payload.newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        throw new Error(error.message, { cause: error.code });
      }

      return data;
    },
    [],
  );

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: function () {
      router.invalidate();
    },
    meta: {
      successMessage: 'Password changed successfully',
    },
  });

  return {
    loginMutation,
    requestResetPasswordMutation,
    resetPasswordMutation,
    logoutMutation,
    changePasswordMutation,
  };
}
