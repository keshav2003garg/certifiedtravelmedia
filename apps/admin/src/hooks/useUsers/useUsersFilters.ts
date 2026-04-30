import { useCallback, useMemo } from 'react';

import { parseAsStringLiteral, useQueryState } from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

import {
  SORT_ORDER_OPTIONS,
  USER_FILTER_OPTIONS,
  USER_SEARCH_FIELDS,
  USER_SORT_OPTIONS,
} from './types';

import type {
  SortOrder,
  UserFilter,
  UserSearchField,
  UserSortBy,
} from './types';

export function useUsersFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [searchField, setSearchField] = useQueryState(
    'searchField',
    parseAsStringLiteral(USER_SEARCH_FIELDS),
  );
  const [filter, setFilter] = useQueryState(
    'filter',
    parseAsStringLiteral(USER_FILTER_OPTIONS),
  );
  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(USER_SORT_OPTIONS),
  );
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(SORT_ORDER_OPTIONS),
  );

  const handleSearchFieldChange = useCallback(
    (value: UserSearchField | null) => {
      setSearchField(value === 'email' ? null : value);
      handlePageChange(1);
    },
    [setSearchField, handlePageChange],
  );

  const handleFilterChange = useCallback(
    (value: UserFilter | null) => {
      setFilter(value);
      handlePageChange(1);
    },
    [setFilter, handlePageChange],
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
    setSearchField(null);
    setFilter(null);
    setSortBy(null);
    setOrder(null);
    handlePageChange(1);
  }, [
    setSearch,
    setSearchField,
    setFilter,
    setSortBy,
    setOrder,
    handlePageChange,
  ]);

  const effectiveSearchField = searchField ?? 'email';
  const effectiveSortBy = sortBy ?? 'name';
  const effectiveOrder = order ?? 'asc';

  const hasActiveFilters = useMemo(
    () => Boolean(search || searchField || filter || sortBy || order),
    [search, searchField, filter, sortBy, order],
  );

  const params = useMemo(
    () => ({
      search: search || undefined,
      searchField: effectiveSearchField,
      filter: filter ?? undefined,
      sortBy: effectiveSortBy,
      order: effectiveOrder,
      page,
      limit,
    }),
    [
      search,
      effectiveSearchField,
      filter,
      effectiveSortBy,
      effectiveOrder,
      page,
      limit,
    ],
  );

  return {
    search,
    searchInputValue,
    searchField: effectiveSearchField,
    filter,
    sortBy: effectiveSortBy,
    order: effectiveOrder,
    setSearch,
    handleSearchFieldChange,
    handleFilterChange,
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
