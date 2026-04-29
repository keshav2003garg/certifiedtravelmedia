import { useCallback, useMemo } from 'react';

import {
  parseAsBoolean,
  parseAsStringLiteral,
  useQueryState,
} from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

import type { SortOrder, WarehouseSortBy } from './types';

export const WAREHOUSE_SORT_OPTIONS = [
  'name',
  'acumaticaId',
  'createdAt',
  'updatedAt',
] as const satisfies readonly WarehouseSortBy[];

export const SORT_ORDER_OPTIONS = [
  'asc',
  'desc',
] as const satisfies readonly SortOrder[];

export function useWarehousesFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(WAREHOUSE_SORT_OPTIONS),
  );
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(SORT_ORDER_OPTIONS),
  );
  const [includeInactive, setIncludeInactive] = useQueryState(
    'includeInactive',
    parseAsBoolean,
  );

  const handleSortByChange = useCallback(
    (value: WarehouseSortBy | null) => {
      setSortBy(value);
      handlePageChange(1);
    },
    [setSortBy, handlePageChange],
  );

  const handleOrderChange = useCallback(
    (value: SortOrder | null) => {
      setOrder(value);
      handlePageChange(1);
    },
    [setOrder, handlePageChange],
  );

  const handleIncludeInactiveChange = useCallback(
    (value: boolean | null) => {
      setIncludeInactive(value);
      handlePageChange(1);
    },
    [setIncludeInactive, handlePageChange],
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setSortBy(null);
    setOrder(null);
    setIncludeInactive(null);
    handlePageChange(1);
  }, [setSearch, setSortBy, setOrder, setIncludeInactive, handlePageChange]);

  const hasActiveFilters = useMemo(
    () => Boolean(search || sortBy || order || includeInactive),
    [search, sortBy, order, includeInactive],
  );

  const params = useMemo(
    () => ({
      search: search || undefined,
      sortBy: sortBy ?? undefined,
      order: order ?? undefined,
      includeInactive: includeInactive || undefined,
      page,
      limit,
    }),
    [search, sortBy, order, includeInactive, page, limit],
  );

  return {
    search,
    searchInputValue,
    sortBy,
    order,
    includeInactive,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleIncludeInactiveChange,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    clearFilters,
    hasActiveFilters,
    params,
  };
}
