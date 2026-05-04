import { memo, useCallback } from 'react';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/base/form';
import { Warehouse } from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';

import {
  type ServerSearchSelectParams,
  useServerSearchSelectOptions,
} from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses } from '@/hooks/useWarehouses';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type { UseFormReturn } from '@repo/ui/lib/form';
import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type { ListWarehousesRequest } from '@/hooks/useWarehouses/types';
import type { CreateInventoryTransactionFormData } from './create-inventory-transaction-dialog.schema';

type WarehouseOptionData = ListWarehousesRequest['response']['data'];
type WarehouseSearchParams = ListWarehousesRequest['payload'] &
  ServerSearchSelectParams;

interface InventoryTransactionDestinationFieldProps {
  currentWarehouseId: string;
  form: UseFormReturn<CreateInventoryTransactionFormData>;
  isOpen: boolean;
  isSubmitting: boolean;
}

function InventoryTransactionDestinationField({
  currentWarehouseId,
  form,
  isOpen,
  isSubmitting,
}: InventoryTransactionDestinationFieldProps) {
  const { getWarehouses } = useWarehouses();

  const selectWarehouseOptions = useCallback(
    (data: WarehouseOptionData | undefined): SearchableSelectOption[] =>
      (data?.warehouses ?? [])
        .filter((warehouse) => warehouse.id !== currentWarehouseId)
        .map((warehouse) => ({
          value: warehouse.id,
          label: warehouse.name,
          description: warehouse.acumaticaId ?? undefined,
        })),
    [currentWarehouseId],
  );

  const buildWarehouseParams = useCallback(
    ({
      page,
      limit,
      search,
    }: ServerSearchSelectParams): WarehouseSearchParams => ({
      page,
      limit,
      search,
      sortBy: 'name',
      order: 'asc',
    }),
    [],
  );

  const warehouseQueryKey = useCallback(
    (params: WarehouseSearchParams) => [
      ReactQueryKeys.GET_WAREHOUSES,
      'inventory-transaction-dialog',
      params,
    ],
    [],
  );

  const {
    options: warehouseOptions,
    setSearch: setWarehouseSearch,
    isSearching: isSearchingWarehouses,
  } = useServerSearchSelectOptions<
    WarehouseOptionData,
    SearchableSelectOption,
    WarehouseSearchParams
  >({
    queryKey: warehouseQueryKey,
    queryFn: getWarehouses,
    selectOptions: selectWarehouseOptions,
    buildParams: buildWarehouseParams,
    enabled: isOpen,
  });

  return (
    <FormField
      control={form.control}
      name="destinationWarehouseId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Destination warehouse</FormLabel>
          <FormControl>
            <SearchableSelect
              options={warehouseOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select warehouse"
              searchPlaceholder="Search warehouses"
              emptyMessage="No warehouses found"
              isLoading={isSearchingWarehouses}
              disabled={isSubmitting}
              icon={<Warehouse className="size-4 shrink-0" />}
              onSearchChange={setWarehouseSearch}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default memo(InventoryTransactionDestinationField);
