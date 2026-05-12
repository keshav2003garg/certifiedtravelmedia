import { useCallback } from 'react';

import { parseAsInteger, useQueryState } from 'nuqs';

export interface UsePaginationOptions {
  pageKey?: string;
  limitKey?: string;
  defaultLimit?: number;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const pageKey = options.pageKey ?? 'page';
  const limitKey = options.limitKey ?? 'limit';
  const defaultLimit = options.defaultLimit ?? 10;

  const [page, setPage] = useQueryState(pageKey, parseAsInteger.withDefault(1));
  const [limit, setLimit] = useQueryState(
    limitKey,
    parseAsInteger.withDefault(defaultLimit),
  );

  const handleLimitChange = useCallback(
    (limit: number) => {
      if (limit < 1) return;

      if (limit === defaultLimit) {
        setLimit(null);
      } else {
        setLimit(limit);
      }
    },
    [defaultLimit, setLimit],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1) return;

      if (page === 1) {
        setPage(null);
      } else {
        setPage(page);
      }
    },
    [setPage],
  );

  const goToNextPage = useCallback(() => {
    setPage(page + 1);
  }, [setPage, page]);

  const goToPreviousPage = useCallback(() => {
    if (page <= 1) return;
    setPage(page - 1);
  }, [setPage, page]);

  return {
    page,
    handlePageChange,
    goToNextPage,
    goToPreviousPage,

    limit,
    handleLimitChange,
  };
}
