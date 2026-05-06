import { memo } from 'react';

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

export interface DataFilterOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export interface ActiveDataFilter {
  label: string;
  onClear: () => void;
}

interface DataFilterBarProps<
  TSortBy extends string,
  TOrder extends string = string,
> {
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  sortValue?: TSortBy | null;
  defaultSortValue?: TSortBy;
  sortOptions?: readonly DataFilterOption<TSortBy>[];
  onSortChange?: (value: TSortBy | null) => void;
  orderValue?: TOrder | null;
  defaultOrderValue?: TOrder;
  orderOptions?: readonly DataFilterOption<TOrder>[];
  onOrderChange?: (value: TOrder | null) => void;
  activeFilters?: readonly ActiveDataFilter[];
  clearDisabled: boolean;
  onClear: () => void;
}

function DataFilterBar<
  TSortBy extends string = string,
  TOrder extends string = string,
>({
  searchValue,
  searchPlaceholder,
  onSearchChange,
  sortValue,
  defaultSortValue,
  sortOptions,
  onSortChange,
  orderValue,
  defaultOrderValue,
  orderOptions,
  onOrderChange,
  activeFilters = [],
  clearDisabled,
  onClear,
}: DataFilterBarProps<TSortBy, TOrder>) {
  const hasSortControls = Boolean(
    defaultSortValue && sortOptions?.length && onSortChange,
  );
  const hasOrderControls = Boolean(
    defaultOrderValue && orderOptions?.length && onOrderChange,
  );
  const gridClassName = hasSortControls
    ? hasOrderControls
      ? 'grid gap-3 lg:grid-cols-[1fr_180px_160px_auto]'
      : 'grid gap-3 lg:grid-cols-[1fr_180px_auto]'
    : hasOrderControls
      ? 'grid gap-3 lg:grid-cols-[1fr_160px_auto]'
      : 'grid gap-3 lg:grid-cols-[1fr_auto]';

  return (
    <div className="space-y-4">
      <div className={gridClassName}>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        {hasSortControls ? (
          <Select
            value={sortValue ?? defaultSortValue}
            onValueChange={(value) =>
              onSortChange?.(
                value === defaultSortValue ? null : (value as TSortBy),
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {hasOrderControls ? (
          <Select
            value={orderValue ?? defaultOrderValue}
            onValueChange={(value) =>
              onOrderChange?.(
                value === defaultOrderValue ? null : (value as TOrder),
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              {orderOptions?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          disabled={clearDisabled}
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

export default memo(DataFilterBar) as typeof DataFilterBar;
