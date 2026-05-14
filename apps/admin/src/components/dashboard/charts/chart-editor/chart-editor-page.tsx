import { useCallback, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle, ArrowLeft, Loader2 } from '@repo/ui/lib/icons';

import { useChartEditor } from '@/hooks/useChartEditor';
import { useChartAvailableInventoryFilters } from '@/hooks/useChartEditor/useChartAvailableInventoryFilters';

import { ChartEditor } from './chart-editor';
import { ChartEditorSkeleton } from './chart-editor-skeleton';

import type {
  ChartInventoryItem,
  ChartTile,
  Pagination,
} from '@/hooks/useChartEditor/types';

interface ChartEditorPageProps {
  sectorId: string;
  width: number;
  height: number;
  month: number;
  year: number;
  isManager: boolean;
  isFullscreen?: boolean;
  showBackButton?: boolean;
  onMonthChange: (month: number, year: number) => void;
}

function ChartEditorPage({
  sectorId,
  width,
  height,
  month,
  year,
  isManager,
  isFullscreen = false,
  showBackButton = true,
  onMonthChange,
}: ChartEditorPageProps) {
  const router = useRouter();
  const {
    sectorChartQueryOptions,
    sectorInventoryQueryOptions,
    saveChartMutation,
    completeChartMutation,
    cloneChartMutation,
    initializeSectorChartMutation,
    openSectorChartsPdfMutation,
  } = useChartEditor();
  const availableInventoryFilters = useChartAvailableInventoryFilters();

  const chartQueryOptions = useMemo(
    () => sectorChartQueryOptions({ sectorId, width, height, month, year }),
    [sectorChartQueryOptions, sectorId, width, height, month, year],
  );
  const inventoryQueryOptions = useMemo(
    () =>
      sectorInventoryQueryOptions({
        sectorId,
        ...availableInventoryFilters.params,
      }),
    [sectorInventoryQueryOptions, sectorId, availableInventoryFilters.params],
  );

  const { data, isError, isFetching, isLoading, refetch } =
    useQuery(chartQueryOptions);
  const { data: inventoryData, isFetching: isAvailableInventoryFetching } =
    useQuery(inventoryQueryOptions);
  const chart = data?.chart;
  const chartId = chart?.id ?? null;

  const handleSave = useCallback(
    (tiles: ChartTile[], generalNotes: string | null) => {
      if (!chartId) return;

      saveChartMutation.mutate(
        { id: chartId, tiles, generalNotes },
        { onSuccess: () => refetch() },
      );
    },
    [chartId, saveChartMutation, refetch],
  );

  const handleInitialize = useCallback(() => {
    initializeSectorChartMutation.mutate(
      { sectorId, width, height, month, year },
      { onSuccess: () => refetch() },
    );
  }, [
    initializeSectorChartMutation,
    sectorId,
    width,
    height,
    month,
    year,
    refetch,
  ]);

  const handleComplete = useCallback(() => {
    if (!chartId) return;

    completeChartMutation.mutate(
      { id: chartId },
      { onSuccess: () => refetch() },
    );
  }, [chartId, completeChartMutation, refetch]);

  const handleClone = useCallback(() => {
    if (!chartId) return;

    cloneChartMutation.mutate(
      { id: chartId },
      {
        onSuccess: (result) => {
          onMonthChange(result.chart.month, result.chart.year);
        },
      },
    );
  }, [chartId, cloneChartMutation, onMonthChange]);

  const handlePrint = useCallback(() => {
    openSectorChartsPdfMutation.mutate({
      sectorId,
      width,
      height,
      month,
      year,
    });
  }, [height, month, openSectorChartsPdfMutation, sectorId, width, year]);

  const goBackToCharts = useCallback(() => {
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    void router.navigate({ to: '/dashboard/charts' });
  }, [router]);

  if (width < 1 || height < 1) {
    return (
      <ChartEditorError
        title="Chart dimensions are missing"
        message="Return to the charts list and open a stand size with a valid width and height."
        onBack={goBackToCharts}
      />
    );
  }

  if (isError) {
    return (
      <ChartEditorError
        title="Chart could not be loaded"
        message="Refresh the chart or return to the list after checking the API connection."
        isRetrying={isFetching}
        onRetry={() => refetch()}
        onBack={goBackToCharts}
      />
    );
  }

  return (
    <div className={isFullscreen ? 'h-full min-h-0' : 'space-y-5'}>
      {showBackButton ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goBackToCharts}
        >
          <ArrowLeft className="size-4" />
          Back to charts
        </Button>
      ) : null}

      {isLoading || !chart ? (
        <ChartEditorSkeleton />
      ) : (
        <>
          <ChartEditor
            chart={chart}
            availableInventory={
              inventoryData?.inventory ?? chart.availableInventory
            }
            availableInventoryPagination={
              inventoryData?.pagination ??
              getInventoryPaginationFallback(
                chart.availableInventory,
                availableInventoryFilters.page,
                availableInventoryFilters.limit,
              )
            }
            availableInventorySearchValue={
              availableInventoryFilters.searchInputValue
            }
            isAvailableInventoryFetching={isAvailableInventoryFetching}
            isFullscreen={isFullscreen}
            isManager={isManager}
            isSaving={saveChartMutation.isPending}
            isCompleting={completeChartMutation.isPending}
            isCloning={cloneChartMutation.isPending}
            isInitializing={initializeSectorChartMutation.isPending}
            isPrinting={openSectorChartsPdfMutation.isPending}
            onSave={handleSave}
            onComplete={handleComplete}
            onClone={handleClone}
            onInitialize={handleInitialize}
            onPrint={handlePrint}
            onMonthChange={onMonthChange}
            onAvailableInventorySearchChange={
              availableInventoryFilters.setSearch
            }
            onAvailableInventoryNextPage={
              availableInventoryFilters.goToNextPage
            }
            onAvailableInventoryPreviousPage={
              availableInventoryFilters.goToPreviousPage
            }
          />
        </>
      )}
    </div>
  );
}

function getInventoryPaginationFallback(
  items: ChartInventoryItem[],
  page: number,
  limit: number,
): Pagination {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

interface ChartEditorErrorProps {
  title: string;
  message: string;
  isRetrying?: boolean;
  onRetry?: () => void;
  onBack: () => void;
}

function ChartEditorError({
  title,
  message,
  isRetrying = false,
  onRetry,
  onBack,
}: ChartEditorErrorProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-md">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="text-lg font-semibold tracking-normal">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">{message}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {onRetry ? (
            <Button type="button" onClick={onRetry} disabled={isRetrying}>
              {isRetrying ? <Loader2 className="size-4 animate-spin" /> : null}
              Retry
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onBack}>
            Back to charts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChartEditorPage;
