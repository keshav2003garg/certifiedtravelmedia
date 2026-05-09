import { memo, useMemo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Input } from '@repo/ui/components/base/input';
import { FileText, Search, Tags, Warehouse, X } from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';

import {
  REQUEST_FILTER_ALL,
  useInventoryRequestsFilterOptions,
} from '@/hooks/useInventoryRequests/useInventoryRequestsFilterOptions';

import type { useInventoryRequestsFilters } from '@/hooks/useInventoryRequests/useInventoryRequestsFilters';

type InventoryRequestsFilters = ReturnType<typeof useInventoryRequestsFilters>;

interface InventoryRequestsFilterBarProps {
  filters: InventoryRequestsFilters;
}

function InventoryRequestsFilterBar({
  filters,
}: InventoryRequestsFilterBarProps) {
  const {
    warehouseOptions,
    brochureOptions,
    brochureTypeOptions,
    setWarehouseSearch,
    setBrochureSearch,
    setBrochureTypeSearch,
    isSearchingWarehouses,
    isSearchingBrochures,
    isSearchingBrochureTypes,
  } = useInventoryRequestsFilterOptions();

  const {
    search,
    searchInputValue,
    warehouseId,
    brochureId,
    brochureTypeId,
    setSearch,
    handleWarehouseChange,
    handleBrochureChange,
    handleBrochureTypeChange,
  } = filters;

  const activeChips = useMemo(() => {
    const chips: { label: string; onClear: () => void }[] = [];

    if (search) {
      chips.push({
        label: `Search: "${search}"`,
        onClear: () => setSearch(''),
      });
    }

    if (warehouseId) {
      const option = warehouseOptions.find((o) => o.value === warehouseId);
      chips.push({
        label: `Warehouse: ${option?.label ?? warehouseId}`,
        onClear: () => handleWarehouseChange(null),
      });
    }

    if (brochureId) {
      const option = brochureOptions.find((o) => o.value === brochureId);
      chips.push({
        label: `Brochure: ${option?.label ?? brochureId}`,
        onClear: () => handleBrochureChange(null),
      });
    }

    if (brochureTypeId) {
      const option = brochureTypeOptions.find(
        (o) => o.value === brochureTypeId,
      );
      chips.push({
        label: `Type: ${option?.label ?? brochureTypeId}`,
        onClear: () => handleBrochureTypeChange(null),
      });
    }

    return chips;
  }, [
    search,
    warehouseId,
    brochureId,
    brochureTypeId,
    warehouseOptions,
    brochureOptions,
    brochureTypeOptions,
    setSearch,
    handleWarehouseChange,
    handleBrochureChange,
    handleBrochureTypeChange,
  ]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-xl">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchInputValue}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by customer or brochure name..."
          aria-label="Search by customer or brochure name"
          className="h-11 pl-9"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SearchableSelect
          options={warehouseOptions}
          value={warehouseId ?? REQUEST_FILTER_ALL}
          onChange={(value) =>
            handleWarehouseChange(value === REQUEST_FILTER_ALL ? null : value)
          }
          placeholder="All warehouses"
          searchPlaceholder="Search warehouses"
          emptyMessage="No warehouses found"
          isLoading={isSearchingWarehouses}
          icon={<Warehouse className="size-4 shrink-0" />}
          onSearchChange={setWarehouseSearch}
        />

        <SearchableSelect
          options={brochureOptions}
          value={brochureId ?? REQUEST_FILTER_ALL}
          onChange={(value) =>
            handleBrochureChange(value === REQUEST_FILTER_ALL ? null : value)
          }
          placeholder="All brochures"
          searchPlaceholder="Search brochures"
          emptyMessage="No brochures found"
          isLoading={isSearchingBrochures}
          icon={<FileText className="size-4 shrink-0" />}
          onSearchChange={setBrochureSearch}
        />

        <SearchableSelect
          options={brochureTypeOptions}
          value={brochureTypeId ?? REQUEST_FILTER_ALL}
          onChange={(value) =>
            handleBrochureTypeChange(
              value === REQUEST_FILTER_ALL ? null : value,
            )
          }
          placeholder="All brochure types"
          searchPlaceholder="Search brochure types"
          emptyMessage="No brochure types found"
          isLoading={isSearchingBrochureTypes}
          icon={<Tags className="size-4 shrink-0" />}
          onSearchChange={setBrochureTypeSearch}
        />
      </div>

      <div className="flex items-center gap-2">
        {activeChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <Badge
                key={chip.label}
                variant="secondary"
                className="gap-1 rounded-md pr-1"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onClear}
                  className="hover:bg-background/80 rounded-sm p-0.5"
                  aria-label={`Clear ${chip.label}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default memo(InventoryRequestsFilterBar);
