import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  CreateCustomerRequest,
  DeleteCustomerRequest,
  GetCustomerRequest,
  ListCustomersRequest,
  UpdateCustomerRequest,
} from './types';

const CUSTOMERS_ENDPOINT = '/admin/configs/customers';

export function useCustomers() {
  const getCustomers = useCallback(
    async (params?: ListCustomersRequest['payload']) => {
      const response = await api<ListCustomersRequest['response']>(
        CUSTOMERS_ENDPOINT,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const getCustomer = useCallback(async (id: string) => {
    const response = await api<GetCustomerRequest['response']>(
      `${CUSTOMERS_ENDPOINT}/${id}`,
    );

    return response.data;
  }, []);

  const createCustomer = useCallback(
    async (payload: CreateCustomerRequest['payload']) => {
      const response = await api<CreateCustomerRequest['response']>(
        CUSTOMERS_ENDPOINT,
        { method: 'POST', body: payload },
      );

      return response.data;
    },
    [],
  );

  const updateCustomer = useCallback(
    async ({ id, body }: UpdateCustomerRequest['payload']) => {
      const response = await api<UpdateCustomerRequest['response']>(
        `${CUSTOMERS_ENDPOINT}/${id}`,
        { method: 'PATCH', body },
      );

      return response.data;
    },
    [],
  );

  const deleteCustomer = useCallback(
    async (id: DeleteCustomerRequest['payload']) => {
      const response = await api<DeleteCustomerRequest['response']>(
        `${CUSTOMERS_ENDPOINT}/${id}`,
        { method: 'DELETE' },
      );

      return response.data;
    },
    [],
  );

  const customersQueryOptions = (params?: ListCustomersRequest['payload']) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_CUSTOMERS, params],
      queryFn: () => getCustomers(params),
    });

  const customerQueryOptions = (id: string) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_CUSTOMER, id],
      queryFn: () => getCustomer(id),
      enabled: id.length > 0,
    });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    meta: {
      successMessage: 'Customer created successfully',
      invalidateQueries: [ReactQueryKeys.GET_CUSTOMERS],
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    meta: {
      successMessage: 'Customer updated successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_CUSTOMERS,
        ReactQueryKeys.GET_CUSTOMER,
      ],
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    meta: {
      successMessage: 'Customer deleted successfully',
      invalidateQueries: [ReactQueryKeys.GET_CUSTOMERS],
    },
  });

  return {
    getCustomers,
    getCustomer,
    customersQueryOptions,
    customerQueryOptions,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
