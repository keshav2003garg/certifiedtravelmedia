import { type FormEvent, memo, useCallback, useMemo, useState } from 'react';

import { Button } from '@repo/ui/components/base/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/base/dialog';
import { Input } from '@repo/ui/components/base/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/base/select';
import {
  Download,
  FileText,
  Loader2,
  Search,
  Tags,
  Warehouse,
} from '@repo/ui/lib/icons';

import SearchableSelect from '@/components/common/searchable-select';

import {
  DEFAULT_INVENTORY_ITEM_ORDER,
  DEFAULT_INVENTORY_ITEM_SORT_BY,
  INVENTORY_FILTER_ALL,
  INVENTORY_ITEM_ORDER_SELECT_OPTIONS,
  INVENTORY_ITEM_SORT_SELECT_OPTIONS,
  useInventoryItemsFilterOptions,
} from '@/hooks/useInventoryItems/useInventoryItemsFilterOptions';
import { INVENTORY_STOCK_LEVEL_OPTIONS } from '@/hooks/useInventoryItems/useInventoryItemsFilters';

import type {
  DownloadInventoryBulkQrLabelsRequest,
  InventoryItemSortBy,
  InventoryStockLevel,
  SortOrder,
} from '@/hooks/useInventoryItems/types';

type BulkQrLabelsFilters = DownloadInventoryBulkQrLabelsRequest['payload'];

interface LocalBulkQrLabelsFilters {
  search: string;
  warehouseId: string | null;
  brochureId: string | null;
  brochureTypeId: string | null;
  stockLevel: InventoryStockLevel | null;
  sortBy: InventoryItemSortBy | null;
  order: SortOrder | null;
}

interface BulkQrLabelsDialogProps {
  open: boolean;
  initialFilters: BulkQrLabelsFilters;
  isDownloading: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (payload: BulkQrLabelsFilters) => void;
}

function toLocalFilters(
  filters: BulkQrLabelsFilters,
): LocalBulkQrLabelsFilters {
  return {
    search: filters.search ?? '',
    warehouseId: filters.warehouseId ?? null,
    brochureId: filters.brochureId ?? null,
    brochureTypeId: filters.brochureTypeId ?? null,
    stockLevel: filters.stockLevel ?? null,
    sortBy: filters.sortBy ?? null,
    order: filters.order ?? null,
  };
}

function toDownloadPayload(
  filters: LocalBulkQrLabelsFilters,
): BulkQrLabelsFilters {
  return {
    search: filters.search.trim() || undefined,
    warehouseId: filters.warehouseId ?? undefined,
    brochureId: filters.brochureId ?? undefined,
    brochureTypeId: filters.brochureTypeId ?? undefined,
    stockLevel: filters.stockLevel ?? undefined,
    sortBy: filters.sortBy ?? undefined,
    order: filters.order ?? undefined,
  };
}

function BulkQrLabelsDialog({
  open,
  initialFilters,
  isDownloading,
  onOpenChange,
  onDownload,
}: BulkQrLabelsDialogProps) {
  const [filters, setFilters] = useState<LocalBulkQrLabelsFilters>(() =>
    toLocalFilters(initialFilters),
  );
  const {
    warehouseOptions,
    brochureOptions,
    brochureTypeOptions,
    setWarehouseSearch,
    setBrochureSearch,
    setBrochureTypeSearch,
    isSearchingWarehouses,
    isSearchingBrochures,
    isSearchingBrochureTypes,
  } = useInventoryItemsFilterOptions();

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
        filters.warehouseId ||
        filters.brochureId ||
        filters.brochureTypeId ||
        filters.stockLevel ||
        filters.sortBy ||
        filters.order,
      ),
    [filters],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isDownloading) return;
      onOpenChange(nextOpen);
    },
    [isDownloading, onOpenChange],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onDownload(toDownloadPayload(filters));
    },
    [filters, onDownload],
  );

  const clearFilters = useCallback(() => {
    setFilters(toLocalFilters({}));
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Download Bulk QR Labels</DialogTitle>
          <DialogDescription>
            Labels print 8 per sheet at 4 in x 2.5 in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search by customer or brochure name..."
              aria-label="Search by customer or brochure name"
              className="h-11 pl-9"
              disabled={isDownloading}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SearchableSelect
              options={warehouseOptions}
              value={filters.warehouseId ?? INVENTORY_FILTER_ALL}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  warehouseId: value === INVENTORY_FILTER_ALL ? null : value,
                }))
              }
              placeholder="All warehouses"
              searchPlaceholder="Search warehouses"
              emptyMessage="No warehouses found"
              isLoading={isSearchingWarehouses}
              disabled={isDownloading}
              icon={<Warehouse className="size-4 shrink-0" />}
              onSearchChange={setWarehouseSearch}
            />

            <SearchableSelect
              options={brochureOptions}
              value={filters.brochureId ?? INVENTORY_FILTER_ALL}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  brochureId: value === INVENTORY_FILTER_ALL ? null : value,
                }))
              }
              placeholder="All brochures"
              searchPlaceholder="Search brochures"
              emptyMessage="No brochures found"
              isLoading={isSearchingBrochures}
              disabled={isDownloading}
              icon={<FileText className="size-4 shrink-0" />}
              onSearchChange={setBrochureSearch}
            />

            <SearchableSelect
              options={brochureTypeOptions}
              value={filters.brochureTypeId ?? INVENTORY_FILTER_ALL}
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  brochureTypeId: value === INVENTORY_FILTER_ALL ? null : value,
                }))
              }
              placeholder="All brochure types"
              searchPlaceholder="Search brochure types"
              emptyMessage="No brochure types found"
              isLoading={isSearchingBrochureTypes}
              disabled={isDownloading}
              icon={<Tags className="size-4 shrink-0" />}
              onSearchChange={setBrochureTypeSearch}
            />

            <Select
              value={filters.stockLevel ?? INVENTORY_FILTER_ALL}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  stockLevel:
                    value === INVENTORY_FILTER_ALL
                      ? null
                      : (value as InventoryStockLevel),
                }))
              }
              disabled={isDownloading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="All stock levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={INVENTORY_FILTER_ALL}>
                  All stock levels
                </SelectItem>
                {INVENTORY_STOCK_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={filters.sortBy ?? DEFAULT_INVENTORY_ITEM_SORT_BY}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  sortBy:
                    value === DEFAULT_INVENTORY_ITEM_SORT_BY
                      ? null
                      : (value as InventoryItemSortBy),
                }))
              }
              disabled={isDownloading}
            >
              <SelectTrigger className="h-11" aria-label="Sort type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVENTORY_ITEM_SORT_SELECT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.order ?? DEFAULT_INVENTORY_ITEM_ORDER}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  order:
                    value === DEFAULT_INVENTORY_ITEM_ORDER
                      ? null
                      : (value as SortOrder),
                }))
              }
              disabled={isDownloading}
            >
              <SelectTrigger className="h-11" aria-label="Sort order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVENTORY_ITEM_ORDER_SELECT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={!hasActiveFilters || isDownloading}
              onClick={clearFilters}
            >
              Clear filters
            </Button>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isDownloading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Download QR Labels
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default memo(BulkQrLabelsDialog);
