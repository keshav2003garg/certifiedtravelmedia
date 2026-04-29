import { useCallback, useEffect, useRef, useState } from 'react';

import { parseAsString, useQueryState } from 'nuqs';

import { debounce } from '@repo/utils/debounce';

import { usePagination } from '../usePagination/usePagination';

export function useSearch(key?: string) {
  const { handlePageChange } = usePagination();

  const [search, setSearch] = useQueryState(key ?? 'q', parseAsString);
  const [inputValue, setInputValue] = useState(search ?? '');
  const [prevSearch, setPrevSearch] = useState(search);

  if (search !== prevSearch) {
    setPrevSearch(search);
    setInputValue(search ?? '');
  }

  const debouncedSearchUpdateRef = useRef(
    debounce((value: string | null) => {
      setSearch(value);
    }, 400),
  );

  useEffect(() => {
    const searchUpdateRef = debouncedSearchUpdateRef.current;
    return () => {
      searchUpdateRef.cancel();
    };
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setInputValue(value);
      if (value.length === 0) {
        debouncedSearchUpdateRef.current(null);
      } else {
        debouncedSearchUpdateRef.current(value);
      }
      handlePageChange(1);
    },
    [handlePageChange],
  );

  return {
    search: search === null ? undefined : search,
    inputValue,
    setSearch: handleSearch,
  };
}
