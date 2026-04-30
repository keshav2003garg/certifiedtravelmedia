import { memo, useMemo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import { Search, X } from '@repo/ui/lib/icons';

import type { ActiveDataFilter } from '@/components/common/data-filter-bar';
import type { LocationSortBy, SortOrder } from '@/hooks/useLocations/types';
import type { useLocationsFilters } from '@/hooks/useLocations/useLocationsFilters';

type LocationsFilters = ReturnType<typeof useLocationsFilters>;

interface LocationsFilterBarProps {
  filters: LocationsFilters;
}

const sortLabels: Record<LocationSortBy, string> = {
  name: 'Name',
  locationId: 'Location ID',
  city: 'City',
  state: 'State',
  pocketSize: 'Pocket size',
};

const orderLabels: Record<SortOrder, string> = {
  asc: 'Ascending',
  desc: 'Descending',
};

function LocationsFilterBar({ filters }: LocationsFilterBarProps) {
  const {
    search,
    searchInputValue,
    sortBy,
    order,
    sectorId,
    width,
    height,
    isDefaultPockets,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleSectorChange,
    handleWidthChange,
    handleHeightChange,
    handleDefaultPocketsChange,
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

    if (sectorId) {
      items.push({
        label: 'Sector filter',
        onClear: () => handleSectorChange(null),
      });
    }

    if (width !== null) {
      items.push({
        label: `Width: ${width}`,
        onClear: () => handleWidthChange(null),
      });
    }

    if (height !== null) {
      items.push({
        label: `Height: ${height}`,
        onClear: () => handleHeightChange(null),
      });
    }

    if (isDefaultPockets !== null) {
      items.push({
        label: isDefaultPockets ? 'Default pockets' : 'Custom pockets',
        onClear: () => handleDefaultPocketsChange(null),
      });
    }

    return items;
  }, [
    search,
    sortBy,
    order,
    sectorId,
    width,
    height,
    isDefaultPockets,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleSectorChange,
    handleWidthChange,
    handleHeightChange,
    handleDefaultPocketsChange,
  ]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchInputValue}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search locations by name, address, city..."
          className="bg-background h-11 rounded-md pl-9"
        />
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.label}
              variant="secondary"
              className="gap-1 rounded-md pr-1"
            >
              {filter.label}
              <button
                type="button"
                onClick={filter.onClear}
                className="hover:bg-background/80 rounded-sm p-0.5"
                aria-label={`Clear ${filter.label}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
            >
              Clear all
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default memo(LocationsFilterBar);
