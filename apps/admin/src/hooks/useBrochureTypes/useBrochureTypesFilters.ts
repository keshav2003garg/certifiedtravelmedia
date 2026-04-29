import { useCallback, useMemo } from 'react';

import { parseAsStringLiteral, useQueryState } from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

import type { BrochureTypeSortBy, SortOrder } from './types';

export const BROCHURE_TYPE_SORT_OPTIONS = [
  'name',
  'colSpan',
  'createdAt',
  'updatedAt',
] as const satisfies readonly BrochureTypeSortBy[];

export const SORT_ORDER_OPTIONS = [
  'asc',
  'desc',
] as const satisfies readonly SortOrder[];

export function useBrochureTypesFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(BROCHURE_TYPE_SORT_OPTIONS),
  );
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(SORT_ORDER_OPTIONS),
  );

  const handleSortByChange = useCallback(
    (value: BrochureTypeSortBy | null) => {
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

  const clearFilters = useCallback(() => {
    setSearch('');
    setSortBy(null);
    setOrder(null);
    handlePageChange(1);
  }, [setSearch, setSortBy, setOrder, handlePageChange]);

  const hasActiveFilters = useMemo(
    () => Boolean(search || sortBy || order),
    [search, sortBy, order],
  );

  const params = useMemo(
    () => ({
      search: search || undefined,
      sortBy: sortBy ?? undefined,
      order: order ?? undefined,
      page,
      limit,
    }),
    [search, sortBy, order, page, limit],
  );

  return {
    search,
    searchInputValue,
    sortBy,
    order,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    clearFilters,
    hasActiveFilters,
    params,
  };
}
