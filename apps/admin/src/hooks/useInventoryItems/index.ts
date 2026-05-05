import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  CreateInventoryIntakeRequest,
  CreateInventoryItemTransactionRequest,
  DownloadInventoryBulkQrLabelsRequest,
  ExportInventoryItemsRequest,
  GetInventoryItemRequest,
  ListInventoryItemsRequest,
  ListInventoryItemTransactionsRequest,
} from './types';

const INVENTORY_ITEMS_ENDPOINT = '/admin/inventory/items';

function getDownloadFilename(
  contentDisposition: string | null,
  fallback: string,
) {
  if (!contentDisposition) return fallback;

  const filenameMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return filenameMatch?.[1] ? decodeURIComponent(filenameMatch[1]) : fallback;
}

async function getBlobErrorMessage(blob: Blob | undefined, fallback: string) {
  if (!blob) return fallback;

  try {
    const payload = JSON.parse(await blob.text()) as unknown;

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
    ) {
      return payload.message;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cleanDownloadQuery<T extends Record<string, unknown>>(params?: T) {
  if (!params) return undefined;

  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

  return Object.keys(query).length > 0 ? query : undefined;
}

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

  const downloadBulkQrLabels = useCallback(
    async (params?: DownloadInventoryBulkQrLabelsRequest['payload']) => {
      const response = await api.raw<Blob, 'blob'>(
        `${INVENTORY_ITEMS_ENDPOINT}/bulk-qr-labels`,
        {
          query: cleanDownloadQuery(params),
          responseType: 'blob',
        },
      );
      const blob = response._data;
      const contentType =
        response.headers.get('content-type') ?? blob?.type ?? '';

      if (!blob || !contentType.includes('application/pdf')) {
        throw new Error(
          await getBlobErrorMessage(
            blob,
            'Bulk QR labels could not be downloaded',
          ),
        );
      }

      downloadBlob(
        blob,
        getDownloadFilename(
          response.headers.get('content-disposition'),
          'inventory-bulk-qr-labels.pdf',
        ),
      );
    },
    [],
  );

  const exportInventoryItems = useCallback(
    async (params?: ExportInventoryItemsRequest['payload']) => {
      const response = await api.raw<Blob, 'blob'>(
        `${INVENTORY_ITEMS_ENDPOINT}/export`,
        {
          query: cleanDownloadQuery(params),
          responseType: 'blob',
        },
      );
      const blob = response._data;
      const contentType =
        response.headers.get('content-type') ?? blob?.type ?? '';

      if (!blob || !contentType.includes('text/csv')) {
        throw new Error(
          await getBlobErrorMessage(
            blob,
            'Inventory export could not be downloaded',
          ),
        );
      }

      downloadBlob(
        blob,
        getDownloadFilename(
          response.headers.get('content-disposition'),
          'inventory-items-export.csv',
        ),
      );
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

  const downloadBulkQrLabelsMutation = useMutation({
    mutationFn: downloadBulkQrLabels,
  });

  const exportInventoryItemsMutation = useMutation({
    mutationFn: exportInventoryItems,
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
    downloadBulkQrLabelsMutation,
    exportInventoryItemsMutation,
    createIntakeMutation,
    createTransactionMutation,
  };
}
