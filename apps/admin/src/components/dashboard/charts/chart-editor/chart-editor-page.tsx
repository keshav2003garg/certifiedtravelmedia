import { useCallback, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { Button } from '@repo/ui/components/base/button';
import { Card, CardContent } from '@repo/ui/components/base/card';
import { AlertCircle, ArrowLeft, Loader2 } from '@repo/ui/lib/icons';

import { useChartEditor } from '@/hooks/useChartEditor';

import { ChartEditor } from './chart-editor';
import { ChartEditorSkeleton } from './chart-editor-skeleton';

import type { ChartTile } from '@/hooks/useChartEditor/types';

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
  const {
    sectorChartQueryOptions,
    saveChartMutation,
    completeChartMutation,
    cloneChartMutation,
    initializeSectorChartMutation,
    openSectorChartsPdfMutation,
  } = useChartEditor();

  const chartQueryOptions = useMemo(
    () => sectorChartQueryOptions({ sectorId, width, height, month, year }),
    [sectorChartQueryOptions, sectorId, width, height, month, year],
  );

  const { data, isError, isFetching, isLoading, refetch } =
    useQuery(chartQueryOptions);
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

  if (width < 1 || height < 1) {
    return (
      <ChartEditorError
        title="Chart dimensions are missing"
        message="Return to the charts list and open a stand size with a valid width and height."
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
      />
    );
  }

  return (
    <div className={isFullscreen ? 'h-full min-h-0' : 'space-y-5'}>
      {showBackButton ? (
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to="/dashboard/charts">
            <ArrowLeft className="size-4" />
            Back to charts
          </Link>
        </Button>
      ) : null}

      {isLoading || !chart ? (
        <ChartEditorSkeleton />
      ) : (
        <ChartEditor
          chart={chart}
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
        />
      )}
    </div>
  );
}

interface ChartEditorErrorProps {
  title: string;
  message: string;
  isRetrying?: boolean;
  onRetry?: () => void;
}

function ChartEditorError({
  title,
  message,
  isRetrying = false,
  onRetry,
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
          <Button type="button" variant="outline" asChild>
            <Link to="/dashboard/charts">Back to charts</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChartEditorPage;
