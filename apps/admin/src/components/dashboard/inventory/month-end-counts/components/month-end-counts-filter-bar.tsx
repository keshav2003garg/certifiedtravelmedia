import { memo, useCallback, useMemo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import { NumericInput } from '@repo/ui/components/base/numeric-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { CalendarDays, Search, Tags, Warehouse } from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';

import { useBrochureTypes } from '@/hooks/useBrochureTypes';
import { INVENTORY_STOCK_LEVEL_OPTIONS } from '@/hooks/useInventoryMonthEndCounts/useInventoryMonthEndCountsFilters';
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses, warehouseQueryKeys } from '@/hooks/useWarehouses';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type {
  ListBrochureTypesRequest,
  SortOrder as BrochureTypeSortOrder,
} from '@/hooks/useBrochureTypes/types';
import type {
  InventoryStockLevel,
  SortOrder,
} from '@/hooks/useInventoryItems/types';
import type { MonthEndCountSortBy } from '@/hooks/useInventoryMonthEndCounts/types';
import type { ServerSearchSelectParams } from '@/hooks/useServerSearchSelectOptions';
import type {
  ListWarehousesRequest,
  SortOrder as WarehouseSortOrder,
} from '@/hooks/useWarehouses/types';
import type { MonthEndCountFilters } from '../types';

type WarehouseOptionData = ListWarehousesRequest['response']['data'];
type BrochureTypeOptionData = ListBrochureTypesRequest['response']['data'];

interface MonthEndCountsFilterBarProps {
  filters: MonthEndCountFilters;
}

const FILTER_ALL = '__all__';
const DEFAULT_SORT_BY = 'brochureName' satisfies MonthEndCountSortBy;
const DEFAULT_ORDER = 'asc' satisfies SortOrder;

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

const sortOptions = [
  { value: 'brochureName', label: 'Brochure name' },
  { value: 'warehouseName', label: 'Warehouse' },
  { value: 'brochureTypeName', label: 'Brochure type' },
  { value: 'customerName', label: 'Customer' },
  { value: 'boxes', label: 'Current boxes' },
  { value: 'unitsPerBox', label: 'Units per box' },
  { value: 'stockLevel', label: 'Stock level' },
  { value: 'countedBoxes', label: 'End count' },
  { value: 'distributionBoxes', label: 'Distribution' },
  { value: 'updatedAt', label: 'Updated date' },
] as const satisfies readonly {
  value: MonthEndCountSortBy;
  label: string;
}[];

const orderOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] as const satisfies readonly { value: SortOrder; label: string }[];

function MonthEndCountsFilterBar({ filters }: MonthEndCountsFilterBarProps) {
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
      'month-end-counts-filter',
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

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.4fr)_minmax(200px,1fr)_minmax(200px,1fr)_minmax(180px,0.8fr)]">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={filters.searchInputValue}
            onChange={(event) => filters.setSearch(event.target.value)}
            placeholder="Search by brochure or customer name"
            aria-label="Search by brochure or customer name"
            className="h-11 pl-9"
          />
        </div>

        <SearchableSelect
          options={warehouseOptions}
          value={filters.warehouseId ?? FILTER_ALL}
          onChange={(value) =>
            filters.handleWarehouseChange(value === FILTER_ALL ? null : value)
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
          value={filters.brochureTypeId ?? FILTER_ALL}
          onChange={(value) =>
            filters.handleBrochureTypeChange(
              value === FILTER_ALL ? null : value,
            )
          }
          placeholder="All brochure types"
          searchPlaceholder="Search brochure types"
          emptyMessage="No brochure types found"
          isLoading={isSearchingBrochureTypes}
          icon={<Tags className="size-4 shrink-0" />}
          onSearchChange={setBrochureTypeSearch}
        />

        <Select
          value={filters.stockLevel ?? FILTER_ALL}
          onValueChange={(value) =>
            filters.handleStockLevelChange(
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-[180px_140px]">
          <Select
            value={String(filters.month)}
            onValueChange={(value) => filters.handleMonthChange(Number(value))}
          >
            <SelectTrigger className="h-11">
              <CalendarDays className="text-muted-foreground size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <NumericInput
            value={filters.year}
            onChange={filters.handleYearChange}
            min={2000}
            max={2100}
            integerOnly
            className="h-11"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(180px,220px)_minmax(160px,180px)_auto]">
          <Select
            value={filters.sortBy ?? DEFAULT_SORT_BY}
            onValueChange={(value) =>
              filters.handleSortByChange(
                value === DEFAULT_SORT_BY
                  ? null
                  : (value as MonthEndCountSortBy),
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
            value={filters.order ?? DEFAULT_ORDER}
            onValueChange={(value) =>
              filters.handleOrderChange(
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
            disabled={!filters.hasActiveFilters}
            onClick={filters.clearFilters}
          >
            Clear filters
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(MonthEndCountsFilterBar);
