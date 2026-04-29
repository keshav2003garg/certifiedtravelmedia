import { memo, useEffect, useMemo } from 'react';

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
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { Loader2 } from '@repo/ui/lib/icons';

import { useCustomers } from '@/hooks/useCustomers';

import { customerFormSchema, defaultCustomerValues } from '../schema';

import type { Customer } from '@/hooks/useCustomers/types';
import type { CustomerFormData } from '../schema';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

function getChangedFields(data: CustomerFormData, customer: Customer) {
  const body: Partial<CustomerFormData> = {};

  if (data.acumaticaId !== customer.acumaticaId) {
    body.acumaticaId = data.acumaticaId;
  }

  if (data.name !== customer.name) {
    body.name = data.name;
  }

  return body;
}

function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: CustomerFormDialogProps) {
  const { createMutation, updateMutation } = useCustomers();
  const isEditMode = Boolean(customer);
  const mutation = isEditMode ? updateMutation : createMutation;

  const defaultValues = useMemo<CustomerFormData>(() => {
    if (!customer) return defaultCustomerValues;

    return {
      acumaticaId: customer.acumaticaId,
      name: customer.name,
    };
  }, [customer]);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  function onSubmit(data: CustomerFormData) {
    if (!customer) {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
      return;
    }

    const body = getChangedFields(data, customer);

    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }

    updateMutation.mutate(
      { id: customer.id, body },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit customer' : 'New customer'}
          </DialogTitle>
          <DialogDescription>
            Manage the customer name and Acumatica identifier used across
            brochure and contract records.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Certified Travel Media"
                      autoComplete="organization"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acumaticaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acumatica ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="CUST0001"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {isEditMode ? 'Save changes' : 'Create customer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(CustomerFormDialog);
