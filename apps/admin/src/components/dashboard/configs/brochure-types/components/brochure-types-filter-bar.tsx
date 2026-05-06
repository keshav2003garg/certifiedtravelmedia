import { memo, useMemo } from 'react';

import DataFilterBar from '@/components/common/data-filter-bar';

import type { ActiveDataFilter } from '@/components/common/data-filter-bar';
import type { useBrochureTypesFilters } from '@/hooks/useBrochureTypes/useBrochureTypesFilters';

type BrochureTypesFilters = ReturnType<typeof useBrochureTypesFilters>;

interface BrochureTypesFilterBarProps {
  filters: BrochureTypesFilters;
}

function BrochureTypesFilterBar({ filters }: BrochureTypesFilterBarProps) {
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
      searchPlaceholder="Search brochure types"
      onSearchChange={setSearch}
      activeFilters={activeFilters}
      clearDisabled={!hasActiveFilters}
      onClear={clearFilters}
    />
  );
}

export default memo(BrochureTypesFilterBar);
