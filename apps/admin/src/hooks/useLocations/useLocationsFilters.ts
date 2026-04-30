import { useCallback, useMemo } from 'react';

import {
  parseAsBoolean,
  parseAsInteger,
  parseAsStringLiteral,
  useQueryState,
} from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

import type { LocationSortBy, SortOrder } from './types';

export const LOCATION_SORT_OPTIONS = [
  'name',
  'locationId',
  'city',
  'state',
  'pocketSize',
] as const satisfies readonly LocationSortBy[];

export const SORT_ORDER_OPTIONS = [
  'asc',
  'desc',
] as const satisfies readonly SortOrder[];

const LOCATION_VIEW_OPTIONS = ['sector', 'list'] as const;
type LocationView = (typeof LOCATION_VIEW_OPTIONS)[number];

export function useLocationsFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch: setSearchValue,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(LOCATION_SORT_OPTIONS),
  );
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(SORT_ORDER_OPTIONS),
  );
  const [viewParam, setViewParam] = useQueryState(
    'tab',
    parseAsStringLiteral(LOCATION_VIEW_OPTIONS),
  );
  const [sectorId, setSectorId] = useQueryState('sectorId');
  const [width, setWidth] = useQueryState('width', parseAsInteger);
  const [height, setHeight] = useQueryState('height', parseAsInteger);
  const [isDefaultPockets, setIsDefaultPockets] = useQueryState(
    'isDefaultPockets',
    parseAsBoolean,
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      handlePageChange(1);
    },
    [setSearchValue, handlePageChange],
  );

  const handleSortByChange = useCallback(
    (value: LocationSortBy | null) => {
      setSortBy(value);
      handlePageChange(1);
    },
    [setSortBy, handlePageChange],
  );

  const handleOrderChange = useCallback(
    (value: SortOrder | null) => {
      setOrder(value);
      handlePageChange(1);
    },
    [setOrder, handlePageChange],
  );

  const handleViewChange = useCallback(
    (value: LocationView) => {
      setViewParam(value);
      handlePageChange(1);
    },
    [setViewParam, handlePageChange],
  );

  const handleSectorChange = useCallback(
    (value: string | null) => {
      setSectorId(value);
      handlePageChange(1);
    },
    [setSectorId, handlePageChange],
  );

  const handleWidthChange = useCallback(
    (value: number | null) => {
      setWidth(value);
      handlePageChange(1);
    },
    [setWidth, handlePageChange],
  );

  const handleHeightChange = useCallback(
    (value: number | null) => {
      setHeight(value);
      handlePageChange(1);
    },
    [setHeight, handlePageChange],
  );

  const handleDefaultPocketsChange = useCallback(
    (value: boolean | null) => {
      setIsDefaultPockets(value);
      handlePageChange(1);
    },
    [setIsDefaultPockets, handlePageChange],
  );

  const clearFilters = useCallback(() => {
    setSearchValue('');
    setSortBy(null);
    setOrder(null);
    setSectorId(null);
    setWidth(null);
    setHeight(null);
    setIsDefaultPockets(null);
    handlePageChange(1);
  }, [
    setSearchValue,
    setSortBy,
    setOrder,
    setSectorId,
    setWidth,
    setHeight,
    setIsDefaultPockets,
    handlePageChange,
  ]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        search ||
        sortBy ||
        order ||
        sectorId ||
        width !== null ||
        height !== null ||
        isDefaultPockets !== null,
      ),
    [search, sortBy, order, sectorId, width, height, isDefaultPockets],
  );

  const params = useMemo(
    () => ({
      search: search || undefined,
      sortBy: sortBy ?? undefined,
      order: order ?? undefined,
      sectorId: sectorId || undefined,
      width: width ?? undefined,
      height: height ?? undefined,
      isDefaultPockets: isDefaultPockets ?? undefined,
      page,
      limit,
    }),
    [
      search,
      sortBy,
      order,
      sectorId,
      width,
      height,
      isDefaultPockets,
      page,
      limit,
    ],
  );

  return {
    search,
    searchInputValue,
    sortBy,
    order,
    view: viewParam ?? 'sector',
    sectorId,
    width,
    height,
    isDefaultPockets,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleViewChange,
    handleSectorChange,
    handleWidthChange,
    handleHeightChange,
    handleDefaultPocketsChange,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    clearFilters,
    hasActiveFilters,
    params,
  };
}
