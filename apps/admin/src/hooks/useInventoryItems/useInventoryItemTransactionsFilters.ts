import { useCallback, useMemo } from 'react';

import {
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';

import type { InventoryTransactionType } from './types';

export const INVENTORY_TRANSACTION_TYPE_OPTIONS = [
  'Delivery',
  'Distribution',
  'Recycle',
  'Trans In',
  'Trans Out',
  'Return to Client',
  'Adjustment',
  'Start Count',
] as const satisfies readonly InventoryTransactionType[];

export function useInventoryItemTransactionsFilters() {
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [transactionType, setTransactionType] = useQueryState(
    'transactionType',
    parseAsStringLiteral(INVENTORY_TRANSACTION_TYPE_OPTIONS),
  );
  const [dateFrom, setDateFrom] = useQueryState('dateFrom', parseAsString);
  const [dateTo, setDateTo] = useQueryState('dateTo', parseAsString);

  const handleTransactionTypeChange = useCallback(
    (value: InventoryTransactionType | null) => {
      setTransactionType(value);
      handlePageChange(1);
    },
    [setTransactionType, handlePageChange],
  );

  const handleDateFromChange = useCallback(
    (value: string) => {
      setDateFrom(value || null);
      handlePageChange(1);
    },
    [setDateFrom, handlePageChange],
  );

  const handleDateToChange = useCallback(
    (value: string) => {
      setDateTo(value || null);
      handlePageChange(1);
    },
    [setDateTo, handlePageChange],
  );

  const clearFilters = useCallback(() => {
    setTransactionType(null);
    setDateFrom(null);
    setDateTo(null);
    handlePageChange(1);
  }, [setTransactionType, setDateFrom, setDateTo, handlePageChange]);

  const hasActiveFilters = useMemo(
    () => Boolean(transactionType || dateFrom || dateTo),
    [transactionType, dateFrom, dateTo],
  );

  const params = useMemo(
    () => ({
      transactionType: transactionType ?? undefined,
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
      page,
      limit,
    }),
    [transactionType, dateFrom, dateTo, page, limit],
  );

  return {
    transactionType,
    dateFrom,
    dateTo,
    handleTransactionTypeChange,
    handleDateFromChange,
    handleDateToChange,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    clearFilters,
    hasActiveFilters,
    params,
  };
}
