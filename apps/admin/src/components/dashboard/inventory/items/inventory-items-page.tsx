import { memo, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle, Loader2, RefreshCw } from '@repo/ui/lib/icons';
import { formatCount, formatDecimal } from '@repo/utils/number';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useInventoryItemsFilters } from '@/hooks/useInventoryItems/useInventoryItemsFilters';

import InventoryItemsEmpty from './components/inventory-items-empty';
import InventoryItemsFilterBar from './components/inventory-items-filter-bar';
import InventoryItemsSkeleton from './components/inventory-items-skeleton';
import InventoryItemsTable from './components/inventory-items-table';

import type { InventoryListItem } from '@/hooks/useInventoryItems/types';

interface InventorySummaryCardsProps {
  items: InventoryListItem[];
  matchingTotal: number;
}

function formatQuantity(value: number) {
  return formatDecimal(value, { maxDecimals: 2, minDecimals: 0 });
}

function InventorySummaryCards({
  items,
  matchingTotal,
}: InventorySummaryCardsProps) {
  const summary = useMemo(() => {
    const warehouseIds = new Set<string>();

    const totals = items.reduce(
      (acc, item) => {
        warehouseIds.add(item.warehouseId);

        return {
          boxes: acc.boxes + item.boxes,
          lowStock: acc.lowStock + (item.stockLevel === 'Low' ? 1 : 0),
        };
      },
      { boxes: 0, lowStock: 0 },
    );

    return { ...totals, warehouses: warehouseIds.size };
  }, [items]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="shadow-none">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Matching items</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">
            {formatCount(matchingTotal)}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Boxes on page</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">
            {formatQuantity(summary.boxes)}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Warehouses on page</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">
            {formatCount(summary.warehouses)}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">Low stock on page</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal">
            {formatCount(summary.lowStock)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryItemsPage() {
  const { inventoryItemsQueryOptions } = useInventoryItems();
  const filters = useInventoryItemsFilters();

  const { data, isError, isFetching, isLoading, refetch } = useQuery(
    inventoryItemsQueryOptions(filters.params),
  );

  const inventoryItems = data?.inventoryItems ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-semibold tracking-normal">
            Inventory
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Current stock by warehouse, brochure, image, and pack size.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh inventory"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <InventorySummaryCards
        items={inventoryItems}
        matchingTotal={pagination?.total ?? 0}
      />

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <InventoryItemsFilterBar filters={filters} />

          {isError ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
                <AlertCircle className="size-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-normal">
                Inventory could not be loaded
              </h2>
              <p className="text-muted-foreground mt-2 max-w-md text-sm">
                Refresh the list or try again after checking the API connection.
              </p>
              <Button
                type="button"
                className="mt-5"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <InventoryItemsSkeleton />
          ) : inventoryItems.length === 0 ? (
            <InventoryItemsEmpty
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
            />
          ) : (
            <div className="space-y-4">
              <InventoryItemsTable items={inventoryItems} />
              {pagination ? (
                <DataPaginationControls
                  pagination={pagination}
                  currentLimit={filters.limit}
                  onPageChange={filters.handlePageChange}
                  onLimitChange={filters.handleLimitChange}
                />
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(InventoryItemsPage);
