import { useCallback, useMemo } from 'react';

import {
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

import type {
  InventoryItemSortBy,
  InventoryStockLevel,
  SortOrder,
} from './types';

export const INVENTORY_ITEM_SORT_OPTIONS = [
  'warehouseName',
  'brochureName',
  'brochureTypeName',
  'customerName',
  'boxes',
  'unitsPerBox',
  'stockLevel',
  'createdAt',
  'updatedAt',
] as const satisfies readonly InventoryItemSortBy[];

export const SORT_ORDER_OPTIONS = [
  'asc',
  'desc',
] as const satisfies readonly SortOrder[];

export const INVENTORY_STOCK_LEVEL_OPTIONS = [
  'Low',
  'On Target',
  'Overstock',
] as const satisfies readonly InventoryStockLevel[];

export function useInventoryItemsFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(INVENTORY_ITEM_SORT_OPTIONS),
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

  const handleSortByChange = useCallback(
    (value: InventoryItemSortBy | null) => {
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
    setSortBy(null);
    setOrder(null);
    setWarehouseId(null);
    setBrochureTypeId(null);
    setStockLevel(null);
    handlePageChange(1);
  }, [
    setSearch,
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
        sortBy ||
        order ||
        warehouseId ||
        brochureTypeId ||
        stockLevel,
      ),
    [search, sortBy, order, warehouseId, brochureTypeId, stockLevel],
  );

  const params = useMemo(
    () => ({
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
    sortBy,
    order,
    warehouseId,
    brochureTypeId,
    stockLevel,
    setSearch,
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
