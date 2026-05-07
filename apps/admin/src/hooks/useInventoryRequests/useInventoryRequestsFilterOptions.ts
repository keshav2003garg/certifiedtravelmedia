import { useCallback, useMemo } from 'react';

import { useBrochureTypes } from '@/hooks/useBrochureTypes';
import {
  inventoryBrochureQueryKeys,
  useInventoryBrochures,
} from '@/hooks/useInventoryBrochures';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses, warehouseQueryKeys } from '@/hooks/useWarehouses';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type { ListBrochureTypesRequest } from '@/hooks/useBrochureTypes/types';
import type { ListBrochuresRequest } from '@/hooks/useInventoryBrochures/types';
import type { ServerSearchSelectParams } from '@/hooks/useServerSearchSelectOptions';
import type {
  ListWarehousesRequest,
  SortOrder as WarehouseSortOrder,
} from '@/hooks/useWarehouses/types';

type WarehouseOptionData = ListWarehousesRequest['response']['data'];
type BrochureOptionData = ListBrochuresRequest['response']['data'];
type BrochureTypeOptionData = ListBrochureTypesRequest['response']['data'];

export const REQUEST_FILTER_ALL = '__all__';

export function useInventoryRequestsFilterOptions() {
  const { getWarehouses } = useWarehouses();
  const { getBrochures } = useInventoryBrochures();
  const { getBrochureTypes } = useBrochureTypes();

  const selectWarehouseOptions = useCallback(
    (data: WarehouseOptionData | undefined): SearchableSelectOption[] =>
      (data?.warehouses ?? []).map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name,
        description: warehouse.acumaticaId ?? undefined,
      })),
    [],
  );

  const selectBrochureOptions = useCallback(
    (data: BrochureOptionData | undefined): SearchableSelectOption[] =>
      (data?.brochures ?? []).map((brochure) => ({
        value: brochure.id,
        label: brochure.name,
        description:
          brochure.brochureTypeName +
          (brochure.customerName ? ` - ${brochure.customerName}` : ''),
      })),
    [],
  );

  const selectBrochureTypeOptions = useCallback(
    (data: BrochureTypeOptionData | undefined): SearchableSelectOption[] =>
      (data?.brochureTypes ?? []).map((brochureType) => ({
        value: brochureType.id,
        label: brochureType.name,
        description: `${brochureType.colSpan} columns`,
      })),
    [],
  );

  const buildWarehouseParams = useCallback(
    ({ page, limit, search }: ServerSearchSelectParams) => ({
      page,
      limit,
      search,
      sortBy: 'name' as const,
      order: 'asc' as WarehouseSortOrder,
    }),
    [],
  );

  const buildBrochureParams = useCallback(
    ({ page, limit, search }: ServerSearchSelectParams) => ({
      page,
      limit,
      search,
      sortBy: 'name' as const,
      order: 'asc' as const,
    }),
    [],
  );

  const buildBrochureTypeParams = useCallback(
    ({ page, limit, search }: ServerSearchSelectParams) => ({
      page,
      limit,
      search,
      sortBy: 'name' as const,
      order: 'asc' as const,
    }),
    [],
  );

  const brochureTypeQueryKey = useCallback(
    (params: ListBrochureTypesRequest['payload']) => [
      ReactQueryKeys.GET_BROCHURE_TYPES,
      'inventory-requests-filter',
      params,
    ],
    [],
  );

  const {
    options: warehouseSearchOptions,
    setSearch: setWarehouseSearch,
    isSearching: isSearchingWarehouses,
  } = useServerSearchSelectOptions({
    queryKey: warehouseQueryKeys.list,
    queryFn: getWarehouses,
    selectOptions: selectWarehouseOptions,
    buildParams: buildWarehouseParams,
  });

  const {
    options: brochureSearchOptions,
    setSearch: setBrochureSearch,
    isSearching: isSearchingBrochures,
  } = useServerSearchSelectOptions({
    queryKey: inventoryBrochureQueryKeys.list,
    queryFn: getBrochures,
    selectOptions: selectBrochureOptions,
    buildParams: buildBrochureParams,
  });

  const {
    options: brochureTypeSearchOptions,
    setSearch: setBrochureTypeSearch,
    isSearching: isSearchingBrochureTypes,
  } = useServerSearchSelectOptions({
    queryKey: brochureTypeQueryKey,
    queryFn: getBrochureTypes,
    selectOptions: selectBrochureTypeOptions,
    buildParams: buildBrochureTypeParams,
  });

  const warehouseOptions = useMemo(
    () => [
      { value: REQUEST_FILTER_ALL, label: 'All warehouses' },
      ...warehouseSearchOptions,
    ],
    [warehouseSearchOptions],
  );

  const brochureOptions = useMemo(
    () => [
      { value: REQUEST_FILTER_ALL, label: 'All brochures' },
      ...brochureSearchOptions,
    ],
    [brochureSearchOptions],
  );

  const brochureTypeOptions = useMemo(
    () => [
      { value: REQUEST_FILTER_ALL, label: 'All brochure types' },
      ...brochureTypeSearchOptions,
    ],
    [brochureTypeSearchOptions],
  );

  return {
    warehouseOptions,
    brochureOptions,
    brochureTypeOptions,
    setWarehouseSearch,
    setBrochureSearch,
    setBrochureTypeSearch,
    isSearchingWarehouses,
    isSearchingBrochures,
    isSearchingBrochureTypes,
  };
}
