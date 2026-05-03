import { memo, useCallback } from 'react';

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
import { Loader2, Plus } from '@repo/ui/lib/icons';

import { useResetFormOnActivation } from '@/hooks/useResetFormOnActivation';

import { createUserSchema, ROLES } from '../schema';

import type { CreateUserFormData } from '../schema';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateUserFormData) => void;
  isSubmitting: boolean;
}

function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateUserDialogProps) {
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'staff',
    },
  });

  useResetFormOnActivation(open, form.reset, {
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });

  const handleSubmit = useCallback(
    (values: CreateUserFormData) => {
      onSubmit({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
      });
    },
    [onSubmit],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Create a dashboard account with the appropriate admin role.
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
                      placeholder="Jane Smith"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="jane@example.com"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Minimum 8 characters"
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add user
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(CreateUserDialog);
