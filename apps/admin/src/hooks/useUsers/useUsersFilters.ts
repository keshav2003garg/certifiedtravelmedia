import { useCallback, useMemo } from 'react';

import { parseAsStringLiteral, useQueryState } from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

import { SORT_ORDER_OPTIONS, USER_SORT_OPTIONS } from './types';

import type { SortOrder, UserSortBy } from './types';

export function useUsersFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(USER_SORT_OPTIONS),
  );
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(SORT_ORDER_OPTIONS),
  );

  const handleSortByChange = useCallback(
    (value: UserSortBy | null) => {
      setSortBy(value === 'name' ? null : value);
      handlePageChange(1);
    },
    [setSortBy, handlePageChange],
  );

  const handleOrderChange = useCallback(
    (value: SortOrder | null) => {
      setOrder(value === 'asc' ? null : value);
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

  const effectiveSortBy = sortBy ?? 'name';
  const effectiveOrder = order ?? 'asc';

  const hasActiveFilters = useMemo(
    () => Boolean(search || sortBy || order),
    [search, sortBy, order],
  );

  const params = useMemo(
    () => ({
      search: search || undefined,
      sortBy: effectiveSortBy,
      order: effectiveOrder,
      page,
      limit,
    }),
    [search, effectiveSortBy, effectiveOrder, page, limit],
  );

  return {
    search,
    searchInputValue,
    sortBy: effectiveSortBy,
    order: effectiveOrder,
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
