import { useCallback, useMemo } from 'react';

import {
  parseAsBoolean,
  parseAsStringLiteral,
  useQueryState,
} from '@repo/hooks/nuqs';
import { usePagination } from '@repo/hooks/usePagination/index';
import { useSearch } from '@repo/hooks/useSearch/index';

import type { BrochureSortBy, SortOrder } from './types';

export const BROCHURE_SORT_OPTIONS = [
  'name',
  'brochureTypeName',
  'customerName',
  'createdAt',
  'updatedAt',
] as const satisfies readonly BrochureSortBy[];

export const SORT_ORDER_OPTIONS = [
  'asc',
  'desc',
] as const satisfies readonly SortOrder[];

export function useBrochuresFilters() {
  const {
    search,
    inputValue: searchInputValue,
    setSearch,
  } = useSearch('search');
  const { page, limit, handlePageChange, handleLimitChange } = usePagination();

  const [sortBy, setSortBy] = useQueryState(
    'sortBy',
    parseAsStringLiteral(BROCHURE_SORT_OPTIONS),
  );
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(SORT_ORDER_OPTIONS),
  );
  const [hasImages, setHasImages] = useQueryState('hasImages', parseAsBoolean);
  const [hasPackSizes, setHasPackSizes] = useQueryState(
    'hasPackSizes',
    parseAsBoolean,
  );

  const handleSortByChange = useCallback(
    (value: BrochureSortBy | null) => {
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

  const handleHasImagesChange = useCallback(
    (value: boolean | null) => {
      setHasImages(value);
      handlePageChange(1);
    },
    [setHasImages, handlePageChange],
  );

  const handleHasPackSizesChange = useCallback(
    (value: boolean | null) => {
      setHasPackSizes(value);
      handlePageChange(1);
    },
    [setHasPackSizes, handlePageChange],
  );

  const clearFilters = useCallback(() => {
    setSearch('');
    setSortBy(null);
    setOrder(null);
    setHasImages(null);
    setHasPackSizes(null);
    handlePageChange(1);
  }, [
    setSearch,
    setSortBy,
    setOrder,
    setHasImages,
    setHasPackSizes,
    handlePageChange,
  ]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        search ||
        sortBy ||
        order ||
        hasImages !== null ||
        hasPackSizes !== null,
      ),
    [search, sortBy, order, hasImages, hasPackSizes],
  );

  const params = useMemo(
    () => ({
      search: search || undefined,
      sortBy: sortBy ?? undefined,
      order: order ?? undefined,
      hasImages: hasImages ?? undefined,
      hasPackSizes: hasPackSizes ?? undefined,
      page,
      limit,
    }),
    [search, sortBy, order, hasImages, hasPackSizes, page, limit],
  );

  return {
    search,
    searchInputValue,
    sortBy,
    order,
    hasImages,
    hasPackSizes,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleHasImagesChange,
    handleHasPackSizesChange,
    page,
    limit,
    handlePageChange,
    handleLimitChange,
    clearFilters,
    hasActiveFilters,
    params,
  };
}
