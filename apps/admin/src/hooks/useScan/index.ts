import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  GetScanInventoryItemRequest,
  ResolveScanInventoryItemRequest,
  SubmitScanCountRequest,
} from './types';

const SCAN_ENDPOINT = '/admin/inventory/counts/scan';

export const scanQueryKeys = {
  resolve: (id: string) => [ReactQueryKeys.GET_SCAN_INVENTORY_RESOLVE, id],
  item: (id: string) => [ReactQueryKeys.GET_SCAN_INVENTORY_ITEM, id],
};

export function useScan() {
  const resolveScanInventoryItem = useCallback(async (id: string) => {
    const response = await api<ResolveScanInventoryItemRequest['response']>(
      `${SCAN_ENDPOINT}/${id}/resolve`,
    );

    return response.data;
  }, []);

  const getScanInventoryItem = useCallback(async (id: string) => {
    const response = await api<GetScanInventoryItemRequest['response']>(
      `${SCAN_ENDPOINT}/${id}`,
    );

    return response.data;
  }, []);

  const submitScanCount = useCallback(
    async ({ id, body }: SubmitScanCountRequest['payload']) => {
      const response = await api<SubmitScanCountRequest['response']>(
        `${SCAN_ENDPOINT}/${id}`,
        { method: 'POST', body },
      );

      return response.data;
    },
    [],
  );

  const scanIdResolveQueryOptions = (id: string) =>
    queryOptions({
      queryKey: scanQueryKeys.resolve(id),
      queryFn: () => resolveScanInventoryItem(id),
      enabled: id.length > 0,
    });

  const scanItemQueryOptions = (id: string) =>
    queryOptions({
      queryKey: scanQueryKeys.item(id),
      queryFn: () => getScanInventoryItem(id),
      enabled: id.length > 0,
    });

  const submitCountMutation = useMutation({
    mutationFn: submitScanCount,
    meta: {
      successMessage: 'Month-end count saved successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_INVENTORY_MONTH_END_COUNTS,
        ReactQueryKeys.GET_INVENTORY_SUBMITTED_MONTH_END_COUNTS,
        ReactQueryKeys.GET_INVENTORY_ITEMS,
        ReactQueryKeys.GET_INVENTORY_ITEM,
        ReactQueryKeys.GET_INVENTORY_ITEM_TRANSACTIONS,
        ReactQueryKeys.GET_SCAN_INVENTORY_ITEM,
      ],
    },
  });

  return {
    resolveScanInventoryItem,
    getScanInventoryItem,
    submitScanCount,
    scanIdResolveQueryOptions,
    scanItemQueryOptions,
    submitCountMutation,
  };
}
