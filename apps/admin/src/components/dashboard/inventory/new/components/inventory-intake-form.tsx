import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Badge } from '@repo/ui/components/base/badge';
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
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/base/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { Skeleton } from '@repo/ui/components/base/skeleton';
import { useForm, zodResolver } from '@repo/ui/lib/form';
import {
  CalendarIcon,
  Image as ImageIcon,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Tags,
  Warehouse,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatFullDate, parseISODate, toISODate } from '@repo/utils/date';
import { formatDecimal } from '@repo/utils/number';

import SearchableSelect from '@/components/common/searchable-select';
import BrochureFormDialog from '@/components/dashboard/configs/brochure/components/brochure-form-dialog';

import { brochureQueryKeys, useBrochures } from '@/hooks/useBrochures';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses, warehouseQueryKeys } from '@/hooks/useWarehouses';

import {
  getDefaultInventoryIntakeValues,
  inventoryIntakeFormSchema,
  TRANSACTION_TYPE_OPTIONS,
} from '../schema';
import BrochureImageQuickAddDialog from './brochure-image-quick-add-dialog';
import PackSizeQuickAddDialog from './pack-size-quick-add-dialog';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type {
  BrochureDetail,
  ListBrochuresRequest,
} from '@/hooks/useBrochures/types';
import type { CreateInventoryIntakePayload } from '@/hooks/useInventoryItems/types';
import type { ListWarehousesRequest } from '@/hooks/useWarehouses/types';
import type { InventoryIntakeFormData } from '../schema';

interface InventoryIntakeFormProps {
  ownerId: string;
  isSubmitting: boolean;
  onSubmit: (
    values: CreateInventoryIntakePayload,
    onSuccess: () => void,
  ) => void;
}

function InventoryIntakeForm({
  ownerId,
  isSubmitting,
  onSubmit,
}: InventoryIntakeFormProps) {
  const { brochureQueryOptions, getBrochures } = useBrochures();
  const { getWarehouses } = useWarehouses();
  const defaultValues = useMemo(() => getDefaultInventoryIntakeValues(), []);

  const form = useForm<InventoryIntakeFormData>({
    resolver: zodResolver(inventoryIntakeFormSchema),
    defaultValues,
  });

  const brochureId = form.watch('brochureId');
  const brochureImageId = form.watch('brochureImageId');

  const [createBrochureOpen, setCreateBrochureOpen] = useState(false);
  const [addImageOpen, setAddImageOpen] = useState(false);
  const [addPackSizeOpen, setAddPackSizeOpen] = useState(false);
  const [brochureLabelCache, setBrochureLabelCache] = useState<
    SearchableSelectOption[]
  >([]);

  const brochureDetailQuery = useQuery({
    ...brochureQueryOptions(brochureId),
    enabled: brochureId.length > 0,
  });
  const brochureDetail = brochureDetailQuery.data?.brochure;

  const selectedImage = useMemo(
    () =>
      brochureDetail?.images.find((img) => img.id === brochureImageId) ?? null,
    [brochureDetail, brochureImageId],
  );

  const selectBrochureOptions = useCallback(
    (
      data: ListBrochuresRequest['response']['data'] | undefined,
    ): SearchableSelectOption[] =>
      (data?.brochures ?? []).map((brochure) => ({
        value: brochure.id,
        label: brochure.name,
        description:
          brochure.brochureTypeName +
          (brochure.customerName ? ` · ${brochure.customerName}` : ''),
      })),
    [],
  );

  const {
    options: brochureOptions,
    setSearch: setBrochureSearch,
    isSearching: isSearchingBrochures,
  } = useServerSearchSelectOptions({
    queryKey: (params) => brochureQueryKeys.list(params),
    queryFn: getBrochures,
    selectOptions: selectBrochureOptions,
    baseOptions: brochureLabelCache,
    buildParams: ({ page, limit, search }) => ({ page, limit, search }),
  });

  const selectWarehouseOptions = useCallback(
    (
      data: ListWarehousesRequest['response']['data'] | undefined,
    ): SearchableSelectOption[] =>
      (data?.warehouses ?? []).map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name,
        description: warehouse.acumaticaId ?? undefined,
      })),
    [],
  );

  const {
    options: warehouseOptions,
    setSearch: setWarehouseSearch,
    isSearching: isSearchingWarehouses,
  } = useServerSearchSelectOptions({
    queryKey: warehouseQueryKeys.list,
    queryFn: getWarehouses,
    selectOptions: selectWarehouseOptions,
    buildParams: ({ page, limit, search }) => ({ page, limit, search }),
  });

  // When brochure changes, reset image + pack size selections.
  useEffect(() => {
    form.setValue('brochureImageId', '');
    form.setValue('brochureImagePackSizeId', '');
  }, [brochureId, form]);

  // When image changes, reset pack size selection.
  useEffect(() => {
    form.setValue('brochureImagePackSizeId', '');
  }, [brochureImageId, form]);

  const handleBrochureCreated = useCallback(
    (brochure: BrochureDetail) => {
      setBrochureLabelCache((prev) => {
        if (prev.some((option) => option.value === brochure.id)) return prev;
        return [
          ...prev,
          {
            value: brochure.id,
            label: brochure.name,
            description:
              brochure.brochureTypeName +
              (brochure.customerName ? ` · ${brochure.customerName}` : ''),
          },
        ];
      });
      form.setValue('brochureId', brochure.id, { shouldValidate: true });
    },
    [form, setBrochureLabelCache],
  );

  const handleImageCreated = useCallback(
    ({
      imageId,
      packSizeId,
    }: {
      brochure: BrochureDetail;
      imageId: string;
      packSizeId: string;
    }) => {
      form.setValue('brochureImageId', imageId, { shouldValidate: true });
      form.setValue('brochureImagePackSizeId', packSizeId, {
        shouldValidate: true,
      });
    },
    [form],
  );

  const handlePackSizeCreated = useCallback(
    (packSizeId: string) => {
      form.setValue('brochureImagePackSizeId', packSizeId, {
        shouldValidate: true,
      });
    },
    [form],
  );

  function resetForm() {
    form.reset(getDefaultInventoryIntakeValues());
  }

  function handleSubmit(values: InventoryIntakeFormData) {
    onSubmit(
      {
        warehouseId: values.warehouseId,
        brochureImagePackSizeId: values.brochureImagePackSizeId,
        boxes: values.boxes,
        transactionType: values.transactionType,
        transactionDate: values.transactionDate,
      },
      resetForm,
    );
  }

  const noImages = brochureDetail && brochureDetail.images.length === 0;
  const noPackSizes = selectedImage && selectedImage.packSizes.length === 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Section 1: Brochure */}
        <section className="space-y-4">
          <header className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Brochure</h2>
              <p className="text-muted-foreground text-sm">
                Select an existing brochure or create a new one.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateBrochureOpen(true)}
              disabled={isSubmitting}
            >
              <Plus className="size-4" />
              New brochure
            </Button>
          </header>

          <FormField
            control={form.control}
            name="brochureId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Brochure</FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={brochureOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select brochure"
                    searchPlaceholder="Search brochures"
                    emptyMessage="No brochures found"
                    isLoading={isSearchingBrochures}
                    disabled={isSubmitting}
                    icon={<Tags className="size-4 shrink-0" />}
                    onSearchChange={setBrochureSearch}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Section 2: Image + Pack Size */}
        {brochureId ? (
          <section className="space-y-4 border-t pt-6">
            <header className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">
                  Image &amp; pack size
                </h2>
                <p className="text-muted-foreground text-sm">
                  Choose an image of this brochure and the pack size you are
                  receiving.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddImageOpen(true)}
                disabled={isSubmitting || brochureDetailQuery.isLoading}
              >
                <Plus className="size-4" />
                Upload image
              </Button>
            </header>

            {brochureDetailQuery.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : noImages ? (
              <div className="rounded-md border border-dashed p-6 text-center">
                <ImageIcon className="text-muted-foreground mx-auto size-8" />
                <p className="text-foreground mt-2 text-sm font-medium">
                  No images yet
                </p>
                <p className="text-muted-foreground text-sm">
                  Upload the first image to assign a pack size.
                </p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="brochureImageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Image</FormLabel>
                    <FormControl>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {brochureDetail?.images.map((image) => {
                          const isActive = field.value === image.id;
                          return (
                            <button
                              key={image.id}
                              type="button"
                              onClick={() => field.onChange(image.id)}
                              disabled={isSubmitting}
                              className={cn(
                                'group bg-card relative flex flex-col overflow-hidden rounded-md border text-left transition-colors',
                                isActive
                                  ? 'border-primary ring-primary/30 ring-2'
                                  : 'border-border hover:border-primary/60',
                              )}
                            >
                              <div className="bg-muted relative aspect-4/3 w-full overflow-hidden">
                                {image.imageUrl ? (
                                  <img
                                    src={image.imageUrl}
                                    alt=""
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <div className="text-muted-foreground flex size-full items-center justify-center">
                                    <ImageIcon className="size-8" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2 p-2">
                                <span className="text-xs font-medium">
                                  Sort #{image.sortOrder}
                                </span>
                                <Badge variant="secondary">
                                  {image.packSizes.length} pack
                                  {image.packSizes.length === 1 ? '' : 's'}
                                </Badge>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {brochureImageId ? (
              <div className="space-y-3 rounded-md border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Pack size</p>
                    <p className="text-muted-foreground text-xs">
                      Pack size for the selected image.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAddPackSizeOpen(true)}
                    disabled={isSubmitting}
                  >
                    <Plus className="size-4" />
                    New pack size
                  </Button>
                </div>

                {noPackSizes ? (
                  <p className="text-muted-foreground text-sm">
                    This image has no pack sizes yet — create one.
                  </p>
                ) : (
                  <FormField
                    control={form.control}
                    name="brochureImagePackSizeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Pack size</FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            {selectedImage?.packSizes.map((packSize) => {
                              const isActive = field.value === packSize.id;
                              return (
                                <button
                                  key={packSize.id}
                                  type="button"
                                  onClick={() => field.onChange(packSize.id)}
                                  disabled={isSubmitting}
                                  className={cn(
                                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                                    isActive
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border hover:border-primary/60',
                                  )}
                                >
                                  {formatDecimal(Number(packSize.unitsPerBox))}{' '}
                                  per box
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Section 3: Warehouse */}
        <section className="space-y-4 border-t pt-6">
          <header>
            <h2 className="text-base font-semibold">Warehouse</h2>
            <p className="text-muted-foreground text-sm">
              Where this stock is being received.
            </p>
          </header>

          <FormField
            control={form.control}
            name="warehouseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Warehouse</FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={warehouseOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select warehouse"
                    searchPlaceholder="Search warehouses"
                    emptyMessage="No active warehouses found"
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
        </section>

        {/* Section 4: Transaction details */}
        <section className="space-y-4 border-t pt-6">
          <header>
            <h2 className="text-base font-semibold">Transaction</h2>
            <p className="text-muted-foreground text-sm">
              How and when this stock is being added.
            </p>
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select transaction" />
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
              name="transactionDate"
              render={({ field }) => {
                const selectedDate = parseISODate(field.value);
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transaction date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            className={cn(
                              'w-full justify-between font-normal',
                              !selectedDate && 'text-muted-foreground',
                            )}
                          >
                            {selectedDate
                              ? formatFullDate(selectedDate)
                              : 'Pick a date'}
                            <CalendarIcon className="size-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0" align="start">
                        <Calendar
                          className="w-full"
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            field.onChange(date ? toISODate(date) : '');
                          }}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

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
        </section>

        <div className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isSubmitting}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save intake
          </Button>
        </div>
      </form>

      <BrochureFormDialog
        open={createBrochureOpen}
        onOpenChange={setCreateBrochureOpen}
        brochure={null}
        onCreated={handleBrochureCreated}
      />

      {brochureId ? (
        <BrochureImageQuickAddDialog
          open={addImageOpen}
          onOpenChange={setAddImageOpen}
          brochureId={brochureId}
          ownerId={ownerId}
          onCreated={handleImageCreated}
        />
      ) : null}

      {brochureId && brochureImageId ? (
        <PackSizeQuickAddDialog
          open={addPackSizeOpen}
          onOpenChange={setAddPackSizeOpen}
          brochureId={brochureId}
          imageId={brochureImageId}
          onCreated={handlePackSizeCreated}
        />
      ) : null}
    </Form>
  );
}

export default memo(InventoryIntakeForm);
