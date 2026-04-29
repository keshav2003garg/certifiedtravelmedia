---
name: create_api_hook
description: Create standardized API hooks using TanStack Query with ofetch API client in frontend apps.
---

# Create API Hook (React Query + ofetch)

This skill guides you through creating a standardized API hook in `apps/user`, `apps/provider`, or `apps/admin`.

**Location:** `apps/<app>/src/hooks/use<Feature>/index.ts`
**Types:** `apps/<app>/src/hooks/use<Feature>/types.ts`

## 1. Type Definitions (`types.ts`)

**CRITICAL:** Use the `ApiData<Payload, Response>` generic for all request/response pairs.

```typescript
// apps/<app>/src/hooks/use<Feature>/types.ts
import type { ApiData } from '@/lib/api/types';

// ─── Shared Entity Types ─────────────────────────────────────────
// Define the shape of items as returned by the API

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FeatureItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  // ... fields matching API response
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// Extended type for detail view (with related data)
export interface FeatureDetail extends FeatureItem {
  categories: { id: string; name: string }[];
  totalStock: number;
  inventories: {
    id: string;
    quantity: number;
    expirationDate: string | null;
  }[];
}

// ─── Request/Response Pairs ──────────────────────────────────────
// Each pair defines: payload (request params) + response (API data shape)

export type ListFeaturesRequest = ApiData<
  {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: string;
    search?: string;
    categoryIds?: string;
    isActive?: boolean;
    includeDeleted?: boolean;
  },
  {
    items: FeatureItem[];
    pagination: Pagination;
  }
>;

export type GetFeatureRequest = ApiData<
  { id: string; includeDeleted?: boolean },
  { item: FeatureDetail }
>;

export type CreateFeatureRequest = ApiData<
  {
    name: string;
    description?: string;
    salePrice: number;
    categoryIds?: string[];
    // ... creation fields
  },
  { item: FeatureDetail }
>;

// For update — payload is { id, body } tuple
export type UpdateFeatureRequest = ApiData<
  { id: string; body: Partial<CreateFeatureRequest['payload']> },
  { item: FeatureDetail }
>;

export type DeleteFeatureRequest = ApiData<string, { item: FeatureItem }>;

// Stats response
export type GetFeatureStatsRequest = ApiData<
  void,
  {
    stats: {
      total: number;
      active: number;
      inactive: number;
      outOfStock: number;
    };
  }
>;

// Export params (for reuse in filter hooks)
export type ExportFeaturesParams = {
  format?: 'csv' | 'json';
  search?: string;
  isActive?: boolean;
};
```

### Type Rules

- **NEVER duplicate DB schema types** — define API response shapes separately
- **Use `ApiData<Payload, Response>`** for all request/response pairs
- **Payload** = what the caller provides (query params, body, ID)
- **Response** = the `data` field inside the API's `{ success, message, data }` envelope
- **For update payloads**, use `{ id: string; body: Partial<...> }` tuple pattern
- **For delete payloads**, use simple `string` (the ID)

## 2. Hook Implementation (`index.ts`)

**CRITICAL:** The API client is `api` from `@/lib/api/instances`, NOT `useRequest()`.

```typescript
// apps/<app>/src/hooks/use<Feature>/index.ts
import { useCallback } from 'react';
import { queryOptions, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/instances';
import { ReactQueryKeys } from '@/types/react-query-keys';
import type {
  ListFeaturesRequest,
  GetFeatureRequest,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  DeleteFeatureRequest,
  GetFeatureStatsRequest,
  ExportFeaturesParams,
} from './types';

export function useFeatures() {
  // ─── Fetchers (wrapped in useCallback) ──────────────────────────

  const getFeatures = useCallback(
    async (params?: ListFeaturesRequest['payload']) => {
      const response = await api<ListFeaturesRequest['response']>('/features', {
        query: params,
      });
      return response.data;
    },
    [],
  );

  const getFeature = useCallback(
    async (id: string, includeDeleted?: boolean) => {
      const response = await api<GetFeatureRequest['response']>(
        `/features/${id}`,
        { query: includeDeleted ? { includeDeleted } : undefined },
      );
      return response.data;
    },
    [],
  );

  const getStats = useCallback(async () => {
    const response =
      await api<GetFeatureStatsRequest['response']>('/features/stats');
    return response.data;
  }, []);

  const createFeature = useCallback(
    async (payload: CreateFeatureRequest['payload']) => {
      const response = await api<CreateFeatureRequest['response']>(
        '/features',
        { method: 'POST', body: payload },
      );
      return response.data;
    },
    [],
  );

  const updateFeature = useCallback(
    async ({ id, body }: UpdateFeatureRequest['payload']) => {
      const response = await api<UpdateFeatureRequest['response']>(
        `/features/${id}`,
        { method: 'PUT', body },
      );
      return response.data;
    },
    [],
  );

  const deleteFeature = useCallback(async (id: string) => {
    const response = await api<DeleteFeatureRequest['response']>(
      `/features/${id}`,
      { method: 'DELETE' },
    );
    return response.data;
  }, []);

  // ─── Query Options ──────────────────────────────────────────────
  // Return queryOptions objects (NOT hooks) — consumer calls useQuery()

  const featuresQueryOptions = (params?: ListFeaturesRequest['payload']) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_FEATURES, params],
      queryFn: () => getFeatures(params),
    });

  const featureQueryOptions = (id: string) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_FEATURE, id],
      queryFn: () => getFeature(id),
    });

  const statsQueryOptions = () =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_FEATURE_STATS],
      queryFn: getStats,
    });

  // ─── Mutations ──────────────────────────────────────────────────
  // Use meta for auto toast + auto invalidation (handled by QueryClient)

  const createMutation = useMutation({
    mutationFn: createFeature,
    meta: {
      successMessage: 'Feature created successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_FEATURES,
        ReactQueryKeys.GET_FEATURE_STATS,
      ],
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateFeature,
    meta: {
      successMessage: 'Feature updated successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_FEATURES,
        ReactQueryKeys.GET_FEATURE,
        ReactQueryKeys.GET_FEATURE_STATS,
      ],
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFeature,
    meta: {
      successMessage: 'Feature deleted successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_FEATURES,
        ReactQueryKeys.GET_FEATURE,
        ReactQueryKeys.GET_FEATURE_STATS,
      ],
    },
  });

  // ─── Export (special blob handling) ─────────────────────────────

  const exportFeatures = useCallback(async (params?: ExportFeaturesParams) => {
    const format = params?.format ?? 'csv';
    const query = { ...params };
    if (format === 'csv') {
      const response = await api<Blob, 'blob'>('/features/export', {
        query,
        responseType: 'blob',
      });
      return response;
    }
    const response = await api<{ items: unknown[] }>('/features/export', {
      query,
    });
    return response.data;
  }, []);

  // ─── Return ─────────────────────────────────────────────────────

  return {
    // Query options (consumer calls useQuery with these)
    featuresQueryOptions,
    featureQueryOptions,
    statsQueryOptions,
    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
    // Special
    exportFeatures,
  };
}
```

## 3. React Query Keys

Add keys to `apps/<app>/src/types/react-query-keys.ts`:

```typescript
export enum ReactQueryKeys {
  // Existing keys...
  GET_FEATURES = 'GET::/features',
  GET_FEATURE = 'GET::/features/:id',
  GET_FEATURE_STATS = 'GET::/features/stats',
}
```

**Key naming convention:** `GET::/api-path` matching the API endpoint.

## 4. Usage in Components

```typescript
// In a list page component
const { featuresQueryOptions, deleteMutation } = useFeatures();
const filters = useFeaturesFilters();
const { data, isLoading } = useQuery(featuresQueryOptions(filters.params));

// In a detail page component
const { featureQueryOptions } = useFeatures();
const { data, isLoading } = useQuery(featureQueryOptions(id));

// In a form component
const { createMutation, updateMutation } = useFeatures();
createMutation.mutate(formData, {
  onSuccess: (result) => {
    router.navigate({
      to: '/dashboard/features/$id',
      params: { id: result.item.id },
    });
  },
});
```

## Common Mistakes to Avoid

1. **NEVER use `useRequest()`** — use `api` from `@/lib/api/instances` (ofetch, not axios)
2. **NEVER return hooks from the hook** — return `queryOptions` objects, not `useQuery` results
3. **NEVER forget `invalidateQueries`** in mutation meta — list what queries this mutation affects
4. **NEVER hardcode toast messages** — use `meta.successMessage` for automatic handling by QueryClient
5. **ALWAYS wrap fetchers in `useCallback`** to prevent unnecessary re-renders
6. **ALWAYS unwrap API response** — `response.data` returns the actual data from `{ success, message, data }`
7. **For blob exports** — use `responseType: 'blob'` and handle download with `URL.createObjectURL`
8. **Update mutations should invalidate MORE queries** than create (include detail + stats)
9. **Delete mutations should invalidate ALL related queries** (list + detail + stats + related)
