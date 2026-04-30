import { memo, useMemo, useState } from 'react';

import { Button } from '@repo/ui/components/base/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/base/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Input } from '@repo/ui/components/base/input';
import { Progress } from '@repo/ui/components/base/progress';
import { useForm, useWatch, zodResolver } from '@repo/ui/lib/form';
import { Eye, EyeOff, Loader2, Lock } from '@repo/ui/lib/icons';

import { useAuth } from '@/hooks/useAuth';

import { changePasswordSchema } from '../schema';

import type { ChangePasswordFormData } from '../schema';

type PasswordFieldName = keyof ChangePasswordFormData;

const passwordRules = [
  (value: string) => value.length >= 8,
  (value: string) => /[a-z]/.test(value),
  (value: string) => /[A-Z]/.test(value),
  (value: string) => /\d/.test(value),
] as const;

function getPasswordStrength(value: string) {
  if (!value) return 0;
  return Math.round(
    (passwordRules.filter((rule) => rule(value)).length / passwordRules.length) *
      100,
  );
}

function ChangePasswordCard() {
  const { changePasswordMutation } = useAuth();
  const [visibleFields, setVisibleFields] = useState<
    Partial<Record<PasswordFieldName, boolean>>
  >({});

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = useWatch({
    control: form.control,
    name: 'newPassword',
  });

  const passwordStrength = useMemo(
    () => getPasswordStrength(newPassword ?? ''),
    [newPassword],
  );

  const onSubmit = async (values: ChangePasswordFormData) => {
    await changePasswordMutation.mutateAsync({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    form.reset();
    setVisibleFields({});
  };

  const toggleField = (name: PasswordFieldName) => {
    setVisibleFields((current) => ({
      ...current,
      [name]: !current[name],
    }));
  };

  const renderPasswordField = (
    name: PasswordFieldName,
    label: string,
    placeholder: string,
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const isVisible = Boolean(visibleFields[name]);

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  type={isVisible ? 'text' : 'password'}
                  placeholder={placeholder}
                  className="pr-11"
                  disabled={changePasswordMutation.isPending}
                  autoComplete={
                    name === 'currentPassword'
                      ? 'current-password'
                      : 'new-password'
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-8 -translate-y-1/2"
                  onClick={() => toggleField(name)}
                  disabled={changePasswordMutation.isPending}
                  aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
                >
                  {isVisible ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-5" />
          Password
        </CardTitle>
        <CardDescription>
          Update your password and revoke other active sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              {renderPasswordField(
                'currentPassword',
                'Current password',
                'Enter current password',
              )}
              {renderPasswordField(
                'newPassword',
                'New password',
                'Enter new password',
              )}
              {renderPasswordField(
                'confirmPassword',
                'Confirm password',
                'Confirm new password',
              )}
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Password strength</p>
                <p className="text-muted-foreground text-sm">
                  {passwordStrength}%
                </p>
              </div>
              <Progress value={passwordStrength} className="h-2" />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Lock className="size-4" />
                )}
                Change password
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default memo(ChangePasswordCard);