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
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Key,
  LayoutGrid,
  Loader2,
} from '@repo/ui/lib/icons';

import { useAuth } from '@/hooks/useAuth';

import { loginSchema } from './schema';

import type { LoginFormData } from './schema';

function LoginForm() {
  const { loginMutation } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(data: LoginFormData) {
    loginMutation.mutate(data);
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
            <h1 className="text-navy mb-2 text-2xl font-bold">Welcome back</h1>
            <p className="font-albert text-sm text-gray-600">
              Sign in to access the Grid Generator dashboard
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-navy mb-2 block text-xs font-semibold">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <AtSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@certifiedtravelmedia.com"
                          className="font-albert focus:border-blue focus:ring-blue/20 h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 pr-3 pl-10 text-sm text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:bg-white focus:ring-2"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="font-albert mt-1 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-2 flex items-center justify-between">
                      <FormLabel className="text-navy text-xs font-semibold">
                        Password
                      </FormLabel>
                      <Link to="/forgot-password">
                        <span className="font-albert text-blue hover:text-blue-dark text-xs font-medium hover:underline">
                          Forgot password?
                        </span>
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
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

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="bg-blue hover:bg-blue-dark group shadow-blue/25 h-11 w-full rounded-xl font-semibold shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm">Sign In</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default memo(LoginForm);
