import { useCallback, useMemo } from 'react';

import { parseAsInteger, useQueryState } from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

const currentDate = new Date();
const DEFAULT_MONTH = currentDate.getMonth() + 1;
const DEFAULT_YEAR = currentDate.getFullYear();

function normalizeMonth(value: number) {
  if (value < 1) return 1;
  if (value > 12) return 12;
  return value;
}

export function useChartEditorFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [month, setMonth] = useQueryState(
    'month',
    parseAsInteger.withDefault(DEFAULT_MONTH),
  );
  const [year, setYear] = useQueryState(
    'year',
    parseAsInteger.withDefault(DEFAULT_YEAR),
  );

  const handleMonthChange = useCallback(
    (value: number) => {
      const nextMonth = normalizeMonth(value);
      setMonth(nextMonth === DEFAULT_MONTH ? null : nextMonth);
      handlePageChange(1);
    },
    [setMonth, handlePageChange],
  );

  const handleYearChange = useCallback(
    (value: number) => {
      if (value < 2020 || value > 2100) return;
      setYear(value === DEFAULT_YEAR ? null : value);
      handlePageChange(1);
    },
    [setYear, handlePageChange],
  );

  const handlePeriodChange = useCallback(
    (nextMonth: number, nextYear: number) => {
      const normalizedMonth = normalizeMonth(nextMonth);
      setMonth(normalizedMonth === DEFAULT_MONTH ? null : normalizedMonth);
      setYear(nextYear === DEFAULT_YEAR ? null : nextYear);
      handlePageChange(1);
    },
    [setMonth, setYear, handlePageChange],
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setMonth(null);
    setYear(null);
    handlePageChange(1);
  }, [setSearch, setMonth, setYear, handlePageChange]);

  const hasActiveFilters = useMemo(
    () => Boolean(search || month !== DEFAULT_MONTH || year !== DEFAULT_YEAR),
    [search, month, year],
  );

  const params = useMemo(
    () => ({
      search: search || undefined,
      month,
      year,
      page,
      limit,
    }),
    [search, month, year, page, limit],
  );

  return {
    search,
    searchInputValue,
    month,
    year,
    page,
    limit,
    setSearch,
    handleMonthChange,
    handleYearChange,
    handlePeriodChange,
    handlePageChange,
    handleLimitChange,
    clearFilters,
    hasActiveFilters,
    params,
  };
}
