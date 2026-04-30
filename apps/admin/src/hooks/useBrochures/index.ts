import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  CreateBrochureImageRequest,
  CreateBrochureRequest,
  CreateImagePackSizeRequest,
  DeleteBrochureImageRequest,
  DeleteBrochureRequest,
  DeleteImagePackSizeRequest,
  GetBrochureRequest,
  ListBrochuresRequest,
  UpdateBrochureImageRequest,
  UpdateBrochureRequest,
  UpdateImagePackSizeRequest,
} from './types';

const BROCHURES_ENDPOINT = '/admin/configs/brochures';

export const brochureQueryKeys = {
  list: (params?: ListBrochuresRequest['payload']) =>
    [ReactQueryKeys.GET_BROCHURES, params] as const,
  detail: (id: string) => [ReactQueryKeys.GET_BROCHURE, id] as const,
};

export function useBrochures() {
  const getBrochures = useCallback(
    async (params?: ListBrochuresRequest['payload']) => {
      const response = await api<ListBrochuresRequest['response']>(
        BROCHURES_ENDPOINT,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const getBrochure = useCallback(async (id: string) => {
    const response = await api<GetBrochureRequest['response']>(
      `${BROCHURES_ENDPOINT}/${id}`,
    );

    return response.data;
  }, []);

  const createBrochure = useCallback(
    async (payload: CreateBrochureRequest['payload']) => {
      const response = await api<CreateBrochureRequest['response']>(
        BROCHURES_ENDPOINT,
        { method: 'POST', body: payload },
      );

      return response.data;
    },
    [],
  );

  const updateBrochure = useCallback(
    async ({ id, body }: UpdateBrochureRequest['payload']) => {
      const response = await api<UpdateBrochureRequest['response']>(
        `${BROCHURES_ENDPOINT}/${id}`,
        { method: 'PATCH', body },
      );

      return response.data;
    },
    [],
  );

  const deleteBrochure = useCallback(
    async (id: DeleteBrochureRequest['payload']) => {
      const response = await api<DeleteBrochureRequest['response']>(
        `${BROCHURES_ENDPOINT}/${id}`,
        { method: 'DELETE' },
      );

      return response.data;
    },
    [],
  );

  const createImage = useCallback(
    async ({ brochureId, body }: CreateBrochureImageRequest['payload']) => {
      const response = await api<CreateBrochureImageRequest['response']>(
        `${BROCHURES_ENDPOINT}/${brochureId}/images`,
        { method: 'POST', body },
      );

      return response.data;
    },
    [],
  );

  const updateImage = useCallback(
    async ({
      brochureId,
      imageId,
      body,
    }: UpdateBrochureImageRequest['payload']) => {
      const response = await api<UpdateBrochureImageRequest['response']>(
        `${BROCHURES_ENDPOINT}/${brochureId}/images/${imageId}`,
        { method: 'PATCH', body },
      );

      return response.data;
    },
    [],
  );

  const deleteImage = useCallback(
    async ({ brochureId, imageId }: DeleteBrochureImageRequest['payload']) => {
      const response = await api<DeleteBrochureImageRequest['response']>(
        `${BROCHURES_ENDPOINT}/${brochureId}/images/${imageId}`,
        { method: 'DELETE' },
      );

      return response.data;
    },
    [],
  );

  const createImagePackSize = useCallback(
    async ({
      brochureId,
      imageId,
      body,
    }: CreateImagePackSizeRequest['payload']) => {
      const response = await api<CreateImagePackSizeRequest['response']>(
        `${BROCHURES_ENDPOINT}/${brochureId}/images/${imageId}/pack-sizes`,
        { method: 'POST', body },
      );

      return response.data;
    },
    [],
  );

  const updateImagePackSize = useCallback(
    async ({
      brochureId,
      imageId,
      packSizeId,
      body,
    }: UpdateImagePackSizeRequest['payload']) => {
      const response = await api<UpdateImagePackSizeRequest['response']>(
        `${BROCHURES_ENDPOINT}/${brochureId}/images/${imageId}/pack-sizes/${packSizeId}`,
        { method: 'PATCH', body },
      );

      return response.data;
    },
    [],
  );

  const deleteImagePackSize = useCallback(
    async ({
      brochureId,
      imageId,
      packSizeId,
    }: DeleteImagePackSizeRequest['payload']) => {
      const response = await api<DeleteImagePackSizeRequest['response']>(
        `${BROCHURES_ENDPOINT}/${brochureId}/images/${imageId}/pack-sizes/${packSizeId}`,
        { method: 'DELETE' },
      );

      return response.data;
    },
    [],
  );

  const brochuresQueryOptions = (params?: ListBrochuresRequest['payload']) =>
    queryOptions({
      queryKey: brochureQueryKeys.list(params),
      queryFn: () => getBrochures(params),
    });

  const brochureQueryOptions = (id: string) =>
    queryOptions({
      queryKey: brochureQueryKeys.detail(id),
      queryFn: () => getBrochure(id),
      enabled: id.length > 0,
    });

  const createMutation = useMutation({
    mutationFn: createBrochure,
    meta: {
      successMessage: 'Brochure created successfully',
      invalidateQueries: [ReactQueryKeys.GET_BROCHURES],
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBrochure,
    meta: {
      successMessage: 'Brochure updated successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_BROCHURES,
        ReactQueryKeys.GET_BROCHURE,
      ],
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrochure,
    meta: {
      successMessage: 'Brochure deleted successfully',
      invalidateQueries: [ReactQueryKeys.GET_BROCHURES],
    },
  });

  const createImageMutation = useMutation({
    mutationFn: createImage,
    meta: {
      successMessage: 'Brochure image added successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_BROCHURES,
        ReactQueryKeys.GET_BROCHURE,
      ],
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: updateImage,
    meta: {
      successMessage: 'Brochure image updated successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_BROCHURES,
        ReactQueryKeys.GET_BROCHURE,
      ],
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: deleteImage,
    meta: {
      successMessage: 'Brochure image deleted successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_BROCHURES,
        ReactQueryKeys.GET_BROCHURE,
      ],
    },
  });

  const createImagePackSizeMutation = useMutation({
    mutationFn: createImagePackSize,
    meta: {
      successMessage: 'Pack size added successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_BROCHURES,
        ReactQueryKeys.GET_BROCHURE,
      ],
    },
  });

  const updateImagePackSizeMutation = useMutation({
    mutationFn: updateImagePackSize,
    meta: {
      successMessage: 'Pack size updated successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_BROCHURES,
        ReactQueryKeys.GET_BROCHURE,
      ],
    },
  });

  const deleteImagePackSizeMutation = useMutation({
    mutationFn: deleteImagePackSize,
    meta: {
      successMessage: 'Pack size deleted successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_BROCHURES,
        ReactQueryKeys.GET_BROCHURE,
      ],
    },
  });

  return {
    // Fetchers
    getBrochures,

    // Queries Options
    brochuresQueryOptions,
    brochureQueryOptions,

    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
    createImageMutation,
    updateImageMutation,
    deleteImageMutation,
    createImagePackSizeMutation,
    updateImagePackSizeMutation,
    deleteImagePackSizeMutation,
  };
}
