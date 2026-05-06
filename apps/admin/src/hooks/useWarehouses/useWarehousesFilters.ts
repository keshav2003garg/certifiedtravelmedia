import { useCallback, useMemo } from 'react';

import { parseAsBoolean, useQueryState } from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

export function useWarehousesFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [includeInactive, setIncludeInactive] = useQueryState(
    'includeInactive',
    parseAsBoolean,
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
    setIncludeInactive(null);
    handlePageChange(1);
  }, [setSearch, setIncludeInactive, handlePageChange]);

  const hasActiveFilters = useMemo(
    () => Boolean(search || includeInactive),
    [search, includeInactive],
  );

  const params = useMemo(
    () => ({
      search: search || undefined,
      includeInactive: includeInactive || undefined,
      page,
      limit,
    }),
    [search, includeInactive, page, limit],
  );

  return {
    search,
    searchInputValue,
    includeInactive,
    setSearch,
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
