import { memo, useCallback, useEffect, useMemo } from 'react';

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
import { Loader2, Tags, UserRound, X } from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';

import { useBrochures } from '@/hooks/useBrochures';
import { useBrochureTypes } from '@/hooks/useBrochureTypes';
import { useCustomers } from '@/hooks/useCustomers';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';

import { ReactQueryKeys } from '@/types/react-query-keys';

import { brochureFormSchema, defaultBrochureValues } from '../schema';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type {
  Brochure,
  BrochureDetail,
  CreateBrochureRequest,
} from '@/hooks/useBrochures/types';
import type { ListBrochureTypesRequest } from '@/hooks/useBrochureTypes/types';
import type { ListCustomersRequest } from '@/hooks/useCustomers/types';
import type { BrochureFormData } from '../schema';

interface BrochureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brochure: Brochure | null;
  onCreated?: (brochure: BrochureDetail) => void;
}

function getChangedFields(data: BrochureFormData, brochure: Brochure) {
  const body: Partial<CreateBrochureRequest['payload']> = {};

  if (data.name !== brochure.name) {
    body.name = data.name;
  }

  if (data.brochureTypeId !== brochure.brochureTypeId) {
    body.brochureTypeId = data.brochureTypeId;
  }

  if (data.customerId !== brochure.customerId) {
    body.customerId = data.customerId;
  }

  return body;
}

function BrochureFormDialog({
  open,
  onOpenChange,
  brochure,
  onCreated,
}: BrochureFormDialogProps) {
  const { createMutation, updateMutation } = useBrochures();
  const { getBrochureTypes } = useBrochureTypes();
  const { getCustomers } = useCustomers();
  const isEditMode = Boolean(brochure);
  const mutation = isEditMode ? updateMutation : createMutation;

  const defaultValues = useMemo<BrochureFormData>(() => {
    if (!brochure) return defaultBrochureValues;

    return {
      name: brochure.name,
      brochureTypeId: brochure.brochureTypeId,
      customerId: brochure.customerId,
    };
  }, [brochure]);

  const form = useForm<BrochureFormData>({
    resolver: zodResolver(brochureFormSchema),
    defaultValues,
  });

  const baseBrochureTypeOptions = useMemo<SearchableSelectOption[]>(
    () =>
      brochure
        ? [
            {
              value: brochure.brochureTypeId,
              label: brochure.brochureTypeName,
            },
          ]
        : [],
    [brochure],
  );
  const baseCustomerOptions = useMemo<SearchableSelectOption[]>(
    () =>
      brochure?.customerId && brochure.customerName
        ? [
            {
              value: brochure.customerId,
              label: brochure.customerName,
            },
          ]
        : [],
    [brochure],
  );

  const selectBrochureTypeOptions = useCallback(
    (data: ListBrochureTypesRequest['response']['data'] | undefined) =>
      (data?.brochureTypes ?? []).map((brochureType) => ({
        value: brochureType.id,
        label: brochureType.name,
        description: `${brochureType.colSpan} columns`,
      })),
    [],
  );
  const selectCustomerOptions = useCallback(
    (data: ListCustomersRequest['response']['data'] | undefined) =>
      (data?.customers ?? []).map((customer) => ({
        value: customer.id,
        label: customer.name,
        description: customer.acumaticaId,
      })),
    [],
  );

  const {
    options: brochureTypeOptions,
    setSearch: setBrochureTypeSearch,
    isSearching: isSearchingBrochureTypes,
  } = useServerSearchSelectOptions({
    queryKey: (params: ListBrochureTypesRequest['payload']) =>
      [ReactQueryKeys.GET_BROCHURE_TYPES, 'brochure-form', params] as const,
    queryFn: getBrochureTypes,
    selectOptions: selectBrochureTypeOptions,
    baseOptions: baseBrochureTypeOptions,
    enabled: open,
  });

  const {
    options: customerOptions,
    setSearch: setCustomerSearch,
    isSearching: isSearchingCustomers,
  } = useServerSearchSelectOptions({
    queryKey: (params: ListCustomersRequest['payload']) =>
      [ReactQueryKeys.GET_CUSTOMERS, 'brochure-form', params] as const,
    queryFn: getCustomers,
    selectOptions: selectCustomerOptions,
    baseOptions: baseCustomerOptions,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  function onSubmit(data: BrochureFormData) {
    if (!brochure) {
      createMutation.mutate(data, {
        onSuccess: (response) => {
          onCreated?.(response.brochure);
          onOpenChange(false);
        },
      });
      return;
    }

    const body = getChangedFields(data, brochure);

    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }

    updateMutation.mutate(
      { id: brochure.id, body },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit brochure' : 'New brochure'}
          </DialogTitle>
          <DialogDescription>
            Manage the brochure identity, type, and customer assignment used in
            inventory and chart workflows.
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
                      placeholder="Albuquerque Visitor Guide"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="brochureTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brochure type</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={brochureTypeOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select type"
                        searchPlaceholder="Search brochure types"
                        emptyMessage="No brochure types found"
                        isLoading={isSearchingBrochureTypes}
                        disabled={mutation.isPending}
                        icon={<Tags className="size-4 shrink-0" />}
                        onSearchChange={setBrochureTypeSearch}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <SearchableSelect
                          options={customerOptions}
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          placeholder="Unassigned"
                          searchPlaceholder="Search customers"
                          emptyMessage="No customers found"
                          isLoading={isSearchingCustomers}
                          disabled={mutation.isPending}
                          className="min-w-0"
                          icon={<UserRound className="size-4 shrink-0" />}
                          onSearchChange={setCustomerSearch}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => field.onChange(null)}
                        disabled={mutation.isPending || !field.value}
                        aria-label="Clear customer"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isEditMode ? 'Save changes' : 'Create brochure'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(BrochureFormDialog);
