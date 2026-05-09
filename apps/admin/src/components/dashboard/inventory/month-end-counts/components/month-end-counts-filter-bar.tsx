import { memo, useCallback, useMemo } from 'react';

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
import { useServerSearchSelectOptions } from '@/hooks/useServerSearchSelectOptions';
import { useWarehouses, warehouseQueryKeys } from '@/hooks/useWarehouses';

import { ReactQueryKeys } from '@/types/react-query-keys';

import type { SearchableSelectOption } from '@/components/common/searchable-select';
import type {
  ListBrochureTypesRequest,
  SortOrder as BrochureTypeSortOrder,
} from '@/hooks/useBrochureTypes/types';
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
      {/* Row 1 — full-width search */}
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

      {/* Row 2 — warehouse · brochure type · month · year */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* Month — blank by default, must be selected manually */}
        <Select
          value={filters.month !== null ? String(filters.month) : ''}
          onValueChange={(value) =>
            filters.handleMonthChange(
              value === FILTER_ALL ? null : Number(value),
            )
          }
        >
          <SelectTrigger className="h-11">
            <CalendarDays className="text-muted-foreground size-4" />
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTER_ALL}>All months</SelectItem>
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
          placeholder="Year"
        />
      </div>
    </div>
  );
}

export default memo(MonthEndCountsFilterBar);
