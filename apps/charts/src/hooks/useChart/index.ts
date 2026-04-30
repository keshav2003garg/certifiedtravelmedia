import { env } from '@repo/env/client';

import { useCallback } from 'react';

import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type { GetChartRequest } from './types';

const CHARTS_ENDPOINT = '/charts';

export const chartQueryKeys = {
  detail: (params: GetChartRequest['payload']) =>
    [ReactQueryKeys.GET_CHART, params] as const,
};

export function useChart() {
  const getChart = useCallback(async (params: GetChartRequest['payload']) => {
    const { locationId, ...query } = params;
    const response = await api<GetChartRequest['response']>(
      `${CHARTS_ENDPOINT}/${locationId}`,
      { query },
    );

    return response.data;
  }, []);

  const chartQueryOptions = (params: GetChartRequest['payload']) =>
    queryOptions({
      queryKey: chartQueryKeys.detail(params),
      queryFn: () => getChart(params),
      enabled: params.locationId.length > 0,
    });

  const getChartPDFUrl = useCallback((params: GetChartRequest['payload']) => {
    const { locationId, month, year } = params;
    const url = new URL(
      `${env.VITE_API_URL}/api${CHARTS_ENDPOINT}/${locationId}/pdf`,
    );
    if (month !== undefined) url.searchParams.set('month', String(month));
    if (year !== undefined) url.searchParams.set('year', String(year));
    return url.toString();
  }, []);

  return {
    chartQueryOptions,
    getChartPDFUrl,
  };
}
