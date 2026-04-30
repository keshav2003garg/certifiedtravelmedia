import { memo, useCallback, useMemo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Calendar } from '@repo/ui/components/base/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/base/popover';
import { Textarea } from '@repo/ui/components/base/textarea';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import {
  CalendarIcon,
  FileImage,
  Loader2,
  Send,
  Tags,
  Warehouse,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatFullDate, parseISODate, toISODate } from '@repo/utils/date';

import ImageUploadField from '@/components/common/image-upload-field';
import SearchableSelect from '@/components/common/searchable-select';

import { useBrochureTypes } from '@/hooks/useBrochureTypes';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses, warehouseQueryKeys } from '@/hooks/useWarehouses';

import { ReactQueryKeys } from '@/types/react-query-keys';

import {
  getDefaultInventoryRequestValues,
  inventoryRequestFormSchema,
} from '../schema';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type { ListBrochureTypesRequest } from '@/hooks/useBrochureTypes/types';
import type { CreateInventoryRequestPayload } from '@/hooks/useInventoryRequests/types';
import type { ListWarehousesRequest } from '@/hooks/useWarehouses/types';
import type { InventoryRequestFormData } from '../schema';

type WarehouseOptionData = ListWarehousesRequest['response']['data'];
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
  const { getBrochureTypes } = useBrochureTypes();
  const { getWarehouses } = useWarehouses();
  const defaultValues = useMemo(getDefaultInventoryRequestValues, []);

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

  const form = useForm<InventoryRequestFormData>({
    resolver: zodResolver(inventoryRequestFormSchema),
    defaultValues,
  });

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
        transactionType: 'Delivery',
        notes: values.notes || undefined,
      },
      resetForm,
    );
  }

  function resetForm() {
    form.reset(getDefaultInventoryRequestValues());
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
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
                    placeholder="Select type"
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
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="brochureName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brochure name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Spring Visitor Guide"
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
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Brochure image</FormLabel>
              <FormControl>
                <ImageUploadField
                  bucket="inventory"
                  prefix="inventory-requests"
                  ownerId={ownerId}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  invalid={Boolean(fieldState.error)}
                  helperText="Attach the cover image used for manager review."
                  className="h-56"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 lg:grid-cols-3">
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
        </div>

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

interface DateReceivedFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const DateReceivedField = memo(function DateReceivedField({
  value,
  onChange,
  disabled,
}: DateReceivedFieldProps) {
  const selectedDate = useMemo(() => parseISODate(value), [value]);

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      onChange(date ? toISODate(date) : '');
    },
    [onChange],
  );

  return (
    <FormItem className="flex flex-col">
      <FormLabel>Date received</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                'w-full justify-between font-normal',
                !selectedDate && 'text-muted-foreground',
              )}
            >
              {selectedDate ? formatFullDate(selectedDate) : 'Pick a date'}
              <CalendarIcon className="size-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Calendar
            className="w-full"
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
});

export default memo(InventoryRequestForm);
