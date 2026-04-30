import { useCallback } from 'react';

import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  GetLocationRequest,
  GetLocationsBySectorRequest,
  GetLocationsRequest,
  GetLocationStatsRequest,
} from './types';

const LOCATIONS_ENDPOINT = '/admin/locations';

export const locationQueryKeys = {
  stats: () => [ReactQueryKeys.GET_LOCATION_STATS] as const,
  list: (params?: GetLocationsRequest['payload']) =>
    [ReactQueryKeys.GET_LOCATIONS, params] as const,
  bySector: (params?: GetLocationsBySectorRequest['payload']) =>
    [ReactQueryKeys.GET_LOCATIONS_BY_SECTOR, params] as const,
  detail: (id: string) => [ReactQueryKeys.GET_LOCATION, id] as const,
};

export function useLocations() {
  const getStats = useCallback(async () => {
    const response = await api<GetLocationStatsRequest['response']>(
      `${LOCATIONS_ENDPOINT}/stats`,
    );

    return response.data;
  }, []);

  const getLocations = useCallback(
    async (params?: GetLocationsRequest['payload']) => {
      const response = await api<GetLocationsRequest['response']>(
        LOCATIONS_ENDPOINT,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const getLocationsBySector = useCallback(
    async (params?: GetLocationsBySectorRequest['payload']) => {
      const response = await api<GetLocationsBySectorRequest['response']>(
        `${LOCATIONS_ENDPOINT}/by-sector`,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const getLocation = useCallback(
    async (id: GetLocationRequest['payload']['id']) => {
      const response = await api<GetLocationRequest['response']>(
        `${LOCATIONS_ENDPOINT}/${id}`,
      );

      return response.data;
    },
    [],
  );

  const statsQueryOptions = () =>
    queryOptions({
      queryKey: locationQueryKeys.stats(),
      queryFn: getStats,
    });

  const locationsQueryOptions = (params?: GetLocationsRequest['payload']) =>
    queryOptions({
      queryKey: locationQueryKeys.list(params),
      queryFn: () => getLocations(params),
    });

  const locationsBySectorQueryOptions = (
    params?: GetLocationsBySectorRequest['payload'],
  ) =>
    queryOptions({
      queryKey: locationQueryKeys.bySector(params),
      queryFn: () => getLocationsBySector(params),
    });

  const locationQueryOptions = (id: string) =>
    queryOptions({
      queryKey: locationQueryKeys.detail(id),
      queryFn: () => getLocation(id),
      enabled: id.length > 0,
    });

  return {
    statsQueryOptions,
    locationsQueryOptions,
    locationsBySectorQueryOptions,
    locationQueryOptions,
  };
}
