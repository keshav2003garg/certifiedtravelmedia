import { memo, useMemo } from 'react';

import { Badge } from '@repo/ui/components/base/badge';
import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import { Search, X } from '@repo/ui/lib/icons';

import type { UserFilter, UserSearchField } from '@/hooks/useUsers/types';
import type { useUsersFilters } from '@/hooks/useUsers/useUsersFilters';

type UsersFilters = ReturnType<typeof useUsersFilters>;

interface UsersFilterBarProps {
  filters: UsersFilters;
}

interface ActiveFilter {
  label: string;
  onClear: () => void;
}

const searchFieldOptions = [
  { value: 'email', label: 'Email' },
  { value: 'name', label: 'Name' },
] as const;

const filterOptions = [
  { value: 'all', label: 'All users' },
  { value: 'role:admin', label: 'Admins' },
  { value: 'role:manager', label: 'Managers' },
  { value: 'role:staff', label: 'Staff' },
  { value: 'status:active', label: 'Active' },
  { value: 'status:banned', label: 'Banned' },
] as const;

const filterLabels: Record<UserFilter, string> = {
  'role:staff': 'Staff',
  'role:manager': 'Manager',
  'role:admin': 'Admin',
  'status:active': 'Active',
  'status:banned': 'Banned',
};

function UsersFilterBar({ filters }: UsersFilterBarProps) {
  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const items: ActiveFilter[] = [];

    if (filters.search) {
      items.push({
        label: `Search: "${filters.search}"`,
        onClear: () => filters.setSearch(''),
      });
    }

    if (filters.searchField !== 'email') {
      items.push({
        label: 'Search field: Name',
        onClear: () => filters.handleSearchFieldChange(null),
      });
    }

    if (filters.filter) {
      items.push({
        label: `Filter: ${filterLabels[filters.filter]}`,
        onClear: () => filters.handleFilterChange(null),
      });
    }

    return items;
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[1fr_130px_150px_100px_auto]">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={filters.searchInputValue}
            onChange={(event) => filters.setSearch(event.target.value)}
            placeholder={`Search users by ${filters.searchField}`}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.searchField}
          onValueChange={(value) =>
            filters.handleSearchFieldChange(value as UserSearchField)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {searchFieldOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.filter ?? 'all'}
          onValueChange={(value) =>
            filters.handleFilterChange(
              value === 'all' ? null : (value as UserFilter),
            )
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
