import { useCallback, useEffect, useMemo, useState } from 'react';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { debounce } from '@repo/utils/debounce';

import type { QueryKey } from '@tanstack/react-query';

export const SERVER_SEARCH_SELECT_LIMIT = 10;
export const SERVER_SEARCH_SELECT_DEBOUNCE_MS = 400;

export interface ServerSearchSelectParams {
  page: number;
  limit: number;
  search?: string;
}

export interface ServerSearchSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface UseServerSearchSelectOptionsParams<
  TData,
  TOption extends ServerSearchSelectOption,
  TParams extends ServerSearchSelectParams,
> {
  queryKey: (params: TParams) => QueryKey;
  queryFn: (params: TParams) => Promise<TData>;
  selectOptions: (data: TData | undefined) => TOption[];
  buildParams?: (params: ServerSearchSelectParams) => TParams;
  baseOptions?: TOption[];
  enabled?: boolean;
  limit?: number;
  debounceMs?: number;
}

function mergeOptions<TOption extends ServerSearchSelectOption>(
  baseOptions: TOption[],
  fetchedOptions: TOption[],
) {
  const optionsByValue = new Map<string, TOption>();

  for (const option of baseOptions) {
    optionsByValue.set(option.value, option);
  }

  for (const option of fetchedOptions) {
    optionsByValue.set(option.value, option);
  }

  return Array.from(optionsByValue.values());
}

export function useServerSearchSelectOptions<
  TData,
  TOption extends ServerSearchSelectOption = ServerSearchSelectOption,
  TParams extends ServerSearchSelectParams = ServerSearchSelectParams,
>({
  queryKey,
  queryFn,
  selectOptions,
  buildParams,
  baseOptions = [],
  enabled = true,
  limit = SERVER_SEARCH_SELECT_LIMIT,
  debounceMs = SERVER_SEARCH_SELECT_DEBOUNCE_MS,
}: UseServerSearchSelectOptionsParams<TData, TOption, TParams>) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const trimmedSearch = search.trim();

  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, debounceMs),
    [debounceMs],
  );

  useEffect(() => {
    return () => debouncedSetSearch.cancel();
  }, [debouncedSetSearch]);

  const handleSearchChange = useCallback(
    (value: string) => {
      const nextSearch = value.trim();

      setSearch(value);

      if (!nextSearch) {
        debouncedSetSearch.cancel();
        setDebouncedSearch('');
        return;
      }

      debouncedSetSearch(nextSearch);
    },
    [debouncedSetSearch],
  );

  const baseParams = useMemo<ServerSearchSelectParams>(
    () => ({
      page: 1,
      limit,
      search: debouncedSearch || undefined,
    }),
    [debouncedSearch, limit],
  );
  const params = useMemo(
    () => (buildParams ? buildParams(baseParams) : (baseParams as TParams)),
    [baseParams, buildParams],
  );

  const query = useQuery({
    queryKey: queryKey(params),
    queryFn: () => queryFn(params),
    enabled,
    placeholderData: keepPreviousData,
  });

  const fetchedOptions = useMemo(
    () => selectOptions(query.data),
    [query.data, selectOptions],
  );

  const options = useMemo(
    () => mergeOptions(baseOptions, fetchedOptions),
    [baseOptions, fetchedOptions],
  );

  return {
    options,
    search,
    debouncedSearch,
    setSearch: handleSearchChange,
    isDebouncing: trimmedSearch !== debouncedSearch,
    isLoading: query.isLoading,
    isSearching: query.isFetching || trimmedSearch !== debouncedSearch,
    query,
  };
}
