import { useCallback, useMemo } from 'react';

import { parseAsStringLiteral, useQueryState } from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

import type { CustomerSortBy, SortOrder } from './types';

export const CUSTOMER_SORT_OPTIONS = [
  'name',
  'acumaticaId',
  'createdAt',
  'updatedAt',
] as const satisfies readonly CustomerSortBy[];

export const SORT_ORDER_OPTIONS = [
  'asc',
  'desc',
] as const satisfies readonly SortOrder[];

export function useCustomersFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(CUSTOMER_SORT_OPTIONS),
  );
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(SORT_ORDER_OPTIONS),
  );

  const handleSortByChange = useCallback(
    (value: CustomerSortBy | null) => {
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
