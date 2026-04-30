import { memo, useCallback, useEffect } from 'react';

import { Button } from '@repo/ui/components/base/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/base/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Input } from '@repo/ui/components/base/input';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { Ban, Loader2 } from '@repo/ui/lib/icons';

import { banUserSchema } from '../schema';

import type { UserWithRole } from '@/hooks/useUsers/types';
import type { BanUserFormData } from '../schema';

interface BanUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
  onSubmit: (values: {
    userId: string;
    banReason?: string;
    banExpiresIn?: number;
  }) => void;
  isSubmitting: boolean;
}

function BanUserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSubmitting,
}: BanUserDialogProps) {
  const form = useForm<BanUserFormData>({
    resolver: zodResolver(banUserSchema),
    defaultValues: {
      banReason: '',
      banExpiresInDays: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ banReason: '', banExpiresInDays: undefined });
    }
  }, [form, open]);

  const handleSubmit = useCallback(
    (values: BanUserFormData) => {
      if (!user) return;

      onSubmit({
        userId: user.id,
        banReason: values.banReason?.trim() || undefined,
        banExpiresIn: values.banExpiresInDays
          ? values.banExpiresInDays * 24 * 60 * 60
          : undefined,
      });
    },
    [onSubmit, user],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ban user</DialogTitle>
          <DialogDescription>
            {user
              ? `Prevent ${user.name || user.email} from signing in and revoke active sessions.`
              : 'Prevent this user from signing in and revoke active sessions.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="banReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Policy violation"
                      maxLength={500}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="banExpiresInDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <FormControl>
                    <NumericInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      min={1}
                      max={365}
                      integerOnly
                      placeholder="Permanent"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave empty for a permanent ban.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting || !user}
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Ban className="size-4" />
                )}
                Ban user
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(BanUserDialog);
