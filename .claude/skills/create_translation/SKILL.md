---
name: create_translation
description: Create standardized i18n translation files and usage patterns with react-i18next.
---

# Create Translation

This skill creates translation namespace files and documents correct usage patterns for `react-i18next` across the app.

## 1. Setup: Register Namespace

When creating a new feature namespace, register it in the i18n config:

```typescript
// apps/<app>/src/lib/i18n.ts
i18n
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../locales/${language}/${namespace}.json`),
    ),
  )
  .use(initReactI18next)
  .init({
    lng: 'nb',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'products', '<new-feature>'], // ← Add namespace
    interpolation: { escapeValue: false },
    react: { useSuspense: true },
  });
```

Then create translation files for BOTH languages:

```
apps/<app>/src/locales/en/<feature>.json   ← English
apps/<app>/src/locales/nb/<feature>.json   ← Norwegian
```

## 2. Translation File Structure

Organize keys by UI section, matching component structure:

```json
{
  "page": {
    "title": "Products",
    "subtitle": "Manage your product catalog",
    "newItem": "New Product"
  },

  "stats": {
    "totalProducts": "Total Products",
    "activeProducts": "Active",
    "outOfStock": "Out of Stock",
    "lowStock": "Low Stock"
  },

  "filter": {
    "search": "Search products...",
    "sortBy": "Sort by",
    "sortOptions": {
      "newest": "Newest first",
      "oldest": "Oldest first",
      "nameAsc": "Name A-Z",
      "nameDesc": "Name Z-A",
      "priceAsc": "Price: Low to High",
      "priceDesc": "Price: High to Low"
    },
    "status": "Status",
    "statusOptions": {
      "all": "All",
      "active": "Active",
      "inactive": "Inactive"
    },
    "category": "Category",
    "clearFilters": "Clear filters",
    "activeFilters": "Active filters"
  },

  "table": {
    "product": "Product",
    "sku": "SKU",
    "price": "Price",
    "stock": "Stock",
    "status": "Status",
    "actions": "Actions"
  },

  "tableRow": {
    "inclVat": "incl. VAT",
    "edit": "Edit",
    "delete": "Delete",
    "viewDetails": "View Details",
    "copyId": "Copy ID",
    "idCopied": "ID copied to clipboard"
  },

  "empty": {
    "title": "No products found",
    "description": "Get started by creating your first product.",
    "filteredTitle": "No products match your filters",
    "filteredDescription": "Try adjusting your search or filter criteria."
  },

  "form": {
    "newTitle": "New Product",
    "newSubtitle": "Fill in the details to add a new product to your catalog.",
    "editTitle": "Edit {{name}}",
    "editSubtitle": "Update the product details below.",
    "create": "Create Product",
    "saveChanges": "Save Changes",
    "cancel": "Cancel",
    "basicInfo": {
      "title": "Basic Information",
      "subtitle": "Product name and description",
      "name": "Product Name",
      "namePlaceholder": "Enter product name",
      "description": "Description",
      "descriptionPlaceholder": "Enter product description"
    },
    "pricing": {
      "title": "Pricing",
      "subtitle": "Cost and sale prices",
      "costPrice": "Cost Price",
      "salePrice": "Sale Price",
      "vat": "VAT %"
    },
    "images": {
      "title": "Images",
      "subtitle": "Product photos",
      "uploadImages": "Upload Images ({{count}}/{{max}})",
      "uploading": "Uploading...",
      "limitReached": "Limit reached ({{max}} images)",
      "primary": "Primary"
    },
    "settings": {
      "title": "Settings",
      "subtitle": "Visibility and status",
      "isActive": "Active",
      "activeDescription": "Product is visible and available for sale",
      "visibility": "Visibility"
    }
  },

  "detail": {
    "edit": "Edit",
    "created": "Created {{date}}",
    "backToList": "Back to list",
    "notFound": "Product not found",
    "notFoundDescription": "The product you're looking for doesn't exist or has been removed.",
    "dangerZone": "Danger Zone",
    "dangerDescription": "Permanently delete this product. This action cannot be undone.",
    "deleteItem": "Delete Product"
  },

  "infoCards": {
    "salePrice": "Sale Price",
    "inclVat": "{{value}} incl. {{vat}}% VAT",
    "totalStock": "Total Stock",
    "acrossBatches_one": "Across {{count}} batch",
    "acrossBatches_other": "Across {{count}} batches",
    "categories": "Categories",
    "visibility": "Visibility"
  },

  "tabs": {
    "overview": "Overview",
    "inventory": "Inventory",
    "pricing": "Pricing"
  },

  "overview": {
    "basicInfo": "Basic Information",
    "name": "Name",
    "description": "Description",
    "sku": "SKU",
    "barcode": "Barcode"
  },

  "deleteDialog": {
    "title": "Delete Product",
    "description": "Are you sure you want to delete <1>{{name}}</1>? This action can be undone by viewing deleted products.",
    "cancel": "Cancel",
    "delete": "Delete",
    "deleting": "Deleting..."
  },

  "statusBadge": {
    "active": "Active",
    "inactive": "Inactive",
    "deleted": "Deleted"
  },

  "pagination": {
    "showing": "Showing <1>{{start}}</1>–<2>{{end}}</2> of <3>{{total}}</3> products"
  }
}
```

## 3. Key Naming Conventions

| Section           | Key pattern                                         | Example                 |
| ----------------- | --------------------------------------------------- | ----------------------- |
| Page header       | `page.title`, `page.subtitle`                       | `"Manage your catalog"` |
| Stats cards       | `stats.<metricName>`                                | `"Total Products"`      |
| Filters           | `filter.<filterName>`, `filter.sortOptions.<value>` | `"Search products..."`  |
| Table columns     | `table.<columnName>`                                | `"Product"`             |
| Table row actions | `tableRow.<action>`                                 | `"Edit"`, `"Delete"`    |
| Empty state       | `empty.title`, `empty.filteredTitle`                | `"No products found"`   |
| Form sections     | `form.<section>.<field>`                            | `"Product Name"`        |
| Form actions      | `form.create`, `form.saveChanges`, `form.cancel`    |                         |
| Detail page       | `detail.<key>`                                      | `"Danger Zone"`         |
| Info cards        | `infoCards.<metricName>`                            | `"Sale Price"`          |
| Tabs              | `tabs.<tabName>`                                    | `"Overview"`            |
| Dialogs           | `deleteDialog.title`, `deleteDialog.description`    |                         |
| Badges            | `statusBadge.active`, `visibilityBadge.both`        |                         |
| Pagination        | `pagination.showing`                                | Uses Trans component    |

## 4. Interpolation (`{{variable}}`)

For inserting dynamic values into translations:

```json
{
  "form": {
    "editTitle": "Edit {{name}}",
    "images": {
      "uploadImages": "Upload Images ({{count}}/{{max}})"
    }
  },
  "detail": {
    "created": "Created {{date}}"
  }
}
```

```typescript
t('form.editTitle', { name: product.name });
t('form.images.uploadImages', { count: images.length, max: 10 });
t('detail.created', { date: formatShortDate(product.createdAt) });
```

**Rules:**

- Variable names in `{{}}` must match the object keys in `t()` call
- Format values BEFORE passing (e.g., `formatNOK()`, `formatShortDate()`)
- Never pass raw objects — always pass formatted strings or numbers

## 5. Pluralization (`_one` / `_other`)

For count-dependent translations:

```json
{
  "infoCards": {
    "acrossBatches_one": "Across {{count}} batch",
    "acrossBatches_other": "Across {{count}} batches"
  }
}
```

```typescript
// i18next automatically picks _one or _other based on count
t('infoCards.acrossBatches', { count: batchCount });
// count=1 → "Across 1 batch"
// count=5 → "Across 5 batches"
```

**Rules:**

- Key MUST end with `_one` and `_other` suffixes
- The `count` variable is mandatory (i18next uses it for selection)
- Use the base key name when calling `t()` (without suffix)
- Norwegian (nb) uses the same `_one`/`_other` pattern

## 6. Trans Component (Rich Text)

For translations that need styled/wrapped parts:

```json
{
  "deleteDialog": {
    "description": "Are you sure you want to delete <1>{{name}}</1>? This action can be undone."
  },
  "pagination": {
    "showing": "Showing <1>{{start}}</1>–<2>{{end}}</2> of <3>{{total}}</3> products"
  }
}
```

```typescript
import { Trans, useTranslation } from 'react-i18next';

// Single styled component
<Trans
  i18nKey="deleteDialog.description"
  ns="products"
  values={{ name: productName }}
  components={{
    1: <span className="text-foreground font-semibold" />,
  }}
/>

// Multiple styled components
<Trans
  i18nKey="pagination.showing"
  ns="products"
  values={{ start, end, total }}
  components={{
    1: <span className="text-foreground font-medium" />,
    2: <span className="text-foreground font-medium" />,
    3: <span className="text-foreground font-medium" />,
  }}
/>
```

**Rules:**

- Use numbered tags `<1>`, `<2>`, etc. in JSON (NOT named tags)
- Components are indexed starting from `1` (NOT `0`)
- Always pass `ns` prop to `<Trans>` (namespace is NOT auto-detected)
- `components` object maps tag numbers to React elements
- The elements are used as wrappers — their children are replaced by the tagged content

## 7. Component Usage Patterns

### Basic usage

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('products');

  return <h1>{t('page.title')}</h1>;
}
```

### Dynamic enum values

```typescript
// Translation file:
// "visibility": { "both": "Both", "internal": "Internal Only", "external": "External Only" }

// Usage:
t(`visibility.${item.visibility}`);
```

### Conditional based on state

```typescript
// Empty state with/without filters
<h2>{hasFilters ? t('empty.filteredTitle') : t('empty.title')}</h2>
<p>{hasFilters ? t('empty.filteredDescription') : t('empty.description')}</p>
```

### Form labels (create vs edit mode)

```typescript
<h2>{mode === 'create' ? t('form.newTitle') : t('form.editTitle', { name: item.name })}</h2>
```

## 8. Norwegian Translation Guidelines

Norwegian (nb) translations go in `apps/<app>/src/locales/nb/<feature>.json` with the SAME key structure:

```json
{
  "page": {
    "title": "Produkter",
    "subtitle": "Administrer produktkatalogen din",
    "newItem": "Nytt produkt"
  },
  "empty": {
    "title": "Ingen produkter funnet",
    "filteredTitle": "Ingen produkter samsvarer med filtrene dine"
  },
  "deleteDialog": {
    "description": "Er du sikker på at du vil slette <1>{{name}}</1>? Denne handlingen kan angres."
  }
}
```

**Rules:**

- IDENTICAL key structure to English file (same nesting, same keys)
- Translate values only, never change keys
- Keep `{{variable}}` placeholders unchanged
- Keep `<1>`, `<2>` numbered tags unchanged
- Keep `_one`/`_other` suffixes unchanged

## Common Mistakes to Avoid

1. **NEVER forget to register the namespace** in `i18n.ts` `ns` array — translations silently fail
2. **NEVER use `t()` without namespace** for feature translations — always `useTranslation('<feature>')`
3. **NEVER pass `ns` as string to `useTranslation` for common** — just `useTranslation()` uses default 'common'
4. **NEVER use named tags in Trans** — use numbered `<1>`, `<2>`, not `<bold>`, `<link>`
5. **NEVER forget the `ns` prop on `<Trans>`** — it WILL look up in wrong namespace
6. **NEVER start component indices at 0 in Trans** — start at `1`
7. **NEVER change key structure between languages** — must be identical
8. **NEVER include raw HTML in translation values** — use Trans component for styled text
9. **NEVER translate enum values inline** — use `t('enumKey.${value}')` pattern
10. **ALWAYS create both `en` and `nb` files** — missing file causes fallback to English silently
11. **ALWAYS use `_one`/`_other` for plurals** — not conditional expressions in component code
12. **ALWAYS format values before interpolation** — `t('key', { price: formatNOK(value) })` not `t('key', { price: value })`
