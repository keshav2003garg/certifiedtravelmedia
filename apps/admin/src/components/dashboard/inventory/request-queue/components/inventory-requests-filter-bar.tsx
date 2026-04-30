import { memo, useMemo } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';

import DataFilterBar from '@/components/common/data-filter-bar';

import {
  INVENTORY_REQUEST_STATUS_OPTIONS,
  type useInventoryRequestsFilters,
} from '@/hooks/useInventoryRequests/useInventoryRequestsFilters';

import type {
  ActiveDataFilter,
  DataFilterOption,
} from '@/components/common/data-filter-bar';
import type {
  InventoryRequestSortBy,
  InventoryRequestStatus,
  SortOrder,
} from '@/hooks/useInventoryRequests/types';

type InventoryRequestsFilters = ReturnType<typeof useInventoryRequestsFilters>;

interface InventoryRequestsFilterBarProps {
  filters: InventoryRequestsFilters;
}

const sortOptions = [
  { value: 'createdAt', label: 'Created date' },
  { value: 'updatedAt', label: 'Updated date' },
  { value: 'dateReceived', label: 'Date received' },
  { value: 'status', label: 'Status' },
  { value: 'brochureName', label: 'Brochure name' },
] as const satisfies readonly DataFilterOption<InventoryRequestSortBy>[];

const sortLabels: Record<InventoryRequestSortBy, string> = {
  createdAt: 'Created date',
  updatedAt: 'Updated date',
  dateReceived: 'Date received',
  status: 'Status',
  brochureName: 'Brochure name',
};

const orderOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] as const satisfies readonly DataFilterOption<SortOrder>[];

const orderLabels: Record<SortOrder, string> = {
  asc: 'Ascending',
  desc: 'Descending',
};

const STATUS_ALL = '__all__';

function InventoryRequestsFilterBar({ filters }: InventoryRequestsFilterBarProps) {
  const {
    search,
    searchInputValue,
    sortBy,
    order,
    status,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleStatusChange,
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

    if (status) {
      items.push({
        label: `Status: ${status}`,
        onClear: () => handleStatusChange(null),
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

    return items;
  }, [
    search,
    status,
    sortBy,
    order,
    setSearch,
    handleStatusChange,
    handleSortByChange,
    handleOrderChange,
  ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <Select
          value={status ?? STATUS_ALL}
          onValueChange={(value) =>
            handleStatusChange(
              value === STATUS_ALL ? null : (value as InventoryRequestStatus),
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STATUS_ALL}>All statuses</SelectItem>
            {INVENTORY_REQUEST_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div />
      </div>

      <DataFilterBar
        searchValue={searchInputValue}
        searchPlaceholder="Search by brochure or customer"
        onSearchChange={setSearch}
        sortValue={sortBy}
        defaultSortValue="createdAt"
        sortOptions={sortOptions}
        onSortChange={handleSortByChange}
        orderValue={order}
        defaultOrderValue="desc"
        orderOptions={orderOptions}
        onOrderChange={handleOrderChange}
        activeFilters={activeFilters}
        clearDisabled={!hasActiveFilters}
        onClear={clearFilters}
      />
    </div>
  );
}

export default memo(InventoryRequestsFilterBar);
