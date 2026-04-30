import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import type { CreateInventoryRequestRequest } from './types';

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

  const createMutation = useMutation({
    mutationFn: createInventoryRequest,
    meta: {
      successMessage: 'Inventory request submitted successfully',
    },
  });

  return {
    createMutation,
  };
}
