import { memo, useCallback, useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import {
  AlertCircle,
  Boxes,
  Download,
  Loader2,
  Package,
  Printer,
  Warehouse,
} from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';
import { formatCount, formatDecimal } from '@repo/utils/number';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useInventoryItemsFilters } from '@/hooks/useInventoryItems/useInventoryItemsFilters';

import BulkQrLabelsDialog from './components/bulk-qr-labels-dialog';
import InventoryItemsEmpty from './components/inventory-items-empty';
import InventoryItemsFilterBar from './components/inventory-items-filter-bar';
import InventoryItemsSkeleton from './components/inventory-items-skeleton';
import InventoryItemsTable from './components/inventory-items-table';

import type {
  InventoryItemsDownloadFilters,
  InventoryItemsSummary,
} from '@/hooks/useInventoryItems/types';

interface InventorySummaryCardsProps {
  summary?: InventoryItemsSummary;
}

function formatQuantity(value: number) {
  return formatDecimal(value, { maxDecimals: 2, minDecimals: 0 });
}

function InventorySummaryCards({ summary }: InventorySummaryCardsProps) {
  const cards = [
    {
      label: 'Total Items',
      value: formatCount(summary?.totalItems ?? 0),
      icon: Package,
      iconClassName: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Total Boxes',
      value: formatQuantity(summary?.totalBoxes ?? 0),
      icon: Boxes,
      iconClassName: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Warehouses',
      value: formatCount(summary?.warehouses ?? 0),
      icon: Warehouse,
      iconClassName: 'bg-purple-100 text-purple-600',
    },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label} className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-md',
                  card.iconClassName,
                )}
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="text-muted-foreground block text-xs font-semibold">
                  {card.label}
                </span>
                <span className="text-foreground mt-0.5 block text-xl font-bold tracking-normal">
                  {card.value}
                </span>
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function InventoryItemsPage() {
  const [bulkQrDialogOpen, setBulkQrDialogOpen] = useState(false);

  const filters = useInventoryItemsFilters();
  const {
    downloadBulkQrLabelsMutation,
    exportInventoryItemsMutation,
    inventoryItemsQueryOptions,
  } = useInventoryItems();

  const { data, isError, isFetching, isLoading, refetch } = useQuery(
    inventoryItemsQueryOptions(filters.params),
  );

  const inventoryItems = data?.inventoryItems ?? [];
  const pagination = data?.pagination;
  const summary = data?.summary;
  const inventoryDownloadFilters = useMemo<InventoryItemsDownloadFilters>(
    () => ({
      search: filters.params.search,
      warehouseId: filters.params.warehouseId,
      brochureId: filters.params.brochureId,
      brochureTypeId: filters.params.brochureTypeId,
      stockLevel: filters.params.stockLevel,
      sortBy: filters.params.sortBy,
      order: filters.params.order,
    }),
    [
      filters.params.search,
      filters.params.warehouseId,
      filters.params.brochureId,
      filters.params.brochureTypeId,
      filters.params.stockLevel,
      filters.params.sortBy,
      filters.params.order,
    ],
  );

  const handleDownloadBulkQrLabels = useCallback(
    (payload: InventoryItemsDownloadFilters) => {
      downloadBulkQrLabelsMutation.mutate(payload, {
        onSuccess: () => setBulkQrDialogOpen(false),
      });
    },
    [downloadBulkQrLabelsMutation],
  );

  const handleExportInventoryItems = useCallback(() => {
    exportInventoryItemsMutation.mutate(inventoryDownloadFilters);
  }, [exportInventoryItemsMutation, inventoryDownloadFilters]);

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
            onClick={handleExportInventoryItems}
            disabled={exportInventoryItemsMutation.isPending}
          >
            {exportInventoryItemsMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setBulkQrDialogOpen(true)}
            disabled={downloadBulkQrLabelsMutation.isPending}
          >
            {downloadBulkQrLabelsMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Printer className="size-4" />
            )}
            Print Bulk QR
          </Button>
        </div>
      </div>

      <InventorySummaryCards summary={summary} />

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

      {bulkQrDialogOpen ? (
        <BulkQrLabelsDialog
          open={bulkQrDialogOpen}
          initialFilters={inventoryDownloadFilters}
          isDownloading={downloadBulkQrLabelsMutation.isPending}
          onOpenChange={setBulkQrDialogOpen}
          onDownload={handleDownloadBulkQrLabels}
        />
      ) : null}
    </div>
  );
}

export default memo(InventoryItemsPage);
