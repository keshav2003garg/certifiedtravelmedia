import { useCallback, useMemo } from 'react';

import { parseAsInteger, parseAsString, useQueryState } from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

const currentDate = new Date();
const DEFAULT_YEAR = currentDate.getFullYear();

export interface CountPeriod {
  month: number;
  year: number;
}

/**
 * Returns {month, year} for the current calendar month.
 */
export function getCurrentMonthPeriod(): CountPeriod {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/**
 * Returns {month, year} for the calendar month immediately preceding
 * the current local month. Wraps to December of the previous year in
 * January.
 */
export function getPreviousMonthPeriod(): CountPeriod {
  const current = getCurrentMonthPeriod();

  if (current.month === 1) {
    return { month: 12, year: current.year - 1 };
  }

  return { month: current.month - 1, year: current.year };
}

/**
 * Returns the two periods month-end counts may be recorded for: the
 * previous month (default) and the current month. Both are derived
 * from the local clock at call time — never hard-coded.
 */
export function getAllowedCountPeriods(): readonly CountPeriod[] {
  return [getPreviousMonthPeriod(), getCurrentMonthPeriod()];
}

function periodKey(period: CountPeriod) {
  return `${period.year}-${String(period.month).padStart(2, '0')}`;
}

function getScopedKey(scope: string | undefined, key: string) {
  if (!scope) return key;

  return `${scope}${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

interface UseInventoryMonthEndCountsFiltersOptions {
  /**
   * When true, restricts the period to the two server-allowed options
   * (previous month and current month) and exposes a `setPeriod`
   * helper. The default selection is the previous month.
   */
  restrictToAllowedPeriods?: boolean;
}

export function useInventoryMonthEndCountsFilters(
  scope?: string,
  options: UseInventoryMonthEndCountsFiltersOptions = {},
) {
  const { restrictToAllowedPeriods = false } = options;
  const allowedPeriods = useMemo(
    () => (restrictToAllowedPeriods ? getAllowedCountPeriods() : []),
    [restrictToAllowedPeriods],
  );
  const defaultRestrictedPeriod = useMemo(
    () => allowedPeriods[0] ?? null,
    [allowedPeriods],
  );
  const pageKey = getScopedKey(scope, 'page');
  const limitKey = getScopedKey(scope, 'limit');
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch(getScopedKey(scope, 'search'), { pageKey, limitKey });
  const { page, limit, handlePageChange, handleLimitChange } = usePagination({
    pageKey,
    limitKey,
  });

  const [storedMonth, setMonth] = useQueryState(
    getScopedKey(scope, 'month'),
    parseAsInteger,
  );
  const [storedYear, setYear] = useQueryState(
    getScopedKey(scope, 'year'),
    parseAsInteger.withDefault(DEFAULT_YEAR),
  );
  const [warehouseId, setWarehouseId] = useQueryState(
    getScopedKey(scope, 'warehouseId'),
    parseAsString,
  );
  const [brochureTypeId, setBrochureTypeId] = useQueryState(
    getScopedKey(scope, 'brochureTypeId'),
    parseAsString,
  );

  const restrictedPeriod = useMemo<CountPeriod | null>(() => {
    if (!restrictToAllowedPeriods) return null;

    const matched = allowedPeriods.find(
      (period) => period.month === storedMonth && period.year === storedYear,
    );

    return matched ?? defaultRestrictedPeriod;
  }, [
    restrictToAllowedPeriods,
    allowedPeriods,
    storedMonth,
    storedYear,
    defaultRestrictedPeriod,
  ]);

  const month = restrictToAllowedPeriods
    ? (restrictedPeriod?.month ?? null)
    : storedMonth;
  const year = restrictToAllowedPeriods
    ? (restrictedPeriod?.year ?? DEFAULT_YEAR)
    : storedYear;

  const handleMonthChange = useCallback(
    (value: number | null) => {
      if (restrictToAllowedPeriods) return;
      setMonth(value);
      handlePageChange(1);
    },
    [restrictToAllowedPeriods, setMonth, handlePageChange],
  );

  const handleYearChange = useCallback(
    (value: number | undefined) => {
      if (restrictToAllowedPeriods) return;
      if (!value) return;

      setYear(value === DEFAULT_YEAR ? null : value);
      handlePageChange(1);
    },
    [restrictToAllowedPeriods, setYear, handlePageChange],
  );

  const handlePeriodChange = useCallback(
    (period: CountPeriod) => {
      if (!restrictToAllowedPeriods) return;

      const isAllowed = allowedPeriods.some(
        (allowed) =>
          allowed.month === period.month && allowed.year === period.year,
      );

      if (!isAllowed) return;

      setMonth(period.month);
      setYear(period.year);
      handlePageChange(1);
    },
    [restrictToAllowedPeriods, allowedPeriods, setMonth, setYear, handlePageChange],
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
    if (!restrictToAllowedPeriods) {
      setMonth(null);
      setYear(null);
    }
    setWarehouseId(null);
    setBrochureTypeId(null);
    handlePageChange(1);
  }, [
    restrictToAllowedPeriods,
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
          (!restrictToAllowedPeriods && storedMonth !== null) ||
          (!restrictToAllowedPeriods && storedYear !== DEFAULT_YEAR) ||
          warehouseId ||
          brochureTypeId,
      ),
    [
      restrictToAllowedPeriods,
      search,
      storedMonth,
      storedYear,
      warehouseId,
      brochureTypeId,
    ],
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
    handlePeriodChange,
    handleWarehouseChange,
    handleBrochureTypeChange,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    clearFilters,
    hasActiveFilters,
    params,
    isPeriodRestricted: restrictToAllowedPeriods,
    allowedPeriods,
    selectedPeriodKey:
      month !== null && year !== null ? periodKey({ month, year }) : null,
  };
}
