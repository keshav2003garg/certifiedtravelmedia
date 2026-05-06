import { useCallback, useMemo } from 'react';

import {
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

import type {
  InventoryRequestSortBy,
  InventoryRequestStatus,
  SortOrder,
  TransactionType,
} from './types';

export const INVENTORY_REQUEST_SORT_OPTIONS = [
  'createdAt',
  'updatedAt',
  'dateReceived',
  'status',
  'brochureName',
] as const satisfies readonly InventoryRequestSortBy[];

export const SORT_ORDER_OPTIONS = [
  'asc',
  'desc',
] as const satisfies readonly SortOrder[];

export const INVENTORY_REQUEST_STATUS_OPTIONS = [
  'Pending',
  'Approved',
  'Rejected',
  'Cancelled',
] as const satisfies readonly InventoryRequestStatus[];

export const REQUEST_VIEW_OPTIONS = [
  'All',
  'Pending',
  'Approved',
  'Rejected',
  'Cancelled',
] as const;

export type RequestViewOption = (typeof REQUEST_VIEW_OPTIONS)[number];

export const INVENTORY_REQUEST_TYPE_OPTIONS = [
  'Delivery',
  'Start Count',
] as const satisfies readonly TransactionType[];

export function useInventoryRequestsFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(INVENTORY_REQUEST_SORT_OPTIONS),
  );
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(SORT_ORDER_OPTIONS),
  );
  const [status, setStatus] = useQueryState(
    'status',
    parseAsStringLiteral(REQUEST_VIEW_OPTIONS),
  );
  const [transactionType, setTransactionType] = useQueryState(
    'transactionType',
    parseAsStringLiteral(INVENTORY_REQUEST_TYPE_OPTIONS),
  );
  const [warehouseId, setWarehouseId] = useQueryState(
    'warehouseId',
    parseAsString,
  );
  const [brochureTypeId, setBrochureTypeId] = useQueryState(
    'brochureTypeId',
    parseAsString,
  );

  const handleSortByChange = useCallback(
    (value: InventoryRequestSortBy | null) => {
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

  const handleStatusChange = useCallback(
    (value: RequestViewOption | null) => {
      setStatus(value);
      handlePageChange(1);
    },
    [setStatus, handlePageChange],
  );

  const handleTransactionTypeChange = useCallback(
    (value: TransactionType | null) => {
      setTransactionType(value);
      handlePageChange(1);
    },
    [setTransactionType, handlePageChange],
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
    setSortBy(null);
    setOrder(null);
    setTransactionType(null);
    setWarehouseId(null);
    setBrochureTypeId(null);
    handlePageChange(1);
  }, [
    setSearch,
    setSortBy,
    setOrder,
    setTransactionType,
    setWarehouseId,
    setBrochureTypeId,
    handlePageChange,
  ]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        search ||
        sortBy ||
        order ||
        transactionType ||
        warehouseId ||
        brochureTypeId,
      ),
    [search, sortBy, order, transactionType, warehouseId, brochureTypeId],
  );

  const params = useMemo(
    () => ({
      search: search || undefined,
      sortBy: sortBy ?? undefined,
      order: order ?? undefined,
      status:
        status === 'All'
          ? undefined
          : ((status ?? 'Pending') as InventoryRequestStatus),
      transactionType: transactionType ?? undefined,
      warehouseId: warehouseId ?? undefined,
      brochureTypeId: brochureTypeId ?? undefined,
      page,
      limit,
    }),
    [
      search,
      sortBy,
      order,
      status,
      transactionType,
      warehouseId,
      brochureTypeId,
      page,
      limit,
    ],
  );

  return {
    search,
    searchInputValue,
    sortBy,
    order,
    status,
    transactionType,
    warehouseId,
    brochureTypeId,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleStatusChange,
    handleTransactionTypeChange,
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
