import { memo, type ReactNode, useCallback, useMemo, useState } from 'react';

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
import {
  Building2,
  Loader2,
  Send,
  Tags,
  UserRound,
  Warehouse,
} from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';
import BrochureImageRequestField from '@/components/dashboard/inventory/intake-request/components/brochure-image-request-field';
import DateReceivedField from '@/components/dashboard/inventory/intake-request/components/date-received-field';
import ReviewCreatableSearchField from '@/components/dashboard/inventory/request-queue/review-form/components/review-creatable-search-field';

import { useBrochureTypes } from '@/hooks/useBrochureTypes';
import { useCustomers } from '@/hooks/useCustomers';
import {
  inventoryBrochureQueryKeys,
  useInventoryBrochures,
} from '@/hooks/useInventoryBrochures';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses, warehouseQueryKeys } from '@/hooks/useWarehouses';

import { ReactQueryKeys } from '@/types/react-query-keys';

import {
  getDefaultInventoryIntakeValues,
  inventoryIntakeFormSchema,
  normalizeInventoryIntakeText,
  TRANSACTION_TYPE_OPTIONS,
} from '../schema';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type { ListBrochureTypesRequest } from '@/hooks/useBrochureTypes/types';
import type { ListCustomersRequest } from '@/hooks/useCustomers/types';
import type {
  Brochure,
  ListBrochuresRequest,
} from '@/hooks/useInventoryBrochures/types';
import type { CreateInventoryIntakePayload } from '@/hooks/useInventoryItems/types';
import type { ListWarehousesRequest } from '@/hooks/useWarehouses/types';
import type { InventoryIntakeFormData } from '../schema';

type WarehouseOptionData = ListWarehousesRequest['response']['data'];
type BrochureTypeOptionData = ListBrochureTypesRequest['response']['data'];
type CustomerOptionData = ListCustomersRequest['response']['data'];
type BrochureOptionData = ListBrochuresRequest['response']['data'];

interface IntakeCustomerOption extends SearchableSelectOption {
  acumaticaId: string;
}

interface IntakeBrochureOption extends SearchableSelectOption {
  brochureTypeId: string;
  customerId: string | null;
  customerName: string | null;
}

interface InventoryIntakeFormProps {
  ownerId: string;
  isSubmitting: boolean;
  onSubmit: (
    values: CreateInventoryIntakePayload,
    onSuccess: () => void,
  ) => void;
  initialValues?: Partial<InventoryIntakeFormData>;
  submitLabel?: string;
  headerSlot?: ReactNode;
  extraFooterActions?: ReactNode;
  resetOnSuccess?: boolean;
  seedBrochureOption?: SearchableSelectOption | null;
}

function getBrochureOption(brochure: Brochure): IntakeBrochureOption {
  return {
    value: brochure.id,
    label: brochure.name,
    description:
      brochure.brochureTypeName +
      (brochure.customerName ? ` · ${brochure.customerName}` : ''),
    brochureTypeId: brochure.brochureTypeId,
    customerId: brochure.customerId,
    customerName: brochure.customerName,
  };
}

function InventoryIntakeForm({
  ownerId,
  isSubmitting,
  onSubmit,
  initialValues,
  submitLabel = 'Save intake',
  headerSlot,
  extraFooterActions,
  resetOnSuccess = true,
  seedBrochureOption,
}: InventoryIntakeFormProps) {
  const { brochureQueryOptions, getBrochures } = useInventoryBrochures();
  const { getBrochureTypes } = useBrochureTypes();
  const { getCustomers } = useCustomers();
  const { getWarehouses } = useWarehouses();

  const defaultValues = useMemo(
    () => ({ ...getDefaultInventoryIntakeValues(), ...initialValues }),
    [initialValues],
  );

  const form = useForm<InventoryIntakeFormData>({
    resolver: zodResolver(inventoryIntakeFormSchema),
    defaultValues,
  });

  const brochureTypeId = form.watch('brochureTypeId');
  const customerId = form.watch('customerId');

  const [selectedBrochureId, setSelectedBrochureId] = useState('');
  const [brochureOptionCache, setBrochureOptionCache] = useState<
    IntakeBrochureOption[]
  >([]);
  const [customerOptionCache, setCustomerOptionCache] = useState<
    IntakeCustomerOption[]
  >([]);

  const addBrochureOption = useCallback((option: IntakeBrochureOption) => {
    setBrochureOptionCache((prev) => {
      if (prev.some((cached) => cached.value === option.value)) return prev;
      return [...prev, option];
    });
  }, []);

  const addCustomerOption = useCallback((option: IntakeCustomerOption) => {
    setCustomerOptionCache((prev) => {
      if (prev.some((cached) => cached.value === option.value)) return prev;
      return [...prev, option];
    });
  }, []);

  const seededBrochureOption = useMemo<IntakeBrochureOption[]>(() => {
    if (!seedBrochureOption) return [];

    return [
      {
        ...seedBrochureOption,
        brochureTypeId: initialValues?.brochureTypeId ?? '',
        customerId: initialValues?.customerId || null,
        customerName: initialValues?.customerName || null,
      },
    ];
  }, [initialValues, seedBrochureOption]);

  const brochureBaseOptions = useMemo(() => {
    const options = [...seededBrochureOption, ...brochureOptionCache];
    return options.filter(
      (option, index, list) =>
        list.findIndex((item) => item.value === option.value) === index,
    );
  }, [brochureOptionCache, seededBrochureOption]);

  const selectWarehouseOptions = useCallback(
    (data: WarehouseOptionData | undefined): SearchableSelectOption[] =>
      (data?.warehouses ?? []).map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name,
        description: warehouse.acumaticaId ?? undefined,
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

  const selectCustomerOptions = useCallback(
    (data: CustomerOptionData | undefined): IntakeCustomerOption[] =>
      (data?.customers ?? []).map((customer) => ({
        value: customer.id,
        label: customer.name,
        description: customer.acumaticaId,
        acumaticaId: customer.acumaticaId,
      })),
    [],
  );

  const selectBrochureOptions = useCallback(
    (data: BrochureOptionData | undefined): IntakeBrochureOption[] =>
      (data?.brochures ?? []).map(getBrochureOption),
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
    }) => ({ page, limit, search }),
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

  const brochureTypeQueryKey = useCallback(
    (params: ListBrochureTypesRequest['payload']) =>
      [
        ReactQueryKeys.GET_BROCHURE_TYPES,
        'manager-intake-form',
        params,
      ] as const,
    [],
  );

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

  const customerQueryKey = useCallback(
    (params: ListCustomersRequest['payload']) =>
      [ReactQueryKeys.GET_CUSTOMERS, 'manager-intake-form', params] as const,
    [],
  );

  const {
    options: customerOptions,
    search: customerSearch,
    setSearch: setCustomerSearch,
    isSearching: isSearchingCustomers,
  } = useServerSearchSelectOptions({
    queryKey: customerQueryKey,
    queryFn: getCustomers,
    selectOptions: selectCustomerOptions,
    buildParams: buildSearchParams,
    baseOptions: customerOptionCache,
  });

  const buildBrochureSearchParams = useCallback(
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
      brochureTypeId: brochureTypeId || undefined,
    }),
    [brochureTypeId],
  );

  const {
    options: brochureOptions,
    search: brochureSearch,
    setSearch: setBrochureSearch,
    isSearching: isSearchingBrochures,
  } = useServerSearchSelectOptions({
    queryKey: (params) => inventoryBrochureQueryKeys.list(params),
    queryFn: getBrochures,
    selectOptions: selectBrochureOptions,
    buildParams: buildBrochureSearchParams,
    baseOptions: brochureBaseOptions,
  });

  const brochureDetailQuery = useQuery({
    ...brochureQueryOptions(selectedBrochureId),
    enabled: selectedBrochureId.length > 0,
  });
  const selectedBrochureImages =
    brochureDetailQuery.data?.brochure.images ?? [];

  const handleCustomerSelect = useCallback(
    (option: SearchableSelectOption) => {
      const customerOption = option as IntakeCustomerOption;

      addCustomerOption(customerOption);
      form.setValue('customerId', customerOption.value, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('customerName', customerOption.label, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [addCustomerOption, form],
  );

  const handleCustomerUseText = useCallback(
    (name: string) => {
      form.setValue('customerId', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('customerName', normalizeInventoryIntakeText(name), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const handleBrochureSelect = useCallback(
    (option: SearchableSelectOption) => {
      const brochureOption = option as IntakeBrochureOption;

      addBrochureOption(brochureOption);
      setSelectedBrochureId(brochureOption.value);
      form.setValue('brochureName', brochureOption.label, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('brochureTypeId', brochureOption.brochureTypeId, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('customerId', brochureOption.customerId ?? '', {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('customerName', brochureOption.customerName ?? '', {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue('imageUrl', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [addBrochureOption, form],
  );

  const handleBrochureUseText = useCallback(
    (name: string) => {
      setSelectedBrochureId('');
      form.setValue('brochureName', normalizeInventoryIntakeText(name), {
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

  const handleBrochureTypeChange = useCallback(
    (value: string, onChange: (value: string) => void) => {
      onChange(value);
      setSelectedBrochureId('');
      form.setValue('imageUrl', '', {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const resetForm = useCallback(() => {
    form.reset({ ...getDefaultInventoryIntakeValues(), ...initialValues });
    setSelectedBrochureId('');
  }, [form, initialValues]);

  const handleSubmit = useCallback(
    (values: InventoryIntakeFormData) => {
      if (values.boxes === undefined) {
        form.setError('boxes', { message: 'Boxes is required' });
        return;
      }

      if (values.unitsPerBox === undefined) {
        form.setError('unitsPerBox', { message: 'Units per box is required' });
        return;
      }

      onSubmit(
        {
          warehouseId: values.warehouseId,
          brochureTypeId: values.brochureTypeId,
          customerId: values.customerId || undefined,
          customerName: values.customerName || undefined,
          brochureName: values.brochureName,
          imageUrl: values.imageUrl || undefined,
          boxes: values.boxes,
          unitsPerBox: values.unitsPerBox,
          transactionType: values.transactionType,
          transactionDate: values.transactionDate,
          notes: values.notes || undefined,
        },
        () => {
          if (resetOnSuccess) resetForm();
        },
      );
    },
    [form, onSubmit, resetForm, resetOnSuccess],
  );

  const isLoadingOptions = isLoadingWarehouses || isLoadingBrochureTypes;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {headerSlot}

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
                  onChange={(value) =>
                    handleBrochureTypeChange(value, field.onChange)
                  }
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
                <ReviewCreatableSearchField
                  value={field.value}
                  selectedValue={customerId}
                  options={customerOptions}
                  search={customerSearch}
                  onSearchChange={setCustomerSearch}
                  onSelect={handleCustomerSelect}
                  onUseText={handleCustomerUseText}
                  isLoading={isSearchingCustomers}
                  disabled={isSubmitting}
                  placeholder="Customer name"
                  searchPlaceholder="Search Acumatica customers"
                  emptyMessage="No customers found"
                  icon={<UserRound className="size-4 shrink-0" />}
                  getTextLabel={(value) => `Keep "${value}" as customer`}
                  textDescription="Stores the entered customer text if no record matches"
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
                <ReviewCreatableSearchField
                  value={field.value}
                  selectedValue={selectedBrochureId}
                  options={brochureOptions}
                  search={brochureSearch}
                  onSearchChange={setBrochureSearch}
                  onSelect={handleBrochureSelect}
                  onUseText={handleBrochureUseText}
                  isLoading={isSearchingBrochures}
                  disabled={isSubmitting}
                  placeholder="Select or keep brochure"
                  searchPlaceholder="Search brochures or type a name"
                  emptyMessage="No brochures found"
                  icon={<Building2 className="size-4 shrink-0" />}
                  getTextLabel={(value) => `Keep "${value}" as brochure`}
                  textDescription="Creates the brochure if no exact match exists"
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
          name="transactionDate"
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
                  placeholder="Enter boxes"
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
                  placeholder="Enter units/box"
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
                  placeholder="Shipment, condition, or count notes"
                  className="min-h-24 resize-y"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {extraFooterActions}
          <Button type="submit" disabled={isSubmitting || isLoadingOptions}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default memo(InventoryIntakeForm);
