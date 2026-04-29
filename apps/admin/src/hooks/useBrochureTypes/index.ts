import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  CreateBrochureTypeRequest,
  DeleteBrochureTypeRequest,
  GetBrochureTypeRequest,
  ListBrochureTypesRequest,
  UpdateBrochureTypeRequest,
} from './types';

const BROCHURE_TYPES_ENDPOINT = '/admin/configs/brochure-types';

export function useBrochureTypes() {
  const getBrochureTypes = useCallback(
    async (params?: ListBrochureTypesRequest['payload']) => {
      const response = await api<ListBrochureTypesRequest['response']>(
        BROCHURE_TYPES_ENDPOINT,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const getBrochureType = useCallback(async (id: string) => {
    const response = await api<GetBrochureTypeRequest['response']>(
      `${BROCHURE_TYPES_ENDPOINT}/${id}`,
    );

    return response.data;
  }, []);

  const createBrochureType = useCallback(
    async (payload: CreateBrochureTypeRequest['payload']) => {
      const response = await api<CreateBrochureTypeRequest['response']>(
        BROCHURE_TYPES_ENDPOINT,
        { method: 'POST', body: payload },
      );

      return response.data;
    },
    [],
  );

  const updateBrochureType = useCallback(
    async ({ id, body }: UpdateBrochureTypeRequest['payload']) => {
      const response = await api<UpdateBrochureTypeRequest['response']>(
        `${BROCHURE_TYPES_ENDPOINT}/${id}`,
        { method: 'PATCH', body },
      );

      return response.data;
    },
    [],
  );

  const deleteBrochureType = useCallback(
    async (id: DeleteBrochureTypeRequest['payload']) => {
      const response = await api<DeleteBrochureTypeRequest['response']>(
        `${BROCHURE_TYPES_ENDPOINT}/${id}`,
        { method: 'DELETE' },
      );

      return response.data;
    },
    [],
  );

  const brochureTypesQueryOptions = (
    params?: ListBrochureTypesRequest['payload'],
  ) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_BROCHURE_TYPES, params],
      queryFn: () => getBrochureTypes(params),
    });

  const brochureTypeQueryOptions = (id: string) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_BROCHURE_TYPE, id],
      queryFn: () => getBrochureType(id),
      enabled: id.length > 0,
    });

  const createMutation = useMutation({
    mutationFn: createBrochureType,
    meta: {
      successMessage: 'Brochure type created successfully',
      invalidateQueries: [ReactQueryKeys.GET_BROCHURE_TYPES],
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBrochureType,
    meta: {
      successMessage: 'Brochure type updated successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_BROCHURE_TYPES,
        ReactQueryKeys.GET_BROCHURE_TYPE,
      ],
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrochureType,
    meta: {
      successMessage: 'Brochure type deleted successfully',
      invalidateQueries: [ReactQueryKeys.GET_BROCHURE_TYPES],
    },
  });

  return {
    getBrochureTypes,
    getBrochureType,
    brochureTypesQueryOptions,
    brochureTypeQueryOptions,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
