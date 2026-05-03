import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle, Loader2, RefreshCw } from '@repo/ui/lib/icons';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useInventoryRequests } from '@/hooks/useInventoryRequests';
import { useInventoryRequestsFilters } from '@/hooks/useInventoryRequests/useInventoryRequestsFilters';
import { useUserRole } from '@/hooks/useUserRole';

import InventoryRequestsEmpty from './components/inventory-requests-empty';
import InventoryRequestsFilterBar from './components/inventory-requests-filter-bar';
import InventoryRequestsSkeleton from './components/inventory-requests-skeleton';
import InventoryRequestsStats from './components/inventory-requests-stats';
import InventoryRequestsTable from './components/inventory-requests-table';

import type { InventoryRequest } from '@/hooks/useInventoryRequests/types';

function ManagerOnlyAccessCard() {
  return (
    <Card className="shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="text-lg font-semibold tracking-normal">
          Managers and admins only
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          The request queue is reserved for managers and admins reviewing staff
          intake submissions.
        </p>
      </CardContent>
    </Card>
  );
}

function InventoryRequestsQueuePage() {
  const { role } = useUserRole();
  const isManagerOrAdmin = role === 'manager' || role === 'admin';

  const navigate = useNavigate();

  const { inventoryRequestsQueryOptions, inventoryRequestStatsQueryOptions } =
    useInventoryRequests();
  const filters = useInventoryRequestsFilters();

  const handleSelectRequest = useCallback(
    (request: InventoryRequest) => {
      void navigate({
        to: '/dashboard/inventory/request-queue/$id',
        params: { id: request.id },
      });
    },
    [navigate],
  );

  const {
    data: listData,
    isError: isListError,
    isFetching: isListFetching,
    isLoading: isListLoading,
    refetch: refetchList,
  } = useQuery({
    ...inventoryRequestsQueryOptions(filters.params),
    enabled: isManagerOrAdmin,
  });

  const {
    data: statsData,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useQuery({
    ...inventoryRequestStatsQueryOptions(),
    enabled: isManagerOrAdmin,
  });

  const requests = listData?.requests ?? [];
  const pagination = listData?.pagination;

  const handleRefresh = () => {
    void refetchList();
    void refetchStats();
  };

  if (!isManagerOrAdmin) {
    return <ManagerOnlyAccessCard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-foreground text-2xl font-semibold tracking-normal">
            Request Queue
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            All inventory intake requests submitted by staff for review.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isListFetching}
          aria-label="Refresh inventory requests"
        >
          {isListFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </div>

      <InventoryRequestsStats
        stats={statsData?.stats}
        isLoading={isStatsLoading}
      />

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <InventoryRequestsFilterBar filters={filters} />

          {isListError ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="text-lg font-semibold tracking-normal">
                Inventory requests could not be loaded
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md text-sm">
                Refresh the list or try again after checking the API connection.
              </p>
              <Button
                type="button"
                className="mt-5"
                onClick={() => refetchList()}
                disabled={isListFetching}
              >
                {isListFetching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Retry
              </Button>
            </div>
          ) : isListLoading ? (
            <InventoryRequestsSkeleton />
          ) : requests.length === 0 ? (
            <InventoryRequestsEmpty
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
            />
          ) : (
            <div className="space-y-4">
              <InventoryRequestsTable
                requests={requests}
                onSelect={handleSelectRequest}
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
    </div>
  );
}

export default InventoryRequestsQueuePage;
