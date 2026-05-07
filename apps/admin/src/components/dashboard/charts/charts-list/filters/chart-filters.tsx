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
import { CalendarDays, Search, X } from '@repo/ui/lib/icons';

import type { useChartEditorFilters } from '@/hooks/useChartEditor/useChartEditorFilters';

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2020 + 5 }, (_, index) => {
  const year = 2020 + index;
  return { value: String(year), label: String(year) };
});

interface ChartFiltersProps {
  filters: ReturnType<typeof useChartEditorFilters>;
}

export const ChartFilters = memo(function ChartFilters({
  filters,
}: ChartFiltersProps) {
  return (
    <div className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative min-w-0 flex-1 lg:max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={filters.searchInputValue}
          onChange={(event) => filters.setSearch(event.target.value)}
          placeholder="Search sectors, locations, addresses"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
          <CalendarDays className="size-4" />
          Period
        </div>

        <Select
          value={String(filters.month)}
          onValueChange={(value) => filters.handleMonthChange(Number(value))}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(filters.year)}
          onValueChange={(value) => filters.handleYearChange(Number(value))}
        >
          <SelectTrigger className="h-9 w-28">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((year) => (
              <SelectItem key={year.value} value={year.value}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filters.hasActiveFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={filters.clearFilters}
          >
            <X className="size-4" />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
});
