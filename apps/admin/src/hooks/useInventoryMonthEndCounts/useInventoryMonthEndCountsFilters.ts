import { useCallback, useMemo } from 'react';

import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

import type {
  InventoryStockLevel,
  SortOrder,
} from '@/hooks/useInventoryItems/types';
import type { MonthEndCountSortBy } from './types';

export const MONTH_END_COUNT_SORT_OPTIONS = [
  'warehouseName',
  'brochureName',
  'brochureTypeName',
  'customerName',
  'boxes',
  'unitsPerBox',
  'stockLevel',
  'countedBoxes',
  'distributionBoxes',
  'updatedAt',
] as const satisfies readonly MonthEndCountSortBy[];

export const SORT_ORDER_OPTIONS = [
  'asc',
  'desc',
] as const satisfies readonly SortOrder[];

export const INVENTORY_STOCK_LEVEL_OPTIONS = [
  'Low',
  'On Target',
  'Overstock',
] as const satisfies readonly InventoryStockLevel[];

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
  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(MONTH_END_COUNT_SORT_OPTIONS),
  );
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(SORT_ORDER_OPTIONS),
  );
  const [warehouseId, setWarehouseId] = useQueryState(
    'warehouseId',
    parseAsString,
  );
  const [brochureTypeId, setBrochureTypeId] = useQueryState(
    'brochureTypeId',
    parseAsString,
  );
  const [stockLevel, setStockLevel] = useQueryState(
    'stockLevel',
    parseAsStringLiteral(INVENTORY_STOCK_LEVEL_OPTIONS),
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

  const handleSortByChange = useCallback(
    (value: MonthEndCountSortBy | null) => {
      setSortBy(value);
      handlePageChange(1);
    },
    [setSortBy, handlePageChange],
  );

  const handleOrderChange = useCallback(
    (value: SortOrder | null) => {
      setOrder(value);
      handlePageChange(1);
    },
    [setOrder, handlePageChange],
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

  const handleStockLevelChange = useCallback(
    (value: InventoryStockLevel | null) => {
      setStockLevel(value);
      handlePageChange(1);
    },
    [setStockLevel, handlePageChange],
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setMonth(null);
    setYear(null);
    setSortBy(null);
    setOrder(null);
    setWarehouseId(null);
    setBrochureTypeId(null);
    setStockLevel(null);
    handlePageChange(1);
  }, [
    setSearch,
    setMonth,
    setYear,
    setSortBy,
    setOrder,
    setWarehouseId,
    setBrochureTypeId,
    setStockLevel,
    handlePageChange,
  ]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        search ||
        month !== null ||
        year !== DEFAULT_YEAR ||
        sortBy ||
        order ||
        warehouseId ||
        brochureTypeId ||
        stockLevel,
      ),
    [
      search,
      month,
      year,
      sortBy,
      order,
      warehouseId,
      brochureTypeId,
      stockLevel,
    ],
  );

  const params = useMemo(
    () => ({
      month: month ?? undefined,
      year,
      search: search || undefined,
      sortBy: sortBy ?? undefined,
      order: order ?? undefined,
      warehouseId: warehouseId ?? undefined,
      brochureTypeId: brochureTypeId ?? undefined,
      stockLevel: stockLevel ?? undefined,
      page,
      limit,
    }),
    [
      month,
      year,
      search,
      sortBy,
      order,
      warehouseId,
      brochureTypeId,
      stockLevel,
      page,
      limit,
    ],
  );

  return {
    search,
    searchInputValue,
    month,
    year,
    sortBy,
    order,
    warehouseId,
    brochureTypeId,
    stockLevel,
    setSearch,
    handleMonthChange,
    handleYearChange,
    handleSortByChange,
    handleOrderChange,
    handleWarehouseChange,
    handleBrochureTypeChange,
    handleStockLevelChange,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    clearFilters,
    hasActiveFilters,
    params,
  };
}
