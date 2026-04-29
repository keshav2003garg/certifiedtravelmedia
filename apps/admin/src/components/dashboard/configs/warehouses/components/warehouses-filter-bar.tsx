import { memo, useMemo } from 'react';

import { Switch } from '@repo/ui/components/base/switch';

import DataFilterBar from '@/components/common/data-filter-bar';

import type {
  ActiveDataFilter,
  DataFilterOption,
} from '@/components/common/data-filter-bar';
import type { SortOrder, WarehouseSortBy } from '@/hooks/useWarehouses/types';
import type { useWarehousesFilters } from '@/hooks/useWarehouses/useWarehousesFilters';

type WarehousesFilters = ReturnType<typeof useWarehousesFilters>;

interface WarehousesFilterBarProps {
  filters: WarehousesFilters;
}

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'acumaticaId', label: 'Acumatica ID' },
  { value: 'createdAt', label: 'Created date' },
  { value: 'updatedAt', label: 'Updated date' },
] as const satisfies readonly DataFilterOption<WarehouseSortBy>[];

const sortLabels: Record<WarehouseSortBy, string> = {
  name: 'Name',
  acumaticaId: 'Acumatica ID',
  createdAt: 'Created date',
  updatedAt: 'Updated date',
};

const orderOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] as const satisfies readonly DataFilterOption<SortOrder>[];

const orderLabels: Record<SortOrder, string> = {
  asc: 'Ascending',
  desc: 'Descending',
};

function WarehousesFilterBar({ filters }: WarehousesFilterBarProps) {
  const {
    search,
    searchInputValue,
    sortBy,
    order,
    includeInactive,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleIncludeInactiveChange,
    clearFilters,
    hasActiveFilters,
  } = filters;

  const activeFilters = useMemo<ActiveDataFilter[]>(() => {
    const items: ActiveDataFilter[] = [];

    if (search) {
      items.push({
        label: `Search: "${search}"`,
        onClear: () => setSearch(''),
      });
    }

    if (sortBy) {
      items.push({
        label: `Sort: ${sortLabels[sortBy]}`,
        onClear: () => handleSortByChange(null),
      });
    }

    if (order) {
      items.push({
        label: `Order: ${orderLabels[order]}`,
        onClear: () => handleOrderChange(null),
      });
    }

    if (includeInactive) {
      items.push({
        label: 'Status: includes retired',
        onClear: () => handleIncludeInactiveChange(null),
      });
    }

    return items;
  }, [
    search,
    sortBy,
    order,
    includeInactive,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleIncludeInactiveChange,
  ]);

  return (
    <div className="space-y-3">
      <DataFilterBar
        searchValue={searchInputValue}
        searchPlaceholder="Search warehouses"
        onSearchChange={setSearch}
        sortValue={sortBy}
        defaultSortValue="name"
        sortOptions={sortOptions}
        onSortChange={handleSortByChange}
        orderValue={order}
        defaultOrderValue="asc"
        orderOptions={orderOptions}
        onOrderChange={handleOrderChange}
        activeFilters={activeFilters}
        clearDisabled={!hasActiveFilters}
        onClear={clearFilters}
      />

      <div className="bg-muted/20 flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Include retired warehouses</p>
          <p className="text-muted-foreground text-xs">
            Retired warehouses stay hidden unless this filter is enabled.
          </p>
        </div>
        <Switch
          checked={Boolean(includeInactive)}
          onCheckedChange={(checked) =>
            handleIncludeInactiveChange(checked ? true : null)
          }
          aria-label="Include retired warehouses"
        />
      </div>
    </div>
  );
}

export default memo(WarehousesFilterBar);
