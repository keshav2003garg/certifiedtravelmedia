import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle, LayoutGrid, Loader2 } from '@repo/ui/lib/icons';

import { useChartEditor } from '@/hooks/useChartEditor';
import { useChartEditorFilters } from '@/hooks/useChartEditor/useChartEditorFilters';

import { SectorChartsView } from './components/sector-charts-view';
import { ChartFilters } from './filters/chart-filters';
import { ChartListSkeleton } from './skeletons/chart-list-skeleton';

function ChartsPage() {
  const filters = useChartEditorFilters();
  const { sectorStandSizesQueryOptions } = useChartEditor();

  const queryOptions = useMemo(
    () => sectorStandSizesQueryOptions(filters.params),
    [sectorStandSizesQueryOptions, filters.params],
  );

  const { data, isError, isFetching, isLoading, refetch } =
    useQuery(queryOptions);

  const sectors = data?.sectors ?? [];

  if (isError) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-lg font-semibold tracking-normal">
            Charts could not be loaded
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
            Charts
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Manage monthly stand chart layouts by sector, pocket size, and
            location coverage.
          </p>
        </div>
      </div>

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <ChartFilters filters={filters} />

          {isLoading ? (
            <ChartListSkeleton />
          ) : sectors.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <LayoutGrid className="text-muted-foreground mb-3 size-10" />
              <h2 className="text-foreground text-base font-semibold tracking-normal">
                No chart sectors found
              </h2>
              <p className="text-muted-foreground mt-1 max-w-md text-sm">
                Adjust the search or selected period to find matching sector
                stand sizes.
              </p>
              {filters.hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={filters.clearFilters}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <SectorChartsView
              sectors={sectors}
              pagination={data?.pagination}
              month={filters.month}
              year={filters.year}
              currentLimit={filters.limit}
              onPageChange={filters.handlePageChange}
              onLimitChange={filters.handleLimitChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ChartsPage;
