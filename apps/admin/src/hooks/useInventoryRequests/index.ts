import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  CreateInventoryRequestRequest,
  GetInventoryRequestStatsRequest,
  ListInventoryRequestsRequest,
} from './types';

const INVENTORY_REQUESTS_ENDPOINT = '/admin/inventory/requests';

export function useInventoryRequests() {
  const createInventoryRequest = useCallback(
    async (payload: CreateInventoryRequestRequest['payload']) => {
      const response = await api<CreateInventoryRequestRequest['response']>(
        INVENTORY_REQUESTS_ENDPOINT,
        { method: 'POST', body: payload },
      );

      return response.data;
    },
    [],
  );

  const getInventoryRequests = useCallback(
    async (params?: ListInventoryRequestsRequest['payload']) => {
      const response = await api<ListInventoryRequestsRequest['response']>(
        INVENTORY_REQUESTS_ENDPOINT,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const getInventoryRequestStats = useCallback(async () => {
    const response = await api<GetInventoryRequestStatsRequest['response']>(
      `${INVENTORY_REQUESTS_ENDPOINT}/stats`,
    );

    return response.data;
  }, []);

  const inventoryRequestsQueryOptions = (
    params?: ListInventoryRequestsRequest['payload'],
  ) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_INVENTORY_REQUESTS, params],
      queryFn: () => getInventoryRequests(params),
    });

  const inventoryRequestStatsQueryOptions = () =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_INVENTORY_REQUEST_STATS],
      queryFn: getInventoryRequestStats,
    });

  const createMutation = useMutation({
    mutationFn: createInventoryRequest,
    meta: {
      successMessage: 'Inventory request submitted successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_INVENTORY_REQUESTS,
        ReactQueryKeys.GET_INVENTORY_REQUEST_STATS,
      ],
    },
  });

  return {
    getInventoryRequests,
    getInventoryRequestStats,
    inventoryRequestsQueryOptions,
    inventoryRequestStatsQueryOptions,
    createMutation,
  };
}
