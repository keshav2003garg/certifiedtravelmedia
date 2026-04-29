import { memo, useState } from 'react';

import { Link } from '@tanstack/react-router';

import { Button } from '@repo/ui/components/base/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Input } from '@repo/ui/components/base/input';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Key,
  LayoutGrid,
  Loader2,
  Shield,
} from '@repo/ui/lib/icons';

import { useAuth } from '@/hooks/useAuth';

import { resetPasswordSchema } from './schema';

import type { ResetPasswordSchema } from './schema';

interface ResetPasswordFormProps {
  token?: string | undefined;
}

function ResetPasswordForm(params: ResetPasswordFormProps) {
  const { token } = params;

  const { resetPasswordMutation } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token,
      password: '',
      confirmPassword: '',
    },
  });

  function onSubmit(data: ResetPasswordSchema) {
    resetPasswordMutation.mutate(data);
  }

  return (
    <div className="relative flex w-full items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="border-border shadow-navy/5 rounded-2xl border bg-white p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center md:hidden">
              <div className="bg-blue/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <LayoutGrid className="text-blue h-6 w-6" />
              </div>
            </div>
            <div className="mb-6 hidden justify-center md:flex">
              <div className="bg-gold/10 flex h-12 w-12 items-center justify-center rounded-xl">
                <Shield className="text-gold h-6 w-6" />
              </div>
            </div>
            <h1 className="text-navy mb-2 text-2xl font-bold">
              Reset Password
            </h1>
            <p className="font-albert text-sm text-gray-600">
              Enter your new password below
            </p>
          </div>

          {!token && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-center">
              <p className="font-albert text-sm text-red-600">
                Invalid or missing reset token. Please request a new password
                reset link.
              </p>
              <Link
                to="/forgot-password"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-800"
              >
                Request new link
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <Input type="hidden" {...form.register('token')} value={token} />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy mb-2 block text-xs font-semibold">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
                          className="font-albert focus:border-blue focus:ring-blue/20 h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 pr-10 pl-10 text-sm text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:bg-white focus:ring-2"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors duration-200 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="font-albert mt-1 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy mb-2 block text-xs font-semibold">
                      Confirm New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          className="font-albert focus:border-blue focus:ring-blue/20 h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 pr-10 pl-10 text-sm text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:bg-white focus:ring-2"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors duration-200 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="font-albert mt-1 text-xs" />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={
                    resetPasswordMutation.isPending ||
                    !form.formState.isValid ||
                    !token
                  }
                  className="bg-blue hover:bg-blue-dark group shadow-blue/25 h-11 w-full rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Resetting...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm">Reset Password</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="font-albert text-blue hover:text-blue-dark inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ResetPasswordForm);
