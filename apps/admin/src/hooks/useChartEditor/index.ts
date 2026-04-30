import { useCallback } from 'react';

import { queryOptions, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api/instances';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type {
  CloneChartRequest,
  CompleteChartRequest,
  DeleteTileRequest,
  GetSectorChartRequest,
  InitializeSectorChartRequest,
  ListSectorStandSizesRequest,
  SaveChartRequest,
  TilePayload,
  UpsertTileRequest,
} from './types';

const CHARTS_ENDPOINT = '/admin/charts';
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeTile(tile: TilePayload): TilePayload {
  return {
    ...(tile.id && UUID_REGEX.test(tile.id) ? { id: tile.id } : {}),
    col: tile.col,
    row: tile.row,
    colSpan: tile.colSpan ?? 1,
    tileType: tile.tileType,
    inventoryItemId: tile.inventoryItemId ?? null,
    contractId: tile.contractId ?? null,
    brochureTypeId: tile.brochureTypeId ?? null,
    label: tile.label ?? null,
    coverPhotoUrl: tile.coverPhotoUrl ?? null,
    isNew: tile.isNew ?? false,
    isFlagged: tile.isFlagged ?? false,
    flagNote: tile.flagNote ?? null,
  };
}

export function useChartEditor() {
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

  return {
    sectorStandSizesQueryOptions,
    sectorChartQueryOptions,
    saveChartMutation,
    upsertTileMutation,
    deleteTileMutation,
    completeChartMutation,
    cloneChartMutation,
    initializeSectorChartMutation,
  };
}
