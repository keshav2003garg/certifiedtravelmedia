import { memo, useCallback, useMemo } from 'react';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Input } from '@repo/ui/components/base/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { Check, Loader2 } from '@repo/ui/lib/icons';

import { useResetFormOnActivation } from '@/hooks/useResetFormOnActivation';

import { editUserSchema, ROLES } from '../schema';

import type { UserWithRole } from '@/hooks/useUsers/types';
import type { EditUserFormData } from '../schema';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
  onSubmit: (values: EditUserFormData & { userId: string }) => void;
  isSubmitting: boolean;
}

function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  isSubmitting,
}: EditUserDialogProps) {
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: '',
      role: 'staff',
    },
  });

  const resetValues = useMemo(
    () => ({
      name: user?.name ?? '',
      role:
        user && ROLES.includes(user.role as (typeof ROLES)[number])
          ? (user.role as EditUserFormData['role'])
          : 'staff',
    }),
    [user],
  );

  useResetFormOnActivation(
    open && Boolean(user),
    form.reset,
    resetValues,
    user?.id ?? null,
  );

  const handleSubmit = useCallback(
    (values: EditUserFormData) => {
      if (!user) return;
      onSubmit({
        userId: user.id,
        name: values.name.trim(),
        role: values.role,
      });
    },
    [onSubmit, user],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update the account display name and dashboard role.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="User name"
                      maxLength={255}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          <span className="capitalize">{role}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button type="submit" disabled={isSubmitting || !user}>
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Save user
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(EditUserDialog);
