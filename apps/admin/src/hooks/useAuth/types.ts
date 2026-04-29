import type { ApiData } from '@/lib/api/types';

export type LoginRequest = ApiData<
  {
    email: string;
    password: string;
  },
  undefined
>;

export type RequestResetPasswordRequest = ApiData<
  {
    email: string;
  },
  undefined
>;

export type ResetPasswordRequest = ApiData<
  {
    token: string;
    password: string;
  },
  undefined
>;

export type ChangePasswordRequest = ApiData<
  {
    currentPassword: string;
    newPassword: string;
  },
  undefined
>;
