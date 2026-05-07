import { memo, useCallback, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

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
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { Textarea } from '@repo/ui/components/base/textarea';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import { FileImage, Loader2, Send, Tags, Warehouse } from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';

import { useBrochureTypes } from '@/hooks/useBrochureTypes';
import {
  inventoryBrochureQueryKeys,
  useInventoryBrochures,
} from '@/hooks/useInventoryBrochures';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses, warehouseQueryKeys } from '@/hooks/useWarehouses';

import { ReactQueryKeys } from '@/types/react-query-keys';

import {
  getDefaultInventoryRequestValues,
  inventoryRequestFormSchema,
  TRANSACTION_TYPE_OPTIONS,
} from '../schema';
import BrochureImageRequestField from './brochure-image-request-field';
import BrochureNameSearchField from './brochure-name-search-field';
import DateReceivedField from './date-received-field';
import { normalizeBrochureName } from './utils';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type { ListBrochureTypesRequest } from '@/hooks/useBrochureTypes/types';
import type { ListBrochuresRequest } from '@/hooks/useInventoryBrochures/types';
import type { CreateInventoryRequestPayload } from '@/hooks/useInventoryRequests/types';
import type { ListWarehousesRequest } from '@/hooks/useWarehouses/types';
import type { InventoryRequestFormData } from '../schema';
import type { BrochureOption } from './types';

type WarehouseOptionData = ListWarehousesRequest['response']['data'];
type BrochureOptionData = ListBrochuresRequest['response']['data'];
type BrochureTypeOptionData = ListBrochureTypesRequest['response']['data'];

interface InventoryRequestFormProps {
  ownerId: string;
  isSubmitting: boolean;
  onSubmit: (
    values: CreateInventoryRequestPayload,
    onSuccess: () => void,
  ) => void;
}

function InventoryRequestForm({
  ownerId,
  isSubmitting,
  onSubmit,
}: InventoryRequestFormProps) {
  const { brochureQueryOptions, getBrochures } = useInventoryBrochures();
  const { getBrochureTypes } = useBrochureTypes();
  const { getWarehouses } = useWarehouses();
  const defaultValues = useMemo(getDefaultInventoryRequestValues, []);

  const form = useForm<InventoryRequestFormData>({
    resolver: zodResolver(inventoryRequestFormSchema),
    defaultValues,
  });

  const [selectedBrochureId, setSelectedBrochureId] = useState('');

  const selectWarehouseOptions = useCallback(
    (data: WarehouseOptionData | undefined): SearchableSelectOption[] =>
      (data?.warehouses ?? []).map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name,
        description: warehouse.acumaticaId ?? undefined,
      })),
    [],
  );
  const selectBrochureOptions = useCallback(
    (data: BrochureOptionData | undefined): BrochureOption[] =>
      (data?.brochures ?? []).map((brochure) => ({
        value: brochure.id,
        label: brochure.name,
        description:
          brochure.brochureTypeName +
          (brochure.customerName ? ` · ${brochure.customerName}` : ''),
        brochureTypeId: brochure.brochureTypeId,
        customerName: brochure.customerName,
      })),
    [],
  );
  const selectBrochureTypeOptions = useCallback(
    (data: BrochureTypeOptionData | undefined): SearchableSelectOption[] =>
      (data?.brochureTypes ?? []).map((brochureType) => ({
        value: brochureType.id,
        label: brochureType.name,
        description: `${brochureType.colSpan} columns`,
      })),
    [],
  );

  const buildSearchParams = useCallback(
    ({
      page,
      limit,
      search,
    }: {
      page: number;
      limit: number;
      search?: string;
    }) => ({
      page,
      limit,
      search,
    }),
    [],
  );

  const brochureTypeQueryKey = useCallback(
    (params: ListBrochureTypesRequest['payload']) =>
      [
        ReactQueryKeys.GET_BROCHURE_TYPES,
        'inventory-request-form',
        params,
      ] as const,
    [],
  );

  const {
    options: warehouseOptions,
    setSearch: setWarehouseSearch,
    isLoading: isLoadingWarehouses,
  } = useServerSearchSelectOptions({
    queryKey: warehouseQueryKeys.list,
    queryFn: getWarehouses,
    selectOptions: selectWarehouseOptions,
    buildParams: buildSearchParams,
  });

  const {
    options: brochureOptions,
    search: brochureSearch,
    setSearch: setBrochureSearch,
    isSearching: isSearchingBrochures,
  } = useServerSearchSelectOptions({
    queryKey: (params) => inventoryBrochureQueryKeys.list(params),
    queryFn: getBrochures,
    selectOptions: selectBrochureOptions,
    buildParams: buildSearchParams,
  });

  const {
    options: brochureTypeOptions,
    setSearch: setBrochureTypeSearch,
    isLoading: isLoadingBrochureTypes,
  } = useServerSearchSelectOptions({
    queryKey: brochureTypeQueryKey,
    queryFn: getBrochureTypes,
    selectOptions: selectBrochureTypeOptions,
    buildParams: buildSearchParams,
  });

  const isLoadingOptions = isLoadingWarehouses || isLoadingBrochureTypes;

  const brochureDetailQuery = useQuery({
    ...brochureQueryOptions(selectedBrochureId),
    enabled: selectedBrochureId.length > 0,
  });
  const selectedBrochureImages =
    brochureDetailQuery.data?.brochure.images ?? [];

  const handleBrochureSelect = useCallback(
    (option: BrochureOption) => {
      setSelectedBrochureId(option.value);
      form.setValue('brochureName', option.label, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('brochureTypeId', option.brochureTypeId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('customerName', option.customerName ?? '', {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('imageUrl', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const handleCustomBrochureCreate = useCallback(
    (name: string) => {
      setSelectedBrochureId('');
      form.setValue('brochureName', normalizeBrochureName(name), {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('imageUrl', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  function handleSubmit(values: InventoryRequestFormData) {
    onSubmit(
      {
        warehouseId: values.warehouseId,
        brochureTypeId: values.brochureTypeId,
        brochureName: values.brochureName,
        customerName: values.customerName || undefined,
        imageUrl: values.imageUrl || undefined,
        dateReceived: values.dateReceived,
        boxes: values.boxes,
        unitsPerBox: values.unitsPerBox,
        transactionType: values.transactionType,
        notes: values.notes || undefined,
      },
      resetForm,
    );
  }

  function resetForm() {
    form.reset(getDefaultInventoryRequestValues());
    setSelectedBrochureId('');
    setBrochureSearch('');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="warehouseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warehouse</FormLabel>
              <FormControl>
                <SearchableSelect
                  options={warehouseOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select warehouse"
                  searchPlaceholder="Search warehouses"
                  emptyMessage="No active warehouses found"
                  isLoading={isLoadingWarehouses}
                  disabled={isSubmitting}
                  icon={<Warehouse className="size-4 shrink-0" />}
                  onSearchChange={setWarehouseSearch}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  placeholder="Select brochure type"
                  searchPlaceholder="Search brochure types"
                  emptyMessage="No brochure types found"
                  isLoading={isLoadingBrochureTypes}
                  disabled={isSubmitting}
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
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Customer name"
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brochureName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brochure</FormLabel>
              <FormControl>
                <BrochureNameSearchField
                  value={field.value}
                  selectedBrochureId={selectedBrochureId}
                  options={brochureOptions}
                  search={brochureSearch}
                  onSearchChange={setBrochureSearch}
                  onSelect={handleBrochureSelect}
                  onCreate={handleCustomBrochureCreate}
                  isLoading={isSearchingBrochures}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field, fieldState }) => (
            <BrochureImageRequestField
              ownerId={ownerId}
              brochureId={selectedBrochureId}
              images={selectedBrochureImages}
              isLoading={brochureDetailQuery.isLoading}
              value={field.value ?? ''}
              onChange={field.onChange}
              disabled={isSubmitting}
              invalid={Boolean(fieldState.error)}
            />
          )}
        />

        <FormField
          control={form.control}
          name="dateReceived"
          render={({ field }) => (
            <DateReceivedField
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />

        <FormField
          control={form.control}
          name="transactionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TRANSACTION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="boxes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Boxes</FormLabel>
              <FormControl>
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  min={0.01}
                  step={0.01}
                  decimals={2}
                  placeholder="1"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unitsPerBox"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Units per box</FormLabel>
              <FormControl>
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  min={0.01}
                  step={0.01}
                  decimals={2}
                  placeholder="225"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Condition, shipment details, or anything the manager should know"
                  className="min-h-24 resize-y"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isSubmitting}
          >
            <FileImage className="size-4" />
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoadingOptions}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Submit request
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default memo(InventoryRequestForm);
