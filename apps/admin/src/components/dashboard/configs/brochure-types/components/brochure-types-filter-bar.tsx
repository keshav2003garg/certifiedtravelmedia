import { memo, useMemo } from 'react';

import DataFilterBar from '@/components/common/data-filter-bar';

import type {
  ActiveDataFilter,
  DataFilterOption,
} from '@/components/common/data-filter-bar';
import type {
  BrochureTypeSortBy,
  SortOrder,
} from '@/hooks/useBrochureTypes/types';
import type { useBrochureTypesFilters } from '@/hooks/useBrochureTypes/useBrochureTypesFilters';

type BrochureTypesFilters = ReturnType<typeof useBrochureTypesFilters>;

interface BrochureTypesFilterBarProps {
  filters: BrochureTypesFilters;
}

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'colSpan', label: 'Column span' },
  { value: 'createdAt', label: 'Created date' },
  { value: 'updatedAt', label: 'Updated date' },
] as const satisfies readonly DataFilterOption<BrochureTypeSortBy>[];

const sortLabels: Record<BrochureTypeSortBy, string> = {
  name: 'Name',
  colSpan: 'Column span',
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

function BrochureTypesFilterBar({ filters }: BrochureTypesFilterBarProps) {
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
      searchPlaceholder="Search brochure types"
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
  );
}

export default memo(BrochureTypesFilterBar);
