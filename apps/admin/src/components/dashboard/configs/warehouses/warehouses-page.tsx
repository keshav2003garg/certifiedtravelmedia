import { useCallback, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import {
  AlertCircle,
  Download,
  Loader2,
  Plus,
  RefreshCw,
} from '@repo/ui/lib/icons';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useWarehouses } from '@/hooks/useWarehouses';
import { useWarehousesFilters } from '@/hooks/useWarehouses/useWarehousesFilters';

import FullTruckLoadDialog from './components/full-truck-load-dialog';
import RetireWarehouseDialog from './components/retire-warehouse-dialog';
import WarehouseFormDialog from './components/warehouse-form-dialog';
import WarehousesEmpty from './components/warehouses-empty';
import WarehousesFilterBar from './components/warehouses-filter-bar';
import WarehousesSkeleton from './components/warehouses-skeleton';
import WarehousesTable from './components/warehouses-table';

import type {
  DownloadFullTruckLoadRequest,
  Warehouse,
} from '@/hooks/useWarehouses/types';

function WarehousesPage() {
  const {
    downloadFullTruckLoadMutation,
    exportWarehousesMutation,
    retireMutation,
    warehousesQueryOptions,
  } = useWarehouses();
  const filters = useWarehousesFilters();
  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [retireTarget, setRetireTarget] = useState<Warehouse | null>(null);
  const [fullTruckLoadTarget, setFullTruckLoadTarget] =
    useState<Warehouse | null>(null);
  const [retiringId, setRetiringId] = useState<string | null>(null);

  const { data, isError, isFetching, isLoading, refetch } = useQuery(
    warehousesQueryOptions(filters.params),
  );

  const warehouses = data?.warehouses ?? [];
  const pagination = data?.pagination;

  const openCreateDialog = useCallback(() => {
    setEditingWarehouse(null);
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormOpen(true);
  }, []);

  const openRetireDialog = useCallback((warehouse: Warehouse) => {
    setRetireTarget(warehouse);
  }, []);

  const closeRetireDialog = useCallback((open: boolean) => {
    if (!open) {
      setRetireTarget(null);
    }
  }, []);

  const openFullTruckLoadDialog = useCallback((warehouse: Warehouse) => {
    setFullTruckLoadTarget(warehouse);
  }, []);

  const closeFullTruckLoadDialog = useCallback((open: boolean) => {
    if (!open) {
      setFullTruckLoadTarget(null);
    }
  }, []);

  const handleRetire = useCallback(() => {
    if (!retireTarget) return;

    setRetiringId(retireTarget.id);
    retireMutation.mutate(retireTarget.id, {
      onSuccess: () => setRetireTarget(null),
      onSettled: () => setRetiringId(null),
    });
  }, [retireMutation, retireTarget]);

  const handleExport = useCallback(() => {
    exportWarehousesMutation.mutate({
      includeInactive: filters.includeInactive || undefined,
    });
  }, [exportWarehousesMutation, filters.includeInactive]);

  const isExporting = exportWarehousesMutation.isPending;

  const handleDownloadFullTruckLoad = useCallback(
    (payload: DownloadFullTruckLoadRequest['payload']) => {
      downloadFullTruckLoadMutation.mutate(payload, {
        onSuccess: () => setFullTruckLoadTarget(null),
      });
    },
    [downloadFullTruckLoadMutation],
  );

  const downloadingFullTruckLoadId = downloadFullTruckLoadMutation.isPending
    ? (downloadFullTruckLoadMutation.variables?.id ?? null)
    : null;

  if (isError) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-normal">
            Warehouses could not be loaded
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Refresh the list or try again after checking the API connection.
          </p>
          <Button
            type="button"
            className="mt-5"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="size-4 animate-spin" /> : null}
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-semibold tracking-normal">
            Warehouses
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Maintain warehouse addresses, active status, sectors, and Acumatica
            identifiers used across inventory operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh warehouses"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export
          </Button>
          <Button type="button" onClick={openCreateDialog}>
            <Plus className="size-4" />
            New warehouse
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <WarehousesFilterBar filters={filters} />

          {isLoading ? (
            <WarehousesSkeleton />
          ) : warehouses.length === 0 ? (
            <WarehousesEmpty
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
              onCreate={openCreateDialog}
            />
          ) : (
            <div className="space-y-4">
              <WarehousesTable
                warehouses={warehouses}
                retiringId={retiringId}
                downloadingFullTruckLoadId={downloadingFullTruckLoadId}
                onEdit={openEditDialog}
                onRetire={openRetireDialog}
                onDownloadFullTruckLoad={openFullTruckLoadDialog}
              />
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

      <WarehouseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        warehouse={editingWarehouse}
      />
      <RetireWarehouseDialog
        open={Boolean(retireTarget)}
        warehouse={retireTarget}
        isRetiring={retireMutation.isPending}
        onOpenChange={closeRetireDialog}
        onConfirm={handleRetire}
      />
      <FullTruckLoadDialog
        open={Boolean(fullTruckLoadTarget)}
        warehouse={fullTruckLoadTarget}
        isDownloading={downloadFullTruckLoadMutation.isPending}
        onOpenChange={closeFullTruckLoadDialog}
        onDownload={handleDownloadFullTruckLoad}
      />
    </div>
  );
}

export default WarehousesPage;
