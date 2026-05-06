import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle, Grid2X2, List, Loader2 } from '@repo/ui/lib/icons';
import { cn } from '@repo/ui/lib/utils';

import DataPaginationControls from '@/components/common/data-pagination-controls';

import { useLocations } from '@/hooks/useLocations';
import { useLocationsFilters } from '@/hooks/useLocations/useLocationsFilters';

import LocationsEmpty from './components/locations-empty';
import LocationsFilterBar from './components/locations-filter-bar';
import LocationsSectorList from './components/locations-sector-list';
import LocationsSkeleton from './components/locations-skeleton';
import LocationsStats from './components/locations-stats';
import LocationsTable from './components/locations-table';

function LocationsPage() {
  const {
    locationsBySectorQueryOptions,
    locationsQueryOptions,
    statsQueryOptions,
  } = useLocations();
  const filters = useLocationsFilters();
  const view = filters.view;

  const sectorParams = useMemo(
    () => ({
      search: filters.search || undefined,
      sectorId: filters.sectorId || undefined,
      width: filters.width ?? undefined,
      height: filters.height ?? undefined,
      isDefaultPockets: filters.isDefaultPockets ?? undefined,
      page: filters.page,
      limit: filters.limit,
      sortBy: 'acumaticaId' as const,
      order: 'asc' as const,
    }),
    [
      filters.search,
      filters.sectorId,
      filters.width,
      filters.height,
      filters.isDefaultPockets,
      filters.page,
      filters.limit,
    ],
  );

  const locationsQuery = useQuery({
    ...locationsQueryOptions(filters.params),
    enabled: view === 'list',
  });
  const sectorsQuery = useQuery({
    ...locationsBySectorQueryOptions(sectorParams),
    enabled: view === 'sector',
  });
  const statsQuery = useQuery(statsQueryOptions());

  const locations = locationsQuery.data?.locations ?? [];
  const sectors = sectorsQuery.data?.sectors ?? [];
  const activePagination =
    view === 'list'
      ? locationsQuery.data?.pagination
      : sectorsQuery.data?.pagination;
  const activeQuery = view === 'list' ? locationsQuery : sectorsQuery;

  if (activeQuery.isError) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-normal">
            Locations could not be loaded
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Refresh the list or try again after checking the API connection.
          </p>
          <Button
            type="button"
            className="mt-5"
            onClick={() => activeQuery.refetch()}
            disabled={activeQuery.isFetching}
          >
            {activeQuery.isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
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
            Locations
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            View and manage all brochure stand locations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-muted inline-flex h-10 items-center rounded-md p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 gap-1.5 px-3',
                view === 'list' &&
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm',
              )}
              onClick={() => filters.handleViewChange('list')}
            >
              <List className="size-4" />
              List
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 gap-1.5 px-3',
                view === 'sector' &&
                  'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-sm',
              )}
              onClick={() => filters.handleViewChange('sector')}
            >
              <Grid2X2 className="size-4" />
              By Sector
            </Button>
          </div>
        </div>
      </div>

      <LocationsStats
        stats={statsQuery.data?.stats}
        isLoading={statsQuery.isLoading}
      />

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <LocationsFilterBar filters={filters} />

          {activeQuery.isLoading ? (
            <LocationsSkeleton
              variant={view === 'sector' ? 'sector' : 'list'}
            />
          ) : view === 'sector' && sectors.length === 0 ? (
            <LocationsEmpty
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
            />
          ) : view === 'list' && locations.length === 0 ? (
            <LocationsEmpty
              hasFilters={filters.hasActiveFilters}
              onClearFilters={filters.clearFilters}
            />
          ) : (
            <div className="space-y-4">
              {view === 'sector' ? (
                <LocationsSectorList sectors={sectors} />
              ) : (
                <LocationsTable locations={locations} />
              )}

              {activePagination ? (
                <DataPaginationControls
                  pagination={activePagination}
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

export default LocationsPage;
