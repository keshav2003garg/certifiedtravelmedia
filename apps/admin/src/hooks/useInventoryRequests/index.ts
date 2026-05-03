import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  ApproveInventoryRequestRequest,
  CreateInventoryRequestRequest,
  GetInventoryRequestRequest,
  GetInventoryRequestStatsRequest,
  ListInventoryRequestsRequest,
  RejectInventoryRequestRequest,
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

  const getInventoryRequestById = useCallback(async (id: string) => {
    const response = await api<GetInventoryRequestRequest['response']>(
      `${INVENTORY_REQUESTS_ENDPOINT}/${id}`,
    );

    return response.data;
  }, []);

  const inventoryRequestQueryOptions = (id: string) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_INVENTORY_REQUEST, id],
      queryFn: () => getInventoryRequestById(id),
      enabled: id.length > 0,
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

  const approveInventoryRequest = useCallback(
    async ({
      id,
      payload,
    }: {
      id: string;
      payload: ApproveInventoryRequestRequest['payload'];
    }) => {
      const response = await api<ApproveInventoryRequestRequest['response']>(
        `${INVENTORY_REQUESTS_ENDPOINT}/${id}/approve`,
        { method: 'POST', body: payload },
      );

      return response.data;
    },
    [],
  );

  const approveMutation = useMutation({
    mutationFn: approveInventoryRequest,
    meta: {
      successMessage: 'Inventory request approved',
      invalidateQueries: [
        ReactQueryKeys.GET_INVENTORY_REQUESTS,
        ReactQueryKeys.GET_INVENTORY_REQUEST,
        ReactQueryKeys.GET_INVENTORY_REQUEST_STATS,
      ],
    },
  });

  const rejectInventoryRequest = useCallback(
    async ({
      id,
      payload,
    }: {
      id: string;
      payload: RejectInventoryRequestRequest['payload'];
    }) => {
      const response = await api<RejectInventoryRequestRequest['response']>(
        `${INVENTORY_REQUESTS_ENDPOINT}/${id}/reject`,
        { method: 'POST', body: payload },
      );

      return response.data;
    },
    [],
  );

  const rejectMutation = useMutation({
    mutationFn: rejectInventoryRequest,
    meta: {
      successMessage: 'Inventory request rejected',
      invalidateQueries: [
        ReactQueryKeys.GET_INVENTORY_REQUESTS,
        ReactQueryKeys.GET_INVENTORY_REQUEST,
        ReactQueryKeys.GET_INVENTORY_REQUEST_STATS,
      ],
    },
  });

  return {
    getInventoryRequests,
    getInventoryRequestStats,
    getInventoryRequestById,
    inventoryRequestsQueryOptions,
    inventoryRequestStatsQueryOptions,
    inventoryRequestQueryOptions,
    createMutation,
    approveMutation,
    rejectMutation,
  };
}
