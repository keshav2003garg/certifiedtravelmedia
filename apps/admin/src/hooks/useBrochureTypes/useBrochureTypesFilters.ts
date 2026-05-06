import { useCallback, useMemo } from 'react';

import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

export function useBrochureTypesFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const clearFilters = useCallback(() => {
    setSearch('');
    handlePageChange(1);
  }, [setSearch, handlePageChange]);

  const hasActiveFilters = useMemo(() => Boolean(search), [search]);

  const params = useMemo(
    () => ({
      search: search || undefined,
      page,
      limit,
    }),
    [search, page, limit],
  );

  return {
    search,
    searchInputValue,
    setSearch,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    clearFilters,
    hasActiveFilters,
    params,
  };
}
