import { useCallback, useMemo } from 'react';

import { parseAsInteger, parseAsString, useQueryState } from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

const currentDate = new Date();
const DEFAULT_YEAR = currentDate.getFullYear();

export function useInventoryMonthEndCountsFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [month, setMonth] = useQueryState('month', parseAsInteger);
  const [year, setYear] = useQueryState(
    'year',
    parseAsInteger.withDefault(DEFAULT_YEAR),
  );
  const [warehouseId, setWarehouseId] = useQueryState(
    'warehouseId',
    parseAsString,
  );
  const [brochureTypeId, setBrochureTypeId] = useQueryState(
    'brochureTypeId',
    parseAsString,
  );

  const handleMonthChange = useCallback(
    (value: number | null) => {
      setMonth(value);
      handlePageChange(1);
    },
    [setMonth, handlePageChange],
  );

  const handleYearChange = useCallback(
    (value: number | undefined) => {
      if (!value) return;

      setYear(value === DEFAULT_YEAR ? null : value);
      handlePageChange(1);
    },
    [setYear, handlePageChange],
  );

  const handleWarehouseChange = useCallback(
    (value: string | null) => {
      setWarehouseId(value);
      handlePageChange(1);
    },
    [setWarehouseId, handlePageChange],
  );

  const handleBrochureTypeChange = useCallback(
    (value: string | null) => {
      setBrochureTypeId(value);
      handlePageChange(1);
    },
    [setBrochureTypeId, handlePageChange],
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setMonth(null);
    setYear(null);
    setWarehouseId(null);
    setBrochureTypeId(null);
    handlePageChange(1);
  }, [
    setSearch,
    setMonth,
    setYear,
    setWarehouseId,
    setBrochureTypeId,
    handlePageChange,
  ]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        search ||
        month !== null ||
        year !== DEFAULT_YEAR ||
        warehouseId ||
        brochureTypeId,
      ),
    [search, month, year, warehouseId, brochureTypeId],
  );

  const params = useMemo(
    () => ({
      month: month ?? undefined,
      year,
      search: search || undefined,
      warehouseId: warehouseId ?? undefined,
      brochureTypeId: brochureTypeId ?? undefined,
      page,
      limit,
    }),
    [month, year, search, warehouseId, brochureTypeId, page, limit],
  );

  return {
    search,
    searchInputValue,
    month,
    year,
    warehouseId,
    brochureTypeId,
    setSearch,
    handleMonthChange,
    handleYearChange,
    handleWarehouseChange,
    handleBrochureTypeChange,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    clearFilters,
    hasActiveFilters,
    params,
  };
}
