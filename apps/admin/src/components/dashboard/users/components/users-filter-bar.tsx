import { memo, useMemo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import { Search, X } from '@repo/ui/lib/icons';

import type { useUsersFilters } from '@/hooks/useUsers/useUsersFilters';

type UsersFilters = ReturnType<typeof useUsersFilters>;

interface UsersFilterBarProps {
  filters: UsersFilters;
}

interface ActiveFilter {
  label: string;
  onClear: () => void;
}

function UsersFilterBar({ filters }: UsersFilterBarProps) {
  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const items: ActiveFilter[] = [];

    if (filters.search) {
      items.push({
        label: `Search: "${filters.search}"`,
        onClear: () => filters.setSearch(''),
      });
    }

    return items;
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={filters.searchInputValue}
            onChange={(event) => filters.setSearch(event.target.value)}
            placeholder="Search users"
            className="pl-9"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={filters.clearFilters}
          disabled={!filters.hasActiveFilters}
        >
          <X className="size-4" />
          Clear
        </Button>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2">
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
        </div>
      ) : null}
    </div>
  );
}

export default memo(UsersFilterBar);
