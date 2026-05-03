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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Input } from '@repo/ui/components/base/input';
import { Switch } from '@repo/ui/components/base/switch';
import { Textarea } from '@repo/ui/components/base/textarea';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { Layers3, Loader2 } from '@repo/ui/lib/icons';

import SearchableMultiSelect from '@/components/common/searchable-multi-select';

import { useResetFormOnActivation } from '@/hooks/useResetFormOnActivation';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses, warehouseQueryKeys } from '@/hooks/useWarehouses';

import { defaultWarehouseValues, warehouseFormSchema } from '../schema';

import type {
  ListSectorsRequest,
  Warehouse,
} from '@/hooks/useWarehouses/types';
import type { WarehouseFormData } from '../schema';

interface WarehouseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse | null;
}

function haveSameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;

  const ids = new Set(a);
  return b.every((id) => ids.has(id));
}

function getChangedFields(data: WarehouseFormData, warehouse: Warehouse) {
  const body: Partial<WarehouseFormData> = {};
  const acumaticaId = warehouse.acumaticaId ?? '';
  const address = warehouse.address ?? '';
  const sectorIds = warehouse.sectors.map((sector) => sector.id);

  if (data.name !== warehouse.name) {
    body.name = data.name;
  }

  if (data.acumaticaId !== acumaticaId) {
    body.acumaticaId = data.acumaticaId;
  }

  if (data.address !== address) {
    body.address = data.address;
  }

  if (data.isActive !== warehouse.isActive) {
    body.isActive = data.isActive;
  }

  if (!haveSameIds(data.sectorIds, sectorIds)) {
    body.sectorIds = data.sectorIds;
  }

  return body;
}

function WarehouseFormDialog({
  open,
  onOpenChange,
  warehouse,
}: WarehouseFormDialogProps) {
  const isEditMode = Boolean(warehouse);

  const { createMutation, getSectors, updateMutation } = useWarehouses();
  const mutation = isEditMode ? updateMutation : createMutation;

  const defaultValues = useMemo<WarehouseFormData>(() => {
    if (!warehouse) return defaultWarehouseValues;

    return {
      name: warehouse.name,
      acumaticaId: warehouse.acumaticaId ?? '',
      address: warehouse.address ?? '',
      isActive: warehouse.isActive,
      sectorIds: warehouse.sectors.map((sector) => sector.id),
    };
  }, [warehouse]);

  const form = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues,
  });

  const baseSectorOptions = useMemo(
    () =>
      (warehouse?.sectors ?? []).map((sector) => ({
        value: sector.id,
        label: sector.description,
        description: sector.acumaticaId,
      })),
    [warehouse?.sectors],
  );
  const selectSectorOptions = useCallback(
    (data: ListSectorsRequest['response']['data'] | undefined) =>
      (data?.sectors ?? []).map((sector) => ({
        value: sector.id,
        label: sector.description,
        description: sector.acumaticaId,
      })),
    [],
  );
  const {
    options: sectorOptions,
    setSearch: setSectorSearch,
    isSearching: isSearchingSectors,
  } = useServerSearchSelectOptions({
    queryKey: warehouseQueryKeys.sectors,
    queryFn: getSectors,
    selectOptions: selectSectorOptions,
    baseOptions: baseSectorOptions,
    enabled: open,
  });

  useResetFormOnActivation(
    open,
    form.reset,
    defaultValues,
    warehouse?.id ?? null,
  );

  function onSubmit(data: WarehouseFormData) {
    if (!warehouse) {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
      return;
    }

    const body = getChangedFields(data, warehouse);

    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }

    updateMutation.mutate(
      { id: warehouse.id, body },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit warehouse' : 'New warehouse'}
          </DialogTitle>
          <DialogDescription>
            Manage warehouse identity, location, sector coverage, and active
            status.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Atlanta warehouse"
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
                        placeholder="WH0001"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-24 resize-y"
                      placeholder="1200 Distribution Way, Atlanta, GA"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sectorIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sectors</FormLabel>
                  <SearchableMultiSelect
                    options={sectorOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select sectors"
                    searchPlaceholder="Search sectors"
                    emptyMessage="No sectors found"
                    isLoading={isSearchingSectors}
                    disabled={mutation.isPending}
                    onSearchChange={setSectorSearch}
                    triggerIcon={<Layers3 className="size-4 shrink-0" />}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border p-3">
                  <div className="space-y-1">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Active warehouses remain available for inventory flows.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
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
                {isEditMode ? 'Save changes' : 'Create warehouse'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(WarehouseFormDialog);
