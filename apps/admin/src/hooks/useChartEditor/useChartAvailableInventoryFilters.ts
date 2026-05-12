import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  useNavigate,
  useSearch as useRouteSearch,
} from '@tanstack/react-router';

import { debounce } from '@repo/utils/debounce';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

function normalizeSearch(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : undefined;
}

export function useChartAvailableInventoryFilters() {
  const routeSearch = useRouteSearch({ from: '/charts/$sectorId' });
  const navigate = useNavigate({ from: '/charts/$sectorId' });
  const search = routeSearch.inventorySearch;
  const page = routeSearch.inventoryPage ?? DEFAULT_PAGE;
  const limit = routeSearch.inventoryLimit ?? DEFAULT_LIMIT;
  const [searchInputValue, setSearchInputValue] = useState(search ?? '');
  const [previousSearch, setPreviousSearch] = useState(search);

  if (search !== previousSearch) {
    setPreviousSearch(search);
    setSearchInputValue(search ?? '');
  }

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage < 1) return;

      void navigate({
        search: (previous) => ({
          ...previous,
          inventoryPage: nextPage === DEFAULT_PAGE ? undefined : nextPage,
        }),
      });
    },
    [navigate],
  );

  const handleLimitChange = useCallback(
    (nextLimit: number) => {
      if (nextLimit < 1) return;

      void navigate({
        search: (previous) => ({
          ...previous,
          inventoryLimit: nextLimit === DEFAULT_LIMIT ? undefined : nextLimit,
          inventoryPage: undefined,
        }),
      });
    },
    [navigate],
  );

  const debouncedSearchUpdate = useMemo(
    () =>
      debounce((value: string) => {
        void navigate({
          replace: true,
          search: (previous) => ({
            ...previous,
            inventorySearch: normalizeSearch(value),
            inventoryPage: undefined,
          }),
        });
      }, 400),
    [navigate],
  );

  useEffect(
    () => () => {
      debouncedSearchUpdate.cancel();
    },
    [debouncedSearchUpdate],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchInputValue(value);
      debouncedSearchUpdate(value);
    },
    [debouncedSearchUpdate],
  );

  const goToNextPage = useCallback(() => {
    handlePageChange(page + 1);
  }, [handlePageChange, page]);

  const goToPreviousPage = useCallback(() => {
    if (page <= 1) return;
    handlePageChange(page - 1);
  }, [handlePageChange, page]);

  const params = useMemo(
    () => ({
      search: search || undefined,
      page,
      limit,
    }),
    [limit, page, search],
  );

  return {
    search,
    searchInputValue,
    setSearch,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    goToNextPage,
    goToPreviousPage,
    params,
  };
}
