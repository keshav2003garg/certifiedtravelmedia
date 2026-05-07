import { env } from '@repo/env/client';

import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  CloneChartRequest,
  CompleteChartRequest,
  CreateCustomFillerRequest,
  DeleteTileRequest,
  ExportPocketsSoldCsvRequest,
  GetSectorChartRequest,
  InitializeSectorChartRequest,
  ListCustomFillersRequest,
  ListSectorStandSizesRequest,
  OpenSectorChartsPdfRequest,
  SaveChartRequest,
  TilePayload,
  UpsertTileRequest,
} from './types';

const CHARTS_ENDPOINT = '/admin/charts';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function cleanDownloadQuery<T extends Record<string, unknown>>(params: T) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

  return Object.keys(query).length > 0 ? query : undefined;
}

function normalizeTile(tile: TilePayload): TilePayload {
  return {
    ...(tile.id && UUID_REGEX.test(tile.id) ? { id: tile.id } : {}),
    col: tile.col,
    row: tile.row,
    colSpan: tile.colSpan ?? 1,
    tileType: tile.tileType,
    inventoryItemId: tile.inventoryItemId ?? null,
    contractId: tile.contractId ?? null,
    customFillerId: tile.customFillerId ?? null,
    brochureTypeId: tile.brochureTypeId ?? null,
    label: tile.label ?? null,
    coverPhotoUrl: tile.coverPhotoUrl ?? null,
    isNew: tile.isNew ?? false,
    isFlagged: tile.isFlagged ?? false,
    flagNote: tile.flagNote ?? null,
  };
}

export function useChartEditor() {
  const openPdfUrl = useCallback(async (url: string) => {
    if (typeof window === 'undefined') {
      throw new Error('Chart PDFs can only be opened in the browser');
    }

    const pdfWindow = window.open(url, '_blank');

    if (!pdfWindow) {
      throw new Error('Allow pop-ups to open the chart PDF');
    }

    pdfWindow.opener = null;
  }, []);

  const listSectorStandSizes = useCallback(
    async (params?: ListSectorStandSizesRequest['payload']) => {
      const response = await api<ListSectorStandSizesRequest['response']>(
        `${CHARTS_ENDPOINT}/sectors`,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const getSectorChart = useCallback(
    async ({ sectorId, ...query }: GetSectorChartRequest['payload']) => {
      const response = await api<GetSectorChartRequest['response']>(
        `${CHARTS_ENDPOINT}/sectors/${sectorId}`,
        { query },
      );

      return response.data;
    },
    [],
  );

  const getSectorChartsPdfUrl = useCallback(
    (params: OpenSectorChartsPdfRequest['payload']) => {
      const url = new URL(
        `${env.VITE_API_URL}/api${CHARTS_ENDPOINT}/sectors/${encodeURIComponent(params.sectorId)}/pdf`,
      );

      url.searchParams.set('width', String(params.width));
      url.searchParams.set('height', String(params.height));
      url.searchParams.set('month', String(params.month));
      url.searchParams.set('year', String(params.year));

      return url.toString();
    },
    [],
  );

  const openSectorChartsPdf = useCallback(
    async (params: OpenSectorChartsPdfRequest['payload']) => {
      await openPdfUrl(getSectorChartsPdfUrl(params));
    },
    [getSectorChartsPdfUrl, openPdfUrl],
  );

  const exportPocketsSoldCsv = useCallback(
    async (params: ExportPocketsSoldCsvRequest['payload']) => {
      const response = await api.raw<Blob, 'blob'>(
        `${CHARTS_ENDPOINT}/pockets-sold-report`,
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
          await getBlobErrorMessage(blob, 'Chart CSV could not be downloaded'),
        );
      }

      downloadBlob(
        blob,
        getDownloadFilename(
          response.headers.get('content-disposition'),
          `chart-pockets-sold-${params.year}.csv`,
        ),
      );
    },
    [],
  );

  const saveChart = useCallback(
    async (payload: SaveChartRequest['payload']) => {
      const response = await api<SaveChartRequest['response']>(
        `${CHARTS_ENDPOINT}/${payload.id}`,
        {
          method: 'PUT',
          body: {
            tiles: payload.tiles.map(normalizeTile),
            generalNotes: payload.generalNotes ?? null,
          },
        },
      );

      return response.data;
    },
    [],
  );

  const upsertTile = useCallback(
    async ({ chartId, tile }: UpsertTileRequest['payload']) => {
      const response = await api<UpsertTileRequest['response']>(
        `${CHARTS_ENDPOINT}/${chartId}/tile`,
        { method: 'POST', body: normalizeTile(tile) },
      );

      return response.data;
    },
    [],
  );

  const deleteTile = useCallback(
    async ({ chartId, tileId }: DeleteTileRequest['payload']) => {
      const response = await api<DeleteTileRequest['response']>(
        `${CHARTS_ENDPOINT}/${chartId}/tile/${tileId}`,
        { method: 'DELETE' },
      );

      return response.data;
    },
    [],
  );

  const completeChart = useCallback(
    async ({ id }: CompleteChartRequest['payload']) => {
      const response = await api<CompleteChartRequest['response']>(
        `${CHARTS_ENDPOINT}/${id}/complete`,
        { method: 'POST' },
      );

      return response.data;
    },
    [],
  );

  const cloneChart = useCallback(
    async (payload: CloneChartRequest['payload']) => {
      const response = await api<CloneChartRequest['response']>(
        `${CHARTS_ENDPOINT}/${payload.id}/clone`,
        { method: 'POST', body: { force: payload.force ?? false } },
      );

      return response.data;
    },
    [],
  );

  const initializeSectorChart = useCallback(
    async ({ sectorId, ...body }: InitializeSectorChartRequest['payload']) => {
      const response = await api<InitializeSectorChartRequest['response']>(
        `${CHARTS_ENDPOINT}/sectors/${sectorId}/initialize`,
        { method: 'POST', body },
      );

      return response.data;
    },
    [],
  );

  const listCustomFillers = useCallback(
    async (params?: ListCustomFillersRequest['payload']) => {
      const response = await api<ListCustomFillersRequest['response']>(
        `${CHARTS_ENDPOINT}/custom-fillers`,
        { query: params },
      );

      return response.data;
    },
    [],
  );

  const createCustomFiller = useCallback(
    async (payload: CreateCustomFillerRequest['payload']) => {
      const response = await api<CreateCustomFillerRequest['response']>(
        `${CHARTS_ENDPOINT}/custom-fillers`,
        { method: 'POST', body: payload },
      );

      return response.data;
    },
    [],
  );

  const sectorStandSizesQueryOptions = (
    params?: ListSectorStandSizesRequest['payload'],
  ) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_CHART_SECTORS, params],
      queryFn: () => listSectorStandSizes(params),
    });

  const sectorChartQueryOptions = (payload: GetSectorChartRequest['payload']) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_SECTOR_CHART, payload],
      queryFn: () => getSectorChart(payload),
      enabled:
        payload.sectorId.length > 0 &&
        payload.width > 0 &&
        payload.height > 0 &&
        payload.month >= 1 &&
        payload.month <= 12 &&
        payload.year >= 2020,
    });

  const customFillersQueryOptions = (
    params?: ListCustomFillersRequest['payload'],
  ) =>
    queryOptions({
      queryKey: [ReactQueryKeys.GET_CHART_CUSTOM_FILLERS, params],
      queryFn: () => listCustomFillers(params),
    });

  const saveChartMutation = useMutation({
    mutationFn: saveChart,
    meta: {
      successMessage: 'Chart saved successfully',
      invalidateQueries: [
        ReactQueryKeys.GET_CHART_SECTORS,
        ReactQueryKeys.GET_SECTOR_CHART,
      ],
    },
  });

  const upsertTileMutation = useMutation({
    mutationFn: upsertTile,
    meta: {
      successMessage: 'Tile saved successfully',
      invalidateQueries: [ReactQueryKeys.GET_SECTOR_CHART],
    },
  });

  const deleteTileMutation = useMutation({
    mutationFn: deleteTile,
    meta: {
      successMessage: 'Tile removed successfully',
      invalidateQueries: [ReactQueryKeys.GET_SECTOR_CHART],
    },
  });

  const completeChartMutation = useMutation({
    mutationFn: completeChart,
    meta: {
      successMessage: 'Chart completed and locked',
      invalidateQueries: [
        ReactQueryKeys.GET_CHART_SECTORS,
        ReactQueryKeys.GET_SECTOR_CHART,
      ],
    },
  });

  const cloneChartMutation = useMutation({
    mutationFn: cloneChart,
    meta: {
      successMessage: 'Chart cloned to next month',
      invalidateQueries: [
        ReactQueryKeys.GET_CHART_SECTORS,
        ReactQueryKeys.GET_SECTOR_CHART,
      ],
    },
  });

  const initializeSectorChartMutation = useMutation({
    mutationFn: initializeSectorChart,
    meta: {
      successMessage: 'Sector chart initialized',
      invalidateQueries: [
        ReactQueryKeys.GET_CHART_SECTORS,
        ReactQueryKeys.GET_SECTOR_CHART,
      ],
    },
  });

  const createCustomFillerMutation = useMutation({
    mutationFn: createCustomFiller,
    meta: {
      successMessage: 'Custom filler created',
      invalidateQueries: [
        ReactQueryKeys.GET_CHART_CUSTOM_FILLERS,
        ReactQueryKeys.GET_SECTOR_CHART,
      ],
    },
  });

  const openSectorChartsPdfMutation = useMutation({
    mutationFn: openSectorChartsPdf,
    meta: {
      errorMessage: 'Chart PDF could not be opened',
      errorDescription: 'Allow pop-ups for this site and try again.',
    },
  });

  const exportPocketsSoldCsvMutation = useMutation({
    mutationFn: exportPocketsSoldCsv,
    meta: {
      errorMessage: 'Chart CSV could not be downloaded',
    },
  });

  return {
    getSectorChartsPdfUrl,
    sectorStandSizesQueryOptions,
    sectorChartQueryOptions,
    customFillersQueryOptions,
    saveChartMutation,
    upsertTileMutation,
    deleteTileMutation,
    completeChartMutation,
    cloneChartMutation,
    initializeSectorChartMutation,
    createCustomFillerMutation,
    openSectorChartsPdfMutation,
    exportPocketsSoldCsvMutation,
  };
}
