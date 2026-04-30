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

import type { BrochureSortBy, SortOrder } from '@/hooks/useBrochures/types';
import type { useBrochuresFilters } from '@/hooks/useBrochures/useBrochuresFilters';

type BrochureFilters = ReturnType<typeof useBrochuresFilters>;

interface BrochureFilterBarProps {
  filters: BrochureFilters;
}

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'brochureTypeName', label: 'Type' },
  { value: 'customerName', label: 'Customer' },
  { value: 'createdAt', label: 'Created date' },
  { value: 'updatedAt', label: 'Updated date' },
] as const;

const sortLabels: Record<BrochureSortBy, string> = {
  name: 'Name',
  brochureTypeName: 'Type',
  customerName: 'Customer',
  createdAt: 'Created date',
  updatedAt: 'Updated date',
};

const orderOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] as const;

const orderLabels: Record<SortOrder, string> = {
  asc: 'Ascending',
  desc: 'Descending',
};

const assetFilterLabels = {
  all: 'All assets',
  with: 'Has images',
  without: 'No images',
} as const;

const packSizeFilterLabels = {
  all: 'All pack sizes',
  with: 'Has pack sizes',
  without: 'No pack sizes',
} as const;

function toAssetFilterValue(value: boolean | null) {
  if (value === true) return 'with';
  if (value === false) return 'without';
  return 'all';
}

function toBooleanFilterValue(value: string) {
  if (value === 'with') return true;
  if (value === 'without') return false;
  return null;
}

function BrochureFilterBar({ filters }: BrochureFilterBarProps) {
  const {
    search,
    searchInputValue,
    sortBy,
    order,
    hasImages,
    hasPackSizes,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleHasImagesChange,
    handleHasPackSizesChange,
    clearFilters,
    hasActiveFilters,
  } = filters;

  const imageFilterValue = toAssetFilterValue(hasImages);
  const packSizeFilterValue = toAssetFilterValue(hasPackSizes);

  const activeFilters = useMemo(() => {
    const items: { label: string; onClear: () => void }[] = [];

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

    if (hasImages !== null) {
      items.push({
        label: assetFilterLabels[imageFilterValue],
        onClear: () => handleHasImagesChange(null),
      });
    }

    if (hasPackSizes !== null) {
      items.push({
        label: packSizeFilterLabels[packSizeFilterValue],
        onClear: () => handleHasPackSizesChange(null),
      });
    }

    return items;
  }, [
    search,
    sortBy,
    order,
    hasImages,
    hasPackSizes,
    imageFilterValue,
    packSizeFilterValue,
    setSearch,
    handleSortByChange,
    handleOrderChange,
    handleHasImagesChange,
    handleHasPackSizesChange,
  ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[1fr_170px_150px_170px_190px_auto]">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={searchInputValue}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search brochures, types, or customers"
            className="pl-9"
          />
        </div>

        <Select
          value={sortBy ?? 'name'}
          onValueChange={(value) =>
            handleSortByChange(
              value === 'name' ? null : (value as BrochureSortBy),
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={order ?? 'asc'}
          onValueChange={(value) =>
            handleOrderChange(value === 'asc' ? null : (value as SortOrder))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            {orderOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={imageFilterValue}
          onValueChange={(value) =>
            handleHasImagesChange(toBooleanFilterValue(value))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Images" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(assetFilterLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={packSizeFilterValue}
          onValueChange={(value) =>
            handleHasPackSizesChange(toBooleanFilterValue(value))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Pack sizes" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(packSizeFilterLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
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

export default memo(BrochureFilterBar);
