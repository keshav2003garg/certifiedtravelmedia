import { useCallback } from 'react';

import { parseAsInteger, useQueryState } from 'nuqs';

export function usePagination() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit, setLimit] = useQueryState(
    'limit',
    parseAsInteger.withDefault(10),
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      if (size < 1) return;

      if (size === 10) {
        setLimit(null);
      } else {
        setLimit(size);
      }
    },
    [setLimit],
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
    handlePageSizeChange,
  };
}
