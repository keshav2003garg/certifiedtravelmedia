import { memo, useMemo } from 'react';

import DataFilterBar from '@/components/common/data-filter-bar';

import type {
  ActiveDataFilter,
  DataFilterOption,
} from '@/components/common/data-filter-bar';
import type {
  InventoryRequestSortBy,
  SortOrder,
} from '@/hooks/useInventoryRequests/types';
import type { useInventoryRequestsFilters } from '@/hooks/useInventoryRequests/useInventoryRequestsFilters';

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

function InventoryRequestsFilterBar({
  filters,
}: InventoryRequestsFilterBarProps) {
  const {
    search,
    searchInputValue,
    sortBy,
    order,
    setSearch,
    handleSortByChange,
    handleOrderChange,
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

    return items;
  }, [search, sortBy, order, setSearch, handleSortByChange, handleOrderChange]);

  return (
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
  );
}

export default memo(InventoryRequestsFilterBar);
