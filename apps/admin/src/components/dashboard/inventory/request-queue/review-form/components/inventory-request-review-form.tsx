import { memo, useCallback, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import {
  Form,
  FormControl,
  FormDescription,
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
  FileImage,
  Loader2,
  RotateCcw,
  Save,
  Tags,
  UserRound,
  Warehouse,
} from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';
import BrochureImageRequestField from '@/components/dashboard/inventory/intake-request/components/brochure-image-request-field';
import DateReceivedField from '@/components/dashboard/inventory/intake-request/components/date-received-field';

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
  getInventoryRequestReviewValues,
  inventoryRequestReviewFormSchema,
  REVIEW_TRANSACTION_TYPE_OPTIONS,
} from '../schema';
import {
  normalizeReviewKey,
  normalizeReviewText,
  reviewTextMatches,
} from '../utils';
import ReviewCreatableSearchField from './review-creatable-search-field';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type { ListBrochureTypesRequest } from '@/hooks/useBrochureTypes/types';
import type { ListCustomersRequest } from '@/hooks/useCustomers/types';
import type {
  Brochure,
  ListBrochuresRequest,
} from '@/hooks/useInventoryBrochures/types';
import type {
  ApproveInventoryRequestPayload,
  InventoryRequest,
} from '@/hooks/useInventoryRequests/types';
import type { ListWarehousesRequest } from '@/hooks/useWarehouses/types';
import type { InventoryRequestReviewFormData } from '../schema';
import type { ReviewBrochureOption, ReviewCustomerOption } from '../types';

type WarehouseOptionData = ListWarehousesRequest['response']['data'];
type BrochureTypeOptionData = ListBrochureTypesRequest['response']['data'];
type CustomerOptionData = ListCustomersRequest['response']['data'];
type BrochureOptionData = ListBrochuresRequest['response']['data'];

interface InventoryRequestReviewFormProps {
  ownerId: string;
  request: InventoryRequest;
  isSubmitting: boolean;
  isRejecting: boolean;
  onSubmit: (values: ApproveInventoryRequestPayload) => void;
  onReject: () => void;
}

function getBrochureOption(brochure: Brochure): ReviewBrochureOption {
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

function InventoryRequestReviewForm({
  ownerId,
  request,
  isSubmitting,
  isRejecting,
  onSubmit,
  onReject,
}: InventoryRequestReviewFormProps) {
  const { brochureQueryOptions, brochuresQueryOptions, getBrochures } =
    useInventoryBrochures();
  const { getBrochureTypes } = useBrochureTypes();
  const { getCustomers, customersQueryOptions } = useCustomers();
  const { getWarehouses } = useWarehouses();

  const defaultValues = useMemo(
    () => getInventoryRequestReviewValues(request),
    [request],
  );
  const form = useForm<InventoryRequestReviewFormData>({
    resolver: zodResolver(inventoryRequestReviewFormSchema),
    defaultValues,
  });

  const [selectedBrochureId, setSelectedBrochureId] = useState('');
  const [hasManualBrochureSelection, setHasManualBrochureSelection] =
    useState(false);
  const [brochureOptionCache, setBrochureOptionCache] = useState<
    ReviewBrochureOption[]
  >([]);
  const [customerOptionCache, setCustomerOptionCache] = useState<
    ReviewCustomerOption[]
  >([]);

  const brochureTypeId = form.watch('brochureTypeId');
  const brochureName = form.watch('brochureName');
  const customerId = form.watch('customerId');
  const customerName = form.watch('customerName');

  const addBrochureOption = useCallback((option: ReviewBrochureOption) => {
    setBrochureOptionCache((prev) => {
      if (prev.some((cached) => cached.value === option.value)) return prev;
      return [...prev, option];
    });
  }, []);

  const addCustomerOption = useCallback((option: ReviewCustomerOption) => {
    setCustomerOptionCache((prev) => {
      if (prev.some((cached) => cached.value === option.value)) return prev;
      return [...prev, option];
    });
  }, []);

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
    (data: CustomerOptionData | undefined): ReviewCustomerOption[] =>
      (data?.customers ?? []).map((customer) => ({
        value: customer.id,
        label: customer.name,
        description: customer.acumaticaId,
        acumaticaId: customer.acumaticaId,
      })),
    [],
  );

  const selectBrochureOptions = useCallback(
    (data: BrochureOptionData | undefined): ReviewBrochureOption[] =>
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

  const warehouseBaseOptions = useMemo<SearchableSelectOption[]>(() => {
    if (!request.warehouseId) return [];
    return [
      {
        value: request.warehouseId,
        label: request.warehouseName ?? request.warehouseId,
      },
    ];
  }, [request.warehouseId, request.warehouseName]);

  const brochureTypeBaseOptions = useMemo<SearchableSelectOption[]>(() => {
    if (!request.brochureTypeId) return [];
    return [
      {
        value: request.brochureTypeId,
        label: request.brochureTypeName ?? request.brochureTypeId,
      },
    ];
  }, [request.brochureTypeId, request.brochureTypeName]);

  const {
    options: warehouseOptions,
    setSearch: setWarehouseSearch,
    isLoading: isLoadingWarehouses,
  } = useServerSearchSelectOptions({
    queryKey: warehouseQueryKeys.list,
    queryFn: getWarehouses,
    selectOptions: selectWarehouseOptions,
    buildParams: buildSearchParams,
    baseOptions: warehouseBaseOptions,
  });

  const brochureTypeQueryKey = useCallback(
    (params: ListBrochureTypesRequest['payload']) =>
      [
        ReactQueryKeys.GET_BROCHURE_TYPES,
        'inventory-request-review-form',
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
    baseOptions: brochureTypeBaseOptions,
  });

  const customerQueryKey = useCallback(
    (params: ListCustomersRequest['payload']) =>
      [
        ReactQueryKeys.GET_CUSTOMERS,
        'inventory-request-review-form',
        params,
      ] as const,
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
    baseOptions: brochureOptionCache,
  });

  const customerMatchQuery = useQuery({
    ...customersQueryOptions({
      search: request.customerName ?? undefined,
      limit: 10,
    }),
    enabled: Boolean(request.customerName),
  });

  const matchedCustomer = useMemo(() => {
    const requestCustomerKey = normalizeReviewKey(request.customerName);
    if (!requestCustomerKey) return null;

    return (
      customerMatchQuery.data?.customers.find(
        (customer) =>
          normalizeReviewKey(customer.name) === requestCustomerKey ||
          normalizeReviewKey(customer.acumaticaId) === requestCustomerKey,
      ) ?? null
    );
  }, [customerMatchQuery.data?.customers, request.customerName]);

  const brochureMatchQuery = useQuery({
    ...brochuresQueryOptions({
      search: request.brochureName ?? undefined,
      brochureTypeId: request.brochureTypeId ?? undefined,
      limit: 10,
    }),
    enabled: Boolean(request.brochureName && request.brochureTypeId),
  });

  const matchedBrochure = useMemo(() => {
    if (!request.brochureName) return null;

    return (
      brochureMatchQuery.data?.brochures.find(
        (brochure) =>
          reviewTextMatches(brochure.name, request.brochureName) &&
          brochure.brochureTypeId === request.brochureTypeId &&
          reviewTextMatches(brochure.customerName, request.customerName),
      ) ?? null
    );
  }, [
    brochureMatchQuery.data?.brochures,
    request.brochureName,
    request.brochureTypeId,
    request.customerName,
  ]);

  const autoCustomerId = useMemo(() => {
    if (!matchedCustomer) return '';
    return reviewTextMatches(customerName, request.customerName)
      ? matchedCustomer.id
      : '';
  }, [customerName, matchedCustomer, request.customerName]);

  const canUseMatchedBrochure = Boolean(
    matchedBrochure &&
    reviewTextMatches(brochureName, request.brochureName) &&
    brochureTypeId === request.brochureTypeId &&
    reviewTextMatches(customerName, request.customerName),
  );
  const effectiveSelectedBrochureId = hasManualBrochureSelection
    ? selectedBrochureId
    : canUseMatchedBrochure
      ? (matchedBrochure?.id ?? '')
      : '';

  const brochureDetailQuery = useQuery({
    ...brochureQueryOptions(effectiveSelectedBrochureId),
    enabled: effectiveSelectedBrochureId.length > 0,
  });
  const selectedBrochureImages =
    brochureDetailQuery.data?.brochure.images ?? [];

  const handleCustomerSelect = useCallback(
    (option: SearchableSelectOption) => {
      const customerOption = option as ReviewCustomerOption;

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
      form.setValue('customerName', normalizeReviewText(name), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const handleBrochureSelect = useCallback(
    (option: SearchableSelectOption) => {
      const brochureOption = option as ReviewBrochureOption;

      addBrochureOption(brochureOption);
      setHasManualBrochureSelection(true);
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
    },
    [addBrochureOption, form],
  );

  const handleBrochureUseText = useCallback(
    (name: string) => {
      setHasManualBrochureSelection(true);
      setSelectedBrochureId('');
      form.setValue('brochureName', normalizeReviewText(name), {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const resetForm = useCallback(() => {
    form.reset(getInventoryRequestReviewValues(request));
    setHasManualBrochureSelection(false);
    setSelectedBrochureId('');
  }, [form, request]);

  const handleSubmit = useCallback(
    (values: InventoryRequestReviewFormData) => {
      const selectedCustomerId = values.customerId || autoCustomerId;

      onSubmit({
        warehouseId: values.warehouseId,
        brochureTypeId: values.brochureTypeId,
        customerId: selectedCustomerId || undefined,
        customerName: values.customerName || undefined,
        brochureName: values.brochureName,
        imageUrl: values.imageUrl || undefined,
        dateReceived: values.dateReceived,
        boxes: values.boxes,
        unitsPerBox: values.unitsPerBox,
        transactionType: values.transactionType,
        notes: values.notes || undefined,
      });
    },
    [autoCustomerId, onSubmit],
  );

  const isLoadingOptions = isLoadingWarehouses || isLoadingBrochureTypes;

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
              <FormDescription>
                Final warehouse where this stock will be counted.
              </FormDescription>
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
                  onChange={(value) => {
                    field.onChange(value);
                    setHasManualBrochureSelection(true);
                    setSelectedBrochureId('');
                  }}
                  placeholder="Select brochure type"
                  searchPlaceholder="Search brochure types"
                  emptyMessage="No brochure types found"
                  isLoading={isLoadingBrochureTypes}
                  disabled={isSubmitting}
                  icon={<Tags className="size-4 shrink-0" />}
                  onSearchChange={setBrochureTypeSearch}
                />
              </FormControl>
              <FormDescription>
                Category used for this brochure in inventory.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Acumatica customer</FormLabel>
              <FormControl>
                <ReviewCreatableSearchField
                  value={field.value}
                  selectedValue={customerId || autoCustomerId}
                  options={customerOptions}
                  search={customerSearch}
                  onSearchChange={setCustomerSearch}
                  onSelect={handleCustomerSelect}
                  onUseText={handleCustomerUseText}
                  isLoading={isSearchingCustomers}
                  disabled={isSubmitting}
                  placeholder="Select or keep customer"
                  searchPlaceholder="Search Acumatica customers"
                  emptyMessage="No customers found"
                  icon={<UserRound className="size-4 shrink-0" />}
                  getTextLabel={(value) => `Keep "${value}" as customer`}
                  textDescription="Keeps the staff-entered customer text"
                />
              </FormControl>
              <FormDescription>
                Customer name from the staff request, matched when possible.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brochureName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brochure name</FormLabel>
              <FormControl>
                <ReviewCreatableSearchField
                  value={field.value}
                  selectedValue={effectiveSelectedBrochureId}
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
              <FormDescription>
                Brochure name that will be used for the stock item.
              </FormDescription>
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
              brochureId={effectiveSelectedBrochureId}
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
                  {REVIEW_TRANSACTION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Delivery adds to the current balance; Start Count sets it.
              </FormDescription>
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
              <FormDescription>
                Number of boxes from the reviewed request.
              </FormDescription>
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
              <FormDescription>
                Pack size that will be matched or created for the brochure
                image.
              </FormDescription>
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
                  placeholder="Condition, shipment details, or review notes"
                  className="min-h-24 resize-y"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Notes saved on the request and approval transaction.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onReject}
            disabled={isSubmitting || isRejecting}
            className="text-destructive hover:text-destructive"
          >
            <FileImage className="size-4" />
            Reject
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isSubmitting}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoadingOptions}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Approve request
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default memo(InventoryRequestReviewForm);
