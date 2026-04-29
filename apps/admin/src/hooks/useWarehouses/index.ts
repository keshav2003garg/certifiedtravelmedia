import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  CreateWarehouseRequest,
  DownloadFullTruckLoadRequest,
  ExportWarehousesRequest,
  GetWarehouseRequest,
  ListSectorsRequest,
  ListWarehousesRequest,
  RetireWarehouseRequest,
  UpdateWarehouseRequest,
} from './types';

const WAREHOUSES_ENDPOINT = '/admin/configs/warehouses';

export const warehouseQueryKeys = {
  list: (params?: ListWarehousesRequest['payload']) =>
    [ReactQueryKeys.GET_WAREHOUSES, params] as const,
  detail: (id: string) => [ReactQueryKeys.GET_WAREHOUSE, id] as const,
  sectors: (params?: ListSectorsRequest['payload']) =>
    [ReactQueryKeys.GET_WAREHOUSE_SECTORS, params] as const,
};

export function useWarehouses() {
  const getWarehouses = useCallback(
    async (params?: ListWarehousesRequest['payload']) => {
      const response = await api<ListWarehousesRequest['response']>(
        WAREHOUSES_ENDPOINT,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const getWarehouse = useCallback(async (id: string) => {
    const response = await api<GetWarehouseRequest['response']>(
      `${WAREHOUSES_ENDPOINT}/${id}`,
    );

    return response.data;
  }, []);

  const getSectors = useCallback(
    async (params?: ListSectorsRequest['payload']) => {
      const response = await api<ListSectorsRequest['response']>(
        `${WAREHOUSES_ENDPOINT}/sectors`,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const createWarehouse = useCallback(
    async (payload: CreateWarehouseRequest['payload']) => {
      const response = await api<CreateWarehouseRequest['response']>(
        WAREHOUSES_ENDPOINT,
        { method: 'POST', body: payload },
      );

      return response.data;
    },
    [],
  );

  const updateWarehouse = useCallback(
    async ({ id, body }: UpdateWarehouseRequest['payload']) => {
      const response = await api<UpdateWarehouseRequest['response']>(
        `${WAREHOUSES_ENDPOINT}/${id}`,
        { method: 'PATCH', body },
      );

      return response.data;
    },
    [],
  );

  const retireWarehouse = useCallback(
    async (id: RetireWarehouseRequest['payload']) => {
      const response = await api<RetireWarehouseRequest['response']>(
        `${WAREHOUSES_ENDPOINT}/${id}/retire`,
        { method: 'PATCH' },
      );

      return response.data;
    },
    [],
  );

  const exportWarehouses = useCallback(
    async (params?: ExportWarehousesRequest['payload']) => {
      const blob = await api<Blob, 'blob'>(`${WAREHOUSES_ENDPOINT}/export`, {
        query: {
          includeInactive: params?.includeInactive || undefined,
        },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      try {
        link.href = url;
        link.download = 'warehouses.csv';
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [],
  );

  const downloadFullTruckLoad = useCallback(
    async ({
      id,
      month,
      warehouseName,
      year,
    }: DownloadFullTruckLoadRequest['payload']) => {
      if ((month === undefined) !== (year === undefined)) {
        throw new Error('Month and year are required together');
      }

      const response = await api.raw<Blob, 'blob'>(
        `${WAREHOUSES_ENDPOINT}/${id}/full-truck-load`,
        {
          query: { month, year },
          responseType: 'blob',
        },
      );
      const blob = response._data;
      const contentType =
        response.headers.get('content-type') ?? blob?.type ?? '';

      if (!blob || !contentType.includes('application/pdf')) {
        let message = 'Full truck load could not be downloaded';

        if (blob && contentType.includes('application/json')) {
          try {
            const payload = JSON.parse(await blob.text()) as unknown;

            if (
              typeof payload === 'object' &&
              payload !== null &&
              'message' in payload &&
              typeof payload.message === 'string'
            ) {
              message = payload.message;
            }
          } catch {
            message = 'Full truck load could not be downloaded';
          }
        }

        throw new Error(message);
      }

      const safeWarehouseName =
        warehouseName
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9-_]/g, '_') || 'warehouse';
      const period = `${month}-${year}`;
      const fileName = `full-truck-load-${safeWarehouseName}-${period}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      try {
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [],
  );

  const exportWarehousesMutation = useMutation({
    mutationFn: exportWarehouses,
  });

  const downloadFullTruckLoadMutation = useMutation({
    mutationFn: downloadFullTruckLoad,
  });

  const warehousesQueryOptions = (params?: ListWarehousesRequest['payload']) =>
    queryOptions({
      queryKey: warehouseQueryKeys.list(params),
      queryFn: () => getWarehouses(params),
    });

  const warehouseQueryOptions = (id: string) =>
    queryOptions({
      queryKey: warehouseQueryKeys.detail(id),
      queryFn: () => getWarehouse(id),
      enabled: id.length > 0,
    });

  const sectorsQueryOptions = (params?: ListSectorsRequest['payload']) =>
    queryOptions({
      queryKey: warehouseQueryKeys.sectors(params),
      queryFn: () => getSectors(params),
    });

  const createMutation = useMutation({
    mutationFn: createWarehouse,
    meta: {
      successMessage: 'Warehouse created successfully',
      invalidateQueries: [ReactQueryKeys.GET_WAREHOUSES],
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateWarehouse,
    meta: {
      successMessage: 'Warehouse updated successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_WAREHOUSES,
        ReactQueryKeys.GET_WAREHOUSE,
      ],
    },
  });

  const retireMutation = useMutation({
    mutationFn: retireWarehouse,
    meta: {
      successMessage: 'Warehouse retired successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_WAREHOUSES,
        ReactQueryKeys.GET_WAREHOUSE,
      ],
    },
  });

  return {
    getWarehouses,
    getWarehouse,
    getSectors,
    exportWarehouses,
    downloadFullTruckLoad,
    warehousesQueryOptions,
    warehouseQueryOptions,
    sectorsQueryOptions,
    exportWarehousesMutation,
    downloadFullTruckLoadMutation,
    createMutation,
    updateMutation,
    retireMutation,
  };
}
