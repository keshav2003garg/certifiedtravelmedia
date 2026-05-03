import { memo, useCallback, useMemo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { Search, Tags, Warehouse } from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';

import { useBrochureTypes } from '@/hooks/useBrochureTypes';
import {
  INVENTORY_STOCK_LEVEL_OPTIONS,
  type useInventoryItemsFilters,
} from '@/hooks/useInventoryItems/useInventoryItemsFilters';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses, warehouseQueryKeys } from '@/hooks/useWarehouses';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type {
  ListBrochureTypesRequest,
  SortOrder as BrochureTypeSortOrder,
} from '@/hooks/useBrochureTypes/types';
import type {
  InventoryItemSortBy,
  InventoryStockLevel,
  SortOrder,
} from '@/hooks/useInventoryItems/types';
import type { ServerSearchSelectParams } from '@/hooks/useServerSearchSelectOptions';
import type {
  ListWarehousesRequest,
  SortOrder as WarehouseSortOrder,
} from '@/hooks/useWarehouses/types';

type InventoryItemsFilters = ReturnType<typeof useInventoryItemsFilters>;
type WarehouseOptionData = ListWarehousesRequest['response']['data'];
type BrochureTypeOptionData = ListBrochureTypesRequest['response']['data'];

interface InventoryItemsFilterBarProps {
  filters: InventoryItemsFilters;
}

const FILTER_ALL = '__all__';
const DEFAULT_SORT_BY = 'brochureName' satisfies InventoryItemSortBy;
const DEFAULT_ORDER = 'asc' satisfies SortOrder;

const sortOptions = [
  { value: 'brochureName', label: 'Brochure name' },
  { value: 'warehouseName', label: 'Warehouse' },
  { value: 'brochureTypeName', label: 'Brochure type' },
  { value: 'customerName', label: 'Customer' },
  { value: 'boxes', label: 'No. of boxes' },
  { value: 'unitsPerBox', label: 'Units per box' },
  { value: 'stockLevel', label: 'Stock level' },
  { value: 'createdAt', label: 'Created date' },
  { value: 'updatedAt', label: 'Updated date' },
] as const satisfies readonly { value: InventoryItemSortBy; label: string }[];

const orderOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] as const satisfies readonly { value: SortOrder; label: string }[];

function InventoryItemsFilterBar({ filters }: InventoryItemsFilterBarProps) {
  const { getWarehouses } = useWarehouses();
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
  const buildBrochureTypeParams = useCallback(
    ({ page, limit, search }: ServerSearchSelectParams) => ({
      page,
      limit,
      search,
      sortBy: 'name' as const,
      order: 'asc' as BrochureTypeSortOrder,
    }),
    [],
  );
  const brochureTypeQueryKey = useCallback(
    (params: ListBrochureTypesRequest['payload']) => [
      ReactQueryKeys.GET_BROCHURE_TYPES,
      'inventory-items-filter',
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
      { value: FILTER_ALL, label: 'All warehouses' },
      ...warehouseSearchOptions,
    ],
    [warehouseSearchOptions],
  );
  const brochureTypeOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: 'All brochure types' },
      ...brochureTypeSearchOptions,
    ],
    [brochureTypeSearchOptions],
  );

  const {
    searchInputValue,
    sortBy,
    order,
    warehouseId,
    brochureTypeId,
    stockLevel,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleWarehouseChange,
    handleBrochureTypeChange,
    handleStockLevelChange,
    clearFilters,
    hasActiveFilters,
  } = filters;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchInputValue}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by brochure or customer name"
          aria-label="Search by brochure or customer name"
          className="h-11 pl-9"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <SearchableSelect
          options={warehouseOptions}
          value={warehouseId ?? FILTER_ALL}
          onChange={(value) =>
            handleWarehouseChange(value === FILTER_ALL ? null : value)
          }
          placeholder="All warehouses"
          searchPlaceholder="Search warehouses"
          emptyMessage="No warehouses found"
          isLoading={isSearchingWarehouses}
          icon={<Warehouse className="size-4 shrink-0" />}
          onSearchChange={setWarehouseSearch}
        />

        <SearchableSelect
          options={brochureTypeOptions}
          value={brochureTypeId ?? FILTER_ALL}
          onChange={(value) =>
            handleBrochureTypeChange(value === FILTER_ALL ? null : value)
          }
          placeholder="All brochure types"
          searchPlaceholder="Search brochure types"
          emptyMessage="No brochure types found"
          isLoading={isSearchingBrochureTypes}
          icon={<Tags className="size-4 shrink-0" />}
          onSearchChange={setBrochureTypeSearch}
        />

        <Select
          value={stockLevel ?? FILTER_ALL}
          onValueChange={(value) =>
            handleStockLevelChange(
              value === FILTER_ALL ? null : (value as InventoryStockLevel),
            )
          }
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="All stock levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>All stock levels</SelectItem>
            {INVENTORY_STOCK_LEVEL_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Select
          value={sortBy ?? DEFAULT_SORT_BY}
          onValueChange={(value) =>
            handleSortByChange(
              value === DEFAULT_SORT_BY ? null : (value as InventoryItemSortBy),
            )
          }
        >
          <SelectTrigger className="h-11" aria-label="Sort type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={order ?? DEFAULT_ORDER}
          onValueChange={(value) =>
            handleOrderChange(
              value === DEFAULT_ORDER ? null : (value as SortOrder),
            )
          }
        >
          <SelectTrigger className="h-11" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={!hasActiveFilters}
          onClick={clearFilters}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}

export default memo(InventoryItemsFilterBar);
