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
  AtSign,
  KeyRound,
  LayoutGrid,
  Loader2,
  Mail,
} from '@repo/ui/lib/icons';

import { useAuth } from '@/hooks/useAuth';

import { forgotPasswordSchema } from './schema';

import type { ForgotPasswordSchema } from './schema';

function ForgotPasswordForm() {
  const { requestResetPasswordMutation } = useAuth();

  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  function onSubmit(data: ForgotPasswordSchema) {
    requestResetPasswordMutation.mutate(data, {
      onSuccess: function () {
        form.reset();
        setIsSubmitted(true);
      },
    });
  }

  if (isSubmitted) {
    return (
      <div className="relative flex w-full items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="border-border shadow-navy/5 rounded-2xl border bg-white p-8 shadow-xl backdrop-blur-sm">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                  <Mail className="h-7 w-7 text-green-600" />
                </div>
              </div>
              <h1 className="text-navy mb-2 text-2xl font-bold">
                Check your email
              </h1>
              <p className="font-albert mb-6 text-sm text-gray-600">
                We&apos;ve sent a password reset link to your email address.
                Please check your inbox.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="group h-11 w-full rounded-xl border-gray-200 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back to form</span>
                  </div>
                </Button>
                <Link to="/login" className="block">
                  <Button
                    variant="ghost"
                    className="text-blue hover:text-blue-dark h-10 w-full text-sm font-medium"
                  >
                    Return to login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                <KeyRound className="text-gold h-6 w-6" />
              </div>
            </div>
            <h1 className="text-navy mb-2 text-2xl font-bold">
              Forgot Password
            </h1>
            <p className="font-albert text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset
              your password
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
                          className="font-albert focus:border-blue focus:ring-blue/20 h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 pr-4 pl-10 text-sm text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:bg-white focus:ring-2"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="font-albert mt-1 text-xs" />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={requestResetPasswordMutation.isPending}
                  className="bg-blue hover:bg-blue-dark group shadow-blue/25 h-11 w-full rounded-xl font-semibold shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-center gap-2">
                    {requestResetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Sending...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm">Send Reset Link</span>
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

export default memo(ForgotPasswordForm);
