---
name: create_form_page
description: Create standardized single-page CRUD forms with create/edit mode, validation, sections, sticky footer, and optimized submission.
---

# Create Form Page

This skill creates complete CRUD form pages with create/edit mode switching, section-based layout, Zod validation with superRefine, number input parsing, image upload, and the `getChangedFields` optimization for edit mode.

**Location:** `apps/<app>/src/components/<feature>/<feature>-form/`

## 1. File Structure

```
<feature>-form/
├── <feature>-form.tsx       # Main form container (state, submit, layout)
├── schema.ts                # Zod schema + type export + number helpers
├── basic-info-section.tsx   # Section component (memo'd)
├── pricing-section.tsx      # Section component (memo'd)
├── images-section.tsx       # Image upload section
├── settings-section.tsx     # Toggles, selects
└── category-picker.tsx      # Server-search entity picker (if needed)
```

## 2. Form Schema (`schema.ts`)

```typescript
import { z } from 'zod/v4';

// ─── Schema ──────────────────────────────────────────────────────
export const featureFormSchema = z
  .object({
    // String fields
    name: z.string().min(1).max(500),
    description: z.string().max(5000).optional(),

    // Required number fields (use parseRequiredNumberInput in onChange)
    salePrice: z.number().gt(0, 'Sale price must be greater than 0'),
    vat: z.number().min(0).max(100),
    noOfUnits: z.number().int().min(1),

    // Optional number fields (use parseNumberInput in onChange)
    weight: z.number().min(0).optional(),
    pricePerKg: z.number().min(0).optional(),

    // Boolean fields
    isActive: z.boolean(),

    // Enum fields
    visibility: z.enum(['both', 'internal', 'external']),
    pricingType: z.enum(['unit', 'weight']),

    // Array fields
    images: z.array(z.url()),
    categoryIds: z.array(z.uuid()),

    // Nested objects
    dimensions: z
      .object({
        length: z.number().min(0).optional(),
        width: z.number().min(0).optional(),
        height: z.number().min(0).optional(),
      })
      .optional(),

    supplier: z
      .object({
        number: z.string().max(100).optional(),
        name: z.string().max(255).optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Conditional validation example: require pricePerKg when weight-based pricing
    if (data.pricingType === 'weight' && data.pricePerKg === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['pricePerKg'],
        message: 'Price per kg is required for weight-based pricing',
      });
    }
  });

export type FeatureFormData = z.infer<typeof featureFormSchema>;

// NOTE: parseNumberInput / parseRequiredNumberInput are NO LONGER needed.
// Use the `NumericInput` component from `@repo/ui/components/base/numeric-input` instead.
// It handles all number parsing, min/max clamping, and empty state internally.
```

**Schema Rules:**

- Always define schema in a separate `schema.ts` file (NOT inline)
- Use `z.string().min(1)` for required strings (NOT `z.string().nonempty()`)
- Use `.gt(0)` for prices that must be positive (NOT `.min(0)`)
- Use `.int().min(1)` for quantity fields
- Use `z.url()` for URL arrays (images)
- Use `z.uuid()` for ID arrays (categories)
- Use `.superRefine()` for cross-field/conditional validation
- Export both schema and inferred type
- Export number parsing utilities from same file

## 3. Form Container (`<feature>-form.tsx`)

```typescript
import { useMemo } from 'react';
import { useRouter, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useForm } from '@repo/ui/lib/form';
import { zodResolver } from '@repo/ui/lib/form';
import { Form } from '@repo/ui/components/base/form';
import { Button } from '@repo/ui/components/base/button';
import { Loader2, Package, Pencil } from '@repo/ui/lib/icons';
import { useFeatures } from '@/hooks/useFeatures';
import { featureFormSchema, type FeatureFormData } from './schema';
import BasicInfoSection from './basic-info-section';
import PricingSection from './pricing-section';
import ImagesSection from './images-section';
import SettingsSection from './settings-section';
import type { FeatureDetail } from '@/hooks/useFeatures/types';

interface FeatureFormProps {
  mode: 'create' | 'edit';
  item?: FeatureDetail;
  onCancel?: () => void; // For edit mode (exits edit mode)
}

export default function FeatureForm({ mode, item, onCancel }: FeatureFormProps) {
  const { t } = useTranslation('<feature>');
  const router = useRouter();
  const { createMutation, updateMutation } = useFeatures();
  const mutation = mode === 'create' ? createMutation : updateMutation;

  // ─── Default values ──────────────────────────────────────────
  const defaultValues = useMemo<FeatureFormData>(() => {
    if (mode === 'edit' && item) {
      return {
        name: item.name,
        description: item.description ?? undefined,
        salePrice: Number(item.salePrice),
        vat: Number(item.vat),
        noOfUnits: item.noOfUnits,
        weight: item.weight ? Number(item.weight) : undefined,
        pricePerKg: item.pricePerKg ? Number(item.pricePerKg) : undefined,
        isActive: item.isActive,
        visibility: item.visibility,
        pricingType: item.pricingType,
        images: item.images ?? [],
        categoryIds: item.categories.map((c) => c.id),
        dimensions: item.dimensions ?? undefined,
        supplier: item.supplier ?? undefined,
      };
    }

    // Create mode defaults
    return {
      name: '',
      description: undefined,
      salePrice: 0,
      vat: 25,
      noOfUnits: 1,
      weight: undefined,
      pricePerKg: undefined,
      isActive: true,
      visibility: 'both',
      pricingType: 'unit',
      images: [],
      categoryIds: [],
      dimensions: undefined,
      supplier: undefined,
    };
  }, [mode, item]);

  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureFormSchema),
    defaultValues,
  });

  // ─── Submit handler ──────────────────────────────────────────
  function onSubmit(data: FeatureFormData) {
    if (mode === 'create') {
      createMutation.mutate(data, {
        onSuccess: (result) => {
          router.navigate({
            to: '/dashboard/<feature>/$id',
            params: { id: result.item.id },
          });
        },
      });
    } else if (item) {
      const body = getChangedFields(data, item);

      if (Object.keys(body).length === 0) {
        // No changes — navigate back without API call
        router.navigate({
          to: '/dashboard/<feature>/$id',
          params: { id: item.id },
        });
        return;
      }

      updateMutation.mutate(
        { id: item.id, body },
        {
          onSuccess: () => {
            router.navigate({
              to: '/dashboard/<feature>/$id',
              params: { id: item.id },
            });
          },
        },
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-foreground/6 flex size-10 items-center justify-center rounded-xl">
            {mode === 'create' ? (
              <Package className="text-foreground/70 size-5" />
            ) : (
              <Pencil className="text-foreground/70 size-5" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {mode === 'create' ? t('form.newTitle') : t('form.editTitle', { name: item?.name })}
            </h2>
            <p className="text-muted-foreground text-sm">
              {mode === 'create' ? t('form.newSubtitle') : t('form.editSubtitle')}
            </p>
          </div>
        </div>

        {/* 2-column section grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <BasicInfoSection />
            <PricingSection />
          </div>
          <div className="space-y-6">
            <ImagesSection />
            <SettingsSection />
          </div>
        </div>

        {/* ─── Sticky Footer ──────────────────────────────────── */}
        <div className="border-border/40 bg-background/95 sticky bottom-0 -mx-4 mt-8 border-t px-4 py-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-end gap-3">
            {mode === 'edit' && onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('form.cancel')}
              </Button>
            ) : (
              <Button type="button" variant="outline" asChild>
                <Link to="/dashboard/<feature>">{t('form.cancel')}</Link>
              </Button>
            )}
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="min-w-32 gap-2 shadow-sm"
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === 'create' ? t('form.create') : t('form.saveChanges')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
```

**Form Container Rules:**

- `mode: 'create' | 'edit'` — always explicit, not inferred
- `item` is optional (only for edit mode)
- `onCancel` callback for edit mode (exits edit view), Link for create mode
- Default values wrapped in `useMemo` — recomputed only when item changes
- Use `Number()` conversion for numeric DB values (they come as strings from Drizzle)
- Handle `null`/`undefined` with `?? undefined` (NOT `|| undefined`)
- Sticky footer with negative margins for full-width bleed
- Show spinner during mutation (not disable entire form)

## 4. `getChangedFields` Pattern

This function compares form data with the original item and returns ONLY the fields that changed. This is critical for edit mode to avoid unnecessary updates and potential conflicts.

```typescript
function getChangedFields(
  data: FeatureFormData,
  original: FeatureDetail,
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};

  // Helper: normalize empty strings to null for nullable DB columns
  const emptyToNull = (v: string | undefined | null): string | null =>
    v ? v : null;

  // ─── String fields ─────────────────────────────────────────
  if (data.name !== original.name) changes.name = data.name;
  if (emptyToNull(data.description) !== (original.description ?? null))
    changes.description = emptyToNull(data.description);

  // ─── Number fields ─────────────────────────────────────────
  // DB returns strings for numeric/decimal columns — always Number() compare
  if (data.salePrice !== Number(original.salePrice))
    changes.salePrice = data.salePrice;
  if (data.vat !== Number(original.vat)) changes.vat = data.vat;

  // ─── Optional nullable numbers ─────────────────────────────
  const origPricePerKg = original.pricePerKg
    ? Number(original.pricePerKg)
    : null;
  if ((data.pricePerKg ?? null) !== origPricePerKg)
    changes.pricePerKg = data.pricePerKg ?? null;

  // ─── Boolean fields ────────────────────────────────────────
  if (data.isActive !== original.isActive) changes.isActive = data.isActive;

  // ─── Enum fields ───────────────────────────────────────────
  if (data.visibility !== original.visibility)
    changes.visibility = data.visibility;

  // ─── Array fields (JSON stringify for comparison) ──────────
  if (JSON.stringify(data.images) !== JSON.stringify(original.images))
    changes.images = data.images;

  // ─── ID arrays (sort before comparing) ─────────────────────
  const origCategoryIds = original.categories
    .map((c) => c.id)
    .sort()
    .join(',');
  const newCategoryIds = [...data.categoryIds].sort().join(',');
  if (origCategoryIds !== newCategoryIds)
    changes.categoryIds = data.categoryIds;

  // ─── Nested objects ────────────────────────────────────────
  if (JSON.stringify(data.dimensions) !== JSON.stringify(original.dimensions))
    changes.dimensions = data.dimensions;

  return changes;
}
```

**getChangedFields Rules:**

- Compare each field explicitly (NOT deep-equal the entire object)
- Use `Number()` for all numeric DB values (Drizzle numeric → string)
- Use `emptyToNull()` for nullable string columns
- Use `JSON.stringify()` for nested objects and arrays
- Sort ID arrays before comparing (order doesn't matter)
- Use `?? null` for optional numbers (undefined → null for DB)
- If `Object.keys(changes).length === 0`, skip API call entirely

## 5. Section Component Pattern (memo'd)

Each section component accesses form context and renders `FormField`s:

```typescript
// basic-info-section.tsx
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/components/base/form';
import { Input } from '@repo/ui/components/base/input';
import { Textarea } from '@repo/ui/components/base/textarea';
import { useFormContext } from '@repo/ui/lib/form';
import { FileText } from '@repo/ui/lib/icons';
import type { FeatureFormData } from './schema';

function BasicInfoSection() {
  const { t } = useTranslation('<feature>');
  const form = useFormContext<FeatureFormData>();

  return (
    <Card className="border-border/50 overflow-hidden rounded-xl shadow-sm">
      <CardHeader className="border-border/40 bg-muted/40 border-b pb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-foreground/6 flex size-8 items-center justify-center rounded-lg">
            <FileText className="text-foreground/70 size-4" />
          </div>
          <div>
            <CardTitle className="font-heading text-sm font-semibold">
              {t('form.basicInfo.title')}
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {t('form.basicInfo.subtitle')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.basicInfo.name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('form.basicInfo.namePlaceholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.basicInfo.description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('form.basicInfo.descriptionPlaceholder')}
                  className="min-h-24 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

export default memo(BasicInfoSection);
```

**Section Rules:**

- Always `memo()` the export (prevents re-render when other sections change)
- Use `useFormContext<FeatureFormData>()` (NOT prop drilling)
- Card with icon header pattern (consistent with detail page SectionCard)
- `FormMessage className="text-xs"` for smaller validation text
- Textarea with `min-h-24 resize-none`

## 6. Number Input Fields

Use `NumericInput` from `@repo/ui/components/base/numeric-input` for **all** numeric fields.
NEVER use `<Input type="number">` — see `.claude/skills/numeric_input/SKILL.md` for full documentation.

```typescript
// pricing-section.tsx
import { NumericInput } from '@repo/ui/components/base/numeric-input';

// Required number field (price)
<FormField
  control={form.control}
  name="salePrice"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('form.pricing.salePrice')}</FormLabel>
      <FormControl>
        <NumericInput
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          step={0.01}
          min={0}
          placeholder="0.00"
        />
      </FormControl>
      <FormMessage className="text-xs" />
    </FormItem>
  )}
/>

// Optional number field
<FormField
  control={form.control}
  name="weight"
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t('form.physical.weight')}</FormLabel>
      <FormControl>
        <NumericInput
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          step={0.01}
          min={0}
          placeholder="0.00"
        />
      </FormControl>
      <FormMessage className="text-xs" />
    </FormItem>
  )}
/>

// Integer only field (quantity)
<NumericInput
  value={field.value}
  onChange={field.onChange}
  onBlur={field.onBlur}
  name={field.name}
  ref={field.ref}
  min={1}
  integerOnly
  placeholder="1"
/>
```

**Number Input Rules:**

- Always use `NumericInput` — NEVER `<Input type="number">`
- Pass `value`, `onChange`, `onBlur`, `name`, `ref` individually (NOT `{...field}` spread)
- Use `step={0.01}` for prices (infers 2 decimal places)
- Use `integerOnly` for quantity/count fields
- NumericInput returns `undefined` for empty fields — works with optional Zod schemas
- For required fields that must never be undefined: `onChange={(v) => field.onChange(v ?? 0)}`

## 7. Server-Search Entity Selects

For entity-backed choices such as customers, warehouses, sectors, brochure types, brochures, products, inventory items, or any list that can grow, use `SearchableSelect` / `SearchableMultiSelect` with `useServerSearchSelectOptions`. Do not preload large option arrays with a fixed `limit` just to feed a local select.

Use static `Select` only for small finite choices such as enums, status, role, sort order, month, year, or boolean-like modes.

```typescript
import { useCallback } from 'react';
import SearchableSelect from '@/components/common/searchable-select';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { featureQueryKeys, useFeatures } from '@/hooks/useFeatures';
import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type { ServerSearchSelectParams } from '@/hooks/useServerSearchSelectOptions';

type FeatureOptionParams = ServerSearchSelectParams & {
  customerSearch?: string;
};

function CustomerField() {
  const { getCustomerOptions } = useFeatures();

  const selectCustomerOptions = useCallback(
    (data: CustomerOptionsResponse | undefined): SearchableSelectOption[] =>
      (data?.customers ?? []).map((customer) => ({
        value: customer.id,
        label: customer.name,
        description: customer.email ?? undefined,
      })),
    [],
  );

  const {
    options: customerOptions,
    setSearch: setCustomerSearch,
    isSearching: isSearchingCustomers,
  } = useServerSearchSelectOptions<
    CustomerOptionsResponse,
    SearchableSelectOption,
    FeatureOptionParams
  >({
    queryKey: featureQueryKeys.customerOptions,
    queryFn: getCustomerOptions,
    selectOptions: selectCustomerOptions,
    baseOptions: existingCustomer
      ? [{ value: existingCustomer.id, label: existingCustomer.name }]
      : [],
    buildParams: ({ page, limit, search }) => ({
      page,
      limit,
      customerSearch: search,
    }),
  });

  return (
    <SearchableSelect
      options={customerOptions}
      value={field.value}
      onChange={field.onChange}
      onSearchChange={setCustomerSearch}
      isLoading={isSearchingCustomers}
      placeholder="Select customer"
      searchPlaceholder="Search customers"
      emptyMessage="No customers found"
    />
  );
}
```

**Server-Search Select Rules:**

- Use `useServerSearchSelectOptions` for all relation/entity selects backed by API data.
- API hooks should expose stable list/option functions and query keys that accept `{ page, limit, search }`; use `buildParams` to map `search` to endpoint-specific params like `customerSearch` or `warehouseSearch`.
- Pass `onSearchChange={setSearch}` to `SearchableSelect` / `SearchableMultiSelect`; this makes the component treat options as server-filtered.
- Use `baseOptions` in edit mode so already selected values remain visible before the first search result returns.
- Keep separate hook instances and loading states for independent selects, even when they call the same endpoint.
- Do not fetch `limit: 50` or `limit: 100` form options at the page level unless the option set is truly finite and small.

## 8. Conditional Fields (useWatch)

```typescript
import { useFormContext, useWatch } from '@repo/ui/lib/form';

function PricingSection() {
  const form = useFormContext<FeatureFormData>();
  const pricingType = useWatch({ control: form.control, name: 'pricingType' });

  return (
    <Card>
      {/* ... */}
      <FormField
        control={form.control}
        name="pricingType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pricing Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="unit">Per Unit</SelectItem>
                <SelectItem value="weight">Per Weight</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* Only show weight fields when weight-based pricing is selected */}
      {pricingType === 'weight' ? (
        <>
          <FormField control={form.control} name="pricePerKg" render={...} />
          <FormField control={form.control} name="cartonWeight" render={...} />
        </>
      ) : null}
    </Card>
  );
}
```

**useWatch Rules:**

- Always destructure `control` from form context: `useWatch({ control: form.control, name: '...' })`
- Use ternary `condition ? <JSX> : null` (NOT `condition && <JSX>`)
- When hiding weight fields, optionally clear them in the Select onChange

## 9. Image Upload Section

```typescript
import { memo, useMemo } from 'react';
import { useFormContext } from '@repo/ui/lib/form';
import { useImageUpload } from '@repo/hooks';
import supabase from '@/lib/supabase';
import { STORAGE_BUCKETS } from '@/constants/storage';

function ImagesSection() {
  const form = useFormContext<FeatureFormData>();
  const images = form.watch('images');

  const uploadConfig = useMemo(
    () => ({
      bucket: STORAGE_BUCKETS.FEATURE_IMAGES,
      buildFilePath: (file: File) => {
        const ext = file.name.split('.').pop();
        return `${crypto.randomUUID()}-${Date.now()}.${ext}`;
      },
      maxFileSize: 5 * 1024 * 1024, // 5MB
    }),
    [],
  );

  const { upload, isUploading } = useImageUpload(supabase, uploadConfig);

  async function handleUpload(files: FileList | null) {
    if (!files) return;
    const results = await Promise.allSettled(
      Array.from(files).map((file) => upload(file)),
    );
    const urls = results
      .filter(
        (r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled',
      )
      .map((r) => r.value);
    form.setValue('images', [...images, ...urls], { shouldValidate: true });
  }

  function removeImage(index: number) {
    form.setValue(
      'images',
      images.filter((_, i) => i !== index),
      { shouldValidate: true },
    );
  }

  // ... render upload area + image grid
}

export default memo(ImagesSection);
```

**Image Upload Rules:**

- `uploadConfig` in `useMemo` (stable reference)
- Use `Promise.allSettled` for parallel uploads (not `Promise.all` — partial success OK)
- Set `{ shouldValidate: true }` when programmatically updating form values
- Use `crypto.randomUUID()` for unique file names
- Max 10 images (check before uploading)
- First image = primary (show badge)

## 10. Route Integration

### Create route

```typescript
// routes/dashboard/(routes)/<feature>/new.tsx
import { createFileRoute } from '@tanstack/react-router';
import FeatureForm from '@/components/<feature>/<feature>-form/<feature>-form';

export const Route = createFileRoute('/dashboard/(routes)/<feature>/new')({
  component: RouteComponent,
  getMetadata: () => ({ breadcrumb: 'New Feature' }),
});

function RouteComponent() {
  return <FeatureForm mode="create" />;
}
```

### Edit via detail page (NOT separate route)

Edit mode is toggled inside the detail page component (`isEditing` state), which renders `<FeatureForm mode="edit" item={item} onCancel={() => setIsEditing(false)} />`. There is NO separate `/edit` route.

## Common Mistakes to Avoid

1. **NEVER use `zod` directly** — import from `zod/v4` (project uses Zod v4)
2. **NEVER use `useForm` from `react-hook-form`** — import from `@repo/ui/lib/form`
3. **NEVER skip `Number()` conversion for DB numeric values** — Drizzle returns strings
4. **NEVER compare ID arrays without sorting** — order is irrelevant, sort first
5. **NEVER use `|| undefined`** for nullable checks — use `?? undefined` (preserves `0`, `false`, `''`)
6. **NEVER deep-equal entire object for edit detection** — compare field by field
7. **NEVER skip `memo()` on section components** — prevents cascading re-renders
8. **NEVER put validation logic in the component** — keep it in `schema.ts`
9. **NEVER call API when no fields changed in edit mode** — check `Object.keys(body).length === 0`
10. **NEVER use `<Input type="number">`** — always use `NumericInput` from `@repo/ui/components/base/numeric-input`
11. **NEVER forget `{ shouldValidate: true }` when using `form.setValue()`** — otherwise errors won't clear
12. **ALWAYS use `asChild` on cancel button when wrapping a `<Link>`** — prevents double elements
