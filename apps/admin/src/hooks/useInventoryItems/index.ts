import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  CreateInventoryIntakeRequest,
  CreateInventoryItemTransactionRequest,
  GetInventoryItemRequest,
  ListInventoryItemsRequest,
  ListInventoryItemTransactionsRequest,
} from './types';

const INVENTORY_ITEMS_ENDPOINT = '/admin/inventory/items';

export const inventoryItemsQueryKeys = {
  list: (params?: ListInventoryItemsRequest['payload']) =>
    [ReactQueryKeys.GET_INVENTORY_ITEMS, params] as const,
  detail: (id: string) => [ReactQueryKeys.GET_INVENTORY_ITEM, id] as const,
  transactions: (
    id: string,
    params?: ListInventoryItemTransactionsRequest['payload'],
  ) => [ReactQueryKeys.GET_INVENTORY_ITEM_TRANSACTIONS, id, params] as const,
};

export function useInventoryItems() {
  const getInventoryItems = useCallback(
    async (params?: ListInventoryItemsRequest['payload']) => {
      const response = await api<ListInventoryItemsRequest['response']>(
        INVENTORY_ITEMS_ENDPOINT,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const createInventoryIntake = useCallback(
    async (payload: CreateInventoryIntakeRequest['payload']) => {
      const response = await api<CreateInventoryIntakeRequest['response']>(
        `${INVENTORY_ITEMS_ENDPOINT}/intake`,
        { method: 'POST', body: payload },
      );

      return response.data;
    },
    [],
  );

  const createInventoryItemTransaction = useCallback(
    async ({ id, body }: CreateInventoryItemTransactionRequest['payload']) => {
      const response = await api<
        CreateInventoryItemTransactionRequest['response']
      >(`${INVENTORY_ITEMS_ENDPOINT}/${id}/transactions`, {
        method: 'POST',
        body,
      });

      return response.data;
    },
    [],
  );

  const getInventoryItem = useCallback(async (id: string) => {
    const response = await api<GetInventoryItemRequest['response']>(
      `${INVENTORY_ITEMS_ENDPOINT}/${id}`,
    );

    return response.data;
  }, []);

  const getInventoryItemTransactions = useCallback(
    async (
      id: string,
      params?: ListInventoryItemTransactionsRequest['payload'],
    ) => {
      const response = await api<
        ListInventoryItemTransactionsRequest['response']
      >(`${INVENTORY_ITEMS_ENDPOINT}/${id}/transactions`, { query: params });

      return response.data;
    },
    [],
  );

  const inventoryItemsQueryOptions = (
    params?: ListInventoryItemsRequest['payload'],
  ) =>
    queryOptions({
      queryKey: inventoryItemsQueryKeys.list(params),
      queryFn: () => getInventoryItems(params),
    });

  const inventoryItemQueryOptions = (id: string) =>
    queryOptions({
      queryKey: inventoryItemsQueryKeys.detail(id),
      queryFn: () => getInventoryItem(id),
      enabled: id.length > 0,
    });

  const inventoryItemTransactionsQueryOptions = (
    id: string,
    params?: ListInventoryItemTransactionsRequest['payload'],
  ) =>
    queryOptions({
      queryKey: inventoryItemsQueryKeys.transactions(id, params),
      queryFn: () => getInventoryItemTransactions(id, params),
      enabled: id.length > 0,
    });

  const createIntakeMutation = useMutation({
    mutationFn: createInventoryIntake,
    meta: {
      successMessage: 'Inventory updated successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_INVENTORY_ITEMS,
        ReactQueryKeys.GET_INVENTORY_ITEM,
        ReactQueryKeys.GET_INVENTORY_ITEM_TRANSACTIONS,
      ],
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: createInventoryItemTransaction,
    meta: {
      successMessage: 'Inventory transaction created successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_INVENTORY_ITEMS,
        ReactQueryKeys.GET_INVENTORY_ITEM,
        ReactQueryKeys.GET_INVENTORY_ITEM_TRANSACTIONS,
        ReactQueryKeys.GET_INVENTORY_MONTH_END_COUNTS,
      ],
    },
  });

  return {
    getInventoryItem,
    getInventoryItemTransactions,
    inventoryItemsQueryOptions,
    inventoryItemQueryOptions,
    inventoryItemTransactionsQueryOptions,
    createIntakeMutation,
    createTransactionMutation,
  };
}
