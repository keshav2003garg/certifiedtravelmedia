import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import type { CreateInventoryIntakeRequest } from './types';

const INVENTORY_ITEMS_ENDPOINT = '/admin/inventory/items';

export function useInventoryItems() {
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

  const createIntakeMutation = useMutation({
    mutationFn: createInventoryIntake,
    meta: {
      successMessage: 'Inventory updated successfully',
    },
  });

  return {
    createIntakeMutation,
  };
}
