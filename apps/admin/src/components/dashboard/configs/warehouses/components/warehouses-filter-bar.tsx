import { memo, useMemo } from 'react';

import { Switch } from '@repo/ui/components/base/switch';

import DataFilterBar from '@/components/common/data-filter-bar';

import type { ActiveDataFilter } from '@/components/common/data-filter-bar';
import type { useWarehousesFilters } from '@/hooks/useWarehouses/useWarehousesFilters';

type WarehousesFilters = ReturnType<typeof useWarehousesFilters>;

interface WarehousesFilterBarProps {
  filters: WarehousesFilters;
}

function WarehousesFilterBar({ filters }: WarehousesFilterBarProps) {
  const {
    search,
    searchInputValue,
    includeInactive,
    setSearch,
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

    if (includeInactive) {
      items.push({
        label: 'Status: includes retired',
        onClear: () => handleIncludeInactiveChange(null),
      });
    }

    return items;
  }, [search, includeInactive, setSearch, handleIncludeInactiveChange]);

  return (
    <div className="space-y-3">
      <DataFilterBar
        searchValue={searchInputValue}
        searchPlaceholder="Search warehouses"
        onSearchChange={setSearch}
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
