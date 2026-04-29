import { memo, useMemo } from 'react';

import DataFilterBar from '@/components/common/data-filter-bar';

import type {
  ActiveDataFilter,
  DataFilterOption,
} from '@/components/common/data-filter-bar';
import type { CustomerSortBy, SortOrder } from '@/hooks/useCustomers/types';
import type { useCustomersFilters } from '@/hooks/useCustomers/useCustomersFilters';

type CustomersFilters = ReturnType<typeof useCustomersFilters>;

interface CustomersFilterBarProps {
  filters: CustomersFilters;
}

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'acumaticaId', label: 'Acumatica ID' },
  { value: 'createdAt', label: 'Created date' },
  { value: 'updatedAt', label: 'Updated date' },
] as const satisfies readonly DataFilterOption<CustomerSortBy>[];

const sortLabels: Record<CustomerSortBy, string> = {
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

function CustomersFilterBar({ filters }: CustomersFilterBarProps) {
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
      searchPlaceholder="Search customers"
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

export default memo(CustomersFilterBar);
