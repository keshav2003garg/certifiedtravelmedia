import { memo, useMemo } from 'react';

import DataFilterBar from '@/components/common/data-filter-bar';

import type { ActiveDataFilter } from '@/components/common/data-filter-bar';
import type { useCustomersFilters } from '@/hooks/useCustomers/useCustomersFilters';

type CustomersFilters = ReturnType<typeof useCustomersFilters>;

interface CustomersFilterBarProps {
  filters: CustomersFilters;
}

function CustomersFilterBar({ filters }: CustomersFilterBarProps) {
  const {
    search,
    searchInputValue,
    setSearch,
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

    return items;
  }, [search, setSearch]);

  return (
    <DataFilterBar
      searchValue={searchInputValue}
      searchPlaceholder="Search customers"
      onSearchChange={setSearch}
      activeFilters={activeFilters}
      clearDisabled={!hasActiveFilters}
      onClear={clearFilters}
    />
  );
}

export default memo(CustomersFilterBar);
