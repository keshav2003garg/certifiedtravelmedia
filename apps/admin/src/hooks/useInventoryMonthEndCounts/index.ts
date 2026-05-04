import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  BulkMonthEndCountRequest,
  ListMonthEndCountsRequest,
} from './types';

const INVENTORY_MONTH_END_COUNTS_ENDPOINT = '/admin/inventory/counts';

export const inventoryMonthEndCountsQueryKeys = {
  list: (params: ListMonthEndCountsRequest['payload']) =>
    [ReactQueryKeys.GET_INVENTORY_MONTH_END_COUNTS, params] as const,
};

export function useInventoryMonthEndCounts() {
  const getMonthEndCounts = useCallback(
    async (params: ListMonthEndCountsRequest['payload']) => {
      const response = await api<ListMonthEndCountsRequest['response']>(
        INVENTORY_MONTH_END_COUNTS_ENDPOINT,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const bulkMonthEndCount = useCallback(
    async (payload: BulkMonthEndCountRequest['payload']) => {
      const response = await api<BulkMonthEndCountRequest['response']>(
        `${INVENTORY_MONTH_END_COUNTS_ENDPOINT}/bulk`,
        { method: 'POST', body: payload },
      );

      return response.data;
    },
    [],
  );

  const monthEndCountsQueryOptions = (
    params: ListMonthEndCountsRequest['payload'],
  ) =>
    queryOptions({
      queryKey: inventoryMonthEndCountsQueryKeys.list(params),
      queryFn: () => getMonthEndCounts(params),
    });

  const bulkMonthEndCountMutation = useMutation({
    mutationFn: bulkMonthEndCount,
    meta: {
      successMessage: 'Month-end counts saved successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_INVENTORY_MONTH_END_COUNTS,
        ReactQueryKeys.GET_INVENTORY_ITEMS,
        ReactQueryKeys.GET_INVENTORY_ITEM,
        ReactQueryKeys.GET_INVENTORY_ITEM_TRANSACTIONS,
      ],
    },
  });

  return {
    getMonthEndCounts,
    monthEndCountsQueryOptions,
    bulkMonthEndCountMutation,
  };
}
