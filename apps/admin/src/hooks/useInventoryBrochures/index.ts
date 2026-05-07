import { useCallback } from 'react';

import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type { GetBrochureRequest, ListBrochuresRequest } from './types';

const INVENTORY_BROCHURES_ENDPOINT = '/admin/inventory/brochures';

export const inventoryBrochureQueryKeys = {
  list: (params?: ListBrochuresRequest['payload']) =>
    [ReactQueryKeys.GET_INVENTORY_BROCHURES, params] as const,
  detail: (id: string) => [ReactQueryKeys.GET_INVENTORY_BROCHURE, id] as const,
};

export function useInventoryBrochures() {
  const getBrochures = useCallback(
    async (params?: ListBrochuresRequest['payload']) => {
      const response = await api<ListBrochuresRequest['response']>(
        INVENTORY_BROCHURES_ENDPOINT,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const getBrochure = useCallback(async (id: string) => {
    const response = await api<GetBrochureRequest['response']>(
      INVENTORY_BROCHURES_ENDPOINT,
      { query: { id } },
    );

    return response.data;
  }, []);

  const brochuresQueryOptions = (params?: ListBrochuresRequest['payload']) =>
    queryOptions({
      queryKey: inventoryBrochureQueryKeys.list(params),
      queryFn: () => getBrochures(params),
    });

  const brochureQueryOptions = (id: string) =>
    queryOptions({
      queryKey: inventoryBrochureQueryKeys.detail(id),
      queryFn: () => getBrochure(id),
      enabled: id.length > 0,
    });

  return {
    getBrochures,
    getBrochure,
    brochuresQueryOptions,
    brochureQueryOptions,
  };
}
