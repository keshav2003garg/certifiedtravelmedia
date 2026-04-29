---
name: create_filter_hook
description: Create standardized filter hooks using `nuqs` for URL search params in frontend apps.
---

# Create Filter Hook (Nuqs)

This skill guides you through creating a standardized filter hook for managing list filters (search, sort, pagination) via URL search params.

**Location:** `apps/<app>/src/hooks/use<Feature>/use<Feature>Filters.ts`

## 1. Dependencies

```typescript
import { useCallback, useMemo } from 'react';
import {
  useQueryState,
  parseAsString,
  parseAsStringLiteral,
  parseAsInteger,
} from '@repo/hooks/nuqs';
import { parseAsBoolean } from '@repo/hooks/nuqs'; // For boolean filters
import { usePagination } from '@repo/hooks/usePagination';
import { useSearch } from '@repo/hooks/useSearch';
```

**Package Paths:**

- `@repo/hooks/nuqs` — re-exports from `nuqs` (NOT `nuqs/adapters/tanstack-router`)
- `@repo/hooks/usePagination` — provides `page`, `limit`, `handlePageChange`, `handlePageSizeChange`
- `@repo/hooks/useSearch` — provides debounced `search`, raw `inputValue`, `setSearch`

## 2. Hook Implementation (`use<Feature>Filters.ts`)

### Full Pattern

```typescript
// apps/<app>/src/hooks/use<Feature>/use<Feature>Filters.ts
import { useCallback, useMemo } from 'react';
import { useQueryState, parseAsStringLiteral } from '@repo/hooks/nuqs';
import { parseAsBoolean } from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination';
import { useSearch } from '@repo/hooks/useSearch';

// ─── Define filter option constants ──────────────────────────────
const SORT_OPTIONS = ['name', 'salePrice', 'createdAt', 'updatedAt'] as const;
const ORDER_OPTIONS = ['asc', 'desc'] as const;
const VISIBILITY_OPTIONS = ['both', 'internal', 'external'] as const;
// Add more const arrays for your feature's specific filters

export function useFeaturesFilters() {
  // ─── Base hooks (search + pagination) ──────────────────────────
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handlePageSizeChange } =
    usePagination();

  // ─── URL filter state ──────────────────────────────────────────
  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(SORT_OPTIONS),
  );
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(ORDER_OPTIONS),
  );
  const [isActive, setIsActive] = useQueryState('isActive', parseAsBoolean);
  const [visibility, setVisibility] = useQueryState(
    'visibility',
    parseAsStringLiteral(VISIBILITY_OPTIONS),
  );
  const [categoryIds, setCategoryIds] = useQueryState('categoryIds');
  const [includeDeleted, setIncludeDeleted] = useQueryState(
    'includeDeleted',
    parseAsBoolean,
  );

  // ─── Change handlers (ALWAYS reset page to 1) ─────────────────
  const handleSortByChange = useCallback(
    (value: (typeof SORT_OPTIONS)[number] | null) => {
      setSortBy(value);
      handlePageChange(1);
    },
    [setSortBy, handlePageChange],
  );

  const handleOrderChange = useCallback(
    (value: (typeof ORDER_OPTIONS)[number] | null) => {
      setOrder(value);
      handlePageChange(1);
    },
    [setOrder, handlePageChange],
  );

  const handleIsActiveChange = useCallback(
    (value: boolean | null) => {
      setIsActive(value);
      handlePageChange(1);
    },
    [setIsActive, handlePageChange],
  );

  const handleVisibilityChange = useCallback(
    (value: (typeof VISIBILITY_OPTIONS)[number] | null) => {
      setVisibility(value);
      handlePageChange(1);
    },
    [setVisibility, handlePageChange],
  );

  const handleCategoryChange = useCallback(
    (ids: string[]) => {
      setCategoryIds(ids.length > 0 ? ids.join(',') : null);
      handlePageChange(1);
    },
    [setCategoryIds, handlePageChange],
  );

  const handleIncludeDeletedChange = useCallback(
    (value: boolean | null) => {
      setIncludeDeleted(value);
      handlePageChange(1);
    },
    [setIncludeDeleted, handlePageChange],
  );

  // ─── Clear all filters ────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearch('');
    setSortBy(null);
    setOrder(null);
    setIsActive(null);
    setVisibility(null);
    setCategoryIds(null);
    setIncludeDeleted(null);
    handlePageChange(1);
  }, [
    setSearch,
    setSortBy,
    setOrder,
    setIsActive,
    setVisibility,
    setCategoryIds,
    setIncludeDeleted,
    handlePageChange,
  ]);

  // ─── Has active filters (for "Clear All" button visibility) ───
  const hasActiveFilters = useMemo(
    () =>
      !!(
        search ||
        sortBy ||
        order ||
        isActive !== null ||
        visibility ||
        categoryIds ||
        includeDeleted
      ),
    [search, sortBy, order, isActive, visibility, categoryIds, includeDeleted],
  );

  // ─── Params object for API call ───────────────────────────────
  // Convert null → undefined so query params aren't sent as "null"
  const params = {
    search: search || undefined,
    sortBy: sortBy ?? undefined,
    order: order ?? undefined,
    isActive: isActive ?? undefined,
    visibility: visibility ?? undefined,
    categoryIds: categoryIds ?? undefined,
    includeDeleted: includeDeleted ?? undefined,
    page,
    pageSize: limit, // NOTE: API expects "pageSize", hook returns "limit"
  };

  return {
    // State values
    search,
    searchInputValue, // Use this for <Input value={...}> (immediate, no debounce lag)
    sortBy,
    order,
    isActive,
    visibility,
    categoryIds,
    includeDeleted,
    // Change handlers
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleIsActiveChange,
    handleVisibilityChange,
    handleCategoryChange,
    handleIncludeDeletedChange,
    // Pagination
    page,
    limit,
    handlePageChange,
    handlePageSizeChange,
    // Helpers
    clearFilters,
    hasActiveFilters,
    params,
  };
}
```

## 3. Key Patterns & Rules

### Search: Two Values

```
searchInputValue  → Immediate display value (no lag in input)
search            → Debounced value (400ms delay, used for API calls)
```

**Always use `searchInputValue` for `<Input value={...}>` and `search` for API params.**

### Page Reset Rule

**EVERY filter change handler MUST call `handlePageChange(1)`.** Otherwise users see empty pages after filtering.

### Null vs Undefined Semantics

| Value     | URL param              | API param              |
| --------- | ---------------------- | ---------------------- |
| `null`    | Removed from URL       | Convert to `undefined` |
| `''`      | Removed by `setSearch` | Becomes `undefined`    |
| `'value'` | Shown in URL           | Passed as-is           |

### Params Mapping

The `usePagination` hook returns `limit` but the API expects `pageSize`. Always map:

```typescript
const params = { ..., pageSize: limit };
```

## 4. Active Filters Display Pattern

Use in the FilterBar component to show removable filter badges:

```typescript
const activeFilters = useMemo(() => {
  const filters: { label: string; onClear: () => void }[] = [];

  if (search) {
    filters.push({
      label: `Search: "${search}"`,
      onClear: () => setSearch(''),
    });
  }
  if (isActive !== null) {
    filters.push({
      label: `Status: ${isActive ? 'Active' : 'Inactive'}`,
      onClear: () => handleIsActiveChange(null),
    });
  }
  if (sortBy) {
    filters.push({
      label: `Sort: ${sortBy} (${order ?? 'desc'})`,
      onClear: () => {
        handleSortByChange(null);
        handleOrderChange(null);
      },
    });
  }
  // ... repeat for each filter

  return filters;
}, [search, isActive, sortBy, order /* ... */]);
```

## Common Mistakes to Avoid

1. **NEVER use `search` for input value** — always use `searchInputValue` (prevents laggy typing)
2. **NEVER forget to reset page** in change handlers — users get empty pages
3. **NEVER pass `null` to API params** — convert to `undefined` in the `params` object
4. **NEVER forget `limit` → `pageSize` mapping** — they have different names
5. **ALWAYS use `parseAsStringLiteral` with `as const` arrays** — validates against known values
6. **ALWAYS use `parseAsBoolean` for boolean URL params** — parses 'true'/'false' strings correctly
7. **ALWAYS wrap handlers in `useCallback`** with proper dependency arrays
8. **ALWAYS use `useMemo` for `hasActiveFilters`** — prevents recalculation on every render
9. **For comma-separated array params** (like categoryIds), join on save and split on read
