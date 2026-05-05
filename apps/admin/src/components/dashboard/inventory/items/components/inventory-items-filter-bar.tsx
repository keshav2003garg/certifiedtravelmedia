import { memo } from 'react';

import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { FileText, Search, Tags, Warehouse } from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';

import {
  DEFAULT_INVENTORY_ITEM_ORDER,
  DEFAULT_INVENTORY_ITEM_SORT_BY,
  INVENTORY_FILTER_ALL,
  INVENTORY_ITEM_ORDER_SELECT_OPTIONS,
  INVENTORY_ITEM_SORT_SELECT_OPTIONS,
  useInventoryItemsFilterOptions,
} from '@/hooks/useInventoryItems/useInventoryItemsFilterOptions';
import {
  INVENTORY_STOCK_LEVEL_OPTIONS,
  type useInventoryItemsFilters,
} from '@/hooks/useInventoryItems/useInventoryItemsFilters';

import type {
  InventoryItemSortBy,
  InventoryStockLevel,
  SortOrder,
} from '@/hooks/useInventoryItems/types';

type InventoryItemsFilters = ReturnType<typeof useInventoryItemsFilters>;

interface InventoryItemsFilterBarProps {
  filters: InventoryItemsFilters;
}

function InventoryItemsFilterBar({ filters }: InventoryItemsFilterBarProps) {
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
  } = useInventoryItemsFilterOptions();

  const {
    searchInputValue,
    sortBy,
    order,
    warehouseId,
    brochureId,
    brochureTypeId,
    stockLevel,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleWarehouseChange,
    handleBrochureChange,
    handleBrochureTypeChange,
    handleStockLevelChange,
    clearFilters,
    hasActiveFilters,
  } = filters;

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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SearchableSelect
          options={warehouseOptions}
          value={warehouseId ?? INVENTORY_FILTER_ALL}
          onChange={(value) =>
            handleWarehouseChange(value === INVENTORY_FILTER_ALL ? null : value)
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
          value={brochureId ?? INVENTORY_FILTER_ALL}
          onChange={(value) =>
            handleBrochureChange(value === INVENTORY_FILTER_ALL ? null : value)
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
          value={brochureTypeId ?? INVENTORY_FILTER_ALL}
          onChange={(value) =>
            handleBrochureTypeChange(
              value === INVENTORY_FILTER_ALL ? null : value,
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
          value={stockLevel ?? INVENTORY_FILTER_ALL}
          onValueChange={(value) =>
            handleStockLevelChange(
              value === INVENTORY_FILTER_ALL
                ? null
                : (value as InventoryStockLevel),
            )
          }
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="All stock levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={INVENTORY_FILTER_ALL}>
              All stock levels
            </SelectItem>
            {INVENTORY_STOCK_LEVEL_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:grid-cols-[minmax(200px,350px)_minmax(200px,350px)_auto]">
        <Select
          value={sortBy ?? DEFAULT_INVENTORY_ITEM_SORT_BY}
          onValueChange={(value) =>
            handleSortByChange(
              value === DEFAULT_INVENTORY_ITEM_SORT_BY
                ? null
                : (value as InventoryItemSortBy),
            )
          }
        >
          <SelectTrigger className="h-11" aria-label="Sort type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVENTORY_ITEM_SORT_SELECT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={order ?? DEFAULT_INVENTORY_ITEM_ORDER}
          onValueChange={(value) =>
            handleOrderChange(
              value === DEFAULT_INVENTORY_ITEM_ORDER
                ? null
                : (value as SortOrder),
            )
          }
        >
          <SelectTrigger className="h-11" aria-label="Sort order">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INVENTORY_ITEM_ORDER_SELECT_OPTIONS.map((option) => (
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
